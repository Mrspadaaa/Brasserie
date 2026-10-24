// Socle de la série a : l'étape Houblons de la base v4.10 au repos (fond de la fiche), la feuille g1 à l'appui long
// (ou au survol long à l'ordinateur), le radar g1 et les gestes communs. Le concept ne fournit que la fiche : sa liste
// de mots, la place du radar, son CSS et son geste. Toutes les classes portent le préfixe du concept (L26) ; le script
// tient dans une fonction immédiate.
import { HOUBLONS, ORDRE, NOM, JETONS, PICTOS, ATTENDUES_16D, fmt } from './donnees.mjs';

// Ordre des rayons du radar g1 (sens horaire depuis le haut), tel que dans consolide/fiche.html.
export const ORDRE_RADAR = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function aides(p) {
  const picto = (f, px = 16, extra = '') => `<svg class="${p}-pi" data-famille="${f}" width="${px}" height="${px}" viewBox="0 0 24 24" aria-label="${NOM[f]}"${extra}><use href="#p-${f}"/></svg>`;
  const ton = (f, k = 'texte') => (f ? JETONS[f][k] : k === 'fond' ? '#f1f1ef' : '#3a3a3a');
  // Radar g1 : niveau de fiche 0 / 1 / 2 (cité, marqué), l'inconnu hachuré avec « ? », jamais zéro.
  const radar = (h, o = {}) => {
    const R = o.r || 80, pad = o.pad ?? 34, W = 2 * (R + pad), c = R + pad, n = 12;
    const ang = (i) => (-90 + (360 / n) * i) * (Math.PI / 180);
    const pt = (i, k) => [c + Math.cos(ang(i)) * R * k, c + Math.sin(ang(i)) * R * k];
    const id = p + '-hach-' + h.key;
    let s = `<svg style="overflow:visible" class="${p}-radar ${o.cls || ''}" data-radar data-objet="fiche" width="${o.w || W}" height="${o.w || W}" viewBox="0 0 ${W} ${W}" role="img" aria-label="Radar des familles de ${esc(h.nom)}">`;
    s += `<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#c9c9c6" stroke-width="1.2"/></pattern></defs>`;
    for (const k of [1, 0.5]) s += `<polygon points="${ORDRE_RADAR.map((_, i) => pt(i, k).join(',')).join(' ')}" fill="none" stroke="#d6d6d3" stroke-width="1"/>`;
    ORDRE_RADAR.forEach((f, i) => {
      const v = h.radar[f];
      if (!v.level) {
        const a = pt(i - 0.5, 1), b = pt(i + 0.5, 1);
        s += `<path d="M${c},${c} L${pt(i, 1).join(',')} L${((a[0] + pt(i, 1)[0]) / 2)},${((a[1] + pt(i, 1)[1]) / 2)} Z M${c},${c} L${pt(i, 1).join(',')} L${((b[0] + pt(i, 1)[0]) / 2)},${((b[1] + pt(i, 1)[1]) / 2)} Z" fill="url(#${id})"/>`;
      }
      s += `<line x1="${c}" y1="${c}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" stroke="${v.level ? JETONS[f].base : '#dcdcd9'}" stroke-width="${v.level ? 1.6 : 1}"/>`;
    });
    const kv = (f) => (h.radar[f].level === 2 ? 1 : h.radar[f].level === 1 ? 0.55 : 0.04);
    s += `<polygon points="${ORDRE_RADAR.map((f, i) => pt(i, kv(f)).join(',')).join(' ')}" fill="rgba(40,40,40,.13)" stroke="#1d1d1b" stroke-width="2.2" stroke-linejoin="round"/>`;
    ORDRE_RADAR.forEach((f, i) => { if (h.radar[f].level) { const [x, y] = pt(i, kv(f)); s += `<circle cx="${x}" cy="${y}" r="${h.radar[f].level === 2 ? 4.5 : 3.6}" fill="${h.radar[f].level === 2 ? '#1d1d1b' : '#fff'}" stroke="#1d1d1b" stroke-width="2"/>`; } });
    if (o.labels !== false) ORDRE_RADAR.forEach((f, i) => {
      const v = h.radar[f]; const [x, y] = pt(i, 1 + (o.lab || 0.2));
      const anc = Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end';
      const fs = o.fs || 12;
      if (v.level) s += `<text x="${x}" y="${y + 4}" text-anchor="${anc}" font-size="${fs}" fill="#1d1d1b" font-weight="${v.level === 2 ? 700 : 500}">${o.court ? '' : NOM[f] + ' '}${v.n}/${v.of}</text>`;
      else s += `<text x="${x}" y="${y + 4}" text-anchor="${anc}" font-size="${fs}" fill="#6b6b68">${o.court ? '?' : NOM[f] + '?'}</text>`;
    });
    return s + '</svg>';
  };
  const n2 = (w, h) => `${w.n}/${h.N}`;
  return { picto, ton, radar, n2, NOM, JETONS, ORDRE, ORDRE_RADAR, ATTENDUES_16D, fmt, esc };
}

// Base v4.10 : la stout 16D, « ma bière » (continu, modèle et dégustation du 18.10), les zones du style.
const BIERE = { floral: 0.19, herbal: 0.17, earthy: 0.19, citrus: 0.22, tropical: 0.19, stoneFruit: null, pomeFruit: null, berries: null, melon: null, resin: 2.5, spice: 0.19, green: null };
const HAUT = (f) => (ATTENDUES_16D.includes(f) ? 1.65 : 0.9);

function etape(p, S, C = {}) {
  const E = C.etape;
  const barre = (f, abs) => {
    const max = abs ? 3 : 3, v = BIERE[f], z = HAUT(f) / max * 100, hors = v != null && v > HAUT(f);
    const pos = v == null ? null : Math.min(v / max, 1) * 100;
    return `<div class="${p}-bl" data-famille="${f}">${S.picto(f, 14)}<span class="${p}-bn${ATTENDUES_16D.includes(f) ? ' ' + p + '-att' : ''}${hors ? ' ' + p + '-hors' : ''}">${NOM[f]}</span>
      <span class="${p}-bt${v == null ? ' ' + p + '-inc' : ''}"><span class="${p}-bz" data-role="zone" style="width:${z}%"></span>${v == null ? `<span class="${p}-bq">?</span>` : `<span class="${p}-bp${hors ? ' ' + p + '-bph' : ''}" style="left:calc(${pos}% - 6px)"></span>`}</span></div>`;
  };
  const carte = (h, rapide) => `<div class="${p}-carte" data-role="${rapide ? 'ajout-rapide' : 'ligne-houblon'}" data-fla-h="${h.key}">
      ${rapide ? `<button class="${p}-plus" aria-label="Ajouter ${S.esc(h.nom)}" data-action="ajouter">+</button>` : ''}
      <div class="${p}-cc"><div class="${p}-cl1"><span class="${p}-cn" data-houblon="${h.key}">${S.esc(h.nom)}</span><b class="${p}-ca">α ${fmt(h.lot)}</b><span class="${p}-cu" data-role="usage">${h.usage === 'double usage' ? 'double' : h.usage}</span>${h.stock ? `<span class="${p}-stock" title="en stock">${h.stock} g</span>` : `<span class="${p}-stock ${p}-vide">épuisé</span>`}</div>
      <div class="${p}-cl2">${rapide ? '<span>10 g</span>' : `<span>${h.dansRecette}</span>`}<span class="${p}-band">${S.ORDRE.map((f) => `<i style="background:${h.radar[f].level ? JETONS[f][h.radar[f].level === 2 ? 'base' : 'fond'] : '#ececea'}${h.radar[f].level === 1 ? ';box-shadow:inset 0 0 0 1.5px ' + JETONS[f].base : ''}"></i>`).join('')}</span></div></div></div>`;
  const [nug, ...autres] = HOUBLONS;
  return `<main class="${p}-etape">
  <header class="${p}-top"><span class="${p}-ret" aria-hidden="true">‹</span>${E ? `<h1 style="font-size:18px;white-space:nowrap">${E.titre}</h1>` : "<h1>Houblons <small>3/7</small></h1>"}<span class="${p}-style">16D <em>hypothèse</em></span></header>
  <div class="${p}-ibu"><span>IBU <b>60</b></span><span>OG <b>1,066</b></span><span>EBC <b>70</b></span></div>${E ? `<p class="${p}-ctx" data-role="contexte"><span data-contexte="base">Stout 16D</span> · <span data-contexte="levure">SafAle US-05</span> · <span>appui long : la fiche</span></p>` : ""}
  <section class="${p}-sec"><div class="${p}-moment">Ébullition <b>60′</b></div>${carte(nug, false)}
  <div class="${p}-moment">Ajouts proposés</div>${E ? '<div data-libre="houblon">' : ''}${autres.map((h) => carte(h, true)).join('')}${E ? '</div>' : ''}</section>
  <section class="${p}-profil" data-role="profil">
    <div class="${p}-ph"><b class="${p}-alerte">● Résineux trop marqué</b><span class="${p}-src">ta dégustation 18.10</span>
      <span class="${p}-lent" role="radiogroup" aria-label="Lecture"><button role="radio" data-e="style" aria-checked="true">au style</button><button role="radio" data-e="absolu" aria-checked="false">absolu</button></span>
      <button class="${p}-leg" data-role="legende-bouton" aria-expanded="false" aria-label="légende">?</button></div>
    <div class="${p}-bars" data-lecture="style">${S.ORDRE.map((f) => barre(f)).join('')}</div>
    <div class="${p}-legende" data-role="legende" hidden><p>Les 12 familles d'arômes : ${S.ORDRE.map((f) => NOM[f]).join(', ')}. La zone grise est ce que le style 16D accepte ; le rond est ma bière (~ simulé, résineux par ta dégustation) ; « ? » : non situé, jamais zéro. Gras : familles attendues par le style.</p></div>
  </section>
  <p class="${p}-astuce">Appui long sur un houblon : sa fiche.</p>
</main>`;
}

function fiche(p, S, h, C) {
  const ent = C.entete ? C.entete(h, S) : `<header class="${p}-fh"><h2>${S.esc(h.nom)} <span class="${p}-rep" aria-hidden="true">⊙</span></h2>
      ${h.stock ? `<span class="${p}-stock">${h.stock} g</span>` : `<span class="${p}-stock ${p}-vide">épuisé</span>`}
      <button class="${p}-x" data-role="fermer-fiche" aria-label="Fermer">✕</button></header>
    <div class="${p}-fa"><span data-role="fiche-alpha"><span class="${p}-al">α</span> ${h.alpha.variete ? `<span class="${p}-lot">${h.alpha.variete}</span> ` : ""}<b>${fmt(h.alpha.min)}–${fmt(h.alpha.max)} %</b> <span class="${p}-lot">lot ${fmt(h.lot)} %</span></span>
      <span class="${p}-jauge" aria-hidden="true"><i style="left:${(h.alpha.min / 26) * 100}%;width:${((h.alpha.max - h.alpha.min) / 26) * 100}%"></i><b style="left:${(h.lot / 26) * 100}%"></b></span>
      <span class="${p}-us" data-role="usage">${h.usage}</span></div>`;
  return `<section class="${p}-feuille" data-role="fiche" role="dialog" aria-label="Fiche de ${S.esc(h.nom)}" data-fla-fiche="${h.key}" hidden>
    ${ent}
    <div class="${p}-corps">${C.fiche(h, S)}</div>
    <footer class="${p}-pied"><span class="${p}-gout" data-role="gout"><button aria-label="J'aime">♡</button><button aria-label="Exclure">⊘</button></span><button class="${p}-cmp">Comparer</button></footer>
  </section>`;
}

export const CSS = (p) => `
*{box-sizing:border-box}html,body{margin:0}body{font-family:system-ui,"Segoe UI",Roboto,sans-serif;color:#1d1d1b;background:#fff;-webkit-tap-highlight-color:transparent}
button{font:inherit;color:inherit;cursor:pointer}
.${p}-etape{max-width:430px;margin:0 auto;padding:6px 12px 24px}
.${p}-top{display:flex;align-items:center;gap:10px;height:44px}.${p}-ret{font-size:28px;line-height:1}.${p}-top h1{font-size:20px;margin:0;flex:1}.${p}-top small{font-weight:400;color:#5d5d5a;font-size:13px}
.${p}-style{border:1px solid #bdbdb9;border-radius:999px;padding:3px 4px 3px 10px;font-size:13px}.${p}-style em{font-style:normal;background:#ececea;border-radius:999px;padding:2px 8px;margin-left:4px;color:#4a4a47}
.${p}-n37{font-size:12px;color:#5d5d5a}.${p}-ctx{font-size:13px;color:#3a3a38;margin:0 0 4px}
.${p}-ibu{display:flex;justify-content:space-between;border:1px solid #cfcfcb;border-radius:999px;padding:7px 16px;font-size:13px;color:#4a4a47;margin:2px 0 8px}.${p}-ibu b{font-size:17px;color:#1d1d1b}
.${p}-moment{font-size:13px;color:#4a4a47;margin:8px 0 4px}.${p}-moment b{color:#1d1d1b}
.${p}-carte{display:flex;gap:8px;align-items:center;background:#f4f4f2;border-radius:8px;padding:7px 10px;margin-bottom:6px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.${p}-carte.${p}-sel{box-shadow:inset 0 0 0 2px #1d1d1b}
.${p}-plus{width:28px;height:28px;border-radius:50%;border:0;background:#1d1d1b;color:#fff;font-size:18px;line-height:1;flex:none}
.${p}-cc{flex:1;min-width:0}.${p}-cl1{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}.${p}-cn{font-weight:650;font-size:15px;text-decoration:underline dotted #8a8a86;text-underline-offset:3px}
.${p}-ca{font-size:13px}.${p}-cu{font-size:13px;color:#4a4a47}
.${p}-cl2{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#4a4a47;margin-top:3px}.${p}-band{display:flex;gap:2px}.${p}-band i{width:8px;height:10px;border-radius:2px;display:block}
.${p}-stock{font-size:12px;border:1px solid #c4c4c0;border-radius:4px;padding:0 4px;color:#4a4a47;line-height:16px}.${p}-vide{border-style:dashed}
.${p}-profil{margin-top:10px;border-top:1px solid #dcdcd9;padding-top:8px}
.${p}-ph{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.${p}-alerte{color:#c2410c;font-size:14px}.${p}-src{font-size:12px;color:#5d5d5a;flex:1}
.${p}-lent{display:inline-flex;border:1px solid #cfcfcb;border-radius:999px;padding:2px}.${p}-lent button{border:0;background:none;border-radius:999px;padding:2px 9px;font-size:12px;color:#4a4a47}.${p}-lent [aria-checked="true"]{background:#1d1d1b;color:#fff}
.${p}-leg{width:26px;height:26px;border-radius:50%;border:1px solid #bdbdb9;background:none;font-size:13px;color:#4a4a47;padding:0}
.${p}-bars{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin-top:8px}
.${p}-bl{display:flex;align-items:center;gap:5px;font-size:13px}.${p}-bn{width:62px;color:#4a4a47}.${p}-att{font-weight:700;color:#1d1d1b}.${p}-hors{color:#c2410c}
.${p}-bt{position:relative;flex:1;height:10px;background:#f0f0ee;border-radius:999px}.${p}-bz{position:absolute;left:0;top:0;bottom:0;background:#cfcfcb;border-radius:999px}
.${p}-inc{background:repeating-linear-gradient(45deg,#f4f4f2 0 3px,#d9d9d6 3px 4px)}.${p}-inc .${p}-bz{background:transparent;border:1px dashed #b5b5b1}
.${p}-bq{position:absolute;right:-12px;top:-4px;font-size:12px;color:#5d5d5a}
.${p}-bp{position:absolute;top:-2px;width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #1d1d1b}.${p}-bph{background:#c2410c;border-color:#c2410c}
.${p}-legende{font-size:13px;color:#3a3a38;background:#f6f6f4;border-radius:8px;padding:6px 10px;margin-top:8px}.${p}-legende p{margin:0}
.${p}-astuce{font-size:12px;color:#5d5d5a;margin:10px 0 0}
.${p}-voile{position:fixed;inset:0;background:rgba(20,20,18,.42);display:none;z-index:5}
.${p}-feuille{position:fixed;left:0;right:0;bottom:0;top:84px;max-width:430px;margin:0 auto;background:#fff;border-radius:24px 24px 0 0;z-index:6;overflow-y:auto;padding:10px 14px 0;display:flex;flex-direction:column;box-shadow:0 -4px 24px rgba(0,0,0,.18)}
.${p}-feuille:before{content:"";display:block;width:36px;height:4px;border-radius:999px;background:#cfcfcb;margin:0 auto 6px}
.${p}-feuille[hidden]{display:none}
.${p}-fh{display:flex;align-items:center;gap:8px}.${p}-fh h2{font-size:24px;margin:0;letter-spacing:-.01em}.${p}-rep{font-size:16px;color:#6b6b68;font-weight:400}
.${p}-x{margin-left:auto;width:36px;height:36px;border-radius:50%;border:0;background:#ececea;font-size:17px;flex:none}
.${p}-fa{display:flex;align-items:center;gap:8px;margin:4px 0 6px;flex-wrap:wrap}.${p}-fa b{font-size:22px;letter-spacing:-.01em}.${p}-al{font-size:18px}.${p}-lot{font-size:13px;color:#5d5d5a}
.${p}-jauge{position:relative;width:70px;height:8px;background:#ececea;border-radius:999px}.${p}-jauge i{position:absolute;top:0;bottom:0;background:#a9a9a5;border-radius:999px}.${p}-jauge b{position:absolute;top:-3px;width:3px;height:14px;background:#1d1d1b;border-radius:2px}
.${p}-us{margin-left:auto;font-size:13px;border:1px solid #bdbdb9;border-radius:999px;padding:2px 10px}
.${p}-corps{padding-bottom:8px;flex:1 0 auto}
.${p}-pied{position:sticky;bottom:0;display:flex;justify-content:space-between;align-items:center;background:#fff;padding:8px 0 10px;border-top:1px solid #ececea;margin-top:4px}
.${p}-gout{display:flex;gap:4px;background:#f0f0ee;border-radius:999px;padding:3px}.${p}-gout button{border:0;background:none;width:34px;height:30px;font-size:17px}
.${p}-cmp{border:1px solid #bdbdb9;background:#fff;border-radius:999px;padding:6px 18px;font-size:15px}
.${p}-pi{flex:none;display:inline-block;vertical-align:-2px}
`;

const JS = (p) => `(function(){
var P=${JSON.stringify(p)};var voile=document.querySelector('.'+P+'-voile');var timer=null,ouvert=null,survol=null;
function ouvrir(k){fermer();var f=document.querySelector('[data-fla-fiche="'+k+'"]');if(!f)return;f.hidden=false;voile.style.display='block';ouvert=f;f.scrollTop=0;document.dispatchEvent(new CustomEvent(P+'-ouverte',{detail:{fiche:f,key:k}}));}
function fermer(){if(ouvert){ouvert.hidden=true;ouvert=null;}voile.style.display='none';}
window[P+'Ouvrir']=ouvrir;
voile.addEventListener('click',fermer);
document.querySelectorAll('[data-role="fermer-fiche"]').forEach(function(b){b.addEventListener('click',fermer);});
document.querySelectorAll('[data-fla-h]').forEach(function(c){var k=c.getAttribute('data-fla-h');var long=false,x0=0,y0=0;
 c.addEventListener('touchstart',function(e){long=false;var t=e.touches[0];x0=t.clientX;y0=t.clientY;clearTimeout(timer);timer=setTimeout(function(){long=true;ouvrir(k);},520);},{passive:true});
 c.addEventListener('touchmove',function(e){var t=e.touches[0];if(Math.abs(t.clientX-x0)+Math.abs(t.clientY-y0)>12)clearTimeout(timer);},{passive:true});
 c.addEventListener('touchend',function(e){clearTimeout(timer);if(long){e.preventDefault();return;}if(!e.target.closest('button'))c.classList.toggle(P+'-sel');});
 c.addEventListener('contextmenu',function(e){e.preventDefault();});
 c.addEventListener('pointerenter',function(e){if(e.pointerType!=='mouse')return;clearTimeout(survol);survol=setTimeout(function(){ouvrir(k);},700);});
 c.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')clearTimeout(survol);});
});
var lb=document.querySelector('[data-role="legende-bouton"]'),lg=document.querySelector('[data-role="legende"]');
lb.addEventListener('click',function(){var o=lg.hidden;lg.hidden=!o;lb.setAttribute('aria-expanded',String(o));});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!lg.hidden){lg.hidden=true;lb.setAttribute('aria-expanded','false');}fermer();}});
document.querySelectorAll('[data-e]').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('[data-e]').forEach(function(x){x.setAttribute('aria-checked',String(x===b));});document.querySelector('.'+P+'-bars').setAttribute('data-lecture',b.getAttribute('data-e'));});});
var m=/fiche=([\\w-]+)/.exec(location.hash);if(m)ouvrir(m[1]);
})();`;

export function page(C) {
  if (C.page) return C.page(aides(C.id), { CSS, PICTOS, HOUBLONS }, C);
  const p = C.id, S = aides(p);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${C.id} · ${S.esc(C.titre)} · lot D125, la liste de la fiche (24.10)</title>
<style>${CSS(p)}${C.css(p, S)}</style></head><body>
${PICTOS}
${etape(p, S, C)}
<div class="${p}-voile"></div>
${HOUBLONS.map((h) => fiche(p, S, h, C)).join('\n')}
<script>${JS(p)}</script>${C.js ? `<script>(function(){var P=${JSON.stringify(p)};${C.js(p)}})();</script>` : ''}
</body></html>`;
}
