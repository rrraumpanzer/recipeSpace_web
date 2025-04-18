import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
//import api from '../../services/api';

export const recipesAdapter = createEntityAdapter();

const initialState = recipesAdapter.getInitialState({
  loading: false,
  error: null,
});

export const fetchRecipes = createAsyncThunk(
  'recipes/fetchRecipes',
  async () => {
    const response = await api.get('/recipes');
    return response.data;
  }
);

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    addFavorite: (state, action) => {
      const recipe = state.entities[action.payload];
      if (recipe) {
        recipe.isFavorite = true;
      }
    },
    removeFavorite: (state, action) => {
      const recipe = state.entities[action.payload];
      if (recipe) {
        recipe.isFavorite = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        recipesAdapter.setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { addFavorite, removeFavorite } = recipesSlice.actions;
export default recipesSlice.reducer;