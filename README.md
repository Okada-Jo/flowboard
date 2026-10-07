# Flowboard

## Development tooling

Use Node.js 22.22.2+ or 24.15.0+ on the corresponding LTS release line
(required by the jsdom test environment).
Run `npm install` to install dependencies and activate the Husky Git hooks.
In VS Code, install the recommended **ESLint** and **Prettier** extensions
(open Extensions and search `@recommended`). The checked-in workspace settings
format files and apply available ESLint fixes on explicit save (Ctrl/Cmd+S).
Remaining lint errors appear in the Problems panel and need manual fixes.

Before each commit, Husky runs lint-staged on staged files: JavaScript and
TypeScript get ESLint auto-fixes followed by Prettier; JSON, CSS, HTML, Markdown,
and YAML get Prettier. Unresolved lint errors or warnings block the commit.
Tests run separately with `npm test` and are not part of pre-commit.
Formatting follows the existing single-quote, no-semicolon style.

- `npm test` — run all tests once.
- `npm run test:watch` — rerun tests while developing.
- `npm run lint` — check lint rules across the project.
- `npm run lint:fix` — apply available lint fixes.
- `npm run format` — format the project.
- `npm run format:check` — check formatting without changing files.
- `npm run build` — type-check and build the app.

Tests cover editor operations and history, clipboard behavior, keyboard shortcuts,
context menus, board management, IndexedDB persistence, autosave, and JSON
import/export. They use Vitest and React Testing Library with jsdom and an
isolated in-memory IndexedDB; they do not touch browser boards. Canvas layout
and pointer dragging in a real browser are not covered by this suite.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
