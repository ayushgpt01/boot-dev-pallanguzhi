import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/ayushgpt01/boot-dev-pallanguzhi', 
  plugins: [tailwindcss()],
  server: {
    port: 8080,
    open: true
  }
});
