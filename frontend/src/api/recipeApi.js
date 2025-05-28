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
      query: ({author_id, recipeData}) => {
        const formData = new FormData();
        formData.append('title', recipeData.title);
        formData.append('description', recipeData.description);
        formData.append('tags', recipeData.tags)

        formData.append('ingredients', recipeData.ingredients);
        formData.append('cooking_time_minutes', recipeData.cooking_time_minutes);
        formData.append('difficulty', recipeData.difficulty);
        formData.append('steps', recipeData.steps);
        formData.append('author_id', author_id);
        return{
        url: '/create',
        method: 'POST',
        body: formData,
        }
      },
      invalidatesTags: ['Recipe'],
    }),


    getRecipe: builder.query({
      query: (recipeId) => `/${recipeId}`,
      providesTags: (result, error, arg) => [{ type: 'Recipe', id: arg }],
    }),

    updateRecipe: builder.mutation({
        query: ({recipeId, recipeData}) => {
          const formData = new FormData();
          formData.append('title', recipeData.title);
          formData.append('description', recipeData.description);
          formData.append('tags', JSON.stringify(recipeData.tags || []));
          formData.append('ingredients', JSON.stringify(recipeData.ingredients || []));
          formData.append('cooking_time_minutes', recipeData.cooking_time_minutes);
          formData.append('difficulty', recipeData.difficulty);
          formData.append('steps', recipeData.steps);

          return {
          url: `/update/${recipeId}`,
          method: 'PATCH',
          body: formData,
          }
        },
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
      query: ({ 
        skip = 0, 
        limit = 10, 
        tags, 
        maxCookingTime, 
        minCookingTime, 
        difficulty, 
        ingredients 
      } = {}) => {
        const params = new URLSearchParams();
        
        // Обязательные параметры пагинации
        params.append('skip', skip);
        params.append('limit', limit);
        
        // Опциональные параметры фильтрации
        if (tags?.length) tags.forEach(tag => params.append('tags', tag));
        if (maxCookingTime) params.append('max_cooking_time', maxCookingTime);
        if (minCookingTime) params.append('min_cooking_time', minCookingTime);
        if (difficulty) params.append('difficulty', difficulty);
        if (ingredients?.length) ingredients.forEach(ing => params.append('ingredients', ing));
        
        return `/?${params.toString()}`;
      },
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
