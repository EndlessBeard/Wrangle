import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use a relative base so assets are referenced relatively.
  // This avoids hardcoding a leading slash path which can 404
  // when the site is served from a different root (user vs project pages).
  base: './',
  plugins: [react()],
})
