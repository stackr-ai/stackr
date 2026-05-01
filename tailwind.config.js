/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'Courier New', 'monospace'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: '#080d1a',
        'navy-2': '#0f1729',
        'navy-3': '#161f35',
        accent: '#1a7aff',
        'accent-dim': '#0e4fa8',
        green: '#00c896',
        amber: '#f59e0b',
        red: '#ef4444',
      },
    },
  },
  plugins: [],
}
