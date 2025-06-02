/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Updated configuration for Socket.IO
  serverExternalPackages: ['socket.io'],

  // Webpack configuration for Socket.IO client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // CORS headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value:
              process.env.NODE_ENV === 'production'
                ? 'https://www.quickna.com.br'
                : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
