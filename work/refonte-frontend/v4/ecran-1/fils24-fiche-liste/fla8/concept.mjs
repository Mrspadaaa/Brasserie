// fla8 · chaude · touche un mot : les mots sont des touches, en grand, sous le radar. Toucher un mot allume son
// rayon sur le radar (ou, sans famille, entoure le radar d'un pointillé : « hors du dessin ») et dit, dessous, qui
// l'écrit et dans quelle langue. Le mot le plus dit est allumé à l'ouverture.
import { ORDRE_RADAR } from '../fla1/commun/socle.mjs';
const SOMBRE = { berries: 1, spice: 1, resin: 1 }, PALE = { herbal: 1 };

export default {
  id: 'fla8', titre: 'Touche un mot', chaleur: 'chaude', hop: 'nelson-sauvin',
  avant: null,
  etats: [
    { nom: 'geste-hors', hop: 'nelson-sauvin', geste: async (pg) => { await pg.tap('[data-role="fiche"]:not([hidden]) [data-fla8-i="2"]'); } },
    { nom: 'geste-famille', hop: 'nelson-sauvin', geste: async (pg) => { await pg.tap('[data-role="fiche"]:not([hidden]) [data-fla8-i="5"]'); } },
    { nom: 'motueka', hop: 'motueka', geste: async (pg) => { await pg.tap('[data-role="fiche"]:not([hidden]) [data-fla8-i="2"]'); } },
  ],
  css: (p) => `
.${p}-scene{position:relative;display:flex;justify-content:center;margin:0 0 2px}
.${p}-halo{position:absolute;left:50%;top:50%;width:166px;height:166px;margin:-83px 0 0 -83px;border-radius:50%;border:3px dashed #1d1d1b;display:none}
.${p}-horsd .${p}-halo{display:block}
.${p}-ax{opacity:0;transition:opacity .15s}.${p}-ax.${p}-on{opacity:1}
.${p}-dit{min-height:40px;margin:0 0 8px;font-size:13px;color:#3a3a38;line-height:1.4;background:#f4f4f2;border-radius:8px;padding:6px 10px}
.${p}-dit b{font-size:15px;color:#1d1d1b}
.${p}-pads{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.${p}-pad{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border-radius:8px;padding:8px 10px;text-align:left;border:1.5px solid transparent;min-height:56px;background:#fff}
.${p}-pad b{font-size:17px;line-height:1.15}.${p}-pad small{font-size:12px;color:#4a4a47;display:flex;align-items:center;gap:4px}
.${p}-padh{border:1.5px dashed #9a9a96;background:#1d1d1b}.${p}-padh b,.${p}-padh small{color:#fff!important}
.${p}-pk{display:inline-flex;background:#fff;border-radius:50%;padding:2px}
.${p}-pad[aria-pressed="true"]{box-shadow:0 0 0 3px #fff,0 0 0 5px #1d1d1b}
.${p}-l2{grid-column:span 2}
`,
  fiche: (h, S) => {
    const p = 'fla8', R = 74, pad = 40, W = 2 * (R + pad), c = R + pad;
    const ang = (i) => (-90 + 30 * i) * (Math.PI / 180);
    const pt = (k, i) => [c + Math.cos(ang(i)) * R * k, c + Math.sin(ang(i)) * R * k];
    // Le radar g1 du socle, plus une couche de rayons allumables.
    let ax = '';
    ORDRE_RADAR.forEach((f, i) => { const [x, y] = pt(1.02, i); ax += `<line class="${p}-ax" data-fla8-f="${f}" x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="${S.JETONS[f].base}" stroke-width="7" stroke-linecap="round"/>`; });
    const rad = S.radar(h, { r: R, pad, fs: 12 }).replace('</svg>', ax + '</svg>');
    const src = (w) => w.src.map(([s, mot, t]) => `${s}${mot.toLowerCase() !== w.m ? ' (« ' + mot + ' »)' : ''}${t === 'classe' ? ', classement' : ''}`).join(' · ');
    const pads = h.mots.map((w, i) => `<button class="${p}-pad${w.f ? '' : ' ' + p + '-padh'}${w.m.length > 15 ? ' ' + p + '-l2' : ''}" data-fla8-i="${i}" data-fla8-f="${w.f || ''}" data-fla8-src="${S.esc(src(w))}" aria-pressed="false"${w.f ? ` data-famille="${w.f}" style="background:${w.classeSeul || PALE[w.f] ? S.JETONS[w.f].fond : S.JETONS[w.f].base};border-color:${S.JETONS[w.f].base}"` : ''}>
        <b style="color:${w.f && !w.classeSeul && SOMBRE[w.f] ? '#fff' : w.f && (w.classeSeul || PALE[w.f]) ? S.JETONS[w.f].texte : '#1d1d1b'}">${w.m}</b><small style="color:${w.f && !w.classeSeul && SOMBRE[w.f] ? '#fff' : '#1d1d1b'}">${w.f ? '<span class="' + p + '-pk">' + S.picto(w.f, 13) + '</span>' + S.NOM[w.f] : 'hors des 12'} · ${w.n}/${h.N}${w.classeSeul ? ' · classé' : ''}</small></button>`).join('');
    return `<div class="${p}-scene">${rad}<span class="${p}-halo" aria-hidden="true"></span></div>
      <p class="${p}-dit" aria-live="polite"></p>
      <div class="${p}-pads" data-role="fiche-arome">${pads}</div>`;
  },
  js: (p) => `
function allumer(f,b){var sc=f.querySelector('.'+P+'-scene'),dit=f.querySelector('.'+P+'-dit');f.querySelectorAll('.'+P+'-pad').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});
 var fam=b.getAttribute('data-fla8-f');f.querySelectorAll('.'+P+'-ax').forEach(function(l){l.classList.toggle(P+'-on',l.getAttribute('data-fla8-f')===fam);});
 sc.classList.toggle(P+'-horsd',!fam);var m=b.querySelector('b').textContent;
 dit.innerHTML='<b>'+m+'</b> · '+(fam?'rayon allumé':'hors du dessin')+'<br>'+b.getAttribute('data-fla8-src');}
document.querySelectorAll('[data-role="fiche"]').forEach(function(f){f.querySelectorAll('.'+P+'-pad').forEach(function(b){b.addEventListener('click',function(){allumer(f,b);});});});
document.addEventListener(P+'-ouverte',function(e){var b=e.detail.fiche.querySelector('.'+P+'-pad');if(b)allumer(e.detail.fiche,b);});`,
};
