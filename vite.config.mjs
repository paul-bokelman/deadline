import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig(({ mode }) => ({
  plugins: [preact()],
  base: mode === 'production' ? '/windows-96/' : '/',
  build: {
    outDir: 'dist',
  },
}));
