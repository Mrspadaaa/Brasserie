// D-b : le badge « Rattacher les n » de la bande Malts chevauche-t-il le compte (« 7 +4 ↳ ») ou le nom ? Usage : node mesurer-bande.mjs <prefixe> [largeur...]
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ici = path.dirname(fileURLToPath(import.meta.url));
const [prefixe, ...largeurs] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const l of (largeurs.length ? largeurs : ['390', '1280'])) {
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const p = await b.newPage();
      await p.setViewport({ width: +l, height: 800, hasTouch: +l < 600 });
      await p.goto('http://localhost:5651/work/missions/2026-11-09-levure-port/voies/b-dep/harnais/index.html?s=piece&theme=clair', { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 3500));
      const m = await p.evaluate(() => {
        const bouton = document.querySelector('[data-dp-mouture-tous]'); if (!bouton) return { erreur: 'pas de bouton' };
        const ligne = bouton.parentElement; const compte = ligne.querySelector('[data-dp-bande-compte]'); const nom = ligne.querySelector('strong');
        const r = e => { const x = e.getBoundingClientRect(); return { g: Math.round(x.left), d: Math.round(x.right), h: Math.round(x.top), b: Math.round(x.bottom) }; };
        const chevauche = (a, c) => a.g < c.d - 0.5 && c.g < a.d - 0.5 && a.h < c.b && c.h < a.b;
        const qte = ligne.querySelector('[data-dp-sous-qte]');
        return { ligne: r(ligne), nom: r(nom), compte: r(compte), bouton: r(bouton), qte: r(qte), compteTexte: compte.textContent, boutonTexte: bouton.textContent, boutonTronque: bouton.scrollWidth > bouton.clientWidth, sur_compte: chevauche(r(bouton), r(compte)), sur_nom: chevauche(r(bouton), r(nom)), sur_qte: chevauche(r(bouton), r(qte)), compteTronque: compte.scrollWidth > compte.clientWidth, hauteurLigne: Math.round(ligne.getBoundingClientRect().height) };
      });
      console.log(l, JSON.stringify(m));
      const el = await p.$('[data-dp-mouture-tous]');
      const parent = await el.evaluateHandle(e => e.parentElement);
      await parent.asElement().screenshot({ path: path.join(ici, `${prefixe}-bande-${l}.png`) });
      await p.screenshot({ path: path.join(ici, `${prefixe}-bande-page-${l}.png`) });
      await p.close(); break;
    } catch (e) { if (essai === 3) throw e; }
  }
}
await b.close();
