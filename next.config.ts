//next.config.ts

import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
        },
      },
    },
    {
      urlPattern: /\.(?:css|js)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    {
      // Cachea llamadas a la API
      urlPattern: /^\/api\/.*$/i,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 día
        },
        networkTimeoutSeconds: 5,
      },
    },
    {
      // Cachea páginas dentro de /dashboard
      urlPattern: /^\/dashboard\/?.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "dashboard-pages",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 24 * 60 * 60, // 1 día
        },
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

// Step 1: Define your base config
const baseConfig: NextConfig = {
  basePath: "",
  reactStrictMode: true,
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true, // Enable SWC minification for improved performance
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development", // Remove console.log in production
  },
};

// Step 2: Compose both plugins
export default withPWA(withFlowbiteReact(baseConfig));
