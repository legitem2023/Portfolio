//"use client";
import { metadata as baseMetadata, viewport as baseViewport } from './components/Seo/Seo';
import ReduxWrapper from "./components/ApolloProvider/ReduxWrapper"; 
import PWAInitializer from "./components/PWAInitializer";
import InstallPWAButton from './components/InstallPWAButton';

import { ApolloWrapper } from './components/ApolloWrapper';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Inter } from "next/font/google";
import LoadEruda from "./LoadEruda";
import "./globals.css";
import "./styles/messaging.css";

// ✅ Import SessionProvider from NextAuth
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = baseMetadata;
export const viewport = baseViewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LoadEruda/>
        <div className="BackGroundImage"></div>
        <PWAInitializer/>
        {/* ✅ Wrap with SessionProvider */}
        <SessionProvider>
          <ReduxWrapper>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
            <ApolloWrapper>{children}</ApolloWrapper>
          </ReduxWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
