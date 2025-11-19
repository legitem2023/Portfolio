import { createSlice } from '@reduxjs/toolkit';

// Load initial state from localStorage if available
const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    const savedCategory = localStorage.getItem('categoryFilter');
    return {
      searchTerm: '',
      categoryFilter: savedCategory || '',
      sortBy: 'Sort by: Featured',
    };
  }
  return {
    searchTerm: '',
    categoryFilter: '',
    sortBy: 'Sort by: Featured',
  };
};

const searchSlice = createSlice({
  name: 'search',
  initialState: loadInitialState(),
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setCategoryFilter: (state, action) => {
      state.categoryFilter = action.payload;
      // Save to localStorage whenever category changes
      if (typeof window !== 'undefined') {
        localStorage.setItem('categoryFilter', action.payload);
      }
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    clearAllFilters: (state) => {
      state.searchTerm = '';
      state.categoryFilter = '';
      state.sortBy = 'Sort by: Featured';
      // Also clear from localStorage when clearing all filters
      if (typeof window !== 'undefined') {
        localStorage.removeItem('categoryFilter');
      }
    },
    // Optional: Add a dedicated action to clear just the category
    clearCategoryFilter: (state) => {
      state.categoryFilter = '';
      if (typeof window !== 'undefined') {
        localStorage.removeItem('categoryFilter');
      }
    },
  },
});

export const { 
  setSearchTerm, 
  setCategoryFilter, 
  setSortBy, 
  clearAllFilters,
  clearCategoryFilter 
} = searchSlice.actions;
export default searchSlice.reducer;
