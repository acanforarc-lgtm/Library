#!/usr/bin/env node
// Build script:
// 1. Extracts the <script type="text/babel"> block from index.html
// 2. Pre-compiles JSX → plain JS using @babel/core (no runtime Babel needed)
// 3. Removes the babel.min.js CDN script tag
// 4. Wraps compiled code in DOMContentLoaded (matching browser-Babel timing)
// 5. Writes the result to www/index.html

const fs   = require('fs');
const path = require('path');
const babel = require('@babel/core');

const src  = path.join(__dirname, '..', 'index.html');
const dest = path.join(__dirname, '..', 'www', 'index.html');

let html = fs.readFileSync(src, 'utf8');

// --- 1. Remove the Babel standalone CDN tag ---
html = html.replace(/<script src="[^"]*babel\.min\.js[^"]*"><\/script>\n?/g, '');

// --- 2. Find the <script type="text/babel"> block ---
const START = '<script type="text/babel">';
const END   = '</script>';
const startIdx = html.indexOf(START);
if (startIdx === -1) throw new Error('Could not find <script type="text/babel"> in index.html');

const codeStart = startIdx + START.length;
const endIdx    = html.indexOf(END, codeStart);
if (endIdx === -1) throw new Error('Could not find closing </script> for babel block');

const jsxCode = html.slice(codeStart, endIdx);

// --- 3. Compile JSX → JS ---
console.log('Compiling JSX...');
const { code } = babel.transformSync(jsxCode, {
  presets: [
    ['@babel/preset-react', { runtime: 'classic' }]
  ],
  filename: 'app.jsx',
  sourceType: 'script',
  // No preset-env needed — WKWebView on iOS 15+ supports all modern JS
});
console.log(`Compiled: ${(jsxCode.length / 1024).toFixed(0)} KB → ${(code.length / 1024).toFixed(0)} KB`);

// --- 4. Wrap in DOMContentLoaded (matches browser-Babel execution timing) ---
// Browser Babel processes type="text/babel" scripts after DOMContentLoaded,
// ensuring all CDN scripts (React, Supabase, etc.) are available. Wrap the
// pre-compiled code in the same listener for identical runtime behaviour.
const wrappedCode = `document.addEventListener('DOMContentLoaded', function() {\n${code}\n});`;

// --- 5. Splice the compiled code back in as a plain <script> ---
html = html.slice(0, startIdx) + '<script>\n' + wrappedCode + '\n</script>' + html.slice(endIdx + END.length);

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, html);
console.log('Built: index.html → www/index.html (Babel pre-compiled, DOMContentLoaded wrapped)');
