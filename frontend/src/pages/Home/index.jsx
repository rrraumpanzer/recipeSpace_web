import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
//import { fetchRecipes } from '../../store/slices/recipesSlice';
//import FilterPanel from '../../components/FilterPanel';
//import RecipeGrid from '../../components/RecipeGrid';
import './Home.css'

//const dispatch = useDispatch();
//const { loading, error } = useSelector((state) => state.recipes);

//useEffect(() => {
//  dispatch(fetchRecipes());
//}, [dispatch]);

//if (loading) return <div>Loading...</div>;
//if (error) return <div>Error: {error}</div>;

function Home() {
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
            <h3>Категории</h3>
            <label>
              <input type="checkbox" /> Первые блюда
            </label>
            <label>
              <input type="checkbox" /> Вторые блюда
            </label>
            <label>
              <input type="checkbox" /> Салаты
            </label>
            <label>
              <input type="checkbox" /> Десерты
            </label>
            <label>
              <input type="checkbox" /> Напитки
            </label>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="recipe-grid">
          {/* Временные карточки рецептов */}
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="recipe-card">
              <div className="recipe-image">
                <img src={`src/assets/vite.svg`} alt="Dish image" />
              </div>
              <div className="recipe-difficulty">
              <img src={`../src/assets/star_full1.svg`}/><img src={`../src/assets/star_full1.svg`}/>
              </div>
              <div className="recipe-info">
                <h3>Рецепт {item}</h3>
                <p>Время приготовления: 30 мин</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home