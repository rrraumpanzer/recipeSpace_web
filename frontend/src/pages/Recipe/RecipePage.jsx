import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetRecipeQuery, useUpdateRecipeMutation, useDeleteRecipeMutation, useUploadRecipeImageMutation } from '../../api/recipeApi';
import { useGetUserQuery, useUploadAvatarMutation } from '../../api/userApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import './RecipePage.css';

function RecipePage() {
  let navigate = useNavigate();
  const { recipe_id } = useParams();
  const { data: recipe, isLoading, isError } = useGetRecipeQuery(recipe_id);
  const { data: author } = useGetUserQuery(recipe?.author_id, { skip: !recipe?.author_id });
  const currentUser = useSelector(selectCurrentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadRecipeImage] = useUploadRecipeImageMutation();
  const [updateRecipe] = useUpdateRecipeMutation();
  const [deleteRecipe] = useDeleteRecipeMutation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  // Состояние для редактирования
  const [editedRecipe, setEditedRecipe] = useState({
    title: '',
    description: '',
    tags: [],
    ingredients: [],
    steps: '',
    cooking_time_minutes: 0,
    difficulty: 0,
  });

  // Инициализация состояния редактирования при загрузке рецепта
  useState(() => {
    if (recipe) {
      setEditedRecipe({
        title: recipe.title,
        description: recipe.description,
        tags: [...recipe.tags],
        ingredients: [...recipe.ingredients],
        steps: recipe.steps,
        cooking_time_minutes: recipe.cooking_time_minutes,
        difficulty: recipe.difficulty,
      });
    }
  }, [recipe]);

  if (isLoading) return <div>Загрузка рецепта...</div>;
  if (isError) return <div>Ошибка загрузки рецепта</div>;
  if (!recipe) return <div>Рецепт не найден</div>;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/src/assets/recipeSpaceIco.svg';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:8000${imagePath}`;
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

  const handleEditClick = () => {
    setIsEditing(true);
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

  const handleSaveClick = async () => {
    try {
      if (selectedFile) {
        await uploadRecipeImage({ 
          recipeId: recipe_id, 
          file: selectedFile 
        }).unwrap();
      }
      
      await updateRecipe({
        recipeId: recipe_id,
        recipeData: editedRecipe
      }).unwrap();
      
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при обновлении рецепта:', error);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    // Восстановление исходных значений
    setEditedRecipe({
      title: recipe.title,
      description: recipe.description,
      ingredients: [...recipe.ingredients],
      steps: recipe.steps,
      cooking_time_minutes: recipe.cooking_time_minutes,
      difficulty: recipe.difficulty,
    });
  };
  const handleDeleteClick = async () => {
      if (window.confirm('Вы уверены, что хотите удалить данный рецепт? Это действие нельзя отменить.')) {
        try {
          await deleteRecipe(recipe.id).unwrap();
          navigate('/', { replace: true })
        } catch (error) {
          console.error('Ошибка при удалении рецепта:', error);
        }
      }
    };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedRecipe(prev => ({ ...prev, [name]: value }));
  };

  const handleIngredientsChange = (index, value) => {
    const newIngredients = [...editedRecipe.ingredients];
    newIngredients[index] = value;
    setEditedRecipe(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const isAuthor = currentUser && recipe.author_id === currentUser.id;

  return (
    <div className="recipe-page">
      <div className="recipe-page-header">
        {isEditing ? (
          <input
            type="text"
            name="title"
            value={editedRecipe.title}
            onChange={handleInputChange}
            className="recipe-title-edit"
          />
        ) : (
          <h1>{recipe.title}</h1>
        )}
      <div className="recipe-description">
        {isEditing ? (
          <input
            type="text"
            name="description"
            value={editedRecipe.description}
            onChange={handleInputChange}
            className="recipe-description-edit"
          />
        ) : (
          <h3>{recipe.description}</h3>
        )}
      </div>
        
        <div className="recipe-meta">
          {isEditing ? (
            <div>
              <label>Сложность: </label>
              <select
                name="difficulty"
                value={editedRecipe.difficulty}
                onChange={handleInputChange}
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          ) : (
            renderDifficulty(recipe.difficulty)
          )}
          
          {isEditing ? (
            <div>
              <label>Время приготовления (мин): </label>
              <input
                type="number"
                name="cooking_time_minutes"
                value={editedRecipe.cooking_time_minutes}
                onChange={handleInputChange}
              />
            </div>
          ) : (
            <span>Время приготовления: {recipe.cooking_time_minutes} мин</span>
          )}

            <div>
            <span>В избранном: {recipe.likes_count}</span>
            </div>
        </div>
      </div>

      {/* Плашка с автором */}
      
      
      <div className="recipe-content">
        <div className="recipe-image-and-author">
          <img 
            src={getImageUrl(recipe.image)} 
            alt={recipe.title}
            onError={(e) => {
              e.target.src = '/src/assets/recipeSpaceIco.svg';
            }}
          />
          {isEditing && (
            <div className="recipe-image-upload">
              <input
                type="file"
                id="recipe-image-upload"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="recipe-image-upload" className="upload-button">
                Загрузить новую обложку
              </label>
            </div>
          )}
            {author && (
              <div className="recipe-author">
                <Link to={`/user/${author.id}`} className="username-link">
                <span>Автор: {author.username}</span>
                </Link>

                {isAuthor && !isEditing && (
                  <button onClick={handleEditClick} className="edit-recipe-button">
                    Редактировать рецепт
                  </button>
                )}
                {isAuthor && (
                <button onClick={handleDeleteClick} className="delete-recipe-button">
                    Удалить рецепт
                  </button>
                )}
              </div>
        )}
        </div>
        
        <div className="recipe-details">
          <h2>Ингредиенты</h2>
          {isEditing ? (
            <div className="ingredients-edit">
              {editedRecipe.ingredients.map((ingredient, index) => (
                <input
                  key={index}
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientsChange(index, e.target.value)}
                />
              ))}
              <div className="ingredients-buttons">
                <button 
                  onClick={() => setEditedRecipe(prev => ({
                    ...prev,
                    ingredients: [...prev.ingredients, '']
                  }))}
                >
                  +
                </button>
                <button 
                  onClick={() => setEditedRecipe(prev => ({
                    ...prev,
                    ingredients: prev.ingredients.length > 1 
                      ? prev.ingredients.slice(0, -1) 
                      : prev.ingredients
                  }))}
                  disabled={editedRecipe.ingredients.length <= 1}
                >
                  -
                </button>
              </div>
            </div>
          ) : (
            <ul>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          )}
          
          <h2>Инструкции</h2>
          {isEditing ? (
            <textarea
              name="steps"
              value={editedRecipe.steps}
              onChange={handleInputChange}
              className="steps-edit"
            />
          ) : (
            <ReactMarkdown>{recipe.steps}</ReactMarkdown>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="recipe-edit-actions">
          <button onClick={handleSaveClick} className="save-button">
            Сохранить
          </button>
          <button onClick={handleCancelClick} className="cancel-button">
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}

export default RecipePage;