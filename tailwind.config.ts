import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0b1220',
          900: '#0b1220',
          800: '#0f1830',
          700: '#162040',
          600: '#1e2a52',
        },
        teal: {
          DEFAULT: '#14b8a6',
          500: '#14b8a6',
          400: '#2dd4bf',
          300: '#5eead4',
        },
        amber: {
          DEFAULT: '#f59e0b',
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};

export default config;
