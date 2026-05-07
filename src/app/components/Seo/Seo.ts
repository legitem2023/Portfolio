// lib/seo.ts
import type { Metadata, Viewport } from 'next';

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
    'telegram:channel': '@VendorCity', // Replace with your actual channel if you have one
    'telegram:bot': '@VendorCity_bot', // Replace with your bot if you have one
    
    // Additional social media meta tags
    'og:type': 'website',
    'og:site_name': 'VendorCity',
    
    // For better in-app browser handling
    'fb:app_id': '', // Add your Facebook app ID if you have one
    'twitter:site': '@VendorCity',
    
    // PWA related
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'VendorCity',
    
    // Force link handling in external browser
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
    // Add these for better display
    locale: 'en_US',
    alternateLocale: ['fil_PH'], // Adding Filipino locale if needed
  },

  twitter: {
    card: 'summary_large_image',
    title: 'VC - VendorCity | Shop Smarter with VendorCity.net',
    description: 'Discover a smarter way to shop online with VendorCity — your trusted VendorCity. Explore top brands, unbeatable deals, and fast checkout on VendorCity.net',
    images: ['/og-image.jpg'],
    creator: '@robertmarquez',
    site: '@VendorCity',
  },

  // Add robots meta
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

  // Add alternates for multi-language
  alternates: {
    canonical: 'https://VendorCity.net',
    languages: {
      'en-US': 'https://VendorCity.net',
      'fil': 'https://VendorCity.net/fil', // If you have Filipino version
    },
  },

  // Add verification codes if needed
  verification: {
    google: '', // Add your Google verification code
    yandex: '', // Add your Yandex verification code
  },

  // Add category
  category: 'ecommerce',
};

// 👇 Define viewport object
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Add viewport-fit for iOS notches
  viewportFit: 'cover',
};
