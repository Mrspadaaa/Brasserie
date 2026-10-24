// fld3 — tiède (forme de la série : le nuage). Les mots de dégustation des fiches en nuage : la taille dit le nombre
// de fiches qui citent le mot, la couleur sa famille ; un mot hors des 12 familles est en noir, au même corps
// qu'un autre (il n'est plus relégué). Ce que le radar dit déjà (le nom d'une famille, une catégorie Hopsteiner)
// sort du nuage et tient en une ligne de pictos dessous.
import { ecrire, doc, titre, alpha, radar, demande, lentille, pic, T, esc, COURT, STYLE } from '../fld1/socle.mjs';

const ID = 'fld3';
const corpsDe = (n) => [0, 17, 27, 33, 37][Math.min(4, n)];
function nuage(h) {
  const ws = h.mots.filter((w) => !w.nomFam && !w.cat);
  // les plus cités au centre : on alterne gauche / droite autour du plus grand
  const tri = [...ws].sort((a, b) => b.n - a.n || (a.gen - b.gen));
  const pos = []; tri.forEach((w, i) => (i % 2 ? pos.push(w) : pos.unshift(w)));
  return pos.map((w, i) => {
    const st = w.fam ? `color:${T(w.fam)}` : '';
    const dans = w.style === 'dans';
    return `<span class="fld3-w${w.fam ? '' : ' fld3-h'}${w.gen ? ' fld3-gen' : ''}${dans ? ' fld3-dans' : ''}" style="font-size:${corpsDe(w.n)}px;${st}" ${w.fam ? `data-famille="${w.fam}"` : ''}>${w.fam ? pic(w.fam, Math.round(corpsDe(w.n) * 0.6), 'fld3-pi') : ''}${esc(w.fr)}<sub class="num">${w.n}/${w.N}</sub></span>`;
  }).join('');
}
function rendu(h) {
  const seuls = h.familles.filter((f) => !f.mots.some((w) => !w.nomFam && !w.cat));
  const ws = h.mots.filter((w) => !w.nomFam && !w.cat);
  const nbDans = ws.filter((w) => w.style === 'dans').length;
  const legende = ['Taille du mot : le nombre de fiches qui le citent (petit : 1, grand : 2, plus grand : 3 ou 4).', 'Couleur : sa famille ; noir : hors des 12 familles.', 'Souligné : famille attendue au 16D.', 'Traduit : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot')];
  const corps = `${titre(h)}${alpha(h)}
<div class="fld3-haut">${radar(h, { taille: 250 })}</div>
${demande(h)}
<section class="fld3-bocal" aria-label="Ses mots en nuage" data-houblon="${esc(h.nom)}">
<div class="fld3-bar"><h2 class="fld3-q">Que disent ses ${h.N} fiche${h.N > 1 ? 's' : ''} ?</h2>${lentille('leg-' + ID, legende, 'fld3-lent')}</div>
<p class="fld3-z" data-style-seul><span class="fd-zone" data-role="zone">16D</span>${nbDans ? `<span><u>souligné</u> : attendu au 16D (${nbDans} mot${nbDans > 1 ? 's' : ''})</span>` : '<span>aucun de ses mots n\'est attendu au 16D</span>'}</p>
<div class="fld3-nuage">${nuage(h)}</div>
<div class="fld3-pied">
<span class="fld3-auto"><i class="fld3-carre" data-role="autres" data-part="${h.part.toFixed(2)}" aria-label="autres : hors des 12 familles" style="width:${Math.max(6, Math.round(h.part * 60))}px"></i>${Math.round(h.part * 100)} % de ses mots hors des 12</span>
${seuls.length ? `<span class="fld3-seuls">nommées seules ${seuls.map((f) => `<span style="color:${T(f.f)}" data-famille="${f.f}">${pic(f.f, 14)}${f.nom}</span>`).join('')}</span>` : ''}
${h.nonDecrites.length ? `<span class="fld3-nd">${h.nonDecrites.length} familles non décrites (?)</span>` : ''}
</div>
</section>`;
  return doc({ id: ID, h, titre: 'fld3 · nuage', corps, css: CSS });
}
const CSS = `
.fld3-bocal { margin-top:4px; border:1px solid var(--trait); border-radius:8px; padding:8px 10px 10px; }
.fld3-bar { display:flex; align-items:center; gap:6px; }
.fld3-q { font-size:15px; font-weight:600; }
.fld3-lent { margin-left:auto; } .fld3-lent .fd-leg { left:auto; right:0; }
.fld3-z { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--gris); margin-top:4px; }
.fld3-nuage { display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:2px 14px; padding:14px 0 12px; min-height:150px; }
.fld3-w { display:inline-flex; align-items:center; gap:4px; font-weight:700; line-height:1.05; letter-spacing:-.01em; }
.fld3-w sub { font-size:11px; font-weight:600; color:var(--gris); vertical-align:baseline; align-self:flex-end; margin-left:1px; }
.fld3-h { color:var(--encre); font-weight:800; }
.fld3-gen { font-weight:400; color:#5b5b66; }
.fld3-pi { width:auto; }
body:not(.abs) .fld3-dans { text-decoration:underline; text-decoration-color:var(--zone); text-decoration-thickness:3px; text-underline-offset:4px; }
.fld3-pied { display:flex; flex-wrap:wrap; gap:6px 12px; align-items:center; font-size:12px; color:var(--gris); border-top:1px solid var(--trait); padding-top:7px; }
.fld3-auto { display:inline-flex; align-items:center; gap:5px; }
.fld3-carre { display:inline-block; height:8px; border-radius:2px; background:#8d8d96; }
.fld3-seuls { display:inline-flex; align-items:center; gap:6px; } .fld3-seuls span { display:inline-flex; align-items:center; gap:2px; }
`;
ecrire(ID, 'Nelson Sauvin', rendu);
