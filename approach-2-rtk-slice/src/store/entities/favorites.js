import { takeLatest, call, put, select, all } from 'redux-saga/effects';
import axios from 'axios';
import { createEntityModule } from '../createEntityModule';

const API_URL = 'http://localhost:3001';

const favoritesModule = createEntityModule({
  name: 'favorites',
  endpoint: 'favorites',
  operations: {
    fetch: {
      method: 'get',
      buildUrl: (api, userId) => `${api}/favorites?userId=${userId}`,
    },
    add: {
      method: 'post',
      type: 'create',
    },
    remove: {
      method: 'delete',
      type: 'remove',
    },
  },
  reducers: {
    toggleRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
  },
});

export const { reducer, actions, slice } = favoritesModule;

export const {
  fetchRequest,
  fetchSuccess,
  fetchFailure,
  addRequest,
  addSuccess,
  addFailure,
  removeRequest,
  removeSuccess,
  removeFailure,
  toggleRequest,
} = actions;

export const selectItems = (state) => state.favorites.items;
export const selectLoading = (state) => state.favorites.loading;
export const selectError = (state) => state.favorites.error;
export const selectIsFavorite = (productId) => (state) =>
  state.favorites.items.some((fav) => fav.productId === productId);

function* toggleFavoriteSaga(action) {
  const { userId, productId } = action.payload;
  const items = yield select(selectItems);
  const existing = items.find(
    (fav) => fav.userId === userId && fav.productId === productId
  );

  try {
    if (existing) {
      yield call(axios.delete, `${API_URL}/favorites/${existing.id}`);
      yield put(removeSuccess(existing.id));
    } else {
      const response = yield call(axios.post, `${API_URL}/favorites`, {
        userId,
        productId,
      });
      yield put(addSuccess(response.data));
    }
  } catch (error) {
    yield put(addFailure(error.message));
  }
}

export function* saga() {
  yield all([favoritesModule.saga(), takeLatest(toggleRequest.type, toggleFavoriteSaga)]);
}
