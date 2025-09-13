// store/features/activeIndexSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ActiveIndexState {
  value: number;
}

const initialState: ActiveIndexState = {
  value: 1,
};

export const activeIndexSlice = createSlice({
  name: 'activeIndex',
  initialState,
  reducers: {
    setActiveIndex: (state, action: PayloadAction<number>) => {
      state.value = action.payload;
    },
    resetActiveIndex: (state) => {
      state.value = 1;
    },
  },
});

export const { setActiveIndex, resetActiveIndex } = activeIndexSlice.actions;
export default activeIndexSlice.reducer;
