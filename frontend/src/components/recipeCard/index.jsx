import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { addFavorite, removeFavorite } from '../../store/slices/recipesSlice';

function RecipeCard({ recipe }) {
  const dispatch = useDispatch();
  const history = useHistory();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const handleCardClick = () => {
    history.push(`/recipe/${recipe.id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      history.push('/auth');
      return;
    }
    if (recipe.isFavorite) {
      dispatch(removeFavorite(recipe.id));
    } else {
      dispatch(addFavorite(recipe.id));
    }
  };

  return (
    <div className="recipe-card" onClick={handleCardClick}>
      <img src={recipe.image} alt={recipe.title} />
      <h3>{recipe.title}</h3>
      <p>{recipe.description}</p>
      <button onClick={handleFavoriteClick}>
        {recipe.isFavorite ? '❤️' : '🤍'}
      </button>
    </div>
  );
}

export default RecipeCard;