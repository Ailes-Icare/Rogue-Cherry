import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  test: {
    globals: true,
    environment: 'node', // Tests unitaires simples sans DOM requis à ce stade
  },
})
