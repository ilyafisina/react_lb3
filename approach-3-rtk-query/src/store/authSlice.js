import { createSlice } from '@reduxjs/toolkit';

const savedUser = localStorage.getItem('user');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.error = null;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.error = null;
      localStorage.removeItem('user');
    },
  },
});

export const { setUser, setAuthError, logout } = authSlice.actions;
export default authSlice.reducer;
