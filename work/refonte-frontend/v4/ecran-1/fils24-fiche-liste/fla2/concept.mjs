// fla2 · froide · le radar g1 parle : au bout de chaque rayon cité, les mots des fiches à la place du seul nom de
// famille ; les mots que le radar ne sait pas dessiner tombent sous lui, en grand, dans sa marge pointillée.
import { ORDRE_RADAR } from '../fla1/commun/socle.mjs';

const lignes = (t, max = 12) => { const out = []; let cur = ''; for (const w of t.split(' ')) { if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; };

export default {
  id: 'fla2', titre: 'Le radar qui parle', chaleur: 'froide', hop: 'nugget',
  etats: [{ nom: 'nelson-sauvin', hop: 'nelson-sauvin' }, { nom: 'cascade', hop: 'cascade' }],
  css: (p) => `
.${p}-rad{display:block;margin:0 auto}
.${p}-cap{display:flex;justify-content:space-between;font-size:12px;color:#4a4a47;margin:-4px 2px 0}
.${p}-marge{border:0;background:#1d1d1b;color:#fff;border-radius:8px;padding:8px 12px 10px;margin-top:8px;position:relative}
.${p}-mt{display:flex;align-items:center;gap:6px;font-size:13px;color:#e6e6e3;margin:0 0 4px}
.${p}-ring{width:14px;height:14px;border-radius:50%;border:2px dashed #e6e6e3;display:inline-block}
.${p}-mots{display:flex;flex-wrap:wrap;gap:2px 14px;align-items:baseline}
.${p}-w{font-weight:650;letter-spacing:-.01em;line-height:1.15}.${p}-w2{font-size:24px}.${p}-w1{font-size:18px;font-weight:550}.${p}-wg{color:#d0d0cc;font-weight:450}
.${p}-w small{font-size:12px;font-weight:500;color:#d0d0cc;margin-left:3px}
.${p}-cl{font-size:13px;color:#e6e6e3;margin:8px 0 0;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
`,
  fiche: (h, S) => {
    const p = 'fla2', R = 80, W = 362, H = 292, cx = W / 2, cy = 142;
    const ang = (i) => (-90 + 30 * i) * (Math.PI / 180);
    const pt = (i, k) => [cx + Math.cos(ang(i)) * R * k, cy + Math.sin(ang(i)) * R * k];
    const kv = (f) => (h.radar[f].level === 2 ? 1 : h.radar[f].level === 1 ? 0.55 : 0.04);
    const hid = p + '-h-' + h.key;
    let s = `<svg class="${p}-rad" data-radar data-objet="fiche" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Radar des mots de ${S.esc(h.nom)}">
      <defs><pattern id="${hid}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#cfcfcb" stroke-width="1.2"/></pattern></defs>`;
    s += `<polygon points="${ORDRE_RADAR.map((_, i) => pt(i, 1).join(',')).join(' ')}" fill="none" stroke="#b9b9b5" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    s += `<polygon points="${ORDRE_RADAR.map((_, i) => pt(i, 0.5).join(',')).join(' ')}" fill="none" stroke="#dededb"/>`;
    ORDRE_RADAR.forEach((f, i) => {
      const v = h.radar[f];
      if (!v.level) s += `<path d="M${cx},${cy} L${pt(i - 0.5, 1).join(',')} L${pt(i + 0.5, 1).join(',')} Z" fill="url(#${hid})" opacity=".8"/>`;
      else s += `<path d="M${cx},${cy} L${pt(i - 0.5, 1).join(',')} L${pt(i + 0.5, 1).join(',')} Z" fill="${S.JETONS[f].base}" fill-opacity="${v.level === 2 ? 0.5 : 0.28}"/>`;
      s += `<line x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" stroke="${v.level ? S.JETONS[f].base : '#e0e0dd'}" stroke-width="${v.level ? 2 : 1}"/>`;
    });
    s += `<polygon points="${ORDRE_RADAR.map((f, i) => pt(i, kv(f)).join(',')).join(' ')}" fill="rgba(40,40,40,.12)" stroke="#1d1d1b" stroke-width="2.2" stroke-linejoin="round"/>`;
    ORDRE_RADAR.forEach((f, i) => {
      const v = h.radar[f]; const [x0, y0] = pt(i, 1.17); const cos = Math.cos(ang(i));
      const anc = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
      if (!v.level) { s += `<text x="${x0}" y="${y0 + 4}" text-anchor="${anc}" font-size="12" fill="#6b6b68">?</text>`; return; }
      const [x, y] = pt(i, kv(f)); s += `<circle cx="${x}" cy="${y}" r="${v.level === 2 ? 4.5 : 3.6}" fill="${v.level === 2 ? '#1d1d1b' : '#fff'}" stroke="#1d1d1b" stroke-width="2"/>`;
      const mots = h.mots.filter((w) => w.f === f && !w.classeSeul);
      const txt = mots.length ? mots.map((w) => w.m).join(', ') : (h.mots.find((w) => w.f === f)?.m || S.NOM[f].toLowerCase()) + ' (classé)';
      const ls = lignes(txt, 13).slice(0, 3);
      const dy = Math.sin(ang(i)) < -0.5 ? -(ls.length - 1) * 15 - 6 : Math.sin(ang(i)) > 0.5 ? 4 : -((ls.length - 1) * 15) / 2;
      ls.forEach((l, k) => { s += `<text x="${x0}" y="${y0 + dy + 4 + k * 15}" text-anchor="${anc}" font-size="${v.level === 2 ? 14 : 13}" font-weight="${v.level === 2 ? 700 : 550}" fill="${S.JETONS[f].texte}">${l}${k === ls.length - 1 ? ` <tspan font-size="11" font-weight="500" fill="#4a4a47">${v.n}/${v.of}</tspan>` : ''}</text>`; });
    });
    s += '</svg>';
    const hors = h.mots.filter((w) => !w.f && !w.classeSeul);
    const classes = h.mots.filter((w) => w.classeSeul && !w.f);
    return `${s}
      <p class="${p}-cap" data-role="fiche-arome"><span>Mots des ${h.N} fiche${h.N > 1 ? 's' : ''}, sur leur rayon</span><span>« ? » non décrite</span></p>
      ${hors.length ? `<div class="${p}-marge"><p class="${p}-mt"><span class="${p}-ring" aria-hidden="true"></span>hors radar</p><div class="${p}-mots">${hors.map((w) => `<span class="${p}-w ${p}-w${w.n === h.N ? 2 : 1}${w.gen ? ' ' + p + '-wg' : ''}">${w.m}<small>${w.n}/${h.N}</small></span>`).join('')}</div>
      ${classes.length ? `<p class="${p}-cl">Classé aussi : ${classes.map((w) => w.m).join(', ')}</p>` : ''}</div>` : ''}`;
  },
};
