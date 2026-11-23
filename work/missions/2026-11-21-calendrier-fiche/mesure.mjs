// node mesure.mjs [v01 …] : captures (repos, édition, limite en clair ; repos en cave) et mesures de la fiche à 390 × 844.
// Mesures : hauteur de la fiche visible (≤ 40 % de 844 = 338 px), mots de texte courant hors nom et nombres (≤ 12),
// valeurs modifiables d'un toucher (liens .ed), débordement horizontal.
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.resolve(ICI, '../../../package.json'));
const pp = req('puppeteer-core');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Array.from({ length: 12 }, (_, i) => `v${String(i + 1).padStart(2, '0')}`);
fs.mkdirSync(path.join(ICI, 'captures'), { recursive: true });
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const NOMBRE = /^[−+\-]?[\d?][\d\s,./%→]*$|^(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?$|^(CHF|J\d+|J\d+\/\d+|S\d+|sem\.?|j|%|·|→|\?|\d+\/\d+)$/i;
let ko = 0;
for (const id of ids) {
  const lignes = [];
  for (const [etat, theme] of [['repos', 'light'], ['edition', 'light'], ['limite', 'light'], ['repos', 'dark']]) {
    const p = await nav.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await p.goto(pathToFileURL(path.join(ICI, `${id}.html`)).href + (etat === 'repos' ? '' : `#${etat}`), { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 250));
    const m = await p.evaluate((src) => {
      const re = new RegExp(src, 'i');
      const f = [...document.querySelectorAll('[data-fiche]')].find((el) => el.getBoundingClientRect().height > 0);
      if (!f) return { err: 'aucune fiche visible' };
      const r = f.getBoundingClientRect();
      const c = f.cloneNode(true);
      c.querySelectorAll('[data-nom], svg').forEach((n) => n.remove());
      document.body.appendChild(c); c.style.position = 'absolute'; c.style.left = '-9999px';
      const toks = (c.innerText || '').replace(/[·→,]/g, ' ').split(/\s+/).filter(Boolean);
      c.remove();
      const mots = toks.filter((t) => !re.test(t));
      const petits = [...f.querySelectorAll('*')].filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 14).length;
      return { h: Math.round(r.height), top: Math.round(r.top), bas: Math.round(r.bottom), mots, eds: f.querySelectorAll('a.ed, .ed').length, deb: document.documentElement.scrollWidth - 390, petits };
    }, NOMBRE.source);
    const nom = `${id}-${etat}${theme === 'dark' ? '-cave' : ''}`;
    await p.screenshot({ path: path.join(ICI, 'captures', `${nom}.jpg`), type: 'jpeg', quality: 82 });
    await p.close();
    if (m.err) { lignes.push(`${nom} ${m.err}`); ko++; continue; }
    const fautes = [];
    if (m.h > 338) fautes.push(`hauteur ${m.h} > 338`);
    if (m.bas > 788) fautes.push(`bas ${m.bas} sous les onglets`);
    if (m.mots.length > 12) fautes.push(`${m.mots.length} mots`);
    if (m.deb > 0) fautes.push(`déborde ${m.deb}`);
    if (m.petits) fautes.push(`${m.petits} textes < 14 px`);
    if (etat === 'repos' && theme === 'light' && m.eds < 2) fautes.push(`${m.eds} valeur(s) modifiable(s)`);
    if (fautes.length) ko++;
    lignes.push(`${nom} h=${m.h} haut=${m.top} mots=${m.mots.length}[${m.mots.join(' ')}] ed=${m.eds}${fautes.length ? ' KO: ' + fautes.join(', ') : ' ok'}`);
  }
  console.log(lignes.join('\n'));
}
await nav.close();
console.log(ko ? `MESURE ECHEC (${ko})` : 'MESURE OK');
