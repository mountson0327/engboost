import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma-generated client — not our code to lint.
    "src/generated/**",
  ]),
  {
    rules: {
      // We intentionally fetch data on mount inside effects (client pages).
      // The setState happens after `await`, so the cascading-render warning
      // this rule targets does not apply here.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
