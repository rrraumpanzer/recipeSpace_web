import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8000',
    prepareHeaders: (headers) => {
      // Если есть токен, добавляем его в заголовки
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  endpoints: (builder) => ({
  // Регистрация пользователя
  registerUser: builder.mutation({
    query: (userData) => {
    const formData = new FormData();
    formData.append('username', userData.username);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    
    return {
      url: '/user/signup',
      method: 'POST',
      body: formData,
      }
    },
  }),
  
  // Получение токена (логин)
  loginUser: builder.mutation({
    query: (userData) => {
      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('password', userData.password);
      
      return {
        url: '/user/token',
        method: 'POST',
        body: formData,
      }
    },
  }),
  
  // Получение данных текущего пользователя
  getMe: builder.query({
    query: () => '/user/me',
  }),
  
  // Получение данных пользователя по ID
  getUser: builder.query({
    query: (userId) => `/user/get?id=${userId}`,
  }),
  
  // Обновление данных пользователя
  updateUser: builder.mutation({
    query: (userData) => ({
      url: '/user/update',
      method: 'PUT',
      body: userData,
    }),
  }),
  
  // Загрузка аватара
  uploadAvatar: builder.mutation({
    query: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return {
        url: '/user/upload-avatar',
        method: 'POST',
        body: formData,
      };
    },
  }),
  
  // Удаление пользователя
  deleteUser: builder.mutation({
    query: () => ({
      url: '/user/delete',
      method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useGetMeQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useUploadAvatarMutation,
  useDeleteUserMutation,
} = api;

