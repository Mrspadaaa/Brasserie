// fla5c · la page : l'étape Houblons garde son en-tête (‹ Houblons 3/7, 16D hypothèse) et sa barre IBU · OG · EBC, tels
// quels ; dessous, le choix du houblon (greffe flc8b / fld8b), seul facteur libre. La fiche s'ouvre par-dessus l'étape
// (feuille g1) avec son propre en-tête : la question, le nom et son ⊙, l'α de g1 et le lot, l'usage, la ligne de
// contexte, la croix de 44 px. Fil de fer : la fiche est montrée ouverte ; toucher ou appuyer longtemps sur un houblon
// la change. Classes et script préfixés fla5c (L26).
const COULEUR = { nugget: '#2b5d8a', 'nelson-sauvin': '#5b7f2a', 'citra-cryo': '#b0475a', motueka: '#6b4fa0', cascade: '#1f7a6d' };

export function PAGE(S, B, C) {
  const p = C.id, { CSS, PICTOS, HOUBLONS } = B, esc = S.esc, fmt = S.fmt;
  const DEF = C.hop;
  const ordre = [HOUBLONS.find((h) => h.key === DEF), ...HOUBLONS.filter((h) => h.key !== DEF)];
  const corps = ordre.map((h) => ({ h, ...C.fiche(h, S) }));
  const stock = (h) => (h.stock ? `<span class="${p}-stock">${h.stock} g</span>` : `<span class="${p}-stock ${p}-vide">épuisé</span>`);
  const haut = ({ h, haut: r }) => `<div class="${p}-hh" data-fla5c-h="${h.key}"${h.key === DEF ? '' : ' hidden'}>
      <div class="${p}-fh"><h2>Que sent ${esc(h.nom)} ?</h2><span class="${p}-rep" aria-hidden="true">⊙</span>${stock(h)}</div>
      <div class="${p}-fa"><span data-role="fiche-alpha"><span class="${p}-al">α</span> ${h.alpha.variete ? `<span class="${p}-lot">${h.alpha.variete}</span> ` : ''}<b>${fmt(h.alpha.min)}–${fmt(h.alpha.max)} %</b> <span class="${p}-lot">lot ${fmt(h.lot)} %</span></span>
        <span class="${p}-jauge" aria-hidden="true"><i style="left:${(h.alpha.min / 26) * 100}%;width:${((h.alpha.max - h.alpha.min) / 26) * 100}%"></i><b style="left:${(h.lot / 26) * 100}%"></b></span>
        <span class="${p}-us" data-role="usage">${h.usage}</span></div>
      <p class="${p}-ctx" data-role="contexte"><span data-contexte="base">Stout 16D</span> · <span data-contexte="levure">SafAle US-05</span></p>
      ${r}</div>`;
  const nd = (h) => S.ORDRE.filter((f) => !h.radar[f].level).length;
  const barre = `<div class="${p}-bar"><span class="${p}-lens" role="radiogroup" aria-label="Lecture des mots"><button role="radio" data-e="style" data-fla5c-e="style" aria-checked="true">au style</button><button role="radio" data-e="absolu" data-fla5c-e="absolu" aria-checked="false">absolu</button></span>
      ${corps.map(({ h }) => `<span class="${p}-nf" data-fla5c-h="${h.key}" data-role="fiche-arome"${h.key === DEF ? '' : ' hidden'}>${h.mots.length} mots, ${h.N} fiche${h.N > 1 ? 's' : ''}</span>`).join('')}
      <button class="${p}-aideb" data-role="legende-bouton" aria-expanded="false" aria-label="légende">?</button></div>
    <div class="${p}-aide" data-role="legende" hidden><p>Les 12 familles : ${S.ORDRE.map((f) => S.NOM[f]).join(', ')}. Stout 16D (BJCP 2021) : terreux, herbacé, floral attendus. « Déjà trop marqué » : ta dégustation du 18.10 (résineux). « Rangé par le fournisseur » : la famille que Hopsteiner déclare, pas un mot senti. « ? » hachuré : famille non décrite. n/N : fiches qui disent le mot.</p></div>`;
  const choix = `<div class="${p}-hs" data-libre="houblon" aria-label="Houblon de la fiche">${HOUBLONS.map((h) => `<button type="button" class="${p}-hb" data-fla-h="${h.key}" data-houblon="${h.key}" aria-pressed="${h.key === DEF}"><i data-couleur="${COULEUR[h.key]}" data-serie="${h.key}" style="background:${COULEUR[h.key]}"></i>${esc(h.nom)}</button>`).join('')}</div>`;
  const css = `
.${p}-etape{max-width:430px;margin:0 auto;padding:6px 12px 0}
.${p}-h1{font-size:20px;margin:0;flex:1;font-weight:700}
.${p}-hs{display:flex;flex-wrap:wrap;gap:5px;padding:4px 12px 6px;position:relative;z-index:7;max-width:430px;margin:0 auto;scrollbar-width:none}
.${p}-hb{flex:none;display:inline-flex;align-items:center;gap:5px;border:1px solid #cfcfcb;background:#fff;border-radius:999px;padding:4px 10px;font-size:14px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.${p}-hb i{width:8px;height:8px;border-radius:50%;display:inline-block}
.${p}-hb[aria-pressed="true"]{border-color:#1d1d1b;box-shadow:inset 0 0 0 1px #1d1d1b;font-weight:650}
.${p}-feuille{top:166px}
.${p}-fh h2{font-size:20px}.${p}-fh .${p}-stock{white-space:nowrap}
.${p}-x{position:absolute;right:12px;top:10px;width:44px;height:44px;font-size:19px}
.${p}-fh{padding-right:52px;min-height:46px}
.${p}-ctx{font-size:13px;color:#3a3a38;margin:-2px 0 2px}
.${p}-voile{display:block;pointer-events:none}
.${p}-ferme .${p}-voile,.${p}-ferme .${p}-feuille{display:none}
`;
  const js = `(function(){var P=${JSON.stringify(p)};var R=document.documentElement,F=document.querySelector('.'+P+'-feuille');var timer=null,survol=null;
function montrer(k,role){R.classList.remove(P+'-ferme');F.querySelectorAll('[data-fla5c-h]').forEach(function(e){e.hidden=e.getAttribute('data-fla5c-h')!==k;});
 document.querySelectorAll('.'+P+'-hb').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-fla-h')===k));});
 F.scrollTop=0;}
function fermer(){R.classList.add(P+'-ferme');}
document.querySelector('[data-role="fermer-fiche"]').addEventListener('click',fermer);
document.querySelectorAll('.'+P+'-hb').forEach(function(b){var k=b.getAttribute('data-fla-h'),long=false,x0=0,y0=0;
 b.addEventListener('touchstart',function(e){long=false;var t=e.touches[0];x0=t.clientX;y0=t.clientY;clearTimeout(timer);timer=setTimeout(function(){long=true;montrer(k,true);},520);},{passive:true});
 b.addEventListener('touchmove',function(e){var t=e.touches[0];if(Math.abs(t.clientX-x0)+Math.abs(t.clientY-y0)>12)clearTimeout(timer);},{passive:true});
 b.addEventListener('touchend',function(e){clearTimeout(timer);e.preventDefault();if(!long)montrer(k,false);});
 b.addEventListener('click',function(){montrer(k,false);});
 b.addEventListener('contextmenu',function(e){e.preventDefault();});
 b.addEventListener('pointerenter',function(e){if(e.pointerType!=='mouse')return;clearTimeout(survol);survol=setTimeout(function(){montrer(k,true);},700);});
 b.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')clearTimeout(survol);});});
var lb=document.querySelector('[data-role="legende-bouton"]'),lg=document.querySelector('[data-role="legende"]');
lb.addEventListener('click',function(){var o=lg.hidden;lg.hidden=!o;lb.setAttribute('aria-expanded',String(o));});
document.querySelectorAll('[data-fla5c-e]').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('[data-fla5c-e]').forEach(function(x){x.setAttribute('aria-checked',String(x===b));});F.classList.toggle(P+'-abs',b.getAttribute('data-fla5c-e')==='absolu');});});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!lg.hidden){lg.hidden=true;lb.setAttribute('aria-expanded','false');return;}fermer();}});
var m=/fiche=([\\w-]+)/.exec(location.hash);if(m)montrer(m[1],true);
})();`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p} · ${esc(C.titre)} · lot D125, la liste de la fiche (24.10)</title>
<style>${CSS(p)}${C.css(p, S)}${css}</style></head><body>
${PICTOS}
<main class="${p}-etape">
  <header class="${p}-top"><span class="${p}-ret" aria-hidden="true">‹</span><h1>Houblons <small>3/7</small></h1><span class="${p}-style">16D <em>hypothèse</em></span></header>
  <div class="${p}-ibu"><span>IBU <b>60</b></span><span>OG <b>1,066</b></span><span>EBC <b>70</b></span></div>
</main>
${choix}
<div class="${p}-voile"></div>
<section class="${p}-feuille" role="dialog" aria-label="Fiche du houblon" data-fla-ouverte>
  <button class="${p}-x" data-role="fermer-fiche" aria-label="Fermer">✕</button>
  ${corps.map(haut).join('')}
  ${barre}
  <div class="${p}-corps">${corps.map(({ h, bas }) => `<div data-fla5c-h="${h.key}"${h.key === DEF ? '' : ' hidden'}>${bas}</div>`).join('')}</div>
  <footer class="${p}-pied"><span class="${p}-gout" data-role="gout"><button aria-label="J'aime">♡</button><button aria-label="Exclure">⊘</button></span><button class="${p}-cmp">Comparer</button></footer>
</section>
<script>${js}</script>
</body></html>`;
}
