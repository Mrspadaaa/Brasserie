// Page partagée de la base (19.10 : « supprime tout ce qui n'est pas à jour ») : la base courante
// seule, ses pages jouables et leurs captures, plus les captures du geste du rail.
// Usage : node build.mjs --src=<ecran-1>/base:consolide [--version=v4.5]
// Sortie : a-jour/ (index.html, consolide/<page>.html, img/<capture>.png) et files.json pour Artifact
// (chemin publié → fichier ; les chemins de l'ancienne page absents d'ici sont à passer en null).
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const arg = (k, d) => (process.argv.find((a) => a.startsWith('--' + k + '=')) || '').slice(k.length + 3) || d;
const [srcDir, id] = arg('src', '').split(/:(?=[^\\/]*$)/);
if (!srcDir || !id) { console.error('usage : node build.mjs --src=<ecran-1>/base:consolide [--version=v4.5]'); process.exit(1); }
const SRC = path.resolve(srcDir);
const VERSION = arg('version', 'v4.5');
// Dossier publié : a-jour/ → https://claude.ai/artifact/MoohEoyjPGAWqpMQZZCq5T (page neuve du 19.10, seulement la base à jour).
const site = path.join(here, 'a-jour');
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(path.join(site, 'img'), { recursive: true });
fs.mkdirSync(path.join(site, id), { recursive: true });

// [page, groupe, libellé court] ; les captures : <id>-<page>-390.png (index : <id>-390, etat-b : <id>-b-390).
const VUES = [
  ['index', 'Étape', ''],
  ['cas-k3', 'Étape', 'Recette chargée'],
  ['cas-k2', 'Étape', 'Recette vide'],
  ['biere', 'Ma bière', 'Barres'],
  ['biere-absolu', 'Ma bière', 'Absolu'],
  ['biere-radar', 'Ma bière', 'Radar'],
  ['etat-b', 'Suggestions', 'Barres'],
  ['suggestions-radar', 'Suggestions', 'Radar'],
  ['comparer', 'Comparer', 'Barres'],
  ['comparer-radar', 'Comparer', 'Radar'],
  ['fiche', 'Fiche', 'Nugget'],
  ['substitution', 'Substitution', 'Nugget'],
  ['cas-ebu45', 'Ébullition', '45′'],
  ['cas-ebu120', 'Ébullition', '120′'],
  ['cas-ebu200', 'Ébullition', '200′'],
];
// Le rail pendant le geste (gestes-base.mjs) : [capture, page jouable, libellé].
const GESTES = [
  ['nugget-55', 'index', 'Nugget à 55′'],
  ['nugget-35', 'index', 'Nugget à 35′'],
  ['nugget-10', 'index', 'Nugget à 10′'],
  ['nugget-15-motueka-40', 'cas-k3', 'Nugget à 15′, Motueka à 40′'],
  ['motueka-35-nugget-35', 'cas-k3', 'Motueka et Nugget à 35′'],
  ['nugget-wp75', 'index', 'Nugget glissé au whirlpool'],
];
const cap = (v) => (v === 'index' ? id : v === 'etat-b' ? id + '-b' : id + '-' + v) + '-390.png';
const files = {};
const items = [];
for (const [v, groupe, libelle] of VUES) {
  const page = path.join(SRC, id, v + '.html'), img = path.join(SRC, 'captures', cap(v));
  if (!fs.existsSync(page) || !fs.existsSync(img)) { console.log('manque ' + v); continue; }
  fs.copyFileSync(page, path.join(site, id, v + '.html'));
  fs.copyFileSync(img, path.join(site, 'img', cap(v)));
  files[id + '/' + v + '.html'] = path.join(site, id, v + '.html');
  files['img/' + cap(v)] = path.join(site, 'img', cap(v));
  items.push({ groupe, libelle, img: 'img/' + cap(v), page: id + '/' + v + '.html' });
}
// Le rail se range juste après l'étape.
let apresEtape = items.findIndex((x) => x.groupe !== 'Étape');
for (const [g, v, libelle] of GESTES) {
  const img = path.join(SRC, 'captures', id + '-' + g + '-pendant.png');
  if (!fs.existsSync(img) || !files[id + '/' + v + '.html']) { console.log('manque geste ' + g); continue; }
  fs.copyFileSync(img, path.join(site, 'img', 'geste-' + g + '.png'));
  files['img/geste-' + g + '.png'] = path.join(site, 'img', 'geste-' + g + '.png');
  items.splice(apresEtape++, 0, { groupe: 'Rail', libelle, img: 'img/geste-' + g + '.png', page: id + '/' + v + '.html' });
}
const GROUPES = [...new Set(items.map((x) => x.groupe))];

const html = `<title>Houblons, base ${VERSION}</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Une planche : les captures de la base, groupées par écran ; un toucher ouvre la page jouable. */
:root{--bg:#f1efea;--panel:#fbfaf7;--ink:#191714;--mute:#67615a;--line:#d8d3ca;--accent:#0b5f8a;--chip:#e5e1d9;--shade:rgba(25,23,20,.6)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141311;--panel:#1d1b18;--ink:#ece8e1;--mute:#a19a90;--line:#38342e;--accent:#6fb6dd;--chip:#2a2723;--shade:rgba(0,0,0,.72);color-scheme:dark}}
:root[data-theme="dark"]{--bg:#141311;--panel:#1d1b18;--ink:#ece8e1;--mute:#a19a90;--line:#38342e;--accent:#6fb6dd;--chip:#2a2723;--shade:rgba(0,0,0,.72);color-scheme:dark}
*{box-sizing:border-box}
[hidden]{display:none!important}
body{background:var(--bg);color:var(--ink);font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0}
.wrap{max-width:1100px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:14px 32px}
h1{font-size:20px;margin:0;text-wrap:balance}
.chips{display:flex;gap:6px;overflow-x:auto;padding:12px 0 10px;scrollbar-width:none}
.chips button{flex:none;border:1px solid var(--line);background:var(--panel);color:var(--ink);font:inherit;font-size:13px;padding:5px 11px;border-radius:999px;cursor:pointer;min-height:32px}
.chips button[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);font-weight:600}
.chips button:focus-visible,figure button:focus-visible,.bar button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.grid{display:grid;gap:12px 10px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media (min-width:700px){.grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (min-width:1000px){.grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
figure{margin:0;min-width:0}
figure button{display:block;width:100%;padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel);cursor:zoom-in}
figure img{display:block;width:100%;height:auto;max-width:100%;aspect-ratio:390/844;object-fit:cover;object-position:top}
figcaption{font-size:12px;padding:5px 2px 0;display:flex;gap:6px;min-width:0}
figcaption b{font-weight:600;flex:none}
figcaption span{color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.viewer{position:fixed;inset:0;background:var(--shade);display:flex;flex-direction:column;align-items:center;z-index:5}
.bar{width:100%;max-width:430px;display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) 8px max(12px,env(safe-area-inset-left,0px));background:var(--panel);color:var(--ink)}
.bar b{flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar button{border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-size:14px;border-radius:8px;min-width:36px;min-height:34px;cursor:pointer}
.frame{flex:1;width:100%;max-width:430px;background:#fff;border:0;padding-bottom:env(safe-area-inset-bottom,0px)}
</style>
<div class="wrap">
  <h1>Houblons, base ${VERSION}</h1>
  <div class="chips" id="chips" role="group" aria-label="Écran"></div>
  <div class="grid" id="grid"></div>
</div>
<div class="viewer" id="viewer" hidden>
  <div class="bar"><button id="prev" aria-label="Page précédente">‹</button><b id="vt"></b><button id="next" aria-label="Page suivante">›</button><button id="close" aria-label="Fermer">✕</button></div>
  <iframe class="frame" id="frame" title="Page jouable"></iframe>
</div>
<script>
const ITEMS = ${JSON.stringify(items)};
const GROUPES = ['Tout', ...${JSON.stringify(GROUPES)}];
let st = { groupe: 'Tout' };
try { Object.assign(st, JSON.parse(localStorage.getItem('base') || '{}')); } catch (e) {}
if (!GROUPES.includes(st.groupe)) st.groupe = 'Tout';
const save = () => { try { localStorage.setItem('base', JSON.stringify(st)); } catch (e) {} };
const $ = (s) => document.querySelector(s);
let seq = [], pos = 0;
function render() {
  const chips = $('#chips'), grid = $('#grid');
  chips.innerHTML = ''; grid.innerHTML = '';
  for (const g of GROUPES) {
    const b = document.createElement('button');
    b.textContent = g; b.setAttribute('aria-pressed', String(g === st.groupe));
    b.onclick = () => { st.groupe = g; render(); };
    chips.append(b);
  }
  seq = ITEMS.filter((x) => st.groupe === 'Tout' || x.groupe === st.groupe);
  seq.forEach((x, i) => {
    const f = document.createElement('figure');
    f.innerHTML = '<button><img loading="lazy" alt=""></button><figcaption><b></b><span></span></figcaption>';
    f.querySelector('img').src = x.img;
    f.querySelector('img').alt = x.groupe + ', ' + x.libelle;
    f.querySelector('b').textContent = x.groupe;
    f.querySelector('span').textContent = x.libelle;
    f.querySelector('button').onclick = () => open(i);
    grid.append(f);
  });
  save();
}
async function open(i) {
  pos = (i + seq.length) % seq.length;
  const x = seq[pos];
  $('#vt').textContent = x.groupe + (x.libelle ? ' · ' + x.libelle : '');
  $('#viewer').hidden = false;
  try {
    const r = await fetch(x.page);
    $('#frame').srcdoc = await r.text();
  } catch (e) { $('#frame').srcdoc = '<p style="font:15px system-ui;padding:16px">Page indisponible ici.</p>'; }
}
$('#prev').onclick = () => open(pos - 1);
$('#next').onclick = () => open(pos + 1);
$('#close').onclick = () => { $('#viewer').hidden = true; $('#frame').srcdoc = ''; };
render();
</script>
`;
fs.writeFileSync(path.join(site, 'index.html'), html);
fs.writeFileSync(path.join(here, 'files.json'), JSON.stringify(files, null, 1));
console.log('SITE ' + Object.keys(files).length + ' fichiers · ' + items.length + ' captures · ' + GROUPES.join(', '));
