import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
}, {
  files: ['src/**/*.ts', 'tests/**/*.ts'],
  extends: [...tseslint.configs.recommended],
  languageOptions: {
    globals: { ...globals.node },
  },
  rules: {
    // Express 5 detecta el manejador de errores por su firma de 4 argumentos,
    // así que `_next` debe declararse aunque no se use.
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
  },
});
