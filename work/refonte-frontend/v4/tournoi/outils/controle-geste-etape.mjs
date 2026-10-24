// D111 (23.10, soir, voie p13) : le glisser du moment de Nugget, sur l'étape Houblons de la maquette publiée.
// Les mots du brasseur, sur la carte de Nugget : « Le slider est pas dans la version que je veux... ».
// Sa base v4.10 (ecran-1/base/consolide) : pendant le glisser, la carte se replie en puce « Nugget » près de la
// bulle et la frise s'ouvre autour du doigt, graduations lisibles. La maquette d332792c garde la carte entière
// (123 px de haut), serre les graduations par-dessus 0′, whirlpool et levure, et le texte de la bulle se
// sélectionne.
// Règle : Nugget glissé de 60′ à 35′, doigt tenu, vrais mouvements tactiles (touchStart, touchMove, comme
// controle-rail.mjs). À mi-course (47′ ou moins) et près de la fin (35′), le doigt toujours posé :
//   a) aucune étiquette n'en chevauche une autre : graduations (« 45′ »), repères de la frise (« 0′ »,
//      « whirlpool », « levure », « fermentation »…), puces des étapes (ronds de la frise), bulle et nom de la puce.
//      Recouvrement de plus de 2 px dans les deux sens, sur les boîtes visibles (opacité > 0,15) ;
//   b) la carte tenue se replie à la hauteur d'une puce (48 px au plus) et garde le nom du houblon ;
//   c) rien n'est sélectionné : getSelection().toString() vide, et le texte de la bulle a user-select à none
//      (sur iPhone, un appui tenu sur du texte ouvre le menu du système).
// Aucun marqueur de contrat n'est lu, sauf la poignée [data-role="glisser-moment"] (la base et la maquette
// l'ont) : le contrôle ne lit que les positions rendues.
// Usage : node controle-geste-etape.mjs <dossier> [--page=index.html] [--houblon=Nugget] [--froid]
//   page par défaut : <dossier>/ma-biere/etat.html, sinon <dossier>/etat.html.
// Sortie : GESTE-ETAPE OK, ou GESTE-ETAPE ECHEC et les lignes « - D111 … ». Le contrôle D111 garde aussi RAIL :
// rejouer controle-rail.mjs --parcours sur la même page (il n'est pas modifié ici).
// Témoins : base v4.10 → OK ; maquette d332792c → ECHEC ; temoins/geste-etape-chevauche → ECHEC (puce repliée,
// rien de sélectionnable, mais des graduations qui se chevauchent) ; temoins/geste-etape-ok → OK.
//
// MODE --froid (D123, 24.10, voie p19). Les mots du brasseur, maquette 24.10, Nugget glissé vers la post-fermentation :
// « Le rail c'est toujours n'importe quoi. Il y a un vrai historique dessus, pourquoi tu es revenu sur un choix que
// je n'ai pas fait ? » Le rail de l'étape avait pris côté froid l'échelle et les mots de Dryhopper (choix ouvert :
// jours 1, 2, 3, 5, 7, « dry hop », « ? IBU », carte entière pendant le geste, jours qui débordent sur les ajouts).
// Sa base v4.10 (ecran-1/base/consolide, BRIEF-RAIL.md) : carte en puce, J+0 à J+14 réguliers, « à froid », « aucun
// IBU », J+n et son réglage − / +. Le mode par défaut ne change pas (M15).
// À 390 × 844 tactile, Nugget glissé depuis sa poignée vers trois segments, la page rechargée à chaque fois :
// le whirlpool (jusqu'à mi-segment), la fermentation (mi-segment), la post-fermentation (100 px après son repère).
// Les segments se lisent sur les repères écrits « whirlpool », « fermentation », « post-fermentation », lus en direct
// (la frise se réorganise sous le doigt) : aucun marqueur de contrat, sauf la poignée, la carte, les ajouts rapides.
//   pendant, doigt tenu : a) la carte tenue se replie à 48 px au plus et garde son nom ; b) aucune étiquette n'en
//   chevauche une autre ; c) aucune étiquette ni graduation ne croise le champ « Ajouter » ni un ajout rapide ;
//   d) l'échelle est celle de sa base : « J+n » (froid) ou « n °C » (whirlpool), au moins 3 repères lisibles, des
//   jours entiers de 0 à 14 (des températures de 100 à 60 par 5), un seul saut permis (sous le doigt), un espacement
//   régulier (de 0,65 à 1,45 fois la médiane : la loupe grossit un peu près du doigt) ; aucun « 7 j ».
//   après le lâcher : e) la carte est posée entre les repères de son segment, sans en couvrir un ; f) ses mots :
//   « à froid » (jamais « dry hop »), « aucun IBU » (jamais « ? IBU »), J+n avec − / + de part et d'autre sur la même
//   ligne ; au whirlpool, « whirlpool », n °C, n IBU et la durée n min avec − / + ; g) aucun mot de Dryhopper sur
//   l'étape : « dry hop », « ? IBU », « 7 j », « après · », « avant · ».
// Sortie : GESTE-ETAPE OK (froid, 3 segments), ou GESTE-ETAPE ECHEC et des lignes « - D123 … ».
// Témoins : base v4.10 → OK ; maquette 5345f6ad → ECHEC ; temoins/geste-froid-deborde → ECHEC (tout est juste sauf des
// graduations qui passent sur les ajouts) ; temoins/geste-froid-ok → OK (le même sans le débordement).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const opt = (n, d) => ((args.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3)) || d;
const houblon = opt('houblon', 'Nugget');
const pageArg = opt('page', '');
const fichier = pageArg ? path.join(dir, pageArg)
  : fs.existsSync(path.join(dir, 'ma-biere', 'etat.html')) ? path.join(dir, 'ma-biere', 'etat.html') : path.join(dir, 'etat.html');
const attente = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
const froid = args.includes('--froid');
const fin = (infos) => {
  for (const x of infos) console.log(x);
  if (problems.length) { console.log('GESTE-ETAPE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('- ' + (froid ? 'D123' : 'D111') + ' ' + x); process.exit(1); }
  console.log(froid ? 'GESTE-ETAPE OK (froid, 3 segments)' : 'GESTE-ETAPE OK');
};
if (!fs.existsSync(fichier)) { problems.push('page absente : ' + fichier); fin([]); }

// Lecture injectée : ce qui est visible et sa place, jamais le code.
function lire(nom, momentTexte, doigt) {
  const vis = (e) => {
    if (!e || !e.isConnected) return false;
    for (let x = e; x && x !== document.documentElement; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.15) return false;
    }
    return true;
  };
  const poignee = () => [...document.querySelectorAll('[data-role="glisser-moment"]')].find(vis) || null;
  const carte = () => [...document.querySelectorAll('[data-role="ligne-houblon"]')].filter(vis).find((l) => l.innerText.toLowerCase().includes(nom.toLowerCase())) || null;
  const rect = (b) => ({ t: b.top, b: b.bottom, l: b.left, r: b.right });
  const ligne = carte();
  const lr = ligne ? ligne.getBoundingClientRect() : null;
  const repliee = !!lr && lr.height <= 48;
  const items = [];
  // Les textes courts visibles : graduations, repères, nom de la puce. Pas ceux de la carte entière (ses lignes se
  // chevauchent sans gêner), ni ceux de la bulle (comptés avec elle).
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const bulles = [];
  let n;
  while ((n = w.nextNode())) {
    const tx = n.textContent.replace(/\s+/g, ' ').trim();
    if (!tx || tx.length > 20) continue;
    const e = n.parentElement;
    if (!vis(e)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const b = r.getBoundingClientRect();
    if (b.width < 1 || b.height < 1 || b.bottom < 0 || b.top > innerHeight) continue;
    if (tx === momentTexte) bulles.push({ e, b, tx });
    if (b.top < 95 || b.left > 260) continue;
    if (ligne && ligne.contains(e) && !repliee) continue;
    items.push({ kind: 'texte', label: tx, ...rect(b), e });
  }
  // La bulle : le texte du moment le plus proche du doigt, et sa pilule (le premier ancêtre au fond plein).
  let bulle = null;
  if (bulles.length) {
    bulles.sort((a, c) => Math.hypot((a.b.left + a.b.right) / 2 - doigt.x, (a.b.top + a.b.bottom) / 2 - doigt.y) - Math.hypot((c.b.left + c.b.right) / 2 - doigt.x, (c.b.top + c.b.bottom) / 2 - doigt.y));
    const e = bulles[0].e;
    let p = e;
    for (let x = e, i = 0; x && i < 4; x = x.parentElement, i++) {
      const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(x).backgroundColor);
      const a = m ? (m[1].split(',').length > 3 ? Number(m[1].split(',')[3]) : 1) : 0;
      const bx = x.getBoundingClientRect();
      if (a > 0.5 && bx.width <= 140 && bx.height <= 70) { p = x; break; }
    }
    bulle = { e, pilule: p, tx: bulles[0].tx, us: getComputedStyle(e).userSelect, usWebkit: getComputedStyle(e).webkitUserSelect, callout: getComputedStyle(e).webkitTouchCallout };
  }
  const exclu = new Set();
  // Seul le texte de la bulle lui appartient : une graduation passée sous la pilule se compte comme chevauchement.
  if (bulle) for (const it of items) if (it.e === bulle.e || bulle.e.contains(it.e)) exclu.add(it);
  const liste = items.filter((it) => !exclu.has(it)).map((it) => ({ kind: it.kind, label: it.label, t: it.t, b: it.b, l: it.l, r: it.r }));
  // Les puces des étapes : ronds vides de la colonne du rail.
  for (const e of document.querySelectorAll('body *')) {
    if (e.children.length || e.textContent.trim()) continue;
    const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (b.width < 8 || b.width > 26 || Math.abs(b.width - b.height) > 3 || b.right > 70 || b.top < 95 || b.bottom > innerHeight) continue;
    if (parseFloat(cs.borderTopLeftRadius) < b.width / 2 - 1 || !vis(e)) continue;
    if (ligne && ligne.contains(e)) continue;
    liste.push({ kind: 'puce', label: 'puce de la frise', ...rect(b) });
  }
  if (bulle) { const b = bulle.pilule.getBoundingClientRect(); liste.push({ kind: 'bulle', label: 'bulle « ' + bulle.tx + ' »', ...rect(b) }); }
  const chevauche = [];
  for (let i = 0; i < liste.length; i++) {
    for (let j = i + 1; j < liste.length; j++) {
      const a = liste[i], c = liste[j];
      const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l), oy = Math.min(a.b, c.b) - Math.max(a.t, c.t);
      if (ox > 2 && oy > 2) chevauche.push(a.label + ' × ' + c.label + ' (' + Math.round(ox) + '×' + Math.round(oy) + ' px à ' + Math.round(Math.max(a.t, c.t)) + ')');
    }
  }
  const grads = liste.filter((x) => x.kind === 'texte' && /^[\dJ+°′' ]+$/.test(x.label) && /[′']|°|^J/.test(x.label)).length;
  const sel = String(getSelection());
  const h = poignee();
  return {
    nom: nom, chevauche, grads, etiquettes: liste.length, sel,
    carte: ligne ? { h: Math.round(lr.height), repliee, nom: ligne.innerText.toLowerCase().includes(nom.toLowerCase()) } : null,
    bulle: bulle ? { tx: bulle.tx, us: bulle.us, usWebkit: bulle.usWebkit, callout: bulle.callout } : null,
    handle: !!h,
  };
}

// ---- Mode --froid (D123) : lectures injectées. Seuls les rects rendus et les textes visibles sont lus.
// Les repères de segment : les textes exacts « whirlpool », « fermentation », « post-fermentation » de la colonne du
// rail, hors de la carte du houblon (dont le type d'ajout s'écrit aussi « whirlpool »).
function lireReperes(nom) {
  const vis = (e) => {
    if (!e || !e.isConnected) return false;
    for (let x = e; x && x !== document.documentElement; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.15) return false;
    }
    return true;
  };
  const carte = [...document.querySelectorAll('[data-role="ligne-houblon"]')].filter(vis).find((l) => l.innerText.toLowerCase().includes(nom.toLowerCase())) || null;
  const r = {};
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const tx = n.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    if (tx !== 'whirlpool' && tx !== 'fermentation' && tx !== 'post-fermentation') continue;
    const e = n.parentElement;
    if (!vis(e) || (carte && carte.contains(e))) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const b = rg.getBoundingClientRect();
    if (b.width < 1 || b.height < 1 || b.left > 260 || b.top < 95 || (tx in r)) continue;
    r[tx] = { t: b.top, b: b.bottom, l: b.left, r: b.right };
  }
  return r;
}

// Pendant et après : les étiquettes de la colonne du rail, les boîtes du contenu sous le rail (le champ « Ajouter » et
// les ajouts rapides), la carte de Nugget, son texte, le réglage − / + de sa ligne.
function lireFroid(nom, doigt) {
  const vis = (e) => {
    if (!e || !e.isConnected) return false;
    for (let x = e; x && x !== document.documentElement; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.15) return false;
    }
    return true;
  };
  const rect = (b) => ({ t: b.top, b: b.bottom, l: b.left, r: b.right });
  const carteEl = [...document.querySelectorAll('[data-role="ligne-houblon"]')].filter(vis).find((l) => l.innerText.toLowerCase().includes(nom.toLowerCase())) || null;
  const cb = carteEl ? carteEl.getBoundingClientRect() : null;
  const repliee = !!cb && cb.height <= 48;
  const contenuEls = [...document.querySelectorAll('[data-role="ajout-rapide"], input')].filter((e) => vis(e) && e.getBoundingClientRect().width > 0 && (e.getAttribute('data-role') === 'ajout-rapide' || /ajout/i.test(e.placeholder || '')));
  const contenu = contenuEls.map((c) => ({ nom: c.getAttribute('data-role') === 'ajout-rapide' ? 'l\'ajout rapide « ' + (c.innerText.split('\n')[0] || '').trim().slice(0, 18) + ' »' : 'le champ « Ajouter »', ...rect(c.getBoundingClientRect()) }));
  const hautContenu = contenu.length ? Math.min(...contenu.map((c) => c.t)) : innerHeight;
  const dedans = (e) => contenuEls.some((c) => c.contains(e));
  const labels = [];
  const reperes = {};
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const tx = n.textContent.replace(/\s+/g, ' ').trim();
    if (!tx || tx.length > 20) continue;
    const e = n.parentElement;
    if (!vis(e) || dedans(e)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const b = rg.getBoundingClientRect();
    if (b.width < 1 || b.height < 1 || b.bottom < 0 || b.top > innerHeight || b.top < 95 || b.left > 260) continue;
    const dansCarte = !!carteEl && carteEl.contains(e);
    const k = tx.toLowerCase();
    if (!dansCarte && (k === 'whirlpool' || k === 'fermentation' || k === 'post-fermentation') && !(k in reperes)) reperes[k] = rect(b);
    if (dansCarte && !repliee) continue;
    labels.push({ tx, ...rect(b), carte: dansCarte });
  }
  // La carte posée : son réglage − / + (deux boutons de part et d'autre du texte, sur la même ligne).
  const reglage = (re) => {
    if (!carteEl) return false;
    const boutons = [...carteEl.querySelectorAll('button, [role="button"]')].filter(vis).map((x) => x.getBoundingClientRect()).filter((x) => x.width > 0);
    const feuilles = [...carteEl.querySelectorAll('*')].filter((x) => !x.children.length && vis(x) && re.test(x.textContent.trim()));
    return feuilles.some((f) => {
      const b = f.getBoundingClientRect(), cy = (b.top + b.bottom) / 2;
      const meme = boutons.filter((x) => Math.abs((x.top + x.bottom) / 2 - cy) <= 14);
      return meme.some((x) => x.right <= b.left + 6 && b.left - x.right < 90) && meme.some((x) => x.left >= b.right - 6 && x.left - b.right < 90);
    });
  };
  const courts = labels.filter((x) => x.t < hautContenu).map((x) => x.tx);
  return {
    labels, reperes, contenu, hautContenu, doigt,
    carte: cb ? { ...rect(cb), h: cb.height, repliee, texte: carteEl.innerText.replace(/\s+/g, ' ').trim() } : null,
    courts, jourReglable: reglage(/^J\+\d+$/), dureeReglable: reglage(/^\d+\s*min$/),
  };
}

// L'échelle lue sur les graduations d'un segment : « J+n » (froid) ou « n °C » (whirlpool).
function jugerEchelle(qui, froidSeg, labels, momentTexte, doigtY, signaler) {
  const re = froidSeg ? /^J\+(\d{1,2})$/ : /^(\d{2,3})\s*°\s*C$/;
  const unite = froidSeg ? 1 : 5, nomUnite = froidSeg ? 'J+n' : 'n °C';
  const gens = labels.filter((x) => !x.carte);
  const mal = gens.filter((x) => /^\d+\s*j$/i.test(x.tx) || /^(après|avant)\b/i.test(x.tx));
  for (const x of mal) signaler(qui + ' : graduation écrite « ' + x.tx + ' » au lieu de « ' + nomUnite + ' » (les mots de Dryhopper)');
  const g = gens.filter((x) => re.test(x.tx) && !(x.tx === momentTexte && Math.abs((x.t + x.b) / 2 - doigtY) <= 30))
    .map((x) => ({ v: Number(re.exec(x.tx)[1]), y: (x.t + x.b) / 2, tx: x.tx })).sort((a, c) => a.y - c.y);
  if (g.length < 3) { signaler(qui + ' : moins de 3 graduations « ' + nomUnite + ' » lisibles pendant le geste (' + g.length + (g.length ? ' : ' + g.map((x) => x.tx).join(', ') : '') + ')'); return; }
  const sens = froidSeg ? 1 : -1;
  let sauts = 0; const pas = [];
  for (let i = 0; i + 1 < g.length; i++) {
    const d = (g[i + 1].v - g[i].v) * sens;
    if (d <= 0) { signaler(qui + ' : graduations dans le désordre (' + g[i].tx + ' puis ' + g[i + 1].tx + ')'); return; }
    if (d === unite) pas.push((g[i + 1].y - g[i].y) / 1);
    else if (d === 2 * unite && sauts === 0) { sauts++; pas.push((g[i + 1].y - g[i].y) / 2); }
    else { signaler(qui + ' : échelle irrégulière : ' + g[i].tx + ' puis ' + g[i + 1].tx + ' (pas de ' + d + (froidSeg ? ' jours' : ' °C') + ' ; un pas de ' + unite + ' est attendu, un seul saut du double est permis sous le doigt)'); return; }
  }
  const tri = [...pas].sort((a, c) => a - c), med = tri[Math.floor(tri.length / 2)];
  for (let i = 0; i < pas.length; i++) if (pas[i] < med * 0.65 || pas[i] > med * 1.45) signaler(qui + ' : espacement irrégulier entre ' + g[i].tx + ' et ' + g[i + 1].tx + ' (' + Math.round(pas[i]) + ' px par pas, médiane ' + Math.round(med) + ' px)');
  const vmin = Math.min(...g.map((x) => x.v)), vmax = Math.max(...g.map((x) => x.v));
  if (froidSeg && (vmin < 0 || vmax > 14)) signaler(qui + ' : jours hors de J+0 à J+14 (' + g.map((x) => x.tx).join(', ') + ')');
  if (!froidSeg && (vmin < 60 || vmax > 100 || g.some((x) => x.v % 5))) signaler(qui + ' : températures hors de 100 à 60 °C par 5 (' + g.map((x) => x.tx).join(', ') + ')');
}

async function sequenceFroid(navigateur) {
  const page = await navigateur.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const poignee = () => page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
    const s = [...document.querySelectorAll('[data-role="glisser-moment"]')].find(vis);
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const t = (s.getAttribute('aria-valuetext') || s.textContent || '').trim();
    const m = /(\d+)\s*[′']/.exec(t);
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, texte: t, minutes: m ? Number(m[1]) : null };
  });
  const cibles = [
    { id: 'whirlpool', froidSeg: false, but: (r, y) => r.whirlpool && r.fermentation && y >= r.whirlpool.t + 0.5 * (r.fermentation.t - r.whirlpool.t) },
    { id: 'fermentation', froidSeg: true, but: (r, y) => r.fermentation && r['post-fermentation'] && y >= r.fermentation.t + 0.5 * (r['post-fermentation'].t - r.fermentation.t) },
    { id: 'post-fermentation', froidSeg: true, but: (r, y) => r['post-fermentation'] && y >= r['post-fermentation'].t + 100 },
  ];
  const mots = [/dry[\s-]?hop/i, /\?\s*IBU/i, /(^|[^\w+])\d+\s*j(?![\w+])/i, /(après|avant)\s*·/i];
  for (const cible of cibles) {
    const qui = cible.id + ' pendant';
    await page.goto(pathToFileURL(fichier).href, { waitUntil: 'load', timeout: 30000 });
    let h = null;
    for (let i = 0; i < 60 && !h; i++) { h = await poignee(); if (!h) await attente(100); }
    await attente(400);
    h = await poignee();
    if (!h) { problems.push(cible.id + ' : pas de poignée [data-role="glisser-moment"] visible : le moment de ' + houblon + ' ne se glisse pas'); continue; }
    if (h.minutes !== 60) { problems.push(cible.id + ' : le départ n\'est pas à 60′ (« ' + h.texte + ' »)'); continue; }
    const reperes0 = await page.evaluate(lireReperes, houblon);
    for (const k of ['whirlpool', 'fermentation', 'post-fermentation']) if (!reperes0[k]) problems.push(cible.id + ' : repère « ' + k + ' » introuvable sur le rail (lu avant le geste)');
    if (!reperes0.whirlpool || !reperes0.fermentation || !reperes0['post-fermentation']) continue;
    const doigt = await page.touchscreen.touchStart(h.x, h.y);
    let y = h.y, atteint = false, dernier = null;
    try {
      for (let i = 0; i < 400 && y < 815; i++) {
        y += 3;
        await doigt.move(h.x, y);
        await attente(18);
        if (i % 2) continue;
        const r = await page.evaluate(lireReperes, houblon);
        if (cible.but(r, y)) { atteint = true; break; }
        dernier = r;
      }
      if (!atteint) { problems.push(cible.id + ' : le geste n\'atteint pas ce segment (doigt à ' + Math.round(y) + ' px ; repères lus : ' + JSON.stringify(dernier) + ')'); }
      else {
        await attente(450);
        const m = await poignee();
        const texte = m ? m.texte : '';
        const r = await page.evaluate(lire, houblon, texte, { x: h.x, y });
        const f = await page.evaluate(lireFroid, houblon, { x: h.x, y });
        infos.push(cible.id + ' · doigt à ' + Math.round(y) + ' px · « ' + texte + ' » · carte ' + (r.carte ? r.carte.h + ' px' : '?') + ' · ' + r.chevauche.length + ' chevauchement(s) · ' + f.labels.length + ' étiquettes, ' + f.contenu.length + ' boîtes de contenu · rail : ' + f.labels.filter((x) => !x.carte).map((x) => x.tx).join(' '));
        if (!m) problems.push(qui + ' : plus de poignée pendant le geste');
        else if (cible.froidSeg && !/^J\+\d{1,2}$/.test(texte)) problems.push(qui + ' : le moment sous le doigt s\'écrit « ' + texte + ' » (base v4.10 : « J+n »)');
        else if (!cible.froidSeg && !/^\d{2,3}\s*°\s*C$/.test(texte)) problems.push(qui + ' : le moment sous le doigt s\'écrit « ' + texte + ' » au whirlpool (base v4.10 : « n °C »)');
        if (!r.carte) problems.push(qui + ' : la carte de ' + houblon + ' ([data-role="ligne-houblon"]) est introuvable');
        else {
          if (r.carte.h > 48) problems.push(qui + ' : la carte tenue garde ' + r.carte.h + ' px de haut (une puce : 48 px au plus, comme sa base)');
          if (!r.carte.nom) problems.push(qui + ' : la puce ne garde plus le nom « ' + houblon + ' »');
        }
        for (const c of r.chevauche) problems.push(qui + ' : étiquettes qui se chevauchent, ' + c);
        if (!f.contenu.length) problems.push(qui + ' : ni champ « Ajouter » ni ajout rapide ([data-role="ajout-rapide"]) visible : le débordement ne se mesure pas');
        const vus = new Set();
        for (const x of f.labels) for (const c of f.contenu) {
          const ox = Math.min(x.r, c.r) - Math.max(x.l, c.l), oy = Math.min(x.b, c.b) - Math.max(x.t, c.t);
          if (ox > 2 && oy > 2 && !vus.has(x.tx + c.nom)) { vus.add(x.tx + c.nom); problems.push(qui + ' : l\'étiquette « ' + x.tx + ' » (' + Math.round(x.t) + ' px) déborde sur ' + c.nom + ' (' + Math.round(c.t) + ' à ' + Math.round(c.b) + ' px)'); }
        }
        jugerEchelle(qui, cible.froidSeg, f.labels, texte, y, (s) => problems.push(s));
      }
    } finally {
      await doigt.end();
    }
    if (!atteint) continue;
    // Après le lâcher : la carte posée à son moment, ses mots.
    await attente(900);
    const qa = cible.id + ' après';
    const ap = await page.evaluate(lireFroid, houblon, { x: 0, y: 0 });
    if (!ap.carte) { problems.push(qa + ' : la carte de ' + houblon + ' est introuvable'); continue; }
    const rp = ap.reperes, c = ap.carte;
    infos.push(qa + ' · carte ' + Math.round(c.t) + ' à ' + Math.round(c.b) + ' px · « ' + c.texte.slice(0, 110) + ' »');
    const haut = cible.id === 'whirlpool' ? rp.whirlpool : cible.id === 'fermentation' ? rp.fermentation : rp['post-fermentation'];
    const bas = cible.id === 'whirlpool' ? rp.fermentation : cible.id === 'fermentation' ? rp['post-fermentation'] : null;
    if (!haut) problems.push(qa + ' : repère de son segment introuvable après le lâcher');
    else {
      if (c.t < haut.b - 2) problems.push(qa + ' : la carte (' + Math.round(c.t) + ' px) n\'est pas posée sous le repère « ' + cible.id + ' » (' + Math.round(haut.b) + ' px)');
      if (bas && c.b > bas.t + 2) problems.push(qa + ' : la carte (jusqu\'à ' + Math.round(c.b) + ' px) dépasse le repère suivant (' + Math.round(bas.t) + ' px) : elle n\'est pas posée entre les repères de son segment');
      if (!bas && c.b > ap.hautContenu + 2) problems.push(qa + ' : la carte (jusqu\'à ' + Math.round(c.b) + ' px) passe sur le contenu sous le rail (' + Math.round(ap.hautContenu) + ' px)');
    }
    for (const [k, b] of Object.entries(rp)) {
      const ox = Math.min(c.r, b.r) - Math.max(c.l, b.l), oy = Math.min(c.b, b.b) - Math.max(c.t, b.t);
      if (ox > 2 && oy > 2) problems.push(qa + ' : la carte couvre le repère « ' + k + ' »');
    }
    const tout = c.texte + ' | ' + ap.courts.join(' | ');
    if (cible.froidSeg) {
      if (!/à froid/i.test(c.texte)) problems.push(qa + ' : la carte ne dit pas « à froid » (base v4.10 : « à froid »)');
      if (!/aucun IBU/i.test(c.texte)) problems.push(qa + ' : la carte ne dit pas « aucun IBU » (à froid, rien n\'est calculé)');
      if (!/J\+\d+/.test(c.texte) || !ap.jourReglable) problems.push(qa + ' : le jour n\'est pas écrit « J+n » avec son réglage − / + de part et d\'autre sur la même ligne');
    } else {
      if (!/whirlpool/i.test(c.texte)) problems.push(qa + ' : la carte ne dit pas « whirlpool »');
      if (!/\d+\s*°\s*C/.test(c.texte)) problems.push(qa + ' : la température « n °C » du whirlpool n\'est pas écrite sur la carte');
      if (!/\d+(?:[.,]\d+)?\s*IBU/.test(c.texte) || /aucun IBU/i.test(c.texte)) problems.push(qa + ' : la carte ne donne pas « n IBU » au whirlpool (base v4.10 : un nombre d\'IBU)');
      if (!ap.dureeReglable) problems.push(qa + ' : la durée « n min » n\'a pas son réglage − / + de part et d\'autre sur la même ligne');
    }
    for (const re of mots) { const t = re.exec(tout); if (t) problems.push(qa + ' : mot de Dryhopper sur l\'étape : « ' + t[0].trim() + ' »'); }
  }
}

const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const infos = [];
try {
  if (froid) await sequenceFroid(navigateur);
  else {
  const page = await navigateur.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(fichier).href, { waitUntil: 'load', timeout: 30000 });
  const poignee = () => page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
    const s = [...document.querySelectorAll('[data-role="glisser-moment"]')].find(vis);
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const t = s.getAttribute('aria-valuetext') || s.textContent || '';
    const m = /(\d+)\s*[′']/.exec(t);
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, texte: t.trim(), minutes: m ? Number(m[1]) : null };
  });
  let h = null;
  for (let i = 0; i < 60 && !h; i++) { h = await poignee(); if (!h) await attente(100); }
  await attente(400);
  h = await poignee();
  if (!h) problems.push('pas de poignée [data-role="glisser-moment"] visible : le moment de ' + houblon + ' ne se glisse pas');
  else if (h.minutes !== 60) problems.push('le départ n\'est pas à 60′ (« ' + h.texte + ' »)');
  if (h && h.minutes === 60) {
    const doigt = await page.touchscreen.touchStart(h.x, h.y);
    let y = h.y;
    const mesures = [];
    const prendre = async (qui, m) => {
      await attente(350);
      const cur = await poignee();
      const r = await page.evaluate(lire, houblon, m.texte, { x: h.x, y });
      mesures.push({ qui, r, m });
      infos.push(qui + ' · ' + m.texte + ' · carte ' + (r.carte ? r.carte.h + ' px' : '?') + ' · ' + r.grads + ' graduation(s), ' + r.etiquettes + ' étiquettes/repères · ' + r.chevauche.length + ' chevauchement(s)' + (cur ? '' : ' · poignée perdue'));
    };
    let milieu = false, bout = false, dernier = null;
    for (let i = 0; i < 500 && !bout; i++) {
      y += 3;
      await doigt.move(h.x, y);
      await attente(18);
      const m = await poignee();
      if (!m) continue;
      dernier = m;
      if (m.minutes === null) continue;
      if (!milieu && m.minutes <= 47) { milieu = true; await prendre('mi-course', m); }
      if (m.minutes <= 35) { bout = true; if (!milieu) { milieu = true; await prendre('mi-course', m); } await prendre('près de la fin', m); }
    }
    if (!bout) problems.push('le geste n\'atteint pas 35′ (dernier moment lu : « ' + (dernier ? dernier.texte : '?') + ' »)');
    await doigt.end();
    for (const { qui, r } of mesures) {
      if (!r.handle && !r.bulle) problems.push(qui + ' : plus de poignée ni de bulle pendant le geste');
      for (const c of r.chevauche) problems.push(qui + ' : étiquettes qui se chevauchent, ' + c);
      if (!r.carte) problems.push(qui + ' : la carte de ' + houblon + ' ([data-role="ligne-houblon"]) est introuvable');
      else {
        if (r.carte.h > 48) problems.push(qui + ' : la carte tenue garde ' + r.carte.h + ' px de haut (une puce : 48 px au plus)');
        if (!r.carte.nom) problems.push(qui + ' : la puce ne garde plus le nom « ' + houblon + ' »');
      }
      if (r.sel) problems.push(qui + ' : du texte est sélectionné (« ' + r.sel.slice(0, 30) + ' »)');
      if (!r.bulle) problems.push(qui + ' : la bulle du moment n\'est pas lisible (aucun texte « ' + (mesures[0] ? mesures[0].m.texte : '') + ' »)');
      else if (r.bulle.us !== 'none' || r.bulle.callout === 'default') problems.push(qui + ' : le texte de la bulle est sélectionnable (user-select ' + r.bulle.us + ', touch-callout ' + r.bulle.callout + ')');
    }
  }
  }
} finally {
  await navigateur.close();
}
fin(infos);
