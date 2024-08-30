import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./media1080px.css"
import "./media600px.css"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Robert Marquez",
  description: "Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <video autoPlay muted loop id="background-video">
          <source src="./matrix-digital-background-free-video.mp4" type="video/mp4"/>
        </video>
        <div className="BackGroundImage"></div>
        {children}
        <ToastContainer />
        </body>
    </html>
  );
}
