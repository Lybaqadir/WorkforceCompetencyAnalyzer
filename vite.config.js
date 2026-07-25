import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
    watch: {
      // The backend lives inside this repo and writes state/log files on every
      // request (server/data/workflow-state.json, *.log). If Vite watches them,
      // each save triggers a full page reload — remounting the app mid-flow.
      ignored: ['**/server/**', '**/*.log'],
    },
  },
})
