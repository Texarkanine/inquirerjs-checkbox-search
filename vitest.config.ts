import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['inquirer-source-code-ref/**/*', 'node_modules/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'examples/**/*',
        'package-inspect/**/*',
        'dist/**/*',
        '.tshy/**/*',
        'coverage/**/*',
        'node_modules/**/*',
      ],
      thresholds: {
        statements: 90,
        functions: 90,
        branches: 85,
        lines: 90,
      },
    },
  },
  esbuild: {
    target: 'node18',
  },
});
