// lib/seo.ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VC -  VendorCity | Shop Smarter with VendorCity.net',
  description:'Discover a smarter way to shop online with VendorCity — your trusted VendorCity. Explore top brands, unbeatable deals, and fast checkout on VendorCity.net',
  manifest: '/manifest.json',
  keywords: [
    'VendorCity',
    'Vendor',
    'City',
    'e-commerce',
    'online shopping',
    'shop online',
    'buy products',
    'online store',
  ],
  authors: [{ name: 'Robert Marquez', url: 'https://github.com/robertmarquez' }],

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },

  metadataBase: new URL('https://VendorCity.net'),

  other: {
    'format-detection': 'telephone=no',
    'theme-color': '#0F172A',
    'msapplication-TileColor': '#0F172A',
  },

  openGraph: {
    type: 'website',
    title: 'VC -  VendorCity | Shop Smarter with VendorCity.net',
    description:'Discover a smarter way to shop online with VendorCity — your trusted VendorCity. Explore top brands, unbeatable deals, and fast checkout on VendorCity.net',
    url: 'https://VendorCity.net',
    siteName: 'VendorCity',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VC -  VendorCity | Shop Smarter with VendorCity.net',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'VC -  VendorCity | Shop Smarter with VendorCity.net',
    description:'Discover a smarter way to shop online with VendorCity — your trusted VendorCity. Explore top brands, unbeatable deals, and fast checkout on VendorCity.net',
    images: ['/og-image.jpg'],
    creator: '@robertmarquez',
  },
};

// 👇 Define viewport object without the type import
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};
