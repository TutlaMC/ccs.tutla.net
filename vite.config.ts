import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { registryJsonPlugin } from './vite-plugins/registry-json'

export default defineConfig({
  plugins: [registryJsonPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})