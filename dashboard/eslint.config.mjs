import { tanstackConfig } from "@tanstack/config/eslint";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = [
  ...tanstackConfig,
  eslintConfigPrettier,
  {
    rules: {
      "no-shadow": "off",
      "import/no-cycle": "warn",
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          groups: [
            "builtin",
            "external",
            "type",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
          ],
          alphabetize: {
            order: "asc",
          },
        },
      ],
    },
  },
];

export default eslintConfig;
