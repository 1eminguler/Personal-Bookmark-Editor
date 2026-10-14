import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const zipPath = path.resolve('sahsi-bookmark-extension.zip');

if (!fs.existsSync(distDir)) {
  console.error('Dist directory does not exist! Please run "npm run build" first.');
  process.exit(1);
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`);
  } else {
    execSync(`cd "${distDir}" && zip -r "${zipPath}" ./*`);
  }
  const stats = fs.statSync(zipPath);
  console.log(`Successfully created ZIP archive: ${zipPath} (${stats.size} bytes)`);
} catch (err) {
  console.error('Failed to create ZIP archive:', err);
  process.exit(1);
}
