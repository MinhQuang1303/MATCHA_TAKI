/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        taki: {
          green: '#263f24',
          sage: '#a9bd83',
          cream: '#f8f3e6',
        },
      },
    },
  },
  plugins: [],
};
