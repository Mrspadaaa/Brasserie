// Mini maquettes d'interaction de la frise (f1 à f6, deux versions), sur sa base g-d1 figée.
// Chaque état = g-d1 + une retouche du DOM (fonctions, pas de remplacement de chaîne), figé en HTML statique.
// Sorties : gx/f?-?-avant|apres.html, gx/cap/*.png (clair, cave), page14/img/*.webp, gx/cap/verif-frise.txt
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIS = path.dirname(HERE);
const BASE = fs.readFileSync(path.join(MIS, 'paliers', 'g-d1.html'), 'utf8');
const CAP = path.join(HERE, 'cap'); const IMG = path.join(MIS, 'page14', 'img');
fs.mkdirSync(CAP, { recursive: true }); fs.mkdirSync(IMG, { recursive: true });
const SEUL = process.argv[2] || '';

const CSS = `
#gx-ov{position:absolute;left:0;top:0;width:0;height:0;z-index:95;pointer-events:none}
#gx-svg{position:absolute;left:0;top:0;overflow:visible}
.gx-doigt{position:absolute;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;background:rgba(124,77,230,.30);border:3px solid rgba(124,77,230,.9);box-shadow:0 0 0 2px var(--bg),0 4px 12px rgba(0,0,0,.25)}
.gx-doigt.gx-leve{background:none;border:3px dashed rgba(124,77,230,.85);box-shadow:none}
.gx-doigt.gx-appui::after{content:"";position:absolute;inset:-11px;border-radius:50%;background:conic-gradient(rgba(124,77,230,.95) 0 260deg,rgba(124,77,230,.18) 260deg 360deg);-webkit-mask:radial-gradient(circle,transparent 31px,#000 32px);mask:radial-gradient(circle,transparent 31px,#000 32px)}
.gx-bul{position:absolute;transform:translate(-50%,-100%);background:var(--ink);color:var(--bg);font-size:14px;font-weight:700;line-height:18px;padding:5px 10px;border-radius:9px;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,.25)}
.gx-fant{position:absolute;border:2px dashed color-mix(in srgb,var(--c) 70%,transparent);border-radius:7px;background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--c) 10%,transparent) 0 6px,transparent 6px 12px);pointer-events:none}
.bar.gx-new{box-shadow:0 0 0 3px var(--bg),0 0 0 6px color-mix(in srgb,var(--c) 55%,transparent)}
.bar.gx-sel{box-shadow:0 0 0 3px var(--bg),0 0 0 6px var(--c)}
.bar.gx-dim,.k17-p.gx-dim{opacity:.35}
.k17-p.gx-lie .k18-r,.k17-p.gx-new .k18-r{box-shadow:0 0 0 3px var(--bg),0 0 0 6px color-mix(in srgb,var(--c) 60%,transparent)}
.lib.gx-ch{background:var(--finbg);color:var(--fin);font-weight:800}
.lib.gx-prov{outline:2px dashed var(--fin);outline-offset:-1px;color:var(--fin);font-weight:800}
.gx-mv{height:20px}
.gx-mv div{font:700 14px/18px "Source Sans 3","Segoe UI",system-ui,sans-serif;text-align:center;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--mut)}
.gx-mv .p{color:var(--ok)}.gx-mv .n{color:var(--bad)}.gx-mv .z{color:var(--mut);font-weight:500}
.gx-mv.gx-prov div{font-style:italic;opacity:.8}
.gd-hd .n.gx-ch{background:var(--finbg);border-radius:10px;padding:0 6px}
.gx-tag{position:absolute;height:24px;line-height:24px;padding:0 8px;border-radius:12px;font-size:14px;font-weight:700;white-space:nowrap;background:color-mix(in srgb,var(--c) 16%,var(--bg));color:color-mix(in srgb,var(--c) 75%,var(--ink));border:1.5px solid color-mix(in srgb,var(--c) 50%,transparent);z-index:4}
.gx-tag.bad{background:var(--badbg);color:var(--bad);border-color:var(--bad)}
.gx-pips{position:absolute;left:0;right:0;top:calc(100% + 3px);height:7px;pointer-events:none}
.gx-pips i{position:absolute;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;background:var(--c)}
.gx-pips i.bad{background:var(--bad);box-shadow:0 0 0 2px var(--badbg)}
.gx-carte{position:relative;margin:2px 0 10px;padding:10px 12px;border-radius:12px;background:var(--s1);border:1.5px solid color-mix(in srgb,var(--c) 45%,var(--line));border-left-width:4px;font-size:14px;line-height:1.35;color:var(--ink)}
.gx-carte p{margin:0}.gx-carte .mu{color:var(--mut)}.gx-carte b.bad,.gx-carte .bad{color:var(--bad)}
.gx-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.gx-chip{height:40px;padding:0 12px;border-radius:20px;border:1.5px solid var(--line2);background:var(--bg);font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;color:var(--ink)}
.gx-chip .ico{width:16px;height:16px}
.gx-chip.on{background:var(--c);border-color:var(--c);color:var(--bg)}
.gx-chip.pri{background:var(--act);border-color:var(--act);color:var(--onact)}
.gx-chip.rd{width:40px;padding:0;justify-content:center}
.gx-chip.bad{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 55%,transparent)}
.gx-hd{height:46px;display:flex;align-items:center;gap:8px;padding:0 10px 0 12px}
.gx-hd i{width:12px;height:12px;border-radius:3px;background:var(--c);flex:none}
.gx-hd b{font-size:20px;font-weight:800;white-space:nowrap}
.gx-hd .m{font-size:20px;font-weight:800;color:var(--ok);font-variant-numeric:tabular-nums}
.gx-hd .r{margin-left:auto}
.gx-leg{display:flex;flex-wrap:wrap;gap:4px 12px;margin:0 12px 4px;font-size:14px;color:var(--mut);line-height:20px}
.gx-leg s{display:inline-block;width:22px;height:0;border-top:2.5px dashed var(--bad);vertical-align:4px;margin-right:6px;text-decoration:none}
.gx-leg u{display:inline-block;width:22px;height:0;border-top:2.5px solid var(--fin);vertical-align:4px;margin-right:6px;text-decoration:none}
.gx-leg .bad{color:var(--bad);font-weight:700}
.gx-det{margin:4px 0 8px}
.gx-det .h{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.gx-det .h b{font-size:17px}.gx-det .h .n{font-weight:800;color:var(--bad);font-variant-numeric:tabular-nums}
.gx-det .h .x{margin-left:auto;width:40px;height:40px;border-radius:20px;display:grid;place-items:center;border:1.5px solid var(--line2)}
.gx-det .l{display:flex;align-items:flex-start;gap:8px;padding:6px 0 0;border-top:1px solid var(--line)}
.gx-det .l .k18-r{--c:var(--e-brassage);margin-top:1px}
.gx-act{position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;z-index:31;background:var(--act);color:var(--onact)}
.gx-act button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;font-weight:600;color:var(--onact)}
.gx-act button.bad{color:#ffb4ab}
html[data-theme=cave] .gx-act button.bad{color:#8c1d14}
.gx-pop{position:absolute;z-index:70;width:302px;background:var(--sheet);border:1px solid var(--line2);border-radius:14px;box-shadow:0 14px 34px rgba(0,0,0,.32);padding:8px;color:var(--ink)}
.gx-pop::before{content:"";position:absolute;top:-8px;left:var(--px);width:14px;height:14px;margin-left:-7px;background:var(--sheet);border-left:1px solid var(--line2);border-top:1px solid var(--line2);transform:rotate(45deg)}
.gx-pop .tg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.gx-pop .tg button{height:56px;border-radius:10px;border:1.5px solid var(--line2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;font-weight:600;white-space:nowrap}
.gx-pop .r{width:100%;min-height:46px;display:flex;align-items:center;gap:10px;padding:0 6px;font-size:14px;font-weight:600;text-align:left;border-bottom:1px solid var(--line)}
.gx-pop .r:last-child{border-bottom:0}
.gx-pop .r span{flex:1;min-width:0}
.gx-pop .r em{font-style:normal;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.gx-pop .r em.p{color:var(--ok)}.gx-pop .r em.n{color:var(--bad)}
.gx-pop .r.bad{color:var(--bad)}
.gx-case{position:absolute;top:2px;width:30px;height:30px;margin-left:-15px;border-radius:50%;border:2px dashed var(--c);display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 14%,var(--bg))}
.gx-case .ico{width:16px;height:16px}
.gx-lien{position:absolute;pointer-events:none}

/* corrections du 16.11 soir */
.gx-pied{position:fixed;left:0;right:0;bottom:56px;height:88px;background:var(--bg);border-top:1px solid var(--line);z-index:25}
.gx-pied::before{content:'';position:absolute;left:0;right:0;bottom:100%;height:14px;background:linear-gradient(to bottom,transparent,var(--bg));pointer-events:none}
#mini .gd-ch{left:auto;right:2px;top:auto;bottom:-4px}
.toast span{white-space:nowrap}
.gx-zl{display:flex;gap:4px 14px;margin:0 12px 2px;font-size:14px;color:var(--mut);line-height:20px}
.gx-zl s{display:inline-block;width:22px;height:0;border-top:2px dashed var(--ink);vertical-align:4px;margin-right:6px;text-decoration:none}
.gx-zl u{display:inline-block;width:22px;height:0;border-top:3px solid var(--fin);vertical-align:4px;margin-right:6px;text-decoration:none}
.gx-dots{position:absolute;left:0;right:0;bottom:7px;height:10px;pointer-events:none;z-index:2}
.gx-dots i{position:absolute;top:0;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:var(--ink);box-shadow:0 0 0 2px var(--bg)}
.gx-dots i.bad{background:var(--bad)}
.gx-pips i{width:9px;height:9px;margin-left:-4.5px}
.gx-ca{display:block;margin-top:6px;font-size:14px;color:var(--mut);font-variant-numeric:tabular-nums}.gx-ca b{color:var(--ink)}
.gx-sem{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:6px;font-size:14px;font-variant-numeric:tabular-nums}.gx-sem span{white-space:nowrap}.gx-sem .bad{color:var(--bad);font-weight:700}
`;

// ---------- aides, injectées dans la page ----------
function AIDES(css) {
  const st = document.createElement('style'); st.id = 'gx-css'; st.textContent = css; document.head.appendChild(st);
  const q = (s, r = document) => r.querySelector(s), qa = (s, r = document) => [...r.querySelectorAll(s)];
  const R = (e) => e.getBoundingClientRect();
  const XS = [10.8, 17.5, 24.3, 31.0, 37.8, 44.5, 51.3];
  const NS = 'http://www.w3.org/2000/svg';
  const ov = () => { let o = q('#gx-ov'); if (!o) { o = document.createElement('div'); o.id = 'gx-ov'; document.body.appendChild(o); } return o; };
  const svg = () => { let s = q('#gx-svg'); if (!s) { s = document.createElementNS(NS, 'svg'); s.id = 'gx-svg'; s.setAttribute('width', '390'); s.setAttribute('height', '900'); s.innerHTML = '<defs><marker id="gx-pt" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#7c4de6"/></marker></defs>'; ov().appendChild(s); } return s; };
  const ICP = q('[data-libre-sem="50"] .ico').cloneNode(true);
  const G = {
    q, qa, R,
    nb(n, sig) { const s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f'); return (n < 0 ? '−' : (sig && n > 0 ? '+' : '')) + s; },
    bar: (id) => q(`[data-chose="${id}"]`),
    lane: (v) => q(`.lane[data-voie="${v}"]`),
    pas: (k) => q(`[data-k17-p="${k}"]`),
    centre(e) { const r = R(e); return [r.left + r.width / 2, r.top + r.height / 2]; },
    doigt(x, y, m = 'touche') { const d = document.createElement('i'); d.className = 'gx-doigt gx-' + m; d.style.left = x + 'px'; d.style.top = y + 'px'; ov().appendChild(d); return d; },
    fleche(x1, y1, x2, y2, k = 0) {
      const d = `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - k} ${x2} ${y2}`;
      svg().insertAdjacentHTML('beforeend', `<path d="${d}" fill="none" stroke="var(--bg)" stroke-width="10" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#7c4de6" stroke-width="4" stroke-linecap="round" marker-end="url(#gx-pt)"/>`);
    },
    lien(x1, y1, x2, y2, c) { svg().insertAdjacentHTML('beforeend', `<path d="M${x1} ${y1} C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="5 4"/>`); },
    bulle(x, y, txt) { const b = document.createElement('span'); b.className = 'gx-bul'; b.style.left = x + 'px'; b.style.top = y + 'px'; b.textContent = txt; ov().appendChild(b); return b; },
    lib(sem, val, cls = 'gx-ch') { const b = q(`[data-libre-sem="${sem}"]`); const t = [...b.childNodes].find((n) => n.nodeType === 3); t.textContent = G.nb(val); if (cls) b.classList.add(cls); return b; },
    manque(sem, on) { const b = q(`[data-libre-sem="${sem}"]`); if (on) { if (!b.querySelector('.ico')) b.appendChild(ICP.cloneNode(true)); b.classList.add('pg-man'); } else { b.querySelector('.ico')?.remove(); b.classList.remove('pg-man'); } },
    rang(map, cls = '') { // une rangée sous les soldes : texte par semaine
      const libRow = q('[data-libre-sem="47"]').parentElement; const r = document.createElement('div'); r.className = 'fg gx-mv ' + cls; r.style.gridTemplateColumns = 'repeat(6,1fr)';
      for (let s = 47; s <= 52; s++) { const c = document.createElement('div'); const v = map[s]; if (v != null) { if (typeof v === 'number') { c.textContent = G.nb(v, true); c.className = v < 0 ? 'n' : 'p'; } else { c.textContent = v[0]; c.className = v[1] || ''; } } r.appendChild(c); }
      libRow.after(r); return r;
    },
    decaler(path, x0, x1, dy, dir) {
      const pts = []; const re = /([MLZ])\s*(-?[\d.]+)?\s*(-?[\d.]+)?/g; let m;
      while ((m = re.exec(path.getAttribute('d')))) pts.push(m[1] === 'Z' ? { c: 'Z' } : { c: m[1], x: +m[2], y: +m[3] });
      const mk = new Set();
      for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1]; if (a.c === 'Z' || b.c === 'Z') continue; if (Math.abs(a.y - b.y) > 0.01 || dir * (b.x - a.x) <= 0) continue; const lo = Math.min(a.x, b.x), hi = Math.max(a.x, b.x); if (lo >= x0 - 0.06 && hi <= x1 + 0.06) { mk.add(k); mk.add(k + 1); } }
      mk.forEach((k) => { pts[k].y = +(pts[k].y + dy).toFixed(2); });
      path.setAttribute('d', pts.map((p) => p.c === 'Z' ? 'Z' : `${p.c}${p.x} ${p.y}`).join(''));
    },
    courbe(sem, chf, toutLaSuite) { // la caisse suit : ligne bleue, aire, hachures
      const i = sem - 47, x0 = XS[i], x1 = toutLaSuite ? 999 : XS[i + 1], dy = -chf / 153.2;
      for (const p of qa('#mini svg.crb path')) { const s = p.getAttribute('stroke') || '', f = p.getAttribute('fill') || '';
        if (s === 'var(--fin)' && !p.getAttribute('stroke-dasharray')) G.decaler(p, x0, x1, dy, 1); else if (f === 'var(--area)') G.decaler(p, x0, x1, dy, 1); else if (f.includes('mch')) G.decaler(p, x0, x1, dy, -1); }
    },
    ligneBleue: () => qa('#mini svg.crb path').find((p) => p.getAttribute('stroke') === 'var(--fin)' && !p.getAttribute('stroke-dasharray')),
    titreLigne(v) { const lt = q(`.lane[data-voie="${v}"] .lt`); lt.classList.remove('pg-in'); lt.removeAttribute('style'); },
    fant(id) { const b = G.bar(id); const g = document.createElement('div'); g.className = 'gx-fant' + (b.classList.contains('cutr') ? ' cutr' : ''); g.style.cssText = `left:${b.style.left};width:${b.style.width};top:${b.style.top};height:${b.offsetHeight}px;--c:${b.style.getPropertyValue('--c')}`; b.parentElement.prepend(g); return g; },
    placer(id, left, width) { const b = G.bar(id); b.style.left = left + 'px'; if (width != null) b.style.width = width + 'px'; return b; },
    toast(txt, btn = 'Annuler') { const t = q('#toast'); t.style.right = (390 - (q('#fab').getBoundingClientRect().left - 12)) + 'px'; t.innerHTML = `<span>${txt}</span><button type="button"><svg class="ico" style="width:16px;height:16px"><use href="#i-retour"></use></svg>${btn}</button>`; t.hidden = false; },
    tag(parent, left, top, txt, cls = '', c) { const s = document.createElement('span'); s.className = 'gx-tag ' + cls; s.style.left = left + 'px'; s.style.top = top + 'px'; if (c) s.style.setProperty('--c', c); s.textContent = txt; parent.appendChild(s); return s; },
    pips(bar, pos) { const p = document.createElement('span'); p.className = 'gx-pips'; for (const [x, cls] of pos) { const i = document.createElement('i'); i.style.left = x + 'px'; if (cls) i.className = cls; p.appendChild(i); } bar.appendChild(p); },
    ico: (id, st = '') => `<svg class="ico"${st ? ` style="${st}"` : ''}><use href="#${id}"></use></svg>`,
    apres(el, html) { el.insertAdjacentHTML('afterend', html); return el.nextElementSibling; },
    // socle commun : la frise s'arrête 88 px au-dessus des onglets (le + n'y cache rien) ; la puce de période sort de la courbe
    socle() {
      if (!q('.gx-pied')) { const p = document.createElement('div'); p.className = 'gx-pied'; document.body.appendChild(p); }
      qa('#mini .mo i').filter((i) => i.textContent.trim() === 'sept.').forEach((i) => i.remove());
    },
    // une rangée coupée par le bord de la marge du + : on défile juste assez pour la montrer entière
    degage() {
      const P = q('.gx-pied').getBoundingClientRect().top; let d = 0;
      for (const e of qa('#fb .k18-n, #fb .lbl, #fb .lt, #fb .gx-carte')) { const r = e.getBoundingClientRect(); if (r.height && r.top < P - 2 && r.bottom > P - 4) d = Math.max(d, r.bottom - P + 6); }
      if (d) window.scrollBy(0, Math.ceil(d)); return d;
    },
    // jours actifs d'un brassin, posés sur sa barre (x en px dans la barre)
    dots(bar, xs) { const d = document.createElement('span'); d.className = 'gx-dots'; for (const [x, cls] of xs) { const i = document.createElement('i'); i.style.left = x + 'px'; if (cls) i.className = cls; d.appendChild(i); } bar.appendChild(d); },
    // courbe zoomée pendant le geste : avant en pointillé, après en plein (semaines i0..)
    zoom(old, nw, labs, note) {
      const mini = q('#mini'); const h = 116, x0 = 46, x1 = 362, top = 12, bot = 86, vMin = 3600, vMax = 6000, n = old.length, dx = (x1 - x0) / n;
      const X = (i) => x0 + i * dx, Y = (v) => top + (vMax - v) * (bot - top) / (vMax - vMin);
      const step = (a) => a.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}L${X(i + 1).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
      let s = `<svg class="crb gx-zoom" width="366" height="${h}" viewBox="0 0 366 ${h}" aria-hidden="true">`;
      for (let k = 0; k < 5; k++) { const v = vMin + k * 600, y = Y(v); s += `<line x1="${x0 - 4}" x2="${x1}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${x0 - 8}" y="${y + 5}" text-anchor="end" class="tk">${G.nb(v)}</text>`; }
      for (let i = 0; i < n; i++) if (old[i] !== nw[i]) { const a = Y(old[i]), b = Y(nw[i]); s += `<rect x="${X(i)}" y="${Math.min(a, b)}" width="${dx}" height="${Math.abs(a - b)}" fill="${nw[i] < old[i] ? 'var(--bad)' : 'var(--ok)'}" opacity=".28"/>`; }
      s += `<path d="${step(nw)}" fill="none" stroke="var(--fin)" stroke-width="3"/><path d="${step(old)}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 4" opacity=".8"/>`;
      labs.forEach((t, i) => { s += `<text x="${X(i + 0.5)}" y="${h - 8}" text-anchor="middle" class="tk"${note && note.i === i ? ' style="fill:var(--ink);font-weight:700"' : ''}>${t}</text>`; });
      if (note) s += `<text x="${X(note.i + 0.5)}" y="${Y(Math.min(old[note.i], nw[note.i])) + 20}" text-anchor="middle" class="pb" style="fill:${note.c || 'var(--bad)'}">${note.t}</text>`;
      mini.innerHTML = s + '</svg>'; mini.style.height = h + 'px';
      mini.insertAdjacentHTML('afterend', `<div class="gx-zl"><span><s></s>avant</span><span><u></u>${note && note.leg ? note.leg : 'après'}</span></div>`);
    },
  };
  // pictos manquants
  q('svg symbol').parentElement.insertAdjacentHTML('beforeend', '<symbol id="gx-lien" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></symbol><symbol id="gx-chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></symbol><symbol id="gx-moins" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>');
  window.GX = G;
}

// ---------- vérification, dans la page ----------
function VERIF() {
  const out = []; const TAB = (document.querySelector('.gx-act') || document.querySelector('.bot')).getBoundingClientRect().top;
  const fab = document.querySelector('#fab').getBoundingClientRect();
  const items = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; if (!el || el.closest('svg defs,style,title')) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r of rg.getClientRects()) {
      if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.top >= 844) continue;
      const enOv = !!el.closest('#gx-ov');
      const hit = document.elementFromPoint(Math.min(389, r.left + r.width / 2), Math.min(843, r.top + r.height / 2));
      const vis = enOv || (hit && (el.contains(hit) || hit.contains(el)));
      if (!vis) continue;
      if (r.top > TAB - 2 && !el.closest('.bot,.gx-act')) continue; // sous les onglets : défile
      const fs = parseFloat(cs.fontSize); if (fs < 14) out.push(`PETIT ${fs}px « ${t.slice(0, 28)} »`);
      if (!el.closest('#fab') && !enOv && r.right > fab.left + 2 && r.left < fab.right - 2 && r.bottom > fab.top + 2 && r.top < fab.bottom - 2) out.push(`SOUS-FAB « ${t.slice(0, 28)} »`);
      items.push({ el, r, t: t.slice(0, 22) });
    }
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]; if (a.el === b.el) continue;
    const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ix > 2 && iy > 4) out.push(`CHEV « ${a.t} » × « ${b.t} »`);
  }
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg')) continue; const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (!r.width || r.bottom <= 0 || r.top >= TAB) continue;
    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1 && el.textContent.trim()) out.push(`COUPE « ${el.textContent.trim().slice(0, 28)} » ${el.scrollWidth}>${el.clientWidth}`);
  }
  const to = document.querySelector('#toast'); if (to && !to.hidden && to.querySelector('span') && to.querySelector('span').getBoundingClientRect().height > to.getBoundingClientRect().height - 4) out.push('COUPE toast « ' + to.textContent.trim().slice(0, 30) + ' »');
  if (document.documentElement.scrollWidth > 390) out.push('DEBORDE ' + document.documentElement.scrollWidth);
  if (to && !to.hidden) { const tr = to.getBoundingClientRect(); if (tr.right > fab.left - 12) out.push('TOAST-FAB ' + Math.round(fab.left - tr.right)); const sp = to.querySelector('span'); if (sp && sp.getBoundingClientRect().height > 22) out.push('TOAST 2 LIGNES'); }
  const gap = Math.round(TAB - fab.bottom); const fabOk = gap >= 4 && gap <= 24 && fab.right > 300;
  return { out: [...new Set(out)], fab: `+ ${fabOk ? 'OK' : 'KO'} écart ${gap} px, droite ${Math.round(390 - fab.right)} px` };
}

// ---------- les gestes ----------
const V = {
  // f1-a : glisser une barre ; au lâcher, la bande et la courbe suivent, l'ancienne place reste en fantôme
  'f1-a': {
    titre: 'Déplacer · au lâcher, la caisse suit',
    avant: (G) => { const b = G.bar('e-01'); const [x, y] = G.centre(b); G.doigt(x, y); G.fleche(x + 22, y + 26, x + 66, y + 26, -10); G.bar('e-01').classList.add('drag'); },
    apres: (G) => {
      G.titreLigne('evenement'); const b = G.placer('e-01', 244); b.classList.add('gx-new');
      G.lib(50, 3940); G.manque(51, true); G.manque(50, false); G.rang({ 50: -1180, 51: 1180 }); G.courbe(50, -1180);
      const [x, y] = G.centre(b); G.doigt(x, y, 'leve'); G.toast('Marché de Noël en S51 · 14 déc.');
    },
  },
  // f1-b : pendant le glisser, la semaine visée s'allume et son solde se calcule avant de lâcher
  'f1-b': {
    titre: 'Déplacer · la caisse se lit pendant le geste',
    avant: (G) => {
      // pendant le glisser : la courbe se zoome sur S49 → S2, avant en pointillé, si tu lâches en plein
      G.zoom([4132, 5120, 5064, 5550, 5492, 5031, 4769], [4132, 5120, 4524, 5550, 5492, 5031, 4769], ['S49', 'S50', 'S51', 'S52', 'S53', 'S1', 'S2'], { i: 2, t: '−540', leg: 'si tu lâches en S51 : 5 064 → 4 524' });
      G.fant('a-04'); const b = G.placer('a-04', 268); b.classList.add('drag'); G.q('.col[data-col="51"]').classList.add('tgt');
      G.lib(51, 4524, 'gx-prov');
      const [x, y] = G.centre(b); const r = G.R(b); G.doigt(x - 4, y); G.fleche(x + 40, r.top - 12, x - 30, r.top - 12, 6); G.bulle(x - 40, r.bottom + 40, 'S51 · 14 déc. · lâcher ici');
    },
    apres: (G) => {
      G.fant('a-04'); const b = G.placer('a-04', 244); b.classList.add('gx-new'); // même longueur : une semaine
      G.lib(51, 4524); G.courbe(51, -540);
      const [x, y] = G.centre(b); G.doigt(x, y, 'leve'); G.toast('S51 : 5 064 → 4 524');
    },
  },
  // f2-a : tirer la fin d'un brassin ; la phase de garde s'allonge, la date « prête » suit
  'f2-a': {
    titre: 'Allonger · tirer la fin d’un brassin',
    avant: (G) => {
      G.titreLigne('brassage'); const b = G.bar('b-01'); b.classList.add('drag');
      G.dots(b, [[6], [61], [235]]); // jours actifs : brassage, transfert, mise en fût
      const r = G.R(b); const y = r.top + r.height / 2; G.doigt(r.right - 8, y); G.fleche(r.right + 20, y, r.right + 60, y);
    },
    apres: (G) => {
      G.titreLigne('brassage'); const b = G.placer('b-01', 0, 302); b.classList.add('gx-new');
      const [pr, ga, co] = G.qa('.k18-tr i', b); pr.style.cssText = 'left:calc(0% + 1px);width:calc(20% - 2px)'; ga.style.cssText = 'left:calc(20% + 1px);width:calc(60% - 2px)'; co.style.cssText = 'left:calc(80% + 1px);width:calc(20% - 2px)';
      G.q('.k18-aj', b).style.left = '1.4%'; G.q('em', b).textContent = 'J0 / 35 · prête 21 déc.';
      G.dots(b, [[6], [61], [296, 'bad']]); // la mise en fût part au 21 déc.
      // ce qui en dépend : 3 fûts promis à La Cigogne le 15 déc. (même alerte que f6-b)
      const f = G.pas('k-fut@5'); f.setAttribute('data-etat', 'manque');
      G.tag(G.q('[data-k18-pied="vente"]'), 292, 4, '15 déc.', 'bad');
      G.apres(G.q('[data-k18-pied="vente"]'), `<div class="gx-carte" style="--c:var(--bad)"><p><b>3 fûts promis à La Cigogne le 15 déc.</b> Mise en fût de la Blonde le 21 déc.</p><div class="gx-chips"><button class="gx-chip pri">Livrer le 22 déc.</button><button class="gx-chip">Annuler l’allongement</button></div></div>`);
      const r = G.R(b); G.doigt(r.right + 16, r.top + r.height / 2, 'leve');
    },
  },
  // f2-b : raccourcir une activité ; ses jours se tassent, la charge par semaine se lit pendant le geste
  'f2-b': {
    titre: 'Raccourcir · les jours se tassent',
    avant: (G) => {
      const b = G.bar('t-01'); b.classList.add('drag'); G.q('.lr', G.lane('activite')).style.height = '46px';
      G.pips(b, [[30.5], [85.5], [97.5]]);
      G.rang({ 47: ['1/2 j', 'z'], 48: ['2/2 j', 'z'], 49: ['2/2 j', 'z'], 50: ['4/2 j', 'n'], 51: ['1/2 j', 'z'], 52: ['2/2 j', 'z'] });
      const r = G.R(b); const y = r.top + r.height / 2; G.doigt(r.left + 8, y); G.fleche(r.left + 58, y - 26, r.left + 128, y - 26);
    },
    apres: (G) => {
      const b = G.placer('t-01', 183, 180); b.classList.add('gx-new'); G.q('.lr', G.lane('activite')).style.height = '46px';
      G.pips(b, [[30.5, 'bad'], [91.5], [152.5, 'bad']]);
      G.rang({ 47: ['1/2 j', 'z'], 48: ['1/2 j', 'z'], 49: ['0/2 j', 'z'], 50: ['5/2 j', 'n'], 51: ['2/2 j', 'z'], 52: ['3/2 j', 'n'] });
      G.manque(52, true);
      const r = G.R(b); G.doigt(r.left - 16, r.top + r.height / 2, 'leve'); G.toast('Ranger la réserve : manque 2 j');
    },
  },
  // f3-a : toucher une case vide ; la proposition la plus probable est posée d'un coup, on corrige d'un toucher
  'f3-a': {
    titre: 'Poser · un toucher, la vente probable',
    avant: (G) => {
      // l'indice au repos : le + de la rangée Ventes (pas de case de pose, refusée, choix n° 33)
      const pl = G.q('.lane[data-voie="vente"] .lt .k14-pl'); const [x, y] = G.centre(pl); G.doigt(x, y);
    },
    apres: (G) => {
      const pd = G.q('[data-k18-pied="vente"]'); const n = G.pas('k-aub@3').cloneNode(true); n.setAttribute('data-k17-p', 'k-cdp@6'); n.style.left = '335.5px'; n.classList.add('gx-new'); n.setAttribute('aria-label', 'Café du Pont, 1 fût, +130, 24 déc.'); n.querySelector('.k18-n').textContent = '+130'; pd.appendChild(n);
      G.apres(pd, `<div class="gx-carte" style="--c:var(--e-vente)"><p><b>Café du Pont · 1 fût · jeu. 24 déc. · <span style="color:var(--ok)">+130</span></b></p><p class="mu">Proposé : il commande toutes les 2 semaines.</p><p class="gx-ca">S52 <b>5 550 → 5 680</b> · au plus serré <b>113 → 243</b></p><div class="gx-chips"><button class="gx-chip">Auberge du Lac</button><button class="gx-chip">La Cigogne</button><button class="gx-chip">Autre</button><button class="gx-chip bad">${G.ico('i-x')}Retirer</button></div></div>`);
      const hn = G.q('.gd-hd .n'); hn.firstChild.textContent = '243'; hn.classList.add('gx-ch');
      G.lib(52, 5680); G.courbe(52, 130, true);
      const pl = G.q('.lane[data-voie="vente"] .lt .k14-pl'); const [x, y] = G.centre(pl); G.doigt(x, y, 'leve');
    },
  },
  // f3-b : tracer une fenêtre de temps dans une rangée vide ; nom et jours sans clavier
  'f3-b': {
    titre: 'Poser · tracer une fenêtre',
    avant: (G) => {
      const lt = G.q('.lane[data-voie="renovation"] .lt');       const lr = G.q('.lane[data-voie="renovation"] .lr'); lt.classList.add('pg-in'); lt.style.cssText = 'left:0;width:120px'; lr.style.height = '48px'; lr.insertAdjacentHTML('beforeend', '<div class="gx-fant" style="left:122px;width:170px;top:2px;height:30px;--c:var(--e-renovation)"></div>'); const rr = G.R(lr); const y2 = rr.top + 17; G.doigt(12 + 122 + 150, y2); G.fleche(12 + 122 + 178, y2, 12 + 366 - 8, y2);
    },
    apres: (G) => {
      const ln = G.lane('renovation'); const lt = G.q('.lt', ln); lt.classList.add('pg-in'); lt.style.cssText = 'left:0;width:120px'; const lr = G.q('.lr', ln); lr.style.height = '48px';
      lr.insertAdjacentHTML('beforeend', '<div class="bar k-renovation neuf gx-new" data-chose="r-01" data-type="renovation" style="left:122px;width:241px;top:2px;--c:var(--e-renovation)"><span class="lbl in">Pose du sol <span class="v" data-val="jours">3 j</span></span><span class="grip g0" data-bord="debut"></span><span class="grip g1" data-bord="fin"></span></div>');
      const b = G.bar('r-01'); G.pips(b, [[30.5, 'bad'], [152.5], [212.5, 'bad']]);
      G.apres(lr, `<div class="gx-carte" style="--c:var(--e-renovation);padding:8px 10px"><div class="gx-chips" style="margin-top:0;gap:6px"><button class="gx-chip on">${G.ico('i-check')}Pose du sol</button><button class="gx-chip rd" aria-label="Dire un autre nom">${G.ico('i-micro')}</button><button class="gx-chip rd" aria-label="Un jour de moins" style="margin-left:auto">${G.ico('gx-moins')}</button><span style="font-weight:800;font-size:17px;align-self:center;white-space:nowrap">3 j actifs</span><button class="gx-chip rd" aria-label="Un jour de plus">${G.ico('i-plus')}</button></div><p class="gx-sem"><span class="bad">S50 déjà 4/2 j</span><span>S49 et S52 pleins</span><span><b>place pour 1 j (S51)</b></span></p></div>`);
      const r = G.R(b); G.doigt(r.right - 10, r.top + r.height / 2, 'leve');
    },
  },
  // f4-a : toucher une barre ; son détail s'ouvre sous elle, dans la frise
  'f4-a': {
    titre: 'Détail · s’ouvre sous la barre',
    avant: (G) => { const b = G.bar('b-02'); const r = G.R(b); G.doigt(Math.min(r.left + 50, 350), r.top + r.height / 2); },
    apres: (G) => {
      const b = G.bar('b-02'); b.classList.add('gx-sel'); const lr = G.q('.lr', G.lane('brassage'));
      G.apres(lr, `<div class="gx-carte gx-det" style="--c:var(--e-brassage)"><div class="h"><b>Porter d’hiver</b><span class="n">−176</span><button class="x" aria-label="Fermer">${G.ico('i-x')}</button></div><div class="k17-phs" style="--n:3;--c:var(--e-brassage)"><span>${G.ico('i-beer')}Brassage<b>lun. 14 déc.</b></span><span>${G.ico('i-cuve')}En cuve<b>15 → 28 déc.</b></span><span>${G.ico('i-k15fut')}Prête<b>11 janv.</b></span></div><div class="l"><span class="k18-r">${G.ico('i-k17cart')}</span><span>Munich 4 kg, Fuggles 200 g : <b class="bad">manquent au stock</b>, à acheter avant le 7 déc.</span></div><div class="gx-chips"><button class="gx-chip pri">Ouvrir le brassin${G.ico('gx-chev')}</button><button class="gx-chip">${G.ico('i-k17cart')}Commander</button></div></div>`);
      
    },
  },
  // f4-b : toucher une barre ; l'en-tête devient sa fiche, la courbe montre la caisse sans elle
  'f4-b': {
    titre: 'Détail · l’en-tête montre la caisse sans elle',
    avant: (G) => { const b = G.bar('v-03'); const [x, y] = G.centre(b); G.doigt(x + 30, y); },
    apres: (G) => {
      const b = G.bar('v-03'); b.classList.add('gx-sel'); G.qa('.bar').forEach((o) => { if (o !== b) o.classList.add('gx-dim'); }); G.qa('.k17-p').forEach((o) => o.classList.add('gx-dim'));
      const hd = G.q('.gd-hd'); hd.style.display = 'none';
      hd.insertAdjacentHTML('afterend', `<div class="gx-hd" style="--c:var(--e-vente)"><i></i><b>Noël privés</b><span class="m">+640</span><span class="r"><button type="button" class="gd-pill" aria-label="Fermer">${G.ico('i-x')}</button></span></div>`);
      const bl = G.ligneBleue(); const g = bl.cloneNode(); g.setAttribute('stroke', 'var(--bad)'); g.setAttribute('stroke-dasharray', '5 3'); g.setAttribute('stroke-width', '2'); g.removeAttribute('stroke-dasharray'); g.setAttribute('stroke-dasharray', '5 3'); bl.after(g);
      G.decaler(g, 31.0, 999, 640 / 153.2, 1); G.q('#mini svg.crb').style.overflow = 'visible';
      // l'écart entre avec et sans, en ruban rouge (4 px seuls ne se voient pas)
      const pts = (p) => { const o = []; const re = /[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g; let m; while ((m = re.exec(p.getAttribute('d')))) o.push([+m[1], +m[2]]); return o.filter(([x]) => x >= 31); };
      const A = pts(bl), S = pts(g); bl.insertAdjacentHTML('beforebegin', `<path d="M${A.map((p) => p.join(' ')).join('L')}L${S.reverse().map((p) => p.join(' ')).join('L')}Z" fill="var(--bad)" opacity=".45"/>`);
      G.q('#mini').insertAdjacentHTML('afterend', `<div class="gx-leg"><span><u></u>avec</span><span><s></s>sans : <b class="bad">−527 CHF en juin (S24)</b></span></div><div class="gx-leg" style="color:var(--ink)">7 → 27 déc. · 48 bouteilles, 6 coffrets · retrait 12 et 19 déc.</div><div class="gx-leg" style="color:var(--ink)"><span>Coffrets : 4 en stock, <b class="bad">manquent 2</b></span></div><div class="gx-chips" style="margin:0 12px 6px"><button class="gx-chip pri">Ouvrir la vente${G.ico('gx-chev')}</button><button class="gx-chip">${G.ico('i-k17cart')}Commander 2 coffrets</button></div>`);
      for (const s of [50, 51, 52]) { G.q(`[data-libre-sem="${s}"]`).classList.add('foc'); G.q(`.col[data-col="${s}"]`).classList.add('foc'); }
      
    },
  },
  // f5-a : appui long ; la barre se soulève, la barre du bas devient ses actions
  'f5-a': {
    titre: 'Appui long · la barre du bas devient ses actions',
    avant: (G) => { const b = G.bar('t-01'); const [x, y] = G.centre(b); G.doigt(x + 50, y, 'appui'); },
    apres: (G) => {
      const b = G.bar('t-01'); b.classList.add('leve'); G.qa('.bar').forEach((o) => { if (o !== b) o.classList.add('gx-dim'); }); G.qa('.k17-p').forEach((o) => o.classList.add('gx-dim'));
      G.q('.bot').style.display = 'none';
      document.body.insertAdjacentHTML('beforeend', `<nav class="gx-act" aria-label="Actions sur Ranger la réserve"><button>${G.ico('i-k11pin')}Épingler</button><button>${G.ico('i-k11star')}Étoile</button><button>${G.ico('i-k11seul')}Filtrer</button><button>${G.ico('i-k11dup')}Dupliquer</button><button>${G.ico('gx-lien')}Lier</button><button class="bad">${G.ico('i-poub')}Retirer</button></nav>`);
    },
  },
  // f5-b : appui long ; un menu sous la barre, chaque action dit ce qu'elle change
  'f5-b': {
    titre: 'Appui long · chaque action dit ce qu’elle change',
    avant: (G) => { const b = G.bar('e-01'); const [x, y] = G.centre(b); G.doigt(x, y, 'appui'); },
    apres: (G) => {
      const b = G.bar('e-01'); b.classList.add('gx-sel'); const r = G.R(b); const left = 390 - 12 - 302;
      document.body.insertAdjacentHTML('beforeend', `<div class="gx-pop" style="left:${left}px;top:${r.bottom + scrollY + 12}px;--px:${r.left + r.width / 2 - left}px"><div class="tg"><button>${G.ico('i-k11pin')}Épingler</button><button>${G.ico('i-k11star')}Étoile</button><button>${G.ico('i-k11seul')}Fêtes seules</button></div><button class="r">${G.ico('i-k11dup')}<span>Dupliquer en S51</span><em class="p">+1 180 · 2 j</em></button><button class="r">${G.ico('gx-lien')}<span>Lier à un brassin, un client</span></button><button class="r bad">${G.ico('i-poub')}<span>Retirer</span><em class="n">S50 : 5 120 → 3 940</em></button></div>`);
    },
  },
  // f6-a : le brassin et ses courses bougent ensemble (convoi), les dates liées se recalculent
  'f6-a': {
    titre: 'Ensemble · le brassin emmène ses courses',
    avant: (G) => {
      const b = G.bar('b-02'); b.classList.add('gx-sel'); G.pas('c:b-02').classList.add('gx-lie');
      G.tag(G.q('[data-k18-pied="brassage"]'), 232, 4, 'avant 7 déc.', '', 'var(--e-brassage)');
      const r = G.R(b); const y = r.top + r.height / 2; G.doigt(r.left + 70, y); G.fleche(r.left + 42, y, r.left + 8, y);
    },
    apres: (G) => {
      const b = G.placer('b-02', 183); b.classList.add('gx-new'); // même longueur, une semaine plus tôt
      const c = G.pas('c:b-02'); c.style.left = '152.5px'; c.classList.add('gx-lie'); const ln = G.q('[data-k18-lien="b-02"]'); ln.style.left = '168.5px';
      G.tag(G.q('[data-k18-pied="brassage"]'), 171, 4, 'avant 30 nov.', '', 'var(--e-brassage)');
      G.lib(50, 4944); G.courbe(50, -176, false);
      const r = G.R(b); G.doigt(r.left + 44, r.top + r.height / 2, 'leve'); G.toast('S50 : 5 120 → 4 944');
    },
  },
  // f6-b : le brassin bouge, ce qui suit suit ; une promesse faite à un client demande son avis
  'f6-b': {
    titre: 'Ensemble · une promesse au client demande',
    avant: (G) => {
      G.titreLigne('brassage'); const b = G.bar('b-01'); b.classList.add('gx-sel'); const f = G.pas('k-fut@5'); f.classList.add('gx-lie');
      G.tag(G.q('[data-k18-pied="vente"]'), 292, 4, '15 déc.', '', 'var(--e-vente)');
      const rb = G.R(b), rf = G.R(f.querySelector('.k18-r')); G.lien(rb.right - 6, rb.bottom, rf.left + rf.width / 2, rf.top - 3, 'var(--e-brassage)');
      const y = rb.top + rb.height / 2, xm = rb.left + rb.width / 2; G.doigt(xm, y); G.fleche(xm + 30, y, xm + 90, y); // le milieu : toute la barre glisse
    },
    apres: (G) => {
      G.titreLigne('brassage'); G.fant('b-01'); const b = G.placer('b-01', 61); b.classList.add('gx-new');
      G.q('.k18-aj', b).remove(); G.q('em', b).textContent = 'dès 23 nov. · prête 21 déc.';
      const f = G.pas('k-fut@5'); f.setAttribute('data-etat', 'manque');
      G.tag(G.q('[data-k18-pied="vente"]'), 292, 4, '15 déc.', 'bad');
      G.apres(G.q('[data-k18-pied="vente"]'), `<div class="gx-carte" style="--c:var(--bad)"><p><b>3 fûts promis à La Cigogne le 15 déc.</b> La Blonde sera prête le 21 déc.</p><div class="gx-chips"><button class="gx-chip pri">Livrer le 22 déc.</button><button class="gx-chip">Annuler le décalage</button></div><p class="gx-ca">Caisse : S47 <b>4 032 → 4 180</b>, la suite inchangée</p></div>`);
      G.lib(47, 4180); G.courbe(47, 148);
      
    },
  },
};

// ---------- banc ----------
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const lignes = [];
const GARDE = ['f1-b', 'f2-a', 'f3-a', 'f3-b', 'f4-a', 'f4-b', 'f5-b', 'f6-a', 'f6-b']; // versions gardées par la critique du 16.11 soir
await p.setContent(BASE, { waitUntil: 'load' }); await p.evaluate(AIDES, CSS); await p.evaluate(() => window.GX.socle());
const base = await p.evaluate(VERIF); const baseSet = new Set(base.out);
lignes.push(`BASE g-d1 : ${base.fab} ; ${base.out.length} constats de base (ignorés ensuite) : ${base.out.join(' | ')}`);
let ko = 0;
for (const [nom, v] of Object.entries(V)) {
  if ((SEUL && !nom.startsWith(SEUL)) || !GARDE.includes(nom)) continue;
  for (const etat of ['avant', 'apres']) {
    await p.setContent(BASE, { waitUntil: 'load' });
    await p.evaluate(AIDES, CSS);
    await p.evaluate(() => window.GX.socle());
    await p.evaluate(`(${v[etat].toString()})(window.GX)`);
    await p.evaluate(() => document.fonts.ready);
    const ve = await p.evaluate(VERIF); const neufs = ve.out.filter((o) => !baseSet.has(o));
    if (neufs.length || !ve.fab.includes('OK')) ko++;
    lignes.push(`${nom}-${etat} : ${ve.fab} ; ${neufs.length ? 'NOUVEAUX : ' + neufs.join(' | ') : 'TEXTE OK (14 px, rien de coupé ni chevauché)'}`);
    const html = await p.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
    fs.writeFileSync(path.join(HERE, `${nom}-${etat}.html`), html.replace(/<title>[^<]*<\/title>/, `<title>${nom} ${etat} · ${v.titre}</title>`));
    for (const th of ['clair', 'cave']) {
      await p.evaluate((t) => { if (t === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, th);
      const suf = th === 'cave' ? '-cave' : '';
      await p.screenshot({ path: path.join(CAP, `${nom}-${etat}${suf}.png`) });
      await p.screenshot({ path: path.join(IMG, `${nom}-${etat}${suf}.webp`), type: 'webp', quality: 82 });
    }
  }
}
// planches de contrôle : avant | après, clair
const pl = await nav.newPage(); await pl.setViewport({ width: 800, height: 870, deviceScaleFactor: 1 });
for (const nom of Object.keys(V)) {
  if ((SEUL && !nom.startsWith(SEUL)) || !GARDE.includes(nom)) continue;
  const u = (e) => 'file:///' + path.join(CAP, `${nom}-${e}.png`).split(path.sep).join('/');
  fs.writeFileSync(path.join(CAP, '_pl.html'), `<body style="margin:0;background:#888;display:flex;gap:20px;padding:4px"><div><b style="font:14px sans-serif">${nom} avant</b><img src="${u('avant')}" width="390"></div><div><b style="font:14px sans-serif">après</b><img src="${u('apres')}" width="390"></div></body>`); await pl.goto('file:///' + path.join(CAP, '_pl.html').split(path.sep).join('/'), { waitUntil: 'load' });
  await pl.screenshot({ path: path.join(CAP, `planche-${nom}.png`) });
}
const cv = await nav.newPage(); await cv.setViewport({ width: 1600, height: 900, deviceScaleFactor: 0.5 });
const noms = Object.keys(V).filter((n) => (!SEUL || n.startsWith(SEUL)) && GARDE.includes(n));
for (let k = 0; k < noms.length; k += 4) {
  const imgs = noms.slice(k, k + 4).map((n) => `<img src="${'file:///' + path.join(CAP, n + '-apres-cave.png').split(path.sep).join('/')}" width="390">`).join('');
  fs.writeFileSync(path.join(CAP, '_pl.html'), `<body style="margin:0;display:flex;gap:10px">${imgs}</body>`); await cv.goto('file:///' + path.join(CAP, '_pl.html').split(path.sep).join('/'), { waitUntil: 'load' });
  await cv.screenshot({ path: path.join(CAP, `planche-cave-${k / 4 + 1}.png`) });
}
await nav.close(); fs.rmSync(path.join(CAP, '_pl.html'), { force: true });
lignes.push(ko ? `FRISE KO : ${ko} état(s)` : `FRISE OK : ${noms.length * 2} états, texte et + conformes`);
fs.writeFileSync(path.join(CAP, 'verif-frise.txt'), lignes.join('\n') + '\n');
console.log(lignes.join('\n'));
