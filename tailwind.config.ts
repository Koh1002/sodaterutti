import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ニュアンスカラーパレット
        cream: {
          50: '#FFFDF8',
          100: '#FFF9ED',
          200: '#FFF3D6',
          300: '#FFEAB8',
        },
        dusty: {
          50: '#FFF5F5',
          100: '#FDEAEA',
          200: '#F5CDD0',
          300: '#E8AEB3',
          400: '#D4898F',
          500: '#C0767D',
          600: '#A85F66',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E8EFE8',
          200: '#C9D9CA',
          300: '#A7C2A9',
          400: '#8BAF8E',
          500: '#739B76',
        },
        warm: {
          50: '#FAF8F5',
          100: '#F5F0E8',
          200: '#EBE1D2',
          300: '#DDD0BC',
          400: '#C7B49B',
          500: '#B09A7E',
          600: '#8D7A63',
          700: '#6B5C4A',
          800: '#4A3F33',
        },
      },
      fontFamily: {
        body: ['"Zen Maru Gothic"', '"Hiragino Maru Gothic ProN"', '"Rounded Mplus 1c"', 'sans-serif'],
      },
      letterSpacing: {
        relaxed: '0.06em',
        airy: '0.1em',
      },
    },
  },
  plugins: [],
};
export default config;
