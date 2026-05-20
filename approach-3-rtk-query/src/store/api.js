import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const shopApi = createApi({
  reducerPath: 'shopApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3001' }),
  tagTypes: ['Products', 'Orders', 'Users'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Products'],
    }),

    getOrders: builder.query({
      query: (userId) => `/orders?userId=${userId}`,
      providesTags: ['Orders'],
    }),

    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Orders'],
    }),

    loginUser: builder.mutation({
      query: ({ email, password }) => `/users?email=${email}&password=${password}`,
      transformResponse: (response) => {
        if (response.length > 0) {
          const user = response[0];
          localStorage.setItem('user', JSON.stringify(user));
          return user;
        }
        throw new Error('Неверный email или пароль');
      },
    }),

    registerUser: builder.mutation({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response) => {
        localStorage.setItem('user', JSON.stringify(response));
        return response;
      },
    }),

    checkEmailExists: builder.query({
      query: (email) => `/users?email=${email}`,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetOrdersQuery,
  useCreateOrderMutation,
  useLoginUserMutation,
  useRegisterUserMutation,
  useLazyCheckEmailExistsQuery,
} = shopApi;
