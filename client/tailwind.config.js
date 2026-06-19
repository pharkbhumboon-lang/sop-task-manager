export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554"
        },
        secondary: {
          50: "#F4F4F5",
          100: "#E4E4E7",
          200: "#D4D4D8",
          300: "#A1A1AA",
          400: "#52525B",
          500: "#1A1A1C",
          600: "#151517",
          700: "#111113",
          800: "#0C0C0E",
          900: "#080809",
          950: "#050506"
        },
        tertiary: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065"
        },
        neutralx: {
          50: "#FFFFFF",
          100: "#FFFFFF",
          200: "#FFFFFF",
          300: "#FFFFFF",
          400: "#FFFFFF",
          500: "#FFFFFF",
          600: "#DBDBDB",
          700: "#B3B3B3",
          800: "#858585",
          900: "#575757",
          950: "#333333"
        },
        ink: "#FFFFFF",
        muted: "#A1A1AA",
        panel: "#1A1A1C",
        line: "rgba(255,255,255,0.12)",
        appbg: "#3A3A3C",
        action: "#3B82F6",
        good: "#10B981",
        warn: "#F59E0B",
        danger: "#EF4444"
      },
      boxShadow: {
        soft: "inset 0 2px 4px rgba(0,0,0,0.05), inset -2px 0 4px rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.05)",
        lift: "inset 0 2px 4px rgba(0,0,0,0.05), -20px 30px 60px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.08)",
        glow: "0 0 0 1px rgba(59,130,246,0.42), 0 18px 52px rgba(0,0,0,0.36)"
      },
      borderRadius: {
        glass: "24px",
        shell: "55px",
        panel: "45px"
      }
    }
  },
  plugins: []
};
