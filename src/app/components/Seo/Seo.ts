// lib/seo.ts
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'DVN - Digital Vendors Network | Shop Smarter with DVN.com',
  description:
    'Discover a smarter way to shop online with DVN — your trusted digital vendors network. Explore top brands, unbeatable deals, and fast checkout on DVN.com.',
  manifest: '/manifest.json',
  keywords: [
    'DVN',
    'Digital Vendors Network',
    'dvn.com',
    'e-commerce',
    'online shopping',
    'shop online',
    'buy products',
    'digital marketplace',
    'online store',
  ],
  authors: [{ name: 'Robert Marquez', url: 'https://github.com/robertmarquez' }],

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },

  metadataBase: new URL('https://dvn.com'),

  other: {
    'format-detection': 'telephone=no',
    'theme-color': '#0F172A',
    'msapplication-TileColor': '#0F172A',
  },

  openGraph: {
    type: 'website',
    title: 'DVN - Digital Vendors Network | Shop Smarter with DVN.com',
    description:
      'DVN.com brings you closer to thousands of trusted digital vendors. Shop, compare, and buy online — all in one smart network.',
    url: 'https://dvn.com',
    siteName: 'DVN',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DVN - Digital Vendors Network | Online Shopping Platform',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'DVN - Digital Vendors Network | Shop Smarter with DVN.com',
    description:
      'Shop with DVN.com — your digital marketplace for top brands and trusted online vendors. Fast, easy, and secure shopping experience.',
    images: ['/og-image.jpg'],
    creator: '@dvn_official',
  },
};

// Viewport settings for responsive design
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};
