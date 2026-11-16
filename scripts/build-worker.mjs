// Génère worker/assets.generated.js : la liste des fichiers de public/ embarqués dans le Worker.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const pub = join(root, 'public');
const TYPES = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
  mp4: 'video/mp4', txt: 'text/plain; charset=utf-8', xml: 'application/xml; charset=utf-8',
};
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (!name.startsWith('_')) files.push(relative(pub, p).split('\\').join('/'));
  }
})(pub);
// Textes embarqués comme chaînes ; binaires importés comme modules « Data » (ArrayBuffer).
const BINARY = new Set(['png', 'jpg', 'mp4']);
const lines = [];
const map = files.map((f, i) => {
  const ext = f.split('.').pop();
  if (!TYPES[ext]) throw new Error(`Type inconnu : ${f}`);
  let body;
  if (BINARY.has(ext)) { lines.push(`import a${i} from '../public/${f}';`); body = `a${i}`; }
  else body = JSON.stringify(readFileSync(join(pub, f), 'utf8'));
  return `  '/${f}': { body: ${body}, type: '${TYPES[ext]}' },`;
});
writeFileSync(join(root, 'worker/assets.generated.js'), `// Fichier généré par scripts/build-worker.mjs — ne pas modifier.\n${lines.join('\n')}\n\nexport const ASSETS = {\n${map.join('\n')}\n};\n`);
console.log(`${files.length} fichiers embarqués.`);
