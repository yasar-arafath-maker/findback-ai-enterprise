import base44 from '@base44/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve, join } from 'path'
import fs from 'fs'

const resolveFile = (basePath) => {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath.replace(/\\/g, '/');
  }
  const extensions = ['.jsx', '.js', '.tsx', '.ts', '.json'];
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath.replace(/\\/g, '/');
    }
  }
  return null;
};

// Custom resolver plugin supporting standard src/ folder structure:
// Resolves @/ aliases and relative imports across src/ subdirectories seamlessly.
const srcFolderResolver = () => ({
  name: 'src-folder-resolver',
  enforce: 'pre',
  resolveId(source, importer) {
    const cleanSource = source.replace(/\\/g, '/');
    const rootPath = __dirname.replace(/\\/g, '/');

    let relPath = null;
    if (cleanSource.startsWith('@/')) {
      relPath = cleanSource.slice(2);
    } else if (cleanSource.startsWith(rootPath + '/src/')) {
      relPath = cleanSource.slice(rootPath.length + 5);
    } else if (cleanSource.startsWith(rootPath + '/')) {
      relPath = cleanSource.slice(rootPath.length + 1);
    }

    if (relPath) {
      const strippedRel = relPath.replace(/^(src\/)?(components\/ui|components|pages|context|api|lib|hooks|integrations|entities|utils)\//, '');
      const candidates = [
        join(__dirname, 'src', relPath),
        join(__dirname, 'src', strippedRel),
        join(__dirname, 'src', 'components', strippedRel),
        join(__dirname, 'src', 'components', 'ui', strippedRel),
        join(__dirname, 'src', 'pages', strippedRel),
        join(__dirname, 'src', 'context', strippedRel),
        join(__dirname, 'src', 'api', strippedRel),
        join(__dirname, 'src', 'lib', strippedRel),
      ];
      for (const candidate of candidates) {
        const found = resolveFile(candidate);
        if (found) return found;
      }
    }

    if (!importer) return null;

    // Handle relative imports between src files (e.g. import foo from './foo')
    if (cleanSource.startsWith('./') || cleanSource.startsWith('../')) {
      const importerDir = resolve(importer, '..');
      const directTarget = resolve(importerDir, cleanSource);
      const directFound = resolveFile(directTarget);
      if (directFound) return directFound;

      // If direct relative resolution fails, search src subdirectories
      const fileName = cleanSource.split('/').pop().replace(/\.(jsx?|tsx?|json)$/, '');
      const subDirs = ['', 'components', 'components/ui', 'pages', 'context', 'api', 'lib'];
      for (const subDir of subDirs) {
        const tryPath = join(__dirname, 'src', subDir, fileName);
        const subFound = resolveFile(tryPath);
        if (subFound) return subFound;
      }
    }

    return null;
  },
});

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  plugins: [
    srcFolderResolver(),
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});







