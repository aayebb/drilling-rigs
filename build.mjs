// Builds index.html (single self-contained file) from src/ + template.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
const out = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false });
const js = out.outputFiles[0].text.replaceAll('</script', '<\\/script');
writeFileSync('index.html', readFileSync('template.html', 'utf8').replace('/*BUNDLE*/', () => js));
console.log('index.html written');
