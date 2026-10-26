#!/usr/bin/env node
// D110 (23.10, soir, maquette publiée d332792c) : sur les pictos d'une voie de Suggérer, le brasseur écrit, mot pour
// mot : « Un peu dur à comprendre ce système de petit bar » (SPEC-BRASSEUR § 1, « Les petits traits de Suggérer »).
// Ce sont les traits de q2b, son choix : sous chaque picto, un trait par cran du style, un demi-trait pour un reste,
// des hachures pour un effet non établi, un point pour une famille qui ne bouge pas. Ils restent (règle n° 1). Leur
// sens n'était dit que dans l'aide « ? », loin de la ligne ; toucher un picto ne montrait rien.
//
// Règle : les traits restent muets au repos (pas un mot de plus : pas de cockpit) et, au toucher d'un picto, le sens
// apparaît PRÈS de lui : « Agrumes +1,6 cran ». Cinq règles, jouées à 390 × 844 tactile puis à 1280 × 800 :
//   1. les traits restent : au moins 3 éléments [data-famille][data-crans] dans des lignes de voie
//      (li[data-role="ligne-houblon"]), visibles, chacun avec son picto (un svg) et ses traits (un élément visible
//      sous le picto) ;
//   2. au repos, aucun élément de traits ne contient de texte visible (lettres ou chiffres), et aucun texte visible
//      n'est posé sous les pictos d'une ligne de voie (à 40 px au plus sous un picto, à son aplomb) ;
//   3. un toucher montre le sens, près du picto : pour le premier élément de traits de trois lignes différentes, un
//      toucher fait apparaître, en moins de 400 ms (comptées au retour du toucher), un élément visible (au centre de
//      l'écran, non couvert), à 120 px au plus du picto, dont le texte contient le nom court de la famille (table
//      COURT de src/ui/hopIndex/familyTokens.ts) et sa valeur en crans (data-crans arrondi au dixième, virgule
//      décimale, signe « + » ou « − » ; pour un effet non établi, « ? » ou « non établi »). L'élément doit être
//      nouveau : un texte déjà là avant le toucher ne compte pas. À l'ordinateur : le survol, sinon le clic ;
//   4. le toucher n'a pas d'autre effet : la route (location.hash, window.__parcours.route) et la liste à comparer
//      (window.__parcours.etat.aComparer) ne changent pas ; aucune feuille ne couvre l'écran (l'élément montré fait
//      moins d'un tiers de la hauteur de l'écran ; aucun élément fixe ou absolu d'un tiers d'écran, ni dialogue,
//      n'apparaît) ;
//   5. il se referme : un toucher ailleurs (sur un endroit neutre) retire l'élément montré.
//
// Usage : node controle-traits.mjs <dossier construit> [--page=etat.html] [--largeur=390|1280]
//   Page lue : <dossier>/suggerer/<page>. Une ligne par règle et largeur, puis « TRAITS OK (n touchés, 2 largeurs) »
//   (code 0), ou « TRAITS ECHEC » et une ligne « - D110 … » par manque (code 1). Code 2 si la page manque.
// Témoins (temoins/traits-<cas>/suggerer/etat.html) : ok → OK ; muets (la forme de d332792c : rien au toucher),
// bavards (le sens écrit en permanence sous chaque picto), feuille (le toucher couvre l'écran) → ECHEC.
// Sur d332792c (maquette rejetée) : ECHEC, règle 3 (rien n'apparaît au toucher).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { versUrl, existe } from './lib/cible.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const opt = (nom, defaut) => { const a = args.find((x) => x.startsWith('--' + nom + '=')); return a ? a.slice(nom.length + 3) : defaut; };
const dossier = path.resolve(RACINE, args.find((a) => !a.startsWith('--')) ?? '.');
const page = opt('page', 'etat.html');
const seule = opt('largeur', null);
const TAILLES = [
  { l: 390, h: 844, mobile: true, nom: '390x844 tactile' },
  { l: 1280, h: 800, mobile: false, nom: '1280x800' },
].filter((t) => !seule || String(t.l) === String(seule));
const fichier = path.join(dossier, 'suggerer', page);
if (!existe(fichier)) { console.log('TRAITS ECHEC : page absente (' + path.relative(RACINE, fichier) + ')'); process.exit(2); }
if (!TAILLES.length) { console.log('TRAITS ECHEC : --largeur=390 ou 1280'); process.exit(2); }

// La table des noms courts : lue dans l'app, jamais recopiée.
const srcFamilles = fs.readFileSync(path.join(RACINE, 'src/ui/hopIndex/familyTokens.ts'), 'utf8');
const bloc = (srcFamilles.match(/COURT[^=]*=\s*\{([\s\S]*?)\}/) || [])[1] || '';
const COURT = Object.fromEntries([...bloc.matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]));
if (Object.keys(COURT).length < 12) { console.log('TRAITS ECHEC : table des familles illisible (familyTokens.ts)'); process.exit(2); }

const norm = (s) => String(s).replace(/[\s\u00a0\u202f]+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const MOINS = '\\u2212\\u2013-';
// Ce que le texte montré doit dire pour un élément de traits : nom de la famille + valeur arrondie au dixième.
const specDe = (famille, crans) => {
  const nom = COURT[famille];
  if (!nom) return { nom: norm(famille), inconnu: false, re: '(?!)', attendu: '(famille « ' + famille + ' » hors de la table)' };
  const x = Number(crans);
  if (crans === '' || crans == null || !Number.isFinite(x)) return { nom: norm(nom), inconnu: true, re: '', attendu: nom + ' ? | non établi' };
  const dixieme = (Math.round(Math.abs(x) * 10 + 1e-9) / 10).toFixed(1).split('.').join(',');
  const nombre = dixieme.endsWith(',0') ? dixieme.slice(0, -2) + '(?:,0)?' : dixieme;
  const signe = x < 0 ? '[' + MOINS + ']\\s?' : '\\+?\\s?';
  return { nom: norm(nom), inconnu: false, re: '(?<![\\d,.' + MOINS + '])' + signe + nombre + '(?![\\d,])', attendu: nom + ' ' + (x < 0 ? '−' : '+') + dixieme.split(',0').join(',0') + ' cran' };
};

// ---------- l'aide injectée dans la page (aucun $ dans ce code) ----------
function aide() {
  const T = (window.__tr = {});
  const vis = (e) => { if (!e || !e.isConnected || !e.checkVisibility) return false; if (!e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const norm = (s) => String(s).replace(/[\s\u00a0\u202f]+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // textes visibles d'un élément : { t, r } par nœud de texte réellement visible (pas rogné à 2 px)
  const textes = (el) => {
    const out = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (!/[\p{L}\p{N}]/u.test(n.nodeValue)) continue;
      if (!vis(n.parentElement)) continue;
      const g = document.createRange(); g.selectNodeContents(n);
      const r = g.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2) continue;
      out.push({ t: n.nodeValue.trim(), r });
    }
    return out;
  };
  T.lignes = () => { const a = [...document.querySelectorAll('li[data-role="ligne-houblon"]')]; return a.length ? a : [...document.querySelectorAll('[data-voie]')]; };
  T.traitsDe = (l) => [...l.querySelectorAll('[data-famille][data-crans]')];
  // un élément de traits complet : visible, un picto (svg) et, sous le picto, un élément visible (les traits)
  T.valide = (e) => {
    if (!vis(e)) return false;
    const s = e.querySelector('svg');
    if (!s) return false;
    const rs = s.getBoundingClientRect();
    if (rs.width <= 0) return false;
    return [...e.querySelectorAll('*')].some((x) => !s.contains(x) && !x.contains(s) && !(x instanceof SVGElement) && vis(x) && x.getBoundingClientRect().top >= rs.bottom - 1);
  };
  T.validesDe = (l) => T.traitsDe(l).filter(T.valide);
  T.cible = (k) => { const ls = T.lignes().filter((l) => T.validesDe(l).length); return ls[k] ? T.validesDe(ls[k])[0] : null; };
  T.repos = () => {
    const ls = T.lignes();
    const valides = ls.flatMap(T.validesDe);
    const dansTraits = [];
    const dessous = [];
    for (const l of ls) {
      const tn = T.traitsDe(l);
      for (const t of tn) for (const x of textes(t)) dansTraits.push({ f: t.getAttribute('data-famille'), t: x.t });
      const tx = textes(l);
      for (const t of T.validesDe(l)) {
        const r = t.getBoundingClientRect();
        for (const x of tx) {
          if (x.r.top >= r.bottom - 1 && x.r.top <= r.bottom + 40 && x.r.left < r.right && x.r.right > r.left) dessous.push({ f: t.getAttribute('data-famille'), t: x.t });
        }
      }
    }
    return { lignes: ls.length, tous: ls.flatMap(T.traitsDe).length, valides: valides.length, dansTraits, dessous };
  };
  // éléments « feuilles » dont le texte visible dit le sens
  T.cands = (spec) => {
    const test = (txt) => { const n = norm(txt); if (!n.includes(spec.nom)) return false; return spec.inconnu ? /\?|non etabli/.test(n) : new RegExp(spec.re, 'u').test(n); };
    const M = new Set();
    for (const e of document.querySelectorAll('body *')) {
      if (!test(e.textContent || '')) continue;
      if (!vis(e)) continue;
      if (test(textes(e).map((x) => x.t).join(' '))) M.add(e);
    }
    return [...M].filter((e) => ![...e.children].some((c) => M.has(c)));
  };
  T.montre = (e) => {
    if (!vis(e)) return false;
    const r = e.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false;
    if (getComputedStyle(e).pointerEvents === 'none') return true;
    const h = document.elementFromPoint(cx, cy);
    return !!h && (e === h || e.contains(h) || h.contains(e));
  };
  T.grands = () => [...document.querySelectorAll('body *')].filter((e) => {
    if (!vis(e)) return false;
    const p = getComputedStyle(e).position;
    const dialogue = e.matches('[role="dialog"], dialog[open], [aria-modal="true"]');
    if (p !== 'fixed' && p !== 'absolute' && !dialogue) return false;
    return e.getBoundingClientRect().height >= innerHeight / 3;
  });
  T.etat = () => {
    const p = window.__parcours;
    let route, ac;
    try { route = JSON.stringify(typeof p.route === 'function' ? p.route() : p.route); } catch (e) { route = String(p && p.route); }
    try { ac = JSON.stringify(p.etat.aComparer); } catch (e) { ac = undefined; }
    return { hash: location.hash, route, ac };
  };
  T.avant = (spec) => { T.cands0 = new Set(T.cands(spec)); T.grands0 = new Set(T.grands()); T.etat0 = T.etat(); return T.etat0; };
  T.apres = (k, spec) => {
    const c = T.cible(k);
    const pr = c.getBoundingClientRect();
    const px = pr.left + pr.width / 2, py = pr.top + pr.height / 2;
    const vus = T.cands(spec).filter((e) => !T.cands0.has(e)).map((e) => {
      const r = e.getBoundingClientRect();
      return { e, d: Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py), h: r.height, ok: T.montre(e), t: (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) };
    });
    const bons = vus.filter((x) => x.ok && x.d <= 120).sort((a, b) => a.d - b.d);
    const loin = vus.filter((x) => x.ok).sort((a, b) => a.d - b.d)[0];
    const etat = T.etat();
    const grands = T.grands().filter((e) => !T.grands0.has(e)).map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ' ' + Math.round(e.getBoundingClientRect().height) + ' px');
    return {
      trouve: bons[0] ? { t: bons[0].t, d: Math.round(bons[0].d), h: Math.round(bons[0].h) } : null,
      loin: !bons[0] && loin ? { t: loin.t, d: Math.round(loin.d) } : null,
      etat, avant: T.etat0, grands, vh: innerHeight,
    };
  };
  // un endroit neutre pour fermer : ni lien, ni bouton, ni ligne de voie, ni picto, à l'écart de l'élément montré
  T.vide = (k, spec) => {
    const c = T.cible(k).getBoundingClientRect();
    const montres = T.cands(spec).filter((e) => !T.cands0.has(e)).map((e) => e.getBoundingClientRect());
    const pas = 30;
    for (let y = 8; y < innerHeight - 8; y += pas) for (let x = 8; x < innerWidth - 8; x += pas) {
      const proche = (r) => x > r.left - 24 && x < r.right + 24 && y > r.top - 24 && y < r.bottom + 24;
      if (proche(c) || montres.some(proche)) continue;
      const e = document.elementFromPoint(x, y);
      if (!e || e.closest('a[href], button, input, select, textarea, summary, label, [role="button"], [data-role="ligne-houblon"], [data-voie], [data-famille]')) continue;
      return { x, y };
    }
    return null;
  };
}

// ---------- le jeu ----------
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const lignesSortie = [];
const manques = [];
let touches = 0;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const t of TAILLES) {
    const p = await browser.newPage();
    await p.setViewport({ width: t.l, height: t.h, deviceScaleFactor: 1, isMobile: t.mobile, hasTouch: t.mobile });
    const charger = async () => {
      await p.goto(versUrl(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
      await p.waitForSelector('[data-famille][data-crans]', { timeout: 6000 }).catch(() => {});
      await attendre(350);
      await p.addScriptTag({ content: '(' + aide.toString() + ')()' });
    };
    const note = (n, ok, texte) => lignesSortie.push(t.nom + ' · règle ' + n + ' · ' + texte + ' : ' + (ok ? 'OK' : 'ECHEC'));
    const manque = (n, texte) => manques.push('- D110 ' + t.nom + ' · règle ' + n + ' : ' + texte);

    await charger();
    const repos = await p.evaluate(() => window.__tr.repos());
    // 1. les traits restent
    const r1 = repos.valides >= 3;
    note(1, r1, repos.valides + ' éléments de traits visibles avec picto et traits (' + repos.tous + ' [data-famille][data-crans], ' + repos.lignes + ' lignes de voie)');
    if (!r1) manque(1, repos.valides + ' élément(s) de traits complet(s) dans les lignes de voie (3 au moins : picto + traits visibles, [data-famille][data-crans] dans li[data-role="ligne-houblon"])');
    // 2. rien de plus au repos
    const r2 = !repos.dansTraits.length && !repos.dessous.length;
    note(2, r2, repos.dansTraits.length + ' texte(s) dans les traits, ' + repos.dessous.length + ' sous les pictos');
    if (repos.dansTraits.length) manque(2, 'texte visible dans les traits au repos (« ' + repos.dansTraits[0].t + ' » sur ' + repos.dansTraits[0].f + ', ' + repos.dansTraits.length + ' au total) : pas un mot de plus au repos');
    if (repos.dessous.length) manque(2, 'texte visible sous les pictos d\'une ligne de voie au repos (« ' + repos.dessous[0].t + ' » sous ' + repos.dessous[0].f + ', ' + repos.dessous.length + ' au total) : pas un mot de plus au repos');

    // 3 à 5. trois touchers, sur la première case de trois lignes différentes
    const bilan = { r3: [], r4: [], r5: [] };
    for (let k = 0; k < 3; k++) {
      await charger();
      const info = await p.evaluate((k) => { const c = window.__tr.cible(k); return c ? { f: c.getAttribute('data-famille'), c: c.getAttribute('data-crans') } : null; }, k);
      if (!info) { bilan.r3.push('ligne ' + (k + 1) + ' : pas de ligne de voie avec ses traits (3 lignes différentes exigées)'); continue; }
      touches++;
      const spec = specDe(info.f, info.c);
      const etiquette = 'ligne ' + (k + 1) + ' (' + info.f + ' ' + info.c + ')';
      const h = await p.evaluateHandle((k) => window.__tr.cible(k), k);
      await p.evaluate((k) => { const c = window.__tr.cible(k); c.scrollIntoView({ block: 'center' }); }, k);
      await attendre(150);
      const couvert = await p.evaluate((k) => { const c = window.__tr.cible(k); const r = c.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(e && (c === e || c.contains(e) || e.contains(c))); }, k);
      if (couvert) { bilan.r3.push(etiquette + ' : le picto est couvert par un autre élément, on ne peut pas le toucher'); await h.dispose(); continue; }
      await p.evaluate((spec) => window.__tr.avant(spec), spec);
      const poll = async () => {
        const debut = Date.now();
        let r = null;
        do { r = await p.evaluate((k, spec) => window.__tr.apres(k, spec), k, spec); if (r.trouve) break; await attendre(25); } while (Date.now() - debut < 400);
        return { r, ms: Date.now() - debut };
      };
      let res;
      let par = 'toucher';
      if (t.mobile) { await h.tap(); res = await poll(); }
      else {
        await h.hover(); res = await poll(); par = 'survol';
        if (!res.r.trouve) { await h.click(); res = await poll(); par = 'clic'; }
      }
      const r = res.r;
      if (!r.trouve) {
        bilan.r3.push(etiquette + ' : rien n\'apparaît près du picto en 400 ms (attendu « ' + spec.attendu + ' »' + (r.loin ? ' ; un texte apparaît mais à ' + r.loin.d + ' px, « ' + r.loin.t + ' »' : '') + ')');
      } else bilan.r3.push(null);
      // 4. pas d'autre effet
      const e0 = r.avant, e1 = r.etat;
      if (e1.ac === undefined) bilan.r4.push(etiquette + ' : window.__parcours.etat.aComparer absent');
      if (e0.hash !== e1.hash || e0.route !== e1.route) bilan.r4.push(etiquette + ' : la route change (' + e0.hash + ' → ' + e1.hash + ')');
      if (e0.ac !== e1.ac) bilan.r4.push(etiquette + ' : la liste à comparer change (' + e0.ac + ' → ' + e1.ac + ')');
      if (r.grands.length) bilan.r4.push(etiquette + ' : une feuille couvre l\'écran (' + r.grands.join(', ') + ', plus d\'un tiers de ' + r.vh + ' px)');
      if (r.trouve && r.trouve.h >= r.vh / 3) bilan.r4.push(etiquette + ' : l\'élément montré fait ' + r.trouve.h + ' px (un tiers de l\'écran ou plus)');
      // 5. il se referme
      if (!r.trouve) { bilan.r5.push(null); await h.dispose(); continue; }
      const vide = await p.evaluate((k, spec) => window.__tr.vide(k, spec), k, spec);
      if (!vide) { bilan.r5.push(etiquette + ' : aucun endroit neutre pour fermer (tout l\'écran est un lien, un bouton ou une ligne)'); await h.dispose(); continue; }
      if (t.mobile) await p.touchscreen.tap(vide.x, vide.y); else { await p.mouse.move(vide.x, vide.y); await p.mouse.click(vide.x, vide.y); }
      await attendre(450);
      const encore = await p.evaluate((k, spec) => window.__tr.apres(k, spec), k, spec);
      bilan.r5.push(encore.trouve ? etiquette + ' : l\'élément reste après un ' + (t.mobile ? 'toucher' : 'clic') + ' ailleurs (« ' + encore.trouve.t + ' »)' : null);
      await h.dispose();
      void par; void res.ms;
    }
    const n3 = bilan.r3.filter(Boolean);
    note(3, !n3.length && bilan.r3.length === 3, bilan.r3.filter((x) => x === null).length + '/3 pictos touchés montrent leur famille et leur valeur près d\'eux');
    for (const m of n3) manque(3, m);
    if (bilan.r3.length < 3) manque(3, 'seulement ' + bilan.r3.length + ' touchers jouables sur 3');
    note(4, !bilan.r4.length, bilan.r4.length ? bilan.r4.length + ' effet(s) en trop' : 'ni route, ni liste, ni feuille');
    for (const m of bilan.r4) manque(4, m);
    const n5 = bilan.r5.filter(Boolean);
    if (bilan.r3.every((x) => x !== null)) lignesSortie.push(t.nom + ' · règle 5 · sans objet, rien n\'est montré au toucher (règle 3)');
    else note(5, !n5.length && bilan.r5.length === 3, bilan.r5.filter((x) => x === null).length + '/3 se referment sur un toucher ailleurs');
    for (const m of n5) manque(5, m);
    await p.close();
  }
} finally { await browser.close(); }

for (const l of lignesSortie) console.log(l);
if (manques.length) { console.log('TRAITS ECHEC ' + manques.length + ' manque(s)'); for (const m of manques) console.log(m); process.exit(1); }
console.log('TRAITS OK (' + touches + ' touchés, ' + TAILLES.length + ' largeurs)');
