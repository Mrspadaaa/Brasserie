// node gx/page-corr.mjs : page14/gestes-corriges.html, les versions gardées et corrigées (16.11 soir), par geste
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const H = path.dirname(fileURLToPath(import.meta.url)); const P = path.join(H, '..', 'page14');
const tete = fs.readFileSync(path.join(P, 'frise.html'), 'utf8').split('</style>')[0] + '</style></head>';
const G = [
  ['Déplacer une barre', 'Deux façons : direct avec Annuler (f1-b), ou « et si » avec Valider (c4-a). À toi de choisir.', [
    ['f1-b', 'Direct. Pendant le glisser, la courbe se zoome (avant en pointillé, si tu lâches en plein) ; la barre garde sa longueur ; au lâcher, la case S51 change, « S51 : 5 064 → 4 524 » et Annuler.'],
    ['c4-a', '« Et si ». Le Porter glisse d’une semaine, même longueur ; courbe zoomée avant / et si (+176), S51 → 5 240, Annuler ou Valider.'],
    ['f6-a', 'Un brassin emmène ses courses : Porter une semaine plus tôt, même longueur, courses « avant 30 nov. », « S50 : 5 120 → 4 944 ».']]],
  ['Allonger', '', [['f2-a', 'Tirer la fin de la Blonde : garde +7 j, prête le 21 déc. ; les jours actifs sont des points sur la barre (la mise en fût passe en rouge) ; les 3 fûts promis le 15 déc. à La Cigogne lèvent l’alerte.']]],
  ['Poser', '', [
    ['f3-a', 'Toucher le + de la rangée Ventes : la vente probable est posée (Café du Pont, +130), « S52 5 550 → 5 680 · au plus serré 113 → 243 ».'],
    ['f3-b', 'Tracer une durée dans une rangée vide : nom, micro, jours actifs, et ce qu’ils usent : « S50 déjà 4/2 j · S49 et S52 pleins · place pour 1 j (S51) ».']]],
  ['Ouvrir', '', [
    ['f4-b', 'Une vente : l’en-tête devient sa fiche, la courbe montre la caisse sans elle (ruban rouge, −527 en juin), et ses actions.'],
    ['f4-a', 'Un brassin : le détail s’ouvre sous la barre, étapes datées, courses qui manquent, Ouvrir le brassin, Commander.']]],
  ['Appui long', '', [['f5-b', 'Un menu sous la barre ; chaque action dit ce qu’elle change.']]],
  ['Ce qui dépend d’une barre', '', [['f6-b', 'Le doigt au milieu : toute la Blonde glisse d’une semaine ; la promesse du 15 déc. demande : Livrer le 22 déc. ou Annuler le décalage ; « S47 4 032 → 4 180 ».']]],
  ['Choisir la période', '', [
    ['c1-b', 'Glisser la frise : la fenêtre suit sur la courbe.'],
    ['c5-a', 'Pincer la frise : 3 mois.'],
    ['c1-a', 'Tirer la fenêtre sur la courbe ; la puce de période est sortie de la courbe ; le frigo « mis de côté, non compté » est grisé.'],
    ['c5-b', 'Tirer la poignée jusqu’au bout : l’année ; les petits montants gardent leur étiquette.']]],
  ['Lire une semaine', '', [
    ['c2-b', 'Glisser puis toucher S50 sur la bande : la tête lit la semaine, la frise ne garde que ce qui bouge la caisse en S50 (Marché de Noël, ventes +120, facture −312), le reste se replie.'],
    ['c3-a', 'Glisser le long de la courbe : la tête lit la semaine sous le doigt (S13, −892 : 2 mouvements nommés, +3 autres).']]],
  ['Agrandir la courbe', '« Plus de place au graph »', [['c3-b', 'Appui long sur la courbe : elle prend la place, la semaine sous le doigt (S24, au plus serré) se détaille.']]],
];
const fig = (v, e, c) => `<figure class="v"><img src="img/${v}-${e}${c}.webp" alt="${v} ${e}" loading="lazy" width="390" height="844"><figcaption>${e === 'apres' ? 'après' : 'avant'}</figcaption></figure>`;
let h = tete.replace(/<title>[^<]*<\/title>/, '<title>Calendrier · les gestes corrigés · 16.11 soir</title>') + `<body><main>
<h1>Calendrier · les gestes, corrigés</h1>
<blockquote>« Oui aussi les mini maquettes des interation pour le reste des choses, on es en train d'optimisation l'en-tête du calendrier mais pas le calendrier lui même ni même le graph »</blockquote>
<p class="ex">Sur g-d1, ton choix. Les versions gardées, corrigées. Partout : la frise s’arrête 88 px au-dessus des onglets, le + ne cache plus rien ; le message tient sur une ligne, avant le + ; la puce de période est sous la courbe, à droite ; le doigt est le même partout (violet : il touche ; anneau : appui long ; pointillé : il vient de lâcher).</p>`;
for (const [t, sous, vs] of G) {
  h += `<h2>${t}</h2>${sous ? `<p class="ex">${sous}</p>` : ''}`;
  for (const [v, d] of vs) h += `<section class="var"><h3>${v}</h3><p>${d}</p><div class="duo">${fig(v, 'avant', '')}${fig(v, 'apres', '')}</div><details><summary>En cave</summary><div class="duo">${fig(v, 'avant', '-cave')}${fig(v, 'apres', '-cave')}</div></details><button class="ch" data-g="${t}" data-v="${v}" aria-pressed="false">Je garde ${v}</button></section>`;
}
h += `</main><div id="barre"><output id="out">Rien de choisi</output><button class="ch" id="copier" style="margin:0">Copier mes choix</button></div>
<script>(()=>{const out=document.getElementById('out');const sel=()=>[...document.querySelectorAll('.ch[data-v][aria-pressed=true]')].map(b=>b.dataset.v);
document.querySelectorAll('.ch[data-v]').forEach(b=>b.addEventListener('click',()=>{b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');const s=sel();out.textContent=s.length?'Gardés : '+s.join(', '):'Rien de choisi';}));
document.getElementById('copier').addEventListener('click',()=>{const t='Gestes gardés : '+(sel().join(', ')||'aucun');navigator.clipboard&&navigator.clipboard.writeText(t);out.textContent='Copié : '+t;});})();</script></body></html>`;
fs.writeFileSync(path.join(P, 'gestes-corriges.html'), h);
const manque = G.flatMap((g) => g[2]).flatMap(([v]) => ['avant', 'apres', 'avant-cave', 'apres-cave'].map((e) => `${v}-${e}.webp`)).filter((f) => !fs.existsSync(path.join(P, 'img', f)));
console.log(manque.length ? 'PAGE ECHEC, manquent : ' + manque.join(', ') : `PAGE OK ${G.flatMap((g) => g[2]).length * 4} images`);
