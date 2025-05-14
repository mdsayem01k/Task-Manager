/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da6ff',
          DEFAULT: '#0080ff',
          dark: '#0066cc',
        },
        secondary: {
          light: '#8c8c8c',
          DEFAULT: '#737373',
          dark: '#595959',
        },
      },
    },
  },
  plugins: [],
}