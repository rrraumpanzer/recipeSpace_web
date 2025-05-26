import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetUserQuery } from '../../api/userApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSelector } from 'react-redux';
import './UserProfile.css';

const getImageUrl = (imagePath) => {
    if (!imagePath) return '/src/assets/react.svg';
      
    // Если путь уже абсолютный (начинается с http), возвращаем как есть
    if (imagePath.startsWith('http')) return imagePath;
      
    // Формируем URL к изображению на бекенде
    return `http://localhost:8000${imagePath}`;
  };

function UserProfile() {
  // Получаем ID пользователя из URL
  const { user_id } = useParams();
  const currentUser = useSelector(selectCurrentUser);
  var isOwnProfile = null;

  // Получаем текущего авторизованного пользователя из Redux store
  const profileToLoadId = user_id ? user_id : currentUser?.id;
  if (profileToLoadId == currentUser?.id) {
    isOwnProfile=true;
  } else {
    isOwnProfile=false;
  }
  
  const { 
    data: userData, 
    isLoading, 
    error 
  } = useGetUserQuery(profileToLoadId, {
    skip: !profileToLoadId // Пропускаем если нет ID для загрузки
  });

  // console.log('Loaded user data:', userData);

  // Если это профиль текущего пользователя и он еще не загружен в хранилище,
  // можно дополнительно запросить его через useGetMeQuery()
  
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!userData) return <div>Пользователь не найден</div>;

  return (
    <div className="user-profile">
      <div className="user-header">
        {userData.profile_picture && (
          <img 
            src={getImageUrl(userData.profile_picture)} 
            alt={`Аватар ${userData.username}`} 
            className="user-avatar"
            onError={(e) => {
                  e.target.src = '../src/assets/default.svg';
            }}
          />
        )}
        <h1>{userData.username}</h1>
      <div className='isown-tag'>{isOwnProfile && <span>(Это вы)</span>}</div>
      </div>
      
      {userData.bio && <p className="user-bio">{userData.bio}</p>}
      
      <div className="user-stats">
        <p>Зарегистрирован: {new Date(userData.created_at).toLocaleDateString()}</p>
        {/* Дополнительная информация о пользователе */}
        {userData.email && isOwnProfile && <p>Email: {userData.email}</p>}
      </div>
      
      {/* Кнопки действий для своего профиля */}
      {isOwnProfile && (
        <div className="profile-actions">
          <button>Редактировать профиль</button>
          {/* Другие действия */}
        </div>
      )}
    </div>
  );
}

export default UserProfile;