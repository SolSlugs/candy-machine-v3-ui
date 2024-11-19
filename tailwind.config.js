/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'press-start': ['"Press Start 2P"', 'cursive'],
      },
      colors: {
          primary: '#94e448',
          secondary: '#9848e4',
          background: '#101010',
          accent: '#426621',
          widget: '#1c1c1c',
          disabled: '#919191',
          exclusive: '#A3DBFF',
          acolyte: '#FC9191',
          incinerator: '#F44343',
          pyro: '#FB6D00',
          scorcher: '#F4A133',
          headerGreen: '#151B11',
          bodyGreen: '#1D2617',
          accentGreen: '#052e16',
          dusterGray: '#8d8d8d',
      },
    },
  },
  plugins: [],
}

