module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    "no-console": "error",
    "react/jsx-no-undef": "warn",
    "react/no-unknown-property": "warn",
    "react/no-unescaped-entities": "warn",
    "react/jsx-fragments": "warn",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
  },
};
