import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { openModal, logout, selectIsLoggedIn, selectCurrentUser } from '../../store/slices/authSlice';
import { useGetMeQuery } from '../../api/userApi';
import AuthModal from '../auth/AuthModal';
import './Header.css';
import { closeModal } from '../../store/slices/authSlice';
function Header() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const currentUser = useSelector(selectCurrentUser);
  
  // Получаем данные текущего пользователя при монтировании
  const { data: userData, refetch } = useGetMeQuery(undefined, {
    skip: !isLoggedIn,
  });

  useEffect(() => {
    if (isLoggedIn) {
      refetch();
    }
  }, [isLoggedIn, refetch]);

  const handleAuthClick = () => {
    if (isLoggedIn) {
      dispatch(logout());
      dispatch(closeModal());
    } else {
      dispatch(openModal());
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1><Link to={`/`} className="site-title">recipeSpace</Link></h1>
        {isLoggedIn && currentUser && (
            <Link to={`/recipe/create`} className="create-recipe-link">Создать рецепт</Link>
        )}
        <div className="user-section">
          {isLoggedIn && currentUser && (
            <Link to={`/user/${currentUser.id}`} className="username-link">
              {currentUser.username}
            </Link>
          )}
        </div>

        <div className='auth-section'>
          <button 
            className="login-button"
            onClick={handleAuthClick}
          >
            {isLoggedIn ? 'Выйти' : 'Войти'}
          </button>
        </div>
      </div>
      <AuthModal />
    </header>
  );
}

export default Header;