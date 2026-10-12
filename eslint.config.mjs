import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([".next/**", "generated/**", "coverage/**", "output/**", "tmp/**"]),
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"]
]);
