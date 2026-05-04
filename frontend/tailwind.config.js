export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#082f49'
        },
        secondary: {
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9'
        }
      }
    }
  },
  plugins: []
}
