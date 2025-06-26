// Import the animations from the dedicated animations file
const tailwindAnimations = require('./components/notifications/animations');

module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    'node_modules/daisyui/dist/**/*.js',
    'node_modules/react-daisyui/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        backgroundColor: 'var(--background-color)',
        textColor: 'var(--text-color)',
        surfaceColor: 'var(--surface-color)',
        borderColor: 'var(--border-color)',
        shadowColor: 'var(--shadow-color)',
        disabledTextColor: 'var(--disabled-text-color)',
        hoverColor: 'var(--hover-color)',
      },
      keyframes: tailwindAnimations.keyframes,
      animation: tailwindAnimations.animation,
    },
  },
  daisyui: {
    themes: ['light', 'black'],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
};
