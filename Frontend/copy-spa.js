import fs from 'fs';
import path from 'path';

const dist = path.resolve('dist');
const indexFile = path.join(dist, 'index.html');

if (fs.existsSync(indexFile)) {
  // 1. Create dist/dashboard/index.html so /dashboard is a physical static file (200 OK)
  const dashboardDir = path.join(dist, 'dashboard');
  fs.mkdirSync(dashboardDir, { recursive: true });
  fs.copyFileSync(indexFile, path.join(dashboardDir, 'index.html'));

  // 2. Create dist/404.html as a fallback for static hosts like Render
  fs.copyFileSync(indexFile, path.join(dist, '404.html'));

  console.log('SPA fallbacks generated: dist/dashboard/index.html and dist/404.html created.');
}
