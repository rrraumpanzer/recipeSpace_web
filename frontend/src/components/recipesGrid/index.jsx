import { useSelector } from 'react-redux';
import { recipesAdapter } from '../../store/slices/recipesSlice';
import RecipeCard from '../RecipeCard';

const recipeSelectors = recipesAdapter.getSelectors((state) => state.recipes);

function RecipeGrid() {
  const recipes = useSelector(recipeSelectors.selectAll);
  const filters = useSelector((state) => state.filters);

  const filteredRecipes = recipes.filter((recipe) => {
    return recipe.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
      (!filters.category || recipe.category === filters.category);
  });

  return (
    <div className="recipe-grid">
      {filteredRecipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}

export default RecipeGrid;