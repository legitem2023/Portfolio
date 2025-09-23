// store/features/activePostIdSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ActivePostIdState {
  value: string | null;
}

const initialState: ActivePostIdState = {
  value: null,
};

export const activePostIdSlice = createSlice({
  name: 'activePostId',
  initialState,
  reducers: {
    setActivePostId: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
    resetActivePostId: (state) => {
      state.value = null;
    },
  },
});

export const { setActivePostId, resetActivePostId } = activePostIdSlice.actions;
export default activePostIdSlice.reducer;
