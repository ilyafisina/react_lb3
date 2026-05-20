import { createSlice } from '@reduxjs/toolkit';
import { takeLatest, call, select, all } from 'redux-saga/effects';

const STORAGE_KEY = 'cart';

function loadCartFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCartFromStorage(),
  },
  reducers: {
    addToCart: (state, action) => {
      const existing = state.items.find(
        (item) => item.product.id === action.payload.id
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ product: action.payload, quantity: 1 });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) => item.product.id !== action.payload
      );
    },
    updateQuantity: (state, action) => {
      const item = state.items.find(
        (i) => i.product.id === action.payload.productId
      );
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;
export const reducer = cartSlice.reducer;
export const actions = cartSlice.actions;

export const selectItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartTotal = (state) =>
  state.cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

function* persistCart() {
  const items = yield select(selectItems);
  yield call([localStorage, 'setItem'], STORAGE_KEY, JSON.stringify(items));
}

export function* saga() {
  yield all([
    takeLatest(addToCart.type, persistCart),
    takeLatest(removeFromCart.type, persistCart),
    takeLatest(updateQuantity.type, persistCart),
    takeLatest(clearCart.type, persistCart),
  ]);
}
