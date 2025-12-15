/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hokei-storage.s3.ap-northeast-1.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: '192.168.100.86',
      },
      {
        protocol: 'https',
        hostname: '**', // Allows all other HTTPS domains 
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // React configuration
  reactStrictMode: true,
  
  // Compress responses
  compress: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      }
    ]
  },
  
  // Remove the X-Powered-By header for security
  poweredByHeader: false,
  
  // Enable SWC minification (faster builds)
  swcMinify: true,
}

module.exports = nextConfig
