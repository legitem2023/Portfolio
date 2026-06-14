import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the possible order status types
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'SHIPPED' | 'CANCELED';

interface OrderStatusState {
  value: OrderStatus;
  previousValue: OrderStatus | null;
}

const initialState: OrderStatusState = {
  value: 'PENDING',
  previousValue: null,
};

export const orderStatusSlice = createSlice({
  name: 'orderStatus',
  initialState,
  reducers: {
    setOrderStatus: (state, action: PayloadAction<OrderStatus>) => {
      // Save current value as previous before updating
      state.previousValue = state.value;
      state.value = action.payload;
    },
    restorePreviousStatus: (state) => {
      if (state.previousValue !== null) {
        state.value = state.previousValue;
        state.previousValue = null; // Clear after restoring
      }
    },
    resetOrderStatus: (state) => {
      state.value = 'PENDING';
      state.previousValue = null;
    },
  },
});

export const { setOrderStatus, restorePreviousStatus, resetOrderStatus } = orderStatusSlice.actions;
export default orderStatusSlice.reducer;
