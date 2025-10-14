/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF8',
        foreground: '#1a1a1a',
        primary: {
          DEFAULT: '#2D5A4F',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F4EDE4',
          foreground: '#1a1a1a',
        },
        accent: {
          DEFAULT: '#D4A574',
          foreground: '#1a1a1a',
        },
        border: '#E5E5E0',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}