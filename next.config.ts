// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental flag if not needed for other features
  // experimental: {
  //   turbo: {
  //     // Turbopack configuration if needed
  //   },
  // },
  
  // API rewrites for local development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*', // Your backend URL
      },
    ];
  },

  // Security headers for API proxies
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' }, // Specific to your frontend
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },

  // Optional: Enable if you need to troubleshoot Turbopack
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     };
  //   }
  //   return config;
  // },
};

export default nextConfig;