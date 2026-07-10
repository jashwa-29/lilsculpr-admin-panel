/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
        },
        secondary: '#6366f1',
        sidebar: '#1e1b2e',
        sidebar2: '#2d2945',
        muted: '#6b7280',
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
}
