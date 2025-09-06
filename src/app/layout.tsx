import type { Metadata } from "next";
import { ApolloWrapper } from './components/ApolloWrapper';
import { Inter } from "next/font/google";
import "./globals.css";
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
        <div className="BackGroundImage"></div>
        <ApolloWrapper>{children}</ApolloWrapper>
        </body>
    </html>
  );
}
