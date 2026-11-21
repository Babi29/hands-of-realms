// Construit l'interface en un seul fichier HTML autonome : dist/hor.html (doctype complet) et dist/artifact.html (sans squelette).
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const out = await build({ entryPoints: ['src/ui/main.ts'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' });
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const body = readFileSync('ui/template.html', 'utf8').replace('/*BUNDLE*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/artifact.html', body);
writeFileSync('dist/hor.html', `<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n${body}\n</body></html>\n`);
console.log(`dist/hor.html (${(body.length / 1024).toFixed(0)} Ko)`);
