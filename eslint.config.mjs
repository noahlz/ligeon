import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-electron/**',
      'out/**',
      'coverage/**',
      // shadcn/ui generated components — not linted
      'src/renderer/components/ui/**',
    ]
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: tseslint.configs.recommended,
    languageOptions: {
      parserOptions: {
        // Explicit paths required: src/shared/ has no own tsconfig,
        // so project:true cannot discover it via nearest-tsconfig lookup.
        project: [
          './src/main/tsconfig.json',
          './src/main/tsconfig.preload.json',
          './src/renderer/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      }
    },
    rules: {
      // TSC already enforces unused vars via noUnusedLocals/noUnusedParameters
      '@typescript-eslint/no-unused-vars': 'off',
      // Downgrade from error to warning — annotate specific cases as needed
      '@typescript-eslint/no-explicit-any': 'warn',
    }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',  // react-jsx transform, no import needed
      'react/prop-types': 'off',           // TypeScript handles prop types
      // React Compiler rules — not applicable, project does not use React Compiler
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
    settings: {
      react: { version: 'detect' }
    }
  }
)
