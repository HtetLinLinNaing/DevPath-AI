import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  { ignores: [".next/**", "coverage/**", "playwright-report/**", "test-results/**"] },
  ...compat.config({ extends: ["next/core-web-vitals"] }),
];

export default config;
