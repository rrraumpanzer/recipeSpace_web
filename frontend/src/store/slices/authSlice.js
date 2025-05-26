import { createSlice } from '@reduxjs/toolkit';
import { userApi } from '../../api/userApi'; // предполагается, что у вас есть API slice

const initialState = {
  isModalOpen: false,
  isLoginForm: true,
  formData: {
    email: '',
    password: '',
    username: ''
  },
  error: '',
  token: localStorage.getItem('token') || null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    openModal: (state) => {
      state.isModalOpen = true;
      // Сбрасываем форму при открытии
      state.formData = initialState.formData;
      state.error = '';
    },
    closeModal: (state) => {
      state.isModalOpen = false;
    },
    toggleAuthMode: (state) => {
      state.isLoginForm = !state.isLoginForm;
      state.error = '';
    },
    setFormData: (state, action) => {
      state.formData = {
        ...state.formData,
        [action.payload.name]: action.payload.value
      };
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    logout: (state) => {
      state.token = null;
      localStorage.removeItem('token');
    }
  },
  // Обрабатываем результаты запросов RTK Query
  extraReducers: (builder) => {
  builder
    .addMatcher(
      userApi.endpoints.loginUser.matchPending,
      (state) => {
          state.error = '';
      }
    )
    .addMatcher(
      userApi.endpoints.registerUser.matchPending,
      (state) => {
          state.error = '';
      }
    )
    .addMatcher(
      userApi.endpoints.loginUser.matchFulfilled,
      (state, { payload }) => {
          state.token = payload.access_token; // Используем access_token из ответа
          localStorage.setItem('token', payload.access_token);
          state.isModalOpen = false;
      }
    )
    .addMatcher(
      userApi.endpoints.registerUser.matchFulfilled,
      (state) => {
          state.isLoginForm = true;
      }
    )
    .addMatcher(
      userApi.endpoints.loginUser.matchRejected,
      (state, { payload }) => {
          state.error = payload?.data?.message || 'Ошибка входа';
      }
    )
    .addMatcher(
      userApi.endpoints.registerUser.matchRejected,
      (state, { payload }) => {
          state.error = payload?.data?.message || 'Ошибка регистрации';
      }
    );
  }
});

console.log('Initial auth state:', initialState);

export const {
  openModal,
  closeModal,
  toggleAuthMode,
  setFormData,
  setError,
  setToken,
  logout
} = authSlice.actions;

export default authSlice.reducer;

// Селекторы
export const selectAuth = (state) => state.auth;
export const selectIsModalOpen = (state) => state.auth.isModalOpen;
export const selectIsLoggedIn = (state) => !!state.auth.token;