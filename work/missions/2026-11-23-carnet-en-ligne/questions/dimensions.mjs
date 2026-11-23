// Pose dans page.html la vraie taille de chaque image (en-tête PNG) et le compte de mots de Q-5 (mots.json).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url)); const f = path.join(ICI, 'page.html');
let s = fs.readFileSync(f, 'utf8');
s = s.replace(/<img src="(img\/[^"]+\.png)"([^>]*?) width="\d+" height="\d+">/g, (m, src, reste) => {
  const b = fs.readFileSync(path.join(ICI, src)); return `<img src="${src}"${reste} width="${b.readUInt32BE(16)}" height="${b.readUInt32BE(20)}">`;
});
const mots = JSON.parse(fs.readFileSync(path.join(ICI, 'mots.json'), 'utf8'));
s = s.replace('MOTS_A', String(mots.q5a)).replace('MOTS_B', String(mots.q5b));
fs.writeFileSync(f, s); console.log('tailles posées ; mots', mots);
