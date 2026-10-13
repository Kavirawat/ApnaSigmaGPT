import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spaFallbackPlugin = () => ({
  name: 'spa-fallback-plugin',
  closeBundle() {
    const dist = path.resolve(__dirname, 'dist');
    const indexFile = path.join(dist, 'index.html');
    if (fs.existsSync(indexFile)) {
      const dashboardDir = path.join(dist, 'dashboard');
      fs.mkdirSync(dashboardDir, { recursive: true });
      fs.copyFileSync(indexFile, path.join(dashboardDir, 'index.html'));
      fs.copyFileSync(indexFile, path.join(dist, '404.html'));
    }
  },
});

export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
});
