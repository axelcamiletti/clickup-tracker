/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./src/components/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'clickup': {
          primary: '#7B68EE',
          secondary: '#6C5CE7',
          dark: '#2D3748',
          light: '#F7FAFC'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class'
}
