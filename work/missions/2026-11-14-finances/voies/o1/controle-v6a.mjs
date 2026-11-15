// node controle-v6a.mjs <port> : Opérations au banc (390, clair) reprend « Lignes serrées v6a ».
//  - le haut du geste est sous le bas du montant (geste sous le montant) ;
//  - opération sans geste 44 ± 3 px, avec geste 47 ± 3 px ; en-tête de catégorie 28 ± 3 px ; « ✓ Payé » haut d'au moins 24 px.
// Deux jeux de démonstration (jamais de donnée réelle) : « reel » (tout payé : « + pièce ») et la brasserie complète (à payer : « ✓ Payé »).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = process.argv[2] ?? '3000';
const JEUX = ['?dev-local&finance-demo=reel', '?dev-local&finance-demo'];

async function mesurer(jeu) {
  const { browser, page } = await ouvrir({ largeur: 390, hauteur: 2300, mobile: true, echelle: 1 });
  try {
    await page.goto(`http://localhost:${PORT}/${jeu}`); await calme(page, 1500);
    await page.evaluate(() => localStorage.setItem('laffinee.theme', 'clair')); await page.reload(); await calme(page, 1500);
    await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
    await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations'))[0]?.click()); await calme(page, 1200);
    return await page.evaluate(() => {
      const h = (e) => e.getBoundingClientRect().height;
      const lignes = [...document.querySelectorAll('.ops-row')].map((r) => {
        const a = r.querySelector('.ops-a'); const g = r.querySelector('.ops-act');
        let sansGeste = null; if (g) { const d = g.style.display; g.style.display = 'none'; sansGeste = h(r); g.style.display = d; }
        return { nom: r.querySelector('.ops-nom')?.textContent ?? '?', haut: h(r), sansGeste, geste: g ? { texte: g.textContent.trim(), haut: h(g), sous: g.getBoundingClientRect().top >= a.getBoundingClientRect().bottom - 0.5 } : null };
      });
      return { lignes, entetes: [...document.querySelectorAll('.ops-g')].map((e) => ({ nom: e.textContent.trim().slice(0, 24), haut: h(e) })) };
    });
  } finally { await browser.close(); }
}

const dans = (v, cible, tol) => Math.abs(v - cible) <= tol;
const fautes = [];
const sortie = [];
const toutes = [];
for (const jeu of JEUX) {
  const m = await mesurer(jeu);
  sortie.push(`jeu ${jeu} : opérations ${m.lignes.length} (avec geste ${m.lignes.filter((l) => l.geste).length}) · en-têtes ${m.entetes.length}`);
  if (!m.lignes.length) fautes.push(`${jeu} : aucune opération trouvée (.ops-row)`);
  if (!m.entetes.length) fautes.push(`${jeu} : aucun en-tête de catégorie (.ops-g)`);
  for (const l of m.lignes) {
    toutes.push(l);
    const cible = l.geste ? 47 : 44;
    sortie.push(`  ${l.haut.toFixed(1)} px · ${l.geste ? `${l.geste.texte} ${l.geste.haut.toFixed(1)} px ${l.geste.sous ? 'sous' : 'À CÔTÉ'}` : 'sans geste'} · ${l.nom}`);
    if (!dans(l.haut, cible, 3)) fautes.push(`opération ${l.geste ? 'avec' : 'sans'} geste « ${l.nom} » : ${l.haut.toFixed(1)} px (attendu ${cible} ± 3)`);
    if (l.sansGeste != null) { sortie.push('    (geste masqué : ' + l.sansGeste.toFixed(1) + ' px)'); if (!dans(l.sansGeste, 44, 3)) fautes.push('« ' + l.nom + ' » sans son geste (masqué) : ' + l.sansGeste.toFixed(1) + ' px (attendu 44 ± 3)'); }
    if (l.geste && !l.geste.sous) fautes.push(`geste « ${l.geste.texte} » de « ${l.nom} » pas sous le montant`);
    if (l.geste && /Payé|Encaissé/.test(l.geste.texte) && l.geste.haut < 24 - 0.5) fautes.push(`« ${l.geste.texte} » de « ${l.nom} » : ${l.geste.haut.toFixed(1)} px (< 24)`);
  }
  for (const e of m.entetes) {
    sortie.push(`  en-tête ${e.haut.toFixed(1)} px · ${e.nom}`);
    if (!dans(e.haut, 28, 3)) fautes.push(`en-tête « ${e.nom} » : ${e.haut.toFixed(1)} px (attendu 28 ± 3)`);
  }
}
if (!toutes.some((l) => l.geste && /Payé/.test(l.geste.texte))) fautes.push('aucun « ✓ Payé » à mesurer sur les deux jeux');

console.log(sortie.join('\n'));
console.log(fautes.length ? `V6A ECHEC\n${fautes.map((f) => '  - ' + f).join('\n')}` : 'V6A OK');
process.exit(fautes.length ? 1 : 0);
