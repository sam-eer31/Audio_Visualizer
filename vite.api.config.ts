import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist-api',
    lib: {
      entry: path.resolve(__dirname, 'src/api.tsx'),
      name: 'AudrixVisualizer',
      fileName: (format) => `audrix-api.${format}.js`,
      formats: ['umd'],
    },
    rollupOptions: {
      // Don't externalize React and ReactDOM, we want them bundled
      // so the standalone script works anywhere
      external: [],
      output: {
        globals: {},
      },
    },
  },
})
