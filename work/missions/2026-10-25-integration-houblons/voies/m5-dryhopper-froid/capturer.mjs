// Voie m5-dryhopper-froid : où montrer l'amertume au dry hop, le hop creep et les familles près de leur limite, dans son vrai
// écran Dryhopper. Sa capture du 26.10 : Cascade, recette 21C (Nugget 20 g à 60′, Cascade 80 g dans 20 L = 4 g/L, dry hop après,
// 3 j), la même que voies/a2-demande-reelle/img/sans-visee-dryhopper.png. Il a barré l'espace vide sous la bande IBU, côté
// ébullition, au-dessus de la réglette, et écrit « Amertume, hop creep ? Résineux ? ».
// Méthode de m1 et m3 : l'écran de l'app tel quel (`?dev-local&etape=houblons`, VITE_HOP_V4=on, fixture locale) ; chaque
// variante AJOUTE des nœuds préfixés m5d- dans la zone barrée (un calque posé juste après le dessin, qui remonte de 38 px sur
// son bas gauche, vide), retirés après la capture. Rien de l'app n'est caché, déplacé ni réécrit ; l'écran est mesuré avant et
// après chaque ajout (fidelite.json).
// Valeurs : celles de la voie x1 (src/domain/hopIndex/v4/froid.ts, voies/x1-amertume-creep/RESULTAT.md), telles quelles.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5261 --strictPort" --port 5261 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/m5-dryhopper-froid/capturer.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ICI = import.meta.dirname;
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const IMG = path.join(ICI, 'img');
fs.mkdirSync(IMG, { recursive: true });
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const CLE = 'laffinee_recipe_draft_v1:dev-local:apercu-etape-houblons';

// Les valeurs de x1 pour sa capture (RESULTAT.md de x1, § « Sa capture »).
const X1 = {
  amer: { chaud: 27.9, cascade: [22.3, 26.3], deltaCascade: [-5.6, -1.6], tous: [22.3, 34.0], deltaTous: [-5.6, 6.1], statut: 'conditional' },
  creep: { niveau: 'moyen', points: 2 },
  limites: [
    { f: 'green', nom: 'Végétal', v: 20.6, borne: 5, verdict: 'depasse' },
    { f: 'herbal', nom: 'Herbacé', v: 13.5, borne: 5, verdict: 'depasse' },
    { f: 'resin', nom: 'Résineux', v: 27.5, borne: 30, verdict: 'approche' },
    { f: 'floral', nom: 'Floral', v: 24.4, borne: 30, verdict: 'approche' },
  ],
};

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await page.click('[data-role="dose-plus"]');
await dormir(1500);
await page.evaluate((cle) => {
  const e = JSON.parse(localStorage.getItem(cle));
  const hops = [{ name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 }, { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }];
  for (const r of [e.draft.recipe, e.draft.details]) Object.assign(r, { name: 'Hazy du jeudi', style: '21C', hops, ogTarget: 1.058, colorEbc: 8 });
  e.draft.step = 'houblons'; e.draft.recipe.id = e.draft.details.id = 'REC-A2';
  localStorage.setItem(cle.replace('apercu-etape-houblons', 'new'), JSON.stringify(e));
}, CLE);
await page.goto(`${base}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-role="ligne-houblon"]', { timeout: 120000 });
await dormir(1500);
await page.evaluate(() => window.__hopPile.open({ view: 'hopTiming', additionId: 'a2' }));
await page.waitForSelector('[data-ecran="dryhopper"] [data-bandeau]', { timeout: 120000 });
await dormir(1800);

// Ce que l'écran dit, pour vérifier qu'il est bien le sien.
const ecranLu = await page.evaluate(() => ({
  question: document.querySelector('[data-ecran="dryhopper"]')?.closest('[class*="pq-outil"]')?.querySelector('h1, h2')?.textContent ?? null,
  contexte: document.querySelector('[data-role="contexte"]')?.textContent.replace(/\s+/g, ' ').trim(),
  ibu: document.querySelector('[data-role="ibu-dry"]')?.textContent,
  etape: document.querySelector('.pq-dry-seg [aria-current="true"]')?.textContent,
  jour: document.querySelector('.pq-dry-jr [aria-pressed="true"]')?.textContent,
}));
console.log('écran :', JSON.stringify(ecranLu));

// La mesure de l'écran de l'app : nœuds visibles hors ajouts, et ses blocs (data-role, data-etat, titres).
const MESURE = () => {
  const ecran = document.querySelector('[data-ecran="dryhopper"]');
  const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
  const tous = [...ecran.querySelectorAll('*')].filter((e) => !e.closest('.m5d-ajout')).filter(visible);
  const blocs = new Set();
  for (const e of tous) {
    const role = e.getAttribute('data-role'), etat = e.getAttribute('data-etat');
    if (role) blocs.add(`role:${role}`);
    if (etat) blocs.add(`etat:${etat}`);
    if (/^(H1|H2|SUMMARY)$/.test(e.tagName)) blocs.add(`${e.tagName.toLowerCase()}:${e.textContent.trim().slice(0, 40)}`);
  }
  const ajouts = [...ecran.querySelectorAll('.m5d-ajout *')].filter(visible).length;
  const r = (s) => { const b = document.querySelector(s)?.getBoundingClientRect(); return b ? Math.round(b.top) : null; };
  return { noeudsHorsRangs: tous.length, blocs: [...blocs].sort(), ajouts, railHaut: r('.pq-dry-rail'), barresBas: Math.round(document.querySelector('.pq-dry-bars').getBoundingClientRect().bottom) };
};

// Les ajouts, dans la page rendue (L26 : classes m5d-, code dans une fonction, pas de remplacement de chaîne).
function injecter(nom, X) {
  const ecran = document.querySelector('[data-ecran="dryhopper"]');
  const svg = ecran.querySelector('.pq-dry-svg');
  const fr = (x) => String(x).replace('.', ',').replace('-', '−');
  const sg = (x) => (x > 0 ? '+' : '') + fr(x);
  const ACC = '#c2410c';
  const LEG = getComputedStyle(ecran.querySelector('.pq-dry-svg .pq-dry-lb')).fill;
  const picto = (f, t = 14, blanc = false) => {
    const s = ecran.querySelector(`.pq-dry-ba[data-ligne="${f}"] .pq-dry-n svg`).cloneNode(true);
    s.setAttribute('width', t); s.setAttribute('height', t);
    s.classList.add('m5d-pic');
    if (blanc) s.classList.add('m5d-pic-bl');
    return s.outerHTML;
  };
  const couleur = (f) => getComputedStyle(ecran.querySelector(`.pq-dry-ba[data-ligne="${f}"] .pq-dry-b`)).backgroundColor;
  if (!document.querySelector('style.m5d-ajout')) {
    const st = document.createElement('style');
    st.className = 'm5d-ajout';
    st.textContent = `
.m5d-z { position: relative; margin-top: -38px; z-index: 1; pointer-events: none; font-family: system-ui, sans-serif; color: rgb(var(--cave-50)); }
.m5d-z button, .m5d-z [data-m5d-ouvre] { pointer-events: auto; }
.m5d-mono { font: 700 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-variant-numeric: tabular-nums; }
.m5d-gris { color: ${LEG}; }
.m5d-acc { color: ${ACC}; }
.m5d-pic { flex: none; display: block; }
.m5d-pic-bl { filter: brightness(0) invert(1); }
/* B : trois puces */
.m5d-b { position: absolute; left: 0; top: 2px; width: 183px; display: flex; flex-wrap: wrap; gap: 3px; }
.m5d-puce { height: 22px; padding: 0 7px; border-radius: 11px; background: #fff; border: 1px solid #d5d8df; display: inline-flex; align-items: center; gap: 4px; font: 400 12px/1 system-ui, sans-serif; white-space: nowrap; color: rgb(var(--cave-50)); }
.m5d-puce b { font-weight: 700; }
.m5d-jauge { display: inline-flex; gap: 1.5px; align-items: flex-end; }
.m5d-jauge i { display: block; width: 4px; border-radius: 1px; background: #d5d8df; }
.m5d-jauge i:nth-child(1) { height: 5px; } .m5d-jauge i:nth-child(2) { height: 8px; } .m5d-jauge i:nth-child(3) { height: 11px; }
.m5d-jauge i.m5d-on { background: rgb(var(--cave-50)); }
.m5d-sep { width: 1px; height: 12px; background: #d5d8df; margin: 0 1px; }
/* C : pastilles d'alerte */
.m5d-c { position: absolute; left: 0; top: 2px; width: 183px; display: flex; flex-wrap: wrap; gap: 3px; }
.m5d-pa { height: 22px; padding: 0 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px; font: 700 12px/1 system-ui, sans-serif; white-space: nowrap; }
.m5d-pa-hors { background: #fff4ee; color: ${ACC}; border: 1.5px solid ${ACC}; }
.m5d-pa-pres { background: #fff; color: ${ACC}; border: 1.5px dashed ${ACC}; }
.m5d-pa-moy { background: #fff4ee; color: ${ACC}; border: 1px solid #f3c7ae; }
.m5d-pa-inc { background: #f1f2f5; color: rgb(var(--cave-200)); border: 1px dashed #aeb4c1; }
/* D : trois mini graphes */
.m5d-d { position: absolute; left: 0; top: 1px; width: 183px; display: grid; grid-template-columns: 72px 44px 56px; gap: 4px; }
.m5d-cel { display: grid; gap: 1px; align-content: start; justify-items: start; padding: 1px 2px 2px; border-radius: 6px; background: transparent; border: 0; text-align: left; height: 56px; }
.m5d-cel > span:first-child { font: 400 13px/15px system-ui, sans-serif; color: ${LEG}; }
.m5d-cel svg { display: block; overflow: visible; }
.m5d-cel-on { background: #f1f2f5; box-shadow: 0 0 0 1px #c9cdd6 inset; }
/* E : la ligne à froid */
.m5d-e { position: absolute; left: 0; top: 1px; width: 183px; display: grid; gap: 1px; padding: 0; background: transparent; border: 0; text-align: left; color: rgb(var(--cave-50)); }
.m5d-e-l { display: flex; align-items: center; gap: 3px; height: 15px; font: 400 13px/1 system-ui, sans-serif; white-space: nowrap; }
.m5d-e-l b { font-weight: 700; }
.m5d-e-l > span:first-child { color: ${LEG}; width: 41px; flex: none; }
.m5d-e-l > span.m5d-e-amer { width: auto; }
.m5d-e-p { display: flex; gap: 3px; }
/* F : le hop creep sur la frise */
.m5d-f { position: absolute; left: 0; top: 2px; width: 183px; display: flex; flex-wrap: wrap; gap: 3px; }
.m5d-f-bande { position: absolute; top: 39px; left: 76%; right: 0; height: 16px; overflow: hidden; justify-content: center; border-radius: 3px; background: repeating-linear-gradient(135deg, rgb(194 65 12 / .22) 0 2px, rgb(194 65 12 / .07) 2px 5px); border: 1px solid rgb(194 65 12 / .55); display: flex; align-items: center; padding: 0 2px; gap: 3px; font: 700 12px/1 system-ui, sans-serif; color: ${ACC}; white-space: nowrap; }
.m5d-df { grid-template-columns: 112px 60px; gap: 8px; }
.m5d-df-bande { position: absolute; top: 39px; left: 76%; right: 0; height: 15px; border: 0; padding: 0; border-radius: 7px 7px 2px 2px; background: repeating-linear-gradient(135deg, rgb(59 95 138 / .45) 0 2px, transparent 2px 6px); display: flex; align-items: center; justify-content: center; }
.m5d-df-bande span { font: 700 12px/14px system-ui, sans-serif; color: #3b5f8a; background: #fff; padding: 0 4px; border-radius: 4px; white-space: nowrap; }
/* La feuille ouverte au toucher (plan 2), sous la zone. */
.m5d-det { position: relative; margin: 2px 0 2px; padding: 6px 8px 7px; background: #fff; border: 1px solid #c9cad2; border-radius: 8px; font: 400 13px/17px system-ui, sans-serif; color: rgb(var(--cave-50)); display: grid; gap: 3px; }
.m5d-det h4 { margin: 0; font: 700 14px/18px system-ui, sans-serif; display: flex; flex-wrap: wrap; align-items: center; gap: 0 6px; }
.m5d-det h4 small { font: 400 12px system-ui, sans-serif; color: rgb(var(--cave-400)); }
.m5d-det p { margin: 0; }
.m5d-det .m5d-src { font-size: 12px; color: rgb(var(--cave-400)); }
.m5d-lim { display: grid; grid-template-columns: 16px 64px 1fr 62px; align-items: center; gap: 5px; font-size: 13px; }
.m5d-lim i { display: block; position: relative; height: 8px; background: #f1f2f5; border-radius: 2px; }
.m5d-lim i b { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; }
.m5d-lim i u { position: absolute; top: -3px; bottom: -3px; width: 2px; background: rgb(var(--cave-50)); }
`;
    document.head.appendChild(st);
  }
  const z = document.createElement('div');
  z.className = 'm5d-ajout m5d-z';
  z.setAttribute('data-m5d', nom);
  let plus = 0;
  const a = X.amer, lim = X.limites;
  const hors = lim.filter((l) => l.verdict === 'depasse'), pres = lim.filter((l) => l.verdict === 'approche');
  const jauge = `<span class="m5d-jauge" aria-hidden="true"><i class="m5d-on"></i><i class="m5d-on"></i><i></i></span>`;
  // La plage d'amertume en écart à l'IBU à chaud (0 au milieu) : essais Cascade en plein, avec Centennial en hachuré.
  const plage = (w, h, nombres, legendes = false) => {
    const m = 6.5, cx = w / 2, k = (w / 2 - 2) / m, X0 = (d) => cx + d * k;
    const y = legendes ? 18 : nombres ? 4 : h / 2 - 3;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <defs><pattern id="m5d-h-${nom}-${w}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.6" height="4" fill="#8a8f9c"/></pattern></defs>
      <rect x="${X0(a.deltaTous[0])}" y="${y}" width="${X0(a.deltaTous[1]) - X0(a.deltaTous[0])}" height="6" rx="1.5" fill="url(#m5d-h-${nom}-${w})" stroke="#aeb4c1" stroke-width=".8"/>
      <rect x="${X0(a.deltaCascade[0])}" y="${y}" width="${X0(a.deltaCascade[1]) - X0(a.deltaCascade[0])}" height="6" rx="1.5" fill="#5f6573"/>
      <line x1="${cx}" x2="${cx}" y1="${y - 3}" y2="${y + 9}" stroke="rgb(var(--cave-50))" stroke-width="2"/>
      ${nombres && legendes ? [[a.tous[0], X0(a.deltaTous[0]), 'start', '#5f6573'], [a.cascade[1], X0(a.deltaCascade[1]), 'middle', '#5f6573'], [a.chaud, cx, 'middle', 'rgb(var(--cave-50))'], [a.tous[1], X0(a.deltaTous[1]), 'end', '#8a8f9c']].map(([v, x, ta, c]) => `<text x="${x}" y="${h - 1}" text-anchor="${ta}" font-size="12" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="700" fill="${c}">${v.toFixed(1).replace('.', ',')}</text>`).join('') : ''}
      ${nombres && !legendes ? `<text x="${X0(a.deltaTous[0])}" y="${h - 1}" font-size="12" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="700" fill="#5f6573">${Math.round(a.tous[0])}</text>
      <text x="${cx}" y="${h - 1}" text-anchor="middle" font-size="12" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="700" fill="rgb(var(--cave-50))">${Math.round(a.chaud)}</text>
      <text x="${X0(a.deltaTous[1])}" y="${h - 1}" text-anchor="end" font-size="12" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="700" fill="#8a8f9c">${Math.round(a.tous[1])}</text>` : ''}
      ${legendes ? `<text x="${(X0(a.deltaCascade[0]) + X0(a.deltaCascade[1])) / 2}" y="12" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="rgb(var(--cave-50))">essais Cascade</text><text x="${(cx + X0(a.deltaTous[1])) / 2}" y="12" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="#8a8f9c">avec Centennial</text>` : ''}
    </svg>`;
  };
  if (nom === 'b') {
    plus = 12;
    z.innerHTML = `<div class="m5d-b">
      <button type="button" class="m5d-puce" data-m5d-ouvre="amer" aria-label="Amertume au dry hop : ${sg(a.deltaTous[0])} à ${sg(a.deltaTous[1])}, signe non établi">amer <b class="m5d-mono">${Math.round(a.tous[0])}–${Math.round(a.tous[1])}</b></button>
      <button type="button" class="m5d-puce" data-m5d-ouvre="creep" aria-label="Hop creep : risque ${X.creep.niveau}">creep <b>${X.creep.niveau}</b></button>
      <button type="button" class="m5d-puce" data-m5d-ouvre="limite" aria-label="Familles près de leur limite">${hors.map((l) => picto(l.f)).join('')}<b class="m5d-acc">hors</b><span class="m5d-sep"></span>${pres.map((l) => picto(l.f)).join('')}<span>près</span></button>
    </div>`;
  }
  if (nom === 'c') {
    plus = 12;
    z.innerHTML = `<div class="m5d-c">
      <span class="m5d-pa m5d-pa-hors" data-m5d-ouvre="limite" title="${hors.map((l) => `${l.nom} ${fr(l.v)} pour une borne de ${l.borne}`).join(' ; ')}">${hors.map((l) => picto(l.f)).join('')}hors</span>
      <span class="m5d-pa m5d-pa-pres" data-m5d-ouvre="limite" title="${pres.map((l) => `${l.nom} ${fr(l.v)} pour une borne de ${l.borne}`).join(' ; ')}">${pres.map((l) => picto(l.f)).join('')}près</span>
      <span class="m5d-pa m5d-pa-moy" data-m5d-ouvre="creep">creep moyen</span>
      <span class="m5d-pa m5d-pa-inc" data-m5d-ouvre="amer" title="amertume au dry hop : ${fr(a.tous[0])} à ${fr(a.tous[1])} pour ${fr(a.chaud)} à chaud, signe non établi">amer ${Math.round(a.tous[0])}–${Math.round(a.tous[1])}</span>
    </div>`;
  }
  if (nom === 'd' || nom === 'd-ouvert') {
    plus = 18;
    const H = 26, W = 52, cols = lim.map((l, n) => {
      const r = l.v / l.borne, hh = Math.min(1.15, r) * (H - 8), x = 2 + n * 13, y = H - hh;
      const c = l.verdict === 'depasse' ? ACC : couleur(l.f);
      return `<rect x="${x}" y="${y}" width="8" height="${hh}" rx="1.5" fill="${c}"/>${r > 1.15 ? `<path d="M${x} ${y + 1} l4 -4 l4 4 z" fill="${ACC}"/>` : ''}`;
    }).join('');
    const ligneLim = `<line x1="0" x2="${W}" y1="8" y2="8" stroke="rgb(var(--cave-50))" stroke-width="1.2" stroke-dasharray="2 2"/>`;
    z.innerHTML = `<div class="m5d-d">
      <button type="button" class="m5d-cel" data-m5d-ouvre="amer" aria-label="Amertume au dry hop : de ${fr(a.tous[0])} à ${fr(a.tous[1])} pour ${fr(a.chaud)} à chaud, signe non établi"><span>amer <b class="m5d-mono m5d-gris">?</b></span>${plage(70, 26, true)}</button>
      <button type="button" class="m5d-cel" data-m5d-ouvre="creep" aria-label="Hop creep : risque ${X.creep.niveau}"><span>creep</span>
        <svg width="40" height="12" aria-hidden="true">${[0, 1, 2].map((n) => `<rect x="${n * 13}" y="${8 - n * 3}" width="11" height="${4 + n * 3}" rx="1.5" fill="${n < 2 ? 'rgb(var(--cave-50))' : '#d5d8df'}"/>`).join('')}</svg>
        <b class="m5d-mono" style="margin-top:2px">moyen</b></button>
      <button type="button" class="m5d-cel" data-m5d-ouvre="limite" aria-label="Familles près de leur limite : ${lim.map((l) => `${l.nom} ${fr(l.v)} sur ${l.borne}`).join(', ')}"><span>limite</span>
        <svg width="${W}" height="${H}" aria-hidden="true">${ligneLim}${cols}</svg>
        <span style="display:flex;gap:0;margin-top:1px">${lim.map((l) => `<span style="width:13px;display:flex;justify-content:center">${picto(l.f, 12)}</span>`).join('')}</span></button>
    </div>`;
  }
  if (nom === 'df' || nom === 'df-ouvert') {
    plus = 18;
    const H = 26, W = 52, cols = lim.map((l, n) => {
      const r = l.v / l.borne, hh = Math.min(1.15, r) * (H - 8), x = 2 + n * 13, y = H - hh;
      const c = l.verdict === 'depasse' ? ACC : couleur(l.f);
      return `<rect x="${x}" y="${y}" width="8" height="${hh}" rx="1.5" fill="${c}"/>${r > 1.15 ? `<path d="M${x} ${y + 1} l4 -4 l4 4 z" fill="${ACC}"/>` : ''}`;
    }).join('');
    z.innerHTML = `<div class="m5d-d m5d-df">
      <button type="button" class="m5d-cel" data-m5d-ouvre="amer" aria-label="Amertume au dry hop : de ${fr(a.tous[0])} à ${fr(a.tous[1])} pour ${fr(a.chaud)} à chaud, signe non établi"><span>amer <b class="m5d-mono m5d-gris">?</b></span>${plage(108, 26, true)}</button>
      <button type="button" class="m5d-cel" data-m5d-ouvre="limite" aria-label="Familles près de leur limite : ${lim.map((l) => `${l.nom} ${fr(l.v)} sur ${l.borne}`).join(', ')}"><span>limite</span>
        <svg width="${W}" height="${H}" aria-hidden="true"><line x1="0" x2="${W}" y1="8" y2="8" stroke="rgb(var(--cave-50))" stroke-width="1.2" stroke-dasharray="2 2"/>${cols}</svg>
        <span style="display:flex;gap:0;margin-top:1px">${lim.map((l) => `<span style="width:13px;display:flex;justify-content:center">${picto(l.f, 12)}</span>`).join('')}</span></button>
    </div>
    <button type="button" class="m5d-df-bande" data-m5d-ouvre="creep" aria-label="Hop creep après fermentation : risque ${X.creep.niveau}"><span>creep ${X.creep.niveau}</span></button>`;
  }
  if (nom === 'e') {
    plus = 10;
    z.innerHTML = `<button type="button" class="m5d-e" data-m5d-ouvre="amer" aria-label="Amertume à froid : de ${fr(a.tous[0])} à ${fr(a.tous[1])} pour ${fr(a.chaud)} à chaud, signe non établi ; hop creep ${X.creep.niveau} ; végétal et herbacé hors style, résineux et floral près de leur limite">
      <span class="m5d-e-l"><span class="m5d-e-amer">amer à froid</span>${plage(52, 14, false)}<b class="m5d-mono">${Math.round(a.tous[0])}–${Math.round(a.tous[1])}</b></span>
      <span class="m5d-e-l"><span>creep</span><b>${X.creep.niveau}</b>${jauge}</span>
      <span class="m5d-e-l"><span>limite</span>${hors.map((l) => picto(l.f)).join('')}<b class="m5d-acc">hors</b><span class="m5d-sep"></span>${pres.map((l) => picto(l.f)).join('')}<span>près</span></span>
    </button>`;
  }
  if (nom === 'f') {
    plus = 18;
    z.innerHTML = `<div class="m5d-f">
      <button type="button" class="m5d-puce" data-m5d-ouvre="amer" aria-label="Amertume au dry hop : ${sg(a.deltaTous[0])} à ${sg(a.deltaTous[1])}, signe non établi">amer <b class="m5d-mono">${Math.round(a.tous[0])}–${Math.round(a.tous[1])}</b></button>
      <button type="button" class="m5d-puce" data-m5d-ouvre="limite">${hors.map((l) => picto(l.f)).join('')}<b class="m5d-acc">hors</b><span class="m5d-sep"></span>${pres.map((l) => picto(l.f)).join('')}près</button>
    </div>
    <button type="button" class="m5d-f-bande" data-m5d-ouvre="creep" aria-label="Hop creep après fermentation : risque ${X.creep.niveau}">creep ${X.creep.niveau}</button>`;
  }
  z.style.height = `${38 + plus}px`;
  svg.after(z);

  // Le toucher : ouvre le détail sous la zone, referme au second toucher (plan 2 ; sources et ordres de grandeur ici).
  const DET = {
    amer: `<h4>Amertume au dry hop <small>équivalent d'amertume, pas un IBU mesuré</small></h4>
      ${plage(330, 42, true, true)}
      <p><b>Signe non établi</b> : Cascade seul ${fr(a.deltaCascade[0])} à ${fr(a.deltaCascade[1])} ; avec Centennial jusqu'à ${sg(a.deltaTous[1])}.</p>
      <p class="m5d-src">Maye 2016 · 5 essais, 16 °C, 1 à 5 j · mg/L éq. iso-α</p>`,
    creep: `<h4>Hop creep <b>${X.creep.niveau}</b> ${jauge}</h4>
      <p>Après fermentation, et Cascade est cité parmi les plus actifs (H68).</p>
      <p>Effets : atténuation en plus, CO₂, diacétyle possible.</p>
      <p>Publié : <b>+0,6 à +1,3 % vol.</b> à 10 g/L · ce brassin : <b>?</b></p>
      <p class="m5d-src">Inconnus : température, levure encore viable · H68, H84</p>`,
    limite: `<h4>Près de la limite <small>bière 21C</small></h4>
      ${lim.map((l) => { const c = l.verdict === 'depasse' ? ACC : couleur(l.f); const ech = Math.max(l.borne * 1.15, l.v * 1.05);
        return `<div class="m5d-lim">${picto(l.f, 15)}<span>${l.nom}</span><i><b style="width:${(l.v / ech) * 100}%;background:${c}"></b><u style="left:${(l.borne / ech) * 100}%"></u></i><span class="m5d-mono ${l.verdict === 'depasse' ? 'm5d-acc' : ''}">${fr(l.v)} / ${l.borne}</span></div>`; }).join('')}
      <p class="m5d-src">Végétal, herbacé : indésirables (0–5) · résineux, floral : 0–30 · plages larges, incertain</p>`,
  };
  for (const b of z.querySelectorAll('[data-m5d-ouvre]')) {
    b.addEventListener('click', () => {
      const cle = b.getAttribute('data-m5d-ouvre');
      const deja = document.querySelector(`.m5d-det[data-m5d-det="${cle}"]`);
      document.querySelectorAll('.m5d-det').forEach((n) => n.remove());
      z.querySelectorAll('.m5d-cel-on').forEach((n) => n.classList.remove('m5d-cel-on'));
      if (deja) return;
      const d = document.createElement('div');
      d.className = 'm5d-ajout m5d-det';
      d.setAttribute('data-m5d-det', cle);
      d.innerHTML = DET[cle];
      z.after(d);
      if (b.classList.contains('m5d-cel')) b.classList.add('m5d-cel-on');
    });
  }
  return { plus };
}

const VARIANTES = [
  { nom: 'a', image: 'a-actuel.png' },
  { nom: 'b', image: 'b-trois-puces.png' },
  { nom: 'c', image: 'c-pastilles.png' },
  { nom: 'd', image: 'd-mini-graphes.png' },
  { nom: 'e', image: 'e-ligne-a-froid.png' },
  { nom: 'f', image: 'f-creep-frise.png' },
  { nom: 'df', image: 'df-greffe.png' },
  { nom: 'df-ouvert', image: 'df-ouvert-creep.png', toucher: 'creep' },
  { nom: 'd-ouvert', image: 'd-ouvert-amer.png', toucher: 'amer' },
  { nom: 'd-ouvert', image: 'd-ouvert-creep.png', toucher: 'creep' },
  { nom: 'd-ouvert', image: 'd-ouvert-limite.png', toucher: 'limite' },
];
const mesures = [];
const seule = process.env.M5_SEULE;
for (const v of VARIANTES) {
  if (seule && !seule.split(',').includes(v.nom)) continue;
  const avant = await page.evaluate(MESURE);
  const fait = v.nom === 'a' ? { plus: 0 } : await page.evaluate(injecter, v.nom, X1);
  if (v.toucher) { await page.click(`.m5d-z [data-m5d-ouvre="${v.toucher}"]`); }
  await dormir(400);
  const apres = await page.evaluate(MESURE);
  if (process.env.M5_DEBUG) console.log(await page.evaluate(() => [getComputedStyle(document.querySelector('.pq-dry-svg .pq-dry-lb')).fill, getComputedStyle(document.querySelector('.pq-dry-svg .pq-dry-lb')).fontSize, ...[...document.querySelectorAll('.m5d-cel > span:first-child')].map((e) => e.textContent + ' ' + getComputedStyle(e).color + ' ' + getComputedStyle(e).fontSize)]));
  await page.screenshot({ path: path.join(IMG, v.image) });
  // Recadrage de la zone barrée, pour la relecture (L12), hors du dossier de la voie.
  fs.mkdirSync(path.join(os.tmpdir(), 'm5'), { recursive: true });
  await page.screenshot({ path: path.join(os.tmpdir(), 'm5', `zoom-${v.image}`), clip: { x: 0, y: 370, width: 390, height: 120 } });
  mesures.push({ image: v.image, colonne: v.nom, toucher: v.toucher ?? null, avant: { noeudsHorsRangs: avant.noeudsHorsRangs, blocs: avant.blocs }, apres: { noeudsHorsRangs: apres.noeudsHorsRangs, blocs: apres.blocs }, ajouts: apres.ajouts, railHaut: [avant.railHaut, apres.railHaut], barresBas: [avant.barresBas, apres.barresBas] });
  console.log(v.image, `${avant.noeudsHorsRangs} → ${apres.noeudsHorsRangs} nœuds de l'app, ${apres.ajouts} ajoutés, rail ${avant.railHaut} → ${apres.railHaut}, barres bas ${avant.barresBas} → ${apres.barresBas}`);
  await page.evaluate(() => document.querySelectorAll('.m5d-ajout').forEach((n) => n.remove()));
  await dormir(200);
}
if (!seule) fs.writeFileSync(path.join(ICI, 'fidelite.json'), JSON.stringify({ lecture: "Écran Dryhopper de l'app (Cascade, 21C, 4 g/L, après, 3 j), mesuré sans puis avec les ajouts m5d-, même état.", ecran: ecranLu, valeurs: X1, mesures }, null, 1) + '\n');
const erreurs = journal.erreurs.filter((e) => !/Firestore|firebase|net::ERR/i.test(e));
console.log(erreurs.length ? 'erreurs de page : ' + erreurs.slice(0, 3).join(' | ') : 'aucune erreur de page');
await browser.close();
console.log('CAPTURES', IMG);
