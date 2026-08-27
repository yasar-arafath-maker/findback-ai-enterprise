import base44 from '@base44/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve, join } from 'path'
import fs from 'fs'

// Custom plugin: all source files live flat at project root (no src/ directory).
// Intercept both @/ and pre-aliased paths (e.g., D:/findit/components/ui/toaster)
// and resolve them to flat root files.
const flatRootResolver = () => ({
  name: 'flat-root-resolver',
  enforce: 'pre',
  resolveId(source) {
    const clean = source.replace(/\\/g, '/');
    const rootPath = __dirname.replace(/\\/g, '/');
    let relative = null;

    if (clean.startsWith('@/')) {
      relative = clean.slice(2);
    } else if (clean.startsWith(rootPath + '/')) {
      relative = clean.slice(rootPath.length + 1);
    }

    if (!relative) return null;

    const stripped = relative
      .replace(/^(components\/ui|components|pages|lib|hooks|integrations|entities|api|utils)\//, '');

    const basePath = join(__dirname, stripped);
    const normalize = p => p.replace(/\\/g, '/');

    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
      return normalize(basePath);
    }

    const extensions = ['.jsx', '.js', '.tsx', '.ts', '.json'];
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath)) {
        return normalize(fullPath);
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
      // Fallback: @/ → project root for any case the plugin misses
      '@': resolve(__dirname, '.'),
    },
  },
  plugins: [
    flatRootResolver(),
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

