// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { userApi } from '../api/userApi';
import { recipeApi } from '../api/recipeApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [userApi.reducerPath]: userApi.reducer,
    [recipeApi.reducerPath]: recipeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userApi.middleware, recipeApi.middleware),
  devTools: true,
});