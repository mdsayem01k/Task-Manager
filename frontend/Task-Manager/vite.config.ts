import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // You may need to add this if it's not picking up main.jsx automatically
  build: {
    outDir: 'dist',
  },
})