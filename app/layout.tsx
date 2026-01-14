import React from "react";
import { ThemeModeScript } from "flowbite-react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { Providers } from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventario INADEH",
  description: "It's a simple progressive web application made with NextJS",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["nextjs", "next14", "pwa", "next-pwa"],
  authors: [
    {
      name: "fdemberla",
      url: "https://www.linkedin.com/in/fdemberla/",
    },
  ],
  icons: [
    { rel: "apple-touch-icon", url: "/icons/icons-128.png" },
    { rel: "icon", url: "/icons/icons-128.png" },
    { rel: "icon", url: "/icons/icons-192.png" },
    { rel: "icon", url: "/icons/icons-256.png" },
    { rel: "icon", url: "/icons/icons-512.png" },
  ],
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  shrinkToFit: "no",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-brand-gris dark:bg-gray-900`}
      >
        <Providers>
          <ThemeModeScript />
          {children}
          <Toaster />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
