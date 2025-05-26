import React, { useState, useRef, useEffect } from 'react';
import { useRegisterUserMutation, useLoginUserMutation } from '../../api/userApi';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [error, setError] = useState('');
  
  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();
  const [loginUser, { isLoading: isLoggingIn }] = useLoginUserMutation();
  
  const modalRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        // Логин
        const { username, password } = formData;
        const response = await loginUser({ username, password }).unwrap();
        localStorage.setItem('token', response.token);
        onLoginSuccess?.();
        onClose();
      } else {
        // Регистрация
        await registerUser(formData).unwrap();
        // После успешной регистрации автоматически логиним пользователя
        const { email, password } = formData;
        const response = await loginUser({ email, password }).unwrap();
        localStorage.setItem('token', response.token);
        onLoginSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err.data?.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.');
      console.error('Auth error:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Сброс формы при открытии
      setFormData({
        email: '',
        password: '',
        username: ''
      });
      setError('');
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <h2>
          {isLogin ? 'Вход' : 'Регистрация'}
          <button className="modal-close" onClick={onClose}>×</button>
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
              />
            </div>
          
          {!isLogin && (
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
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
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isRegistering || isLoggingIn}
          >
            {isLogin 
              ? (isLoggingIn ? 'Вход...' : 'Войти')
              : (isRegistering ? 'Регистрация...' : 'Зарегистрироваться')}
          </button>
        </form>

        <p className="switch-mode">
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            className="switch-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            disabled={isRegistering || isLoggingIn}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;