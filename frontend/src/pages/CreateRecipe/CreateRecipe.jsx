import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRecipeMutation } from '../../api/recipeApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import ReactMarkdown from 'react-markdown';
import '../Recipe/RecipePage.css';

function CreateRecipe() {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [createRecipe] = useCreateRecipeMutation();

  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    tags: [],
    ingredients: [''],
    steps: '',
    cooking_time_minutes: 30,
    difficulty: 3,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRecipe(prev => ({ ...prev, [name]: value }));
  };

  const handleIngredientsChange = (index, value) => {
    const newIngredients = [...newRecipe.ingredients];
    newIngredients[index] = value;
    setNewRecipe(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        console.log("author_id: ", currentUser.id)
        const createdRecipe = await createRecipe({
            author_id: currentUser.id,
            recipeData: newRecipe
        }).unwrap();
        console.log(createRecipe)
      navigate(`/recipe/${createdRecipe.id}`);
    } catch (error) {
      console.error('Ошибка при создании рецепта:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="recipe-page">
        <h1>Для создания рецепта необходимо авторизоваться</h1>
      </div>
    );
  }

  return (
    <div className="recipe-page">
      <form onSubmit={handleSubmit}>
        <div className="recipe-header">
          <input
            type="text"
            name="title"
            value={newRecipe.title}
            onChange={handleInputChange}
            className="recipe-title-edit"
            placeholder="Название рецепта"
            required
          />
          <div className="recipe-description">
            <input
              type="text"
              name="description"
              value={newRecipe.description}
              onChange={handleInputChange}
              className="recipe-description-edit"
              placeholder="Краткое описание"
              required
            />
          </div>
          
          <div className="recipe-meta">
            <div>
              <label>Сложность: </label>
              <select
                name="difficulty"
                value={newRecipe.difficulty}
                onChange={handleInputChange}
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label>Время приготовления (мин): </label>
              <input
                type="number"
                name="cooking_time_minutes"
                value={newRecipe.cooking_time_minutes}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
          </div>
        </div>

        <div className="recipe-content">
          <div className="recipe-image-and-author">
            <div className="recipe-image-placeholder">
              <span>Изображение рецепта (можно добавить позже)</span>
            </div>
            <div className="recipe-author">
              <span>Автор: {currentUser.username}</span>
            </div>
          </div>
          
          <div className="recipe-details">
            <h2>Ингредиенты</h2>
            <div className="ingredients-edit">
              {newRecipe.ingredients.map((ingredient, index) => (
                <input
                  key={index}
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientsChange(index, e.target.value)}
                  placeholder="Ингредиент"
                  required
                />
              ))}
              <div className="ingredients-buttons">
                <button 
                  type="button"
                  onClick={() => setNewRecipe(prev => ({
                    ...prev,
                    ingredients: [...prev.ingredients, '']
                  }))}
                >
                  +
                </button>
                <button 
                  type="button"
                  onClick={() => setNewRecipe(prev => ({
                    ...prev,
                    ingredients: prev.ingredients.length > 1 
                      ? prev.ingredients.slice(0, -1) 
                      : prev.ingredients
                  }))}
                  disabled={newRecipe.ingredients.length <= 1}
                >
                  -
                </button>
              </div>
            </div>
            
            <h2>Инструкции</h2>
            <textarea
              name="steps"
              value={newRecipe.steps}
              onChange={handleInputChange}
              className="steps-edit"
              placeholder="Подробное описание процесса приготовления..."
              required
            />
            <ReactMarkdown>{newRecipe.steps}</ReactMarkdown>
          </div>
        </div>

        <div className="recipe-edit-actions">
          <button type="submit" className="save-button">
            Создать рецепт
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateRecipe;