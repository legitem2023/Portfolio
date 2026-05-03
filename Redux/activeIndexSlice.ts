// store/features/activeIndexSlice.ts
/*import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
*/
// store/features/activeIndexSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ActiveIndexState {
  value: number;
  previousValue: number | null; // Add this
}

const initialState: ActiveIndexState = {
  value: 1,
  previousValue: null,
};

export const activeIndexSlice = createSlice({
  name: 'activeIndex',
  initialState,
  reducers: {
    setActiveIndex: (state, action: PayloadAction<number>) => {
      // Save current value as previous before updating
      state.previousValue = state.value;
      state.value = action.payload;
    },
    restorePreviousIndex: (state) => {
      if (state.previousValue !== null) {
        state.value = state.previousValue;
        state.previousValue = null; // Clear after restoring
      }
    },
    resetActiveIndex: (state) => {
      state.value = 1;
      state.previousValue = null;
    },
  },
});

export const { setActiveIndex, restorePreviousIndex, resetActiveIndex } = activeIndexSlice.actions;
export default activeIndexSlice.reducer;
