import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  // HeroUI ships its plugin types from its bundled Tailwind version.
  plugins: [heroui() as unknown as NonNullable<Config["plugins"]>[number]],
};

export default config;
