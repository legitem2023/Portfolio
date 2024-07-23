/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['192.168.100.86','hokei-storage.s3.ap-northeast-1.amazonaws.com'],
    },
  };
  
  // Export directly in ES module syntax
  export default nextConfig;
  