import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const srcPath = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],

  define: {
    global: 'globalThis',
  },

  build: {
    outDir: 'build',
  },

  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/private': {
        target: 'http://runserver:8080',
        changeOrigin: true,
      },
      '/oidc': {
        target: 'http://runserver:8080',
        changeOrigin: true,
      },
      '/ingest': {
        target: 'http://runserver:8080',
        changeOrigin: true,
      },
      '/download/blast-results': {
        target: 'http://runserver:8080',
        changeOrigin: true,
      },
      '/download/otu-export': {
        target: 'http://runserver:8080',
        changeOrigin: true,
      },
    },
  },

  resolve: {
    alias: {
      app: srcPath('app'),
      aggregation: srcPath('aggregation'),
      api: srcPath('api'),
      components: srcPath('components'),
      hooks: srcPath('hooks'),
      pages: srcPath('pages'),
      providers: srcPath('providers'),
      reducers: srcPath('reducers'),
      services: srcPath('services'),
      utils: srcPath('utils'),
      interfaces: srcPath('interfaces'),
      search: srcPath('search'),
    },
  },
})
