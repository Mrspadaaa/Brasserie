// D381, banc hors ligne : passe chaque pièce piégée (jpg + masque) dans `harnais.html` (servi par Vite depuis la copie de banc) et compte, pour
// TOUTES les pièces : lignes coupées en silence (doit être 0), lignes coupées mais signalées, lignes perdues ou rognées par le recadrage (doit être 0).
// Usage : node controler.mjs <url de harnais.html> <dossier de pièces> [<rapport.json>]
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';

const [url, dossier, rapport = path.join(dossier, 'controle.json')] = process.argv.slice(2);
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await nav.newPage();
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__pret === true, { timeout: 60_000 });
const pieces = fs.readdirSync(dossier).filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4)).filter(n => fs.existsSync(path.join(dossier, `${n}.masque.png`)));
const lignes = [];
let silencieuses = 0, signalees = 0, perdues = 0, rognees = 0, sansDecoupe = 0;
for (const nom of pieces) {
  const photo = fs.readFileSync(path.join(dossier, `${nom}.jpg`)).toString('base64'), masque = fs.readFileSync(path.join(dossier, `${nom}.masque.png`)).toString('base64');
  const r = await page.evaluate((a, b) => window.__controler(a, b), photo, masque);
  lignes.push({ nom, ...r });
  if (r.rien) { sansDecoupe++; continue; }
  silencieuses += r.coupeesSilencieuses.length; signalees += r.coupeesSignalees; perdues += r.perdues.length; rognees += r.rognees.length;
  if (r.coupeesSilencieuses.length || r.perdues.length || r.rognees.length)
    console.log(`${nom} : ${r.morceaux} morceaux, angle ${r.angleGeo}, coupées en silence ${r.coupeesSilencieuses.map(x => `${x.ligne}@${x.coupe}`).join(' ') || 0}, perdues ${r.perdues.length}, rognées ${r.rognees.length}`);
}
fs.writeFileSync(rapport, JSON.stringify(lignes, null, 1));
const ms = lignes.filter(l => !l.rien).map(l => l.msPlan).sort((a, b) => a - b);
console.log(`${pieces.length} pièces : sans découpe ${sansDecoupe} ; lignes coupées en silence ${silencieuses} ; coupées signalées ${signalees} ; perdues ${perdues} ; rognées ${rognees} ; plan médian ${ms[Math.floor(ms.length / 2)] ?? '-'} ms, max ${ms.at(-1) ?? '-'} ms`);
console.log(silencieuses === 0 && perdues === 0 && rognees === 0 ? 'DÉCOUPE OK' : 'DÉCOUPE ÉCHEC');
await nav.close();
