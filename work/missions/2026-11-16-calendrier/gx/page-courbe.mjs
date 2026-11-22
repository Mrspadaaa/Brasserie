// node gx/page-courbe.mjs : écrit page14/courbe.html (même forme que page14/frise.html), images page14/img/c*.webp (cap.mjs)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const H = path.dirname(fileURLToPath(import.meta.url)); const OUT = path.join(H, '..', 'page14', 'courbe.html');
const G = [
  ['c1', 'Glisser la fenêtre des semaines sur l’année (la frise suit)', [
    ['c1-a', 'Tu tires la fenêtre bleue sur la courbe jusqu’en février : la bande des semaines et toute la frise passent à S5 → S10, avec leurs vrais mouvements (IPA de printemps, Carnaval, frigo mis de côté). La place quittée reste en pointillé, un bouton « 16 nov. » ramène à aujourd’hui.'],
    ['c1-b', 'L’inverse : tu glisses la frise elle-même vers la gauche, la fenêtre bleue avance sur la courbe (S50 → S2). La courbe te dit toujours où tu es dans l’année ; retour par « 16 nov. ».']]],
  ['c2', 'Toucher un point ou une semaine → ses mouvements nommés', [
    ['c2-a', 'Un toucher sur la courbe (ici la grosse marche de S13) : une fiche sous la courbe nomme chaque entrée et sortie de la semaine, aux couleurs des rangées, avec le total (−892) et le libre en fin de semaine (2 908). « Voir S13 dans la frise » y emmène.'],
    ['c2-b', 'Un toucher sur une semaine de la bande (S50) : sa colonne s’allume, ce qui pèse cette semaine-là ressort dans la frise (Marché de Noël, facture Houblons Suisse), le reste s’efface ; une ligne dit le compte : +1 180 −312 +120 = +988.']]],
  ['c3', 'Glisser le doigt le long de la courbe (lecture continue)', [
    ['c3-a', 'Le chiffre de tête lit la semaine sous le doigt : 113 devient 2 908 · S13 · 29 mars · −892, et une étiquette nomme les deux plus gros mouvements. Au lâcher, le 113 revient.'],
    ['c3-b', 'Appui long : la courbe s’agrandit (avec ses montants 0 → 6 000) le temps de la lecture, la frise s’efface derrière ; la semaine sous le doigt est détaillée juste dessous (S22 : loyer, levures et houblons, ventes = −661).']]],
  ['c4', '« Et si » : décaler un achat ou un brassin, voir la courbe recalculée avant de valider', [
    ['c4-a', 'Depuis la frise : tu glisses le Porter d’une semaine. La courbe zoome sur les semaines touchées (avant en pointillé, et si en plein, l’écart en vert +176), le solde de S51 passe à 5 240, ses courses suivent ; « au plus serré : inchangé ». Annuler ou Valider.'],
    ['c4-b', 'Depuis la courbe : appui long sur la marche du malt de printemps (−540, S13), tu la poses en S27. La courbe grandit et se recalcule : le creux de juin remonte, 113 → 653 au plus serré, l’ancien tracé en pointillé. Annuler ou Valider.']]],
  ['c5', 'Changer d’échelle d’un geste (6 sem., 3 mois, année)', [
    ['c5-a', 'Pincer la frise : 6 semaines → 3 mois. La fenêtre s’élargit sur la courbe, la bande devient mois + petites barres du libre (4 032, 5 120, 5 031, 4 505), la frise montre 13 semaines.'],
    ['c5-b', 'Tirer la poignée droite de la fenêtre jusqu’au bout : l’année. La bande devient 12 mois en barres, le mois le plus serré cerclé (juin, 113) ; la frise montre toute l’année, une colonne par mois.']]],
];
const fig = (v, e, s) => `<figure class="v"><img src="img/${v}-${e}${s}.webp" alt="${v} ${e}" loading="lazy" width="390" height="844"><figcaption>${e === 'apres' ? 'après' : 'avant'}</figcaption></figure>`;
let h = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calendrier · les gestes de la courbe · 16.11</title><style>
:root{--f:#faf7f2;--c:#fff;--t:#22201c;--d:#6b645a;--a:#b8641c;--ab:#9a4f12;--on:#fff;--l:#e4ddd2}
@media (prefers-color-scheme:dark){:root{--f:#1c1a17;--c:#262320;--t:#f1ece4;--d:#b3aa9c;--a:#d9822f;--ab:#c06f22;--l:#3a352f;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--f);color:var(--t);font:16px/1.45 system-ui,"Segoe UI",sans-serif;padding-bottom:120px}
main{max-width:1100px;margin:0 auto;padding:16px}h1{font-size:24px;margin:4px 0 8px}h2{font-size:20px;margin:28px 0 6px}
blockquote{margin:0 0 10px;padding:4px 0 4px 12px;border-left:3px solid var(--a);font-style:italic}.ex{font-size:15px;color:var(--d)}
.var{background:var(--c);border:1px solid var(--l);border-radius:12px;padding:12px;margin:10px 0}
.var h3{margin:0 0 4px;font-size:17px}.var p{margin:0 0 8px;font-size:15px}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:640px}
.v{margin:0}.v img{display:block;width:100%;height:auto;border:1px solid var(--l);border-radius:8px}figcaption{font-size:14px;color:var(--d)}
details{margin-top:8px}summary{font-size:15px;cursor:pointer;min-height:44px;display:flex;align-items:center}
.ch{font:700 16px system-ui,sans-serif;min-height:48px;padding:8px 14px;border-radius:10px;border:2px solid var(--a);background:var(--c);color:var(--t);cursor:pointer;margin:8px 6px 0 0}
.ch[aria-pressed=true]{background:var(--ab);border-color:var(--ab);color:var(--on)}
#barre{position:fixed;left:0;right:0;bottom:0;background:var(--c);border-top:1px solid var(--l);padding:10px 16px;display:flex;gap:10px;align-items:center}
#barre output{flex:1;font-size:14px;color:var(--d)}
</style></head><body><main>
<h1>Calendrier · les gestes de la courbe</h1>
<blockquote>« Oui aussi les mini maquettes des interation pour le reste des choses, on es en train d'optimisation l'en-tête du calendrier mais pas le calendrier lui même ni même le graph »</blockquote>
<p class="ex">Sur g-d1, ton choix, sans rien retirer : la courbe de caisse en haut, la frise dessous. Cinq gestes, deux façons chacun. Le rond violet est le doigt (plein : il touche ; anneau pointillé épais : appui long ; pointillé : il vient de lâcher), la flèche montre le glisser. Les chiffres sont recalculés sur la même caisse que g-d1 (libre au plus serré : 113, S24). Les écrans en thème cave sont sous chaque variante.</p>`;
for (const [g, titre, vs] of G) {
  h += `<h2>${g} · ${titre}</h2>`;
  for (const [v, txt] of vs) h += `<section class="var"><h3>${v}</h3><p>${txt}</p><div class="duo">${fig(v, 'avant', '')}${fig(v, 'apres', '')}</div><details><summary>En cave</summary><div class="duo">${fig(v, 'avant', '-cave')}${fig(v, 'apres', '-cave')}</div></details><button class="ch" data-g="${g}" data-v="${v}" aria-pressed="false">Je garde ${v}</button></section>`;
}
h += `</main><div id="barre"><output id="out">Rien de choisi</output><button class="ch" id="copier" style="margin:0">Copier mes choix</button></div>
<script>(()=>{const out=document.getElementById('out');const sel=()=>[...document.querySelectorAll('.ch[data-v][aria-pressed=true]')].map(b=>b.dataset.v);
document.querySelectorAll('.ch[data-v]').forEach(b=>b.addEventListener('click',()=>{b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');const s=sel();out.textContent=s.length?'Gardés : '+s.join(', '):'Rien de choisi';}));
document.getElementById('copier').addEventListener('click',()=>{const t='Gestes de la courbe (page14) : '+(sel().join(', ')||'aucun');navigator.clipboard&&navigator.clipboard.writeText(t);out.textContent='Copié : '+t;});})();</script></body></html>`;
fs.writeFileSync(OUT, h);
const imgs = [...h.matchAll(/src="img\/([^"]+)"/g)].map((m) => m[1]);
const manque = imgs.filter((i) => !fs.existsSync(path.join(H, '..', 'page14', 'img', i)));
console.log(manque.length ? 'PAGE ECHEC, images manquantes : ' + manque.join(', ') : `PAGE OK ${imgs.length} images`);
