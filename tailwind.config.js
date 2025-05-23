/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#e6f1ff',
          100: '#cce3ff',
          200: '#99c8ff',
          300: '#66adff',
          400: '#3392ff',
          500: '#0077ff',
          600: '#005fcc',
          700: '#004799',
          800: '#002f66',
          900: '#001833',
        },
        'secondary': {
          50: '#e6fff9',
          100: '#ccfff3',
          200: '#99ffe6',
          300: '#66ffd9',
          400: '#33ffcc',
          500: '#00ffbf',
          600: '#00cc99',
          700: '#009973',
          800: '#00664d',
          900: '#003326',
        },
        'neutral': {
          50: '#f7f9fc',
          100: '#eef2f7',
          200: '#dde5ef',
          300: '#ccd8e7',
          400: '#bbcbdf',
          500: '#aabbd2',
          600: '#8896a8',
          700: '#66717e',
          800: '#444b54',
          900: '#22262a',
        },
        'danger': '#FF4858',
        'warning': '#FFCA41',
        'success': '#00C48C',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 8px 0 rgba(0, 0, 0, 0.05)',
        dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};