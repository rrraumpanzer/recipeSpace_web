import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const recipeApi = createApi({
  reducerPath: 'recipeApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8000/recipe',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Recipe'],
  endpoints: (builder) => ({
    createRecipe: builder.mutation({
      query: (recipeData) => ({
        url: '/create',
        method: 'POST',
        body: recipeData,
      }),
      invalidatesTags: ['Recipe'],
    }),


    getRecipe: builder.query({
      query: (recipeId) => `/${recipeId}`,
      providesTags: (result, error, arg) => [{ type: 'Recipe', id: arg }],
    }),


    updateRecipe: builder.mutation({
      query: ({ recipeId, ...recipeData }) => ({
        url: `/update/${recipeId}`,
        method: 'PATCH',
        body: recipeData,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Recipe', id: arg.recipeId }],
    }),


    uploadRecipeImage: builder.mutation({
      query: ({ recipeId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return {
          url: `/upload-image/${recipeId}`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [{ type: 'Recipe', id: arg.recipeId }],
    }),


    deleteRecipe: builder.mutation({
      query: (recipeId) => ({
        url: `/delete/${recipeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Recipe'],
    }),


    getRecipes: builder.query({
      query: ({ skip = 0, limit = 10 }) => `/?skip=${skip}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Recipe', id })),
              { type: 'Recipe', id: 'LIST' },
            ]
          : [{ type: 'Recipe', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateRecipeMutation,
  useGetRecipeQuery,
  useUpdateRecipeMutation,
  useUploadRecipeImageMutation,
  useDeleteRecipeMutation,
  useGetRecipesQuery,
  useLazyGetRecipesQuery,
} = recipeApi;
