/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // 1. ПРИОРИТЕТ: Программный код (Immortality)
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-assets',
        expiration: {
          maxEntries: 2000,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // 2. ПРИОРИТЕТ: Аудио-атомы (The Fuel)
      urlPattern: /\.(?:ogg|mp3|wav|m4a)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'audio-assets',
        expiration: {
          maxEntries: 2000,
          maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // 3. ПРИОРИТЕТ: Манифесты и JSON (The Map)
      urlPattern: /\.(?:json)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-json-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // 4. HTML Страницы (The Shell)
      urlPattern: /\/($|home|aura-groove|hypercube-dashboard|timbre-lab)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    }
  ]
});

const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
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
};

module.exports = withPWA(nextConfig);
