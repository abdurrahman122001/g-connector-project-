// next.config.js
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove or properly set basePath - empty string or a path starting with /
  // basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', // Use empty string instead of '/'

  // Rewrite API calls to your separate backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*', // Directly specify your backend URL
      },
    ];
  },

  // Security headers (recommended for API proxies)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },

  // Environment variables exposed to browser
  // env: {
  //   NEXT_PUBLIC_API_BASE_URL: '/api',
  // },
  experimental: {
    allowedDevOrigins: ['https://gass.ajhiveprojects.com', 'http://localhost:3000'], // Replace with your actual accessing origin
    
  },


};

export default nextConfig;