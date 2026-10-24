// Planche « épicé », série B : la sensation (mission 2026-10-22-reprise-lot21, voie r4d-b-sensation, v0).
// Usage : node generer.mjs            → etat.html, puis captures/planche-390.png, tailles-390.png, cartes-390.png
//         node generer.mjs --page     → etat.html seulement
// Huit propositions qui dessinent ce que l'épicé fait (au nez, en bouche, à la forme), sans dessiner d'épice.
// Grammaire des pictos (D88) : viewBox 24, trait #7a4e3a de 2.571, bouts ronds, sans remplissage ni halo.
// Les pictos des autres familles viennent tels quels de fils17-standard/v3/planche.html (symboles p-…).
// Classes préfixées r4b- (L26). Rien sous 12 px (D60).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ICI, '../../../../../../..');
const V3 = fs.readFileSync(path.join(REPO, 'work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html'), 'utf8');
const TON = '#7a4e3a';

const NOM_FAM = { citrus: 'Agrumes', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', earthy: 'Terreux', green: 'Végétal' };
const symFamille = (f) => {
  const m = new RegExp(`<symbol id="p-${f}"[^]*?</symbol>`).exec(V3);
  if (!m) throw new Error('symbole p-' + f + ' introuvable dans la planche v3');
  return m[0];
};

// Les huit propositions. « dit » : ce qu'elle dit à un brasseur, en une ligne.
export const VARIANTES = [
  { id: 'b1-langue', genre: 'sensation', nom: 'La langue qui picote', dit: 'Ça picote en bouche : la langue tirée, deux picots au bord.',
    risque: 'À 12 px, se lit « bouche » avant « langue » ; peut dire « goût » en général.',
    d: '<path d="M4 7.6c1.8-1.7 3.8-2.3 5.4-1.8.9.3 1.8.8 2.6.8s1.7-.5 2.6-.8c1.6-.5 3.6.1 5.4 1.8"/><path d="M4 7.6c2.3 1.9 5 2.8 8 2.8s5.7-.9 8-2.8"/><path d="M7.4 10.2v5.3a4.6 4.6 0 0 0 9.2 0v-5.3"/><path d="M12 12v3"/><path d="M3.2 14.6l-1.2 1"/><path d="M20.8 14.6l1.2 1"/>' },
  { id: 'b2-nez', genre: 'sensation', nom: 'Ça monte au nez', dit: 'Le nez de face, la poudre qui monte aux narines : l’épicé se sent avant de se boire.',
    risque: 'À 12 px, peut se lire « A » ou « cloche » ; dit « odeur » en général plutôt qu’épicé.',
    d: '<path d="M10.4 2.5c0 4.2-1.2 7.4-3.4 9.9-1.4 1.6-.6 3.8 1.6 3.8 1.2 0 1.8-.9 3.4-.9s2.2.9 3.4.9c2.2 0 3-2.2 1.6-3.8-2.2-2.5-3.4-5.7-3.4-9.9"/><path d="M8.6 22v-2.4"/><path d="M15.4 22v-2.4"/>' },
  { id: 'b3-grimace', genre: 'visage', nom: 'La grimace', dit: 'Le visage qui plisse les yeux : c’est relevé, ça surprend.',
    risque: 'Peut dire « amer », « acide » ou « mauvais » : une émotion plus qu’un arôme.',
    d: '<circle cx="12" cy="12" r="9.6"/><path d="M7.6 8.4 10 10l-2.4 1.6"/><path d="M16.4 8.4 14 10l2.4 1.6"/><path d="M8.4 16.2c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0"/>' },
  { id: 'b4-eclat', genre: 'abstrait', nom: 'La forme du piquant', dit: 'Une forme toute en pointes, l’inverse d’une forme ronde et douce (bouba / kiki).',
    risque: 'Peut dire « choc », « nouveau » ou « alerte » ; une étoile de bande dessinée.',
    d: '<path d="M13.8 1.7 14.3 8.7 18.9 8 15.9 11.3 21.8 13.7 15.1 14.6 15.1 20.5 11.5 16 6 20.6 8.5 14 3.5 12.7 8.2 10.6 4.9 4.9 10.5 8.3Z"/>' },
  { id: 'b5-gerbe', genre: 'mouvement', nom: 'La poussière qui jaillit', dit: 'Une gerbe de grains qui part d’un point : la poudre d’épices qui s’envole.',
    risque: 'Peut se lire « feu d’artifice » ou « soleil levant ».',
    d: '<path d="M12 15v-4.5"/><path d="M15.4 16l2.4-3.8"/><path d="M8.6 16 6.2 12.2"/><path d="M17.8 18.6l4.1-1.9"/><path d="M6.2 18.6 2.1 16.7"/><path d="M12 7v.01"/><path d="M19.4 9.6v.01"/><path d="M4.6 9.6v.01"/><path d="M12 21.5h.01"/>' },
  { id: 'b6-doux-pique', genre: 'courbe', nom: 'Du doux au piquant', dit: 'Une vague ronde qui finit en pointes : l’épicé doux des nobles, rond puis relevé.',
    risque: 'Abstrait : à apprendre une fois ; peut se lire « signal » ou « onde ».',
    d: '<path d="M2 15c1.5-4 3.5-4 5 0s3.5 4 5 0"/><path d="M12 15l2.5-7 2.5 7 2.5-7 2.5 7"/>' },
  { id: 'b7-cactus', genre: 'métaphore', nom: 'Le cactus', dit: 'Ce qui pique, en sec : se reconnaît à 12 px, et fait sourire.',
    risque: 'C’est une plante : peut tirer vers Végétal ; « désert » plutôt que houblon.',
    d: '<path d="M12 21V4.5"/><path d="M12 14.5H8.6a2.1 2.1 0 0 1-2.1-2.1V9.5"/><path d="M12 11.5h3.4a2.1 2.1 0 0 0 2.1-2.1V7"/><path d="M7 21h10"/>' },
  { id: 'b8-etincelles', genre: 'abstrait', nom: 'Les étincelles', dit: 'Deux éclats qui crépitent : le picotement fin, sans brûlure.',
    risque: 'C’est aussi l’icône courante de l’IA et du « nouveau ».',
    d: '<path d="M9 3.5c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5Z"/><path d="M17.5 13.5c.2 2 .8 2.6 2.8 2.8-2 .2-2.6.8-2.8 2.8-.2-2-.8-2.6-2.8-2.8 2-.2 2.6-.8 2.8-2.8Z"/>' },
];

// Trois houblons réels, données du dépôt (prototypes/houblons-v4/data/proto-data.json) :
// α Beer Maverick ; familles : tags Beer Maverick, plus les « familles déclarées sur houblon brut » de la fiche.
// Saaz (CZ) : terreux, herbacé, floral (BM) ; Épicé déclaré par la fiche. Usage non attesté : rôle déduit de l'α (≈).
// Cascade : pamplemousse, floral, épicé, agrumes, pin (BM) ; usage Crosby Hops (tardif, à cru, repris de r4c).
// Hallertau Mittelfrüh : épicé, floral, agrumes, herbe coupée (BM) ; Herbacé déclaré. Usage non attesté (≈).
const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'resin', 'SPICE', 'green'];
const HOUBLONS = [
  { nom: 'Saaz', alpha: '2–5', role: 'arôme ≈', familles: ['floral', 'herbal', 'earthy', 'SPICE'] },
  { nom: 'Cascade', alpha: '4,5–9', role: 'tardif · à cru', familles: ['floral', 'citrus', 'resin', 'SPICE'] },
  { nom: 'Mittelfrüh', alpha: '3–5,5', role: 'arôme ≈', familles: ['floral', 'herbal', 'citrus', 'SPICE', 'green'] },
];

const symboleVar = (v) => `<symbol id="s-${v.id}" viewBox="0 0 24 24" fill="none" stroke="${TON}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${v.d}</symbol>`;
const sp = (v, w) => `<svg class="r4b-pi" width="${w}" height="${w}" data-famille="spice" role="img" aria-label="Épicé"><use href="#s-${v.id}"/></svg>`;
const autre = (f, w = 16) => `<svg class="r4b-pi" width="${w}" height="${w}" data-famille="${f}" role="img" aria-label="${NOM_FAM[f] || f}"><use href="#p-${f}"/></svg>`;

// L'épreuve : à côté de la feuille d'Herbacé et des brins de Végétal (et du Floral), à 16 puis à 12 px.
const epreuve = (v) => `<div class="r4b-ep" data-role="voisins">
  <span class="r4b-tg">à côté</span>${autre('herbal')}${sp(v, 16)}${autre('green')}${autre('floral')}
  <span class="r4b-sep"></span>${autre('herbal', 12)}${sp(v, 12)}${autre('green', 12)}${autre('floral', 12)}</div>`;

// Une carte de houblon comme la liste de la base v4.9 : nom, α, rôle ; ses familles au trait à 16 px ; le + à droite.
const carte = (v, h) => `<div class="r4b-ca" data-carte="${h.nom}">
  <div class="r4b-l1"><b class="r4b-nm">${h.nom}</b><span class="r4b-al">α ${h.alpha} %</span><span class="r4b-ro">${h.role}</span></div>
  <div class="r4b-fa">${ORDRE.filter((f) => h.familles.includes(f)).map((f) => (f === 'SPICE' ? sp(v, 16) : autre(f))).join('')}</div>
  <span class="r4b-plus" aria-hidden="true"></span>
</div>`;

const bloc = (v, i) => `<section class="r4b-v" data-variante="${v.id}" data-genre="${v.genre}">
  <div class="r4b-t">${sp(v, 24)}<div><h2><span class="r4b-code">${v.id.slice(0, 2)}</span> ${v.nom}</h2><p class="r4b-dit">${v.dit}</p></div><span class="r4b-ge">${v.genre}</span></div>
  <div class="r4b-ta" data-role="tailles">${sp(v, 12)}${sp(v, 16)}${sp(v, 24)}<span class="r4b-tx">12 · 16 · 24 px</span></div>
  ${epreuve(v)}
  <div class="r4b-liste" data-role="cartes">${HOUBLONS.map((h) => carte(v, h)).join('')}</div>
</section>`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Épicé, série B : la sensation</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 12px; font: 14px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif; color: #1f1c1a; background: #f4f2ee; max-width: 390px; }
  h1 { font-size: 17px; margin: 2px 0 2px; }
  .r4b-sous { font-size: 13px; color: #6b625b; margin: 0 0 10px; }
  .r4b-v { background: #fff; border: 1px solid #e6e1da; border-radius: 16px; padding: 10px 12px 8px; margin: 0 0 10px; }
  .r4b-t { display: flex; align-items: flex-start; gap: 10px; }
  .r4b-t > svg { margin-top: 2px; }
  .r4b-t > div { flex: 1; min-width: 0; }
  h2 { font-size: 15px; font-weight: 700; margin: 0; }
  .r4b-code { font: 600 12px ui-monospace, monospace; color: ${TON}; }
  .r4b-dit { font-size: 13px; color: #4a433e; margin: 2px 0 0; }
  .r4b-ge { font-size: 12px; color: ${TON}; border: 1px solid #d9c9c0; border-radius: 999px; padding: 1px 7px; white-space: nowrap; }
  .r4b-ta { display: flex; align-items: flex-end; gap: 14px; margin: 8px 0 6px; }
  .r4b-tx { font-size: 12px; color: #9a918a; margin-left: auto; }
  .r4b-ep { display: flex; align-items: center; gap: 9px; margin: 0 0 8px; }
  .r4b-tg { font-size: 12px; color: #9a918a; margin-right: 2px; }
  .r4b-sep { width: 1px; height: 14px; background: #e6e1da; margin: 0 6px; }
  .r4b-liste { border-radius: 14px; border: 1px solid #ece7e1; border-left: 4px solid #1f1c1a; overflow: hidden; }
  .r4b-ca { position: relative; padding: 7px 46px 7px 10px; border-bottom: 1px solid #efebe6; }
  .r4b-ca:last-child { border-bottom: 0; }
  .r4b-l1 { display: flex; align-items: baseline; gap: 8px; white-space: nowrap; }
  .r4b-nm { font-size: 16px; text-decoration: underline dotted #b9b0a8; text-underline-offset: 4px; }
  .r4b-al { font: 600 13px ui-monospace, monospace; }
  .r4b-ro { font-size: 12px; color: #4b4540; border: 1px solid #cfc8c1; border-radius: 999px; padding: 0 6px; }
  .r4b-fa { display: flex; align-items: center; gap: 12px; margin-top: 6px; height: 18px; }
  .r4b-plus { position: absolute; right: 10px; top: 50%; width: 28px; height: 28px; margin-top: -14px; border: 2px solid #1f1c1a; border-radius: 50%; }
  .r4b-plus::before, .r4b-plus::after { content: ""; position: absolute; left: 50%; top: 50%; background: #1f1c1a; border-radius: 1px; }
  .r4b-plus::before { width: 12px; height: 2px; margin: -1px 0 0 -6px; }
  .r4b-plus::after { width: 2px; height: 12px; margin: -6px 0 0 -1px; }
  .r4b-src { font-size: 12px; color: #6b625b; margin: 4px 0 8px; }
  svg { flex: none; display: block; }
</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
${['floral', 'herbal', 'earthy', 'citrus', 'resin', 'green'].map(symFamille).join('\n')}
${VARIANTES.map(symboleVar).join('\n')}
</svg>
<h1>Épicé, série B : la sensation</h1>
<p class="r4b-sous">Ce que l’épicé fait au nez et en bouche, sans dessiner d’épice. Huit propositions.</p>
${VARIANTES.map(bloc).join('\n')}
<p class="r4b-src">α : Beer Maverick. Usage : Crosby Hops (Cascade) ; Saaz et Mittelfrüh : rôle déduit de l’α (≈). Familles : tags Beer Maverick et familles déclarées des fiches.</p>
</body></html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('PAGE écrite : ' + VARIANTES.length + ' propositions, genres : ' + [...new Set(VARIANTES.map((v) => v.genre))].join(', '));

if (!process.argv.includes('--page')) {
  const require = createRequire(path.join(REPO, 'package.json'));
  const puppeteer = require('puppeteer-core');
  fs.mkdirSync(path.join(ICI, 'captures'), { recursive: true });
  const url = pathToFileURL(path.join(ICI, 'etat.html')).href;
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const ouvrir = async (dsf, css) => {
    const p = await browser.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
    await p.goto(url, { waitUntil: 'load' });
    if (css) await p.addStyleTag({ content: css });
    await new Promise((r) => setTimeout(r, 300));
    return p;
  };
  // La planche entière.
  let p = await ouvrir(2);
  await p.screenshot({ path: path.join(ICI, 'captures/planche-390.png'), fullPage: true });
  await p.close();
  // Les tailles : chaque proposition à 12, 16 et 24 px, et à côté de la feuille et des brins (sans les cartes).
  p = await ouvrir(3, '.r4b-liste, .r4b-dit, .r4b-src, .r4b-sous { display: none !important; } .r4b-v { padding: 6px 10px; margin-bottom: 6px; } .r4b-ta { margin: 4px 0; }');
  await p.screenshot({ path: path.join(ICI, 'captures/tailles-390.png'), fullPage: true });
  await p.close();
  // Les vraies cartes : chaque proposition dans les trois lignes de houblon (sans tailles ni épreuve).
  p = await ouvrir(2, '.r4b-ta, .r4b-ep, .r4b-dit, .r4b-src, .r4b-sous { display: none !important; } .r4b-v { padding: 6px 10px; margin-bottom: 6px; } .r4b-t { margin-bottom: 6px; }');
  await p.screenshot({ path: path.join(ICI, 'captures/cartes-390.png'), fullPage: true });
  await p.close();
  await browser.close();
  console.log('CAPTURES écrites : planche-390.png, tailles-390.png, cartes-390.png');
}
