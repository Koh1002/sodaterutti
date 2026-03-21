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
        // ニュアンスカラーパレット（指定値ベース）
        base: {
          50: '#FBF8F4',
          100: '#F5EBE0',  // メインベースカラー（クリーミーベージュ）
          200: '#E3D5CA',  // トープ
          250: '#D5BDAF',  // モカピンク
          300: '#D5C4B1',
          400: '#C7B49B',
          500: '#B09A7E',
        },
        muted: {
          blue: '#8E9AAF',    // ダスティブルー
          sage: '#B9BAA3',    // セージグリーン
          rose: '#C4A4A7',    // くすみローズ
          mocha: '#D5BDAF',   // モカピンク
          lavender: '#A8A3B5', // くすみラベンダー
          mauve: '#B5A0A8',   // モーヴ
        },
        text: {
          primary: '#4A4A4A',    // メインテキスト
          secondary: '#7A7A7A',  // サブテキスト
          tertiary: '#A0A0A0',   // 補助テキスト
          inverse: '#FEFEFE',    // 反転テキスト
        },
      },
      fontFamily: {
        body: ['"Zen Maru Gothic"', '"Hiragino Maru Gothic ProN"', 'sans-serif'],
        display: ['"Quicksand"', '"Zen Maru Gothic"', 'sans-serif'],
      },
      letterSpacing: {
        relaxed: '0.05em',
        airy: '0.1em',
        wide: '0.15em',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 16px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 4px 24px rgba(0, 0, 0, 0.06)',
        'inner-soft': 'inset 0 1px 4px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;
