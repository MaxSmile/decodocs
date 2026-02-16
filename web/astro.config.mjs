import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  outDir: './decodocs.com',
  vite: {
    server: {
      port: 3000,
      open: false,
    },
    define: {
      'process.env': {},
    },
  },
});
