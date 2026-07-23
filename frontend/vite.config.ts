import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  base: '/',
  publicDir: 'public',

  define: {
    global: 'globalThis',
  },

  build: {
    outDir: 'build',
    emptyOutDir: true,
  },

  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/private/': {
        target: 'http://runserver:8080/',
        changeOrigin: true,
      },
      '/oidc/': {
        target: 'http://runserver:8080/',
        changeOrigin: true,
      },
      '/ingest/': {
        target: 'http://runserver:8080/',
        changeOrigin: true,
      },
    },
  },

  resolve: {
    alias: {
      app: path.resolve(__dirname, 'src/app'),
      aggregation: path.resolve(__dirname, 'src/aggregation'),
      api: path.resolve(__dirname, 'src/api'),
      buffer: 'buffer/',
      process: 'process/browser',
      components: path.resolve(__dirname, 'src/components'),
      pages: path.resolve(__dirname, 'src/pages'),
      providers: path.resolve(__dirname, 'src/providers'),
      reducers: path.resolve(__dirname, 'src/reducers'),
      services: path.resolve(__dirname, 'src/services'),
      utils: path.resolve(__dirname, 'src/utils'),
      interfaces: path.resolve(__dirname, 'src/interfaces'),
      search: path.resolve(__dirname, 'src/search'),
    },
  },

  optimizeDeps: {
    include: ['buffer', 'process'],
  },
})
