import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem } from "../types";

interface CartState {
  cartItems: CartItem[];
}

const initialState: CartState = {
  cartItems: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem:any = state.cartItems.find(
        (item) => item.id.toString() === action.payload.id.toString()
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.cartItems.push({ ...action.payload, quantity: 1 });
      }
    },

    removeFromCart: (state, action: PayloadAction<{ id: string | number }>) => {
      state.cartItems = state.cartItems.filter(
        (item) => item.id.toString() !== action.payload.id.toString()
      );
    },

    clearCart: (state) => {
      state.cartItems = [];
    },

    changeQuantity: (
      state,
      action: PayloadAction<{ id: string | number; quantity: number }>
    ) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((item) => item.id.toString() === id.toString());

      if (item && quantity > 0) {
        item.quantity = quantity;
      }
    },
  },
});

export const { addToCart, removeFromCart, clearCart, changeQuantity } =
  cartSlice.actions;

export default cartSlice.reducer;
