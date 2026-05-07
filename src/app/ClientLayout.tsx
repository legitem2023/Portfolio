"use client";

import ReduxWrapper from "./components/ApolloProvider/ReduxWrapper";
import PWAInitializer from "./components/PWAInitializer";
import InstallPWAButton from './components/InstallPWAButton';
import { ApolloWrapper } from './components/ApolloWrapper';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadEruda from "./LoadEruda";
import { SessionProvider } from "next-auth/react";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <LoadEruda />
      <div className="BackGroundImage"></div>
      <PWAInitializer />
      <SessionProvider>
        <ReduxWrapper>
          <ToastContainer 
            position="top-right" 
            autoClose={3000} 
            hideProgressBar={false} 
            newestOnTop 
          />
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </ReduxWrapper>
      </SessionProvider>
    
    </>
  );
}
