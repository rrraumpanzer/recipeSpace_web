import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8000/user',
    prepareHeaders: (headers, {getState}) => {
      const token = getState().auth.token;
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
      url: '/signup',
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
        url: '/token',
        method: 'POST',
        body: formData,
      }
    },
  }),
  
  // Получение данных текущего пользователя
  getMe: builder.query({
    query: () => '/me/',
  }),
  
  // Получение данных пользователя по ID
  getUser: builder.query({
    query: (userId) => `/${userId}`,
  }),
  
  // Обновление данных пользователя
  updateUser: builder.mutation({
    query: (userData) => ({
      url: '/update',
      method: 'PATCH',
      body: userData,
    }),
  }),
  
  // Загрузка аватара
  uploadAvatar: builder.mutation({
    query: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return {
        url: '/upload-avatar',
        method: 'POST',
        body: formData,
      };
    },
  }),
  
  // Удаление пользователя
  deleteUser: builder.mutation({
    query: () => ({
      url: '/delete',
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
} = userApi;

