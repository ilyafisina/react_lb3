import { createSlice } from '@reduxjs/toolkit';
import { call, put, takeLatest, all } from 'redux-saga/effects';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

/**
 * Функция высшего порядка для генерации Redux Toolkit slice и redux-saga
 * для произвольной серверной сущности.
 *
 * Принимает декларативную конфигурацию и автоматически создаёт:
 * - Slice с reducers для каждой операции (request / success / failure)
 * - Saga-воркеры и вотчеры для каждой операции
 * - Типизированные селекторы
 *
 * @param {Object} config
 * @param {string}   config.name        — имя сущности (используется как имя slice)
 * @param {string}   config.endpoint    — базовый REST-эндпоинт (e.g. 'products')
 * @param {Object}  [config.initialState] — дополнительные поля начального состояния
 * @param {Object}  [config.operations]   — карта операций { fetch, create, remove, ... }
 * @param {Object}  [config.reducers]     — дополнительные синхронные reducers
 *
 * Каждая операция (operations[key]) может содержать:
 *   method           — HTTP-метод ('get' | 'post' | 'put' | 'delete'), по умолчанию 'get'
 *   endpoint         — переопределение endpoint для конкретной операции
 *   buildUrl(api, payload) — кастомный URL из payload
 *   transformPayload(payload) — преобразование payload перед отправкой
 *   transformResponse(data, payload) — преобразование ответа сервера
 *   onSuccess(state, action) — кастомный success-reducer
 *
 * @returns {{
 *   slice:        ReturnType<typeof createSlice>,
 *   reducer:      Function,
 *   actions:      Object,
 *   saga:         GeneratorFunction,
 *   selectItems:  Function,
 *   selectLoading: Function,
 *   selectError:  Function,
 * }}
 */
export function createEntityModule(config) {
  const {
    name,
    endpoint,
    initialState = {},
    operations = {},
    reducers = {},
  } = config;

  const generatedReducers = {};
  const sagaConfigs = [];

  Object.entries(operations).forEach(([opName, opConfig]) => {
    const requestKey = `${opName}Request`;
    const successKey = `${opName}Success`;
    const failureKey = `${opName}Failure`;

    generatedReducers[requestKey] = (state) => {
      state.loading = true;
      state.error = null;
    };

    generatedReducers[failureKey] = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    if (opConfig.onSuccess) {
      generatedReducers[successKey] = opConfig.onSuccess;
    } else if (opName === 'fetch' || opConfig.type === 'fetch') {
      generatedReducers[successKey] = (state, action) => {
        state.loading = false;
        state.items = action.payload;
      };
    } else if (opName === 'create' || opConfig.type === 'create') {
      generatedReducers[successKey] = (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      };
    } else if (opName === 'remove' || opConfig.type === 'remove') {
      generatedReducers[successKey] = (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      };
    } else if (opName === 'update' || opConfig.type === 'update') {
      generatedReducers[successKey] = (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      };
    } else {
      generatedReducers[successKey] = (state) => {
        state.loading = false;
      };
    }

    sagaConfigs.push({
      requestKey,
      successKey,
      failureKey,
      method: (opConfig.method || 'get').toLowerCase(),
      opEndpoint: opConfig.endpoint || endpoint,
      buildUrl: opConfig.buildUrl,
      transformPayload: opConfig.transformPayload,
      transformResponse: opConfig.transformResponse,
    });
  });

  const slice = createSlice({
    name,
    initialState: {
      items: [],
      loading: false,
      error: null,
      ...initialState,
    },
    reducers: {
      ...generatedReducers,
      ...reducers,
    },
  });

  function createWorkerSaga(cfg) {
    return function* worker(action) {
      try {
        let url = `${API_URL}/${cfg.opEndpoint}`;
        if (cfg.buildUrl) {
          url = cfg.buildUrl(API_URL, action.payload);
        }

        let response;
        const method = cfg.method;

        if (method === 'get') {
          const params = !cfg.buildUrl && action.payload ? { params: action.payload } : {};
          response = yield call(axios.get, url, params);
        } else if (method === 'post') {
          const body = cfg.transformPayload
            ? cfg.transformPayload(action.payload)
            : action.payload;
          response = yield call(axios.post, url, body);
        } else if (method === 'put') {
          const body = cfg.transformPayload
            ? cfg.transformPayload(action.payload)
            : action.payload;
          response = yield call(axios.put, url, body);
        } else if (method === 'delete') {
          response = yield call(axios.delete, url);
        }

        const data = cfg.transformResponse
          ? cfg.transformResponse(response.data, action.payload)
          : response.data;

        yield put(slice.actions[cfg.successKey](data));
      } catch (error) {
        const message =
          error.response?.data?.message || error.message || 'Произошла ошибка';
        yield put(slice.actions[cfg.failureKey](message));
      }
    };
  }

  function* entitySaga() {
    const watchers = sagaConfigs.map((cfg) =>
      takeLatest(slice.actions[cfg.requestKey].type, createWorkerSaga(cfg))
    );
    yield all(watchers);
  }

  const selectItems = (state) => state[name].items;
  const selectLoading = (state) => state[name].loading;
  const selectError = (state) => state[name].error;

  return {
    slice,
    reducer: slice.reducer,
    actions: slice.actions,
    saga: entitySaga,
    selectItems,
    selectLoading,
    selectError,
  };
}
