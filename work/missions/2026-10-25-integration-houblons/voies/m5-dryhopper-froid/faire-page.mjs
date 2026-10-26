// Voie m5 : écrit page.html à partir des captures de l'app (img/, écrites par capturer.mjs). Disposition des pages m3 et m4
// (style et visionneuse repris de voies/m1-farnesene/page.html) : A en référence, vignettes côte à côte, un toucher ouvre la
// vue en grand à côté de A.
// Usage (racine) : node work/missions/2026-10-25-integration-houblons/voies/m5-dryhopper-froid/faire-page.mjs
import fs from 'node:fs';
import path from 'node:path';

const ICI = import.meta.dirname;
const m1 = fs.readFileSync(path.join(ICI, '..', 'm1-farnesene', 'page.html'), 'utf8');
const style = m1.slice(m1.indexOf('<style>'), m1.indexOf('</style>') + 8);
const visionneuse = m1.slice(m1.indexOf('<div class="visionneuse"'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const dims = (f) => { const b = fs.readFileSync(path.join(ICI, 'img', f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

const VUES = [
  { nom: "A · l'actuel", imgs: ['a-actuel.png'], etats: ["A · l'actuel"], ref: true },
  { nom: 'B · trois puces', imgs: ['b-trois-puces.png'], etats: ['B · trois puces'] },
  { nom: "C · pastilles d'alerte", imgs: ['c-pastilles.png'], etats: ["C · pastilles d'alerte"] },
  { nom: 'D · trois mini graphes', imgs: ['d-mini-graphes.png'], etats: ['D · trois mini graphes'] },
  { nom: 'E · en légende du dessin', imgs: ['e-ligne-a-froid.png'], etats: ['E · en légende du dessin'] },
  { nom: 'F · le creep sur la frise', imgs: ['f-creep-frise.png'], etats: ['F · le creep sur la frise'] },
  { nom: 'D + F · greffe', imgs: ['df-greffe.png', 'df-ouvert-creep.png'], etats: ['D + F · greffe', 'D + F · creep touché'] },
  { nom: 'D · ouvert au toucher', imgs: ['d-ouvert-amer.png', 'd-ouvert-creep.png', 'd-ouvert-limite.png'], etats: ['D · amer touché', 'D · creep touché', 'D · limite touchée'] },
];
const fig = (v) => {
  const { w, h } = dims(v.imgs[0]);
  return `      <figure class="vue" ${v.ref ? 'data-reference' : 'data-variante'} data-vignette>
        <button class="ecran" type="button" style="aspect-ratio: ${w} / ${h}" data-nom="${esc(v.nom)}" data-imgs="${v.imgs.map((i) => `img/${i}`).join('|')}" data-etats="${esc(v.etats.join('|'))}"><img src="img/${v.imgs[0]}" width="${w}" height="${h}" alt="${esc(v.nom)}"></button>
        <figcaption><b>${esc(v.nom)}</b></figcaption>
      </figure>`;
};

const html = `<title>Dryhopper à froid : amertume, hop creep, limites · 26.10</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:wght@600;800&display=swap">
${style}
<style>
/* m5 : une section, A d'abord ; le nom de chaque vignette en une ligne. */
h1 { font-size: clamp(1.45rem, 5.6vw, 2.1rem); }
.houblon { display: grid; gap: 10px; padding-top: 6px; border-top: 1px solid var(--trait); }
.note { margin: 0; font-size: .95rem; line-height: 1.35; }
.vue figcaption b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>

<div class="page">
  <header id="a-choisir">
    <p class="sur-titre">L'Affinée · houblons · Dryhopper, Cascade 4 g/L après 3 j, bière 21C · 26.10</p>
    <h1>Où montrer l'amertume au dry hop, le hop creep et les familles près de leur limite ?</h1>
  </header>
  <p class="encart">Ton écran Dryhopper, rien de caché : chaque variante ajoute seulement dans l'espace que tu as barré, sous la bande IBU. Un toucher ouvre le détail et ses sources (dernière vignette).</p>
  <section class="houblon" data-choix="m5" aria-label="Les variantes, A en référence" data-ref-imgs="img/a-actuel.png" data-ref-etats="A · l'actuel">
    <div class="planche">
${VUES.map(fig).join('\n')}
    </div>
    <p class="note">Valeurs de x1 : amertume 27,9 à chaud, 22,3 à 26,3 avec Cascade seul, jusqu'à 34,0 avec Centennial, signe non établi ; hop creep moyen ; végétal 20,6 et herbacé 13,5 au-delà de 5, résineux 27,5 et floral 24,4 pour 30.</p>
  </section>
</div>
${visionneuse}`;
fs.writeFileSync(path.join(ICI, 'page.html'), html);
console.log(`page.html : ${VUES.length} vignettes`);
