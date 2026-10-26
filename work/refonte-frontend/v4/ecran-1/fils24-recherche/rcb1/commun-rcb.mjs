// Série rcb : le vocabulaire commun aux quatre concepts, pas un gabarit (chaque page compose sa propre
// recherche et sa propre ligne de résultat). Ici : le thème (D106), la ligne de l'étape d'où l'on vient, la
// lentille au style / absolu (D75), la légende derrière « ? » (D89), la barre des sorties (recette, Comparer),
// la fiche courte à l'appui long (D25, D49), et les boutons « + » au trait de la planche.
// Classes « rcb- » ici, « rcbN- » dans chaque concept (L26) ; assemblage par concaténation, jamais par replace.
import { esc, plage, virg, pi, NOM, FAMILLES, T, SYMBOLES, FICHE } from './donnees-rcb.mjs';

export const ETAPE = '<div class="rcb-app" aria-hidden="true"><span>‹ Houblons 3/7</span><span>IBU 60 · OG 1,066 · EBC 70</span></div>';

// Ce que la stout export (16D) attend : floral, herbacé, terreux (style-bands.json).
export const ATTENDUES = ['floral', 'herbal', 'earthy'];
export const lentille = (cls = '') => '<span class="rcb-lent ' + cls + '" role="radiogroup" aria-label="Lecture au style ou absolue"><button type="button" role="radio" aria-checked="true" data-e="style">au style · 16D</button><button type="button" role="radio" aria-checked="false" data-e="absolu">absolu</button></span>';
export const zone = (cls = '') => '<span class="rcb-zone ' + cls + '" data-role="zone" role="img" aria-label="Familles attendues par la 16D : floral, herbacé, terreux">' + ATTENDUES.map((f) => pi(f, 14)).join('') + '</span>';

export const legende = (id, lignes) => '<button type="button" class="rcb-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="' + id + '" aria-label="Lire la légende">?</button>'
  + '<div class="rcb-leg" id="' + id + '" data-role="legende" hidden>' + lignes.map((l) => '<p>' + l + '</p>').join('') + '</div>';

export const ic = (nom, s = 16) => '<svg width="' + s + '" height="' + s + '" aria-hidden="true"><use href="#' + nom + '"/></svg>';
export const plus = (h) => '<button type="button" class="rcb-plus" data-role="ajouter" aria-label="Ajouter ' + esc(h.nom) + ' à la recette">' + ic('i-plus', 16) + '</button>';
export const stockBadge = (h) => (h.stock && h.stock.g > 0 ? '<span class="rcb-stk" role="img" aria-label="en stock : ' + h.stock.g + ' g">' + ic('j-stock', 12) + '<span class="num">' + h.stock.g + ' g</span></span>' : '');
export const usage = (h) => '<span class="rcb-us" data-role="usage" data-usage="' + h.role + '">' + h.role + '</span>';
export const alpha = (h, lot = false) => '<span class="rcb-al num" aria-label="alpha">α ' + plage(h.alpha) + (lot && h.stock ? ' · lot ' + virg(h.stock.alpha) : '') + '</span>';

// La barre des sorties : retour à l'étape, Comparer (ce qu'on y a glissé).
export const BARRE = '<nav class="rcb-bas" aria-label="Sorties"><a href="#" class="rcb-retour">' + ic('i-chev-l', 16) + 'Étape</a><a href="#" class="rcb-comp" aria-label="Comparer, 2 houblons choisis">Comparer <b class="num">2</b>' + ic('i-chev-r', 16) + '</a></nav>';

// Les données de la fiche courte d'un houblon (appui long) : rien d'inventé, « ? » pour l'inconnu.
export function ficheData(h) {
  const f = FICHE(h.nom);
  const n = Object.fromEntries(FAMILLES.map((x) => [x, h.niveau[x]]));
  return { nom: h.nom, id: h.id, alpha: plage(h.alpha, ' %'), lot: h.stock ? virg(h.stock.alpha) + ' %' : null, role: h.role, origine: h.origine, huile: plage(h.huile, ' mL/100 g'),
    fiches: h.fiches, niveau: n, compte: h.compte, mots: FAMILLES.filter((x) => h.niveau[x] > 0).map((x) => [x, h.mots[x].length ? h.mots[x].slice(0, 3) : ['classé']]), sans: h.sans.slice(0, 4), stock: h.stock ? h.stock.g + ' g' : 'à acheter',
    thiol: h.thiol, source: f ? 'fiche du dépôt' : 'catalogue' };
}

export const CSS = `
:root { --encre:#16161a; --gris:#55555f; --gris2:#8a8f9c; --trait:#dcdce3; --mur:#f4f4f6; --acc:#c2410c; --sans:"Source Sans 3","Segoe UI",system-ui,-apple-system,sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:#fff; }
body { color:var(--encre); font:400 15px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; overflow-x:hidden; }
button, input { font:inherit; color:inherit; background:none; border:0; }
button { cursor:pointer; }
a { color:inherit; text-decoration:none; }
button:focus-visible, a:focus-visible { outline:2px solid var(--encre); outline-offset:2px; }
svg { display:block; flex:none; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; }
.rcb-cadre { max-width:390px; margin:0 auto; position:relative; min-height:100vh; padding-bottom:44px; }
.rcb-app { height:36px; background:#e9e9e9; color:var(--gris); display:flex; align-items:center; justify-content:space-between; padding:0 14px; font-size:12px; font-weight:600; }
.rcb-lent { display:inline-flex; background:var(--mur); border-radius:14px; padding:2px; flex:none; }
.rcb-lent button { height:24px; border-radius:12px; padding:0 8px; font-size:12px; color:var(--gris); white-space:nowrap; }
.rcb-lent button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.rcb-zone { display:inline-flex; align-items:center; gap:2px; padding:3px 5px; border:1.5px dashed var(--gris2); border-radius:4px; }
.rcb-aide { width:28px; height:28px; border-radius:50%; border:1px solid #c9cbd1; background:#fff; color:var(--gris); font-size:12px; font-weight:600; flex:none; }
.rcb-leg { display:flex; flex-direction:column; gap:3px; padding:8px 10px; border:1px solid var(--trait); border-radius:8px; font-size:12px; color:var(--gris); }
.rcb-plus { width:24px; height:24px; border-radius:50%; border:1.5px solid var(--encre); display:inline-flex; align-items:center; justify-content:center; flex:none; }
.rcb-stk { display:inline-flex; align-items:center; gap:3px; height:18px; padding:0 6px; border-radius:9px; background:var(--mur); color:var(--gris); font-size:12px; }
.rcb-us { font-size:12px; color:var(--gris); white-space:nowrap; }
.rcb-al { font-size:12px; white-space:nowrap; }
.rcb-bas { position:fixed; left:0; right:0; bottom:0; z-index:20; max-width:390px; margin:0 auto; height:40px; background:#fff; border-top:1px solid var(--trait); display:flex; align-items:center; justify-content:space-between; padding:0 10px 0 6px; font-size:12px; }
.rcb-bas a { display:inline-flex; align-items:center; gap:4px; height:28px; padding:0 8px; border-radius:14px; color:var(--gris); }
.rcb-bas .rcb-comp { border:1.5px solid var(--encre); color:var(--encre); font-weight:600; }
.rcb-bas .rcb-comp b { font-weight:700; }
.rcb-pi { flex:none; }
/* Fiche courte à l'appui long (D25), feuille blanche sur voile. */
.rcb-voile { position:fixed; inset:0; background:rgba(22,22,26,.35); z-index:30; display:flex; align-items:flex-end; justify-content:center; }
.rcb-fiche { width:100%; max-width:390px; background:#fff; border-radius:24px 24px 0 0; padding:14px 14px 18px; display:flex; flex-direction:column; gap:8px; }
.rcb-fiche h2 { font-size:22px; font-weight:700; display:flex; align-items:baseline; gap:10px; }
.rcb-fiche h2 b { font-size:15px; font-weight:400; }
.rcb-fiche .rcb-fl { display:flex; flex-wrap:wrap; gap:6px 10px; font-size:12px; color:var(--gris); align-items:center; }
.rcb-fiche .rcb-fr { display:flex; gap:10px; align-items:center; }
.rcb-fiche .rcb-fa { display:flex; flex-direction:column; gap:3px; font-size:12px; flex:1; min-width:0; }
.rcb-fiche .rcb-fa span { display:flex; align-items:center; gap:5px; }
.rcb-fiche .rcb-fa i { font-style:normal; color:var(--gris); }
.rcb-fiche .rcb-fs { font-size:15px; }
.rcb-fiche .rcb-fs b { font-weight:700; }
.rcb-fiche .rcb-fg { display:flex; gap:6px; }
.rcb-fiche .rcb-fg button { height:28px; padding:0 10px; border-radius:14px; border:1.5px solid var(--encre); font-size:12px; font-weight:600; }
.rcb-fiche .rcb-fx { position:absolute; right:10px; top:10px; width:36px; height:36px; border-radius:50%; background:var(--mur); display:inline-flex; align-items:center; justify-content:center; }
.rcb-fiche { position:relative; }
`;

// Le client : appui long (650 ms) ou survol (700 ms, souris) sur une ligne de houblon → fiche courte ; toucher court : rien.
// Les boutons de la ligne gardent leur action. Échap et la croix ferment. Le « ? » ouvre et ferme la légende.
export function client() {
  const F = window.RCB_FICHES || {};
  const NOM = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
  const RADAR = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
  const TON = window.RCB_TONS || {};
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let ouverte = null, depuis = 0;
  const fermer = () => { if (ouverte) { ouverte.remove(); ouverte = null; } };
  const radar = (f) => {
    const c = 56, r = 46; let s = '<svg data-radar data-objet="fiche" width="112" height="112" viewBox="0 0 112 112" role="img" aria-label="Silhouette des 12 familles">';
    const pts = [];
    RADAR.forEach((x, i) => { const a = -Math.PI / 2 + (i * Math.PI * 2) / 12; const n = f.niveau[x]; const rr = n === 2 ? r : n === 1 ? r * 0.55 : 6;
      s += '<line x1="' + c + '" y1="' + c + '" x2="' + (c + r * Math.cos(a)).toFixed(1) + '" y2="' + (c + r * Math.sin(a)).toFixed(1) + '" stroke="#e3e5eb" stroke-width="1"/>';
      const px = c + rr * Math.cos(a), py = c + rr * Math.sin(a); pts.push(px.toFixed(1) + ',' + py.toFixed(1));
      if (n === 0) s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="2" fill="none" stroke="#8a8f9c" stroke-width="1"/>';
      else s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="3" fill="' + (TON[x] || '#16161a') + '"/>'; });
    return s + '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#16161a" stroke-width="1.5"/></svg>';
  };
  const ouvrir = (id) => {
    const f = F[id]; if (!f) return; fermer();
    const v = document.createElement('div'); v.className = 'rcb-voile';
    v.innerHTML = '<section class="rcb-fiche" role="dialog" data-role="fiche" aria-label="Fiche de ' + esc(f.nom) + '">'
      + '<button type="button" class="rcb-fx" data-role="fermer-fiche" aria-label="Fermer"><svg width="16" height="16" aria-hidden="true"><use href="#i-x"/></svg></button>'
      + '<h2>' + esc(f.nom) + ' <b data-role="fiche-alpha">α ' + f.alpha + (f.lot ? ' · lot ' + f.lot : '') + '</b></h2>'
      + '<div class="rcb-fl"><span data-role="usage">' + f.role + '</span><span>' + esc(f.origine) + '</span><span>huile ' + f.huile + '</span><span>' + f.stock + '</span></div>'
      + '<div class="rcb-fr">' + radar(f) + '<div class="rcb-fa" data-role="fiche-arome">' + f.mots.map(([x, m]) => '<span><svg width="14" height="14" data-famille="' + x + '" role="img" aria-label="' + NOM[x] + '"><use href="#p-' + x + '"/></svg><b style="color:' + (TON[x] || '#16161a') + '">' + esc(m.join(', ')) + '</b><i>' + f.compte[x] + '/' + Math.max(1, f.fiches) + (f.fiches > 1 ? ' fiches' : ' fiche') + '</i></span>').join('') + '</div></div>'
      + (f.sans.length ? '<p class="rcb-fs">Lui seul : <b>' + esc(f.sans.join(', ')) + '</b></p>' : '')
      + '<div class="rcb-fg" data-role="gout"><button type="button">j’aime</button><button type="button">pas pour moi</button></div></section>';
    // Le click synthétisé à la fin de l'appui long tombe sur le voile : ignoré pendant 300 ms ([[saisie-mobile]]) ; la croix ferme toujours.
    v.addEventListener('click', (e) => { if (e.target.closest('[data-role="fermer-fiche"]')) return fermer(); if (e.target === v && Date.now() - depuis > 300) fermer(); });
    document.body.appendChild(v); ouverte = v; depuis = Date.now();
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fermer(); const b = document.querySelector('[data-role="legende-bouton"][aria-expanded="true"]'); if (b) { b.setAttribute('aria-expanded', 'false'); document.getElementById(b.getAttribute('aria-controls')).hidden = true; } } });
  let t = null, pt = null;
  const lignes = document.querySelectorAll('[data-role="ligne-houblon"]');
  for (const l of lignes) {
    const id = l.dataset.id || (l.querySelector('[data-houblon]') || l).dataset.houblon;
    const debut = (e) => { if (e.target.closest('button, a, input')) return; pt = e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY]; clearTimeout(t); t = setTimeout(() => { t = null; ouvrir(id); }, 650); };
    const bouge = (e) => { if (!t || !pt) return; const p = e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY]; if (Math.hypot(p[0] - pt[0], p[1] - pt[1]) > 12) { clearTimeout(t); t = null; } };
    const fin = () => { clearTimeout(t); t = null; };
    l.addEventListener('touchstart', debut, { passive: true }); l.addEventListener('touchmove', bouge, { passive: true }); l.addEventListener('touchend', fin); l.addEventListener('touchcancel', fin);
    l.addEventListener('mousedown', debut); l.addEventListener('mouseup', fin); l.addEventListener('mouseleave', fin);
    let hv = null;
    l.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover) and (pointer:fine)').matches) hv = setTimeout(() => ouvrir(id), 700); });
    l.addEventListener('mouseleave', () => clearTimeout(hv));
    l.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  for (const b of document.querySelectorAll('[data-role="legende-bouton"]')) b.addEventListener('click', () => { const o = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', String(!o)); const l = document.getElementById(b.getAttribute('aria-controls')); if (l) l.hidden = o; });
  for (const b of document.querySelectorAll('.rcb-lent button')) b.addEventListener('click', () => { for (const x of b.parentElement.querySelectorAll('button')) x.setAttribute('aria-checked', String(x === b)); });
}

export function page(c) {
  const fiches = Object.fromEntries(c.houblons.map((h) => [h.id, ficheData(h)]));
  const tons = Object.fromEntries(FAMILLES.map((f) => [f, T(f)]));
  return '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>' + esc(c.id + ' · ' + c.nom) + '</title>\n<style>' + CSS + (c.css || '') + '</style></head>\n<body class="' + c.id + '">\n' + SYMBOLES + '\n'
    + '<div class="rcb-cadre" data-role="recherche" data-concept="' + c.id + '">' + c.corps + '</div>\n'
    + '<script>window.RCB_FICHES = ' + JSON.stringify(fiches).split('</').join('<\\/') + ';\nwindow.RCB_TONS = ' + JSON.stringify(tons) + ';\n(' + client.toString() + ')();\n' + (c.script ? '(' + c.script.toString() + ')();\n' : '') + '</script>\n</body></html>\n';
}
