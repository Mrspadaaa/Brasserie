// fld4 — tiède (forme de la série : l'échelle). Les mots montent sur une échelle à barreaux : en haut, ce que
// toutes ses fiches disent ; en bas, ce qu'une seule dit, puis les catégories déclarées. Deux colonnes : dans les
// 12 familles (le radar les dessine) et hors des 12 (le radar ne sait pas les dessiner). Nelson Sauvin remplit
// le haut de la colonne de droite ; Motueka, le haut des deux.
import { ecrire, doc, titre, alpha, radar, demande, lentille, pic, T, esc, STYLE } from '../fld1/socle.mjs';

const ID = 'fld4';
function mot(w) {
  const z = w.style === 'dans' ? '<i class="fld4-zp" data-style-seul aria-label="attendu au 16D"></i>' : '';
  if (!w.fam) return `<span class="fld4-m fld4-h${w.gen ? ' fld4-gen' : ''}">${esc(w.fr)}</span>`;
  return `<span class="fld4-mw"><span class="fld4-m${w.nomFam ? ' fld4-nf' : ''}" data-famille="${w.fam}" style="color:${T(w.fam)}">${pic(w.fam, 14)}${esc(w.fr)}</span>${z}</span>`;
}
function rendu(h) {
  const barreaux = [];
  for (let n = h.N; n >= 1; n--) barreaux.push({ n, lib: n === h.N ? (h.N === 1 ? 'sa seule fiche' : `toutes (${n}/${h.N})`) : `${n} sur ${h.N}`, ws: h.mots.filter((w) => w.n === n && !w.cat) });
  const cats = h.mots.filter((w) => w.cat);
  if (cats.length) barreaux.push({ n: 0, lib: 'catégorie', ws: cats, cat: true });
  const nbIn = h.mots.filter((w) => w.fam && !w.cat).length, nbOut = h.horsFam.filter((w) => !w.cat).length;
  const lignes = barreaux.map((b, i) => `<div class="fld4-r${b.cat ? ' fld4-rc' : ''}" style="--k:${b.cat ? 0.15 : b.n / h.N}">
<span class="fld4-l"><i class="fld4-cran"></i><b>${b.lib}</b></span>
<span class="fld4-c">${b.ws.filter((w) => w.fam).map(mot).join('') || '<span class="fld4-v">—</span>'}</span>
<span class="fld4-c fld4-cd">${b.ws.filter((w) => !w.fam).map(mot).join('') || '<span class="fld4-v">—</span>'}</span></div>`).join('');
  const legende = ['Plus un mot est haut, plus de fiches le citent (' + h.N + ' fiche' + (h.N > 1 ? 's' : '') + ' pour ce houblon).', 'À gauche : dans les 12 familles du radar ; à droite : ce que le radar ne dessine pas.', 'Trait bleu sous un mot : famille attendue au 16D.', 'Traduit : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot')];
  const corps = `${titre(h)}${alpha(h)}
${radar(h, { taille: 228 })}
${demande(h)}
<section class="fld4-ech" aria-label="L'échelle de ses mots" data-houblon="${esc(h.nom)}">
<header class="fld4-t"><h2>Quels mots reviennent ?</h2>${lentille('leg-' + ID, legende, 'fld4-lent')}</header>
<div class="fld4-cols"><span></span><span class="fld4-ch">dans le radar <b class="num">${nbIn}</b></span><span class="fld4-ch fld4-chd"><i class="fld4-aut" data-role="autres" data-part="${h.part.toFixed(2)}" aria-label="autres : hors des 12 familles"></i>hors du radar <b class="num">${nbOut}</b></span></div>
<div class="fld4-rails">${lignes}</div>
<p class="fld4-z" data-style-seul><span class="fd-zone" data-role="zone">16D</span>attend floral, herbacé, terreux${h.mots.some((w) => w.style === 'dans') ? '' : ' : aucun de ses mots'}</p>
</section>`;
  return doc({ id: ID, h, titre: 'fld4 · échelle', corps, css: CSS });
}
const CSS = `
.fld4-ech { margin-top:2px; display:flex; flex-direction:column; gap:6px; }
.fld4-t { display:flex; align-items:center; gap:6px; }
.fld4-t h2 { font-size:15px; font-weight:600; }
.fld4-lent { margin-left:auto; } .fld4-lent .fd-leg { left:auto; right:0; }
.fld4-cols, .fld4-r { display:grid; grid-template-columns:78px 1fr 1fr; column-gap:8px; }
.fld4-ch { font-size:12px; color:var(--gris); display:flex; align-items:center; gap:4px; } .fld4-ch b { color:var(--encre); }
.fld4-chd { padding-left:8px; }
.fld4-aut { width:12px; height:12px; border-radius:2px; background:#8d8d96; display:inline-block; }
.fld4-rails { position:relative; display:flex; flex-direction:column; }
.fld4-rails::before { content:""; position:absolute; left:5px; top:8px; bottom:8px; width:7px; border-radius:2px; background:#16161a; }
.fld4-r { min-height:calc(34px + 34px * var(--k)); padding:6px 0; border-bottom:1px solid var(--trait); align-items:center; }
.fld4-r:last-child { border-bottom:0; }
.fld4-rc { background:#f6f6f8; border-radius:4px; }
.fld4-l { position:relative; padding-left:18px; font-size:12px; color:var(--gris); }
.fld4-l b { font-weight:600; color:var(--encre); }
.fld4-rc .fld4-l b { color:var(--gris); }
.fld4-cran { position:absolute; left:0; top:50%; width:16px; height:3px; margin-top:-1.5px; border-radius:2px; background:#16161a; }
.fld4-c { display:flex; flex-wrap:wrap; gap:3px 8px; align-items:center; }
.fld4-cd { padding:4px 8px; background:#3a3d44; border-radius:4px; align-self:stretch; } .fld4-cd .fld4-h { color:#fff; } .fld4-cd .fld4-gen { color:#c9cbd1; } .fld4-cd .fld4-v { color:#c9cbd1; }
.fld4-m { display:inline-flex; align-items:center; gap:3px; font-weight:700; font-size:calc(14px + 8px * var(--k)); line-height:1.1; position:relative; }
.fld4-h { color:var(--encre); font-weight:800; }
.fld4-nf { font-weight:400; }
.fld4-gen { font-weight:400; color:#5b5b66; }
.fld4-rc .fld4-m { font-weight:400; font-size:13px; }
.fld4-zp { position:absolute; left:18px; right:0; bottom:-3px; height:3px; border-radius:2px; background:var(--zone); }
.fld4-mw { position:relative; display:inline-flex; }
.fld4-v { color:var(--gris); font-size:12px; }
.fld4-z { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--gris); }
`;
ecrire(ID, 'Motueka', rendu);
