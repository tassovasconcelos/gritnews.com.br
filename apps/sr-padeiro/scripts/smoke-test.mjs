import fs from 'node:fs';
import path from 'node:path';

const required = ['dist/index.html','dist/robots.txt','dist/sitemap.xml','dist/manifest.webmanifest'];
for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error(`Missing build artifact: ${file}`);
    process.exit(1);
  }
}
const html = fs.readFileSync(path.resolve('dist/index.html'),'utf8');
for (const expected of ['Sr. Padeiro','srpadeiro.gritnews.com.br']) {
  if (!html.includes(expected)) {
    console.error(`Expected content missing: ${expected}`);
    process.exit(1);
  }
}
console.log('Sr. Padeiro smoke test passed.');
