import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
   const environment = loadEnv(mode, '.', 'VITE_');
  const proxyTarget = environment.VITE_API_PROXY_TARGET;
  return {
    base: '/centro_mando_universitario_pwa/',
    server: {
      ...(proxyTarget
        ? {
            proxy: {
              '/api': { target: proxyTarget, changeOrigin: true }
            }
          }
        : {})
    }
  };
});