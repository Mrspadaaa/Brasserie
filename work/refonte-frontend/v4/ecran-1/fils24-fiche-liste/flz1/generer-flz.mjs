// Série z (lot D125, fils24-fiche-liste) : huit concepts chauds pour « Que sent ce houblon, dit avec ses mots ? ».
// Génère <racine>/work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flz[1-8]/etat.html, pages statiques, classes
// préfixées par l'id (L26). Données : pack-fiches.json (mots des fiches, α, rôle, stock) et style-bands.json (16D).
// Usage : node generer-flz.mjs <racine-du-depot>
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(process.argv[2] || '.');
const LOT = path.join(RACINE, 'work/refonte-frontend/v4/ecran-1/fils24-fiche-liste');
const PACK = JSON.parse(fs.readFileSync(path.join(RACINE, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8'));
const BANDES = JSON.parse(fs.readFileSync(path.join(RACINE, 'prototypes/houblons-v4/data/style-bands.json'), 'utf8'));
const JETONS = JSON.parse(fs.readFileSync(path.join(RACINE, 'work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json'), 'utf8'));
const PLANCHE = fs.readFileSync(path.join(RACINE, 'work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html'), 'utf8');
const SYMBOLES = PLANCHE.match(/<symbol id="p-[\s\S]*?<\/symbol>/g).join('\n');

// Les 12 familles, dans l'ordre du radar de la fiche g1 (Agrumes en haut, sens horaire).
const FAM = [
  ['citrus', 'Agrumes'], ['tropical', 'Tropicaux'], ['melon', 'Melon'], ['stoneFruit', 'Noyau'], ['pomeFruit', 'Pépins'],
  ['berries', 'Baies'], ['floral', 'Floral'], ['green', 'Végétal'], ['herbal', 'Herbacé'], ['spice', 'Épicé'],
  ['earthy', 'Terreux'], ['resin', 'Résineux'],
];
const NOM = Object.fromEntries(FAM);
// Mots anglais des fiches, traduits (D97) ; les doublons de casse se replient.
const TR = {
  'pineapple': 'ananas', 'woody': 'boisé', 'resinous': 'résineux', 'resiny': 'résineux', 'white wine': 'vin blanc',
  'fruity': 'fruité', 'grape': 'raisin', 'gooseberry': 'groseille à maquereau', 'black currant': 'cassis', 'lime': 'citron vert',
  'fresh lime': 'citron vert', 'lemon zest': 'zeste de citron', 'citrus': 'agrumes',
};
const fr = (w) => { const k = w.toLowerCase(); return TR[k] || k; };
const GENERIQUE = new Set(['fruité']);
const hop = (nom) => PACK.fichesHoublons.find((f) => f.name === nom);
const STYLE = BANDES.styles['16D'];
const COUL = { 'Nelson Sauvin': '#2a5bd7', 'Motueka': '#157a86', 'Cascade': '#b03a6e', 'Nugget': '#5a5fcf', 'Citra cryo': '#2367b0' };
const coul = (f) => COUL[f.name] || '#2367b0';

// Idées d'un houblon : un mot français, sa famille (ou null), ses sources, le brut qu'il replie.
function idees(f) {
  const N = f.aromes[0].of;
  const m = new Map();
  const pousser = (mot, famille, source, brut) => {
    const k = mot + '|' + (famille || '');
    if (!m.has(k)) m.set(k, { mot, famille, sources: new Set(), bruts: [] });
    m.get(k).sources.add(source); m.get(k).bruts.push(brut);
  };
  for (const a of f.aromes) for (const s of a.mots) for (const w of s.mots) pousser(fr(w), a.family, s.source, w);
  for (const s of f.motsSansFamille || []) pousser(fr(s.mot), null, s.source, s.mot);
  // un mot sans famille qui existe déjà dans une famille (« resiny » → résineux) se replie dans celle-ci
  for (const [k, x] of [...m]) if (!x.famille) { const j = [...m.values()].find((y) => y.famille && y.mot === x.mot); if (j) { x.sources.forEach((s) => j.sources.add(s)); j.bruts.push(...x.bruts); m.delete(k); } }
  return { N, liste: [...m.values()].map((x) => ({ ...x, sources: [...x.sources], n: x.sources.size, generique: GENERIQUE.has(x.mot) })) };
}
const niveau = (f, fam) => f.aromes.find((a) => a.family === fam);
const alphaPlage = (f) => { const s = f.alpha.sources; const lo = Math.min(...s.map((x) => x.min)), hi = Math.max(...s.map((x) => x.max)); return v(lo) + '–' + v(hi) + ' %'; };
const v = (n) => String(n).replace('.', ',');
const role = (f) => ({ aromatique: 'aromatique', amerisant: 'amérisant', double: 'double usage' })[f.role.value] || f.role.value;
const stock = (f) => (f.stock.grams > 0 ? f.stock.grams + ' g' : 'épuisé');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ----- morceaux communs : le vocabulaire de la baseline, pas un gabarit -----
const ICONE = { // viewBox 24, rendues à 20 px avec un trait de 2,4 : 2 px partout (D83, S4)
  croix: '<path d="M6 6l12 12M18 6L6 18"/>',
  coeur: '<path d="M12 20.5s-7.5-4.6-7.5-10A4 4 0 0 1 12 8a4 4 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z"/>',
  non: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  loupe: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',
};
const icone = (k, label) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-label="${label}">${ICONE[k]}</svg>`;
const picto = (fam, w = 16) => `<svg class="pi" width="${w}" height="${w}" data-famille="${fam}" aria-label="${NOM[fam]}"><use href="#p-${fam}"/></svg>`;

function radar(p, f, { R = 110, zone = true, etiquettes = 'courtes', id, classes = '', ml } = {}) {
  if (ml == null) ml = etiquettes === 'aucune' ? 8 : 64;
  const cx = R + ml, cy = R + (etiquettes === 'aucune' ? 8 : 30), W = 2 * cx, H = 2 * cy;
  const ang = (i) => (-90 + i * 30) * Math.PI / 180;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const pts = (fn) => FAM.map((_, i) => pt(i, fn(i)).map((x) => x.toFixed(1)).join(',')).join(' ');
  let s = `<svg class="${p}-radar ${classes}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" data-radar data-objet="fiche" aria-label="Radar des 12 familles de ${esc(f.name)}" role="img">`;
  s += `<defs><pattern id="${id}-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="#d4d4d4" stroke-width="1.2"/></pattern></defs>`;
  // secteurs inconnus : hachurés, jamais à zéro (D65)
  FAM.forEach(([fam], i) => {
    if (niveau(f, fam).level > 0) return;
    const a = pt(i - 0.5, R), b = pt(i + 0.5, R);
    s += `<path d="M${cx},${cy} L${a[0].toFixed(1)},${a[1].toFixed(1)} A${R},${R} 0 0 1 ${b[0].toFixed(1)},${b[1].toFixed(1)} Z" fill="url(#${id}-h)" stroke="none"/>`;
  });
  s += `<polygon points="${pts(() => R)}" fill="none" stroke="#d9d9d9"/><polygon points="${pts(() => R / 2)}" fill="none" stroke="#e3e3e3"/>`;
  if (zone) s += `<polygon class="${p}-zone" data-role="zone" points="${pts((i) => (STYLE.families[FAM[i][0]].band[1] / 100) * R)}" fill="#111" fill-opacity=".07" stroke="#9a9a9a" stroke-dasharray="3 3" aria-label="zone du style 16D"/>`;
  FAM.forEach(([fam], i) => { const [x, y] = pt(i, R); s += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${niveau(f, fam).level ? JETONS[fam].base : '#e6e6e6'}" stroke-width="${niveau(f, fam).level ? 1.6 : 1}"/>`; });
  const forme = pts((i) => { const l = niveau(f, FAM[i][0]).level; return l === 2 ? R : l === 1 ? R / 2 : 4; });
  s += `<polygon points="${forme}" fill="#111" fill-opacity=".12" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`;
  FAM.forEach(([fam, nom], i) => {
    const a = niveau(f, fam); const l = a.level; const [x, y] = pt(i, l === 2 ? R : l === 1 ? R / 2 : 4);
    if (l) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${l === 2 ? '#111' : '#fff'}" stroke="#111" stroke-width="2"/>`;
    const [lx, ly] = pt(i, R + 16); const anc = Math.abs(Math.cos(ang(i))) < 0.2 ? 'middle' : Math.cos(ang(i)) > 0 ? 'start' : 'end';
    const txt = etiquettes === 'aucune' ? '' : l ? `${nom} ${a.sources}/${a.of}` : `${nom}?`;
    if (txt) s += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anc}" font-size="11" font-weight="${l ? 600 : 400}" fill="${l ? JETONS[fam].texte : '#6b6b6b'}" data-famille="${fam}">${txt}</text>`;
  });
  return s + '</svg>';
}

function ficheCourte(p, f) {
  const i = idees(f); const decrites = f.aromes.filter((a) => a.level);
  return `<section class="${p}-fc" data-role="fiche" data-fiche-de="${esc(f.name)}" role="dialog" aria-label="Fiche courte de ${esc(f.name)}" hidden>
<header><h2>${esc(f.name)}</h2><span class="${p}-us" data-role="usage">${role(f)}</span><button type="button" class="${p}-x" data-role="fermer-fiche" aria-label="Fermer la fiche">${icone('croix', 'fermer')}</button></header>
<p data-role="fiche-alpha"><b>α ${alphaPlage(f)}</b> <span>${f.alpha.sources.map((s) => s.source + ' ' + v(s.min) + '–' + v(s.max) + ' % (' + s.annee + ')').join(' · ')}</span></p>
<p data-role="fiche-arome">${decrites.map((a) => `<span style="color:${JETONS[a.family].texte}" data-famille="${a.family}">${NOM[a.family]} ${a.sources}/${a.of}</span>`).join(' · ')}${i.liste.filter((x) => !x.famille).length ? ` · ${i.liste.filter((x) => !x.famille).length} mot${i.liste.filter((x) => !x.famille).length > 1 ? 's' : ''} hors famille` : ''}</p>
${radar(p, f, { R: 44, zone: false, etiquettes: 'aucune', id: p + 'fc' + f.name.replace(/\W/g, ''), classes: p + '-mini' })}
<div class="${p}-gout" data-role="gout"><button type="button" aria-pressed="false">${icone('coeur', 'j’aime')} j’aime</button><button type="button" aria-pressed="false">${icone('non', 'pas pour moi')} pas pour moi</button></div>
</section>`;
}
const legende = (p, extra = '') => `<button type="button" class="${p}-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="${p}-leg" aria-label="légende">?</button>
<div class="${p}-leg" id="${p}-leg" data-role="legende" hidden>${FAM.map(([fam, nom]) => `<span>${picto(fam, 14)} ${nom}</span>`).join('')}<p>n/N : nombre de fiches qui citent le mot sur celles lues. Hachures : famille jamais décrite, pas absente. Zone grise : ce qu’une 16D attend (BJCP). ~ : hypothèse, pas une fiche.${extra}</p></div>`;
const lentille = (p) => `<div class="${p}-lent" role="radiogroup" aria-label="échelle"><button type="button" role="radio" data-e="style" aria-checked="true">au style · 16D</button><button type="button" role="radio" data-e="absolu" aria-checked="false">absolu</button></div>`;
const dock = (p) => `<footer class="${p}-dock"><div class="${p}-gout" data-role="gout"><button type="button" aria-pressed="false" aria-label="j’aime">${icone('coeur', 'j’aime')}</button><button type="button" aria-pressed="false" aria-label="pas pour moi">${icone('non', 'pas pour moi')}</button></div><button type="button" class="${p}-cmp">Comparer</button></footer>`;
const appBar = (p) => `<div class="${p}-app" aria-hidden="true"><span>‹ Houblons 3/7</span><span>IBU 60 · OG 1,066 · EBC 70</span></div>`;
const partAutres = (p, f, n, N) => `<div class="${p}-part" data-role="autres" data-houblon="${esc(f.name)}" data-part="${String(Math.round((100 * n) / N) / 100).replace('.', ',')}" aria-label="part hors des familles : ${n} idées sur ${N}"><i style="width:${Math.round((100 * n) / N)}%"></i><span>hors des familles : ${n} idées sur ${N}</span></div>`;
const CSS_PART = (p) => `.${p}-part{position:relative;height:26px;background:#dedede;border-radius:4px;overflow:hidden;margin-top:8px}.${p}-part i{position:absolute;left:0;top:0;bottom:0;background:#9a9a9a}.${p}-part span{position:relative;display:block;line-height:26px;padding:0 8px;font-size:12px;font-weight:600;color:#111}`;
const croix = (p) => `<button type="button" class="${p}-ferme" aria-label="Fermer">${icone('croix', 'fermer')}</button>`;

const CSS_COMMUN = (p) => `
*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111;font-family:system-ui,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.3;-webkit-text-size-adjust:100%}
:root{--acc:#D6453D;--g1:#e6e6e6;--g2:#dedede;--t2:#5b5b5b}
.${p}-app{height:44px;background:#e9e9e9;color:#5b5b5b;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-size:12px;font-weight:600}
.${p}-feuille{background:#fff;border-radius:24px 24px 0 0;margin-top:-10px;padding:8px 14px 84px;min-height:810px;position:relative}
.${p}-feuille:before{content:"";display:block;width:40px;height:4px;border-radius:2px;background:#d0d0d0;margin:0 auto 8px}
.${p}-ferme{position:absolute;right:8px;top:12px;width:44px;height:44px;border:0;background:var(--g1);border-radius:50%;display:grid;place-items:center;color:#111}
.${p}-us{display:inline-block;border:1px solid #cfcfcf;border-radius:999px;padding:2px 9px;font-size:12px;color:#111;white-space:nowrap}
.${p}-stk{display:inline-block;background:var(--g2);border-radius:999px;padding:2px 7px;font-size:12px;color:#5b5b5b}
.${p}-lent{display:inline-flex;background:var(--g2);border-radius:999px;padding:2px}.${p}-lent button{border:0;background:transparent;border-radius:999px;padding:3px 9px;font-size:12px;color:#5b5b5b}.${p}-lent button[aria-checked="true"]{background:#fff;color:#111;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.${p}-aide{width:28px;height:28px;border-radius:50%;border:1px solid #cfcfcf;background:#fff;color:#5b5b5b;font-size:13px;font-weight:600;padding:0}
.${p}-leg{position:absolute;left:14px;right:14px;top:60px;z-index:5;background:#fff;border:1px solid #d9d9d9;border-radius:8px;padding:10px 12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 8px;font-size:12px;box-shadow:0 6px 20px rgba(0,0,0,.15)}.${p}-leg[hidden]{display:none}.${p}-leg span{display:flex;align-items:center;gap:5px}.${p}-leg p{grid-column:1/-1;margin:6px 0 0;color:#5b5b5b}
.${p}-dock{position:fixed;left:0;right:0;bottom:0;height:64px;background:#fff;border-top:1px solid #e3e3e3;display:flex;align-items:center;justify-content:space-between;padding:0 14px;z-index:4}
.${p}-gout{display:inline-flex;gap:6px;background:var(--g1);border-radius:999px;padding:4px}.${p}-gout button{border:0;background:transparent;border-radius:999px;height:36px;min-width:40px;display:inline-flex;align-items:center;gap:6px;padding:0 10px;font-size:13px;color:#111}
.${p}-cmp{border:1px solid #cfcfcf;background:#fff;border-radius:999px;padding:9px 18px;font-size:14px;font-weight:600;color:#111}
.${p}-voile{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:8}.${p}-voile[hidden]{display:none}
.${p}-fc{position:fixed;left:12px;right:12px;bottom:76px;z-index:9;background:#fff;border-radius:24px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.25)}.${p}-fc[hidden]{display:none}
.${p}-fc header{display:flex;align-items:center;gap:8px}.${p}-fc h2{margin:0;font-size:18px;flex:1}.${p}-fc p{margin:6px 0;font-size:13px}.${p}-fc p span{color:#5b5b5b}
.${p}-x{width:44px;height:44px;border:0;background:var(--g1);border-radius:50%;display:grid;place-items:center;color:#111}
.${p}-mini{float:right;margin:0 0 4px 8px}
.pi{display:inline-block;vertical-align:-3px;flex:none}
[data-houblon]{touch-action:none;-webkit-user-select:none;user-select:none}
`;

const JS_COMMUN = (p) => `(function(){
var FIS=document.querySelectorAll('[data-role="fiche"]'),VO=document.querySelector('.${p}-voile'),APPUI=null,SURVOL=null;
var OUV=0;function ouvrir(nom){fermer();var f=document.querySelector('[data-role="fiche"][data-fiche-de="'+nom+'"]')||FIS[0];f.hidden=false;VO.hidden=false;OUV=Date.now()}function fermer(){FIS.forEach(function(f){f.hidden=true});VO.hidden=true}
document.addEventListener('pointerdown',function(e){var h=e.target.closest('[data-houblon]');if(!h||e.target.closest('[data-role="fiche"]'))return;var nom=h.dataset.houblon;APPUI={x:e.clientX,y:e.clientY,t:setTimeout(function(){APPUI=null;ouvrir(nom)},500)}},true);
function annuler(e){if(APPUI&&(e.type!=='pointermove'||Math.hypot(e.clientX-APPUI.x,e.clientY-APPUI.y)>8)){clearTimeout(APPUI.t);APPUI=null}}
document.addEventListener('pointerup',annuler,true);document.addEventListener('pointercancel',annuler,true);document.addEventListener('pointermove',annuler,true);
document.addEventListener('contextmenu',function(e){if(e.target.closest('[data-houblon]'))e.preventDefault()});
document.addEventListener('pointerover',function(e){if(e.pointerType!=='mouse'||innerWidth<700)return;var h=e.target.closest('[data-houblon]');if(!h){if(SURVOL){clearTimeout(SURVOL);SURVOL=null}return}if(SURVOL)return;var nom=h.dataset.houblon;SURVOL=setTimeout(function(){SURVOL=null;ouvrir(nom)},700)});
document.addEventListener('pointerout',function(e){if(e.pointerType!=='mouse')return;var h=e.target.closest('[data-houblon]');if(h&&SURVOL&&!(e.relatedTarget&&h.contains(e.relatedTarget))){clearTimeout(SURVOL);SURVOL=null}});
document.querySelectorAll('[data-role="fermer-fiche"]').forEach(function(b){b.addEventListener('click',function(){if(Date.now()-OUV<600)return;fermer()})});
var LB=document.querySelector('[data-role="legende-bouton"]'),LG=document.querySelector('[data-role="legende"]');
LB.addEventListener('click',function(){var o=LG.hidden;LG.hidden=!o;LB.setAttribute('aria-expanded',String(o))});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){fermer();LG.hidden=true;LB.setAttribute('aria-expanded','false')}});
document.querySelectorAll('[data-e]').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('[data-e]').forEach(function(x){x.setAttribute('aria-checked',String(x===b))});var z=document.querySelectorAll('[data-role="zone"]');z.forEach(function(e){e.style.display=b.dataset.e==='style'?'':'none'});document.body.dataset.e=b.dataset.e})});
document.querySelectorAll('[aria-pressed]').forEach(function(b){b.addEventListener('click',function(){b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'))})});
})();`;

const page = (p, titre, css, corps, js = '') => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titre)}</title><style>${CSS_COMMUN(p)}${css}</style></head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">${SYMBOLES}</svg>
${corps}<div class="${p}-voile" data-role="fermer-fiche" hidden></div>
<script>${JS_COMMUN(p)}${js}</script></body></html>`;

const enTete = (p, f, { forme = 'A' } = {}) => forme === 'B'
  ? `<div class="${p}-ent ${p}-ent-b"><h1 class="${p}-nom" data-houblon="${esc(f.name)}" data-couleur="${coul(f)}">${esc(f.name)}</h1><b class="${p}-al">α ${alphaPlage(f)}</b>${croix(p)}</div>
<div class="${p}-ligne"><span class="${p}-lot">lot ${v(f.alpha.retenu.value)} %</span><span class="${p}-us" data-role="usage">${role(f)}</span><span class="${p}-stk">${stock(f)}</span>${lentille(p)}</div>`
  : `<div class="${p}-ent"><h1 class="${p}-nom" data-houblon="${esc(f.name)}" data-couleur="${coul(f)}">${esc(f.name)}</h1>${croix(p)}</div>
<div class="${p}-ligne"><b class="${p}-al">α ${alphaPlage(f)}</b><span class="${p}-lot">lot ${v(f.alpha.retenu.value)} %</span><span class="${p}-us" data-role="usage">${role(f)}</span><span class="${p}-stk">${stock(f)}</span>${forme === 'C' ? '' : lentille(p)}</div>`;

const CSS_ENT = (p) => `.${p}-ent{display:flex;align-items:center;gap:10px;min-height:44px;padding-right:48px}.${p}-nom{margin:0;font-size:22px;font-weight:700;flex:1}.${p}-ent .${p}-al{margin-right:8px;white-space:nowrap}.${p}-ent-b{padding-right:104px}
.${p}-ligne{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 8px}.${p}-al{font-size:18px}.${p}-lot{color:#5b5b5b;font-size:12px}`;

const ecrire = (id, html) => { fs.mkdirSync(path.join(LOT, id), { recursive: true }); fs.writeFileSync(path.join(LOT, id, 'etat.html'), html); console.log('écrit', id); };
const motsN = (x, N) => `<sup>${x.n}/${N}</sup>`;

// ===================== flz1 — Hors du dessin (Nelson Sauvin) =====================
{
  const p = 'flz1', f = hop('Nelson Sauvin'), I = idees(f);
  const dessines = I.liste.filter((x) => x.famille), hors = I.liste.filter((x) => !x.famille);
  const css = CSS_ENT(p) + `
.${p}-haut{display:grid;grid-template-columns:256px 1fr;gap:4px;align-items:start}
.${p}-dess{border-left:3px solid #111;padding:4px 0 4px 8px;margin-top:36px}.${p}-dess b{display:block;font-size:12px;color:#5b5b5b;margin-bottom:6px}.${p}-dess div{display:flex;align-items:center;gap:4px;margin:6px 0;font-size:13px;white-space:nowrap}
.${p}-hd{margin-top:10px;background:var(--h);color:#fff;border-radius:8px;padding:14px 12px 12px;position:relative}
.${p}-hd:before{content:"hors du dessin";position:absolute;top:-10px;left:12px;background:#fff;border:2px solid var(--h);border-radius:999px;padding:1px 8px;font-size:12px;font-weight:700;letter-spacing:.02em;color:var(--h)}
.${p}-hd p{margin:0 0 8px;font-size:12px;color:#fff}
.${p}-mots{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline}.${p}-mots span{font-size:30px;font-weight:700;letter-spacing:-.015em;line-height:1.1;color:#fff}.${p}-mots span sup{font-size:12px;font-weight:600;color:#fff;margin-left:3px}
.${p}-mots span.g{font-size:14px;font-weight:400;color:#fff}
.${p}-src{margin:12px 0 0;font-size:12px;color:#fff}
${CSS_PART(p)}
.${p}-compte{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0 0;font-size:12px}.${p}-compte div{background:var(--g1);border-radius:8px;padding:12px 8px 10px;color:#5b5b5b;min-height:96px}.${p}-compte b{font-size:30px;display:block;line-height:1;color:#111;margin-bottom:6px}
.${p}-aide{position:absolute;right:60px;top:20px}`;
  const corps = `${appBar(p)}<main class="${p}-feuille" role="dialog" aria-label="Fiche de ${esc(f.name)}" style="--h:${coul(f)}">${enTete(p, f)}${legende(p)}
<div class="${p}-haut">${radar(p, f, { R: 62, id: p, ml: 66 })}
<aside class="${p}-dess"><b>ce que le radar dessine</b>${dessines.map((x) => `<div>${picto(x.famille)}<span style="color:${JETONS[x.famille].texte}" data-famille="${x.famille}">${x.mot}</span>${motsN(x, I.N)}</div>`).join('')}<div style="color:#5b5b5b">10 familles ?</div></aside></div>
<section class="${p}-hd"><p>${hors.length} idées sur ${I.liste.length}, dans aucune des 12 familles : le radar ne peut pas les montrer</p>
<div class="${p}-mots">${hors.filter((x) => !x.generique).sort((a, b) => b.n - a.n).map((x) => `<span>${x.mot}${motsN(x, I.N)}</span>`).join('')}${hors.filter((x) => x.generique).map((x) => `<span class="g">${x.mot} · mot générique${motsN(x, I.N)}</span>`).join('')}</div>
<p class="${p}-src">dits par Beer Maverick (2023) et Hopsteiner (2025), traduits de l’anglais</p></section>
${partAutres(p, f, hors.length, I.liste.length)}
<div class="${p}-compte"><div><b>${I.N}</b>fiches lues</div><div><b>${I.liste.length}</b>idées</div><div><b>${hors.length}</b>hors des familles</div><div><b>${f.aromes.filter((a) => !a.level).length}</b>familles jamais décrites</div></div>
${dock(p)}${ficheCourte(p, f)}</main>`;
  ecrire(p, page(p, 'flz1 — Hors du dessin', css, corps));
}

// ===================== flz2 — Le radar des mots (Nelson Sauvin) =====================
{
  const p = 'flz2', f = hop('Nelson Sauvin'), I = idees(f);
  const axes = I.liste.filter((x) => !x.generique).sort((a, b) => b.n - a.n || (a.famille ? 1 : 0) - (b.famille ? 1 : 0));
  const R = 100, cx = 181, cy = R + 44, W = 362, H = cy + R + 64;
  const n = axes.length; const ang = (i) => (-90 + i * 360 / n) * Math.PI / 180; const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const poly = (fn) => axes.map((_, i) => pt(i, fn(i)).map((q) => q.toFixed(1)).join(',')).join(' ');
  let rm = `<svg class="${p}-rm" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Radar des ${n} mots de Nelson Sauvin">`;
  rm += `<polygon points="${poly(() => R)}" fill="none" stroke="#d9d9d9"/><polygon points="${poly(() => R / 2)}" fill="none" stroke="#e6e6e6"/>`;
  axes.forEach((x, i) => { const [a, b] = pt(i, R); rm += `<line x1="${cx}" y1="${cy}" x2="${a.toFixed(1)}" y2="${b.toFixed(1)}" stroke="${x.famille ? JETONS[x.famille].base : '#bdbdbd'}" stroke-width="1.6"/>`; });
  rm += `<polygon points="${poly((i) => R * axes[i].n / I.N)}" fill="${coul(f)}" fill-opacity=".45" stroke="${coul(f)}" stroke-width="3.5" stroke-linejoin="round"/>`;
  axes.forEach((x, i) => { const [a, b] = pt(i, R * x.n / I.N); rm += `<circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="4.5" fill="${x.n === I.N ? coul(f) : '#fff'}" stroke="${coul(f)}" stroke-width="2"/>`;
    const [lx, ly] = pt(i, R + 12); const c = Math.cos(ang(i)), sn = Math.sin(ang(i)); const anc = Math.abs(c) < 0.25 ? 'middle' : c > 0 ? 'start' : 'end';
    const lignes = x.mot.length > 12 ? [x.mot.slice(0, x.mot.lastIndexOf(' ')), x.mot.slice(x.mot.lastIndexOf(' ') + 1)] : [x.mot];
    const haut = sn < -0.3; // au-dessus du sommet : tout s'empile vers le haut
    let y0 = haut ? ly - 14 * (lignes.length) - 2 : sn > 0.3 ? ly + 10 : ly - 7 * (lignes.length - 1);
    rm += lignes.map((l, k) => `<text x="${lx.toFixed(1)}" y="${(y0 + 14 * k).toFixed(1)}" text-anchor="${anc}" font-size="13" font-weight="700" fill="${x.famille ? JETONS[x.famille].texte : '#111'}"${x.famille ? ` data-famille="${x.famille}"` : ''}>${l}</text>`).join('');
    rm += `<text x="${lx.toFixed(1)}" y="${(y0 + 14 * lignes.length).toFixed(1)}" text-anchor="${anc}" font-size="11" fill="#5b5b5b">${x.n}/${I.N} fiches</text>`; });
  rm += '</svg>';
  const css = CSS_ENT(p) + `
.${p}-deux{display:grid;grid-template-columns:104px 1fr;gap:6px;align-items:center}
.${p}-deux p{margin:0;font-size:13px;color:#5b5b5b}.${p}-deux p b{color:#111;font-size:14px;display:block}
.${p}-titre{display:flex;align-items:baseline;justify-content:space-between;border-top:1px solid #e3e3e3;margin-top:4px;padding-top:6px}.${p}-titre h2{margin:0;font-size:14px}.${p}-titre span{font-size:12px;color:#5b5b5b}
${CSS_PART(p)}
.${p}-lu{margin:4px 0 0;padding:8px 10px;background:var(--g1);border-left:4px solid var(--h);font-size:14px}.${p}-lu b{color:var(--h)}
.${p}-part{margin:6px 0 8px}
.${p}-cle{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#5b5b5b;margin:0}.${p}-cle i{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--h);vertical-align:-1px;margin-right:4px}.${p}-cle i.c{background:#fff;border:2px solid var(--h)}
.${p}-aide{position:absolute;right:60px;top:20px}`;
  const corps = `${appBar(p)}<main class="${p}-feuille" role="dialog" aria-label="Fiche de ${esc(f.name)}" style="--h:${coul(f)}">${enTete(p, f)}${legende(p)}
<div class="${p}-deux">${radar(p, f, { R: 44, id: p, etiquettes: 'aucune' })}<p><b>Le radar des 12 familles n’en voit que 2</b>${picto('citrus', 14)} Agrumes 1/2, ${picto('spice', 14)} Épicé 1/2 ; 10 familles jamais décrites. Ses ${I.liste.length} idées tiennent presque toutes hors de ce dessin.</p></div>
<div class="${p}-titre"><h2>Le même houblon, dessiné avec ses mots</h2><span>${n} axes · ${I.N} fiches</span></div>
${rm}
<p class="${p}-lu"><b>Lu d’un coup :</b> vin blanc, groseille à maquereau, raisin, dits par les deux fiches ; sauvignon blanc, agrumes, épicé par une seule.</p>${partAutres(p, f, I.liste.filter((x) => !x.famille).length, I.liste.length)}
<p class="${p}-cle"><span><i></i>dit par les 2 fiches</span><span><i class="c"></i>dit par une fiche</span><span>couleur : la famille, quand il y en a une</span><span>fruité, générique, non dessiné · Beer Maverick 2023, Hopsteiner 2025</span></p>
${dock(p)}${ficheCourte(p, f)}</main>`;
  ecrire(p, page(p, 'flz2 — Le radar des mots', css, corps.replace(enTete(p, f), enTete(p, f, { forme: 'B' }))));
}

// ===================== flz3 — À toi de ranger (Nelson Sauvin) =====================
{
  const p = 'flz3', f = hop('Nelson Sauvin'), I = idees(f);
  const hors = I.liste.filter((x) => !x.famille && !x.generique);
  const css = CSS_ENT(p) + `
.${p}-rad{display:flex;justify-content:center;margin:-6px 0 0}
.${p}-tete{display:flex;align-items:baseline;justify-content:space-between;background:var(--g1);border-radius:8px 8px 0 0;padding:8px 12px 6px}.${p}-tete h2{margin:0;font-size:14px}.${p}-tete .${p}-lent button{white-space:nowrap}
.${p}-bac{background:var(--g1);border-radius:0 0 8px 8px;padding:0 10px 10px;display:flex;flex-wrap:wrap;gap:8px}
.${p}-chip{border:1.5px solid var(--h);background:#fff;border-radius:999px;padding:7px 13px;font-size:15px;font-weight:600;color:var(--h);display:inline-flex;align-items:center;gap:6px}.${p}-chip sup{font-size:11px;color:#5b5b5b;font-weight:600}
.${p}-chip[aria-pressed="true"]{background:var(--h);color:#fff}.${p}-chip[aria-pressed="true"] sup{color:#fff}
.${p}-chip.ok{border-style:dashed}.${p}-chip.ok em{font-style:normal;font-size:12px;font-weight:600}
.${p}-cibles{margin:8px 0 0;background:#111;border-radius:8px;padding:8px 10px 10px}.${p}-cibles[hidden]{display:none}.${p}-cibles p{margin:0 0 6px;font-size:12px;color:#fff}.${p}-cibles p b{color:#fff;text-decoration:underline}
.${p}-grille{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}.${p}-grille button{border:0;background:#fff;border-radius:8px;padding:5px 2px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;color:#111}
.${p}-fait{margin:8px 0 0;font-size:12px;color:#5b5b5b}.${p}-fait b{color:#111}
.${p}-aide{position:absolute;right:60px;top:20px}`;
  const chips = hors.sort((a, b) => b.n - a.n).map((x, i) => `<button type="button" class="${p}-chip" data-mot="${esc(x.mot)}" aria-pressed="${i === 0}">${x.mot}<sup>${x.n}/${I.N}</sup></button>`).join('');
  const corps = `${appBar(p)}<main class="${p}-feuille" role="dialog" aria-label="Fiche de ${esc(f.name)}" style="--h:${coul(f)}">${enTete(p, f)}${legende(p, ' Pointillé : ta hypothèse, à toi de la défaire.')}
<div class="${p}-rad">${radar(p, f, { R: 108, id: p })}</div>
<div class="${p}-tete"><h2>${hors.length} mots sans famille · range-les</h2>${lentille(p)}</div>
<div class="${p}-bac" id="${p}-bac" data-role="autres" data-houblon="${esc(f.name)}" aria-label="mots sans famille">${chips}</div>
<div class="${p}-cibles" id="${p}-cibles"><p>pose <b id="${p}-enmain">${hors[0].mot}</b> sur une famille, ou laisse-le dehors</p><div class="${p}-grille">${FAM.map(([fam, nom]) => `<button type="button" data-cible="${fam}">${picto(fam, 20)}${nom}</button>`).join('')}</div></div>
<p class="${p}-fait" id="${p}-fait">rangé par toi : rien encore · le radar reste celui des fiches</p>
<p class="${p}-fait">déjà rangés par Hopsteiner : agrumes, épicé · fruité, mot générique, pas à ranger · 2 fiches lues (Beer Maverick 2023, Hopsteiner 2025)</p>
${dock(p)}${ficheCourte(p, f)}</main>`;
  const js = `(function(){var P='${p}';var enMain='${esc(hors[0].mot)}';var FAIT={};
document.querySelectorAll('.'+P+'-chip').forEach(function(c){c.addEventListener('click',function(){enMain=c.dataset.mot;document.querySelectorAll('.'+P+'-chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===c))});document.getElementById(P+'-enmain').textContent=enMain;document.getElementById(P+'-cibles').hidden=false})});
window.ranger=function(mot,fam){var NOM=${JSON.stringify(NOM)},TX=${JSON.stringify(Object.fromEntries(FAM.map(([k]) => [k, JETONS[k].texte])))};FAIT[mot]=fam;var c=document.querySelector('.'+P+'-chip[data-mot="'+mot+'"]');c.classList.add('ok');c.setAttribute('aria-pressed','false');c.style.borderColor=TX[fam];c.style.color=TX[fam];c.setAttribute('data-famille',fam);c.innerHTML=c.innerHTML.replace(/<em>.*<\\/em>/,'')+' <em>→ '+NOM[fam]+' ~</em>';
var r=document.querySelector('.'+P+'-radar');var i=${JSON.stringify(FAM.map(([k]) => k))}.indexOf(fam);var cx=108+64,cy=108+30,a=(-90+i*30)*Math.PI/180;var x=cx+Math.cos(a)*54,y=cy+Math.sin(a)*54;
var g=r.querySelector('[data-hyp="'+fam+'"]');if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('data-hyp',fam);r.appendChild(g)}
g.innerHTML='<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="'+TX[fam]+'" stroke-width="3" stroke-dasharray="4 3"/><circle cx="'+x+'" cy="'+y+'" r="5" fill="#fff" stroke="'+TX[fam]+'" stroke-width="2" stroke-dasharray="2 2"/><text x="'+(x+(Math.cos(a)>0?8:-8))+'" y="'+(y+4)+'" font-size="11" font-weight="700" text-anchor="'+(Math.cos(a)>0?'start':'end')+'" fill="'+TX[fam]+'">~ toi</text>';
var n=Object.keys(FAIT).length;document.getElementById(P+'-fait').innerHTML='rangé par toi : <b>'+n+'</b> sur ${hors.length} · en pointillé sur le radar, « ~ » : ton hypothèse, pas une fiche';document.getElementById(P+'-cibles').hidden=true};
document.querySelectorAll('[data-cible]').forEach(function(b){b.addEventListener('click',function(){ranger(enMain,b.dataset.cible)})});})();`;
  ecrire(p, page(p, 'flz3 — À toi de ranger', css, corps.replace(enTete(p, f), enTete(p, f, { forme: 'C' })), js));
}

// ===================== flz4 — Par ses cousins (Cascade) =====================
{
  const p = 'flz4', f = hop('Cascade'), I = idees(f);
  // index : mot → houblons du pack qui le disent
  const idx = {};
  for (const g of PACK.fichesHoublons) for (const x of idees(g).liste) (idx[x.mot] = idx[x.mot] || new Set()).add(g.name);
  const cousins = (mot) => [...(idx[mot] || [])].filter((n) => n !== f.name).sort();
  const lignes = I.liste.sort((a, b) => cousins(a.mot).length - cousins(b.mot).length).map((x) => {
    const c = cousins(x.mot); const rare = c.length <= 3;
    const col = x.famille ? JETONS[x.famille].texte : '#111';
    return `<li class="${rare ? 'rare' : ''}"><div class="${p}-mot">${x.famille ? picto(x.famille) : '<i class="' + p + '-sans">?</i>'}<b style="color:${col}"${x.famille ? ` data-famille="${x.famille}"` : ''}>${x.mot}</b><sup>${x.n}/${I.N}</sup>${rare ? `<em>rare · ${c.length + 1} sur ${PACK.fichesHoublons.length}</em>` : `<em>${c.length + 1} houblons sur ${PACK.fichesHoublons.length}</em>`}</div>
<div class="${p}-cous">${rare ? (c.length ? 'aussi ' + c.map((n) => `<span data-houblon="${esc(n)}">${esc(n)}</span>`).join('') : '<span class="seul">lui seul, dans le pack</span>') : 'courant : ' + c.slice(0, 4).map((n) => `<span data-houblon="${esc(n)}">${esc(n)}</span>`).join('') + (c.length > 4 ? `<span class="plus">+${c.length - 4}</span>` : '')}</div></li>`;
  }).join('');
  const css = CSS_ENT(p) + `
.${p}-haut{display:grid;grid-template-columns:1fr 152px;gap:4px;align-items:center}.${p}-haut p{margin:0;font-size:13px;color:#5b5b5b}.${p}-haut p b{display:block;color:#111;font-size:14px}
.${p}-liste{list-style:none;margin:6px 0 0;padding:0}.${p}-liste li{padding:6px 0;border-top:1px solid #ededed}
.${p}-liste li.rare{background:color-mix(in srgb, var(--h) 18%, #fff);margin:0 -6px;padding:6px 6px;border-radius:4px}
.${p}-mot{display:flex;align-items:center;gap:6px}.${p}-mot b{font-size:15px}.${p}-mot sup{font-size:11px;color:#5b5b5b;font-weight:600}.${p}-mot em{margin-left:auto;font-style:normal;font-size:12px;color:#5b5b5b}.rare .${p}-mot em{color:#111;font-weight:700}
.${p}-sans{display:inline-grid;place-items:center;width:16px;height:16px;border:1.5px dashed #9a9a9a;border-radius:50%;font-size:10px;font-style:normal;color:#5b5b5b}
.${p}-cous{margin:3px 0 0 22px;font-size:12px;color:#5b5b5b;display:flex;flex-wrap:wrap;gap:4px;align-items:center}.${p}-cous span{border:1px solid #cfcfcf;border-radius:999px;padding:1px 8px;color:#111;font-weight:600}.${p}-cous .seul{border-style:dashed;color:#5b5b5b;font-weight:400}.${p}-cous .plus{border:0;padding:0;color:#5b5b5b;font-weight:400}
.${p}-aide{position:absolute;right:60px;top:20px}`;
  const corps = `${appBar(p)}<main class="${p}-feuille" role="dialog" aria-label="Fiche de ${esc(f.name)}" style="--h:${coul(f)}">${enTete(p, f)}${legende(p, ' Pastille : un houblon du pack qui dit le même mot ; appui long : sa fiche.')}
<div class="${p}-haut"><p><b>Ses mots, par ses cousins</b>chaque mot avec les houblons du pack qui le disent aussi : ce qui est rare le distingue, ce qui est courant le situe.</p>${radar(p, f, { R: 68, id: p, etiquettes: 'aucune' })}</div>
<ul class="${p}-liste">${lignes}</ul>
${dock(p)}${ficheCourte(p, f)}${[...new Set(I.liste.flatMap((x) => cousins(x.mot)))].map((n) => ficheCourte(p, hop(n))).join('')}</main>`;
  ecrire(p, page(p, 'flz4 — Par ses cousins', css, corps.replace(enTete(p, f), enTete(p, f, { forme: 'B' }))));
}

// ===================== flz5 — Dans ta stout (Nugget, 16D) =====================
{
  const p = 'flz5', f = hop('Nugget'), I = idees(f);
  const st = (fam) => STYLE.families[fam].status;
  const place = I.liste.filter((x) => x.famille && st(x.famille) === 'attendue');
  const ressort = I.liste.filter((x) => x.famille && st(x.famille) !== 'attendue');
  const sans = I.liste.filter((x) => !x.famille);
  const mot = (x) => `<span class="${p}-m"${x.famille ? ` data-famille="${x.famille}" style="color:${JETONS[x.famille].texte}"` : ''}>${x.famille ? picto(x.famille, 14) : ''}${x.mot}<sup>${x.n}/${I.N}</sup></span>`;
  const css = CSS_ENT(p) + `
.${p}-rad{display:flex;justify-content:center;margin:-4px 0 2px}
.${p}-barre{display:flex;align-items:center;gap:10px;background:var(--g2);border-radius:999px;padding:4px 12px 4px 4px;font-size:12px;color:#5b5b5b}.${p}-barre .${p}-lent{background:#fff}.${p}-barre .${p}-lent button{font-size:13px;padding:6px 12px}.${p}-barre .${p}-lent button[aria-checked="true"]{background:#111;color:#fff}
.${p}-et{border-radius:8px;padding:8px 10px;margin-top:6px}.${p}-et h2{margin:0 0 4px;font-size:14px;display:flex;justify-content:space-between;align-items:baseline}.${p}-et h2 span{font-size:12px;font-weight:400;color:#5b5b5b}
.${p}-place{background:#111;color:#fff}.${p}-place h2 span{color:#d0d0d0}.${p}-place .${p}-m{background:#fff;}
.${p}-res{background:var(--g1)}.${p}-res .${p}-m{background:#fff;border:1px solid #d9d9d9}
.${p}-sans{border:1.5px dashed #9a9a9a}.${p}-sans .${p}-m{border:1px dashed #9a9a9a;color:#111}
.${p}-mots{display:flex;flex-wrap:wrap;gap:6px}.${p}-m{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:4px 10px;font-size:14px;font-weight:600}.${p}-m sup{font-size:10px;color:#5b5b5b;font-weight:600}
body[data-e="absolu"] .${p}-place{background:var(--g1);color:#111}body[data-e="absolu"] .${p}-place h2 span{color:#5b5b5b}body[data-e="absolu"] .${p}-cite{display:none}
.${p}-cite{font-size:12px;color:#5b5b5b;margin:6px 0 0}.${p}-place .${p}-cite{color:#d0d0d0}
.${p}-aide{position:absolute;right:60px;top:20px}`;
  const corps = `${appBar(p)}<main class="${p}-feuille" role="dialog" aria-label="Fiche de ${esc(f.name)}" style="--h:${coul(f)}">${enTete(p, f)}${legende(p)}
<div class="${p}-rad">${radar(p, f, { R: 80, id: p })}</div>
<div class="${p}-barre">${lentille(p)}<span>lis ses mots face à ta stout, ou en absolu</span></div>
<section class="${p}-et ${p}-place"><h2>À sa place dans ta 16D <span>le style les nomme</span></h2><div class="${p}-mots">${place.map(mot).join('')}</div><p class="${p}-cite">BJCP 2021 : « Low earthy, herbal, or floral hop aroma optional »</p></section>
<section class="${p}-et ${p}-res"><h2>Ressort dans ta 16D <span>le style n’en parle pas</span></h2><div class="${p}-mots">${ressort.map(mot).join('')}</div></section>
<section class="${p}-et ${p}-sans"><h2>Sans famille <span>ni dedans ni dehors</span></h2><div class="${p}-mots">${sans.map(mot).join('')}</div></section>
${dock(p)}${ficheCourte(p, f)}</main>`;
  ecrire(p, page(p, 'flz5 — Dans ta stout', css, corps.replace(enTete(p, f), enTete(p, f, { forme: 'C' }))));
}

// ===================== flz6 — La loupe sur l’axe (Motueka) =====================
{
  const p = 'flz6', f = hop('Motueka'), I = idees(f);
  const parFam = Object.fromEntries(FAM.map(([k]) => [k, I.liste.filter((x) => x.famille === k)]));
  const hors = I.liste.filter((x) => !x.famille);
  const R = 128, cx = R + 53, cy = R + 30;
  const css = CSS_ENT(p) + `
.${p}-scene{position:relative;margin:0 auto;width:${2 * cx}px}
.${p}-bas{margin:6px 0 0;font-size:12px;color:#5b5b5b}
.${p}-ruban{display:grid;grid-template-columns:repeat(12,1fr);gap:2px;margin-top:8px;background:var(--g1);border-radius:8px;padding:6px 4px}.${p}-ruban button{border:0;background:transparent;padding:2px 0;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;color:#111}.${p}-ruban button.q{opacity:.45}.${p}-ruban button[aria-pressed="true"]{background:#fff;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.15)}
.${p}-loupe{position:absolute;width:168px;min-height:100px;border-radius:50%;background:#fff;border:3px solid var(--h);box-shadow:0 8px 24px rgba(0,0,0,.22);padding:14px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-align:center;z-index:3}
.${p}-loupe b{font-size:14px;display:flex;align-items:center;gap:4px}.${p}-loupe small{font-size:11px;color:#5b5b5b}.${p}-loupe p{margin:2px 0 0;font-size:13px;font-weight:600;line-height:1.25}.${p}-loupe p i{font-style:normal;color:#5b5b5b;font-weight:400}
.${p}-hub{position:absolute;left:${cx - 40}px;top:${cy - 14}px;width:80px;text-align:center;font-size:11px;background:#fff;border:1.5px dashed #9a9a9a;border-radius:999px;padding:3px 6px;color:#111;font-weight:600;z-index:2}
.${p}-axes{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}.${p}-axes button{border:1px solid #d9d9d9;background:#fff;border-radius:999px;padding:5px 10px;font-size:13px;display:inline-flex;align-items:center;gap:5px;color:#111}.${p}-axes button[aria-pressed="true"]{background:var(--h);color:#fff;border-color:var(--h)}
.${p}-axes button.q{color:#5b5b5b;border-style:dashed}
.${p}-aide{position:absolute;right:60px;top:20px}
.${p}-radar text[data-famille]{cursor:pointer}`;
  const loupeHtml = (fam) => { const a = niveau(f, fam); const L = parFam[fam];
    return `<b>${picto(fam, 16)}<span style="color:${JETONS[fam].texte}" data-famille="${fam}">${NOM[fam]}</span></b><small>${a.sources}/${a.of} fiches</small><p>${L.map((x) => `${x.mot} <i>${x.n}/${I.N}</i>`).join(' · ')}</p>`; };
  const corps = `${appBar(p)}<main class="${p}-feuille" role="dialog" aria-label="Fiche de ${esc(f.name)}" style="--h:${coul(f)}">${enTete(p, f)}${legende(p, ' Loupe : touche un axe pour lire ses mots.')}
<div class="${p}-scene">${radar(p, f, { R, id: p, ml: 53 })}<div class="${p}-loupe" id="${p}-loupe" style="left:${cx + 30}px;top:${cy - R - 40}px">${loupeHtml('citrus')}</div>
<div class="${p}-hub">${hors.filter((x) => !x.generique).map((x) => x.mot).join(', ')} <span style="font-weight:400;color:#5b5b5b">hors familles</span></div></div>
<div class="${p}-axes">${FAM.filter(([k]) => niveau(f, k).level).map(([k, n]) => `<button type="button" data-axe="${k}" aria-pressed="${k === 'citrus'}">${picto(k, 14)}${n} ${niveau(f, k).sources}/${niveau(f, k).of}</button>`).join('')}<button type="button" class="q" disabled>9 familles jamais décrites</button><button type="button" class="q" disabled>fruité · générique</button></div>
<div class="${p}-ruban">${FAM.map(([k, n]) => `<button type="button" data-axe="${k}" aria-label="${n}"${niveau(f, k).level ? '' : ' class="q" disabled'}>${picto(k, 22)}<span>${niveau(f, k).level ? niveau(f, k).sources + '/' + niveau(f, k).of : '?'}</span></button>`).join('')}</div>
<p class="${p}-bas">Pas de liste : la loupe lit l’axe que tu touches, mots et fiches. Un axe hachuré n’a jamais été décrit ; ça ne veut pas dire absent.</p>
${dock(p)}${ficheCourte(p, f)}</main>`;
  const js = `(function(){var P='${p}',LOUPE=${JSON.stringify(Object.fromEntries(FAM.filter(([k]) => niveau(f, k).level).map(([k]) => [k, loupeHtml(k)])))};var ORD=${JSON.stringify(FAM.map(([k]) => k))};var cx=${cx},cy=${cy},R=${R};
window.viser=function(fam){var i=ORD.indexOf(fam),a=(-90+i*30)*Math.PI/180;var x=cx+Math.cos(a)*(R+30),y=cy+Math.sin(a)*(R+30);var L=document.getElementById(P+'-loupe');L.innerHTML=LOUPE[fam];L.style.left=Math.max(0,Math.min(${2 * cx}-168,x-84))+'px';L.style.top=Math.max(0,y-50)+'px';document.querySelectorAll('[data-axe]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.axe===fam))})};
document.querySelectorAll('[data-axe]').forEach(function(b){b.addEventListener('click',function(){viser(b.dataset.axe)})});
document.querySelectorAll('.'+P+'-radar text[data-famille]').forEach(function(t){t.addEventListener('click',function(){if(LOUPE[t.dataset.famille])viser(t.dataset.famille)})});viser('citrus');})();`;
  ecrire(p, page(p, 'flz6 — La loupe sur l’axe', css, corps.replace(enTete(p, f), enTete(p, f, { forme: 'B' })), js));
}

// ===================== flz7 — Dans l’ordre du nez (Citra cryo) =====================
{
  const p = 'flz7', f = hop('Citra cryo');
  const ordre = f.descripteurs.beerMaverick; // l'ordre de la fiche, tel quel
  const famDe = (mot) => { for (const a of f.aromes) for (const s of a.mots) if (s.mots.map(fr).includes(fr(mot))) return a.family; return null; };
  const css = CSS_ENT(p) + `
.${p}-haut{display:grid;grid-template-columns:1fr 168px;gap:6px;align-items:center}.${p}-cap{margin:0}.${p}-cap b{font-size:18px;display:block;line-height:1.2;margin-bottom:6px}.${p}-cap span{font-size:12px;color:#5b5b5b}
.${p}-bilan{display:flex;gap:6px;margin:8px 0 0;font-size:12px;color:#5b5b5b}.${p}-bilan span{flex:1;background:var(--g1);border-radius:8px;padding:6px 8px}.${p}-bilan b{display:block;font-size:18px;color:#111}
.${p}-esc{list-style:none;margin:0;padding:0;counter-reset:n;position:relative}.${p}-esc li{display:flex;align-items:center;gap:8px;height:36px;border-bottom:1px solid #fff;position:relative}.${p}-esc li i.m{position:absolute;left:-200px;top:0;bottom:0;width:200px;background:var(--h);opacity:.35}
.${p}-esc li:before{counter-increment:n;content:counter(n);width:26px;height:26px;border-radius:50%;background:var(--h);color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center;flex:none}
.${p}-esc li b{font-size:15px}.${p}-esc li em{font-style:normal;font-size:12px;color:#5b5b5b;margin-left:auto}
.${p}-esc li.sans b{color:#111}.${p}-esc li.sans i:not(.m){display:inline-grid;place-items:center;width:16px;height:16px;border:1.5px dashed #9a9a9a;border-radius:50%;font-size:10px;font-style:normal;color:#5b5b5b}
.${p}-note{font-size:12px;color:#5b5b5b;margin:8px 0 0}
.${p}-aide{position:absolute;right:60px;top:20px}`;
  const lis = ordre.map((m, i) => { const fam = famDe(m); const mot = fr(m);
    return `<li${fam ? '' : ' class="sans"'} style="margin-left:${i * 12 + 8}px"><i class="m"></i>${fam ? picto(fam) : '<i>?</i>'}<b${fam ? ` data-famille="${fam}" style="color:${JETONS[fam].texte}"` : ''}>${mot}</b><em>${fam ? NOM[fam] : 'aucune famille : hors du radar'}</em></li>`; }).join('');
  const corps = `${appBar(p)}<main class="${p}-feuille" role="dialog" aria-label="Fiche de ${esc(f.name)}" style="--h:${coul(f)}">${enTete(p, f)}${legende(p)}
<div class="${p}-haut"><p class="${p}-cap"><b>Dans l’ordre où la fiche les dit</b><span>Beer Maverick 2023, seule fiche lue · ${ordre.length} mots, du 1er au dernier · pas d’intensité, un ordre</span></p>${radar(p, f, { R: 76, id: p, etiquettes: 'aucune' })}</div>
<div style="overflow:hidden;border-radius:8px"><ol class="${p}-esc">${lis}</ol></div>
<div class="${p}-bilan"><span><b>9</b>marches</span><span><b>1</b>fiche lue</span><span><b>5</b>familles touchées</span><span><b>1</b>hors du radar</span></div>
${dock(p)}${ficheCourte(p, f)}</main>`;
  ecrire(p, page(p, 'flz7 — Dans l’ordre du nez', css, corps));
}

// ===================== flz8 — Une idée, pas trois mots (Motueka) =====================
{
  const p = 'flz8', f = hop('Motueka'), I = idees(f);
  const bruts = []; for (const a of f.aromes) for (const s of a.mots) for (const w of s.mots) bruts.push({ w, fam: a.family, src: s.source }); for (const s of f.motsSansFamille) bruts.push({ w: s.mot, fam: null, src: s.source });
  const ideesTri = I.liste.sort((a, b) => b.bruts.length - a.bruts.length);
  const css = CSS_ENT(p) + `
.${p}-haut{display:grid;grid-template-columns:1fr 108px;gap:4px;align-items:center}.${p}-haut p{margin:0;font-size:13px;color:#5b5b5b}.${p}-haut p b{display:block;color:var(--h);font-size:20px;margin-bottom:4px}
.${p}-tab{display:grid;grid-template-columns:1fr 18px 1fr;gap:4px 6px;align-items:center;margin-top:6px}
.${p}-th{font-size:12px;color:#5b5b5b;font-weight:600;padding-bottom:2px;border-bottom:1px solid #e3e3e3}
.${p}-brut{font-size:12px;color:#111;display:flex;flex-wrap:wrap;gap:3px;background:var(--g1);padding:6px;border-radius:4px}.${p}-brut span{background:#fff;border-radius:4px;padding:1px 5px;white-space:nowrap}.${p}-brut span.en{text-decoration:line-through;text-decoration-color:#9a9a9a}
.${p}-fl{color:#fff;background:var(--h);text-align:center;font-size:14px;font-weight:700;align-self:stretch;display:grid;place-items:center}
.${p}-idee{display:flex;align-items:center;gap:5px;font-size:15px;font-weight:700}.${p}-idee sup{font-size:11px;color:var(--h);font-weight:700}.${p}-idee em{font-style:normal;font-size:12px;color:#5b5b5b;font-weight:400}
.${p}-ligne2{display:contents}.${p}-ligne2>*{padding:6px 0}
.${p}-phrase{margin:10px 0 0;padding:10px 12px;background:#111;color:#fff;border-radius:8px;font-size:14px}.${p}-phrase b{font-weight:700}
.${p}-aide{position:absolute;right:60px;top:20px}`;
  const lignes = ideesTri.map((x) => `<div class="${p}-ligne2"><div class="${p}-brut">${x.bruts.map((b) => `<span${/[A-Za-z]/.test(b) && fr(b) !== b.toLowerCase() ? ' class="en"' : ''}>${esc(b)}</span>`).join('')}</div><div class="${p}-fl">→</div><div class="${p}-idee">${x.famille ? picto(x.famille) : ''}<span${x.famille ? ` data-famille="${x.famille}" style="color:${JETONS[x.famille].texte}"` : ''}>${x.mot}</span><sup>×${x.bruts.length}</sup><em>${x.famille ? '' : x.generique ? 'générique' : 'sans famille'}</em></div></div>`).join('');
  const corps = `${appBar(p)}<main class="${p}-feuille" role="dialog" aria-label="Fiche de ${esc(f.name)}" style="--h:${coul(f)}">${enTete(p, f)}${legende(p, ' Barré : mot anglais replié dans son idée française.')}
<div class="${p}-haut"><p><b>${bruts.length} mots bruts → ${I.liste.length} idées</b>les 2 fiches répètent les mêmes idées en deux langues : repliées, Motueka n’est plus « ultra fruité », il est agrumes, surtout.</p>${radar(p, f, { R: 46, id: p, etiquettes: 'aucune' })}</div>
<div class="${p}-tab"><div class="${p}-th">ce que disent les fiches</div><div></div><div class="${p}-th">l’idée</div>${lignes}</div>
<p class="${p}-phrase"><b>Agrumes, surtout</b> (citron vert, zeste, citron ; 2 fiches sur 2) · un peu de tropical et de floral (1 sur 2) · <b>mojito</b>, dit par les deux, sans famille</p>
${dock(p)}${ficheCourte(p, f)}</main>`;
  ecrire(p, page(p, 'flz8 — Une idée, pas trois mots', css, corps.replace(enTete(p, f), enTete(p, f, { forme: 'B' }))));
}
