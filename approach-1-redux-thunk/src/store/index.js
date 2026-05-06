import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import productsReducer from './reducers/productsReducer';
import cartReducer from './reducers/cartReducer';
import authReducer from './reducers/authReducer';
import ordersReducer from './reducers/ordersReducer';

const rootReducer = combineReducers({
  products: productsReducer,
  cart: cartReducer,
  auth: authReducer,
  orders: ordersReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
