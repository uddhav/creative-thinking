import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'examples/',
      '*.js',
      '*.d.ts',
      '!eslint.config.js'
    ]
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts', 'vitest.config.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.eslint.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        NodeJS: 'readonly',
        global: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier
    },
    rules: {
      // Include all recommended TypeScript rules
      ...typescript.configs['recommended'].rules,
      ...typescript.configs['recommended-requiring-type-checking'].rules,
      
      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports'
      }],
      
      // General rules
      'no-console': ['warn', {
        allow: ['warn', 'error']
      }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      
      // MCP Protocol Compliance Rules
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.object.name='process'][callee.object.property.name='stdout'][callee.property.name='write']",
          message: 'Do not use process.stdout.write() - MCP servers must only send JSON-RPC to stdout. Use process.stderr.write() for debug output.'
        },
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name='log']",
          message: 'Do not use console.log() - MCP servers must only send JSON-RPC to stdout. Use console.error() for debug output.'
        }
      ],
      
      // Prettier integration
      'prettier/prettier': ['error', {
        endOfLine: 'auto'
      }],
      
      // Disable conflicting rules from prettier config
      ...prettierConfig.rules
    }
  },
  // Test file specific configuration
  {
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'test/**/*.ts', 'src/__tests__/**/*.ts'],
    rules: {
      // Allow console.log and process.stdout.write in test files
      'no-restricted-syntax': 'off',
      // Allow any types in test files for mocking
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off'
    }
  }
];