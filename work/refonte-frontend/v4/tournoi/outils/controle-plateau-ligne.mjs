// D353 à D355 (02.11, soir, sur sa capture de pu4c-a) :
// D353 « Pas d'unité pour un objet ? Comment avec avec stk ? » : tout choix d'unité visible offre la pièce (« Stk » sur le papier).
// D354 « on voit toujours un changement de relecture alors que en théorie on a tout accepté ? » : une valeur barrée ne se montre
//   que si son geste attend (« Tout valider », « Garder », « Remettre », « Revenir à » visible).
// D355 « Ça parle d'un autre item sur le détail d'un ? » : sous la bande des malts, aucune autre ligne nommée
//   (« n à régler · X › », « Suivante : X »). Lecture étroite : la position sans nom (« ‹ 1 sur 2 › ») reste permise.
// Usage : node controle-plateau-ligne.mjs <etat.html> [--etats repos,a,b,c,d,e,f] [--theme cave]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : defaut; };
const fichier = path.resolve(args[0] ?? '');
const etats = option('--etats', 'repos,a,b,c,d,e,f').split(',');
const theme = option('--theme', null);

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const defauts = [];
try {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  for (const etat of etats) {
    await p.goto(`${pathToFileURL(fichier).href}?etat=${etat}${theme ? `&theme=${theme}` : ''}`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 150));
    defauts.push(...await p.evaluate((etat) => {
      const vu = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const texte = (e) => e.textContent.replace(/\s+/g, ' ').trim();
      const out = [];
      // D353 : un parent qui porte au moins deux choix d'unité doit porter la pièce.
      const UNITE = /^(Kg|kg|g|sachets?|pièces?|L|Stk|…)$/;
      const choix = [...document.querySelectorAll('button,[role=radio],[aria-pressed],[data-choix],label')].filter((e) => vu(e) && UNITE.test(texte(e)));
      const parents = new Map();
      for (const c of choix) { const k = c.parentElement; parents.set(k, [...(parents.get(k) ?? []), texte(c)]); }
      for (const unites of parents.values()) {
        if (unites.length >= 2 && !unites.some((u) => /pièce|Stk/.test(u))) out.push(`${etat} · choix d'unité « ${unites.join(' | ')} » sans la pièce`);
      }
      // D354 : une valeur barrée sans geste qui l'attend.
      const barres = [...document.querySelectorAll('body *')].filter((e) => vu(e) && e.children.length === 0 && texte(e) && getComputedStyle(e).textDecorationLine.includes('line-through'));
      const geste = [...document.querySelectorAll('button,[role=button]')].some((b) => vu(b) && /Tout valider|Garder|Remettre|Revenir à/.test(texte(b)));
      if (barres.length && !geste) out.push(`${etat} · « ${texte(barres[0])} » barré sans geste qui l'attend`);
      // D355 : sous la bande des malts, un renvoi vers une autre ligne.
      const bande = [...document.querySelectorAll('body *')].find((e) => vu(e) && e.children.length === 0 && /^Malts$/.test(texte(e)));
      const haut = bande ? bande.getBoundingClientRect().top + scrollY : 0;
      for (const e of document.querySelectorAll('body *')) {
        if (!vu(e) || e.children.length > 3) continue;
        const t = texte(e);
        if (t.length > 60 || !/(à régler|Suivante)\s*[·:]\s*\p{Lu}/iu.test(t)) continue;
        if (e.getBoundingClientRect().top + scrollY > haut) { out.push(`${etat} · « ${t} » dans la liste, nomme une autre ligne`); break; }
      }
      return out;
    }, etat));
  }
} finally {
  await nav.close();
}
const uniques = [...new Set(defauts)];
const nom = path.basename(path.dirname(fichier));
if (uniques.length) {
  console.log(`LIGNE ECHEC (${uniques.length}) — ${nom}`);
  for (const d of uniques) console.log(`  - ${d}`);
  process.exit(1);
}
console.log(`LIGNE OK — ${nom} : pièce offerte, aucun barré sans geste, aucune autre ligne nommée (${etats.length} états)`);
