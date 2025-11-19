import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchTerm: '',
  categoryFilter: '',
  sortBy: 'Sort by: Featured',
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setCategoryFilter: (state, action) => {
      state.categoryFilter = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    clearAllFilters: (state) => {
      state.searchTerm = '';
      state.categoryFilter = '';
      state.sortBy = 'Sort by: Featured';
    },
  },
});

export const { setSearchTerm, setCategoryFilter, setSortBy, clearAllFilters } = searchSlice.actions;
export default searchSlice.reducer;
