/** @type {import('prettier').Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  // tailwindcss
  // Tailwind v4: tokens live in CSS, not in tailwind.config
  tailwindStylesheet: "./app/globals.css",
  tailwindAttributes: ["theme"],
  tailwindFunctions: ["twMerge", "createTheme"],
};

export default config;
