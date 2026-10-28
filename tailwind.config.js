import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Figma "Food Delivery Website & App Design UI Kit" palette (BRD section 15)
        primary: {
          DEFAULT: '#FC8A06', // Orange
          50: '#FFF5E8',
          100: '#FFE6C7',
          600: '#E07A00',
          700: '#A35900',
        },
        secondary: { DEFAULT: '#028643', 50: '#E6F4EC', 600: '#016B35' }, // Cart green
        accent: { DEFAULT: '#FFB703', 50: '#FFF8E1' }, // Rating yellow
        ink: { DEFAULT: '#03081F', muted: '#5B6070' }, // Deep navy
        surface: { DEFAULT: '#FFFFFF', page: '#FAFAFA', muted: '#F3F3F3', border: '#EEEEEE' },
        danger: { DEFAULT: '#DC2626', 50: '#FEF2F2' },
        warning: { DEFAULT: '#D97706', 50: '#FFFBEB' },
        info: { DEFAULT: '#2563EB', 50: '#EFF6FF' },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: { card: '0.75rem' },
      boxShadow: {
        card: '0 2px 8px rgb(3 8 31 / 0.06), 0 1px 2px rgb(3 8 31 / 0.04)',
        pop: '0 12px 32px rgb(3 8 31 / 0.12)',
      },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  plugins: [forms],
};
