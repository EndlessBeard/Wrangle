import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // When serving from GitHub Pages at https://<user>.github.io/Wrangle/
  // set the base to the repo name so assets are referenced correctly.
  base: '/Wrangle/',
  plugins: [react()],
})
