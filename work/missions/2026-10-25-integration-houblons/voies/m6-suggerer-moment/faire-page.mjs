// Voie m6 : écrit page.html à partir des captures de l'app (img/, écrites par capturer.mjs). Disposition des pages m3, m4 et m5
// (style et visionneuse repris de voies/m1-farnesene/page.html) : A en référence, vignettes côte à côte, un toucher ouvre la
// vue en grand à côté de A.
// Usage (racine) : node work/missions/2026-10-25-integration-houblons/voies/m6-suggerer-moment/faire-page.mjs
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
  { nom: 'M1 · 60′ et dry hop en groupes', imgs: ['m1-groupes-60-dryhop.png'], etats: ['M1 · groupes 60′ et dry hop'] },
  { nom: "M2 · carte « Plus d'amertume »", imgs: ['m2-carte-amertume.png', 'm2-carte-touchee.png'], etats: ['M2 · au repos', 'M2 · carte touchée : le groupe 60′'] },
  { nom: 'M1 + M2 · ma préférée', imgs: ['m1m2.png', 'm1m2-polaris-touche.png'], etats: ['M1 + M2 · au repos', 'M1 + M2 · Polaris touché'] },
  { nom: 'M3 · puces « Quand ? »', imgs: ['m3-puces-quand.png'], etats: ['M3 · trois puces, rien filtré'] },
  { nom: 'F · la frise du brassin', imgs: ['f-frise-brassin.png'], etats: ['F · frise du brassin'] },
  { nom: "M1 + M2 · avec l'IA", imgs: ['m1m2-ia.png', 'm1m2-ia-phrase.png'], etats: ['IA · puce au dry hop', 'IA · Galaxy touché : sa phrase'] },
];
const fig = (v) => {
  const { w, h } = dims(v.imgs[0]);
  return `      <figure class="vue" ${v.ref ? 'data-reference' : 'data-variante'} data-vignette>
        <button class="ecran" type="button" style="aspect-ratio: ${w} / ${h}" data-nom="${esc(v.nom)}" data-imgs="${v.imgs.map((i) => `img/${i}`).join('|')}" data-etats="${esc(v.etats.join('|'))}"><img src="img/${v.imgs[0]}" width="${w}" height="${h}" alt="${esc(v.nom)}"></button>
        <figcaption><b>${esc(v.nom)}</b></figcaption>
      </figure>`;
};

const html = `<title>Suggérer à 60′ comme au dry hop · 26.10</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:wght@600;800&display=swap">
${style}
<style>
/* m6 : une section, A d'abord ; le nom de chaque vignette en une ligne ; captures : l’écran entier, de haut en bas. */
h1 { font-size: clamp(1.45rem, 5.6vw, 2.1rem); }
.houblon { display: grid; gap: 10px; padding-top: 6px; border-top: 1px solid var(--trait); }
.note { margin: 0; font-size: .95rem; line-height: 1.35; }
.vue figcaption b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>

<div class="page">
  <header id="a-choisir">
    <p class="sur-titre">L'Affinée · houblons · Suggérer (q2b), Hazy du jeudi 21C, plus d'agrumes · 26.10</p>
    <h1>Comment choisir 60′ ou dry hop dans Suggérer ?</h1>
  </header>
  <p class="encart">Ton écran Suggérer, rien de caché : chaque variante ajoute seulement. Aujourd'hui, aucun ajout à 60′ et aucun dry hop sur cette recette. Les vignettes à deux états montrent aussi le toucher.</p>
  <section class="houblon" data-choix="m6" aria-label="Les variantes, A en référence" data-ref-imgs="img/a-actuel.png" data-ref-etats="A · l'actuel">
    <div class="planche">
${VUES.map(fig).join('\n')}
    </div>
    <p class="note">60′ : les cinq de g1 qui font +10 IBU avec le moins de grammes (Polaris 4,5 g à Eureka 5 g ; IBU 27,9 → 37,9). Dry hop actif : les cinq premiers de 23 ex æquo à 40 g, rangés par l'alphabet.</p>
    <p class="note">La phrase de l'IA est un exemple écrit pour la maquette : aucune IA n'a été appelée.</p>
  </section>
</div>
${visionneuse}`;
fs.writeFileSync(path.join(ICI, 'page.html'), html);
console.log(`page.html : ${VUES.length} vignettes`);
