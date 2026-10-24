// flb8 — chaude (forme libre) : l'orbite. Le radar reste au centre ; ses mots gravitent autour, chacun sur le rayon
// de sa famille. Les mots que le radar ne sait pas dessiner (hors des 12 familles) flottent sur l'orbite, sans
// rayon, en grand s'ils font sa signature : on voit d'un coup ce que le dessin rate (Nelson Sauvin : presque tout).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, lentille, legende, gout, selecteur, radar, NOM, T, B, RADAR, esc, pi } from '../flb1/socle-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const W = 362, Hh = 430, cx = W / 2, cy = Hh / 2, R0 = 70, RO = 168;
const ang = (i) => (-90 + i * 30) * Math.PI / 180;
const larg = (t, fs) => t.length * fs * 0.56;

function orbite(h) {
  let s = '<svg class="flb8-o" width="' + W + '" height="' + Hh + '" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Ses mots autour du radar de ' + esc(h.nom) + '">';
  s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (RO - 6) + '" ry="' + (Hh / 2 - 12) + '" fill="none" stroke="#16161a" stroke-width="1.2" stroke-dasharray="2 5"/>';
  const occupe = new Set(), boites = [];
  // Les mots d'une famille, sur son rayon, du centre vers l'extérieur.
  for (const a of h.familles) {
    const i = RADAR.indexOf(a.f), mots = h.concepts.filter((c) => c.famille === a.f && !c.seulCategorie && !c.nomFamille);
    occupe.add(i);
    const [ux, uy] = [Math.cos(ang(i)), Math.sin(ang(i))];
    s += '<line x1="' + (cx + ux * R0).toFixed(1) + '" y1="' + (cy + uy * R0).toFixed(1) + '" x2="' + (cx + ux * (R0 + 22 + mots.length * 20)).toFixed(1) + '" y2="' + (cy + uy * (R0 + 22 + mots.length * 20)).toFixed(1) + '" stroke="' + B(a.f) + '" stroke-width="1.6"/>';
    const anc = Math.abs(ux) < 0.2 ? 'middle' : ux > 0 ? 'start' : 'end';
    const cat = h.concepts.filter((c) => c.famille === a.f).every((c) => c.seulCategorie);
    const lab = [NOM[a.f] + ' ' + a.n + '/' + a.N + (cat ? ' · cat.' : ''), ...mots.map((c) => c.mot)];
    lab.forEach((t, k) => {
      const r = R0 + 14 + k * 19, x = cx + ux * r + (anc === 'start' ? 4 : anc === 'end' ? -4 : 0), y = cy + uy * r + 4 + (Math.abs(ux) < 0.2 ? (uy < 0 ? -4 : 6) : 0);
      const lw = larg(t, 14) + 4; boites.push([anc === 'start' ? x : anc === 'end' ? x - lw : x - lw / 2, y - 14, anc === 'start' ? x + lw : anc === 'end' ? x : x + lw / 2, y + 4]);
      s += '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + anc + '" font-size="' + (k ? 14 : 12) + '" font-weight="' + (k ? 600 : 700) + '" fill="' + (k ? T(a.f) : '#55555f') + '" paint-order="stroke" stroke="#fff" stroke-width="4">' + esc(t) + '</text>';
    });
  }
  // Les mots hors des familles : sur l'orbite, dans le plus grand arc libre.
  const hors = h.concepts.filter((c) => !c.famille).sort((a, b) => b.signe - a.signe || b.n - a.n);
  if (hors.length) {
    let best = [0, 0];
    for (let st = 0; st < 12; st++) { let L = 0; while (L < 12 && !occupe.has((st + L) % 12)) L++; if (L > best[1]) best = [st, L]; }
    const libre = []; for (let k = 0; k < best[1]; k++) libre.push(best[0] + k);
    const cand = []; for (const f of [0.92, 0.72]) for (let t = best[0] - 0.2; t <= best[0] + best[1] - 0.8; t += 0.25) cand.push([t, f]); for (let t = 0; t < 12; t += 0.25) cand.push([t, 0.92]);
    hors.forEach((c) => {
      const fs = c.signe && c.n === c.N ? 20 : c.signe ? 16 : 13, w = larg(c.mot, fs) + 6, hgt = fs + 16;
      let pos = null;
      for (const [t, f] of cand) {
        const th = ang(t); let x = cx + Math.cos(th) * (RO - 30) * f, y = cy + Math.sin(th) * (Hh / 2 - 38) * f;
        x = Math.min(W - w / 2 - 2, Math.max(w / 2 + 2, x));
        const bx = [x - w / 2, y - fs, x + w / 2, y - fs + hgt];
        const px = Math.max(bx[0], Math.min(cx, bx[2])), py = Math.max(bx[1], Math.min(cy, bx[3])); if (Math.hypot(px - cx, py - cy) < R0 + 10) continue;
        if (boites.some((q) => bx[0] < q[2] && q[0] < bx[2] && bx[1] < q[3] && q[1] < bx[3])) continue;
        pos = [x, y]; boites.push(bx); break;
      }
      if (!pos) return;
      const [x, y] = pos;
      s += '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" font-size="' + fs + '" font-weight="' + (c.signe ? 800 : 400) + '" fill="' + (c.signe ? '#16161a' : '#55555f') + '" paint-order="stroke" stroke="#fff" stroke-width="5">' + esc(c.mot) + '</text>'
        + '<text x="' + x.toFixed(1) + '" y="' + (y + 13).toFixed(1) + '" text-anchor="middle" font-size="11" fill="#55555f">' + (c.seulCategorie ? 'catégorie' : c.n + '/' + c.N) + (c.rare ? ' · rare' : '') + '</text>';
    });
  }
  return s + '</svg>';
}

function feuille(h) {
  const nHors = h.concepts.filter((c) => !c.famille).length, nTous = h.concepts.length;
  return '<section class="flb-feuille flb8-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + '<header class="flb8-t">' + titre(h) + '<span class="flb8-d">' + usage(h) + croix(h) + '</span></header>'
    + '<div class="flb8-a">' + alpha(h) + stock(h) + '</div>'
    + '<div class="flb8-z"><div class="flb8-rad">' + radar(h, { taille: 2 * R0 + 12, rayon: R0, etiquettes: false, demande: false }) + '</div>' + orbite(h) + '</div>'
    + '<p class="flb8-c" data-role="signature"><b class="num">' + nHors + '/' + nTous + '</b> de ses mots sont hors du dessin' + (nHors ? ' : ils flottent sur l\'orbite' : '') + '.</p>'
    + '<p class="flb8-fam">' + h.familles.map((a) => '<span data-famille="' + a.f + '">' + pi(a.f, 14) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b> ' + a.n + '/' + a.N + '</span>').join('') + '</p>'
    + '<div class="flb8-o2">' + legende('flb8-' + h.cle, ['Au centre, le radar : ses familles. Sur chaque rayon, les mots de ses fiches pour cette famille.', 'Sur l\'orbite, sans rayon : les mots hors des 12 familles. En grand : toutes ses fiches le disent.', 'rare : 12 houblons sur 318 au plus le disent. cat. : catégorie de Hopsteiner, sans mot.']) + selecteur(h.nom, 'pastilles') + '</div>'
    + '<div class="flb8-l">' + lentille() + '<span class="flb8-k">au style, le radar montre en pointillé ce que ta stout attend</span></div>'
    + gout(h) + '</section>';
}

const CSS = `
.flb8 .flb-cadre { background:#d9dadd; }
.flb8-t { display:flex; align-items:center; justify-content:space-between; }
.flb8-d { display:flex; align-items:center; gap:8px; }
.flb8-a { display:flex; align-items:center; gap:10px; }
.flb8-z { position:relative; width:${W}px; height:${Hh}px; margin:0 auto; }
.flb8-rad { position:absolute; left:${cx - R0 - 6}px; top:${cy - R0 - 6}px; }
.flb8-o { position:absolute; inset:0; }
.flb8-o text { font-family:var(--sans); }
.flb8-c { font-size:15px; text-align:center; }
.flb8-c b { font-size:17px; }
.flb8-fam { display:flex; flex-wrap:wrap; justify-content:center; gap:2px 12px; font-size:13px; }
.flb8-fam span { display:inline-flex; align-items:center; gap:3px; }
.flb8-o2 { display:flex; align-items:center; gap:8px; }
.flb8-o2 .flb-sel { flex:1; }
.flb8-o2 .flb-sel button { height:26px; font-size:12px; padding:0 8px; }
.flb8-l .flb-seg { flex:none; white-space:nowrap; }
.flb8-l { display:flex; align-items:center; gap:8px; }
.flb8-k { font-size:12px; color:var(--gris); }
`;

ecrire(ici, page({ id: 'flb8', nom: 'l\'orbite : ses mots autour du radar', css: CSS, debut: 'Nelson Sauvin', feuille, cadre: (s) => fond(40) + s }));
console.log('flb8 écrit');
