import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0A4F4F',
          50: '#E6F3F3',
          100: '#C2E0E0',
          200: '#8EC8C8',
          300: '#59AFAF',
          400: '#2E9494',
          500: '#2A8B8B',
          600: '#1A6969',
          700: '#0A4F4F',
          800: '#083C3C',
          900: '#052828',
        },
        accent: {
          DEFAULT: '#2A8B8B',
          50: '#E6F3F3',
          100: '#C2E0E0',
          200: '#8EC8C8',
          300: '#59AFAF',
          400: '#33A0A0',
          500: '#2A8B8B',
          600: '#228080',
          700: '#1A6969',
          800: '#105050',
          900: '#083838',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
