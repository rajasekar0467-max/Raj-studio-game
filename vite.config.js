import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base works on Netlify (site root) and GitHub Pages (/repo-name/)
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
