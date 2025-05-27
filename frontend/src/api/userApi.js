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
    query: ({userId, userData}) => {
      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('bio', userData.bio);
      formData.append('email', userData.email);
      return {
      url: `/update/${userId}`,
      method: 'PATCH',
      body: formData,
      }
    },
  }),
  
  uploadAvatar: builder.mutation({
    query: ({ userId, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      return {
        url: `/upload-avatar/${userId}`,
        method: 'POST',
        body: formData,
      };
    },
  }),
  
  // Удаление пользователя
  deleteUser: builder.mutation({
    query: (userId) => ({
      url: `/delete/${userId}`,
      method: 'DELETE',
      }),
    }),
  

  addToUserFavorites: builder.mutation({
    query: ({userId, recipeId}) => ({
      url: `/${userId}/favorites/${recipeId}`,
      method: 'POST',
      }),
    }),
  

  deleteFromUserFavorites: builder.mutation({
    query: ({userId, recipeId}) => ({
      url: `/${userId}/favorites/${recipeId}`,
      method: 'DELETE',
      }),
    }),
  
  getFavoriteRecipes: builder.query({
      query: ({userId, skip = 0, limit = 10 }) => `/${userId}/favorites?skip=${skip}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Recipe', id })),
              { type: 'Recipe', id: 'LIST' },
            ]
          : [{ type: 'Recipe', id: 'LIST' }],
    }),
  
  getCreatedRecipes: builder.query({
      query: ({userId, skip = 0, limit = 10 }) => `/${userId}/recipes?skip=${skip}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Recipe', id })),
              { type: 'Recipe', id: 'LIST' },
            ]
          : [{ type: 'Recipe', id: 'LIST' }],
    }),

  })
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useGetMeQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useUploadAvatarMutation,
  useDeleteUserMutation,
  useDeleteFromUserFavoritesMutation,
  useAddToUserFavoritesMutation,
  useGetCreatedRecipesQuery
} = userApi;

