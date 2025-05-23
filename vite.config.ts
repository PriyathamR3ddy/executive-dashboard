import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    // Enable fast refresh
    fastRefresh: true
  })],
  optimizeDeps: {
    exclude: ['lucide-react'],
    force: true, // Force dependency optimization
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled',
            'chart.js',
            'recharts',
            'd3'
          ]
        }
      }
    }
  },
  server: {
    fs: {
      strict: true
    },
    hmr: {
      overlay: false,
      timeout: 60000, // Increased timeout to 60 seconds
      port: 24678,
      clientPort: 24678,
      host: 'localhost'
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  }
});