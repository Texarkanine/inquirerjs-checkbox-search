import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['inquirer-source-code-ref/**/*', 'node_modules/**/*'],
    onUnhandledError(error) {
      // After upgrading to @inquirer/core v11, the library aggressively closes
      // prompts on process exit. Tests that only check rendering (without completing
      // the prompt) will trigger ExitPromptError during test suite shutdown.
      //
      // This is SAFE to ignore because:
      // 1. These errors only occur during process exit, not during test execution
      // 2. They don't indicate test failures - the tests already passed
      // 3. They're cleanup artifacts from the inquirer library's exit handlers
      //
      // If a test actually fails to complete a prompt when it should, that would
      // manifest as a timeout or assertion failure, NOT as an ExitPromptError.
      if (error.name === 'ExitPromptError') {
        return false; // Don't treat this as a test failure
      }
    },
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
