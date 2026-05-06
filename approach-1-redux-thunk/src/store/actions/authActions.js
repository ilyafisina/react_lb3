import axios from 'axios';
import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  LOGOUT,
} from '../actionTypes';

const API_URL = 'http://localhost:3001';

export const login = (email, password) => async (dispatch) => {
  dispatch({ type: LOGIN_REQUEST });
  try {
    const response = await axios.get(`${API_URL}/users`, {
      params: { email, password },
    });
    if (response.data.length > 0) {
      const user = response.data[0];
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: LOGIN_SUCCESS, payload: user });
    } else {
      dispatch({ type: LOGIN_FAILURE, payload: 'Неверный email или пароль' });
    }
  } catch (error) {
    dispatch({ type: LOGIN_FAILURE, payload: error.message });
  }
};

export const register = (name, email, password) => async (dispatch) => {
  dispatch({ type: REGISTER_REQUEST });
  try {
    const existing = await axios.get(`${API_URL}/users`, {
      params: { email },
    });
    if (existing.data.length > 0) {
      dispatch({ type: REGISTER_FAILURE, payload: 'Пользователь с таким email уже существует' });
      return;
    }
    const response = await axios.post(`${API_URL}/users`, {
      name,
      email,
      password,
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    dispatch({ type: REGISTER_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: REGISTER_FAILURE, payload: error.message });
  }
};

export const logout = () => {
  localStorage.removeItem('user');
  return { type: LOGOUT };
};
