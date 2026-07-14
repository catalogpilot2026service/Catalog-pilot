import { copyFileSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

export function copyExtensionFiles(): Plugin {
  return {
    name: 'copy-extension-files',
    apply: 'build',
    closeBundle() {
      const root = process.cwd();
      const distDir = resolve(root, 'dist');
      if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

      // 1. Copy manifest.json
      const manifestSrc = resolve(root, 'src/manifest.json');
      const manifestDest = resolve(distDir, 'manifest.json');
      if (existsSync(manifestSrc)) {
        copyFileSync(manifestSrc, manifestDest);
      }

      // 2. Copy and fix HTML files from nested dist paths to dist root
      const htmlFiles: Array<{ src: string; dest: string }> = [
        { src: resolve(distDir, 'src/popup/index.html'), dest: resolve(distDir, 'popup.html') },
        { src: resolve(distDir, 'src/options/index.html'), dest: resolve(distDir, 'options.html') },
      ];

      for (const { src, dest } of htmlFiles) {
        if (!existsSync(src)) continue;
        let html = readFileSync(src, 'utf8');
        // Fix relative paths: Vite outputs ../../ from src/popup/ depth — flatten to ./
        html = html.split('../../').join('./');
        // Also handle any remaining ../ patterns
        html = html.split('../').join('./');
        writeFileSync(dest, html);
      }

      // 3. Ensure content.js and background.js are at dist root
      for (const jsName of ['background.js', 'content.js']) {
        const rootPath = resolve(distDir, jsName);
        if (!existsSync(rootPath)) {
          const assetsPath = resolve(distDir, 'assets', jsName);
          if (existsSync(assetsPath)) {
            copyFileSync(assetsPath, rootPath);
          }
        }
      }
    },
  };
}
