export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F6F6F4",
          100: "#ECECE7",
          200: "#D4D5CC",
          300: "#B9BDAE",
          400: "#A8B09C",
          500: "#89937C",
          600: "#68725D",
          700: "#4D5647",
          800: "#353C32",
          900: "#222720",
          950: "#151815"
        },
        secondary: {
          50: "#F6F6F4",
          100: "#E8E8E1",
          200: "#C7C9BD",
          300: "#A2A699",
          400: "#747A70",
          500: "#1F2326",
          600: "#1B1E20",
          700: "#171717",
          800: "#111211",
          900: "#0C0D0C",
          950: "#070807"
        },
        tertiary: {
          50: "#EFF0F1",
          100: "#DFE1E3",
          200: "#BFC2C7",
          300: "#9FA4AB",
          400: "#6F7682",
          500: "#374151",
          600: "#2F3846",
          700: "#272E39",
          800: "#1D222A",
          900: "#13161C",
          950: "#0B0D10"
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
        ink: "#F6F6F4",
        muted: "#A7AAA2",
        panel: "#1F2326",
        line: "rgba(246,246,244,0.12)",
        appbg: "#171717",
        action: "#A8B09C",
        good: "#A8B09C",
        warn: "#D0BE78",
        danger: "#D35B5B"
      },
      boxShadow: {
        soft: "0 1px 0 rgba(246,246,244,0.04), 0 18px 60px rgba(0,0,0,0.22)",
        lift: "0 1px 0 rgba(246,246,244,0.04), 0 24px 80px rgba(0,0,0,0.28)",
        glow: "0 0 0 1px rgba(168,176,156,0.24), 0 20px 60px rgba(0,0,0,0.28)"
      },
      borderRadius: {
        glass: "16px",
        shell: "31px",
        panel: "32px"
      }
    }
  },
  plugins: []
};
