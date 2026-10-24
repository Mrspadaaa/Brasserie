// fld7 — chaude (forme libre : la cible). Ses mots tombent sur une cible, face au style de sa bière : au centre, ce
// que le 16D attend (floral, herbacé, terreux, BJCP) ; autour, ce qu'il n'attend pas ; au bord, ce dont le style ne
// dit rien (les mots hors des 12 familles : « ? »). À un toucher, l'absolu : la cible se range par fiches qui citent.
import { ecrire, doc, titre, alpha, radar, demande, lentille, pic, T, esc, STYLE } from '../fld1/socle.mjs';

const ID = 'fld7';
const S = 360, C = S / 2;
const larg = (w) => w.fr.length * 7.6 + (w.fam ? 17 : 0) + 30;
// Des rangées horizontales dans chaque anneau, au-dessus et au-dessous du disque intérieur : pas de chevauchement.
function rangees(ws, k, RAY) {
  const ri = k === 0 ? 0 : RAY[k - 1], ro = RAY[k], rangs = [];
  if (k === 0) ws.forEach((w, q) => rangs.push({ d: (q - (ws.length - 1) / 2) * 19, ws: [w] }));
  else {
    for (let d = ri + 19; d <= ro - 10; d += 19) for (const sg of [-1, 1]) { if (sg < 0 && d > ro - 26) continue; rangs.push({ d: sg * d, cap: 2 * Math.sqrt(ro * ro - d * d) - 14, ws: [] }); }
    rangs.sort((a, b) => Math.abs(a.d) - Math.abs(b.d) || (k === 2 ? b.d - a.d : 0));
    const plein = (x) => x.ws.reduce((s, y) => s + larg(y) + 10, 0);
    for (const w of ws) { const r = rangs.find((x) => plein(x) + larg(w) <= x.cap) || [...rangs].sort((a, b) => plein(a) - a.cap - (plein(b) - b.cap))[0]; r.ws.push(w); }
  }
  const out = [];
  for (const r of rangs) { const tot = r.ws.reduce((s, y) => s + larg(y), 0) + 10 * Math.max(0, r.ws.length - 1); let x0 = C - tot / 2; for (const w of r.ws) { out.push({ w, x: x0 + larg(w) / 2, y: C + r.d }); x0 += larg(w) + 10; } }
  return out;
}
function placer(ws, k, RAY) {
  if (!ws.length) return '';
  return rangees(ws, k, RAY).map(({ w, x, y }) => {
    const st = w.fam ? `color:${T(w.fam)}` : '';
    return `<span class="fld7-w${w.fam ? '' : ' fld7-h'}${w.cat ? ' fld7-cat' : ''}${w.nomFam ? ' fld7-nf' : ''}${w.gen ? ' fld7-gen' : ''}" style="left:${(x / S) * 100}%;top:${(y / S) * 100}%;${st}" ${w.fam ? `data-famille="${w.fam}"` : ''}>${w.fam ? pic(w.fam, 13) : ''}${esc(w.fr)}<small class="num">${w.n}/${w.N}</small></span>`;
  }).join('');
}
const pc = (v) => ((v / S) * 100).toFixed(2) + '%';
function cible(h, mode) {
  const ws = h.mots;
  const anneaux = mode === 'style'
    ? [ws.filter((w) => w.style === 'dans'), ws.filter((w) => w.style === 'hors'), ws.filter((w) => w.style === 'inconnu')]
    : [ws.filter((w) => w.n === w.N && !w.cat), ws.filter((w) => w.n < w.N && !w.cat), ws.filter((w) => w.cat)];
  // Les anneaux se taillent sur leurs mots : un centre vide se réduit, un anneau plein s'élargit.
  const RAY = [anneaux[0].length ? Math.max(48, 18 + anneaux[0].length * 11) : 32, anneaux[1].length > 7 ? 146 : 130, 178];
  const noms = mode === 'style' ? ['attendu au 16D', 'pas attendu', 'le style n\'en dit rien ?'] : [h.N > 1 ? `toutes ses fiches (${h.N})` : 'sa fiche', 'une partie', 'catégorie seule'];
  const disque = (r) => `width:${pc(2 * r)};height:${pc(2 * r)}`;
  return `<div class="fld7-cible fld7-${mode}" ${mode === 'style' ? 'data-style-seul' : 'data-abs-seul'} aria-label="Cible de ses mots">
<i class="fld7-a fld7-a2" style="${disque(RAY[2])}"></i><i class="fld7-a fld7-a1" style="${disque(RAY[1])}"></i><i class="fld7-a fld7-a0" style="${disque(RAY[0])}" ${mode === 'style' ? 'data-role="zone"' : ''}></i>
<b class="fld7-nm fld7-nm0" style="top:${pc(C - RAY[0])}">${noms[0]}${!anneaux[0].length ? ' : rien' : ''}</b><b class="fld7-nm fld7-nm1" style="top:${pc(C - RAY[1])}">${noms[1]}</b><b class="fld7-nm fld7-nm2" style="top:${pc(C - RAY[2])}">${noms[2]}</b>
${anneaux.map((a, k) => placer(a, k, RAY)).join('')}</div>`;
}
function rendu(h) {
  const nDans = h.mots.filter((w) => w.style === 'dans').length;
  const legende = ['Au style : centre, familles que le 16D attend (BJCP : floral, herbacé, terreux, bas et facultatif) ; bord : mots hors des 12, dont le style ne dit rien.', 'Absolu : centre, les mots que toutes ses fiches citent.', 'n/N : fiches qui citent le mot. Italique : catégorie déclarée par Hopsteiner.', 'Traduit : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot')];
  const corps = `${titre(h)}${alpha(h)}
${radar(h, { taille: 206 })}
${demande(h)}
<section class="fld7-s" aria-label="Ses mots face au style" data-houblon="${esc(h.nom)}">
<div class="fld7-t"><h2>Ses mots dans ta stout ?</h2>${lentille('leg-' + ID, legende, 'fld7-lent')}</div>
<p class="fld7-r" data-style-seul><b>${nDans}</b> mot${nDans > 1 ? 's' : ''} sur ${h.mots.length} au centre · ${h.horsFam.length} au bord <span class="fld7-aut" data-role="autres" data-part="${h.part.toFixed(2)}" aria-label="autres : hors des 12 familles" style="width:${Math.max(6, Math.round(h.part * 50))}px"></span></p>
${cible(h, 'style')}${cible(h, 'absolu')}
</section>`;
  return doc({ id: ID, h, titre: 'fld7 · cible', corps, css: CSS });
}
const CSS = `
.fld7-s { display:flex; flex-direction:column; gap:4px; }
.fld7-t { display:flex; align-items:center; gap:6px; } .fld7-t h2 { font-size:15px; font-weight:600; }
.fld7-lent { margin-left:auto; } .fld7-lent .fd-leg { left:auto; right:0; }
.fld7-r { font-size:12px; color:var(--gris); display:flex; align-items:center; gap:5px; } .fld7-r b { color:var(--encre); font-size:14px; }
.fld7-aut { display:inline-block; height:8px; border-radius:2px; background:#8d8d96; }
.fld7-cible { position:relative; width:100%; aspect-ratio:1; margin:2px auto 0; }
.fld7-a { position:absolute; border-radius:50%; left:50%; top:50%; transform:translate(-50%,-50%); }
.fld7-a2 { border:1.5px dashed #8d8d96; background:#fafafb; }
.fld7-style .fld7-a2 { background:#3a3d44; border:0; }
.fld7-style .fld7-nm2 { background:#3a3d44; color:#fff; }
.fld7-style .fld7-h { color:#fff; background:#3a3d44; padding:1px 4px; border-radius:2px; } .fld7-style .fld7-h small { color:#d2d4da; } .fld7-style .fld7-h.fld7-gen { color:#c9cbd1; }
.fld7-a1 { background:#f5f5f7; border:1px solid #d6d7dd; }
.fld7-a0 { background:#e4eaf4; border:2px solid var(--zone); }
.fld7-absolu .fld7-a0 { background:#e9e9ee; border-color:#16161a; }
.fld7-nm { position:absolute; left:50%; transform:translateX(-50%); font-size:12px; font-weight:600; color:var(--gris); white-space:nowrap; background:#fff; padding:0 5px; border-radius:2px; }
.fld7-nm0 { margin-top:-8px; color:var(--zone); background:#e4eaf4; }
.fld7-absolu .fld7-nm0 { color:var(--encre); background:#e9e9ee; }
.fld7-nm1 { margin-top:-8px; background:#f5f5f7; }
.fld7-nm2 { margin-top:-8px; }
.fld7-w { position:absolute; transform:translate(-50%,-50%); display:inline-flex; align-items:center; gap:3px; white-space:nowrap; font-size:14px; font-weight:700; line-height:1; }
.fld7-w small { font-size:11px; font-weight:600; color:#4a4a53; margin-left:1px; }
.fld7-h { color:var(--encre); font-size:16px; font-weight:800; }
.fld7-nf { font-weight:500; } .fld7-cat { font-weight:400; font-style:italic; font-size:13px; } .fld7-gen { font-weight:400; color:#5b5b66; }
`;
ecrire(ID, 'Nugget', rendu);
