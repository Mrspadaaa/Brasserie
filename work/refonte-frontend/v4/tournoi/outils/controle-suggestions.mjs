// D52 (18.10, soir) : Suggestions pensées en brasseur. Le brasseur : « tout ce qui est suggestions
// et comparaison, c'est très mauvaise » ; « je sais pas comment bannir une contraintes ou réduire
// une autre » ; « Je veux choisir pas de 10' défini, pas de timing imposé » ; « il faut des
// intervalles de confiance » (D53) ; « un peu plus résineux pour une stout est pas très
// problématique, pour une lager kolsch très » (D54) ; biotransformation et levure « pas pour tout
// de suite ». Cadrage : work/refonte-frontend/v4/ecran-1/CADRAGE-SC.md.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-suggestions.mjs <dossier> [ids…]
//
// Pages : etat-b.html (Barres) et suggestions-radar.html (Radar), 390 × 844, data-partie="suggestions",
// scénario S1 (stout export trop résineuse, je la veux plus florale). Contrat :
//   [data-role="objectif"][data-famille][data-apriori="strict|normal|libre|banni"]  floral et resin ;
//     ses gestes [data-action="augmenter|reduire|bannir|retirer|apriori"] dedans, ou visibles avec
//     data-famille après un toucher sur l'objectif ;
//   [data-voie="<rang du pack>"]  une voie (au moins 3), avec dedans :
//     [data-role="changement"]  « Ajouter|Remplacer|Diminuer|Augmenter|Déplacer|Assembler|Retirer … »,
//       houblon, dose en g, moment ;
//     [data-role="effet"][data-famille=f] pour chaque objectif : data-avant, data-apres (0–100, vide
//       si non établi), data-ecart-avant, data-ecart-apres (en tolérances du style, D54),
//       data-min-apres, data-max-apres (ou data-plage="inconnue"), et dedans [data-role="piste"] et
//       [data-role="segment"] (la plage, D53) ;
//     [data-role="ibu"]  l'IBU après la voie (ou son écart signé) ;
//     [data-action="appliquer"] et [data-action="moment"] (le moment se règle) ; le stock en icône.
// Vérifie : objectifs au premier écran, bannir et au moins 3 gestes par objectif ; voies au contrat,
// la première au premier écran ; changement avant effet ; valeurs, écarts et plages = pack (S1.tolerance,
// voies[].ecartsApres) ; IBU = pack (± 0,6) ; aucun texte de stock ; aucune voie levure ni
// biotransformation ; segment visible quand la plage a une largeur.
// Imprime SUGGESTIONS OK si tout passe, sinon SUGGESTIONS ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../../..');
const S1 = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-mini-protos.json'), 'utf8')).scenarios.S1;
const OBJECTIFS = ['floral', 'resin'];
const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const num = (s) => (s === null || s === undefined || s === '' ? null : Number(String(s).replace(',', '.')));
const avant = (f) => S1.tolerance.biere.find((x) => x.family === f) || { valeur: null, ecart: null, plage: null };
const apres = (rang, f) => { const v = S1.voies.find((x) => String(x.rank) === String(rang)); return v ? v.ecartsApres.find((x) => x.family === f) || { valeur: null, ecart: null, plage: null } : undefined; };

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  for (const file of ['etat-b.html', 'suggestions-radar.html']) {
    if (!fs.existsSync(path.join(dir, id, file))) { p('D52 page ' + file + ' absente'); continue; }
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(pathToFileURL(path.join(dir, id, file)).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 400));
    const lire = () => page.evaluate((OBJ) => {
      const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.2; };
      const y = (e) => e.getBoundingClientRect().top + scrollY;
      const a = (e, k) => (e.hasAttribute(k) ? e.getAttribute(k) : null);
      return {
        partie: !!document.querySelector('[data-partie="suggestions"]'),
        objectifs: OBJ.map((f) => {
          const o = [...document.querySelectorAll('[data-role="objectif"][data-famille="' + f + '"]')].find(vis);
          if (!o) return { f, absent: true };
          const r = o.getBoundingClientRect();
          return { f, y: y(o), apriori: a(o, 'data-apriori'), cx: r.left + r.width / 2, cy: r.top + r.height / 2,
            gestes: [...new Set([...o.querySelectorAll('[data-action]'), ...document.querySelectorAll('[data-action][data-famille="' + f + '"]')].filter(vis).map((e) => e.getAttribute('data-action')))] };
        }),
        voies: [...document.querySelectorAll('[data-voie]')].filter(vis).map((v) => {
          const ch = v.querySelector('[data-role="changement"]'), ibu = v.querySelector('[data-role="ibu"]');
          return {
            rang: v.getAttribute('data-voie'), y: y(v), texte: v.innerText.replace(/\s+/g, ' ').trim(),
            changement: ch && vis(ch) ? { t: ch.innerText.replace(/\s+/g, ' ').trim(), y: y(ch) } : null,
            ibu: ibu && vis(ibu) ? ibu.innerText.trim() : null,
            actions: [...v.querySelectorAll('[data-action]')].map((e) => e.getAttribute('data-action')),
            effets: [...v.querySelectorAll('[data-role="effet"][data-famille]')].filter(vis).map((e) => {
              const piste = e.querySelector('[data-role="piste"]'), seg = e.querySelector('[data-role="segment"]');
              return { f: e.getAttribute('data-famille'), y: y(e), av: a(e, 'data-avant'), ap: a(e, 'data-apres'), eav: a(e, 'data-ecart-avant'), eap: a(e, 'data-ecart-apres'),
                min: a(e, 'data-min-apres'), max: a(e, 'data-max-apres'), inconnue: a(e, 'data-plage') === 'inconnue',
                piste: piste && vis(piste), segW: seg && vis(seg) ? seg.getBoundingClientRect().width : 0 };
            }),
          };
        }),
      };
    }, OBJECTIFS);
    let m = await lire();
    // Gestes d'un objectif : dedans, sinon après un toucher sur lui.
    for (const o of m.objectifs.filter((x) => !x.absent && x.gestes.length < 3)) {
      await page.evaluate((Y) => scrollTo(0, Math.max(0, Y - 200)), o.y);
      const c = await page.evaluate((f) => { const e = [...document.querySelectorAll('[data-role="objectif"][data-famille="' + f + '"]')].find((x) => x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, o.f);
      await page.touchscreen.tap(c[0], c[1]);
      await new Promise((r) => setTimeout(r, 450));
      const apres2 = await lire();
      const o2 = apres2.objectifs.find((x) => x.f === o.f);
      if (o2 && !o2.absent) o.gestes = [...new Set([...o.gestes, ...o2.gestes])];
    }
    await page.close();
    const q = (code, t) => p(code + ' ' + file + ' : ' + t);
    if (!m.partie) q('D19', 'la partie ne se nomme pas (data-partie="suggestions")');
    for (const o of m.objectifs) {
      if (o.absent) { q('D52', 'objectif « ' + o.f + ' » absent (data-role="objectif" data-famille)'); continue; }
      if (o.y > 844) q('D52', 'objectif « ' + o.f + ' » sous le premier écran');
      if (!['strict', 'normal', 'libre', 'banni'].includes(o.apriori)) q('D54', 'objectif « ' + o.f + ' » sans a priori (data-apriori strict, normal, libre ou banni)');
      if (!o.gestes.includes('bannir')) q('D52', 'objectif « ' + o.f + ' » : pas de geste pour le bannir (« je sais pas comment bannir une contraintes »)');
      if (o.gestes.filter((g) => ['augmenter', 'reduire', 'bannir', 'retirer', 'apriori'].includes(g)).length < 3) q('D52', 'objectif « ' + o.f + ' » : ' + o.gestes.length + ' geste(s) (augmenter, réduire, bannir, retirer, a priori : 3 au moins)');
    }
    if (m.voies.length < 3) q('D52', m.voies.length + ' voie(s) au contrat (data-voie), 3 au moins');
    const premiere = m.voies.slice().sort((a, b) => a.y - b.y)[0];
    if (premiere && (!premiere.changement || premiere.changement.y > 844)) q('D52', 'la première voie ne dit pas son changement au premier écran');
    for (const v of m.voies) {
      const lab = 'voie ' + v.rang;
      if (/levure|fermentation active|biotransf|thiol/i.test(v.texte)) q('D52', lab + ' : voie levure ou biotransformation (« pas pour tout de suite »)');
      if (/à acheter|à racheter|en stock|manque\s*\d/i.test(v.texte)) q('D23', lab + ' : le stock en texte (« Juste un petit badge ou info très subtil suffit »)');
      if (!v.changement) { q('D52', lab + ' : changement absent (data-role="changement")'); continue; }
      const t = v.changement.t;
      if (!/^(Ajouter|Remplacer|Diminuer|Augmenter|Déplacer|Assembler|Retirer)\b/.test(t)) q('D52', lab + ' : le changement ne commence pas par son verbe (« ' + t.slice(0, 30) + ' »)');
      if (!/\d+(?:[.,]\d+)?\s*g\b/.test(t)) q('D52', lab + ' : pas de dose en g dans le changement');
      if (!/\d+\s*′|whirlpool|J\s*\+?\s*\d|jour|à froid|dry/i.test(t)) q('D52', lab + ' : pas de moment dans le changement');
      if (!v.actions.includes('appliquer')) q('D52', lab + ' : pas de geste Appliquer');
      if (!v.actions.includes('moment')) q('D52', lab + ' : le moment ne se règle pas (« pas de timing imposé »)');
      const pv = S1.voies.find((x) => String(x.rank) === String(v.rang));
      if (!pv) { q('D52', lab + ' : rang inconnu du pack (data-voie = rang de S1.voies)'); continue; }
      if (!v.ibu) q('D52', lab + ' : IBU absent (data-role="ibu")');
      else { const ns = (v.ibu.match(/[+−-]?\s*\d+(?:[.,]\d+)?/g) || []).map((x) => Number(x.replace(/\s/g, '').replace('−', '-').replace(',', '.'))); if (!ns.some((x) => Math.abs(x - pv.ibu.after) <= 0.6 || Math.abs(x - pv.ibu.drift) <= 0.6)) q('D52', lab + ' : IBU faux (« ' + v.ibu.slice(0, 24) + ' », attendu ' + pv.ibu.after + ' ou ' + (pv.ibu.drift >= 0 ? '+' : '') + pv.ibu.drift + ')'); }
      for (const f of OBJECTIFS) {
        const e = v.effets.find((x) => x.f === f);
        if (!e) { q('D52', lab + ' : effet sur « ' + f + ' » absent (l\'objectif d\'abord)'); continue; }
        if (e.y < v.changement.y - 2) q('D52', lab + ' : l\'effet passe avant le changement');
        const A = avant(f), B = apres(v.rang, f);
        const egal = (x, y, tol) => (y === null || y === undefined ? x === null : x !== null && Math.abs(x - y) <= tol);
        if (!egal(num(e.av), A.valeur, 1)) q('D52', lab + ' ' + f + ' : avant ' + e.av + ' au lieu de ' + A.valeur + ' (pack)');
        if (!egal(num(e.ap), B.valeur, 1)) q('D52', lab + ' ' + f + ' : après ' + e.ap + ' au lieu de ' + B.valeur + ' (pack)');
        if (!egal(num(e.eav), A.ecart, 0.05)) q('D54', lab + ' ' + f + ' : écart avant ' + e.eav + ' au lieu de ' + A.ecart + ' tolérance(s) du style');
        if (!egal(num(e.eap), B.ecart, 0.05)) q('D54', lab + ' ' + f + ' : écart après ' + e.eap + ' au lieu de ' + B.ecart + ' tolérance(s) du style');
        if (B.plage) {
          if (!egal(num(e.min), B.plage.min, 0.5) || !egal(num(e.max), B.plage.max, 0.5)) q('D53', lab + ' ' + f + ' : plage après ' + e.min + '–' + e.max + ' au lieu de ' + B.plage.min + '–' + B.plage.max);
          if (!e.piste || (B.plage.max > B.plage.min && e.segW < 2)) q('D53', lab + ' ' + f + ' : plage invisible (piste et segment)');
        } else if (!e.inconnue) q('D53', lab + ' ' + f + ' : plage inconnue du moteur, à dire (data-plage="inconnue")');
      }
    }
  }
  console.log(id + ' · Suggestions contrôlées');
}
await browser.close();
if (problems.length === 0) console.log('SUGGESTIONS OK ' + ids.length + '/' + ids.length);
else { console.log('SUGGESTIONS ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
