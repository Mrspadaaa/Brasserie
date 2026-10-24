// fld2 — froide : la bande de g1 et ses familles, affinées en une barre des mots et des puces. La bande des 12
// carrés devient une barre dont chaque part est le nombre de mots de la famille (la part « hors des 12 » comprise,
// en gris neutre, D100) ; sous elle, chaque mot est une puce à sa couleur, avec ses fiches en points (●● sur ○○).
import { HOPS, ecrire, doc, titre, alpha, radar, demande, lentille, pic, T, B, F, esc, STYLE, COURT, ROUE } from '../fld1/socle.mjs';

const ID = 'fld2';
const points = (w) => `<span class="fld2-pts" aria-label="${w.n} fiche${w.n > 1 ? 's' : ''} sur ${w.N}">${Array.from({ length: w.N }, (_, i) => `<i class="${i < w.n ? 'on' : ''}"></i>`).join('')}</span>`;
function puce(w) {
  if (!w.fam) return `<span class="fld2-p fld2-p-h${w.cat ? ' fld2-cat' : ''}">${esc(w.fr)}${points(w)}</span>`;
  return `<span class="fld2-p${w.cat ? ' fld2-cat' : ''}" data-famille="${w.fam}" style="background:${F(w.fam)};color:${T(w.fam)};border-color:${B(w.fam)}">${esc(w.fr)}${points(w)}</span>`;
}
function rendu(h) {
  // les groupes : une famille (ses mots, sans redire son nom) ou les mots hors des 12
  const groupes = h.familles.map((f) => ({ f: f.f, n: f.n, dans: f.dans, mots: f.mots.filter((w) => !w.nomFam), nom: f.nom, fam: f }));
  if (h.horsFam.length) groupes.push({ f: null, n: Math.max(...h.horsFam.map((w) => w.n)), mots: h.horsFam, nom: 'hors des 12' });
  const tri = (st) => [...groupes].sort((a, b) => (st ? (b.dans ? 1 : 0) - (a.dans ? 1 : 0) : 0) || b.n - a.n || b.mots.length - a.mots.length);
  const poids = (g) => Math.max(1, g.mots.length);
  const total = groupes.reduce((s, g) => s + poids(g), 0);
  const barre = (st) => {
    const gs = tri(st); let x = 0, z0 = null, z1 = null;
    const segs = gs.map((g) => {
      const w = (poids(g) / total) * 100;
      if (g.dans) { if (z0 === null) z0 = x; z1 = x + w; }
      const s = g.f ? `<i class="fld2-s" data-famille="${g.f}" style="width:${w}%;background:${B(g.f)}"></i>` : `<i class="fld2-s fld2-s-h" data-role="autres" data-part="${h.part.toFixed(2)}" aria-label="autres : hors des 12 familles" style="width:${w}%"></i>`;
      x += w; return s;
    }).join('');
    const zone = st ? (z0 !== null ? `<span class="fld2-zb" data-role="zone" style="left:${z0}%;width:${z1 - z0}%"><b>16D</b></span>` : `<span class="fld2-zb fld2-zb0" data-role="zone"><b>16D</b> attend floral, herbacé, terreux : aucun ici</span>`) : '';
    return `<div class="fld2-barre ${st ? 'fld2-st' : 'fld2-ab'}" ${st ? 'data-style-seul' : 'data-abs-seul'}>${zone}<div class="fld2-segs">${segs}</div></div>`;
  };
  const listeG = (st) => tri(st).map((g) => `<div class="fld2-g${g.f ? '' : ' fld2-g-h'}">${g.f ? `<span class="fld2-gt">${pic(g.f, 16)}<b style="color:${T(g.f)}">${g.nom}</b> <span class="num">${g.fam.n}/${g.fam.N}</span>${st && g.dans ? '<span class="fd-zone">16D</span>' : ''}</span>` : `<span class="fld2-gt"><i class="fld2-carre" aria-hidden="true"></i><b>Hors des 12</b> <span class="num">${g.mots.length}</span></span>`}${g.mots.length ? g.mots.map(puce).join('') : `<span class="fld2-seul">${g.fam.mots.every((w) => w.cat) ? 'catégorie Hopsteiner' : 'le nom seul'}</span>`}</div>`).join('');
  const nd = h.nonDecrites.map((f) => `<span class="fld2-nd" title="${COURT[f]} : non décrit">${pic(f, 14)}?</span>`).join('');
  const legende = ['La barre : la part de chaque famille dans ses mots ; gris : hors des 12 familles.', '●● : fiches qui citent le mot, sur ' + h.N + '.', 'Pointillé : catégorie déclarée par Hopsteiner, pas un mot de dégustation.', 'Traduit : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot'), 'Un picto suivi de « ? » : famille non décrite, pas zéro.'];
  const corps = `${titre(h)}${alpha(h)}
<div class="fld2-rad">${radar(h, { taille: 286 })}${lentille('leg-' + ID, legende, 'fld2-lent')}</div>
${demande(h)}
<section class="fld2-mots" aria-label="Ses mots" data-houblon="${esc(h.nom)}">
<h2 class="fld2-q">Que disent ses familles ?</h2>
${barre(true)}${barre(false)}
<div class="fld2-gs" data-style-seul>${listeG(true)}</div><div class="fld2-gs" data-abs-seul>${listeG(false)}</div>
<p class="fld2-ndl"><span>non décrites</span>${nd}</p>
</section>`;
  return doc({ id: ID, h, titre: 'fld2 · barre des mots et puces', corps, css: CSS });
}
const CSS = `
.fld2-rad { position:relative; }
.fld2-lent { position:absolute; top:2px; left:0; right:0; }
.fld2-mots { display:flex; flex-direction:column; gap:8px; padding-top:4px; border-top:1px solid var(--trait); }
.fld2-q { font-size:15px; font-weight:600; padding-top:6px; }
.fld2-barre { position:relative; padding-top:20px; }
.fld2-ab { padding-top:0; }
.fld2-segs { display:flex; height:14px; gap:2px; }
.fld2-s { display:block; height:14px; border-radius:2px; }
.fld2-s-h { background:#8d8d96; }
.fld2-zb { position:absolute; top:0; height:16px; border:2px solid var(--zone); border-bottom:0; border-radius:4px 4px 0 0; display:flex; justify-content:center; }
.fld2-zb b { font-size:12px; line-height:12px; background:#fff; color:var(--zone); padding:0 4px; margin-top:-8px; height:14px; }
.fld2-zb0 { position:static; border:0; justify-content:flex-start; gap:4px; font-size:12px; color:var(--gris); height:auto; margin-bottom:4px; }
.fld2-zb0 b { margin:0; height:auto; padding:0 6px; border-radius:7px; background:var(--zone); color:#fff; line-height:16px; }
.fld2-barre:has(.fld2-zb0) { padding-top:0; }
.fld2-gs { display:flex; flex-direction:column; gap:7px; }
.fld2-g { display:flex; flex-wrap:wrap; align-items:center; gap:5px; }
.fld2-gt { display:inline-flex; align-items:center; gap:4px; font-size:14px; margin-right:2px; min-width:108px; }
.fld2-gt .num { font-size:12px; color:var(--gris); }
.fld2-carre { width:14px; height:14px; border-radius:2px; background:#8d8d96; display:inline-block; }
.fld2-p { display:inline-flex; align-items:center; gap:5px; height:28px; padding:0 9px; border-radius:14px; border:1px solid; font-size:14px; font-weight:600; }
.fld2-p-h { background:#fff; color:var(--encre); border:1.5px solid var(--encre); font-size:15px; }
.fld2-cat { border-style:dashed; font-weight:400; }
.fld2-pts { display:inline-flex; gap:2px; }
.fld2-pts i { width:6px; height:6px; border-radius:50%; border:1px solid currentColor; display:block; }
.fld2-pts i.on { background:currentColor; }
.fld2-seul { font-size:13px; color:var(--gris); }
.fld2-ndl { display:flex; flex-wrap:wrap; align-items:center; gap:4px 8px; font-size:12px; color:var(--gris); }
.fld2-nd { display:inline-flex; align-items:center; gap:1px; color:var(--gris); font-size:13px; }
`;
ecrire(ID, 'Nugget', rendu);
