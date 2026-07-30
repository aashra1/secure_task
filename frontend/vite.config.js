import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const certificateDirectory = path.resolve(projectRoot, '../certs');

export default defineConfig(({ command }) => {
  const https = command === 'serve' ? {
    https: {
      key: fs.readFileSync(path.join(certificateDirectory, 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(certificateDirectory, 'localhost.pem'))
    }
  } : undefined;

  return {
    plugins: [react()],
    server: https,
    preview: https,
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    }
  };
});
