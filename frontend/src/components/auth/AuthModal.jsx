import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useRegisterUserMutation,
  useLoginUserMutation
} from '../../api/userApi';
import {
  closeModal,
  toggleAuthMode,
  setFormData,
  selectAuth,
  setError,
  setToken
} from '../../store/slices/authSlice';
import './AuthModal.css';

const AuthModal = ({ onLoginSuccess }) => {
  const dispatch = useDispatch();
  const {
    isModalOpen,
    isLoginForm,
    formData,
    error
  } = useSelector(selectAuth);
  
  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();
  const [loginUser, { isLoading: isLoggingIn }] = useLoginUserMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setError('')); // Сбрасываем ошибку перед новым запросом
    
    try {
      if (isLoginForm) {
        const { username, password } = formData;
        const response = await loginUser({ username, password }).unwrap();
        dispatch(setToken(response.access_token)); // Используем access_token из ответа
        onLoginSuccess?.();
      } else {
        await registerUser(formData).unwrap();
        // После регистрации автоматически логиним
        const { email, password } = formData;
        const response = await loginUser({ email, password }).unwrap();
        dispatch(setToken(response.access_token)); // Используем access_token из ответа
        onLoginSuccess?.();
      }
    } catch (err) {
      console.error('Auth error:', err);
      dispatch(setError(err.data?.message || 'Произошла ошибка'));
    }
  };

  const handleChange = (e) => {
    dispatch(setFormData({
      name: e.target.name,
      value: e.target.value
    }));
  };

  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>
          {isLoginForm ? 'Вход' : 'Регистрация'}
          <button 
            className="modal-close" 
            onClick={() => dispatch(closeModal())}
            disabled={isRegistering || isLoggingIn}
          >
            ×
          </button>
        </h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              disabled={isRegistering || isLoggingIn}
            />
          </div>
          
          {!isLoginForm && (
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isRegistering || isLoggingIn}
              />
            </div>
          )}

          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={isRegistering || isLoggingIn}
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isRegistering || isLoggingIn}
          >
            {isLoginForm 
              ? (isLoggingIn ? 'Вход...' : 'Войти')
              : (isRegistering ? 'Регистрация...' : 'Зарегистрироваться')}
          </button>
        </form>

        <p className="switch-mode">
          {isLoginForm ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            className="switch-button"
            onClick={() => dispatch(toggleAuthMode())}
            disabled={isRegistering || isLoggingIn}
          >
            {isLoginForm ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;