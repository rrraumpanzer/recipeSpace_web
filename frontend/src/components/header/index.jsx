import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openModal, logout, selectIsLoggedIn } from '../../store/slices/authSlice';
import AuthModal from '../auth/AuthModal';
import './Header.css';



function Header() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const authState = useSelector((state) => state.auth);
  console.log('Auth state:', authState);

  const handleAuthClick = () => {
    if (isLoggedIn) {
      dispatch(logout());
    } else {
      dispatch(openModal());
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="site-title">recipeSpace</h1>
        <button 
          className="login-button"
          onClick={handleAuthClick}
        >
          {isLoggedIn ? 'Выйти' : 'Войти'}
        </button>
      </div>
      <AuthModal />
    </header>
  );
}

export default Header;