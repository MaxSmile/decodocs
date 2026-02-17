import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  outDir: './decodocs.com',
  server: {
    port: 3000,
  },
  vite: {
    define: {
      'process.env': {},
    },
  },
});
