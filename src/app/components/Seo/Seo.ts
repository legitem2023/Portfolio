// app/components/Seo/Seo.ts
import type { Metadata } from 'next';

// Remove the Viewport import and define it separately
export const metadata: Metadata = {
  title: 'VC - VendorCity | Shop Smarter with VendorCity.net',
  description: 'Discover a smarter way to shop online with VendorCity — your trusted VendorCity. Explore top brands, unbeatable deals, and fast checkout on VendorCity.net',
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
    
    // Telegram specific meta tags
    'telegram:domain': 'VendorCity.net',
    'telegram:channel': '@VendorCity',
    'telegram:bot': '@VendorCity_bot',
    'telegram:open-in-external': 'true',
    
    // Additional meta for better in-app handling
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'VendorCity',
    
    // Force external links
    'referrer': 'no-referrer-when-downgrade',
  },

  openGraph: {
    type: 'website',
    title: 'VC - VendorCity | Shop Smarter with VendorCity.net',
    description: 'Discover a smarter way to shop online with VendorCity — your trusted VendorCity. Explore top brands, unbeatable deals, and fast checkout on VendorCity.net',
    url: 'https://VendorCity.net',
    siteName: 'VendorCity',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VC - VendorCity | Shop Smarter with VendorCity.net',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['fil_PH'],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'VC - VendorCity | Shop Smarter with VendorCity.net',
    description: 'Discover a smarter way to shop online with VendorCity — your trusted VendorCity. Explore top brands, unbeatable deals, and fast checkout on VendorCity.net',
    images: ['/og-image.jpg'],
    creator: '@robertmarquez',
    site: '@VendorCity',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://VendorCity.net',
  },

  category: 'ecommerce',
};

// Use a regular object instead of Viewport type
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};
