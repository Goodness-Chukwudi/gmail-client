module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest", // Allows the use of modern ECMAScript features
      sourceType: "module", // Allows for the use of imports
    },
    extends: ["plugin:@typescript-eslint/recommended"], // Uses the linting rules from @typescript-eslint/eslint-plugin
    
    env: {
      node: true, // Enable Node.js global variables
    },
    
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      // "@typescript-eslint/no-unused-vars": "off"
    }
  };