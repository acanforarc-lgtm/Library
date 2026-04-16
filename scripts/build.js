#!/usr/bin/env node
// Copies index.html into www/ (the Capacitor web dir)
const fs = require('fs');
const path = require('path');

const src  = path.join(__dirname, '..', 'index.html');
const dest = path.join(__dirname, '..', 'www', 'index.html');

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log('Built: index.html → www/index.html');
