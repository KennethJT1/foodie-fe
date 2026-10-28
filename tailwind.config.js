import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
// Brand tokens are added in phase 2 (Frontend Guidelines section 8).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [forms],
};
