// store/slices/modifyProductSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModifyProduct, ProductVariant } from '../types';

const initialState: ModifyProduct = {
  name: "",
  description: "",
  price: "",
  color: "",
  size: "",
  salePrice: "",
  sku: "",
  stock: "",
  categoryId: "",
  brand: "",
  isActive: true,
  featured: false,
  variants: [],
};

const modifyProductSlice = createSlice({
  name: 'modifyProduct',
  initialState,
  reducers: {
    // Initialize with product data (for editing)
    initializeProduct: (state, action: PayloadAction<Partial<ModifyProduct>>) => {
      return { ...state, ...action.payload };
    },

    // Update single field
    updateField: <K extends keyof ModifyProduct>(
      state: ModifyProduct,
      action: PayloadAction<{ field: K; value: ModifyProduct[K] }>
    ) => {
      const { field, value } = action.payload;
      state[field] = value;
    },

    // Update multiple fields at once
    updateProduct: (state, action: PayloadAction<Partial<ModifyProduct>>) => {
      return { ...state, ...action.payload };
    },

    // Variant management
    addVariant: (state, action: PayloadAction<ProductVariant>) => {
      state.variants.push(action.payload);
    },

    updateVariant: (
      state,
      action: PayloadAction<{ index: number; variant: Partial<ProductVariant> }>
    ) => {
      const { index, variant } = action.payload;
      state.variants[index] = { ...state.variants[index], ...variant };
    },

    removeVariant: (state, action: PayloadAction<number>) => {
      state.variants.splice(action.payload, 1);
    },

    // Image management
    addImage: (state, action: PayloadAction<string>) => {
      if (!state.images) state.images = [];
      state.images.push(action.payload);
    },

    removeImage: (state, action: PayloadAction<number>) => {
      if (state.images) {
        state.images.splice(action.payload, 1);
      }
    },

    // Reset to initial state
    resetProduct: (state) => {
      return initialState;
    },

    // Clear specific fields
    clearFields: (state, action: PayloadAction<Array<keyof ModifyProduct>>) => {
      action.payload.forEach(field => {
        if (field in initialState) {
          (state[field] as any) = initialState[field];
        }
      });
    },
  },
});

export const {
  initializeProduct,
  updateField,
  updateProduct,
  addVariant,
  updateVariant,
  removeVariant,
  addImage,
  removeImage,
  resetProduct,
  clearFields,
} = modifyProductSlice.actions;

export default modifyProductSlice.reducer;
