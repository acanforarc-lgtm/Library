#!/usr/bin/env node
// Pre-compiles JSX in index.html to plain JS at build time.
// Output: dist/index.html — Babel CDN tag removed, JSX already compiled.
// Run by GitHub Actions before deploy; never needed for local dev.

const fs   = require('fs');
const path = require('path');
const babel = require('@babel/core');

const src  = path.join(__dirname, '..', 'index.html');
const dist = path.join(__dirname, '..', 'dist');
const dest = path.join(dist, 'index.html');

let html = fs.readFileSync(src, 'utf8');

// 1. Strip the Babel CDN script tag (no longer needed at runtime)
html = html.replace(/<script[^>]+babel\.min\.js[^>]*><\/script>\n?/g, '');

// 2. Locate the text/babel script block
const OPEN  = '<script type="text/babel">';
const CLOSE = '</script>';
const start = html.indexOf(OPEN);
if (start === -1) { console.error('ERROR: <script type="text/babel"> not found'); process.exit(1); }
const jsxStart = start + OPEN.length;
const end = html.indexOf(CLOSE, jsxStart);
if (end === -1) { console.error('ERROR: closing </script> not found'); process.exit(1); }

const jsx = html.slice(jsxStart, end);

// 3. Compile JSX → plain JS (React.createElement calls).
//    Only transforms JSX syntax; all modern JS stays as-is for native browser support.
const { code } = babel.transformSync(jsx, {
    presets: [['@babel/preset-react', { runtime: 'classic' }]],
    // Transform const/let → var to match browser Babel's behaviour and eliminate TDZ errors
    plugins: ['@babel/plugin-transform-block-scoping'],
    filename: 'app.jsx',
    sourceMaps: false,
    compact: false,
});

// 4. Splice compiled code back in
const compiled = html.slice(0, start) + '<script>' + code + CLOSE + html.slice(end + CLOSE.length);

// 5. Write to dist/
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(dest, compiled, 'utf8');

const orig = Buffer.byteLength(html, 'utf8');
const out  = Buffer.byteLength(compiled, 'utf8');
console.log(`Compiled → dist/index.html  (${(orig / 1024).toFixed(0)} KB → ${(out / 1024).toFixed(0)} KB, Babel runtime removed)`);
