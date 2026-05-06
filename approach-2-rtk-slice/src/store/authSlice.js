import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const savedUser = localStorage.getItem('user');

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    const response = await axios.get(`${API_URL}/users`, {
      params: { email, password },
    });
    if (response.data.length > 0) {
      const user = response.data[0];
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    return rejectWithValue('Неверный email или пароль');
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    const existing = await axios.get(`${API_URL}/users`, {
      params: { email },
    });
    if (existing.data.length > 0) {
      return rejectWithValue('Пользователь с таким email уже существует');
    }
    const response = await axios.post(`${API_URL}/users`, {
      name,
      email,
      password,
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
