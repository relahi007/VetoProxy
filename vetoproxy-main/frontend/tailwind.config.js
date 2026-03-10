/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadein:  { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        blockin: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        rowin:   { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        expand:  { from: { opacity: 0, transform: 'translateY(-4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeout: { '0%': { opacity: 0 }, '20%': { opacity: 1 }, '80%': { opacity: 1 }, '100%': { opacity: 0 } },
      },
      animation: {
        fadein:  'fadein 300ms ease both',
        blockin: 'blockin 350ms ease both',
        rowin:   'rowin 320ms ease both',
        expand:  'expand 200ms ease both',
        fadeout: 'fadeout 1.5s ease forwards',
      },
    },
  },
  plugins: [],
};
