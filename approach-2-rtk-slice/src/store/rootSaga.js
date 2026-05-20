import { all, fork } from 'redux-saga/effects';
import { saga as productsSaga } from './entities/products';
import { saga as cartSaga } from './entities/cart';
import { saga as authSaga } from './entities/auth';
import { saga as ordersSaga } from './entities/orders';
import { saga as favoritesSaga } from './entities/favorites';

export default function* rootSaga() {
  yield all([
    fork(productsSaga),
    fork(cartSaga),
    fork(authSaga),
    fork(ordersSaga),
    fork(favoritesSaga),
  ]);
}
