import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E85D04', // Jollof orange
          50: '#FFF3EB',
          100: '#FFE0CC',
          600: '#C94F03',
          700: '#A34002',
        },
        secondary: { DEFAULT: '#1B7F3B', 50: '#EAF6EE', 600: '#166A31' }, // Naija green
        accent: { DEFAULT: '#FFB703', 50: '#FFF8E1' }, // Plantain yellow
        ink: { DEFAULT: '#1F2937', muted: '#6B7280' },
        surface: { DEFAULT: '#FFFFFF', page: '#FFF8F0', border: '#E5E7EB' },
        danger: { DEFAULT: '#DC2626', 50: '#FEF2F2' },
        warning: { DEFAULT: '#D97706', 50: '#FFFBEB' },
        info: { DEFAULT: '#2563EB', 50: '#EFF6FF' },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: { card: '0.75rem' },
      boxShadow: { card: '0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.1)' },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  plugins: [forms],
};
