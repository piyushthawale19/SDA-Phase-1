// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // ← important
  theme: {
    extend: {
      keyframes: {
        "border-pulse": {
          "0%, 100%": { borderOpacity: "0.2" },
          "50%": { borderOpacity: "0.4" },
        },
      },
      animation: {
        "border-pulse": "border-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
