// Voie m8 : écrit page.html à partir des captures de l'app (img/, écrites par capturer.mjs). Disposition des pages m1, m5 et m6
// (style et visionneuse repris de voies/m1-farnesene/page.html) : A en référence, vignettes côte à côte, un toucher ouvre la
// vue en grand à côté de A.
// Usage (racine) : node work/missions/2026-10-25-integration-houblons/voies/m8-radar-manque-partiel/faire-page.mjs
import fs from 'node:fs';
import path from 'node:path';

const ICI = import.meta.dirname;
const m1 = fs.readFileSync(path.join(ICI, '..', 'm1-farnesene', 'page.html'), 'utf8');
const style = m1.slice(m1.indexOf('<style>'), m1.indexOf('</style>') + 8);
const visionneuse = m1.slice(m1.indexOf('<div class="visionneuse"'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const dims = (f) => { const b = fs.readFileSync(path.join(ICI, 'img', f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

const VUES = [
  { nom: "A · l'actuel", img: 'a-actuel.png', dit: 'Le point posé sur le 0 : on dirait une valeur.', ref: true },
  { nom: 'B · « ? » sur l’axe', img: 'b-point-interrogation.png', dit: 'Le point à 0 devient un « ? » à la couleur de qui manque ; deux manques, deux « ? » le long de l’axe.' },
  { nom: 'C · tiers hachurés', img: 'c-tiers-hachures.png', dit: 'Le secteur en trois tranches, une par houblon, hachurée à sa couleur s’il manque, sous les aires. Trois tranches : « sans donnée ».' },
  { nom: 'D · comme dans Comparer', img: 'd-inconnu-de-la-serie.png', dit: 'Pas de point : le trait passe en tiretés le long de l’anneau ou du bord, un « ? » à sa couleur au bord. Dessiné par le radar de l’app.' },
  { nom: 'E · « ? » au picto', img: 'e-au-picto.png', dit: 'Au bord, contre le picto de la famille : un « ? » par houblon qui manque.' },
  { nom: 'G · le trou du 0', img: 'g-trou-rien-cite.png', dit: 'Le disque du 0 teinté de gris ; les points qui y tombent sont creux.' },
  { nom: 'H · couronne des fiches', img: 'h-couronne-fiches.png', dit: 'Autour du picto, un arc par houblon : plein s’il le cite, pointillé gris sinon.' },
  { nom: 'I · « rien sur » sous le radar', img: 'i-legende-rien-sur.png', dit: 'Dans la légende, à côté de chaque houblon, les familles qu’il ne cite pas, barrées. Le radar ne change pas.' },
];
const fig = (v) => {
  const { w, h } = dims(v.img);
  return `      <figure class="vue" ${v.ref ? 'data-reference' : 'data-variante'} data-vignette>
        <button class="ecran" type="button" style="aspect-ratio: ${w} / ${h}" data-nom="${esc(v.nom)}" data-imgs="img/${v.img}" data-etats="${esc(v.nom)}"><img src="img/${v.img}" width="${w}" height="${h}" alt="${esc(v.nom)}"></button>
        <figcaption><b>${esc(v.nom)}</b><span class="dit">${esc(v.dit)}</span></figcaption>
      </figure>`;
};

const html = `<title>Radar : voir le manque d’un houblon sur trois · 26.10</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:wght@600;800&display=swap">
${style}
<style>
/* m8 : une section, A d'abord ; sous chaque vignette, son nom et ce qu'elle change, en une phrase. */
h1 { font-size: clamp(1.45rem, 5.6vw, 2.1rem); }
.houblon { display: grid; gap: 10px; padding-top: 6px; border-top: 1px solid var(--trait); }
.note { margin: 0; font-size: .95rem; line-height: 1.35; }
.vue figcaption .dit { font-size: .9rem; line-height: 1.3; color: var(--discret); }
.cas { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: .95rem; }
.cas b { font-family: var(--titre); }
</style>

<div class="page">
  <header id="a-choisir">
    <p class="sur-titre">L'Affinée · houblons · Substituer, radar · Lotus contre Solero et Calypso · 26.10</p>
    <h1>Comment voir qu'un houblon sur trois n'a pas de donnée ?</h1>
  </header>
  <p class="encart">Ton radar de Substituer, dans l'app, données de l'app : aucun cas construit. Un « manque » ici : le houblon a 2 à 4 fiches, et aucune ne cite la famille, alors qu'un autre la cite.</p>
  <ul class="cas" aria-label="Les trois cas, sur ce radar">
    <li><b>1 sur 3</b> · floral : Calypso (0 fiche sur 4).</li>
    <li><b>2 sur 3</b> · melon, noyau, pépins, herbacé : Lotus et Solero ; baies : Solero et Calypso ; résineux : Lotus et Calypso.</li>
    <li><b>3 sur 3</b> · végétal, épicé, terreux : le bloc « sans donnée » en bas, gardé partout.</li>
  </ul>
  <section class="houblon" data-choix="m8" aria-label="Les variantes, A en référence" data-ref-imgs="img/a-actuel.png" data-ref-etats="A · l'actuel">
    <div class="planche">
${VUES.map(fig).join('\n')}
    </div>
    <p class="note">B, C et E disent « ce houblon manque » ; D et G disent « ce n'est pas une valeur » ; H et I sont deux idées à part. Deux se mélangent bien : dis lesquelles.</p>
  </section>
</div>
${visionneuse}`;
fs.writeFileSync(path.join(ICI, 'page.html'), html);
console.log(`page.html : ${VUES.length} vignettes`);
