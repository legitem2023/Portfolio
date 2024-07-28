import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./media1080px.css"
import "./media600px.css"

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
          <source src="https://static.vecteezy.com/system/resources/previews/002/019/901/mp4/matrix-digital-background-free-video.mp4" type="video/mp4"/>
        </video>
        <div className="BackGroundImage"></div>
        {children}
        </body>
    </html>
  );
}
