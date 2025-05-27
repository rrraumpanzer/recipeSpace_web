import { useParams } from 'react-router-dom';
import { useGetRecipeQuery } from '../../api/recipeApi';
import ReactMarkdown from 'react-markdown';
import './RecipePage.css';

function RecipePage() {
  const { recipe_id } = useParams();
  const { data: recipe, isLoading, isError } = useGetRecipeQuery(recipe_id);

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

  return (
    <div className="recipe-page">
      <div className="recipe-header">
        <h1>{recipe.title}</h1>
        <div className="recipe-meta">
          {renderDifficulty(recipe.difficulty)}
          <span>Время приготовления: {recipe.cooking_time_minutes} мин</span>
        </div>
      </div>
      
      <div className="recipe-content">
        <div className="recipe-image">
          <img 
            src={getImageUrl(recipe.image)} 
            alt={recipe.title}
            onError={(e) => {
              e.target.src = '/src/assets/recipeSpaceIco.svg';
            }}
          />
        </div>
        
        <div className="recipe-details">
          <h2>Ингредиенты</h2>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
          
          <h2>Инструкции</h2>
          <ReactMarkdown>{recipe.steps}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default RecipePage;