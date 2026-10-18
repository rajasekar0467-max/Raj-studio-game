import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base works on Netlify (site root) AND GitHub Pages (/Raj-studio-game/)
  base: './',
  // Temporary: readable error traces while we debug. Remove once the game runs.
  build: { minify: false }
});
