// Page Artifact du lot 3 : p2, p3, p8, toutes les vues, captures + pages jouables.
// Usage : node build.mjs <dossier fils3> <ids…>   (ex. … p02 p03 p08)
// Sortie : site/ (index.html, <id>/<page>.html, img/<capture>.png) et files.json pour Artifact.
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
// Sources : node build.mjs <dossier> id… ; ou plusieurs --src=<dossier>:id1,id2 (la base
// consolidée vit dans ecran-1/base, les variantes dans ecran-1/fils3).
const srcArgs = process.argv.filter((a) => a.startsWith('--src='));
const SRC = {};
if (srcArgs.length) for (const a of srcArgs) { const [d, l] = a.slice(6).split(/:(?=[^\\/]*$)/); for (const id of l.split(',')) SRC[id] = path.resolve(d); }
else for (const id of process.argv.slice(3).filter((a) => !a.startsWith('--'))) SRC[id] = path.resolve(process.argv[2]);
const ids = Object.keys(SRC);
// --sans-radar : les radars du lot 3 échouent au contrat D24 ; ils sont refaits au lot 4.
const sansRadar = process.argv.includes('--sans-radar');
const site = path.join(here, 'site');
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(path.join(site, 'img'), { recursive: true });

const VUES = [
  ['index', 'Étape', 'Houblons de la recette, ajout en un toucher'],
  ['biere', 'Ma bière', 'Barres : mon niveau face à la zone du style'],
  ['biere-absolu', 'Ma bière', 'Absolu : la même bière sur une échelle commune à tous les styles'],
  ['biere-radar', 'Ma bière', 'Radar : ma bière et la cible'],
  ['etat-b', 'Suggestions', 'Barres : les voies, avant / après'],
  ['suggestions-radar', 'Suggestions', 'Radar : avant et voies après'],
  ['comparer', 'Comparer', 'Barres : ce que disent les fiches'],
  ['comparer-radar', 'Comparer', 'Radar : silhouettes des houblons'],
  ['cas-k2', 'Recette vide', 'K2 : aucun houblon encore'],
  ['cas-k3', 'Recette chargée', 'K3 : 60′, 10′, whirlpool, à froid'],
  ['fiche', 'Fiche', 'Appui long sur un houblon (ici Nugget) : sa fiche'],
  ['cas-ebu45', 'Ébullition 45′', 'La même recette, ébullition de 45′ (réglée dans la fiche de brassage) : Nugget ramené au début'],
  ['cas-ebu120', 'Ébullition 120′', 'La même recette, ébullition de 120′ (réglée dans la fiche de brassage)'],
  ['cas-ebu200', 'Ébullition 200′', 'La même recette, ébullition de 200′ : le rail garde ses tranches de 5′'],
];   // --sans-radar : les radars du lot 3 (p2, p3, p8) échouent au contrat D24 ; ceux de la base sont montrés.
const cap = (id, v) => (v === 'index' ? id : v === 'etat-b' ? id + '-b' : id + '-' + v) + '-390.png';
const files = {};
const data = {};
for (const id of ids) {
  data[id] = [];
  fs.mkdirSync(path.join(site, id), { recursive: true });
  for (const [v] of VUES) {
    if (sansRadar && /radar/.test(v) && id !== 'consolide') continue;
    const page = path.join(SRC[id], id, v + '.html');
    const img = path.join(SRC[id], 'captures', cap(id, v));
    if (!fs.existsSync(page) || !fs.existsSync(img)) { console.log('manque ' + id + ' ' + v); continue; }
    fs.copyFileSync(page, path.join(site, id, v + '.html'));
    fs.copyFileSync(img, path.join(site, 'img', cap(id, v)));
    files[id + '/' + v + '.html'] = path.join(site, id, v + '.html');
    files['img/' + cap(id, v)] = path.join(site, 'img', cap(id, v));
    data[id].push(v);
  }
}

const NOMS = { consolide: 'base', p02: 'p2', p03: 'p3', p08: 'p8' };
const NOTES = {
  consolide: 'Base v4.4 : ta loupe p02, le Dock qui suit le doigt et écrit les minutes autour (#134) ; un seul radar (D3), fermé sur 12 axes, inconnu marqué « ? » ; radars m4 et h4 à venir (#135)',
  p02: 'Ajouts rapides en liste, moments en rail à gauche',
  p03: 'Tableau au style (la base que tu as choisie)',
  p08: 'Rail des étapes : 60′, 10′, whirlpool, levure, à froid',
};
const html = `<title>Houblons lot 3</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{--bg:#f2ece4;--panel:#fbf8f3;--ink:#1a1613;--mute:#6b6158;--line:#d9cfc3;--accent:#a8441a;--chip:#e7ded2;--shade:rgba(26,22,19,.55)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15110e;--panel:#1f1a16;--ink:#efe7dc;--mute:#a3978a;--line:#3a312a;--accent:#e2804a;--chip:#2b241f;--shade:rgba(0,0,0,.7);color-scheme:dark}}
:root[data-theme="dark"]{--bg:#15110e;--panel:#1f1a16;--ink:#efe7dc;--mute:#a3978a;--line:#3a312a;--accent:#e2804a;--chip:#2b241f;--shade:rgba(0,0,0,.7);color-scheme:dark}
*{box-sizing:border-box}
[hidden]{display:none!important}
body{background:var(--bg);color:var(--ink);font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0}
.wrap{max-width:1100px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:14px 32px}
header{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
h1{font-size:20px;margin:0;text-wrap:balance}
.tag{font:12px/1 ui-monospace,"Cascadia Mono",Consolas,monospace;letter-spacing:.04em;color:var(--mute);text-transform:uppercase}
.seg{display:inline-flex;background:var(--chip);border-radius:9px;padding:3px;gap:2px;margin-top:12px}
.seg button{border:0;background:none;color:var(--ink);font:inherit;font-size:14px;padding:6px 12px;border-radius:7px;cursor:pointer;min-height:32px}
.seg button[aria-pressed="true"]{background:var(--panel);box-shadow:0 1px 2px rgba(0,0,0,.15);font-weight:600}
.chips{display:flex;gap:6px;overflow-x:auto;padding:10px 0 4px;scrollbar-width:none}
.chips button{flex:none;border:1px solid var(--line);background:var(--panel);color:var(--ink);font:inherit;font-size:13px;padding:5px 10px;border-radius:999px;cursor:pointer;min-height:30px}
.chips button[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);font-weight:600}
.chips small{color:var(--mute);font-weight:400}
.lede{color:var(--mute);font-size:13px;margin:4px 0 10px}
.grid{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media (min-width:700px){.grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.grid.var{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
figure{margin:0;min-width:0}
figure button{display:block;width:100%;padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel);cursor:zoom-in}
figure img{display:block;width:100%;height:auto;max-width:100%}
figcaption{font-size:12px;padding:5px 2px 0;display:flex;justify-content:space-between;gap:6px}
figcaption b{font-weight:600}
figcaption span{color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.viewer{position:fixed;inset:0;background:var(--shade);display:flex;flex-direction:column;align-items:center;z-index:5}
.bar{width:100%;max-width:430px;display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) 8px max(12px,env(safe-area-inset-left,0px));background:var(--panel);color:var(--ink)}
.bar b{flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar button{border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-size:14px;border-radius:8px;min-width:36px;min-height:34px;cursor:pointer}
.frame{flex:1;width:100%;max-width:430px;background:#fff;border:0}
.note{font-size:12px;color:var(--mute);margin-top:18px}
</style>
<div class="wrap">
  <header><h1>Étape houblons</h1><span class="tag">base · p2 · p3 · p8</span></header>
  <div class="seg" role="group" aria-label="Regrouper">
    <button data-mode="vue" aria-pressed="true">Par vue</button>
    <button data-mode="variante" aria-pressed="false">Par variante</button>
  </div>
  <div class="chips" id="chips"></div>
  <p class="lede" id="lede"></p>
  <div class="grid" id="grid"></div>
  <p class="note">Toucher une capture ouvre la page en vrai : ajouts, type d'ajout, moment et onglets répondent. Maquettes en gris, données du moteur V5.5 (recette S1, stout « trop résineuse »).${sansRadar ? ' Seule la base montre des radars (un seul style, au lot 4) ; ceux de p2, p3 et p8 sont retirés. Comparer et Suggestions de la base sont ceux d’avant le lot 5 : tes choix (Comparer p3, Suggestions p6) reviennent d’abord en fils de fer.' : ''}</p>
</div>
<div class="viewer" id="viewer" hidden>
  <div class="bar"><button id="prev" aria-label="Vue précédente">‹</button><b id="vt"></b><button id="next" aria-label="Vue suivante">›</button><button id="close" aria-label="Fermer">✕</button></div>
  <iframe class="frame" id="frame" title="Maquette"></iframe>
</div>
<script>
const VUES = ${JSON.stringify(VUES)};
const DATA = ${JSON.stringify(data)};
const NOMS = ${JSON.stringify(NOMS)};
const NOTES = ${JSON.stringify(NOTES)};
const IDS = Object.keys(DATA);
const cap = (id, v) => 'img/' + (v === 'index' ? id : v === 'etat-b' ? id + '-b' : id + '-' + v) + '-390.png';
const label = (v) => { const x = VUES.find((y) => y[0] === v); return x[1] + (/radar/.test(v) ? ' · radar' : /^(biere|etat-b|comparer)$/.test(v) ? ' · barres' : ''); };
let st = { mode: 'vue', vue: 'index', variante: IDS[0] };
try { Object.assign(st, JSON.parse(localStorage.getItem('lot3') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('lot3', JSON.stringify(st)); } catch (e) {} };
const $ = (s) => document.querySelector(s);
let seq = [], pos = 0;
function render() {
  document.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode)));
  const chips = $('#chips'), grid = $('#grid');
  chips.innerHTML = ''; grid.innerHTML = '';
  if (st.mode === 'vue') {
    for (const [v] of VUES) chips.append(chip(label(v), v === st.vue, () => { st.vue = v; render(); }));
    const x = VUES.find((y) => y[0] === st.vue);
    $('#lede').textContent = x[2];
    grid.className = 'grid';
    seq = IDS.filter((id) => DATA[id].includes(st.vue)).map((id) => [id, st.vue]);
    seq.forEach(([id, v], i) => grid.append(fig(id, v, NOMS[id] || id, '', i)));
  } else {
    for (const id of IDS) chips.append(chip(NOMS[id] || id, id === st.variante, () => { st.variante = id; render(); }));
    $('#lede').textContent = NOTES[st.variante] || '';
    grid.className = 'grid var';
    seq = DATA[st.variante].map((v) => [st.variante, v]);
    seq.forEach(([id, v], i) => grid.append(fig(id, v, label(v), '', i)));
  }
  save();
}
function chip(t, on, f) { const b = document.createElement('button'); b.textContent = t; b.setAttribute('aria-pressed', String(on)); b.onclick = f; return b; }
function fig(id, v, titre, sous, i) {
  const f = document.createElement('figure');
  f.innerHTML = '<button><img loading="lazy" alt=""></button><figcaption><b></b><span></span></figcaption>';
  f.querySelector('img').src = cap(id, v);
  f.querySelector('img').alt = (NOMS[id] || id) + ' · ' + label(v);
  f.querySelector('b').textContent = titre;
  f.querySelector('span').textContent = st.mode === 'vue' ? (NOTES[id] || '') : '';
  f.querySelector('button').onclick = () => open(i);
  return f;
}
async function open(i) {
  pos = (i + seq.length) % seq.length;
  const [id, v] = seq[pos];
  $('#vt').textContent = (NOMS[id] || id) + ' · ' + label(v);
  $('#viewer').hidden = false;
  try {
    const r = await fetch(id + '/' + v + '.html');
    $('#frame').srcdoc = await r.text();
  } catch (e) { $('#frame').srcdoc = '<p style="font:15px system-ui;padding:16px">Page indisponible ici.</p>'; }
}
$('#prev').onclick = () => open(pos - 1);
$('#next').onclick = () => open(pos + 1);
$('#close').onclick = () => { $('#viewer').hidden = true; $('#frame').srcdoc = ''; };
document.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => { st.mode = b.dataset.mode; render(); }));
render();
</script>
`;
fs.writeFileSync(path.join(site, 'index.html'), html);
fs.writeFileSync(path.join(here, 'files.json'), JSON.stringify(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v])), null, 1));
console.log('SITE ' + Object.keys(files).length + ' fichiers · ' + ids.map((id) => id + ':' + data[id].length).join(' '));
