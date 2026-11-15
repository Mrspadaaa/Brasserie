// node controle-synthese.mjs <port> : la Synthèse au banc (?dev-local&finance-demo=reel) reste g3a à 390, clair et cave.
//  1. la zone du gain n'a pas de fond plein (transparente, bord pointillé) ;
//  2. chaque segment de dépense porte son libellé et son montant, entièrement dans le segment, dans sa colonne et dans la vue ;
//  3. chaque pastille de légende a la couleur (ou la hachure) d'un segment visible ;
//  4. le libellé de vente tient en 2 lignes au plus, sans coupe.
// Imprime SYNTHESE OK ou SYNTHESE ECHEC et le détail.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = process.argv[2] ?? '3000';
const echecs = [], infos = [];

/** Mesure faite dans la page : renvoie { echecs: [], infos: [] }. */
function mesurer() {
  const e = [], i = [];
  const vw = window.innerWidth;
  const r = (el) => el.getBoundingClientRect();
  const dedans = (a, b, tol = 0.6) => a.left >= b.left - tol && a.right <= b.right + tol && a.top >= b.top - tol && a.bottom <= b.bottom + tol;
  const scene = document.querySelector('.syn-scene');
  if (!scene) return { echecs: ['scène Synthèse absente'], infos: [] };

  // 1. écart du gain
  const ecart = document.querySelector('.syn-ecart-gain');
  if (!ecart) e.push('zone du gain (.syn-ecart-gain) absente');
  else {
    const cs = getComputedStyle(ecart);
    const alpha = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 1; const p = m[1].split(',').map(Number); return p.length === 4 ? p[3] : 1; };
    const plein = alpha(cs.backgroundColor) > 0 || cs.backgroundImage !== 'none';
    const hr = r(ecart).height;
    i.push(`gain: fond ${cs.backgroundColor}, image ${cs.backgroundImage}, bord ${cs.borderTopStyle} ${cs.borderTopWidth}, hauteur ${hr.toFixed(0)}px`);
    if (plein) e.push(`zone du gain remplie (fond ${cs.backgroundColor} ${cs.backgroundImage}) : g3a la dessine en pointillé vide`);
    if (cs.borderTopStyle !== 'dashed') e.push(`bord de la zone du gain ${cs.borderTopStyle}, pas pointillé`);
  }

  // 2. segments de dépense
  const colonnes = [...document.querySelectorAll('.syn-col')];
  const depense = colonnes.find(c => c.querySelector('.syn-hc')?.textContent.startsWith('Dépensé'));
  const segs = depense ? [...depense.querySelectorAll('.syn-pile .syn-s')] : [];
  if (!segs.length) e.push('aucun segment de dépense');
  for (const s of segs) {
    const nom = s.getAttribute('aria-label') ?? '?';
    const sr = r(s), cr = r(depense);
    const textes = [...s.querySelectorAll('.syn-lib, .syn-m, .syn-tag')];
    i.push(`segment « ${nom.slice(0, 40)} » ${sr.height.toFixed(0)}px, ${textes.length} textes`);
    if (sr.height < 10) e.push(`segment « ${nom} » ${sr.height.toFixed(1)}px (< 10 px)`);
    if (!s.classList.contains('syn-ap') && !s.querySelector('.syn-lib')) e.push(`segment « ${nom} » sans libellé écrit`);
    for (const t of textes) {
      const tr = r(t);
      if (!dedans(tr, sr)) e.push(`« ${t.textContent.trim()} » déborde du segment « ${nom.slice(0, 30)} » (texte ${tr.top.toFixed(0)}–${tr.bottom.toFixed(0)}, segment ${sr.top.toFixed(0)}–${sr.bottom.toFixed(0)})`);
      if (tr.left < cr.left - 0.6 || tr.right > cr.right + 0.6) e.push(`« ${t.textContent.trim()} » hors de sa colonne`);
      if (tr.left < 0 || tr.right > vw + 0.5 || tr.top < 0) e.push(`« ${t.textContent.trim()} » hors de la vue`);
      if (t.scrollWidth > t.clientWidth + 1) e.push(`« ${t.textContent.trim()} » coupé (${t.scrollWidth} > ${t.clientWidth})`);
    }
  }

  // 3. légende
  const visibles = [...document.querySelectorAll('.syn-scene .syn-s')].filter(s => r(s).height >= 10);
  const fonds = new Set(visibles.map(s => getComputedStyle(s).backgroundColor));
  const images = new Set(visibles.map(s => getComputedStyle(s).backgroundImage).filter(x => x !== 'none'));
  for (const p of document.querySelectorAll('.syn-leg i:not(.syn-confirmer)')) {
    const cs = getComputedStyle(p), nom = p.parentElement.textContent.trim();
    if (cs.backgroundImage !== 'none') {
      const ok = images.has(cs.backgroundImage);
      i.push(`légende « ${nom} » : hachure ${ok ? 'vue' : 'ABSENTE'}`);
      if (!ok) e.push(`pastille « ${nom} » : hachure d'aucun segment visible`);
    } else {
      const ok = fonds.has(cs.backgroundColor);
      i.push(`légende « ${nom} » : ${cs.backgroundColor} ${ok ? 'vue' : 'ABSENTE'}`);
      if (!ok) e.push(`pastille « ${nom} » ${cs.backgroundColor} : couleur d'aucun segment visible`);
    }
  }
  if (!document.querySelector('.syn-leg i')) e.push('légende absente');

  // 4. libellé de vente
  const lv = document.querySelector('.syn-s-vente .syn-lib');
  if (lv) {
    const lh = parseFloat(getComputedStyle(lv).lineHeight) || 15.6;
    const lignes = Math.round(lv.scrollHeight / lh);
    i.push(`vente « ${lv.textContent.trim()} » : ${lignes} ligne(s)`);
    if (lignes > 2) e.push(`libellé de vente sur ${lignes} lignes (« ${lv.textContent.trim()} »)`);
    if (lv.scrollHeight > lv.clientHeight + 1) e.push('libellé de vente coupé');
    const sv = r(lv.closest('.syn-s-vente'));
    if (!dedans(r(lv), sv)) e.push('libellé de vente hors de son segment');
  } else i.push('pas de libellé de vente');
  return { echecs: e, infos: i };
}

for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 900, mobile: true, echelle: 1 });
  try {
    await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1500);
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
    await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(x => /^Finances$/.test(x.textContent.trim()))?.click()); await calme(page, 1200);
    await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].find(x => x.offsetParent && x.textContent.trim().startsWith('Synthèse'))?.click()); await calme(page, 1000);
    const res = await page.evaluate(mesurer);
    for (const x of res.echecs) echecs.push(`[${theme}] ${x}`);
    for (const x of res.infos) infos.push(`[${theme}] ${x}`);
    if (journal.erreurs.length) infos.push(`[${theme}] erreurs page : ${journal.erreurs.slice(0, 2).join(' | ')}`);
  } finally { await browser.close(); }
}
console.log(infos.join('\n'));
console.log(echecs.length ? echecs.map(x => 'ECHEC · ' + x).join('\n') + '\nSYNTHESE ECHEC' : 'SYNTHESE OK');
process.exit(echecs.length ? 1 : 0);
