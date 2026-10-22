/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sevora: {
          pink: '#ff1478',
          hot: '#f90070',
          blush: '#fff3f8',
          rose: '#ffe2ee',
          ink: '#2d1723',
          plum: '#190511',
          muted: '#806b77'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'DM Sans', 'sans-serif']
      },
      boxShadow: {
        soft: '0 16px 45px rgba(101, 20, 57, 0.08)',
        card: '0 8px 26px rgba(61, 14, 37, 0.07)'
      }
    }
  },
  plugins: []
};
