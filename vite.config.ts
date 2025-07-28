/* eslint-disable no-undef */
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  // base: '/boot-dev-pallanguzhi',
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
        howto: resolve(__dirname, 'how-to.html')
      }
    }
  },
  server: {
    port: 8080,
    open: true
  }
});
