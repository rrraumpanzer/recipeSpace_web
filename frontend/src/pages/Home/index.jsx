import { useState, useEffect, useCallback, useRef } from 'react';
import { useGetRecipesQuery } from '../../api/recipeApi';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import '../../components/header/Header.css'

function Home() {
  const [skip, setSkip] = useState(0);
  const limit = 10; // Количество рецептов за один запрос
  const [recipes, setRecipes] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const navigate = useNavigate();
  
  // Получаем данные с помощью RTK Query
  const { data, isLoading, isFetching } = useGetRecipesQuery({ skip, limit });
  
  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

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
      <div className="sidebar">
        <div className="filter-panel">
          <h2>Поиск</h2>
          <input 
            type="text" 
            placeholder="Рыба под шоколадом..." 
            className="search-input"
          />
          <div className="filter-section">
            <h2>Фильтры</h2>
            <h3>Теги</h3>
            <label>
              <input type="checkbox" /> Первое блюдо
            </label>
            <label>
              <input type="checkbox" /> Второе блюдо
            </label>
            <label>
              <input type="checkbox" /> Завтрак
            </label>
            <label>
              <input type="checkbox" /> Салат
            </label>
            <label>
              <input type="checkbox" /> Десерт
            </label>
            <label>
              <input type="checkbox" /> Постное
            </label>
            <label>
              <input type="checkbox" /> Вегетарианское
            </label>
            <label>
              <input type="checkbox" /> Напиток
            </label>
            <h3>Время приготовления</h3>
            <label>
            <p>
            <input type="range" min="0" max="280" step="1"></input>
            </p>
            </label>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <div 
            key={recipe.id} 
            className="recipe-card"
            onClick={()=>handleRecipeClick(recipe.id)}
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
                      <img src='/src/assets/heart.svg'></img>
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

export default Home;