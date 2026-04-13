const fs = require('fs');
const p = 'client/app.js';
const t = fs.readFileSync(p, 'utf8');
const updated = t.split('fetch("/api/').join('fetch("http://localhost:3000/api/');
fs.writeFileSync(p, updated, 'utf8');
console.log('updated client/app.js');
