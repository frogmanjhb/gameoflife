import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@game-of-resources': path.resolve(__dirname, '../shared/game-of-resources/index.ts'),
      [path.resolve(__dirname, 'src/domain/gameOfResources/shared')]: path.resolve(
        __dirname,
        '../shared/game-of-resources'
      ),
    },
  },
});
