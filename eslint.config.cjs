const globals = require('globals')
const eslintRecommended = require('@eslint/js').configs.recommended
const tsEslintPlugin = require('@typescript-eslint/eslint-plugin')
const tsEslintParser = require('@typescript-eslint/parser')
const prettierConfig = require('eslint-config-prettier')
const prettierPlugin = require('eslint-plugin-prettier')

module.exports = [
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        languageOptions: {
            parser: tsEslintParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tsEslintPlugin,
        },
        rules: {
            ...eslintRecommended.rules,
            ...tsEslintPlugin.configs['eslint-recommended'].rules,
            ...tsEslintPlugin.configs.recommended.rules,

            // These two lines are correct and should be here to explicitly turn off base rules.
            semi: 'off',
            '@typescript-eslint/semi': 'off',

            // Other rules:

            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_' },
            ],
        },
    },

    // This is the Prettier integration block.
    // This is where the final, definitive override for 'semi' will happen.
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            // These rules disable ESLint stylistic rules that conflict with Prettier.
            ...prettierConfig.rules,

            // This enables the 'prettier/prettier' rule.
            // This is the rule that now causes your "missing semicolon" complaint.
            ...prettierPlugin.configs.recommended.rules, // <-- This includes 'prettier/prettier'

            // Explicitly tell the 'prettier/prettier' rule to *not* enforce semicolons.
            // This directly influences what the 'prettier/prettier' rule flags.
            'prettier/prettier': [
                'error',
                {
                    semi: false,
                    endOfLine: 'lf',
                    // Add any other Prettier options from your .prettierrc here if you want
                    // them to explicitly control what 'prettier/prettier' ESLint rule checks.
                    // e.g., singleQuote: true, trailingComma: 'all', etc.
                },
            ],
        },
    },
]
