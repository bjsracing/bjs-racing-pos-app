/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Definisikan warna orange branding Anda di sini
        // Anda bisa sesuaikan kode hex orange sesuai keinginan
        orange: {
          DEFAULT: "#FF7F00", // Warna orange utama
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#FF7F00", // Ini orange utama Anda
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#43140C",
        },
      },
    },
  },
  plugins: [],
};
