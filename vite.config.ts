import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
    },
  },
  plugins: [svelte(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
      '/login': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
      '/logout': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
      '/register': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
      '/confirm': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
      '/reset_password': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
      '/files': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
      '/themes': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
      '/admin': {
        target: 'https://ctfd.ihmsctf.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
