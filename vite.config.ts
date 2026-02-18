import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/send-email': {
            target: 'https://api.resend.com',
            changeOrigin: true,
            rewrite: (path) => '/emails',
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                // Forward API key from X-API-Key header to Authorization header
                const apiKey = req.headers['x-api-key'];
                if (apiKey) {
                  proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
                  proxyReq.removeHeader('x-api-key');
                }
              });
            },
          },
          '/api/send-line': {
            target: 'https://api.line.me',
            changeOrigin: true,
            rewrite: (path) => '/v2/bot/message/push',
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                // Forward LINE token from X-LINE-Token header to Authorization header
                const token = req.headers['x-line-token'];
                if (token) {
                  proxyReq.setHeader('Authorization', `Bearer ${token}`);
                  proxyReq.removeHeader('x-line-token');
                }
              });
            },
          },
          '/api/send-line-rich': {
            target: 'https://api.line.me',
            changeOrigin: true,
            rewrite: (path) => '/v2/bot/message/push',
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                // Forward LINE token from X-LINE-Token header to Authorization header
                const token = req.headers['x-line-token'];
                if (token) {
                  proxyReq.setHeader('Authorization', `Bearer ${token}`);
                  proxyReq.removeHeader('x-line-token');
                }
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
