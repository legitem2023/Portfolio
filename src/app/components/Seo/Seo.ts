// lib/seo.ts
import type { Metadata, Viewport } from 'next'; // Import Viewport type

export const metadata: Metadata = {
  title: 'Motogo - We move what matters',
  description: 'Motogo is a modern logistics platform connecting senders, couriers, and recipients with real-time delivery tracking, seamless route management, and smart geolocation services.',
  manifest: '/manifest.json',
  keywords: [
    'motogo',
    'Logistics',
    'Delivery',
    'Courier Service',
    'Shipping',
    'Real-time Tracking',
    'Transport',
    'Route Optimization',
    'Pickup and Dropoff',
    'Philippine Logistics',
  ],
  authors: [{ name: 'Robert Marquez', url: 'https://github.com/robertmarquez' }],
  
  // REMOVED: viewport property

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },

  metadataBase: new URL('https://logisticfrontend.vercel.app'),

  other: {
    'format-detection': 'telephone=no',
    'theme-color': '#0F172A',
    'msapplication-TileColor': '#0F172A',
  },

  openGraph: {
    type: 'website',
    title: 'Motogo - We move what matters',
    description: 'Motogo connects deliveries with precision and speed. Monitor real-time routes, schedule pickups, and streamline logistics with ease.',
    url: 'https://logisticfrontend.vercel.app',
    siteName: 'Motogo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Motogo - Real-time Delivery and Logistics Platform',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Motogo - We move what matters',
    description: 'Real-time delivery management and logistics made simple and reliable with Adiviso.',
    images: ['/og-image.jpg'],
    creator: 'robertsancomarquez1988@gmail.com',
  },
};

// Add a separate viewport export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};
