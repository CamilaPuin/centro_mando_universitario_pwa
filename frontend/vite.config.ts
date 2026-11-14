import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '.', 'VITE_');
  const proxyTarget = environment.VITE_API_PROXY_TARGET || 'http://localhost:8080';
  return {
    base: '/centro_mando_universitario_pwa/',
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true }
      }
    }
  };
});