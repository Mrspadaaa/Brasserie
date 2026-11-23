// D89 (19.10, soir) : la légende derrière un bouton discret. Les mots du brasseur, sur l8b : « Tu peux
// même mettre un peu plus d'icone et autre, mais il faut un bouton légende un peu caché pour pas que ça
// gêne ». Révision de « pas de légende écrite » (ligne « Légende bis » de DEFAUTS-RECURRENTS).
// Règle :
//   - un bouton [data-role="legende-bouton"], aria-expanded="false" au repos, discret : 32 × 32 px au
//     plus, un signe au plus (« ? » ou un picto), sans fond plein coloré ;
//   - une légende [data-role="legende"] invisible au repos ; le bouton touché l'ouvre (visible,
//     aria-expanded="true") et elle explique quelque chose (8 mots au moins) ; Échap la referme.
// Témoin intégré : --temoin ouvre la légende avant de mesurer (doit échouer).
// Usage : node controle-legende.mjs <dossier> [ids…] [--page=etat-b.html] [--temoin] ; imprime
// LEGENDE OK, ou LEGENDE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { versUrl, existe, liste } from './lib/cible.mjs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const temoin = args.includes('--temoin');
const ids = (only.length ? only : liste(dir).filter((d) => existe(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
// ===== Mode --etape : D113 (voie p13-controles-etape, 23.10, soir) =====
// Les mots du brasseur, sur la carte de Nugget de l'étape Houblons : « J'aime bien les petits icône et tout. Mais il
// manque à un endroit un bouton légende ». Le seul « ? » de la maquette publiée est au-dessus des familles ; rien
// près de la carte de l'ajout. Règle (révision de D89 : le bouton reste discret, les icônes restent) :
//   chaque groupe d'icônes de l'étape (la carte de l'ajout, les ajouts rapides, les familles) a SON bouton « ? »
//   (bouton dont le texte est « ? », ou aria-label « légende », ou [data-role="legende-bouton"]), à un geste et à
//   portée de vue : le groupe et son bouton tiennent dans un même écran (une hauteur d'écran au plus), le bouton
//   étant le plus proche de ce groupe parmi les groupes. Un seul « ? » pour trois groupes ne vaut pas trois « ? ».
//   Un toucher sur le « ? » montre un texte nouveau qui nomme chacune des icônes du groupe : les 12 familles (Floral,
//   Herbacé, Terreux, Agrumes, Tropicaux, Noyau, Pépins, Baies, Melon, Résineux, Épicé, Végétal) quand le groupe a la
//   bande des arômes ou les pictos des familles, plus tout nom d'icône porté par un aria-label (svg, img, role=img).
//   Les icônes restent : elles ne disparaissent pas à l'ouverture.
// Groupes cherchés : carte [data-role="ligne-houblon"] (celle de Nugget) ; ajouts rapides [data-role="ajout-rapide"] ;
// familles [data-role="profil"] (la base : [data-role="panneau"]).
// Usage : node controle-legende.mjs <dossier> --etape [--page=index.html] [--houblon=Nugget]
//   page par défaut : <dossier>/ma-biere/etat.html, sinon <dossier>/etat.html.
// Sortie : LEGENDE OK, ou LEGENDE ECHEC et les lignes « - D113 … ». Le mode par défaut (D89) n'est pas touché (M15).
if (args.includes('--etape')) {
  const opt = (n, d) => ((args.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3)) || d;
  const houblon = opt('houblon', 'Nugget');
  const pageArg = opt('page', '');
  const fichier = pageArg ? path.join(dir, pageArg) : existe(path.join(dir, 'ma-biere', 'etat.html')) ? path.join(dir, 'ma-biere', 'etat.html') : path.join(dir, 'etat.html');
  const attente = (ms) => new Promise((r) => setTimeout(r, ms));
  const infos = [];
  const sortir = async () => {
    await browser.close();
    for (const x of infos) console.log(x);
    if (problems.length) { console.log('LEGENDE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('- D113 ' + x); process.exit(1); }
    console.log('LEGENDE OK');
    process.exit(0);
  };
  if (!existe(fichier)) { problems.push('page absente : ' + fichier); await sortir(); }
  const ouvrir = async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(versUrl(fichier).href, { waitUntil: 'load', timeout: 30000 });
    await attente(1200);
    return page;
  };
  // Les groupes, leurs « ? » et les icônes de chaque groupe, lus dans le rendu (coordonnées de page, défilement compris).
  const lecture = (page) => page.evaluate((nom) => {
    const FAMILLES = ['Floral', 'Herbacé', 'Terreux', 'Agrumes', 'Tropicaux', 'Noyau', 'Pépins', 'Baies', 'Melon', 'Résineux', 'Épicé', 'Végétal'];
    const vis = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.05) return false; } const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const sy = window.scrollY, sx = window.scrollX;
    const scroller = [...document.querySelectorAll('body *')].find((e) => e.scrollHeight > e.clientHeight + 40 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
    const boite = (els) => { const bs = els.map((e) => e.getBoundingClientRect()); return { t: Math.min(...bs.map((b) => b.top)), b: Math.max(...bs.map((b) => b.bottom)), l: Math.min(...bs.map((b) => b.left)), r: Math.max(...bs.map((b) => b.right)) }; };
    const noms = (groupe) => {
      const set = new Set();
      let famille = false;
      for (const g of groupe) {
        for (const e of g.querySelectorAll('svg[aria-label], img[alt], [role="img"], [data-famille]')) {
          const lab = (e.getAttribute('aria-label') || e.getAttribute('alt') || '').trim();
          if (/^(arômes|aromes)/i.test(lab)) { famille = true; continue; }
          if (!lab) { if (e.hasAttribute('data-famille')) famille = true; continue; }
          if (/^(style|échelle|echelle)/i.test(lab)) continue;
          set.add(lab.split(/\s*[:;]\s*/)[0]);
        }
      }
      if (famille) for (const f of FAMILLES) set.add(f);
      // Une icône déjà nommée à côté d'elle, dans le groupe (le nom de la famille près de son picto), n'attend pas la légende.
      const nn = (x) => ' ' + x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
      const ecrit = nn(groupe.map((g) => g.innerText).join(' '));
      return [...set].filter((x) => !ecrit.includes(nn(x)));
    };
    const cherche = (sels, filtre) => { for (const s of sels) { const l = [...document.querySelectorAll(s)].filter((e) => vis(e) && (!filtre || filtre(e))); if (l.length) return l; } return []; };
    const groupes = [];
    const carte = cherche(['[data-role="ligne-houblon"]'], (e) => e.innerText.toLowerCase().includes(nom.toLowerCase())).slice(0, 1);
    if (carte.length) groupes.push({ id: 'la carte de l\'ajout (' + nom + ')', els: carte });
    const rapides = cherche(['[data-role="ajout-rapide"]']);
    if (rapides.length) groupes.push({ id: 'les ajouts rapides', els: rapides });
    const familles = cherche(['[data-role="profil"]', '[data-role="panneau"]']).slice(0, 1);
    if (familles.length) groupes.push({ id: 'les familles', els: familles });
    const boutons = [...document.querySelectorAll('button, [role="button"]')].filter((e) => vis(e) && (e.textContent.trim() === '?' || /légende|legende/i.test(e.getAttribute('aria-label') || '') || e.getAttribute('data-role') === 'legende-bouton'));
    const lb = boutons.map((e, i) => { e.setAttribute('data-d113', String(i)); const b = e.getBoundingClientRect(); return { i, t: b.top, b: b.bottom, l: b.left, r: b.right, h: b.height, w: b.width, nom: (e.getAttribute('aria-label') || e.textContent).trim() }; });
    return { H: innerHeight, groupes: groupes.map((g) => ({ id: g.id, box: boite(g.els), icones: noms(g.els), contient: lb.filter((b) => g.els.some((e) => e.contains(document.querySelector('[data-d113="' + b.i + '"]')))).map((b) => b.i) })), boutons: lb, scroller: !!scroller };
  }, houblon);
  const dist = (a, b) => Math.max(0, a.t - b.b, b.t - a.b);
  let page = await ouvrir();
  const L = await lecture(page);
  await page.close();
  if (!L.groupes.length) problems.push('aucun groupe d\'icônes trouvé (carte [data-role="ligne-houblon"], ajouts rapides [data-role="ajout-rapide"], familles [data-role="profil"])');
  // Chaque « ? » va au groupe qui le contient, sinon au plus proche ; un groupe a le sien.
  const assigne = new Map();
  for (const b of L.boutons) {
    let meilleur = null;
    for (const g of L.groupes) {
      const d = g.contient.includes(b.i) ? -1 : dist(b, g.box);
      if (!meilleur || d < meilleur.d) meilleur = { g, d };
    }
    if (meilleur) { if (!assigne.has(meilleur.g.id)) assigne.set(meilleur.g.id, []); assigne.get(meilleur.g.id).push({ b, d: Math.max(0, meilleur.d) }); }
  }
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const g of L.groupes) {
    const liste = (assigne.get(g.id) || []).sort((a, c) => a.d - c.d);
    if (!liste.length) { problems.push('« ' + g.id + ' » n\'a pas de « ? » : aucun bouton de légende ne lui est le plus proche (' + L.boutons.length + ' « ? » dans l\'étape, ' + L.groupes.length + ' groupes d\'icônes)'); infos.push(g.id + ' · pas de « ? »'); continue; }
    const { b, d } = liste[0];
    const union = Math.max(g.box.b, b.b) - Math.min(g.box.t, b.t);
    if (d > L.H || union > L.H) problems.push('« ' + g.id + ' » : son « ? » est à ' + Math.round(d) + ' px et ne tient pas dans le même écran (' + Math.round(union) + ' px pour ' + L.H + ')');
    // Un toucher sur le « ? » : un texte nouveau nomme chaque icône du groupe.
    page = await ouvrir();
    await lecture(page);
    const cible = await page.evaluate((i) => { const e = document.querySelector('[data-d113="' + i + '"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, b.i);
    if (!cible) { problems.push('« ' + g.id + ' » : le « ? » n\'est plus là après rechargement'); await page.close(); continue; }
    await attente(150);
    const c2 = await page.evaluate((i) => { const r = document.querySelector('[data-d113="' + i + '"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, b.i);
    // Le texte nouveau : celui des éléments qui n'étaient pas visibles avant le toucher (le texte déjà à l'écran,
    // comme les noms des familles à côté de leurs pictos, ne compte pas comme légende).
    const marquer = () => page.evaluate(() => { document.querySelectorAll('[data-d113v]').forEach((e) => e.removeAttribute('data-d113v')); for (const e of document.querySelectorAll('body *')) { let ok = true; for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.05) { ok = false; break; } } const r = e.getBoundingClientRect(); if (ok && r.width > 0 && r.height > 0) e.setAttribute('data-d113v', '1'); } return location.hash; });
    const lireNouveau = () => page.evaluate(() => {
      const out = [];
      for (const e of document.querySelectorAll('body *')) {
        if (e.hasAttribute('data-d113v')) continue;
        let ok = true;
        for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.05) { ok = false; break; } }
        const r = e.getBoundingClientRect();
        if (!ok || r.width <= 0 || r.height <= 0) continue;
        const propre = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ') + ' ' + (e.getAttribute('aria-label') || '');
        out.push(propre.replace(/\s+/g, ' ').trim());
      }
      return { texte: out.filter(Boolean).join(' '), hash: location.hash };
    });
    const hashAvant = await marquer();
    await page.touchscreen.tap(c2.x, c2.y);
    await attente(500);
    const apres = await lireNouveau();
    const hashApres = apres.hash;
    const nouveau = apres.texte;
    const n = norm(nouveau);
    if (process.env.DEBUG_LEGENDE) console.log('LEGENDE:', nouveau);
    const manque = g.icones.filter((x) => !n.includes(norm(x)));
    infos.push(g.id + ' · « ? » à ' + Math.round(d) + ' px (« ' + b.nom + ' ») · légende ' + (nouveau ? nouveau.split(/\s+/).length + ' mots' : 'rien d\'ouvert') + ' · ' + (g.icones.length - manque.length) + '/' + g.icones.length + ' icônes nommées');
    if (hashApres !== hashAvant && !nouveau) problems.push('« ' + g.id + ' » : le « ? » change de page (' + hashApres + ') au lieu d\'ouvrir une légende');
    else if (!nouveau) problems.push('« ' + g.id + ' » : le toucher sur son « ? » n\'ouvre aucune légende (aucun texte nouveau)');
    else if (nouveau.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length < 8) problems.push('« ' + g.id + ' » : la légende ouverte tient en moins de 8 mots, elle n\'explique rien');
    else if (manque.length) problems.push('« ' + g.id + ' » : la légende ne nomme pas ' + manque.length + ' icône(s) sur ' + g.icones.length + ' : ' + manque.join(', '));
    // Les icônes restent visibles.
    const restent = await page.evaluate(() => [...document.querySelectorAll('svg, [role="img"], [data-famille]')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; }).length);
    if (restent < 4) problems.push('« ' + g.id + ' » : les icônes ont disparu à l\'ouverture de la légende (' + restent + ' visibles)');
    await page.close();
  }
  await sortir();
}
const etat = () => {
  const vis = (e) => { if (!e) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return !e.closest('[hidden]') && b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  const b = document.querySelector('[data-role="legende-bouton"]');
  const l = document.querySelector('[data-role="legende"]');
  const r = b && b.getBoundingClientRect();
  const cs = b && getComputedStyle(b);
  const m = cs && /rgba?\(([^)]+)\)/.exec(cs.backgroundColor);
  const p = m ? m[1].split(',').map(Number) : [255, 255, 255, 0];
  const fondPlein = p.length > 3 && p[3] === 0 ? false : Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]) > 40;
  return {
    bouton: !!b, boutonVu: vis(b), w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
    signes: b ? b.textContent.replace(/\s+/g, '').length : 0, fondPlein, expanded: b ? b.getAttribute('aria-expanded') : null,
    legende: !!l, legendeVue: vis(l), mots: l ? (l.innerText || '').split(/\s+/).filter((w) => /\p{L}/u.test(w)).length : 0,
  };
};
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(versUrl(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  if (temoin) await page.evaluate(() => { const l = document.querySelector('[data-role="legende"]'); if (l) { l.hidden = false; l.removeAttribute('hidden'); } });
  const a = await page.evaluate(etat);
  const f = [];
  if (!a.bouton) f.push('pas de bouton [data-role="legende-bouton"]');
  else {
    if (!a.boutonVu) f.push('bouton de légende invisible');
    if (a.w > 32 || a.h > 32) f.push('bouton de ' + a.w + ' × ' + a.h + ' px, pas discret (32 au plus)');
    if (a.signes > 1) f.push('bouton écrit (' + a.signes + ' signes)');
    if (a.fondPlein) f.push('bouton sur un fond coloré plein');
    if (a.expanded !== 'false') f.push('aria-expanded au repos : ' + a.expanded);
  }
  if (!a.legende) f.push('pas de [data-role="legende"]');
  else if (a.legendeVue) f.push('légende visible au repos');
  if (a.bouton && a.boutonVu && a.legende && !a.legendeVue) {
    await page.click('[data-role="legende-bouton"]');
    await new Promise((r) => setTimeout(r, 400));
    const o = await page.evaluate(etat);
    if (!o.legendeVue) f.push('le bouton n\'ouvre pas la légende');
    if (o.expanded !== 'true') f.push('aria-expanded ouvert : ' + o.expanded);
    if (o.legendeVue && o.mots < 8) f.push('légende de ' + o.mots + ' mots');
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));
    const e = await page.evaluate(etat);
    if (e.legendeVue) f.push('Échap ne referme pas la légende');
    console.log(id + ' · bouton ' + a.w + ' × ' + a.h + ' px · légende ' + o.mots + ' mots');
  } else console.log(id + ' · ' + f.length + ' faute(s)');
  await page.close();
  for (const x of f) problems.push(id + ' ' + pg + ' : ' + x);
}
await browser.close();
if (problems.length) { console.log('LEGENDE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('LEGENDE OK');
