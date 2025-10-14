import { metadata as baseMetadata, viewport as baseViewport } from './components/Seo/Seo'; // Import both

import ReduxWrapper from "./components/ApolloProvider/ReduxWrapper"; 
import { ApolloWrapper } from './components/ApolloWrapper';
// ✅ Toastify import
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Inter } from "next/font/google";
import LoadEruda from "./LoadEruda";
import "./globals.css";
import "./styles/messaging.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata = baseMetadata;
export const viewport = baseViewport; // Add viewport export


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
        <ReduxWrapper>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
          <ApolloWrapper>{children}</ApolloWrapper>
        </ReduxWrapper>
      </body>
    </html>
  );
}
