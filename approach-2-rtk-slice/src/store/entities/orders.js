import { createEntityModule } from '../createEntityModule';

const ordersModule = createEntityModule({
  name: 'orders',
  endpoint: 'orders',
  operations: {
    fetch: {
      method: 'get',
      buildUrl: (api, userId) => `${api}/orders?userId=${userId}`,
    },
    create: {
      method: 'post',
    },
  },
});

export const { reducer, actions, saga } = ordersModule;
export const { selectItems, selectLoading, selectError } = ordersModule;
export const {
  fetchRequest,
  fetchSuccess,
  fetchFailure,
  createRequest,
  createSuccess,
  createFailure,
} = actions;
