import {
  FETCH_ORDERS_REQUEST,
  FETCH_ORDERS_SUCCESS,
  FETCH_ORDERS_FAILURE,
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  CREATE_ORDER_FAILURE,
} from '../actionTypes';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const ordersReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ORDERS_REQUEST:
    case CREATE_ORDER_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_ORDERS_SUCCESS:
      return { ...state, loading: false, items: action.payload };
    case CREATE_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        items: [...state.items, action.payload],
      };
    case FETCH_ORDERS_FAILURE:
    case CREATE_ORDER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default ordersReducer;
