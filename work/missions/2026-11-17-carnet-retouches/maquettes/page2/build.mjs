// Page de choix rangée par écran (PAGE-PAR-ECRAN, 17.11). Écrit un HTML statique, avec un petit script de notes.
// node page2/build.mjs (depuis maquettes/)
import fs from 'fs';
const e = JSON.parse(fs.readFileSync('ecrans.json', 'utf8'));
const old = fs.readFileSync('page/index.html', 'utf8');
const vers = [...old.matchAll(/<h3><span class="nom">(v\d\d)<\/span>\s*([^<]+)<\/h3>\s*<p class="pp">([^<]*)<\/p>\s*<p class="note"><span class="n">critique ([\d,]+)\/10<\/span>/g)].map((m) => ({ id: m[1], titre: m[2].trim(), pp: m[3].trim(), note: m[4] }));
if (vers.length !== 12) throw new Error('versions ' + vers.length);
const AXE = { v01: 'A', v02: 'A', v03: 'A', v04: 'A', v05: 'B', v06: 'B', v07: 'B', v08: 'B', v09: 'C', v10: 'C', v11: 'C', v12: 'C' };
const RANGS = [['liste', 'Liste des carnets'], ['vide', 'Premier usage, liste vide'], ['ajouter', 'Ajouter une idée'], ['carnet', 'Un carnet ouvert'], ['ajouter-a', 'Ajouter à une idée (lien, photo, texte)'], ['articles', 'Cartes d’article'], ['article', 'Un article ouvert'], ['comparer', 'Comparer sur le critère'], ['choisi', 'Choisir, choisi, pourquoi'], ['a-venir', 'À venir et Réalisés']];
const ordre = (k) => (k.startsWith('base') ? '00' : k.slice(1, 3)) + k;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const CSS = fs.readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const JS = fs.readFileSync(new URL('./notes.js', import.meta.url), 'utf8');
let html = `<title>Carnet par écran · 17.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${CSS}</style>
<div class="page">
<h1>Carnet · par écran · 17.11</h1>
<div id="a-choisir"><b>À choisir :</b> <span class="doux">une rangée par écran, chaque version côte à côte (glisse de côté). Touche ★ sous le meilleur écran de chaque rangée, ajoute une note si tu veux, puis Copier en bas. Touche une image pour l’agrandir. Le lot greffe (v01, v02, v04, v09 pour la vue du carnet, v10, v11, habit de l’app) tourne déjà ; tes ★ guideront la passe suivante.</span></div>
<details class="lv"><summary>Les 12 versions : parti pris et note du critique</summary><div class="vers">
${vers.map((v) => `<div class="v"><b>${v.id}</b> <span class="doux">${AXE[v.id]}</span> ${esc(v.titre)}<span class="n">${v.note}/10</span><br><span class="doux">${esc(v.pp)}</span></div>`).join('\n')}
</div></details>
`;
for (const [id, nom] of RANGS) {
  const ims = Object.keys(e).filter((k) => e[k].ecran === id).sort((a, b) => ordre(a).localeCompare(ordre(b)));
  if (!ims.length) continue;
  html += `<section class="rang" id="${id}"><h2>${nom} <span class="doux">· ${ims.length}</span></h2><div class="bande">\n`;
  for (const k of ims) {
    const ver = k.startsWith('base') ? 'base' : k.slice(0, 3);
    html += `<figure class="${ver === 'base' ? 'base' : ''}" data-cle="${id}|${k}"><button type="button" class="zoom" aria-label="Agrandir ${esc(k)}"><img src="img/${k}.webp" width="200" height="433" alt="${esc(ver + ' : ' + e[k].legende)}"></button><figcaption><span class="t">${ver} <span class="doux">· ${esc(e[k].legende)}</span></span><span class="act"><button type="button" class="etoile" aria-pressed="false" aria-label="Meilleur pour ${esc(nom)}">★</button><input type="text" placeholder="note" aria-label="Note sur ${esc(k)}"></span></figcaption></figure>\n`;
  }
  html += `</div></section>\n`;
}
html += `<textarea id="sortie" readonly hidden aria-label="Tes choix à copier"></textarea>
</div>
<div class="pied"><button type="button" id="copier">Copier mes ★</button><span id="compte">0 ★</span></div>
<div id="loupe" hidden><img alt=""></div>
<script>
${JS}</script>
`;
fs.writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('versions', vers.length, 'figures', (html.match(/<figure /g) || []).length);
