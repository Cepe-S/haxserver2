const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/shared/data');
const destDir = path.join(__dirname, '../dist/shared/data');

fs.mkdirSync(destDir, { recursive: true });

for (const file of ['teams.json', 'matches.json']) {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
}

console.log('Copied teams.json and matches.json to dist/shared/data');
