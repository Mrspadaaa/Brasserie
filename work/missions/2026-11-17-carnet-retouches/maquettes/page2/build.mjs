// Page de choix rangée par écran (PAGE-PAR-ECRAN, 17.11). Écrit un HTML statique, avec un petit script de notes.
// node page2/build.mjs (depuis maquettes/)
import fs from 'fs';
const e = JSON.parse(fs.readFileSync('ecrans.json', 'utf8'));
const old = fs.readFileSync('page/index.html', 'utf8');
const vers = [...old.matchAll(/<h3><span class="nom">(v\d\d)<\/span>\s*([^<]+)<\/h3>\s*<p class="pp">([^<]*)<\/p>\s*<p class="note"><span class="n">critique ([\d,]+)\/10<\/span>/g)].map((m) => ({ id: m[1], titre: m[2].trim(), pp: m[3].trim(), note: m[4] }));
if (vers.length !== 12) throw new Error('versions ' + vers.length);
const GREFFE = ['g01','g02','g03','g04','g05','g06'];
const AXE = { v01: 'A', v02: 'A', v03: 'A', v04: 'A', v05: 'B', v06: 'B', v07: 'B', v08: 'B', v09: 'C', v10: 'C', v11: 'C', v12: 'C' };
const RANGS = [['liste', 'Liste des carnets'], ['vide', 'Premier usage, liste vide'], ['ajouter', 'Ajouter une idée'], ['carnet', 'Un carnet ouvert'], ['ajouter-a', 'Ajouter à une idée (lien, photo, texte)'], ['articles', 'Cartes d’article'], ['article', 'Un article ouvert'], ['comparer', 'Comparer sur le critère'], ['choisi', 'Choisir, choisi, pourquoi'], ['a-venir', 'À venir et Réalisés']];
const ordre = (k) => (k.startsWith('base') ? '0' : k.startsWith('g') ? '2' : '1') + k.slice(1, 3).padStart(2, '0') + k;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const CSS = fs.readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const JS = fs.readFileSync(new URL('./notes.js', import.meta.url), 'utf8');
let html = `<title>Carnet par écran · 17.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${CSS}</style>
<div class="page">
<h1>Carnet · par écran · 17.11</h1>
<div id="a-choisir"><b>À choisir :</b> <span class="doux">une rangée par écran, chaque version côte à côte (glisse de côté). Sous chaque vignette, touche 1, 2 ou 3 pour ton top 3 de la rangée (un rang par écran ; retouche pour l’enlever), ajoute une note si tu veux, puis Copier en bas. Le podium s’affiche à côté du titre. Touche une image pour l’agrandir. Le lot greffe (v01, v02, v04, v09 pour la vue du carnet, v10, v11, habit de l’app) tourne déjà ; ton top 3 guidera la passe suivante.</span></div>
<details class="lv"><summary>Les versions : v01 à v12, et g01 à g06 (lot greffe arrêté)</summary><div class="vers">
${vers.map((v) => `<div class="v"><b>${v.id}</b> <span class="doux">${AXE[v.id]}</span> ${esc(v.titre)}<span class="n">${v.note}/10</span><br><span class="doux">${esc(v.pp)}</span></div>`).join('\n')}
${GREFFE.map((g) => `<div class="v"><b>${g}</b> <span class="doux">greffe</span> combinaison de v01, v02, v04, v09, v10, v11 (habit de l’app)<span class="n">non critiquée</span><br><span class="doux">Lot arrêté avant ton top 3 : versions finies, ni critiquées ni corrigées.</span></div>`).join('\n')}
</div></details>
`;
for (const [id, nom] of RANGS) {
  const ims = Object.keys(e).filter((k) => e[k].ecran === id).sort((a, b) => ordre(a).localeCompare(ordre(b)));
  if (!ims.length) continue;
  html += `<section class="rang" id="${id}"><h2>${nom} <span class="doux">· ${ims.length}</span> <span class="podium"></span></h2><div class="bande">\n`;
  for (const k of ims) {
    const ver = k.startsWith('base') ? 'base' : k.slice(0, 3);
    html += `<figure class="${ver === 'base' ? 'base' : ''}" data-cle="${id}|${k}"><button type="button" class="zoom" aria-label="Agrandir ${esc(k)}"><img src="img/${k}.webp" width="200" height="433" alt="${esc(ver + ' : ' + e[k].legende)}"></button><figcaption><span class="t">${ver} <span class="doux">· ${esc(e[k].legende)}</span></span><span class="act"><span class="rgs">${[1,2,3].map((n) => `<button type="button" class="rg" data-n="${n}" aria-pressed="false" aria-label="${n}e pour ${esc(nom)}">${n}</button>`).join('')}</span><input type="text" placeholder="note" aria-label="Note sur ${esc(k)}"></span></figcaption></figure>\n`;
  }
  html += `</div></section>\n`;
}
html += `<textarea id="sortie" readonly hidden aria-label="Tes choix à copier"></textarea>
</div>
<div class="pied"><button type="button" id="copier">Copier mon top 3</button><span id="compte">0 rang donné</span></div>
<div id="loupe" hidden><img alt=""></div>
<script>
${JS}</script>
`;
fs.writeFileSync(new URL('./index.html', import.meta.url), html);
const vs = vers.map((v) => v.id); const trous = RANGS.map(([id]) => [id, vs.filter((v) => !Object.keys(e).some((k) => k.startsWith(v) && e[k].ecran === id))]).filter(([, m]) => m.length);
console.log(trous.length ? 'PARCOURS ECHEC : ' + trous.map(([id, m]) => id + ' sans ' + m.join(',')).join(' ; ') : 'PARCOURS OK');
console.log('versions', vers.length, 'figures', (html.match(/<figure /g) || []).length);
