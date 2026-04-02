import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(120, 122, 255, 0.3), 0 20px 40px rgba(5, 8, 25, 0.55)"
      },
      backgroundImage: {
        "grid-noise":
          "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.06) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "spotlight-radial":
          "radial-gradient(800px circle at var(--spot-x,50%) var(--spot-y,30%), rgba(96,255,235,0.14), rgba(96,255,235,0.04) 34%, transparent 64%)",
        "beam-overlay":
          "linear-gradient(120deg, rgba(94,233,255,0.08), rgba(255,255,255,0.02) 38%, rgba(72,124,255,0.06) 68%, transparent)"
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1.03)" }
        },
        shine: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" }
        },
        "grid-drift": {
          "0%": { transform: "translate3d(0,0,0)" },
          "100%": { transform: "translate3d(0,-18px,0)" }
        }
      },
      animation: {
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        shine: "shine 1.6s ease-in-out",
        "grid-drift": "grid-drift 12s linear infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
