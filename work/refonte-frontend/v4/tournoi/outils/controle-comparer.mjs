// D51 et D53 (18.10, soir) : Comparer au plancher Beer Maverick, et mieux ; des intervalles de
// confiance sur chaque barre. Le brasseur, ses captures du comparateur de Beer Maverick (Fuggle,
// Citra, Idaho 7) à l'appui : « J'ai d'ailleurs donné des exemples concrets... C'est pas possible
// de faire moins bien... » ; « D'ailleurs, il faut des intervalles de confiance » ; « Beer
// Maverick pour le mode Comparer, c'est une des base, il faut faire mieux, pas moins bien ou la
// même chose... ». Cadrage : work/refonte-frontend/v4/ecran-1/CADRAGE-SC.md.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-comparer.mjs <dossier> [ids…]
//
// Pages : comparer.html (Barres) et comparer-radar.html (Radar), à 390 × 844, chacune
// data-partie="comparer", avec les houblons de la fiche de cas (Nugget de la recette, 46 g à
// 60′ ; East Kent Goldings ; Fuggle). Contrat :
//   [data-houblon-compare="<nom de la fiche>"][data-couleur="#rrggbb"]  un par houblon (2 à 4) ;
//   [data-role="alpha"][data-houblon] et [data-role="role"][data-houblon]  au premier écran ;
//   [data-plage][data-mesure][data-houblon][data-min][data-max][data-echelle-max]  une barre-plage,
//     avec dedans [data-role="piste"], [data-role="segment"] (la plage), [data-role="central"]
//     si data-central, [data-role="lot"][data-valeur] (la valeur de mon lot) ;
//   [data-role="ibu-recette"][data-houblon][data-moment][data-grammes]  l'IBU dans ma recette ;
//   [data-role="dose-equivalente"][data-houblon][data-moment]  la dose pour remplacer Nugget ;
//   [data-action="ajouter"|"remplacer"], [data-action="retirer"] par houblon,
//   [data-action="ajouter-comparaison"] sur la page ;
//   comparer-radar.html : un svg[data-radar][data-objet="houblons"] où tous les houblons se
//     superposent (data-serie = nom), chacun dans sa couleur, aux valeurs de ses fiches.
// Vérifie :
//   plancher : α, β, huiles totales en barres-plages pour chaque houblon, mêmes piste et échelle
//     dans une mesure, plage pâle de 0 au bas facultative, segment aux bornes de la plage (± 3 %),
//     plage écrite ; radar superposé ; même couleur d'un houblon partout ;
//   mieux : le nom sur chaque barre ; couleurs distinctes aussi en deutéranopie et protanopie,
//     loin de l'alerte ; la valeur de mon lot sur la plage quand la fiche la tient (« fiche de
//     stock ») ; IBU dans ma recette et dose équivalente justes (± 12 %, ou dans la plage tirée
//     de α) ; gestes (la hauteur : règle du lot, un écran à 390, le reste à un toucher) ;
//   honnêteté : bornes = réunion des sources de la fiche (± 0,05) ; rapport α/β = αmin/βmax à
//     αmax/βmin (± 0,15) ; valeurs du radar = citations de la fiche, dans l'ordre de data-axes.
// Imprime COMPARER OK si tout passe, sinon COMPARER ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../../..');
const FICHES = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;
const PACK = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-mini-protos.json'), 'utf8'));
const CAS = ['Nugget', 'East Kent Goldings', 'Fuggle'];
const RECETTE = PACK.scenarios.S1.recetteHoublons[0]; // Nugget, 46 g à 60′
const IBU_RECETTE = RECETTE.ibuParMoment.find((m) => m.code === RECETTE.moment).ibu.value;

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();

const fiche = (nom) => FICHES.find((f) => f.name === nom);
const union = (x) => (x && x.sources && x.sources.length ? [Math.min(...x.sources.map((s) => s.min)), Math.max(...x.sources.map((s) => s.max))] : null);
const attendu = (nom, mesure) => {
  const f = fiche(nom); if (!f) return null;
  if (mesure === 'alpha') return union(f.alpha);
  if (mesure === 'beta') return union(f.beta);
  if (mesure === 'huiles') return union(f.huiles && f.huiles.totale);
  if (mesure === 'ratio') { const a = union(f.alpha), b = union(f.beta); return a && b ? [a[0] / b[1], a[1] / b[0]] : null; }
  const c = f.huiles && f.huiles.composants && f.huiles.composants[mesure];
  return c ? [c.min, c.max] : undefined; // undefined : mesure libre (non vérifiée ici)
};
// IBU par gramme au moment, et sa plage tirée de α quand la fiche n'a pas la valeur d'un lot.
const ibuG = (nom, code) => {
  const f = fiche(nom); const m = f && f.ibuParGramme && f.ibuParGramme.moments.find((x) => x.code === code);
  if (!m || !m.ibuPerGram) return null;
  const v = m.ibuPerGram.value, ret = f.alpha.retenu && f.alpha.retenu.value, u = union(f.alpha);
  if (!ret || !u || (f.alpha.retenu.from || '').includes('stock')) return [v, v, v];
  return [v * u[0] / ret, v, v * u[1] / ret];
};
const num = (t) => (String(t).match(/\d+(?:[.,]\d+)?/g) || []).map((x) => Number(x.replace(',', '.')));
const proche = (x, [a, c, b]) => (x >= Math.min(a, b) * 0.97 && x <= Math.max(a, b) * 1.03) || Math.abs(x - c) <= 0.12 * c;

// Couleurs : distance en sRGB après simulation (Machado 2009, sévérité 1).
const hex = (h) => { const m = String(h || '').trim().match(/^#?([0-9a-f]{6})$/i); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null; };
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const gam = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const MAT = {
  deuteranopie: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protanopie: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
};
const simule = (rgb, M) => { const l = rgb.map(lin); return M.map((r) => Math.max(0, Math.min(255, gam(Math.max(0, Math.min(1, r[0] * l[0] + r[1] * l[1] + r[2] * l[2])))))); };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const teinte = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return null; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
const rgbDe = (s) => { const m = String(s || '').match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const couleurs = {};
  for (const file of ['comparer.html', 'comparer-radar.html']) {
    if (!fs.existsSync(path.join(dir, id, file))) { p('D51 page ' + file + ' absente'); continue; }
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(pathToFileURL(path.join(dir, id, file)).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 400));
    const m = await page.evaluate(() => {
      const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.2; };
      const box = (e) => { const b = e.getBoundingClientRect(); return { x0: b.left, x1: b.right, y0: b.top + scrollY, y1: b.bottom + scrollY, w: b.width }; };
      const couleur = (e) => { const cs = getComputedStyle(e); const bg = cs.backgroundColor; return bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg) ? bg : cs.fill && cs.fill !== 'none' ? cs.fill : cs.stroke; };
      const cs = getComputedStyle(document.documentElement);
      const alerte = (cs.getPropertyValue('--alerte') || cs.getPropertyValue('--acc')).trim();
      let alerteRgb = null;
      if (alerte) { const t = document.createElement('i'); t.style.color = alerte; document.body.appendChild(t); alerteRgb = getComputedStyle(t).color; t.remove(); }
      return {
        partie: !!document.querySelector('[data-partie="comparer"]'),
        hauteur: document.scrollingElement.scrollHeight,
        alerteRgb,
        houblons: [...document.querySelectorAll('[data-houblon-compare]')].filter(vis).map((e) => ({ nom: e.getAttribute('data-houblon-compare'), couleur: e.getAttribute('data-couleur') })),
        tetes: ['alpha', 'role'].flatMap((r) => [...document.querySelectorAll('[data-role="' + r + '"][data-houblon]')].filter(vis).map((e) => ({ r, nom: e.getAttribute('data-houblon'), t: e.innerText.trim(), y: box(e).y0 }))),
        plages: [...document.querySelectorAll('[data-plage]')].filter(vis).map((e) => {
          const q = (r) => e.querySelector('[data-role="' + r + '"]');
          const piste = q('piste'), seg = q('segment'), cen = q('central'), lot = q('lot');
          return {
            mesure: e.getAttribute('data-mesure'), nom: e.getAttribute('data-houblon'), t: e.innerText.replace(/\s+/g, ' ').trim(),
            min: Number(e.getAttribute('data-min')), max: Number(e.getAttribute('data-max')), echelle: Number(e.getAttribute('data-echelle-max')),
            central: e.hasAttribute('data-central') ? Number(e.getAttribute('data-central')) : null,
            piste: piste && vis(piste) ? box(piste) : null, seg: seg && vis(seg) ? box(seg) : null, segCouleur: seg ? couleur(seg) : null,
            cen: cen && vis(cen) ? box(cen) : null, lot: lot && vis(lot) ? { ...box(lot), v: Number(lot.getAttribute('data-valeur')) } : null,
          };
        }),
        ibu: [...document.querySelectorAll('[data-role="ibu-recette"][data-houblon]')].filter(vis).map((e) => ({ nom: e.getAttribute('data-houblon'), moment: e.getAttribute('data-moment'), g: Number(e.getAttribute('data-grammes')), t: e.innerText.trim() })),
        doses: [...document.querySelectorAll('[data-role="dose-equivalente"][data-houblon]')].filter(vis).map((e) => ({ nom: e.getAttribute('data-houblon'), moment: e.getAttribute('data-moment'), t: e.innerText.trim() })),
        actions: [...document.querySelectorAll('[data-action]')].map((e) => ({ a: e.getAttribute('data-action'), nom: (e.closest('[data-houblon],[data-houblon-compare]') || e).getAttribute('data-houblon') || (e.closest('[data-houblon-compare]') || e).getAttribute('data-houblon-compare') })),
        radars: [...document.querySelectorAll('svg[data-radar][data-objet="houblons"]')].filter(vis).map((s) => ({
          axes: (s.getAttribute('data-axes') || '').split(',').map((x) => x.trim()).filter(Boolean),
          series: [...s.querySelectorAll('[data-serie]')].map((x) => {
            const tr = [x, ...x.querySelectorAll('path,polygon,polyline')].map((y) => getComputedStyle(y).stroke).find((c) => c && c !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(c));
            return { nom: x.getAttribute('data-serie'), v: (x.getAttribute('data-valeurs') || '').split(',').map((y) => (y.trim() === '' ? null : Number(y))), trait: tr || null };
          }),
        })),
      };
    });
    await page.close();
    const q = (code, t) => p(code + ' ' + file + ' : ' + t);
    if (!m.partie) q('D19', 'la partie ne se nomme pas (data-partie="comparer")');
    const noms = m.houblons.map((h) => h.nom);
    for (const c of CAS) if (!noms.includes(c)) q('D51', 'houblon « ' + c + ' » absent (data-houblon-compare)');
    if (noms.length < 2 || noms.length > 4) q('D51', noms.length + ' houblon(s) comparé(s), 2 à 4 attendus');
    // Couleurs : une par houblon, distinctes aussi pour un daltonien, loin de l'alerte.
    const rgb = {};
    for (const h of m.houblons) { const c = hex(h.couleur); if (!c) q('D51', 'couleur absente ou illisible pour ' + h.nom + ' (data-couleur="#rrggbb")'); else rgb[h.nom] = c; }
    const ar = rgbDe(m.alerteRgb), ha = ar ? teinte(ar) : null;
    const ns = Object.keys(rgb);
    for (let i = 0; i < ns.length; i++) {
      const a = rgb[ns[i]], ta = teinte(a);
      if (ha !== null && ta !== null) { const d = Math.abs(ta - ha); if (Math.min(d, 360 - d) <= 25) q('D40', 'la couleur de ' + ns[i] + ' est celle de l\'alerte (teinte à ' + Math.round(Math.min(d, 360 - d)) + '°)'); }
      for (let j = i + 1; j < ns.length; j++) {
        const b = rgb[ns[j]];
        if (dist(a, b) < 60) q('D51', ns[i] + ' et ' + ns[j] + ' : couleurs trop proches');
        for (const [k, M] of Object.entries(MAT)) if (dist(simule(a, M), simule(b, M)) < 45) q('D51', ns[i] + ' et ' + ns[j] + ' : couleurs confondues en ' + k + ' (comme le rouge et le vert de Beer Maverick)');
      }
    }
    for (const n of ns) { if (couleurs[n] && dist(couleurs[n], rgb[n]) > 30) q('D51', n + ' n\'a pas la même couleur sur les deux pages'); couleurs[n] = couleurs[n] || rgb[n]; }
    // α et rôle d'abord, au premier écran.
    for (const n of noms) for (const r of ['alpha', 'role']) {
      const t = m.tetes.find((x) => x.r === r && x.nom === n);
      if (!t) q('D51', (r === 'alpha' ? 'α' : 'rôle') + ' de ' + n + ' absent (data-role="' + r + '" data-houblon)');
      else if (t.y > 844) q('D51', (r === 'alpha' ? 'α' : 'rôle') + ' de ' + n + ' sous le premier écran (y = ' + Math.round(t.y) + ')');
      else if (r === 'alpha' && !/\d/.test(t.t)) q('D51', 'α de ' + n + ' sans valeur');
      else if (r === 'role' && !/amér|arom|double|mixte|polyvalent/i.test(t.t)) q('D51', 'rôle de ' + n + ' illisible (« ' + t.t.slice(0, 20) + ' »)');
    }
    // Barres-plages (D53) : mesures du plancher, géométrie, honnêteté, nom, couleur, lot.
    for (const mes of ['alpha', 'beta', 'huiles']) for (const n of noms) if (!m.plages.some((x) => x.mesure === mes && x.nom === n)) q('D53', 'barre-plage « ' + mes + ' » absente pour ' + n);
    const parMesure = {};
    for (const b of m.plages) (parMesure[b.mesure] = parMesure[b.mesure] || []).push(b);
    for (const [mes, bs] of Object.entries(parMesure)) {
      const ech = new Set(bs.map((b) => b.echelle)), larg = bs.filter((b) => b.piste).map((b) => b.piste.w), gauches = bs.filter((b) => b.piste).map((b) => b.piste.x0);
      if (ech.size > 1) q('D53', mesure(mes) + ' : échelles différentes d\'un houblon à l\'autre (' + [...ech].join(', ') + ')');
      if (larg.length && (Math.max(...larg) - Math.min(...larg) > 2 || Math.max(...gauches) - Math.min(...gauches) > 2)) q('D53', mesure(mes) + ' : les pistes ne sont pas alignées (même largeur, même départ)');
      for (const b of bs) {
        const lab = mesure(mes) + ' de ' + b.nom;
        if (!b.piste || !b.seg) { q('D53', lab + ' : piste ou segment invisible'); continue; }
        if (!(b.echelle > 0) || !(b.max >= b.min)) { q('D53', lab + ' : data-min, data-max ou data-echelle-max manquant'); continue; }
        const fr = (x) => (x - b.piste.x0) / b.piste.w;
        if (Math.abs(fr(b.seg.x0) - b.min / b.echelle) > 0.03 || Math.abs(fr(b.seg.x1) - b.max / b.echelle) > 0.03) q('D53', lab + ' : le segment ne tombe pas sur la plage ' + b.min + '–' + b.max + ' (sur ' + b.echelle + ')');
        if (b.max > b.min && b.seg.w < 2) q('D53', lab + ' : plage invisible (segment de ' + b.seg.w.toFixed(1) + ' px)');
        if (b.central !== null && !b.cen) q('D53', lab + ' : data-central sans trait central visible');
        const exp = attendu(b.nom, mes);
        if (exp === null) q('D53', lab + ' : la fiche n\'a pas cette mesure, la barre l\'invente');
        else if (exp) { const tol = mes === 'ratio' ? 0.15 : 0.05; if (Math.abs(b.min - exp[0]) > tol || Math.abs(b.max - exp[1]) > tol) q('D53', lab + ' : plage ' + b.min + '–' + b.max + ' au lieu de ' + exp.map((x) => +x.toFixed(2)).join('–') + ' (réunion des sources de la fiche)'); }
        const ns2 = num(b.t);
        if (!ns2.some((x) => Math.abs(x - b.min) <= Math.max(0.051, b.min * 0.02)) || !ns2.some((x) => Math.abs(x - b.max) <= Math.max(0.051, b.max * 0.02))) q('D53', lab + ' : plage non écrite sur la barre');
        if (!b.t.toLowerCase().includes(b.nom.toLowerCase().slice(0, 4))) q('D51', lab + ' : le nom du houblon n\'est pas sur la barre (seule la couleur le dit, défaut de Beer Maverick)');
        const sc = rgbDe(b.segCouleur);
        if (rgb[b.nom] && sc && dist(sc, rgb[b.nom]) > 40) q('D51', lab + ' : segment d\'une autre couleur que le houblon');
      }
    }
    for (const n of noms) {
      const f = fiche(n);
      if (f && f.alpha.retenu && (f.alpha.retenu.from || '').includes('stock')) {
        const b = (parMesure.alpha || []).find((x) => x.nom === n);
        if (b && (!b.lot || Math.abs(b.lot.v - f.alpha.retenu.value) > 0.05)) q('D51', 'α de ' + n + ' : la valeur de mon lot (' + f.alpha.retenu.value + ' %) n\'est pas posée sur la plage (data-role="lot")');
      }
    }
    // Dans ma recette : IBU et dose équivalente.
    for (const n of noms) {
      const i = m.ibu.find((x) => x.nom === n);
      if (!i) { q('D51', 'IBU dans ma recette absent pour ' + n + ' (data-role="ibu-recette")'); continue; }
      const t = ibuG(n, i.moment), v = num(i.t.replace(/\d+\s*g\b/g, ''));
      if (!/IBU/i.test(i.t)) q('D51', 'IBU de ' + n + ' sans unité');
      else if (t && i.g > 0 && !v.some((x) => proche(x, t.map((y) => y * i.g)))) q('D51', 'IBU de ' + n + ' faux : « ' + i.t.slice(0, 30) + ' » pour ' + i.g + ' g au moment ' + i.moment + ' (attendu ≈ ' + (t[1] * i.g).toFixed(1) + ')');
    }
    for (const n of noms.filter((x) => x !== RECETTE.name)) {
      const d = m.doses.find((x) => x.nom === n);
      if (!d) { q('D51', 'dose équivalente absente pour ' + n + ' (remplacer ' + RECETTE.name + ' à IBU égal)'); continue; }
      const t = ibuG(n, d.moment || RECETTE.moment);
      if (t) { const exp = [IBU_RECETTE / t[2], IBU_RECETTE / t[1], IBU_RECETTE / t[0]], v = num(d.t); if (!v.some((x) => proche(x, exp))) q('D51', 'dose équivalente de ' + n + ' fausse : « ' + d.t.slice(0, 30) + ' » (attendu ≈ ' + Math.round(exp[1]) + ' g à ' + (d.moment || RECETTE.moment) + ')'); }
    }
    // Gestes.
    for (const n of noms) {
      const a = m.actions.filter((x) => x.nom === n).map((x) => x.a);
      if (n !== RECETTE.name && !a.some((x) => /^(ajouter|remplacer)$/.test(x))) q('D51', n + ' : ni Ajouter ni Remplacer');
      if (!a.includes('retirer')) q('D51', n + ' : pas de geste pour le retirer de la comparaison');
    }
    if (!m.actions.some((x) => x.a === 'ajouter-comparaison')) q('D51', 'pas de geste pour ajouter un houblon à la comparaison');
    // Radar superposé (page Radar) : tous les houblons, leur couleur, les citations de leurs fiches.
    if (file === 'comparer-radar.html') {
      const sup = m.radars.find((r) => noms.every((n) => r.series.some((s) => s.nom === n)));
      if (!sup) q('D51', 'aucun radar ne superpose les ' + noms.length + ' houblons (Beer Maverick le fait)');
      else for (const s of sup.series.filter((x) => noms.includes(x.nom))) {
        const tr = rgbDe(s.trait);
        if (rgb[s.nom] && (!tr || dist(tr, rgb[s.nom]) > 40)) q('D51', 'radar : ' + s.nom + ' n\'est pas tracé dans sa couleur');
        const f = fiche(s.nom);
        if (f && sup.axes.length) { const exp = sup.axes.map((a) => (f.aromes.find((x) => x.family === a) || {}).level); if (exp.join() !== s.v.map((x) => (x === null ? undefined : x)).join()) q('D51', 'radar : ' + s.nom + ' ne porte pas les citations de sa fiche (' + s.v.join(',') + ' au lieu de ' + exp.join(',') + ')'); }
      }
    }
  }
  console.log(id + ' · Comparer contrôlé');
}
await browser.close();
function mesure(m) { return { alpha: 'α', beta: 'β', ratio: 'α/β', huiles: 'huiles totales' }[m] || m; }
if (problems.length === 0) console.log('COMPARER OK ' + ids.length + '/' + ids.length);
else { console.log('COMPARER ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
