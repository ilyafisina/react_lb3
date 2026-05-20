import { takeLatest, put, call, all } from 'redux-saga/effects';
import { createEntityModule } from '../createEntityModule';

const savedUser = localStorage.getItem('user');

const authModule = createEntityModule({
  name: 'auth',
  endpoint: 'users',
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
  },
  operations: {
    login: {
      method: 'get',
      buildUrl: (api, { email, password }) =>
        `${api}/users?email=${email}&password=${password}`,
      transformResponse: (data) => {
        if (data.length > 0) return data[0];
        throw new Error('Неверный email или пароль');
      },
      onSuccess: (state, action) => {
        state.loading = false;
        state.user = action.payload;
      },
    },
    register: {
      method: 'post',
      onSuccess: (state, action) => {
        state.loading = false;
        state.user = action.payload;
      },
    },
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { reducer, actions, slice } = authModule;

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
  logout,
  clearError,
} = actions;

export const selectUser = (state) => state.auth.user;
export const selectLoading = (state) => state.auth.loading;
export const selectError = (state) => state.auth.error;

function* onLoginSuccess(action) {
  yield call(
    [localStorage, 'setItem'],
    'user',
    JSON.stringify(action.payload)
  );
}

function* onRegisterSuccess(action) {
  yield call(
    [localStorage, 'setItem'],
    'user',
    JSON.stringify(action.payload)
  );
}

function* onLogout() {
  yield call([localStorage, 'removeItem'], 'user');
}

function* authSideEffectsSaga() {
  yield all([
    takeLatest(loginSuccess.type, onLoginSuccess),
    takeLatest(registerSuccess.type, onRegisterSuccess),
    takeLatest(logout.type, onLogout),
  ]);
}

export function* saga() {
  yield all([authModule.saga(), authSideEffectsSaga()]);
}
