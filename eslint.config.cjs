// eslint.config.cjs
const globals = require('globals'); // For globals like browser, node etc. if needed

// Import the recommended configurations directly
const eslintRecommended = require('@eslint/js').configs.recommended;
const tsEslintPlugin = require('@typescript-eslint/eslint-plugin');
const tsEslintParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
    // 1. ESLint Recommended Rules
    eslintRecommended,

    // 2. TypeScript ESLint Recommended Rules
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'], // Apply to these file types
        languageOptions: {
            parser: tsEslintParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json', // Adjust path if tsconfig.json is not in the root
                // If you're using React:
                // ecmaFeatures: {
                //   jsx: true,
                // },
            },
            // If you need global variables (e.g., for Node.js or browser)
            globals: {
                ...globals.browser, // For 'window', 'document', etc. if your code runs in a browser
                ...globals.node, // For 'console', 'process', etc. if your code runs in Node.js
                // Add any other custom globals your project defines:
                // myCustomGlobal: 'readonly', // Example: if you have a global 'myCustomGlobal'
            },
        },
        plugins: {
            '@typescript-eslint': tsEslintPlugin,
        },
        rules: {
            ...tsEslintPlugin.configs.recommended.rules,
            ...tsEslintPlugin.configs['eslint-recommended'].rules, // This turns off conflicting ESLint base rules
            // Add any custom TypeScript-specific rules here
        },
        // If you're using React, include settings here:
        // settings: {
        //   react: {
        //     version: 'detect',
        //   },
        // },
    },

    // 3. Prettier Plugin and Config (Always last to override formatting rules)
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'], // Apply to these file types
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            // Disable ESLint rules that conflict with Prettier
            ...prettierConfig.rules,
            // Enable eslint-plugin-prettier rules
            ...prettierPlugin.configs.recommended.rules,
            // You might need to add specific overrides if Prettier isn't enforcing something
        },
    },
];
