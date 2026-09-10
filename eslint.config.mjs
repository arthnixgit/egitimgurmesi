import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

/**
 * ESLint baseline for egitim-gurmesi-akademi.
 *
 * The repository had no linter, so turning one on cold would have produced a
 * permanently red build that everyone learns to ignore. Instead this config
 * runs at full strength and the violations that already existed when it was
 * introduced are recorded in `eslint-suppressions.json`. The effect is a
 * ratchet: today's code passes, but any *new* violation fails the build.
 *
 * To burn the backlog down:
 *   npx eslint . --prune-suppressions      # drop entries that are now fixed
 *   npx eslint . --suppressions-location … # inspect what is still suppressed
 *
 * Do not regenerate the suppressions file wholesale (`--suppress-all`) to make
 * a red build green; that defeats the entire mechanism.
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/_next/**",
      "**/out/**",
      "deploy/cpanel-web-static/**",
      "deploy/cpanel-web-standalone/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/generated/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/*.tsbuildinfo",
      ".worktrees/**",
      ".tmp/**",
      ".agents/**",
      ".codex-logs/**",
      ".codex-run/**",
      ".local-logs/**",
      "unikazan api/**"
    ]
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx,mjs,cjs,js}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } }
    }
  },

  // React hook correctness. This is the highest-value rule set in this
  // codebase: several admin screens hold 30-50 pieces of independent state,
  // which is exactly where effect and dependency mistakes hide.
  {
    files: ["apps/admin/**/*.tsx", "apps/web/**/*.tsx", "packages/ui/**/*.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs["recommended-latest"]?.rules ?? reactHooks.configs.recommended.rules
  },

  // CommonJS config files at the repository root.
  {
    files: ["ecosystem.config.js", "**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node }
    }
  },

  // Test files use Node's built-in runner and legitimately reach for globals
  // and loose typing while arranging fixtures.
  {
    files: ["**/*.spec.{ts,tsx}", "e2e/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
);
