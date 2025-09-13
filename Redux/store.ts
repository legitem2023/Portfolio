'use client'
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import activeIndexReducer from './activeIndexSlice';
// Persist configuration for activeIndex only
const activeIndexPersistConfig = {
  key: 'activeIndex',
  storage
};

// Only persist the activeIndex reducer
const persistedActiveIndexReducer = persistReducer(activeIndexPersistConfig, activeIndexReducer);

// Configure store
export const store = configureStore({
  reducer: {
    activeIndex: persistedActiveIndexReducer, // Only this one is persisted 
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
