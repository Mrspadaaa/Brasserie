// D101 (22.10) : la planche du picto « épicé ». Critère de la voie r4-picto-epice (mission 2026-10-22-reprise-lot21),
// écrit par le pilote ; la voie ne le modifie pas. Témoin négatif : temoins/planche-poivre.html.
// Le brasseur, deux fois : « pico épice très étrange, plutôt vanille, canelle ? » (lot 15), puis, après
// le passage aux grains de poivre, « épicé l'icone est toujours pas bon.. » (lot 21).
// Règle, sur la planche rendue à 390 px :
//   - 6 à 8 blocs [data-variante], chacun avec un nom visible ;
//   - aucun nom de variante ne dit poivre / pepper ; aucun dessin n'est fait seulement de cercles
//     (les grains de poivre rejetés : 5 cercles dans fils17-standard/v3/planche.html) ;
//   - chaque variante montre son picto svg[data-famille="spice"] à deux tailles au moins, dont une de
//     16 px au plus (la taille d'usage), et en contexte : 3 pictos d'autres familles au moins dans le bloc ;
//   - le trait du picto est le ton de la famille Épicé (#7a4e3a, jetons-familles.json) ;
//   - pas de défilement horizontal à 390 px.
// --refuses (22.10, troisième refus : « Aucun me convient... », croix rouge sur les sept pictos de r4) :
// aucune variante ne reprend une idée déjà refusée (poivre, cannelle, vanille, badiane, girofle, mortier
// et pilon, coriandre, saupoudreur) ni un dessin déjà refusé (mêmes formes, à 0,1 près, qu'un picto Épicé
// de temoins/planche-poivre.html ou temoins/planche-r4-refusee.html). Témoin négatif :
// temoins/planche-r4-refusee.html. Une variante [data-nature="mot"] (le mot seul, sans picto) est
// dispensée des règles de dessin, pas du contexte.
// --genres=N (même jour) : les sept refusés étaient tous du même genre (une épice dessinée en objet).
// Chaque variante déclare son genre de solution (data-genre : objet, abstrait, lettre, mot, composé…),
// et la planche en compte N différents au moins.
// --nombre=a-b (6-8 par défaut) : le nombre de variantes attendu. --voisins=f1,f2 (critique Fable du 22.10 :
// « fais voir à côté de la feuille et de l'herbe, c'est là que ça se confond ») : chaque variante est
// montrée à côté des pictos de ces familles (svg[data-famille] dans son bloc). Toujours : rien sous 12 px
// (D60), ni picto ni mot.
// --ter (D101 ter, 22.10, quatrième refus ; décision du pilote) : sur la planche r4c (trois piments et le mot),
// « Les icônes épices ??? Il y a que 3 variante, qui sont toutes quasiment identique ??? » ; « Des vrais
// proposition surtout que un piment n'a rien à voir la dedans... ». La première passe de r4c avait six genres ;
// le critique non étalonné l'a rejetée et la voie s'est resserrée sur le piment (L27). Avec --ter :
//   - au moins 8 propositions [data-variante] nommées, et au moins 6 genres data-genre différents : deux
//     propositions du même genre ne comptent qu'une fois. Précision du pilote (22.10, la planche passe en
//     entonnoir : 4 séries de 8 propositions, puis 8 candidates améliorées) : --genres=N et --nombre=a-b, s'ils
//     sont donnés, REMPLACENT ces deux défauts ; toutes les autres règles de --ter restent obligatoires quel
//     que soit le nombre (par exemple, les 8 candidates : --ter --genres=2 --nombre=8-8) ;
//   - idées refusées : piment (chili, jalapeño…), poivre, badiane, girofle, mortier et pilon, coriandre,
//     saupoudreur. La cannelle et la vanille sont PERMISES (sa propre piste, « plutôt vanille, canelle ? »,
//     lot 15, mal dessinée en r4) : seuls leurs dessins de r4 restent refusés ;
//   - dessins refusés : toute signature (arrondie à l'unité) d'un picto Épicé de temoins/planche-poivre.html,
//     temoins/planche-r4-refusee.html et temoins/planche-r4c-refusee.html ;
//   - deux propositions n'ont jamais la même signature de dessin, même arrondie à l'unité (« quasiment
//     identique ») ;
//   - chaque proposition dessinée se montre à 12, 16 et 24 px (largeurs rendues, à 1 px près) ; chaque
//     proposition, le mot seul compris, se montre sur une vraie carte : un [data-carte] visible du bloc qui
//     porte le nom d'un houblon, le picto Épicé (le mot « épicé » pour data-nature="mot") et au moins 3
//     pictos d'autres familles ;
//   - toujours : trait au ton Épicé, rien sous 12 px, pas de défilement à 390 px.
// Sans --ter, rien ne change. Témoins de --ter : temoins/planche-r4c-refusee.html (copie de r4c) → ECHEC ;
// temoins/planche-r4-refusee.html → ECHEC (dessins de r4, cannelle et vanille comprises) ;
// temoins/planche-ter-ok.html (8 propositions synthétiques, 7 genres) → OK, avec --ter comme avec
// --ter --genres=2 --nombre=8-8.
// Usage : node controle-planche-picto.mjs <fichier.html> [--refuses] [--genres=N] [--nombre=a-b]
// [--voisins=herbal,green] [--ter] ; imprime PLANCHE OK (n variantes), ou PLANCHE ECHEC.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const fichier = process.argv.slice(2).find((a) => !a.startsWith('--'));
const refuses = process.argv.includes('--refuses');
const ter = process.argv.includes('--ter');
// Sous --ter, --genres=N et --nombre=a-b, s'ils sont donnés, remplacent les défauts (6 genres, 8 propositions au
// moins) : l'entonnoir du pilote (4 séries de 8, puis 8 candidates améliorées). Les autres règles restent.
const genresMin = Number((process.argv.find((a) => a.startsWith('--genres=')) || (ter ? '--genres=6' : '--genres=0')).slice(9));
const [nMin, nMax] = (process.argv.find((a) => a.startsWith('--nombre=')) || (ter ? '--nombre=8-999' : '--nombre=6-8')).slice(9).split('-').map(Number);
// D101 ter : la cannelle et la vanille sortent de la liste des idées refusées ; le piment y entre.
// D101 quater (22.10, nuit, le brasseur) : « Je veux un forme qui représente vraiment ce que c'est, genre canellle
// vanille, ou clou de girofle ect... Ce que ça représente vraiment épicier sur un houblon... ». Les épices réelles
// (girofle, badiane, coriandre…) sortent aussi des idées refusées ; seuls leurs dessins de r4 restent refusés.
// Restent refusés : le piment, le poivre, et les outils (mortier et pilon, saupoudreur).
const IDEES_TER = /piment|chili|jalap|poivre|pepper|mortier|pilon|saupoudr|shaker/i;
// --epices=N (D101 quater) : au moins N propositions représentent une épice réelle, déclarée par
// data-epice="<épice>" sur leur bloc [data-variante] et prise dans cette liste ; la ligne finale dit combien
// d'épices différentes.
const EPICES_REELLES = /^(cannelle|vanille|girofle|clou de girofle|muscade|macis|cardamome|gingembre|anis|anis vert|badiane|réglisse|coriandre|carvi|cumin|fenouil|fenugrec|tonka|fève tonka|genièvre|safran|curcuma|nigelle|sumac|mélange)$/i;
const epicesMin = Number((process.argv.find((a) => a.startsWith('--epices=')) || '--epices=0').slice(9));
const HOUBLONS = /\b(Saaz|Columbus|Cascade|Citra|Nelson Sauvin|Motueka|Galaxy|Idaho 7|Nugget|Fuggle|Goldings|East Kent|Hallertau|Tettnang|Tettnanger|Spalt|Perle|Magnum|Mosaic|Simcoe|Amarillo|Centennial|Chinook|Sabro|Styrian|Saphir|Mandarina|Ekuanot|Azacca|Strata|Talus|Aurum|Celeia|Target|Northern Brewer|Herkules|Polaris|Mittelfrüh|Tradition|Challenger|Bramling|Willamette|Riwaka|Nectaron|Vic Secret|Enigma|Eclipse|Sorachi|Mistral|Barbe Rouge|Triskel|Elixir|Cashmere|El Dorado|Lemondrop|Loral|Comet|Warrior|Apollo|Summit|Bravo)\b/i;
const voisinsExiges = (process.argv.find((a) => a.startsWith('--voisins=')) || '--voisins=').slice(10).split(',').filter(Boolean);
if (!fichier) { console.log('Usage : node controle-planche-picto.mjs <fichier.html> [--refuses]'); process.exit(2); }
const ICI = path.dirname(fileURLToPath(import.meta.url));
const IDEES_REFUSEES = /poivre|pepper|cannelle|canelle|cinnamon|vanill|badiane|anis étoilé|star anise|girofle|clove|mortier|pilon|coriandre|coriander|saupoudr|shaker/i;

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ouvrir = async (f) => {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((res) => setTimeout(res, 300));
  return p;
};
// Mesure d'une page : variantes, et signature du dessin de chaque picto Épicé (formes et géométrie,
// attributs de trait exclus, nombres arrondis à 0,1).
const mesurer = (p) => p.evaluate((HOUBLONS_SRC) => {
  const HOUBLONS = new RegExp(HOUBLONS_SRC, 'i');
  const TON = ['#7a4e3a', 'rgb(122, 78, 58)'];
  const visible = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const source = (svg) => {
    const use = svg.querySelector('use');
    const ref = use && (use.getAttribute('href') || use.getAttribute('xlink:href'));
    return ref ? document.querySelector(ref) : svg;
  };
  const formesDe = (src) => (src ? [...src.querySelectorAll('circle, ellipse, path, line, polyline, polygon, rect')] : []);
  const sigA = (svg, pas) => formesDe(source(svg)).map((e) => e.tagName.toLowerCase() + '(' + [...e.attributes]
    .filter((a) => !/^(stroke|fill|class|style|opacity|stroke-width|stroke-linecap|stroke-linejoin)$/.test(a.name))
    .map((a) => a.name + '=' + a.value.replace(/-?\d*\.?\d+/g, (n) => String(Math.round(Number(n) * pas) / pas)))
    .sort().join(';') + ')').join('');
  const sig = (svg) => sigA(svg, 10); // à 0,1 près (--refuses)
  const sig1 = (svg) => sigA(svg, 1); // à l'unité (--ter : « quasiment identique »)
  const formes = (svg) => {
    const src = source(svg);
    const tout = formesDe(src);
    const cercles = tout.filter((e) => /^(circle|ellipse)$/i.test(e.tagName)).length;
    const tons = [src?.getAttribute('stroke'), svg.getAttribute('stroke'), getComputedStyle(svg).stroke, ...tout.map((e) => e.getAttribute('stroke'))]
      .filter(Boolean).map((t) => t.trim().toLowerCase());
    return { cercles, autres: tout.length - cercles, tons, sig: sig(svg) };
  };
  return {
    large: document.documentElement.scrollWidth,
    toutes: [...document.querySelectorAll('svg[data-famille="spice"]')].map(sig).filter(Boolean),
    toutes1: [...document.querySelectorAll('svg[data-famille="spice"]')].map(sig1).filter(Boolean),
    variantes: [...document.querySelectorAll('[data-variante]')].map((b) => {
      const nom = (b.getAttribute('data-variante') + ' ' + (b.innerText || '')).replace(/\s+/g, ' ').trim();
      const epices = [...b.querySelectorAll('svg[data-famille="spice"]')];
      const tailles = [...new Set(epices.map((s) => Math.round(s.getBoundingClientRect().width)).filter((w) => w > 0))].sort((x, y) => x - y);
      const f = epices.length ? formes(epices[0]) : { cercles: 0, autres: 0, tons: [], sig: '' };
      return {
        id: b.getAttribute('data-variante'), nom: nom.slice(0, 80), texte: (b.innerText || '').trim().length,
        mot: b.getAttribute('data-nature') === 'mot', genre: (b.getAttribute('data-genre') || '').trim(), epice: (b.getAttribute('data-epice') || '').trim(), tailles, cercles: f.cercles, autres: f.autres,
        ton: f.tons.some((t) => TON.includes(t)), sig: f.sig, sig1: epices.length ? sig1(epices[0]) : '',
        // D101 ter : les vraies cartes du bloc ([data-carte] visibles) et ce qu'elles portent.
        cartes: [...b.querySelectorAll('[data-carte]')].filter(visible).map((c) => ({
          houblon: HOUBLONS.test((c.getAttribute('data-carte') || '') + ' ' + (c.innerText || '')),
          epice: [...c.querySelectorAll('svg[data-famille="spice"]')].some(visible),
          motEpice: /épic/i.test(c.innerText || ''),
          autres: [...c.querySelectorAll('svg[data-famille]:not([data-famille="spice"])')].filter(visible).length,
        })),
        voisins: b.querySelectorAll('svg[data-famille]:not([data-famille="spice"])').length,
        familles: [...new Set([...b.querySelectorAll('svg[data-famille]')].map((s) => s.getAttribute('data-famille')))],
        policeMin: Math.min(...[...b.querySelectorAll('*')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
          .map((e) => parseFloat(getComputedStyle(e).fontSize)).filter((x) => x > 0), 99),
      };
    }),
  };
}, HOUBLONS.source);

const fautes0 = [];
const dejaVus = new Set();
if (refuses) {
  for (const t of ['planche-poivre.html', 'planche-r4-refusee.html']) {
    const p = await ouvrir(path.join(ICI, 'temoins', t));
    for (const s of (await mesurer(p)).toutes) dejaVus.add(s);
    await p.close();
  }
}
// D101 ter : les dessins refusés, à l'unité, dont ceux de la planche r4c (sa copie dans temoins/).
const dejaVus1 = new Set();
if (ter) {
  for (const t of ['planche-poivre.html', 'planche-r4-refusee.html', 'planche-r4c-refusee.html']) {
    const p = await ouvrir(path.join(ICI, 'temoins', t));
    for (const s of (await mesurer(p)).toutes1) dejaVus1.add(s);
    await p.close();
  }
}
const r = await mesurer(await ouvrir(fichier));
await browser.close();
if (ter) {
  // Deux propositions de même dessin, à l'unité près : « quasiment identique ».
  const parSig = new Map();
  for (const v of r.variantes) if (!v.mot && v.sig1) parSig.set(v.sig1, [...(parSig.get(v.sig1) || []), v.id]);
  for (const ids of parSig.values()) if (ids.length > 1) fautes0.push(`même dessin, à l'unité près (« quasiment identique ») : ${ids.join(', ')}`);
}

const fautes = [...fautes0];
if (r.variantes.length < nMin || r.variantes.length > nMax) fautes.push(`${r.variantes.length} variantes (${nMin} à ${nMax} attendues)`);
if (r.large > 390) fautes.push(`défilement horizontal : ${r.large} px de large`);
if (genresMin) {
  const sans = r.variantes.filter((v) => !v.genre).map((v) => v.id);
  const genres = new Set(r.variantes.map((v) => v.genre).filter(Boolean));
  if (sans.length) fautes.push(`variantes sans data-genre : ${sans.join(', ')}`);
  if (genres.size < genresMin) fautes.push(`${genres.size} genre(s) de solution (${[...genres].join(', ')}) ; ${genresMin} au moins attendus`);
}
const reelles = r.variantes.filter((v) => EPICES_REELLES.test(v.epice));
const epicesDifferentes = new Set(reelles.map((v) => v.epice.toLowerCase().replace(/^clou de /, '').replace(/^fève /, '')));
if (epicesMin) {
  const inconnues = r.variantes.filter((v) => v.epice && !EPICES_REELLES.test(v.epice)).map((v) => `${v.id} (${v.epice})`);
  if (inconnues.length) fautes.push(`data-epice hors de la liste des épices réelles : ${inconnues.join(', ')}`);
  if (reelles.length < epicesMin) fautes.push(`${reelles.length} proposition(s) représentent une épice réelle (data-epice) ; ${epicesMin} au moins attendues (D101 quater)`);
}
for (const v of r.variantes) {
  const f = [];
  if (!v.texte) f.push('sans nom visible');
  if (/poivre|pepper/i.test(v.nom)) f.push('poivre (rejeté)');
  if (refuses && !ter && IDEES_REFUSEES.test(v.nom)) f.push(`idée déjà refusée par le brasseur (« ${v.nom.match(IDEES_REFUSEES)[0]} »)`);
  if (refuses && v.sig && dejaVus.has(v.sig)) f.push('dessin déjà refusé (mêmes formes qu\'une planche refusée)');
  if (ter) {
    if (IDEES_TER.test(v.nom)) f.push(`idée déjà refusée par le brasseur (« ${v.nom.match(IDEES_TER)[0]} » ; D101 ter)`);
    if (!v.mot && v.sig1 && dejaVus1.has(v.sig1)) f.push('dessin déjà refusé, à l\'unité près (planche poivre, r4 ou r4c)');
    if (!v.mot) for (const t of [12, 16, 24]) if (!v.tailles.some((w) => Math.abs(w - t) <= 1)) f.push(`pas montrée à ${t} px (12, 16 et 24 px attendus ; rendues : ${v.tailles.join('/') || 'aucune'})`);
    const bonnes = v.cartes.filter((c) => c.houblon && (v.mot ? c.motEpice || c.epice : c.epice) && c.autres >= 3);
    if (!v.cartes.length) f.push('sur aucune vraie carte ([data-carte] avec un houblon, le picto Épicé et 3 pictos d\'autres familles)');
    else if (!bonnes.length) f.push(`aucune carte complète (houblon nommé : ${v.cartes.some((c) => c.houblon) ? 'oui' : 'non'} ; ${v.mot ? 'mot « épicé »' : 'picto Épicé'} : ${v.cartes.some((c) => (v.mot ? c.motEpice || c.epice : c.epice)) ? 'oui' : 'non'} ; autres familles : ${Math.max(...v.cartes.map((c) => c.autres))} sur 3)`);
  }
  if (!v.mot) {
    if (v.cercles >= 3 && v.autres === 0) f.push(`dessin de ${v.cercles} cercles seulement : les grains de poivre rejetés`);
    if (!v.tailles.length) f.push('pas de svg[data-famille="spice"]');
    else {
      if (v.tailles.length < 2) f.push(`une seule taille (${v.tailles[0]} px)`);
      if (v.tailles[0] > 16) f.push(`plus petite taille ${v.tailles[0]} px (16 au plus attendue)`);
    }
    if (!v.ton) f.push('trait hors du ton Épicé #7a4e3a');
  }
  if (v.voisins < 3) f.push(`${v.voisins} picto(s) d'autres familles (3 au moins, en contexte)`);
  for (const fam of voisinsExiges) if (!v.familles.includes(fam)) f.push(`pas montrée à côté de ${fam} (voisin exigé)`);
  if (!v.mot && v.tailles.length && v.tailles[0] < 12) f.push(`picto à ${v.tailles[0]} px (rien sous 12 px, D60)`);
  if (v.policeMin < 12) f.push(`texte à ${v.policeMin} px dans le bloc (rien sous 12 px, D60)`);
  console.log(`${v.id} · ${v.mot ? 'mot seul' : v.tailles.join('/') + ' px · ' + v.cercles + ' cercle(s), ' + v.autres + ' autre(s) forme(s)'} · ${v.voisins} voisins${f.length ? ' · ' + f.join(' ; ') : ''}`);
  for (const x of f) fautes.push(`${v.id} : ${x}`);
}
if (fautes.length) { console.log(`PLANCHE ECHEC ${fautes.length} problème(s)`); for (const x of fautes) console.log('  ' + x); process.exit(1); }
console.log(`PLANCHE OK (${r.variantes.length} variantes)${epicesMin ? ` · ${reelles.length} épices réelles, ${epicesDifferentes.size} différentes` : ""}`);
