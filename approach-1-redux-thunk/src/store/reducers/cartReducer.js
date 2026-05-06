import { ADD_TO_CART, REMOVE_FROM_CART, UPDATE_QUANTITY, CLEAR_CART } from '../actionTypes';

const initialState = {
  items: [],
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === action.payload.id
      );
      if (existingIndex >= 0) {
        const updatedItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return { ...state, items: updatedItems };
      }
      return {
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
      };
    }
    case REMOVE_FROM_CART:
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload),
      };
    case UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case CLEAR_CART:
      return { ...state, items: [] };
    default:
      return state;
  }
};

export default cartReducer;
