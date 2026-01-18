/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  build: {
    // Target modern browsers that support ES2020+ features
    target: 'es2020',
    // Use esbuild for minification (built-in, fast)
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Generate source maps for production debugging
    sourcemap: false,
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'state-vendor': ['zustand', '@tanstack/react-query'],
          'player-vendor': ['shaka-player'],
          'navigation-vendor': ['@noriginmedia/norigin-spatial-navigation'],
        },
        // Optimize chunk file names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Chunk size warning limit (in KB)
    chunkSizeWarningLimit: 500,
    // Ensure assets are inlined if small enough
    assetsInlineLimit: 4096,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@tanstack/react-query',
      '@noriginmedia/norigin-spatial-navigation',
      'shaka-player',
    ],
  },
  // Server configuration for development
  server: {
    port: 3000,
    host: true,
  },
  // Preview configuration for production testing
  preview: {
    port: 4173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
