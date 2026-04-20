// store/features/selectedUserSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectedUserState {
  value: string;
}

const initialState: SelectedUserState = {
  value: '',
};

export const selectedUserSlice = createSlice({
  name: 'selectedUser',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
    resetSelectedUser: (state) => {
      state.value = '';
    },
  },
});

export const { setSelectedUser, resetSelectedUser } = selectedUserSlice.actions;
export default selectedUserSlice.reducer;
