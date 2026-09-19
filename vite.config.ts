import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Força o Rollup a mapear a importação de react-is diretamente
      'react-is': 'react-is'
    }
  },
  optimizeDeps: {
    include: ['react-is', 'recharts']
  }
});