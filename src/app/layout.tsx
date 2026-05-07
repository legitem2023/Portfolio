import { metadata as baseMetadata, viewport as baseViewport } from './components/Seo/Seo';
import ClientLayout from './ClientLayout';
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/messaging.css";

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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
