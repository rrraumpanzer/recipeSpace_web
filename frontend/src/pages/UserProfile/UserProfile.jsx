import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetUserQuery, useUpdateUserMutation, useUploadAvatarMutation, useDeleteUserMutation } from '../../api/userApi';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    username: '',
    email: '',
    bio: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const { user_id } = useParams();
  const currentUser = useSelector(selectCurrentUser);
  var isOwnProfile = null;

  const profileToLoadId = user_id ? user_id : currentUser?.id;
  if (profileToLoadId == currentUser?.id) {
    isOwnProfile = true;
  } else {
    isOwnProfile = false;
  }
  
  const { 
    data: userData, 
    isLoading, 
    error 
  } = useGetUserQuery(profileToLoadId, {
    skip: !profileToLoadId
  });

  const [updateUser] = useUpdateUserMutation();
  const [uploadAvatar] = useUploadAvatarMutation();
  const [deleteUser] = useDeleteUserMutation();

  useEffect(() => {
    if (userData) {
      setEditedData({
        username: userData.username || '',
        email: userData.email || '',
        bio: userData.bio || '',
      });
      setPreviewImage(null);
      setSelectedFile(null);
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (selectedFile) {
        await uploadAvatar({ 
          userId: currentUser.id, 
          file: selectedFile 
        }).unwrap();
      }
      
      await updateUser(editedData).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить свой профиль? Это действие нельзя отменить.')) {
      try {
        await deleteUser().unwrap();
        // Здесь можно добавить редирект
      } catch (error) {
        console.error('Ошибка при удалении профиля:', error);
      }
    }
  };

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!userData) return <div>Пользователь не найден</div>;

  return (
    <div className="user-profile">
      <div className="user-header">
        <img 
          src={previewImage || getImageUrl(userData.profile_picture)} 
          alt={`Аватар ${userData.username}`} 
          className="user-avatar"
          onError={(e) => {
            e.target.src = '../src/assets/default.svg';
          }}
        />
        {isEditing && (
          <div className="avatar-upload">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>
        )}
        
        {isEditing ? (
          <input
            type="text"
            name="username"
            value={editedData.username}
            onChange={handleInputChange}
          />
        ) : (
          <h1>{userData.username}</h1>
        )}
        
        <div className='isown-tag'>{isOwnProfile && <span>(Это вы)</span>}</div>
      </div>
      
      {isEditing ? (
        <textarea
          name="bio"
          value={editedData.bio}
          onChange={handleInputChange}
          placeholder="Расскажите о себе"
        />
      ) : (
        userData.bio && <p className="user-bio">{userData.bio}</p>
      )}
      
      <div className="user-stats">
        <p>Зарегистрирован: {new Date(userData.created_at).toLocaleDateString()}</p>
        
        {isEditing ? (
          <input
            type="email"
            name="email"
            value={editedData.email}
            onChange={handleInputChange}
          />
        ) : (
          userData.email && isOwnProfile && <p>Email: {userData.email}</p>
        )}
      </div>
      
      {isOwnProfile && (
        <div className="profile-actions">
          {isEditing ? (
            <>
              <button onClick={handleSave}>Сохранить</button>
              <button onClick={() => setIsEditing(false)}>Отмена</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)}>Редактировать профиль</button>
              <button onClick={handleDelete}>Удалить профиль</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfile;