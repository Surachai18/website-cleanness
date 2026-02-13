module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Inter', 'Prompt', 'ui-sans-serif', 'system-ui'] 
      },
      colors: {
        brand: {
          50: '#e6f9fa',
          100: '#ccf3f5',
          200: '#99e7eb',
          300: '#66dbe1',
          400: '#33cfd7',
          500: '#11c1cf',
          600: '#0e9aa6',
          700: '#0b737d',
          800: '#084c54',
          900: '#05252b'
        },
        emeraldy: {
          500: '#f46e25',
          600: '#d45a1f'
        },
        gold: { 
          400: '#f46e25' 
        }
      },
      boxShadow: {
        glow: '0 10px 30px rgba(17,193,207,.25)'
      }
    },
  },
  plugins: [],
}
