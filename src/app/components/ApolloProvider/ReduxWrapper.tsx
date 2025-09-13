'use client'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../../../../Redux/store'; // Import both store and persistor
import React from 'react'
import { Apollo } from './Apollo';

export default function ReduxWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Apollo>{children}</Apollo>
      </PersistGate>
    </Provider>
  );
}
