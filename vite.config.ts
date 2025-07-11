import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '1793983364c8.ngrok-free.app',
    ],
  }
});
