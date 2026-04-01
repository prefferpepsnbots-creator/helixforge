import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = compat.config({
  extends: ["next/core-web-vitals", "next/typescript"],
  ignorePatterns: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },
});

export default eslintConfig;
