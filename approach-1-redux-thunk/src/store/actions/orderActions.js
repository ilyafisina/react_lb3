import axios from 'axios';
import {
  FETCH_ORDERS_REQUEST,
  FETCH_ORDERS_SUCCESS,
  FETCH_ORDERS_FAILURE,
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  CREATE_ORDER_FAILURE,
} from '../actionTypes';
import { CLEAR_CART } from '../actionTypes';

const API_URL = 'http://localhost:3001';

export const fetchOrders = (userId) => async (dispatch) => {
  dispatch({ type: FETCH_ORDERS_REQUEST });
  try {
    const response = await axios.get(`${API_URL}/orders`, {
      params: { userId },
    });
    dispatch({ type: FETCH_ORDERS_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_ORDERS_FAILURE, payload: error.message });
  }
};

export const createOrder = (orderData) => async (dispatch) => {
  dispatch({ type: CREATE_ORDER_REQUEST });
  try {
    const response = await axios.post(`${API_URL}/orders`, orderData);
    dispatch({ type: CREATE_ORDER_SUCCESS, payload: response.data });
    dispatch({ type: CLEAR_CART });
    return response.data;
  } catch (error) {
    dispatch({ type: CREATE_ORDER_FAILURE, payload: error.message });
    throw error;
  }
};
