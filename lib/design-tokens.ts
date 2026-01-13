/**
 * Design Tokens para el sistema de diseño
 * Define colores, espaciado, tipografía, breakpoints y más
 */

// Colores del Branding
export const colors = {
  // Colores primarios de la marca
  brand: {
    azul: "#004A98",
    naranja: "#ED7625",
    verde: "#44A147",
    gris: "#D1D3D4",
  },
  // Estados
  success: "#44A147",
  warning: "#FFB81C",
  error: "#DC2626",
  info: "#0EA5E9",

  // Escala de grises
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
};

// Espaciado (scale: 0.25rem = 4px)
export const spacing = {
  xs: "0.5rem", // 8px
  sm: "0.75rem", // 12px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "2.5rem", // 40px
  "3xl": "3rem", // 48px
};

// Tipografía
export const typography = {
  sizes: {
    xs: {
      size: "0.75rem", // 12px
      lineHeight: "1rem", // 16px
    },
    sm: {
      size: "0.875rem", // 14px
      lineHeight: "1.25rem", // 20px
    },
    base: {
      size: "1rem", // 16px
      lineHeight: "1.5rem", // 24px
    },
    lg: {
      size: "1.125rem", // 18px
      lineHeight: "1.75rem", // 28px
    },
    xl: {
      size: "1.25rem", // 20px
      lineHeight: "1.75rem", // 28px
    },
    "2xl": {
      size: "1.5rem", // 24px
      lineHeight: "2rem", // 32px
    },
    "3xl": {
      size: "1.875rem", // 30px
      lineHeight: "2.25rem", // 36px
    },
  },
  weights: {
    normal: 400,
    semibold: 600,
    bold: 700,
  },
  fontFamily: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  },
};

// Breakpoints (mobile-first)
export const breakpoints = {
  base: "0px", // WVGA: 800x480
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Sombras
export const shadows = {
  none: "none",
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

// Bordes
export const borders = {
  radius: {
    none: "0",
    sm: "0.125rem", // 2px
    base: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    full: "9999px",
  },
  width: {
    none: "0",
    sm: "1px",
    base: "2px",
    md: "3px",
    lg: "4px",
  },
};

// Transiciones
export const transitions = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
  slower: "500ms",
  timing: "ease-in-out",
};

// Estados interactivos
export const states = {
  hover: {
    opacity: 0.8,
    transform: "translateY(-2px)",
  },
  active: {
    opacity: 0.9,
    transform: "translateY(0)",
  },
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

// Constantes de tamaño para componentes
export const componentSizes = {
  button: {
    sm: {
      px: spacing.sm,
      py: "0.375rem",
      fontSize: typography.sizes.sm.size,
      height: "2rem",
    },
    md: {
      px: spacing.md,
      py: spacing.sm,
      fontSize: typography.sizes.base.size,
      height: "2.5rem",
    },
    lg: {
      px: spacing.lg,
      py: spacing.sm,
      fontSize: typography.sizes.base.size,
      height: "3rem",
    },
  },
  input: {
    px: spacing.md,
    py: "0.625rem",
    fontSize: typography.sizes.base.size,
    minHeight: "2.75rem",
  },
  card: {
    padding: spacing.lg,
    borderRadius: borders.radius.lg,
    borderWidth: borders.width.sm,
  },
};
