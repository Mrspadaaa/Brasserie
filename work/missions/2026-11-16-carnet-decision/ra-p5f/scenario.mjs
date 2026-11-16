// Son scénario, joué de ZÉRO au doigt sur l'assemblage ra + p5f (CARNET-COEUR) :
//   node work/missions/2026-11-16-carnet-decision/ra-p5f/scenario.mjs
// proto.html?vide=1&clavier=300 : aucun carnet, aucune fixture ; chaque étape est un vrai geste (toucher, frappe, lien copié).
// 390 × 844 isMobile hasTouch, clavier simulé de 300 px. Compte touchers et frappes par étape. Écrit cap/E….png et scenario.log.
// Lien « copié dans le navigateur » : posé hors de l'app (window.__ppSim), comme une copie dans Safari ; 0 toucher compté dans l'app.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const cap = path.join(dir, 'cap');
fs.mkdirSync(cap, { recursive: true });
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
const err = [];
p.on('pageerror', (e) => err.push(String(e)));
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto('file:///' + path.join(dir, 'proto.html').split(path.sep).join('/') + '?vide=1&clavier=300', { waitUntil: 'load', timeout: 90000 });
await p.evaluate(() => document.fonts.ready);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const lignes = [], shots = [], defauts = [];
const log = (s) => { lignes.push(s); console.log(s); };
const txt = () => p.evaluate(() => document.body.innerText);
const has = (sel) => p.$(sel).then(Boolean);
let T = 0, K = 0; // touchers, frappes de l'étape en cours

// Ce que le + et les toasts couvrent ; texte sous 14 px ; texte coupé. Sondé à chaque capture.
const sonder = () => p.evaluate(() => {
  const vis = (n) => { const st = getComputedStyle(n), r = n.getBoundingClientRect(); return st.visibility !== 'hidden' && st.display !== 'none' && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
  const ov = [...document.querySelectorAll('.da-fab, .da-toast')].filter(vis);
  const leaves = [...document.querySelectorAll('#da-app *, #da-over *, #ra-dock *, .da-bot *')].filter((n) => !n.closest('#ra-kbd') && [...n.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim()) && vis(n));
  const out = [];
  ov.forEach((o) => { const R = o.getBoundingClientRect();
    leaves.forEach((n) => { if (o.contains(n)) return; const r = n.getBoundingClientRect(); const x0 = Math.max(r.left, R.left), x1 = Math.min(r.right, R.right), y0 = Math.max(r.top, R.top), y1 = Math.min(r.bottom, R.bottom);
      if (x1 - x0 < 3 || y1 - y0 < 3) return; const e = document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2);
      if (!(e && (e === o || o.contains(e)))) return; const v0 = o.style.visibility; o.style.visibility = 'hidden'; const e2 = document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2); o.style.visibility = v0; if (e2 && (e2 === n || n.contains(e2))) out.push((o.classList.contains('da-fab') ? 'couvert par + : ' : 'couvert par toast : ') + n.textContent.trim().slice(0, 30)); }); });
  leaves.forEach((n) => { const fs = parseFloat(getComputedStyle(n).fontSize); if (fs < 14 && !n.closest('.da-bot .bdg')) out.push('sous 14 px (' + fs + ') : ' + n.textContent.trim().slice(0, 30)); });
  leaves.forEach((n) => { const st = getComputedStyle(n); if ((st.textOverflow === 'ellipsis' || st.overflow === 'hidden' || st.overflowX === 'hidden') && n.scrollWidth > n.clientWidth + 1) out.push('coupé : ' + n.textContent.trim().slice(0, 30)); });
  // ra-p5f · correction : clavier ouvert, aucune ligne de la page à moitié cachée par le champ.
  const dk = document.querySelector('#ra-dock'); if (document.documentElement.classList.contains('kb') && dk && dk.firstChild) { const D = dk.getBoundingClientRect(); leaves.forEach((n) => { if (dk.contains(n)) return; const r = n.getBoundingClientRect(); if (r.top < D.top - 2 && r.bottom > D.top + 2 && r.right > D.left && r.left < D.right) out.push('chevauché par le champ : ' + n.textContent.trim().slice(0, 30)); }); }
  // l'écho au-dessus du champ ne déborde jamais (rien de coupé en haut), le titre de l'écran reste visible
  const ec = document.querySelector('html.kb .ra-echo'); if (ec && ec.scrollHeight > ec.clientHeight + 2) out.push('écho coupé : ' + (ec.scrollHeight - ec.clientHeight) + ' px');
  if (document.documentElement.classList.contains('kb') && dk && dk.firstChild) { const h = [...document.querySelectorAll('#da-app .da-h1, #da-app h1')].find((n) => n.getBoundingClientRect().height > 0); if (h && h.getBoundingClientRect().bottom > dk.getBoundingClientRect().top + 1) out.push('titre couvert : ' + h.textContent.trim().slice(0, 30)); }
  return [...new Set(out)];
});
async function snap(nom, titre) {
  await pause(180);
  const d = await sonder(); if (d.length) { defauts.push(nom + ' → ' + d.join(' | ')); console.log('  DEFAUT ' + nom + ' ' + d.join(' | ')); }
  const f = nom + '.png';
  await p.screenshot({ path: path.join(cap, f) });
  shots.push([f, titre || nom]);
}
async function tap(sel, re, parent) {
  try { return await tap1(sel, re, parent); } catch (e) { if (!/detached|absent/.test(e.message)) throw e; await pause(900); return tap1(sel, re, parent); }
}
async function tap1(sel, re, parent) {
  const ok = await p.evaluate((sel, src, parent) => {
    document.querySelectorAll('[data-pick]').forEach((n) => n.removeAttribute('data-pick'));
    const re = src ? new RegExp(src) : null;
    const el = [...document.querySelectorAll(sel)].find((n) => { const r = n.getBoundingClientRect(); const t = parent ? (n.closest(parent) || n).innerText : (n.innerText || n.textContent); return r.width > 0 && r.height > 0 && (!re || re.test(t)); });
    if (!el) return false; el.setAttribute('data-pick', '1'); return true;
  }, sel, re ? re.source : '', parent || '');
  if (!ok) throw new Error('absent ' + sel + (re ? ' ' + re : ''));
  const e = await p.$('[data-pick="1"]');
  const ou = await e.evaluate((n) => (n.closest('#ra-dock') ? 'dock' : n.closest('.da-sheet') ? 'sheet' : 'page'));
  if (ou === 'page') { await p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur()); await pause(80); }
  if (ou !== 'dock') await e.evaluate((n) => n.scrollIntoView({ block: 'center' }));
  await e.tap(); T++; await pause(240);
}
const fermer = async () => { await p.touchscreen.tap(195, 30); T++; await pause(240); if (await has('.da-sheet')) throw new Error('feuille restée ouverte'); };
// Le champ en saisie reste au-dessus du clavier (CARNET-CLAV) : vérifié à chaque frappe.
const clav = async (quoi) => {
  const m = await p.evaluate(() => { const a = document.activeElement; if (!a || !/INPUT|TEXTAREA/.test(a.tagName)) return null; const r = a.getBoundingClientRect(), kb = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kb')) || 0; return { id: a.id, haut: Math.round(r.top), bas: Math.round(r.bottom), limite: innerHeight - kb, kb }; });
  if (m && (m.kb === 0 || m.bas > m.limite || m.haut < 0)) defauts.push('clavier ' + quoi + ' : ' + JSON.stringify(m));
  return m;
};
async function ecrire(sel, t, entrer = true, vider = false) {
  const e = await p.$(sel); if (!e) throw new Error('absent ' + sel);
  if (vider) await e.evaluate((n) => { n.value = ''; });
  const deja = await e.evaluate((n) => n === document.activeElement);
  if (!deja) { const dock = await e.evaluate((n) => !!n.closest('#ra-dock')); if (!dock) await e.evaluate((n) => n.scrollIntoView({ block: 'center' })); await e.tap(); T++; await pause(140); }
  await p.keyboard.type(t); K += [...t].length; await clav(sel);
  if (entrer) { await p.keyboard.press('Enter'); K++; await pause(300); }
}
const coller = async (url) => {
  await p.evaluate((u) => { window.__ppSim = u; }, url); // copié dans le navigateur, hors de l'app
  const f = await p.evaluate(() => document.activeElement && document.activeElement.id);
  if (f !== 'da-note') { await (await p.$('#da-note')).tap(); T++; await pause(160); }
  await tap('#ra-dock [data-act=coller]'); await pause(1150); await clav('coller');
};
const bilan = [];
async function etape(n, nom, fn) {
  T = 0; K = 0;
  let r; try { r = await fn(); } catch (e) { r = e.message.split('\n')[0]; }
  const ok = r === true;
  bilan.push({ n, nom, ok, T, K });
  log('ETAPE ' + n + ' ' + (ok ? 'OK' : 'ECHEC ' + (r || 'condition fausse')) + ' — ' + nom + ' · ' + T + ' touchers, ' + K + ' frappes');
}
const premiereLigne = () => p.evaluate(() => { const k = document.querySelector('.ra-tables .da-k'); const r = k && k.querySelector('.ra-r .n'); return k ? k.getAttribute('data-table') + ' | ' + (r ? r.innerText : '') : ''; });
const lisible = () => p.evaluate(() => {
  const W = document.documentElement.clientWidth, sw = document.scrollingElement.scrollWidth;
  const coupes = [...document.querySelectorAll('.ra-tables .ra-rl .n, .ra-tables .ra-rl .v')].filter((n) => n.getBoundingClientRect().width && (n.scrollWidth > n.clientWidth + 1 || n.getBoundingClientRect().right > W + 0.5)).length;
  return { W, sw, coupes };
});
const tuile = (act) => p.evaluate((a) => { const n = document.querySelector('[data-act=' + a + '].da-pz .n'); return n ? +n.innerText : -1; }, act);
const voirDispo = async () => { await p.waitForFunction(() => { const q = document.querySelector('.da-sheet .da-q'); return q && q.innerText.length > 20; }, { timeout: 5000 }); await p.evaluate(() => { const q = document.querySelector('.da-sheet .da-q'), sh = document.querySelector('.da-sheet'); if (q && sh) sh.scrollTop = Math.max(0, q.offsetTop - 260); }); };
const reponse = () => p.evaluate(() => { const q = document.querySelector('.rp-ans .rp-at'); return q ? q.innerText : ''; });
const haut = () => p.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });

// ================= Embouteillage, de zéro =================
await etape(0, 'carnet vide, aucune donnée', async () => { await pause(500); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await pause(120); const t = await txt(); await snap('E00-vide', 'E0 · rien : au repos, le + est le seul bouton plein'); return !(await has('.da-card')) && /Aucun carnet/.test(t) || 'liste non vide'; });
await etape(1, 'créer l’idée « embouteillage »', async () => {
  const repos = await p.evaluate(() => { const g = document.querySelector('#ra-dock .da-go'); return g ? getComputedStyle(g).display : 'absent'; });
  await ecrire('#da-neuf', 'embouteillage', false);
  const tape = await p.evaluate(() => { const g = document.querySelector('#ra-dock .da-go'); return g ? getComputedStyle(g).display : 'absent'; });
  await snap('E01a-idee-tapee', 'E1 · idée tapée : la flèche d’envoi paraît');
  await p.keyboard.press('Enter'); K++; await pause(300);
  const t = await txt(); await snap('E01b-carnet-cree', 'E1 · Entrée : le carnet est créé, l’IA propose quoi comparer');
  return repos === 'none' && tape !== 'none' && /Embouteillage/.test(t) && /Je propose 8 caractéristiques/.test(t) || JSON.stringify({ repos, tape });
});
await etape(2, 'façon « gravité », avec ce qu’il en pense', async () => {
  await ecrire('#da-note', 'gravité, vu chez un collègue, pas mal');
  const t = await txt(); await snap('E02-gravite', 'E2 · façon Gravité rangée');
  return /façon Gravité/.test(t) && /Ensuite : d'autres façons \?/.test(t) && !/coller des liens/.test(t) || 'Ensuite faux';
});
await etape(3, 'façon « isobarique »', async () => {
  await ecrire('#da-note', 'isobarique : plus cher, mais capte moins d’oxygène');
  const t = await txt(); await snap('E03-iso', 'E3 · façon Isobarique rangée');
  return /façon Isobarique/.test(t) && /Ensuite : trancher entre Gravité et Isobarique/.test(t) || '« Ensuite » faux';
});
await etape(4, 'critère « minimiser l’oxygène » ; l’IA penche pour Isobarique', async () => {
  await ecrire('#da-note', 'il faut minimiser l’oxygène');
  await snap('E04a-propose', 'E4 · l’IA propose d’en faire le critère');
  await tap('#ra-dock [data-act=crit]');
  const pleins = await p.evaluate(() => [...document.querySelectorAll('#ra-dock .da-sug .da-b.p')].map((b) => b.innerText.trim()));
  const t = await txt(); await snap('E04b-critere', 'E4 · critère en tête ; « Retenir Isobarique » seul bouton plein');
  return /Critère qui oriente : minimiser l’oxygène/.test(t) && pleins.length === 1 && /Retenir Isobarique/.test(pleins[0]) || JSON.stringify(pleins);
});
await etape(5, 'retenir Isobarique, avec son pourquoi', async () => {
  await tap('#ra-dock [data-act=retenir]', /Isobarique/);
  await snap('E05a-pourquoi', 'E5 · « Retenir Isobarique plutôt que Gravité : pourquoi ? »');
  await ecrire('#da-pz', 'iso plus cher, mais bien moins d’O2 capté');
  await haut();
  const fl = await p.evaluate(() => [...document.querySelectorAll('.rp-fac .rp-fl')].map((n) => n.className.replace('rp-fl ', '') + ':' + n.innerText.replace(/\n/g, ' / ')));
  await snap('E05b-retenue', 'E5 · tuile Façons : Gravité barrée et sa raison, Isobarique retenue et son pourquoi');
  return fl.length === 2 && /^ecartee:Gravité \/ moins bien pour « minimiser l’oxygène »/.test(fl[0]) && /^retenue:Isobarique \/ iso plus cher/.test(fl[1]) || JSON.stringify(fl);
});
await etape(6, 'noter une recherche', async () => {
  await ecrire('#da-note', 'salon de Berne : 3 isobariques vus, demander une démo au revendeur romand');
  const t = await txt(); await snap('E06-note', 'E6 · note de recherche');
  return /salon de Berne/.test(t) || 'note absente';
});
const ISO = ['https://www.brasserie-shop-valais.ch/isobarique-2-becs', 'https://brassage-romandie.ch/iso-4-semi-auto', 'https://brassage-romandie.ch/iso-4-pre-evacuation', 'https://abfuelltechnik-west.de/iso4-vorevakuierung', 'https://imbottigliatrici-nord.it/monoblocco-6', 'https://brew-equip-lyon.fr/isobare-4-compact'];
for (let i = 0; i < ISO.length; i++) {
  await etape(7 + i, 'coller le lien ' + (i + 1) + ' (' + ISO[i].split('/')[2] + ')', async () => {
    await coller(ISO[i]);
    const ia = await p.evaluate(() => { const n = [...document.querySelectorAll('#ra-dock .ra-lus')].pop(); return n ? n.innerText : ''; });
    const bulles = await p.evaluate(() => [...document.querySelectorAll('.da-ia')].filter((n) => /Lu sur la page|non publiée/.test(n.innerText)).length);
    if (i === 0) await snap('E07a-puce-coller', 'E7 · la puce « Coller le lien copié » au-dessus du clavier, lien 1 lu');
    if (i === 5) await snap('E12-lien6', 'E12 · lien 6 lu');
    const t = await txt();
    return /^\d+ valeurs( · \d+ \?)?$/.test(ia) && bulles === 0 && !/Brasserie-Shop|Romandie|Abfüll|Imbottig|Brew Equip|CHF/.test(ia) && !/Lien sans aperçu/.test(t) || 'IA : ' + ia;
  });
}
await etape('7-12', 'les 6 articles : 5 fournisseurs, 4 pays', async () => {
  await tap('[data-act=articles]'); const t = await p.$eval('.da-sheet', (n) => n.innerText);
  await snap('E12b-articles', 'E7-12 · les 6 articles, aperçu et veille');
  const f = new Set((t.match(/Brasserie-Shop Valais|Revendeur Brassage Romandie|Abfülltechnik West|Imbottigliatrici Nord|Brew Equip Lyon/g) || [])), l = new Set((t.match(/· (CH|DE|IT|FR)\b/g) || []));
  await fermer();
  const ens = await p.evaluate(() => (document.querySelector('#da-app .da-choix.wait') || {}).innerText || '');
  if (/minimiser/.test(ens)) return 'Ensuite redit le critère : ' + ens;
  return (await tuile('articles')) === 6 && f.size >= 4 && l.size >= 3 || 'fournisseurs ' + f.size + ', pays ' + l.size;
});
await etape(13, 'caractéristiques de l’IA gardées, une à soi', async () => {
  await tap('[data-act=comparer]');
  await snap('E13a-proposees', 'E13 · 8 proposées pour embouteillage');
  if (/Toucher un titre/.test(await txt())) return 'mode d’emploi dans la bande';
  await tap('.da-sug[data-s=carac] .da-chip .x', /Formats/, '.da-chip');
  await tap('[data-act=toutgarder]');
  await tap('[data-act=ajcarac]');
  await ecrire('#da-k', 'Pièces d’usure en Suisse');
  await tap('[data-table="Pièces d’usure en Suisse"] [data-act=iaval]');
  const t = await txt(); await snap('E13b-a-vous', 'E13 · gardées + « à vous », remplie par l’IA');
  return /à vous/.test(t) && /valeurs? trouvée/.test(t) || 'ajout absent';
});
await etape(14, 'comparer sur l’oxygène puis le prix, noms courts', async () => {
  await tap('[data-act=kfocus]', /Oxygène/);
  const a = await premiereLigne(), la = await lisible();
  const rep = await p.evaluate(() => [...document.querySelectorAll('.ra-tables .da-k.foc .ra-rl .n')].filter((n) => /isobarique/i.test(n.innerText)).length);
  await snap('E14a-oxygene', 'E14 · classé par oxygène, « Isobarique » n’est plus répété');
  await tap('[data-act=kfocus]', /^Prix/);
  const b = await premiereLigne(), lb = await lisible(); await snap('E14b-prix', 'E14 · classé par prix');
  return /^Oxygène capté \| 4 becs pré-évacuation · CH/.test(a) && /^Prix \| 2 becs de table/.test(b) && rep === 0 && la.sw <= la.W && lb.sw <= lb.W && !la.coupes && !lb.coupes || JSON.stringify({ a, b, rep, la, lb });
});
await etape(15, 'demander à l’IA si c’est disponible', async () => {
  await tap('[data-act=kfocus]', /Oxygène/);
  await tap('.da-k.foc .ra-r[data-act=article]', /pré-évacuation · CH/);
  await tap('.da-sheet [data-act=dispo]'); await voirDispo();
  const r = await p.evaluate(() => (document.querySelector('.da-sheet .da-q') || {}).innerText || '');
  await snap('E15-dispo', 'E15 · disponibilité (IA, exemple)');
  return /sur commande/.test(r) && /Abfülltechnik West \(DE\)/.test(r) || 'réponse : ' + r;
});
await etape(16, 'choisir produit et fournisseur, pourquoi coché (0 frappe)', async () => {
  await tap('.da-sheet [data-act=choisir]');
  const kb = await p.evaluate(() => !!document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName));
  const props = await p.evaluate(() => [...document.querySelectorAll('.da-sheet [data-act=rzc]')].map((n) => n.innerText.trim()));
  await snap('E16a-choisi', 'E16 · choisi d’un toucher : le pourquoi proposé, à cocher');
  await tap('.da-sheet [data-act=rzc]', /oxygène capté 40 ppb, le plus bas/);
  await tap('.da-sheet [data-act=rzc]', /SAV et pièces en Suisse/);
  const coch = await p.evaluate(() => [...document.querySelectorAll('.da-sheet [data-act=rzc][aria-checked=true]')].map((n) => n.innerText.trim()));
  await p.evaluate(() => { const sh = document.querySelector('.da-sheet'); sh.scrollTop = 0; });
  await snap('E16b-coche', 'E16 · deux raisons cochées');
  await p.evaluate(() => { const n = document.querySelector('.da-sheet .rp-ec'), sh = document.querySelector('.da-sheet'); if (n && sh) sh.scrollTop = Math.max(0, n.offsetTop - 120); });
  const ec = await p.evaluate(() => [...document.querySelectorAll('.da-sheet .rp-ec .rp-r')].map((n) => n.innerText));
  await snap('E16c-ecartes', 'E16 · les 5 écartés gardent leur raison, lue dans les tableaux');
  await tap('.da-sheet .ra-keep [data-act=fermer]');
  await tap('.da-back[data-act=carnet]'); await haut();
  const t = await txt();
  await snap('E16d-carte', 'E16 · carte de décision : pourquoi, et « Envoyer dans À venir »');
  await tap('[data-act=avenir-oui]');
  const t2 = await txt(), toast = await has('.da-toast');
  await snap('E16e-a-venir', 'E16 · envoyé dans À venir, sans toast');
  return !kb && K === 0 && props.length >= 2 && !props.some((x) => /demander/.test(x)) && coch.length === 2 && ec.length === 5 && !ec.some((r) => /sans raison/.test(r)) && /Pourquoi : oxygène capté 40 ppb, le plus bas, SAV et pièces en Suisse/.test(t) && /Envoyer dans À venir/.test(t) && /Dans À venir depuis le 16\snov\./.test(t2) && !toast || JSON.stringify({ kb, K, props, coch, ec, toast });
});
await etape(17, 'plus tard : la liste, puis pourquoi iso', async () => {
  await tap('.da-back[data-act=liste]');
  const l = await p.evaluate(() => (document.querySelector('.da-card .da-cl2') || {}).innerText || '');
  await snap('E17a-liste', 'E17 · plus tard, la liste : choix, fournisseur et pays, pourquoi');
  await tap('[data-act=ouvrir]', /Embouteillage/); await tap('.da-choix[data-act=decisions]');
  await snap('E17b-fiche', 'E17 · la fiche du choix : pourquoi coché, écartés');
  await tap('[data-act=qq][data-t*=façon]');
  const r = await reponse(); await haut(); await snap('E17c-pourquoi-iso', 'E17 · « Pourquoi cette façon ? » : réponse datée, en tête');
  return /Revendeur Brassage Romandie \(CH\)/.test(l) && !/CHF de moins/.test(l) && /16\snov/.test(r) && /Isobarique/.test(r) && /O2/.test(r) && /Gravité/.test(r) || JSON.stringify({ l, r });
});
await etape(18, 'pourquoi ce fournisseur', async () => {
  await tap('[data-act=qq][data-t*=fournisseur]');
  const r = await reponse(); await haut(); await snap('E18-pourquoi-fournisseur', 'E18 · « Pourquoi ce fournisseur ? » : relit les raisons cochées');
  return /16\snov/.test(r) && /Revendeur Brassage Romandie \(CH\)/.test(r) && /SAV et pièces en Suisse/.test(r) && /Abfülltechnik West/.test(r) && /900 CHF de plus/.test(r) || 'réponse : ' + r;
});


// Ventilation, comme le dit CADRE.md : critère écrit avec ses mots (« plus de condensation au plafond »), cinq liens dont un
// sans aperçu, « consommation » retirée, rien de choisi, note « attendre l'avis du ferblantier ».
async function ventil() {
  const id = 'E20';
  await etape('20.1', 'ventilation : créer l’idée', async () => {
    if (await has('.da-back[data-act=carnet]')) await tap('.da-back[data-act=carnet]');
    if (await has('.da-back[data-act=liste]')) await tap('.da-back[data-act=liste]');
    await ecrire('#da-neuf', 'ventilation de la salle de brassage');
    const t = await txt(); await snap(id + 'a-idee', id + ' · ventilation de la salle de brassage créée');
    return /Catégorie : ventilation/.test(t) && /Tenue à l’humidité|Tenue à l'humidité/.test(t) || 'catégorie absente';
  });
  await etape('20.2', 'ventilation : deux façons', async () => {
    await tap('[data-act=facons]'); await ecrire('#da-nf', 'Hotte inox + extracteur'); await ecrire('#da-nf', 'Extracteur mural seul'); await fermer(); await haut();
    const e = await p.evaluate(() => { const n = document.querySelector('#da-app .da-choix.wait'); return n ? n.getAttribute('data-act') + '|' + n.innerText : ''; });
    return /^ecrirecrit\|/.test(e) && /trancher entre Hotte inox \+ extracteur et Extracteur mural seul/.test(e) && !/dites ce qui compte/.test(e) || 'Ensuite : ' + e;
  });
  await etape('20.3', 'ventilation : toucher Ensuite, écrire ce qui compte avec ses mots', async () => {
    await tap('#da-app .da-choix[data-act=ecrirecrit]');
    const ph = await p.evaluate(() => { const a = document.activeElement; return a && a.id === 'da-note' ? a.placeholder : ''; });
    await ecrire('#da-note', 'plus de condensation au plafond');
    const sg = await p.$eval('#ra-dock', (n) => n.innerText);
    await snap(id + 'b-critere-propose', id + ' · « plus de condensation au plafond » : en faire le critère ?');
    await tap('#ra-dock [data-act=crit]'); await haut();
    const t = await txt(), tu = await p.evaluate(() => (document.querySelector('[data-act=comparer].da-pz') || {}).innerText || '');
    await snap(id + 'c-critere', id + ' · critère en tête ; Comparer : 6 proposées, 1 gardée');
    return /Ce qui compte/.test(ph) && /critère qui oriente/.test(sg) && /Capte la buée à la source/.test(sg) && /Critère qui oriente : plus de condensation au plafond/.test(t) && /7\s+6 proposées · 1 gardée/.test(tu) || JSON.stringify({ ph, sg: sg.slice(0, 200), tu });
  });
  await etape('20.4', 'ventilation : cinq liens, un sans aperçu', async () => {
    for (const u of ['https://inox-ventil.ch/hotte-120', 'https://lueftung-profi.de/haube-100', 'https://ventil-express.ch/helicoide-mural', 'https://lueftung-profi.de/wandluefter-300', 'https://www.ferblanterie-gex.ch/devis-hotte-brasserie']) await coller(u);
    const t = await txt(); await snap(id + 'd-liens', id + ' · cinq liens ; celui sans aperçu porte le nom de son site');
    return (await tuile('articles')) === 5 && /ferblanterie-gex\.ch/.test(t) && !/Lien sans aperçu/.test(t) || 'articles ' + (await tuile('articles'));
  });
  await etape('20.5', 'ventilation : comparer, « consommation » retirée', async () => {
    await haut(); await tap('[data-act=comparer]'); await tap('[data-act=toutgarder]');
    await tap('.da-chips.sm .da-chip .x', /Consommation/, '.da-chip');
    await tap('[data-act=kfocus]', /^Débit/);
    const m = await p.evaluate(() => { const ks = [...document.querySelectorAll('.ra-tables .da-k')]; return { tables: ks.map((k) => k.getAttribute('data-table')), rt: ks.map((k) => k.querySelectorAll('.rt').length), txt: document.body.innerText }; });
    const la = await lisible(); await p.evaluate(() => { const k = document.querySelector('.ra-tables .da-k.foc'); if (k) window.scrollTo(0, k.getBoundingClientRect().top + window.scrollY - 70); });
    await snap(id + 'e-critere', id + ' · classé par débit ; les liens sans valeurs en une ligne');
    return !m.tables.includes('Consommation') && m.tables.includes('Débit') && m.rt.every((n) => n === 1) && /ferblanterie-gex\.ch · sans valeurs/.test(m.txt) && !/Lien sans aperçu/.test(m.txt) && la.sw <= la.W && !la.coupes || JSON.stringify({ tables: m.tables, rt: m.rt, la });
  });
  await etape('20.6', 'ventilation : rien de choisi, « attendre l’avis du ferblantier »', async () => {
    await tap('.da-back[data-act=carnet]');
    await ecrire('#da-note', 'attendre l’avis du ferblantier');
    await snap(id + 'f-attente', id + ' · la note d’attente est rangée');
    await haut();
    const e = await p.evaluate(() => (document.querySelector('#da-app .da-choix.wait') || {}).innerText || ''), st = await p.evaluate(() => (document.querySelector('#da-app .da-st') || {}).innerText || '');
    await snap(id + 'g-carnet', id + ' · au repos : Ensuite, attendre l’avis du ferblantier');
    return /Ensuite : attendre l’avis du ferblantier/.test(e) && /compare/.test(st) || JSON.stringify({ e, st });
  });
  await etape('20.7', 'ventilation : la ligne de la liste', async () => {
    await tap('.da-back[data-act=liste]');
    const l = await p.evaluate(() => { const c = [...document.querySelectorAll('.da-card')].find((n) => /Ventilation/.test(n.innerText)); return c ? c.innerText : ''; });
    await snap(id + 'h-liste', id + ' · la liste : la ventilation attend le ferblantier');
    return /attendre l’avis du ferblantier/.test(l) && !/dites ce qui compte/.test(l) || 'ligne : ' + l;
  });
}
// ================= Le même, de zéro : frigo, ventilation, évier =================
async function courte(n, o) {
  const id = 'E' + n;
  await etape(n + '.1', o.titre + ' : créer l’idée', async () => {
    if (await has('.da-back[data-act=carnet]')) await tap('.da-back[data-act=carnet]');
    if (await has('.da-back[data-act=liste]')) await tap('.da-back[data-act=liste]');
    await ecrire('#da-neuf', o.titre);
    const t = await txt(); await snap(id + 'a-idee', id + ' · ' + o.titre + ' créé');
    return new RegExp('Catégorie : ' + o.cat).test(t) || 'catégorie absente';
  });
  await etape(n + '.2', o.titre + ' : deux façons', async () => {
    if (o.facons === 'ia') await tap('[data-act=iafacons]');
    else if (o.facons === 'sheet') { await tap('[data-act=facons]'); await ecrire('#da-nf', o.f1); await ecrire('#da-nf', o.f2); await fermer(); }
    else { await ecrire('#da-note', o.n1); await ecrire('#da-note', o.n2); }
    const t = await p.evaluate(() => [...document.querySelectorAll('.rp-fac .rp-fl')].map((n) => n.innerText).join(' | '));
    return o.re1.test(t) && o.re2.test(t) || 'façons : ' + t;
  });
  await etape(n + '.3', o.titre + ' : critère, façon retenue avec pourquoi', async () => {
    await ecrire('#da-note', o.crit);
    await snap(id + 'b-critere-propose', id + ' · critère proposé, relié à une caractéristique');
    const sg = await p.$eval('#ra-dock', (n) => n.innerText);
    await tap('#ra-dock [data-act=crit]');
    const pleins = await p.evaluate(() => [...document.querySelectorAll('#ra-dock .da-sug .da-b.p')].map((b) => b.innerText.trim()));
    if (o.facons === 'sheet') { await tap('[data-act=facons]'); await tap('.da-sheet [data-act=fetat][data-e=retenue]', o.re1, '.da-k'); }
    else await tap('#ra-dock [data-act=retenir]', o.re1);
    await ecrire('#da-pz', o.pq0);
    await haut();
    const fl = await p.evaluate(() => [...document.querySelectorAll('.rp-fac .rp-fl')].map((n) => n.className.replace('rp-fl ', '') + ':' + n.innerText.replace(/\n/g, ' / ')));
    await snap(id + 'c-retenue', id + ' · critère en tête, façons avec leur pourquoi');
    return (!o.relie || o.relie.test(sg)) && pleins.length === 1 && o.re1.test(pleins[0]) && fl.some((x) => /^retenue:/.test(x) && o.re1.test(x)) && fl.some((x) => /^ecartee:/.test(x)) || JSON.stringify({ sg: sg.slice(0, 160), pleins, fl });
  });
  await etape(n + '.4', o.titre + ' : ' + o.liens.length + ' liens collés', async () => {
    for (const u of o.liens) await coller(u);
    const t = await txt(); await snap(id + 'd-liens', id + ' · liens lus');
    return (await tuile('articles')) === o.liens.length && !/Lien sans aperçu/.test(t) || 'articles ' + (await tuile('articles'));
  });
  await etape(n + '.5', o.titre + ' : comparer sur le critère puis le prix', async () => {
    await tap('[data-act=comparer]'); await tap('[data-act=toutgarder]');
    await tap('[data-act=kfocus]', o.kcrit); const a = await premiereLigne(), la = await lisible();
    const bacs = await p.evaluate(() => { const k = document.querySelector('[data-table="Bacs"] .da-kh small'); return k ? k.innerText : ''; });
    await snap(id + 'e-critere', id + ' · classé par le critère');
    await tap('[data-act=kfocus]', /^Prix/); const b = await premiereLigne(), lb = await lisible();
    return a.includes(o.best1) && b.startsWith('Prix') && la.sw <= la.W && lb.sw <= lb.W && !la.coupes && !lb.coupes && !/plus = mieux/.test(bacs) || JSON.stringify({ a, b, bacs, la, lb });
  });
  await etape(n + '.6', o.titre + ' : disponibilité par l’IA', async () => {
    await tap('[data-act=kfocus]', o.kcrit);
    await tap('.da-k.foc .ra-r[data-act=article]', o.rowChoix); await tap('.da-sheet [data-act=dispo]'); await voirDispo();
    const r = await p.evaluate(() => (document.querySelector('.da-sheet .da-q') || {}).innerText || ''); await snap(id + 'f-dispo', id + ' · disponibilité (IA, exemple)');
    return /chez/.test(r) && r.length > 20 || 'réponse : ' + r;
  });
  await etape(n + '.7', o.titre + ' : choisir, pourquoi coché', async () => {
    await tap('.da-sheet [data-act=choisir]');
    const props = await p.evaluate(() => [...document.querySelectorAll('.da-sheet [data-act=rzc]')].map((n) => n.innerText.trim()));
    for (const re of o.coches) { try { await tap('.da-sheet [data-act=rzc]', re); } catch (e) { return 'proposé : ' + props.join(' | '); } }
    await p.evaluate(() => { document.querySelector('.da-sheet').scrollTop = 0; });
    await snap(id + 'g-choisi', id + ' · choisi, pourquoi coché');
    const ec = await p.evaluate(() => [...document.querySelectorAll('.da-sheet .rp-ec .rp-r')].map((n) => n.innerText));
    return K === 0 && props.length >= 2 && ec.length >= 1 && !ec.some((r) => /sans raison/.test(r)) || JSON.stringify({ props, ec });
  });
  await etape(n + '.7b', o.titre + ' : piège — un pourquoi tapé que les tableaux contredisent', async () => {
    await ecrire('#rp-mien', o.faux);
    const faux = await p.evaluate(() => { const n = document.getElementById('rp-faux'); return n && !n.hidden ? n.innerText : ''; });
    await p.evaluate(() => { document.activeElement && document.activeElement.blur(); const n = document.getElementById('rp-faux'), sh = document.querySelector('.da-sheet'); if (n && sh) sh.scrollTop = Math.max(0, n.offsetTop - 300); });
    await snap(id + 'g1-faux', id + ' · « ' + o.faux + ' » : vos tableaux disent l’inverse');
    await p.evaluate(() => { document.getElementById('rp-mien').value = ''; });
    await tap('.da-sheet .ra-keep [data-act=fermer]');
    return /inverse/.test(faux) && o.reFaux.test(faux) || 'message : ' + faux;
  });
  await etape(n + '.8', o.titre + ' : retrouver pourquoi', async () => {
    await tap('.da-back[data-act=carnet]'); await haut(); await tap('.da-choix[data-act=decisions]');
    await tap('[data-act=qq][data-t*=façon]'); const r1 = await reponse();
    await tap('[data-act=qq][data-t*=fournisseur]'); const r2 = await reponse();
    await haut(); await snap(id + 'h-pourquoi', id + ' · « Pourquoi ce fournisseur ? »');
    return o.re1.test(r1) && /16\snov/.test(r1) && o.reFourn.test(r2) && /16\snov/.test(r2) || 'réponses : ' + r1 + ' / ' + r2;
  });
}
await courte(19, { titre: 'frigo de garde pour fûts', cat: 'froid', facons: 'notes', n1: 'chambre froide en kit, à monter nous-mêmes', n2: 'frigo vitrine pro, plus simple à poser', re1: /Chambre froide/, re2: /vitrine/, crit: 'il faut tenir 2 °C stable en été', relie: /Température ambiante max/, pq0: 'une vitrine décroche au-delà de 32 °C ambiants', liens: ['https://froid-riviera.ch/chambre-kit-2m3', 'https://celle-sud.it/cella-kit-2-5', 'https://gastro-froid.ch/vitrine-700'], kcrit: /Température/, best1: 'Chambre froide en kit 2 m³', rowChoix: /2 m³/, coches: [/température ambiante max 43/, /SAV et pièces en Suisse/], faux: 'le plus de fûts', reFaux: /30.*38/, reFourn: /Froid Service Riviera \(CH\)/ });
await ventil();
await courte(21, { titre: 'évier inox pour laver les fûts', cat: 'évier', facons: 'ia', re1: /sur pieds/, re2: /à poser/, crit: 'il faut maximiser la profondeur de bac pour les fûts', pq0: 'un fût de 30 L doit tenir couché dans le bac', liens: ['https://inox-pro-fribourg.ch/evier-2-bacs', 'https://gastro-inox-discount.de/spuele-standfuss', 'https://equip-brasserie-annecy.fr/plonge-1-bac'], kcrit: /Profondeur/, best1: 'Sur pieds 1 grand bac', rowChoix: /1 grand bac/, coches: [/profondeur de bac 60/, /douchette/], faux: 'le moins cher', reFaux: /1.?190.*890/, reFourn: /Équip Brasserie Annecy \(FR\)/ });

await nav.close();
const ko = bilan.filter((b) => !b.ok);
log('DEFAUTS ' + defauts.length + (defauts.length ? '\n  ' + defauts.join('\n  ') : ''));
log('BILAN ' + bilan.map((b) => b.n + ':' + b.T + 't/' + b.K + 'f').join(' '));
const fin = (err.length ? 'ERREURS DE PAGE\n' + err.join('\n') + '\n' : '') + (ko.length || err.length || defauts.length ? 'COEUR ECHEC (' + ko.length + ' étapes, ' + defauts.length + ' défauts)' : 'COEUR OK (' + bilan.length + ' étapes, ' + shots.length + ' captures)');
console.log(fin);
fs.writeFileSync(path.join(dir, 'scenario.log'), lignes.join('\n') + '\n' + fin + '\n');
fs.writeFileSync(path.join(dir, 'bilan.json'), JSON.stringify({ bilan, shots, defauts }, null, 1));
