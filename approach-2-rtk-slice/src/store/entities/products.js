import { createEntityModule } from '../createEntityModule';

const productsModule = createEntityModule({
  name: 'products',
  endpoint: 'products',
  operations: {
    fetch: { method: 'get' },
  },
});

export const { reducer, actions, saga } = productsModule;
export const { selectItems, selectLoading, selectError } = productsModule;
export const { fetchRequest, fetchSuccess, fetchFailure } = actions;
