/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        /* Brand: deep indigo for focus / deep work energy */
        brand: {
          50:  "#EEEDFE",
          100: "#CECBF6",
          200: "#AFA9EC",
          300: "#8F87E2",
          400: "#7F77DD",
          500: "#534AB7",
          600: "#3C3489",
          700: "#2A245E",
          800: "#1C1840",
          900: "#0E0C20",
        },
        /* Accent: electric teal for completion / success */
        accent: {
          50:  "#E1F5EE",
          100: "#9FE1CB",
          200: "#5DCAA5",
          300: "#2DB88A",
          400: "#1D9E75",
          500: "#0F6E56",
          600: "#085041",
          700: "#05382E",
          800: "#04342C",
          900: "#022018",
        },
        /* Score amber for productivity ring */
        score: {
          50:  "#FAEEDA",
          100: "#FAC775",
          200: "#EF9F27",
          300: "#D4870F",
          400: "#BA7517",
          500: "#854F0B",
          600: "#633806",
          700: "#412402",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-score": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-in-up": {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "timer-tick": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-score": "pulse-score 2s ease-in-out infinite",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "timer-tick": "timer-tick 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
