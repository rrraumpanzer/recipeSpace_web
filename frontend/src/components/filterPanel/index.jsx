import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery, setCategory } from '../../store/slices/filterSlice';

function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);

  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleCategoryChange = (e) => {
    dispatch(setCategory(e.target.value));
  };

  return (
    <div className="filter-panel">
      <input
        type="text"
        placeholder="Поиск рецептов..."
        value={filters.searchQuery}
        onChange={handleSearchChange}
      />
      <select value={filters.category} onChange={handleCategoryChange}>
        <option value="">Все категории</option>
        <option value="breakfast">Завтрак</option>
        <option value="lunch">Обед</option>
        <option value="dinner">Ужин</option>
        <option value="dessert">Десерты</option>
      </select>
    </div>
  );
}

export default FilterPanel;