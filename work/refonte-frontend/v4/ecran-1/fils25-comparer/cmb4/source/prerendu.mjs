// Pose dans etat.html le rendu au repos de la page (#parcours), pour une lecture sans script ; au chargement, React
// (createRoot) remplace ce rendu par le même, jouable. Assemblage par split/join (L26).
import puppeteer from 'puppeteer-core'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const f of process.argv.slice(2)) {
  const brut = fs.readFileSync(f, 'utf8');
  const VIDE = '<div id="parcours"></div>';
  const base = brut.includes(VIDE) ? brut : brut.replace(/<div id="parcours">[\s\S]*?<\/div><!--fin-parcours-->/, VIDE);
  fs.writeFileSync(f, base);
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0' }); await new Promise((r) => setTimeout(r, 800));
  const inner = await p.evaluate(() => document.getElementById('parcours').innerHTML); await p.close();
  fs.writeFileSync(f, base.split(VIDE).join('<div id="parcours">' + inner + '</div><!--fin-parcours-->'));
  console.log('prérendu', f, inner.length);
}
await b.close();
