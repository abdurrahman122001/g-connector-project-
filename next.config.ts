// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Reduce hydration mismatch from browser extensions
  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60, // 1 hour
  },

  // API rewrites for backend proxy
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5001/api/:path*", // Your backend URL
      },
    ];
  },

  // CORS headers for backend API
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
};

// ✅ ESM export for Next.js 13–15
export default nextConfig;
