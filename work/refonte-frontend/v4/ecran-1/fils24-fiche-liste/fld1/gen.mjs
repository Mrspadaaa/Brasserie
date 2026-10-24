// fld1 — froide : les rangées de g1, affinées, rien d'autre. Ce qui change face à la liste du 24.10 :
// la famille ne redit plus son nom en mot ; « nommé en premier » une seule fois (pastille « 1er ») ; tout en
// français, le mot d'origine en légende ; les mots hors des 12 familles prennent leur rang (par nombre de fiches),
// au même poids qu'une famille, au lieu d'une ligne grise en bas.
import { HOPS, ecrire, doc, titre, alpha, radar, demande, lentille, pic, T, F, nf, esc, STYLE, COURT, autres, ROUE } from './socle.mjs';

const ID = 'fld1';
function mots(ws) {
  return ws.filter((w) => !w.nomFam).map((w) => `<span class="fld1-m${w.n > 1 ? ' fld1-fort' : ''}${w.cat ? ' fld1-cat' : ''}${w.gen ? ' fld1-gen' : ''}">${esc(w.fr)}${w.n > 1 ? `<sup class="num">${w.n}</sup>` : ''}</span>`).join('<span class="fld1-v">, </span>');
}
function rendu(h) {
  const seules = h.familles.filter((f) => !f.mots.some((w) => !w.nomFam));
  const rangs = h.familles.filter((f) => !seules.includes(f)).map((f) => ({ type: 'f', n: f.n, f }));
  if (h.horsFam.length) rangs.push({ type: 'hors', n: Math.max(...h.horsFam.map((w) => w.n)) });
  rangs.sort((a, b) => b.n - a.n || (a.type === 'hors' ? 1 : 0) - (b.type === 'hors' ? 1 : 0));
  let premierVu = false;
  const lignes = rangs.map((r) => {
    if (r.type === 'hors') {
      const ws = h.horsFam;
      return `<li class="fld1-r fld1-hors" data-houblon="${esc(h.nom)}"><span class="fld1-ic">${autres(h, { w: 14, cls: 'fld1-carre' })}</span><span class="fld1-f"><b>Hors des 12</b> <span class="fld1-n">${ws.length} mot${ws.length > 1 ? 's' : ''}</span><span class="fld1-z fd-zone" data-style-seul>16D ?</span></span><span class="fld1-ms">${mots(ws)}</span></li>`;
    }
    const f = r.f, reste = f.mots.filter((w) => !w.nomFam);
    const p = f.premier && !premierVu ? (premierVu = true) : false;
    return `<li class="fld1-r" data-famille-ligne="${f.f}"><span class="fld1-ic">${pic(f.f, 18)}</span><span class="fld1-f"><b style="color:${T(f.f)}">${f.nom}</b> <span class="num fld1-n">${nf(f)}</span>${p ? '<span class="fld1-1er">1er</span>' : ''}${f.dans ? '<span class="fld1-z fd-zone" data-role="zone" data-style-seul>dans le 16D</span>' : ''}</span><span class="fld1-ms">${reste.length ? mots(reste) : '<span class="fld1-seul">le nom seul</span>'}</span></li>`;
  }).join('') + (seules.length ? `<li class="fld1-r fld1-seules"><span class="fld1-ic"></span><span class="fld1-f fld1-sf">${seules.map((f) => `<span class="fld1-s1">${pic(f.f, 14)}<b style="color:${T(f.f)}">${f.nom}</b> <span class="num fld1-n">${nf(f)}</span>${f.dans ? '<span class="fd-zone" data-role="zone" data-style-seul>16D</span>' : ''}</span>`).join('')}</span><span class="fld1-ms fld1-seul">${seules.every((f) => f.mots.every((w) => w.cat)) ? "catégories déclarées par Hopsteiner, sans mot de dégustation" : "nommées, sans autre mot"}</span></li>` : '');
  const bande = ROUE.map((f) => { const d = h.familles.find((x) => x.f === f); return `<i class="fld1-b" style="background:${d ? F(f) : '#f3f3f6'};border-color:${d ? T(f) : '#dcdde2'}" title="${COURT[f]}"></i>`; }).join('') + autres(h, { w: 26, cls: 'fld1-b-aut' });
  const nd = h.nonDecrites.map((f) => `<span class="fld1-nd">${COURT[f]}?</span>`).join('');
  const legende = ['<b>2</b> en exposant : cité par 2 fiches ; sans chiffre : une seule fiche.', '<b>1er</b> : la famille que les fiches nomment en premier.', 'Gris clair : catégorie déclarée par Hopsteiner, pas un mot de dégustation.', 'Traduit de l\'anglais : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot'), '« ? » hachuré : la famille n\'est pas décrite, ce n\'est pas zéro.'];
  const corps = `${titre(h)}${alpha(h)}
${radar(h, { taille: 300 })}
${demande(h)}
<section class="fld1-liste" aria-label="Ses mots">
<div class="fld1-tete"><h2 class="fld1-q">Que sent-il ?</h2>${lentille('leg-' + ID, legende, 'fld1-lent')}</div>
<div class="fld1-bande" aria-hidden="true">${bande}</div>
<p class="fld1-zl" data-style-seul><span class="fd-zone" data-role="zone">16D</span> attend ${STYLE.attendues.map((f) => pic(f, 14) + '<span>' + COURT[f].toLowerCase() + '</span>').join('')}</p>
<ul class="fld1-ul">${lignes}</ul>
<p class="fld1-ndl"><span class="fld1-ndt">non décrites</span>${nd}</p>
</section>`;
  return doc({ id: ID, h, titre: 'fld1 · rangées affinées', corps, css: CSS });
}
const CSS = `
.fld1-liste { background:var(--surf); border-radius:8px; padding:8px 10px 10px; display:flex; flex-direction:column; gap:7px; }
.fld1-tete { display:flex; align-items:center; gap:6px; }
.fld1-q { font-size:15px; font-weight:600; }
.fld1-lent { margin-left:auto; } .fld1-lent .fd-leg { left:auto; right:0; }
.fld1-bande { display:flex; gap:3px; align-items:center; }
.fld1-b { width:20px; height:20px; border-radius:4px; border:1px solid; display:inline-block; }
.fld1-b-aut { height:20px; border-radius:4px; }
.fld1-zl { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); }
.fld1-ul { list-style:none; display:flex; flex-direction:column; }
.fld1-r { display:grid; grid-template-columns:24px 1fr; column-gap:6px; padding:6px 0; border-top:1px solid #e3e4ea; }
.fld1-r:first-child { border-top:0; }
.fld1-ic { grid-row:span 2; padding-top:1px; }
.fld1-carre { width:16px !important; height:16px; border-radius:4px; margin-top:1px; }
.fld1-f { display:flex; align-items:center; gap:6px; font-size:15px; }
.fld1-n { font-size:13px; color:var(--gris); }
.fld1-1er { font-size:12px; font-weight:600; height:18px; padding:0 6px; border-radius:9px; border:1px solid #9c9ca6; display:inline-flex; align-items:center; }
.fld1-z { margin-left:auto; }
.fld1-ms { font-size:14px; color:var(--encre); line-height:1.35; }
.fld1-fort { font-weight:600; }
.fld1-m sup { font-size:11px; color:var(--gris); margin-left:1px; font-weight:600; }
.fld1-cat { color:var(--gris); }
.fld1-gen { color:var(--gris); }
.fld1-v { color:var(--gris); }
.fld1-seul { color:var(--gris); font-size:13px; }
.fld1-sf { flex-wrap:wrap; gap:4px 12px; font-size:14px; } .fld1-s1 { display:inline-flex; align-items:center; gap:4px; }
.fld1-hors .fld1-ms { font-size:15px; }
.fld1-ndl { display:flex; flex-wrap:wrap; gap:4px; align-items:center; font-size:12px; color:var(--gris); }
.fld1-ndt { margin-right:2px; }
.fld1-nd { height:20px; padding:0 6px; border-radius:4px; border:1px dashed #a9aab3; background:repeating-linear-gradient(45deg,#fff 0 3px,#eceef2 3px 6px); color:#45454e; display:inline-flex; align-items:center; }
`;
ecrire(ID, 'Cascade', rendu);
