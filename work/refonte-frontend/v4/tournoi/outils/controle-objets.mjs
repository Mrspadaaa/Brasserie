// D40 (18.10, soir) : « Déjà dit mais attention au piège !! Je pense qu'il y a confusion entre,
// ce que j'ai actuellement dans ma bière, son profil. Le style de la bière, un target. La
// comparaison manuel entre plusieurs houblons. Et la comparaison par suggestions de l'outils ».
// Le piège revenu au lot 4 : la couleur d'alerte (« ma bière dépasse la cible ») peinte sur
// les houblons eux-mêmes (« Résineux 2/4 » en orange dans les fiches, « plus que Nugget » en
// accent dans Comparer). D19 contrôlait l'objet de chaque radar, pas la couleur.
// Règle : la couleur d'alerte ne vit que sur l'objet « ma bière face à la cible ».
// Révision (18.10, soir, Beer Maverick en exemple : « il faut faire mieux, pas moins bien ») :
// l'interdit vise la couleur d'alerte, pas toute couleur. Un houblon de Comparer a sa couleur
// (comme chez Beer Maverick), pourvu qu'elle reste loin de l'alerte. L'alerte est lue dans la
// page (--alerte, sinon --acc, sur :root) ; à défaut, la plage rouge-orangé (teinte 340° à 45°).
// Une couleur fautive : saturée (s > 0,35) et à 25° de teinte ou moins de l'alerte.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-objets.mjs <dossier> [ids…]
// Vérifie sur chaque page de chaque variante, à 390 (fiche ouverte : page fiche.html) :
//   (a) dans un radar de houblons (svg[data-objet="houblons"] ou data-objet="fiche") et dans la
//       fiche ouverte (data-role="fiche"), aucun texte, trait ni remplissage en teinte saturée ;
//   (b) dans un radar de voies (data-objet="voies"), seules les séries « avant » (ma bière) et
//       « zone » peuvent porter la teinte saturée : jamais une voie (« après »).
// Imprime OBJETS OK si tout passe, sinon OBJETS ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  for (const f of fs.readdirSync(path.join(dir, id)).filter((x) => x.endsWith('.html')).sort()) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(pathToFileURL(path.join(dir, id, f)).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 300));
    const r = await page.evaluate(() => {
      // Teinte de l'alerte déclarée par la page (--alerte, sinon --acc), ou null.
      const ALERTE = (() => {
        const cs = getComputedStyle(document.documentElement), v = (cs.getPropertyValue('--alerte') || cs.getPropertyValue('--acc')).trim();
        if (!v) return null;
        const t = document.createElement('i'); t.style.color = v; document.body.appendChild(t); const c = getComputedStyle(t).color; t.remove();
        const m = c.match(/[d.]+/g); if (!m) return null;
        const [R, G, B] = m.slice(0, 3).map((x) => Number(x) / 255), mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn; if (!d) return null;
        const h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; return (h * 60 + 360) % 360;
      })();
      const sat = (c) => {
        const m = c && c.match(/[\d.]+/g); if (!m) return false;
        const [r, g, b, a = 1] = m.map(Number); if (a < 0.3) return false;
        const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
        if (!d) return false;
        const s = d / (1 - Math.abs(2 * l - 1));
        if (!(s > 0.35 && l > 0.15 && l < 0.85)) return false;
        let h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h = (h * 60 + 360) % 360;
        if (ALERTE === null) return h >= 340 || h <= 45;
        const dh = Math.abs(h - ALERTE); return Math.min(dh, 360 - dh) <= 25;
      };
      const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.2; };
      const colore = (e) => { const cs = getComputedStyle(e); return ['color', 'fill', 'stroke', 'backgroundColor', 'borderTopColor'].some((k) => (k !== 'borderTopColor' || parseFloat(cs.borderTopWidth) > 0) && (k !== 'color' || [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) && sat(cs[k])); };
      const out = [];
      const zones = [...document.querySelectorAll('svg[data-objet="houblons"], svg[data-objet="fiche"], [data-role="fiche"]')].filter(vis);
      for (const z of zones) {
        // D40 ter (19.10, base v4.9, fiche g1 choisie : « la v1 est la meilleure ») : la case ou l'axe qui
        // déclare sa famille (data-famille) porte le code couleur des arômes, pas l'alerte de ma bière.
        const fautifs = [...z.querySelectorAll('*')].filter(vis).filter((e) => !e.closest('[data-famille]')).filter(colore);
        if (fautifs.length) out.push((z.getAttribute('data-objet') || 'fiche') + ' : ' + fautifs.length + ' élément(s) en couleur d\'alerte (« ' + (fautifs[0].textContent || fautifs[0].tagName).trim().slice(0, 18) + ' »)');
      }
      for (const s of [...document.querySelectorAll('svg[data-objet="voies"]')].filter(vis)) {
        const fautifs = [...s.querySelectorAll('[data-serie]')].filter((e) => !/^(avant|zone)$/i.test(e.getAttribute('data-serie')))
          .flatMap((e) => [e, ...e.querySelectorAll('*')]).filter(colore);
        if (fautifs.length) out.push('voies : une voie (« ' + fautifs[0].closest('[data-serie]').getAttribute('data-serie') + ' ») porte la couleur d\'alerte');
      }
      return out;
    });
    await page.close();
    for (const x of r) p(f + ' : ' + x);
  }
  console.log(id + ' · objets contrôlés');
}
await browser.close();
if (problems.length === 0) console.log('OBJETS OK ' + ids.length + '/' + ids.length);
else { console.log('OBJETS ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
