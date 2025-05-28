import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetUserQuery, 
  useUpdateUserMutation,
  useUploadAvatarMutation, 
  useDeleteUserMutation,
  useGetCreatedRecipesQuery,
  useGetFavoriteRecipesQuery
} from '../../api/userApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import './UserProfile.css';
import { logout } from '../../store/slices/authSlice';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '/src/assets/recipeSpaceIco.svg';
    
  // Если путь уже абсолютный (начинается с http), возвращаем как есть
  if (imagePath.startsWith('http')) return imagePath;
    
  // Формируем URL к изображению на бекенде
  return `http://localhost:8000${imagePath}`;
};

function UserProfile() {
  const dispatch = useDispatch();
  let navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    username: '',
    email: '',
    bio: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeTab, setActiveTab] = useState('created'); // 'created' или 'favorites'

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

  const { 
    data: createdRecipes, 
    isLoading: isLoadingCreated,
    error: errorCreated
  } = useGetCreatedRecipesQuery({ userId: profileToLoadId });

  const { 
    data: favoriteRecipes, 
    isLoading: isLoadingFavorites,
    error: errorFavorites
  } = useGetFavoriteRecipesQuery({ userId: profileToLoadId });

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
      
      await updateUser({
        userId: currentUser.id,
        userData: editedData
      }).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить свой профиль? Это действие нельзя отменить.')) {
      try {
        await deleteUser(currentUser.id).unwrap();
        dispatch(logout())
        navigate('/', { replace: true })
      } catch (error) {
        console.error('Ошибка при удалении профиля:', error);
      }
    }
  };

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };
  
  const renderIngredientsPreview = (ingredients) => {
    if (!ingredients || !ingredients.length) return null;
    return (
      <ul className="ingredients-preview">
        {ingredients.slice(0, 3).map((ingredient, index) => (
          <li key={index}>{ingredient.name}</li>
        ))}
        {ingredients.length > 3 && <li>и еще {ingredients.length - 3}...</li>}
      </ul>
    );
  };

  const renderDifficulty = (difficulty) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <img 
          key={i} 
          src={i < difficulty ? '../src/assets/star_full1.svg' : '../src/assets/star_full.svg'} 
          alt={i < difficulty ? 'filled star' : 'empty star'}
        />
      );
    }
    return <div className="recipe-difficulty">{stars}</div>;
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

      <div className="recipes-tabs">
        <button 
          className={activeTab === 'created' ? 'active' : ''}
          onClick={() => setActiveTab('created')}
        >
          Созданные рецепты
        </button>
        <button 
          className={activeTab === 'favorites' ? 'active' : ''}
          onClick={() => setActiveTab('favorites')}
        >
          Избранные рецепты
        </button>
      </div>

      <div className="recipes-content">
        {activeTab === 'created' ? (
          <div className="profile-recipes-grid">
            {isLoadingCreated ? (
              <div>Загрузка созданных рецептов...</div>
            ) : errorCreated ? (
              <div>Ошибка загрузки созданных рецептов</div>
            ) : createdRecipes?.length > 0 ? (
              createdRecipes.map((recipe) => (
                <div 
                  key={recipe.id} 
                  className="profile-recipe-card"
                  onClick={() => handleRecipeClick(recipe.id)}
                  style={{cursor: 'pointer'}}
                >
                  <div className="recipe-image">
                    <img 
                      src={getImageUrl(recipe.image)} 
                      alt={recipe.title} 
                      onError={(e) => {
                        e.target.src = '/src/assets/recipeSpaceIco.svg';
                      }}
                    />
                  </div>
                  <div className='recipe-header'>
                    {renderDifficulty(recipe.difficulty)}
                  </div>
                  <div className='recipe-title'>
                    <h3>{recipe.title}</h3>
                  </div>
                  <div className="recipe-info">
                    <p>{recipe.description}</p>
                    <p>Время приготовления: {recipe.cooking_time_minutes} мин</p>
                  </div>
                </div>
              ))
            ) : (
              <p>Пользователь пока не создал ни одного рецепта</p>
            )}
          </div>
        ) : (
          <div className="profile-recipes-grid">
            {isLoadingFavorites ? (
              <div>Загрузка избранных рецептов...</div>
            ) : errorFavorites ? (
              <div>Ошибка загрузки избранных рецептов</div>
            ) : favoriteRecipes?.length > 0 ? (
              favoriteRecipes.map((recipe) => (
                <div 
                  key={recipe.id} 
                  className="profile-recipe-card"
                  onClick={() => handleRecipeClick(recipe.id)}
                  style={{cursor: 'pointer'}}
                >
                  <div className="recipe-image">
                    <img 
                      src={getImageUrl(recipe.image)} 
                      alt={recipe.title} 
                      onError={(e) => {
                        e.target.src = '/src/assets/recipeSpaceIco.svg';
                      }}
                    />
                  </div>
                  <div className='recipe-header'>
                    {renderDifficulty(recipe.difficulty)}
                    <div className='like-button'>
                      <img src='/src/assets/heart-red.svg' alt="Лайки" />
                      <span>{recipe.likes_count || 0}</span>
                    </div>
                  </div>
                  <div className='recipe-title'>
                    <h3>{recipe.title}</h3>
                  </div>
                  <div className="recipe-info">
                    <p>{recipe.description}</p>
                    <p>Время приготовления: {recipe.cooking_time_minutes} мин</p>
                  </div>
                </div>
              ))
            ) : (
              <p>Пользователь пока не добавил рецептов в избранное</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;