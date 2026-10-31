import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base path ensures assets resolve cleanly on both Netlify root (/)
  // and GitHub Pages project sub-paths (e.g., /repo-name/).
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 1200
  },
  server: {
    host: true,
    port: 5173
  }
});
