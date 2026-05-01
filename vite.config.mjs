/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [preact()],
    base: env.VITE_BASE_PATH || '/',
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, 'src'),
      },
    },
    build: {
      outDir: 'dist',
    },
    test: {
      environment: 'happy-dom',
      include: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'worker/src/**/*.test.ts',
      ],
      globals: false,
    },
  };
});
