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
// Usage : node controle-geste-etape.mjs <dossier> [--page=index.html] [--houblon=Nugget]
//   page par défaut : <dossier>/ma-biere/etat.html, sinon <dossier>/etat.html.
// Sortie : GESTE-ETAPE OK, ou GESTE-ETAPE ECHEC et les lignes « - D111 … ». Le contrôle D111 garde aussi RAIL :
// rejouer controle-rail.mjs --parcours sur la même page (il n'est pas modifié ici).
// Témoins : base v4.10 → OK ; maquette d332792c → ECHEC ; temoins/geste-etape-chevauche → ECHEC (puce repliée,
// rien de sélectionnable, mais des graduations qui se chevauchent) ; temoins/geste-etape-ok → OK.
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
const fin = (infos) => {
  for (const x of infos) console.log(x);
  if (problems.length) { console.log('GESTE-ETAPE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('- D111 ' + x); process.exit(1); }
  console.log('GESTE-ETAPE OK');
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

const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const infos = [];
try {
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
} finally {
  await navigateur.close();
}
fin(infos);
