/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#1e1e1e',
        'bg-panel': '#252526',
        'bg-panel-light': '#2d2d2d',
        'text-light': '#d4d4d4',
        'primary-blue': '#007acc',
        'primary-blue-hover': '#005999',
        'cherry-red': '#d16969',
        'cherry-red-hover': '#a34a4a',
        'border-dark': '#444444',
        'disabled-dark': '#555555',
        'hl-yellow': '#FFD700',
        'hl-yellow-pale': 'rgba(255, 215, 0, 0.25)',
        'hl-linebg': 'rgba(198, 142, 255, 0.35)',
        'hl-line-mod': '#59466D',
        'hl-word-mod': '#9E67BA',
        'hl-ins': '#FF007F',
        'hl-del': '#FF0000',
        'gutter-mod': '#00FF7F',
      },
      fontFamily: {
        consolas: ['Consolas', 'monospace'],
        segoe: ['Segoe UI', 'Tahoma', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.7em',
      }
    },
  },
  plugins: [],
}
