/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#1A1A2E',
        'surface-light': '#252540',
        primary: '#00D4AA',
        'text-primary': '#E8E8E8',
        'text-secondary': '#9CA3AF',
      },
    },
  },
  plugins: [],
};
