/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],

  theme: {
    extend: {
      colors: {
        'night': '#0b0c10ff',
        'gunmetal': '#1f2733ff',
        'silver': '#c5c6c7ff',
        'fluorescent-cyan': '#66fcf1ff',
        'verdigris': '#45a29eff',
      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
  purge: [
    "./src/**/*.{js,jsx}"
  ],
}

