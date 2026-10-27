// Voie m9 : écrit page.html à partir des captures de l'app (img/, écrites par capturer.mjs). Disposition des pages m1, m6 et m8
// (style et visionneuse repris de voies/m1-farnesene/page.html) : A en référence, B, C et D à côté ; un toucher ouvre la vue en grand
// à côté de A. Deux sections : plus d'agrumes, plus de tropicaux.
// Usage (racine) : node work/missions/2026-10-25-integration-houblons/voies/m9-dipa-listes/faire-page.mjs
import fs from 'node:fs';
import path from 'node:path';

const ICI = import.meta.dirname;
const m1 = fs.readFileSync(path.join(ICI, '..', 'm1-farnesene', 'page.html'), 'utf8');
const style = m1.slice(m1.indexOf('<style>'), m1.indexOf('</style>') + 8);
const visionneuse = m1.slice(m1.indexOf('<div class="visionneuse"'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const dims = (f) => { const b = fs.readFileSync(path.join(ICI, 'img', f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

const VUES = [
  { l: 'a', nom: "A · l'actuel", dit: 'La liste en production.', ref: true },
  { l: 'b', nom: 'B · intensité', dit: 'L’effet suit le radar de chaque houblon : les barres changent.' },
  { l: 'c', nom: 'C · typicité', dit: 'À effet égal, les houblons courants en Double IPA passent devant.' },
  { l: 'd', nom: 'D · les deux', dit: 'B et C ensemble.' },
];
const QUESTIONS = [
  { fichier: 'agrumes', titre: 'Plus d’agrumes' },
  { fichier: 'tropicaux', titre: 'Plus de tropicaux' },
];
const fig = (q, v) => {
  const img = `img/${q.fichier}-${v.l}.png`;
  const { w, h } = dims(`${q.fichier}-${v.l}.png`);
  const nom = `${q.titre} · ${v.nom}`;
  return `      <figure class="vue" ${v.ref ? 'data-reference' : 'data-variante'} data-vignette>
        <button class="ecran" type="button" style="aspect-ratio: ${w} / ${h}" data-nom="${esc(nom)}" data-imgs="${img}" data-etats="${esc(nom)}"><img src="${img}" width="${w}" height="${h}" alt="${esc(`${nom} : l’écran Suggérer, ses six et leur rang`)}"></button>
        <figcaption><b>${esc(v.nom)}</b><span class="dit">${esc(v.dit)}</span></figcaption>
      </figure>`;
};
const section = (q) => `  <section class="question" data-choix="m9-${q.fichier}" aria-label="${esc(q.titre)} : A en référence, puis B, C et D" data-ref-imgs="img/${q.fichier}-a.png" data-ref-etats="${esc(`${q.titre} · A · l'actuel`)}">
    <h2>${esc(q.titre)}</h2>
    <div class="planche">
${VUES.map((v) => fig(q, v)).join('\n')}
    </div>
  </section>`;

const html = `<title>Quelle liste pour ta Double IPA ? · 27.10</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:wght@600;800&display=swap">
${style}
<style>
/* m9 : deux questions, A d'abord dans chacune ; sous chaque vignette, son nom et ce qu'elle change, en une phrase. */
h1 { font-size: clamp(1.5rem, 6vw, 2.2rem); }
h2 { font-family: var(--titre); font-size: 1.25rem; font-weight: 800; margin: 0; }
.question { display: grid; gap: 10px; padding-top: 8px; border-top: 1px solid var(--trait); }
.vue figcaption .dit { font-size: .9rem; line-height: 1.3; color: var(--discret); }
.six { color: #b4480a; font-weight: 700; }
</style>

<div class="page">
  <header id="a-choisir">
    <p class="sur-titre">L'Affinée · Suggérer · neipa v3 (22A) · dry hop actif · 27.10</p>
    <h1>Quelle liste pour ta Double IPA ?</h1>
  </header>
  <p class="encart">Ce que disent les données : Calypso n’est que dans 1 % des Double IPA (Beer Analytics), Pacific Jade ne cite pas le tropical, et El Dorado est freiné par sa note pomme-poire, que le 22A veut basse.</p>
${QUESTIONS.map(section).join('\n')}
  <p>Dans chaque écran, <span class="six">tes six</span> gardent leur place : leur rang dans la liste, la flèche dit ce qu’ils gagnent sur A.</p>
</div>
${visionneuse}`;
fs.writeFileSync(path.join(ICI, 'page.html'), html);
console.log(`page.html : ${QUESTIONS.length * VUES.length} vignettes`);
