//next.config.ts
import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const normalizeBasePath = (basePath: string): string => {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");
const basePathRegexPrefix = basePath ? escapeRegex(basePath) : "";

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
      urlPattern: new RegExp(`^${basePathRegexPrefix}/api/.*$`, "i"),
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
      urlPattern: new RegExp(`^${basePathRegexPrefix}/dashboard/?.*`, "i"),
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
  basePath,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    // Strip console.log in production but keep error/warn: they are the
    // server's only error and security log (failed logins, auth errors).
    removeConsole:
      process.env.NODE_ENV !== "development"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // camera: barcode scanning from the phone browser
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

// Step 2: Compose both plugins
export default withPWA(withFlowbiteReact(baseConfig));
