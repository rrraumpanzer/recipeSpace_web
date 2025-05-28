import { useState, useEffect, useCallback, useRef } from 'react';
import { useGetRecipesQuery } from '../../api/recipeApi';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  useAddToUserFavoritesMutation, 
  useDeleteFromUserFavoritesMutation,
  useGetIsInUserFavoritesQuery
} from '../../api/userApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import './Home.css';
import '../../components/header/Header.css'
import {FilterSidebar} from '../../components/FilterSidebar/FilterSidebar';

function Home() {
  const [skip, setSkip] = useState(0);
  const limit = 10; // Количество рецептов за один запрос
  const [recipes, setRecipes] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  
  
  // Состояние для хранения параметров фильтрации
  const [filterParams, setFilterParams] = useState({
    tags: [],
    minCookingTime: null,
    maxCookingTime: null,
    difficulty: null,
    ingredients: []
  });
  
  // Преобразуем tags из объекта в массив выбранных тегов
  const transformTags = (tagsObj) => {
    return Object.entries(tagsObj)
      .filter(([_, value]) => value)
      .map(([key]) => key);
  };

  // Обработчик изменений фильтров
  const handleFilterChange = (newFilters) => {
    const { tags, timeRange, difficulty, ingredients } = newFilters;
    
    const newFilterParams = {
      tags: transformTags(tags),
      minCookingTime: timeRange[0] || null,
      maxCookingTime: timeRange[1] || null,
      difficulty: difficulty || null,
      ingredients: ingredients || []
    };
    
    setFilterParams(newFilterParams);
    // Сбрасываем пагинацию при изменении фильтров
    setRecipes([]);
    setSkip(0);
    setHasMore(true);
  };
  // Получаем данные с учетом фильтров
  const { data, isLoading, isFetching, refetch } = useGetRecipesQuery({ 
    skip, 
    limit,
    tags: filterParams.tags,
    minCookingTime: filterParams.minCookingTime,
    maxCookingTime: filterParams.maxCookingTime,
    difficulty: filterParams.difficulty,
    ingredients: filterParams.ingredients
  });
  
  // Получаем данные с помощью RTK Query
  const updateRecipeFavoriteStatus = (recipeId, isFavorite, likesCountChange) => {
    setRecipes(prev => prev.map(recipe => {
      if (recipe.id === recipeId) {
        return {
          ...recipe,
          isFavorite,
          likes_count: recipe.likes_count + likesCountChange
        };
      }
      return recipe;
    }));
  };

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };
  useEffect(() => {
    setRecipes([]);
    setSkip(0);
    setHasMore(true);
  }, []);
  // Объединяем новые рецепты с уже загруженными
  useEffect(() => {
    if (data) {
      setRecipes(prev => [...prev, ...data]);
      // Если пришло меньше рецептов, чем запрошено, значит это конец
      if (data.length < limit) {
        setHasMore(false);
      }
    }
  }, [data, limit]);
  
  // Наблюдатель для бесконечного скролла
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setSkip(prev => prev + limit);
        }
      },
      { threshold: 0.1 }
    );
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isFetching, limit]);
  
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/src/assets/recipeSpaceIco.svg';
      
    // Если путь уже абсолютный (начинается с http), возвращаем как есть
    if (imagePath.startsWith('http')) return imagePath;
      
    // Формируем URL к изображению на бекенде
    return `http://localhost:8000${imagePath}`;
  };
  // Функция для отображения сложности рецепта
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

  return (
    <div className="home">
      <FilterSidebar onFilterChange={handleFilterChange} />

    <div className="main-content">
        <div className="recipe-grid">
          {recipes.map((recipe) => (
      <div 
        key={recipe.id} 
        className="recipe-card"
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
          <RecipeFavoriteButton 
            recipe={recipe} 
            currentUser={currentUser}
            updateRecipeFavoriteStatus={updateRecipeFavoriteStatus}
          />
        </div>
        <div className='recipe-title'>
          <h3>{recipe.title}</h3>
        </div>
        <div className="recipe-info">
          <p>{recipe.description}</p>
          <p>Время приготовления: {recipe.cooking_time_minutes} мин</p>
        </div>
      </div>
    ))}
        </div>
        
        {/* Индикатор загрузки */}
        {(isLoading || isFetching) && <div>Загрузка...</div>}
        
        {/* Элемент для наблюдения за пересечением */}
        <div ref={loaderRef} style={{ height: '20px' }} />
        
        {/* Сообщение, если больше нет рецептов */}
        {!hasMore && <div>Вы достигли конца списка</div>}
      </div>
    </div>
  );
}

function RecipeFavoriteButton({ recipe, currentUser, updateRecipeFavoriteStatus }) {
  const [addToFavorites] = useAddToUserFavoritesMutation();
  const [removeFromFavorites] = useDeleteFromUserFavoritesMutation();
  
  const { data: isFavoriteData, refetch: refetchIsFavorite } = useGetIsInUserFavoritesQuery(
    { userId: currentUser?.id, recipeId: recipe?.id },
    { skip: !currentUser || !recipe }
  );

  useEffect(() => {
    if (isFavoriteData !== undefined && recipe.isFavorite !== isFavoriteData) {
      updateRecipeFavoriteStatus(recipe.id, isFavoriteData, 0);
    }
  }, [isFavoriteData]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // Предотвращаем всплытие события клика по карточке
    
    if (!currentUser) return;
    
    try {
      if (recipe.isFavorite) {
        await removeFromFavorites({
          userId: currentUser.id,
          recipeId: recipe.id
        }).unwrap();
        updateRecipeFavoriteStatus(recipe.id, false, -1);
      } else {
        await addToFavorites({
          userId: currentUser.id,
          recipeId: recipe.id
        }).unwrap();
        updateRecipeFavoriteStatus(recipe.id, true, 1);
      }
      await refetchIsFavorite();
    } catch (error) {
      console.error('Ошибка при обновлении избранного:', error);
    }
  };

  return (
    <div 
      className='like-button' 
      onClick={handleFavoriteClick}
      title={currentUser ? (recipe.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное') : 'Войдите, чтобы добавить в избранное'}
    >
      <img src={recipe.isFavorite ? '/src/assets/heart-red.svg' : '/src/assets/heart.svg'} alt="Избранное" />
      <span>{recipe.likes_count || 0}</span>
    </div>
  );
}

export default Home;