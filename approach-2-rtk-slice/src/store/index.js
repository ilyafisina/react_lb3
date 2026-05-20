import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { reducer as productsReducer } from './entities/products';
import { reducer as cartReducer } from './entities/cart';
import { reducer as authReducer } from './entities/auth';
import { reducer as ordersReducer } from './entities/orders';
import { reducer as favoritesReducer } from './entities/favorites';
import rootSaga from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    products: productsReducer,
    cart: cartReducer,
    auth: authReducer,
    orders: ordersReducer,
    favorites: favoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);
