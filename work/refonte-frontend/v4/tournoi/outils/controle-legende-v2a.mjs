#!/usr/bin/env node
// D140 (24.10, nuit ; règle n° 1) : la légende sous les pastilles est leg3-v2a telle quelle, avec seulement la petite
// barre de v2e. Le brasseur, sur sa capture de la carte ouverte de Nugget dans v2a : « Je veux qqch comme ça moi ???? » ;
// avant : « Légende vraiment bien, avec icône sans full text, bonne infos ciblé mais barre comme leg3-v2e ». La v2f
// intégrée le 24.10 avait replié les spéciaux dans une pastille (« ◇ 2 hors des 12 · 3 mots précis · huiles › ») : c'était
// le nom d'une vignette lu comme une consigne. Témoin négatif : la construction de HEAD 3d54871f → LEGENDE-V2A ECHEC.
// Référence : work/refonte-frontend/v4/ecran-1/fils24-legendes/leg3/v2a.html, captures/leg3-v2a.png et leg3-v2e.png.
// Critères (tous joués, sans arrêt au premier échec, M16), sur la page <dossier>/ma-biere/etat.html, à 390 × 844 :
//   V1 : un toucher sur la bande (et rien d'autre) l'ouvre ; sur la carte de Nugget du rail et sur l'ajout proposé
//        Motueka, les lignes de v2a sont visibles : mots précis avec le picto de leur famille ; ◇ et ses mots avec leurs
//        sources ; linalol, thiols, géraniol « ? » ; huiles et leur source ; la clé « fiches qui la disent · en tête d'une
//        fiche » ; sur l'ajout proposé, « si ajouté à 10′ : … » ;
//   V2 : aucune pastille ni bouton replié du genre « hors des 12 · n mots précis · huiles › » (au repos ni ouvert) ;
//   V3 : l'ordre de v2a, de haut en bas : bande, mots, ◇, fiches, huiles, clé, puis la rangée marquée, citée, non
//        décrite, « ? », « Sans X › » (sur la carte ; sur l'ajout, la rangée des tons seule) ;
//   V4 : sous chaque picto de la bande ouverte, une seule barre de v2e (piste et remplissage n/N), jamais des segments ;
//   V5 (25.10, « Fais ce que v2a fait ») : pour Nugget et Motueka, le texte de la ligne des mots, de la ligne ◇ et des
//        fiches (linalol, thiols, géraniol, puis huiles et leur source) est celui de fils24-legendes/leg3/v2a.html, aux
//        espaces près (pas de « Pineapple » à côté d'« ananas », « Hopsteiner US », « thiols moyens »).
// Usage : node controle-legende-v2a.mjs <dossier construit> → « LEGENDE-V2A OK » ou « LEGENDE-V2A ECHEC n » et chaque faute.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { versUrl, existe } from './lib/cible.mjs';

const dir = path.resolve(process.argv[2] || '');
const page = path.join(dir, 'ma-biere', 'etat.html');
if (!process.argv[2] || !existe(page)) { console.log('Usage : node controle-legende-v2a.mjs <dossier construit> (ma-biere/etat.html introuvable)'); process.exit(2); }
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const fautes = [];

// V5 : les lignes de référence, lues dans v2a.html (Nugget : le bloc de la carte ; Motueka : celui de sa ligne).
const sansEsp = (t) => (t || '').replace(/\s+/g, '');
const V2A = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../ecran-1/fils24-legendes/leg3/v2a.html');
const ref = {};
{
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await p.goto(versUrl(V2A).href, { waitUntil: 'networkidle0', timeout: 30000 });
  Object.assign(ref, await p.evaluate(() => {
    const lire = (bloc) => { const l = [...bloc.querySelectorAll(':scope > .x2-ligne')].map((e) => e.textContent); return { mots: l[0], sans: l[1], fiches: l[2] }; };
    return { 'carte Nugget': lire(document.querySelector('[data-houblon-ligne="beermaverick-nugget"] .x2-bloc')), 'ajout Motueka': lire(document.querySelector('#lg3-ajouts .x2-bloc')) };
  }));
  await p.close();
}

// Les deux cas : le groupe, sa bande au repos, ce qu'il doit dire, et si la rangée « ? » / « Sans X › » suit.
const CAS = [
  { nom: 'carte Nugget', groupe: '[data-element="etape-carte-ajout"][data-houblon-ligne="beermaverick-nugget"]', bande: '[aria-label="Arômes de Nugget"]',
    mots: ['ananas', 'géranium', 'woody'], sans: ['gingembre', 'Beer Maverick'], sansX: 'Sans Nugget', siAjoute: false },
  { nom: 'ajout Motueka', groupe: '[data-houblon-ajout="beermaverick-motueka"]', bande: '[aria-label="Arômes de Motueka"]',
    mots: ['citron vert'], sans: ['mojito', 'Beer Maverick'], sansX: null, siAjoute: true },
];

for (const cas of CAS) {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(versUrl(page).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 700));
  const f = (m) => fautes.push(`${cas.nom} : ${m}`);
  // V2 au repos
  const replie = () => p.evaluate(() => [...document.querySelectorAll('button, [role="button"], span, div')].filter((e) => {
    const b = e.getBoundingClientRect(); if (!b.width || !b.height) return false;
    const t = (e.textContent || '').replace(/\s+/g, ' ');
    return t.length < 90 && /hors des 12\s*·.*mots? précis/.test(t) && /huiles\s*›?/.test(t) && ![...e.children].some((c) => /hors des 12\s*·.*mots? précis/.test(c.textContent || ''));
  }).map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  const r0 = await replie();
  if (r0.length) f(`V2 pastille repliée au repos : « ${r0[0]} »`);
  // Toucher la bande (au centre de sa première case)
  const ok = await p.evaluate((g, b) => { const e = document.querySelector(g)?.querySelector(b); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(6, r.width / 2), y: r.top + r.height / 2 }; }, cas.groupe, cas.bande);
  if (!ok) { f('V1 bande introuvable'); await p.close(); continue; }
  await p.touchscreen.tap(ok.x, ok.y);
  await new Promise((r) => setTimeout(r, 400));
  const lu = await p.evaluate((cas) => {
    const g = document.querySelector(cas.groupe);
    const vis = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    // Le premier nœud texte visible qui contient le motif : son élément, son haut.
    const trouver = (re) => {
      const w = document.createTreeWalker(g, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!re.test(n.textContent) || !vis(n.parentElement)) continue;
        const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect();
        if (r.height) return { el: n.parentElement, top: r.top, bottom: r.bottom };
      }
      return null;
    };
    // La ligne d'un texte : son plus proche ancêtre large (60 % du groupe au moins), comme une ligne de v2a.
    const W = g.getBoundingClientRect().width;
    const ligne = (x) => { let e = x.el; while (e && e !== g && e.getBoundingClientRect().width < 0.6 * W) e = e.parentElement; return e; };
    // Un élément visible dont le texte (même découpé en plusieurs nœuds) contient le motif, le plus profond.
    const trouverEl = (re) => { const l = [...g.querySelectorAll('*')].filter((e) => vis(e) && re.test(e.textContent || '') && ![...e.children].some((c) => re.test(c.textContent || ''))); if (!l.length) return null; const r = l[0].getBoundingClientRect(); return { el: l[0], top: r.top, bottom: r.bottom }; };
    const res = {};
    // V1
    // Le picto de la famille sur la même ligne : un svg[data-famille] dont le milieu tombe dans la hauteur du mot.
    const pictosVus = [...g.querySelectorAll('svg[data-famille]')].filter(vis).map((x) => { const b = x.getBoundingClientRect(); return b.top + b.height / 2; });
    // V5 : le texte des lignes (mots, ◇, fiches + huiles).
    // La ligne d'un texte pour V5 : l'ancêtre dont le parent empile ses lignes en colonne (comme les lignes de v2a).
    const ligneCol = (x) => { let e = x.el; while (e && e.parentElement && e.parentElement !== g && getComputedStyle(e.parentElement).flexDirection !== 'column') e = e.parentElement; return e; };
    const texteLigne = (re) => { const t = trouver(re); return t ? (ligneCol(t)?.textContent || '') : null; };
    res.v5 = { mots: texteLigne(new RegExp(cas.mots[0])), sans: texteLigne(new RegExp(cas.sans[0])), fiches: (texteLigne(/linalol/) || '') + (texteLigne(/huiles/) || '') };
    res.mots = cas.mots.map((m) => { const t = trouver(new RegExp(m)); if (!t) return { m, vu: false }; return { m, vu: true, picto: pictosVus.some((y) => y >= t.top - 3 && y <= t.bottom + 3), top: t.top }; });
    const sansT = trouver(new RegExp(cas.sans[0]));
    res.sans = sansT ? { vu: true, losange: /◇/.test(ligne(sansT)?.textContent || ''), source: new RegExp(cas.sans[1]).test(ligne(sansT)?.textContent || ''), top: sansT.top } : { vu: false };
    const lin = trouver(/linalol/), thi = trouver(/thiols/), ger = trouver(/géraniol/), hui = trouver(/huiles/);
    res.fiches = { linalol: !!lin, thiols: !!thi, geraniol: !!ger, inc: ger ? /\?/.test(ligne(ger)?.textContent || '') : false, top: lin?.top ?? null };
    res.huiles = hui ? { vu: true, source: /Hopsteiner|source|fiche/.test(ligne(hui)?.textContent || ''), top: hui.top } : { vu: false };
    const cle = trouver(/fiches qui la disent/);
    res.cle = cle ? { vu: true, tete: /en tête d[’']une fiche/.test(ligne(cle)?.textContent || ''), top: cle.top } : { vu: false };
    const si = trouver(/si ajouté/);
    res.si = si ? { vu: true, texte: (ligne(si)?.textContent || '').replace(/\s+/g, ' ').trim(), top: si.top } : { vu: false };
    const nd = trouver(/non décrite/);
    res.tons = nd ? nd.top : null;
    const q = [...g.querySelectorAll('button')].find((b) => b.textContent.trim() === '?' && vis(b));
    res.q = q ? q.getBoundingClientRect().top + q.getBoundingClientRect().height / 2 : null;
    const sx = cas.sansX ? trouverEl(new RegExp(cas.sansX)) : null;
    res.sansX = sx ? (sx.top + sx.bottom) / 2 : null;
    res.tonsMilieu = nd ? (nd.top + nd.bottom) / 2 : null;
    // Bande ouverte : les pictos de la bande (les 12 familles, au même rang, sous les cases), et leur barre.
    const pictos = [...g.querySelectorAll('svg[data-famille]')].filter(vis);
    const rangs = new Map(); for (const s of pictos) { const k = Math.round(s.getBoundingClientRect().top / 4); rangs.set(k, [...(rangs.get(k) || []), s]); }
    const rang = [...rangs.values()].find((l) => new Set(l.map((s) => s.dataset.famille)).size >= 12);
    res.bande = rang ? { n: rang.length, top: Math.min(...rang.map((s) => s.getBoundingClientRect().top)) } : null;
    res.barres = rang ? rang.map((s) => {
      const col = s.parentElement, cb = col.getBoundingClientRect();
      const els = [...col.querySelectorAll('*')].filter((e) => e !== s && !s.contains(e) && vis(e) && e.getBoundingClientRect().top >= s.getBoundingClientRect().bottom - 1);
      const pistes = els.filter((e) => { const b = e.getBoundingClientRect(); return b.width >= 0.5 * cb.width && b.height >= 2 && b.height <= 5 && e.children.length >= 1; });
      const segments = els.filter((e) => { const b = e.getBoundingClientRect(); return b.width <= 5 && b.height >= 6; });
      return { f: s.dataset.famille, pistes: pistes.length, segments: segments.length };
    }) : [];
    return res;
  }, cas);
  // V1
  if (!lu.bande) f('V1 la bande ne s\'ouvre pas au toucher (pas de rang des 12 pictos sous les pastilles)');
  for (const m of lu.mots) { if (!m.vu) f(`V1 mot précis « ${m.m} » absent`); else if (!m.picto) f(`V1 mot précis « ${m.m} » sans le picto de sa famille sur sa ligne`); }
  if (!lu.sans.vu) f(`V1 mot hors des 12 « ${cas.sans[0]} » absent`); else { if (!lu.sans.losange) f('V1 la ligne des mots hors des 12 sans son ◇'); if (!lu.sans.source) f(`V1 « ${cas.sans[0]} » sans sa source (${cas.sans[1]})`); }
  if (!lu.fiches.linalol || !lu.fiches.thiols || !lu.fiches.geraniol) f(`V1 ligne des fiches incomplète (linalol ${lu.fiches.linalol}, thiols ${lu.fiches.thiols}, géraniol ${lu.fiches.geraniol})`);
  else if (!lu.fiches.inc) f('V1 géraniol sans « ? »');
  if (!lu.huiles.vu) f('V1 huiles absentes'); else if (!lu.huiles.source) f('V1 huiles sans leur source');
  if (!lu.cle.vu) f('V1 clé « fiches qui la disent » absente'); else if (!lu.cle.tete) f('V1 clé sans « en tête d\'une fiche »');
  if (cas.siAjoute) { if (!lu.si.vu) f('V1 « si ajouté à 10′ : … » absent'); else if (!/si ajouté à \d+′ ?: ?\S/.test(lu.si.texte)) f(`V1 « si ajouté » mal formé : « ${lu.si.texte} »`); }
  // V5
  for (const k of ['mots', 'sans', 'fiches']) {
    const a = sansEsp(lu.v5[k]), b = sansEsp(ref[cas.nom]?.[k]);
    if (a !== b) f(`V5 ligne ${k === 'sans' ? '◇' : k} : « ${(lu.v5[k] || '').replace(/\s+/g, ' ').trim()} » au lieu de « ${(ref[cas.nom]?.[k] || '').replace(/\s+/g, ' ').trim()} » (v2a)`);
  }
  // V2 ouvert
  const r1 = await replie();
  if (r1.length) f(`V2 pastille repliée, bande ouverte : « ${r1[0]} »`);
  // V3
  if (lu.bande) {
    const suite = [['bande', lu.bande.top], ['mots', lu.mots[0]?.top], ['◇', lu.sans.top], ['fiches', lu.fiches.top], ['huiles', lu.huiles.top]]
      .concat(cas.siAjoute ? [['si ajouté', lu.si.top]] : []).concat([['clé', lu.cle.top], ['tons', lu.tons]]);
    for (let k = 1; k < suite.length; k++) {
      const [a, ya] = suite[k - 1], [b, yb] = suite[k];
      if (ya == null || yb == null) continue;
      if (yb < ya - 2) f(`V3 ordre : « ${b} » (${Math.round(yb)} px) avant « ${a} » (${Math.round(ya)} px)`);
    }
    if (cas.sansX) {
      if (lu.q == null || lu.sansX == null || lu.tonsMilieu == null) f('V3 la rangée tons, « ? », « Sans X › » est incomplète');
      else if (Math.abs(lu.q - lu.tonsMilieu) > 14 || Math.abs(lu.sansX - lu.tonsMilieu) > 14) f(`V3 « ? » et « ${cas.sansX} › » ne sont pas sur la rangée des tons (${Math.round(lu.tonsMilieu)} / ${Math.round(lu.q)} / ${Math.round(lu.sansX)} px)`);
    }
  }
  // V4
  const seg = lu.barres.filter((x) => x.segments > 0), sansPiste = lu.barres.filter((x) => x.pistes !== 1);
  if (seg.length) f(`V4 ${seg.length} picto(s) avec des segments au lieu de la barre de v2e (${seg.slice(0, 3).map((x) => x.f + ' ×' + x.segments).join(', ')})`);
  if (lu.barres.length && sansPiste.length) f(`V4 ${sansPiste.length} picto(s) sans une seule barre (${sansPiste.slice(0, 3).map((x) => x.f + ' : ' + x.pistes).join(', ')})`);
  console.log(`${cas.nom} · bande ${lu.bande ? lu.bande.n + ' pictos' : 'fermée'} · barres ${lu.barres.filter((x) => x.pistes === 1 && !x.segments).length}/${lu.barres.length}`);
  await p.close();
}
await browser.close();
if (fautes.length) { console.log(`LEGENDE-V2A ECHEC ${fautes.length}`); for (const x of fautes) console.log('  - ' + x); process.exit(1); }
console.log('LEGENDE-V2A OK');
