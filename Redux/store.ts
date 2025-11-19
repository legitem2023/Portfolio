'use client'
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import activeIndexReducer from './activeIndexSlice';
import cartReducer from './cartSlice'; // Import your cart reducer
import activePostIdReducer from './activePostIdSlice';
import searchReducer from './searchSlice';

// Persist configuration for activeIndex
const activeIndexPersistConfig = {
  key: 'activeIndex',
  storage
};

const activePostPersistConfig = {
  key: 'activePostId',
  storage
};

// Persist configuration for cart
const cartPersistConfig = {
  key: 'cart',
  storage
};

// Create persisted reducers
const persistedActiveIndexReducer = persistReducer(activeIndexPersistConfig, activeIndexReducer);
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedPostIdReducer = persistReducer(activePostPersistConfig, activePostIdReducer);

// Configure store
export const store = configureStore({
  reducer: {
    activeIndex: persistedActiveIndexReducer,
    cart: persistedCartReducer, // Add the cart reducer
    activePostId:persistedPostIdReducer,
    search:searchReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);
export default store;
