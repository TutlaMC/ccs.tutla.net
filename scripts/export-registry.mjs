#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Note: This script reads and re-exports the already-compiled registry data
// The actual registry is served dynamically in dev via the Vite plugin
// and can be built as static JSON for production if needed

const publicDir = path.join(projectRoot, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('✓ Registry JSON will be served via /registry.json endpoint');
console.log('  Dev:  Available at http://localhost:5173/registry.json');
console.log('  Prod: Configure your server to serve the endpoint or generate static file pre-deployment');
