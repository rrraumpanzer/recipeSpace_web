import { useState } from 'react';
import { useGetRecipeQuery } from '../../api/recipeApi';

import './FilterSidebar.css';
const FilterSidebar = ({ onFilterChange }) => {
  const [tags, setTags] = useState({
    firstCourse: false,
    secondCourse: false,
    breakfast: false,
    salad: false,
    dessert: false,
    fasting: false,
    vegetarian: false,
    drink: false
  });

  const [timeRange, setTimeRange] = useState([0, 280]);
  const [difficulty, setDifficulty] = useState(0);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');

  const handleTagChange = (tag) => {
    const newTags = { ...tags, [tag]: !tags[tag] };
    setTags(newTags);
    onFilterChange({ tags: newTags, timeRange, difficulty, ingredients });
  };

  const handleTimeChange = (index, value) => {
  const newValue = parseInt(value) || 0;
  const newTimeRange = [...timeRange];
  
  // Проверка, чтобы второе значение не было меньше первого
  if (index === 1 && newValue < timeRange[0]) {
    newTimeRange[1] = timeRange[0]; // Устанавливаем равным первому значению
  } else if (index === 0 && newValue > timeRange[1]) {
    newTimeRange[0] = timeRange[1]; // Устанавливаем равным второму значению
  } else {
    newTimeRange[index] = newValue;
  }
  
  setTimeRange(newTimeRange);
  onFilterChange({ tags, timeRange: newTimeRange, difficulty, ingredients });
};

  const handleDifficultyClick = (level) => {
    const newDifficulty = level === difficulty ? 0 : level;
    setDifficulty(newDifficulty);
    onFilterChange({ tags, timeRange, difficulty: newDifficulty, ingredients });
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      const newIngredients = [...ingredients, ingredientInput.trim()];
      setIngredients(newIngredients);
      setIngredientInput('');
      onFilterChange({ tags, timeRange, difficulty, ingredients: newIngredients });
    }
  };

  const handleRemoveIngredient = () => {
    if (ingredients.length > 0) {
      const newIngredients = ingredients.slice(0, -1);
      setIngredients(newIngredients);
      onFilterChange({ tags, timeRange, difficulty, ingredients: newIngredients });
    }
  };

  const renderDifficultyStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i < difficulty ? 'filled' : ''}`}
          onClick={() => handleDifficultyClick(i + 1)}
        >
          {i < difficulty ? '★' : '☆'}
        </span>
      );
    }
    return <div className="difficulty-stars">{stars}</div>;
  };

  return (
    <div className="sidebar">
      <div className="filter-panel">
        <div className="filter-section">
          <h2>Фильтры</h2>
          
          <h3>Теги</h3>
          <label>
            <input 
              type="checkbox" 
              checked={tags.firstCourse} 
              onChange={() => handleTagChange('firstCourse')} 
            /> Первое блюдо
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={tags.secondCourse} 
              onChange={() => handleTagChange('secondCourse')} 
            /> Второе блюдо
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={tags.breakfast} 
              onChange={() => handleTagChange('breakfast')} 
            /> Завтрак
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={tags.salad} 
              onChange={() => handleTagChange('salad')} 
            /> Салат
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={tags.dessert} 
              onChange={() => handleTagChange('dessert')} 
            /> Десерт
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={tags.fasting} 
              onChange={() => handleTagChange('fasting')} 
            /> Постное
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={tags.vegetarian} 
              onChange={() => handleTagChange('vegetarian')} 
            /> Вегетарианское
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={tags.drink} 
              onChange={() => handleTagChange('drink')} 
            /> Напиток
          </label>

          <h3>Время приготовления (мин)</h3>
          <div className="time-range">
            <div className="time-inputs">
              <span>От</span>
              <input
                type="number"
                min="0"
                max="280"
                value={timeRange[0]}
                onChange={(e) => handleTimeChange(0, e.target.value)}
              />
              <span>до</span>
              <input
                type="number"
                min="0"
                max="280"
                value={timeRange[1]}
                onChange={(e) => handleTimeChange(1, e.target.value)}
              />
              <span>мин</span>
            </div>
          </div>

          <h3>Сложность</h3>
          {renderDifficultyStars()}

          <h3>Ингредиенты</h3>
          <div className="ingredients-filter">
            <input 
              type="text" 
              value={ingredientInput} 
              onChange={(e) => setIngredientInput(e.target.value)}
              placeholder="Добавить ингредиент"
            />
            <button onClick={handleAddIngredient}>+</button>
            <button onClick={handleRemoveIngredient}>-</button>
          </div>
          {ingredients.length > 0 && (
            <div className="ingredients-list">
              {ingredients.map((ing, index) => (
                <div key={index}>{ing}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export {FilterSidebar};