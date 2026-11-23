// Contrôle d'une maquette contre le registre de ses choix (work/refonte-frontend/v4/choix/maquettes.json, 16.11).
// « Met en place des choses pour plus perdre autant de temps ni pour plus perdre mes retours... » (16.11).
// Échoue si un élément « gardé » est introuvable ou si un élément « refusé » est présent. Rendu réel dans Chrome
// (390 × 844, tactile) : seul compte ce qui se voit (innerText, éléments visibles), pas un texte caché dans le HTML.
//
//   node scripts/agents/controle-base.mjs <chantier> <fichier.html> [--dures] [--statique] [--registre <json>]
//     --dures     règles dures : + volant à droite juste au-dessus des onglets, thème de l'app, aucun texte sous 14 px
//     --statique  mini maquette statique : aucun <script>, aucun gestionnaire on…= (L30 : pas de jouable avant son choix)
// Sortie : BASE OK / BASE ECHEC (et DURES OK / DURES ECHEC, STATIQUE OK / STATIQUE ECHEC). Code 0, 1, ou 2 (usage).
//
// Signatures (champ `signature` de chaque entrée du registre) :
//   { texte }                     sous-chaîne du texte visible (espaces et apostrophes normalisés)
//   { regex, flags? }             expression sur le texte visible normalisé
//   { source }                    expression (insensible à la casse) sur le HTML brut, pour le CSS
//   { selecteur, min?, visible? } nombre d'éléments trouvés ≥ min (1) ; visibles seulement, sauf visible: false
//   { position: { texte, hautMax } }   le premier élément visible qui contient le texte commence à hautMax × 844 px au plus
//   { auDessus: [a, b], ecartMax? }    un titre au texte exact a, dans le tiers gauche, juste au-dessus de b (≤ ecartMax px, 60)
//   { paysage: { minSemaines } }  la page à 844 × 390, ou sa sœur <nom>-paysage.html, montre au moins minSemaines semaines « Snn »
//   { plus: true }                le + volant : centre dans le tiers droit, bas à 4–24 px au-dessus de la barre d'onglets
//   { tous: [...] } / { un: [...] }
// Une entrée sans signature (null) est listée « non vérifiable », sans faire échouer.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const REGISTRE = path.join(RACINE, 'work/refonte-frontend/v4/choix/maquettes.json');
const TEL = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };
const PAYSAGE = { width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };
// DESIGN.md : accents EBC, couleurs de zone, houblon et eau, dans les deux thèmes.
const ACCENTS = ['#F2C14E', '#E0A02E', '#C87A2C', '#A0522D', '#E7A070', '#86B9E6', '#A3C97A', '#BCA5E8', '#E3B55D', '#6E9B5B', '#5B8AA6',
  '#567F45', '#3F6B2E', '#4F7E9B', '#2F5F7D', '#9C7020', '#9A4F1E', '#1F64A3', '#4C6B2A', '#6A4FB0', '#7A5A12', '#8A5212', '#8D442C'];
const FONDS = { cave: ['#12100E', '#1A1613', '#221D19', '#2C2521'], clair: ['#FFFFFF', '#F5F5F5', '#EBEBEB'] };

export const normaliser = (t) => String(t ?? '').replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

function lab(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92));
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
const deltaE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const proche = (hex, liste) => liste.find((t) => deltaE(hex, t) < 3);

async function ouvrir(nav, fichier, vue) {
  const p = await nav.newPage();
  await p.setViewport(vue);
  await p.goto(pathToFileURL(fichier).href, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 300));
  return p;
}

const texteVisible = (p) => p.evaluate(() => document.body.innerText);

async function compter(p, selecteur, visible) {
  return p.evaluate((s, v) => [...document.querySelectorAll(s)].filter((el) => {
    if (!v) return true;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  }).length, selecteur, visible);
}

// Boîtes des plus petits éléments visibles dont le texte contient t (exact = texte propre égal à t).
async function boites(p, t, exact) {
  return p.evaluate((t, exact) => {
    const n = (s) => String(s ?? '').replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
    const vu = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }); };
    const tous = [...document.body.querySelectorAll('*')].filter((el) => el instanceof HTMLElement && !['SCRIPT', 'STYLE'].includes(el.tagName) && vu(el));
    // exact : la première ligne de l'élément est t (un titre de rangée suivi de son résumé compte).
    const ok = tous.filter((el) => (exact ? n((el.innerText ?? '').split('\n')[0]) === n(t) : n(el.innerText).includes(n(t))));
    const feuilles = ok.filter((el) => !ok.some((o) => o !== el && el.contains(o)));
    return feuilles.map((el) => { const r = el.getBoundingClientRect(); return { haut: r.top + scrollY, bas: r.bottom + scrollY, gauche: r.left, droite: r.right }; });
  }, t, exact);
}

async function mesurerPlus(p) {
  return p.evaluate(() => {
    const vu = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }); };
    const H = innerHeight, W = innerWidth;
    const navs = [...document.body.querySelectorAll('*')].filter((el) => vu(el)
      && ['Finances', 'Calendrier', 'Brassins'].every((m) => (el.innerText ?? '').includes(m)) && el.getBoundingClientRect().top > H * 0.7);
    const barre = navs.find((el) => !navs.some((o) => o !== el && el.contains(o)));
    if (!barre) return { erreur: 'barre d’onglets introuvable (Finances, Calendrier, Brassins en bas)' };
    const fixe = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const pos = getComputedStyle(e).position; if (pos === 'fixed' || pos === 'absolute' || pos === 'sticky') return true; } return false; };
    const cands = [...document.body.querySelectorAll('button, a, [role="button"], div, span')].filter((el) => {
      if (!vu(el) || barre.contains(el) || el.contains(barre)) return false;
      const r = el.getBoundingClientRect();
      const signe = /^\+/.test((el.innerText ?? '').trim()) || /\bfab\b|plus|ajout/i.test(`${el.className?.baseVal ?? el.className} ${el.getAttribute('aria-label') ?? ''}`);
      return signe && r.width >= 32 && r.width <= 110 && r.height >= 32 && r.height <= 96 && fixe(el) && r.bottom <= barre.getBoundingClientRect().top + 2;
    });
    if (!cands.length) return { erreur: 'aucun + volant visible au-dessus de la barre d’onglets' };
    const haut = barre.getBoundingClientRect().top;
    const plus = cands.sort((a, b) => (haut - a.getBoundingClientRect().bottom) - (haut - b.getBoundingClientRect().bottom))[0];
    const r = plus.getBoundingClientRect();
    return { centre: Math.round((r.left + r.right) / 2), W, ecart: Math.round(haut - r.bottom) };
  });
}

async function verifier(sig, ctx) {
  if (sig.tous) { const r = await Promise.all(sig.tous.map((s) => verifier(s, ctx))); return { ok: r.every((x) => x.ok), detail: r.map((x) => x.detail).join(' ; ') }; }
  if (sig.un) { const r = await Promise.all(sig.un.map((s) => verifier(s, ctx))); return { ok: r.some((x) => x.ok), detail: r.map((x) => x.detail).join(' | ') }; }
  if (sig.texte !== undefined) { const ok = ctx.texte.includes(normaliser(sig.texte)); return { ok, detail: `« ${sig.texte} » ${ok ? 'vu' : 'absent'}` }; }
  if (sig.regex !== undefined) { const m = ctx.texte.match(new RegExp(sig.regex, sig.flags ?? 'u')); return { ok: !!m, detail: m ? `/${sig.regex}/ vu : « ${m[0].slice(0, 40)} »` : `/${sig.regex}/ absent` }; }
  if (sig.source !== undefined) { const ok = new RegExp(sig.source, 'iu').test(ctx.html); return { ok, detail: `source /${sig.source}/ ${ok ? 'vue' : 'absente'}` }; }
  if (sig.selecteur !== undefined) {
    const n = await compter(ctx.page, sig.selecteur, sig.visible !== false); const min = sig.min ?? 1;
    return { ok: n >= min, detail: `${sig.selecteur} : ${n} ${sig.visible === false ? 'dans le HTML' : 'visible(s)'} (min ${min})` };
  }
  if (sig.position) {
    const b = await boites(ctx.page, sig.position.texte, false);
    if (!b.length) return { ok: false, detail: `« ${sig.position.texte} » introuvable` };
    const haut = Math.min(...b.map((x) => x.haut)); const max = sig.position.hautMax * TEL.height;
    return { ok: haut <= max, detail: `« ${sig.position.texte} » à ${Math.round(haut)} px (max ${Math.round(max)}, ${Math.round((haut / TEL.height) * 100)} %)` };
  }
  if (sig.auDessus) {
    const [a, bTexte] = sig.auDessus; const ecartMax = sig.ecartMax ?? 60;
    const B = await boites(ctx.page, bTexte, false);
    if (!B.length) return { ok: false, detail: `« ${bTexte} » introuvable` };
    const bHaut = Math.min(...B.map((x) => x.haut));
    const A = (await boites(ctx.page, a, true)).filter((x) => x.haut <= bHaut && bHaut - x.haut <= ecartMax && x.gauche < TEL.width / 3);
    return { ok: A.length > 0, detail: A.length ? `titre « ${a} » à gauche, ${Math.round(bHaut - A[0].haut)} px au-dessus de « ${bTexte} »` : `pas de titre « ${a} » à gauche juste au-dessus de « ${bTexte} »` };
  }
  if (sig.paysage) {
    const soeur = ctx.fichier.replace(/\.html$/i, '-paysage.html');
    const essais = [ctx.fichier, ...(fs.existsSync(soeur) ? [soeur] : [])];
    let meilleur = 0, ou = '';
    for (const f of essais) {
      const p = await ouvrir(ctx.nav, f, PAYSAGE);
      const n = new Set(normaliser(await texteVisible(p)).match(/\bS\d{2}\b/g) ?? []).size;
      await p.close();
      if (n > meilleur) { meilleur = n; ou = path.basename(f); }
    }
    return { ok: meilleur >= sig.paysage.minSemaines, detail: `à 844 × 390 : ${meilleur} semaines (${ou || 'aucune'} ; min ${sig.paysage.minSemaines})${fs.existsSync(soeur) ? '' : ', pas de sœur -paysage.html'}` };
  }
  if (sig.plus) {
    const m = await mesurerPlus(ctx.page);
    if (m.erreur) return { ok: false, detail: m.erreur };
    const ok = m.centre >= (m.W * 2) / 3 && m.ecart >= 4 && m.ecart <= 24;
    return { ok, detail: `+ : centre ${m.centre} px sur ${m.W} (tiers droit dès ${Math.round((m.W * 2) / 3)}), ${m.ecart} px au-dessus des onglets (4 à 24)` };
  }
  return { ok: false, detail: `signature inconnue : ${JSON.stringify(sig)}` };
}

async function reglesDures(ctx) {
  const erreurs = [];
  const plus = await verifier({ plus: true }, ctx);
  if (!plus.ok) erreurs.push(`+ volant : ${plus.detail}`);
  const { couleurs, fond, petits } = await ctx.page.evaluate(() => {
    const vu = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }); };
    const hex = (c) => { const m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/); if (!m || (m[4] !== undefined && Number(m[4]) < 0.5)) return null; return `#${[m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('').toUpperCase()}`; };
    const couleurs = new Set();
    for (const el of document.body.querySelectorAll('*')) {
      if (!vu(el)) continue;
      const s = getComputedStyle(el);
      for (const c of [s.color, s.backgroundColor, s.borderTopColor, s.borderLeftColor, s.fill, s.stroke]) { const h = hex(c); if (h) couleurs.add(h); }
    }
    let fond = null;
    for (const el of [document.body, document.documentElement]) { const h = hex(getComputedStyle(el).backgroundColor); if (h) { fond = h; break; } }
    const petits = new Set();
    const marche = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = marche.nextNode(); n; n = marche.nextNode()) {
      const el = n.parentElement;
      if (!n.textContent.trim() || !el || ['SCRIPT', 'STYLE', 'TITLE'].includes(el.tagName) || !vu(el)) continue;
      const t = parseFloat(getComputedStyle(el).fontSize);
      if (t < 14) petits.add(`${n.textContent.trim().slice(0, 30)} (${t} px)`);
    }
    return { couleurs: [...couleurs], fond: fond ?? '#FFFFFF', petits: [...petits] };
  });
  const theme = proche(fond, FONDS.cave) ? 'cave' : proche(fond, FONDS.clair) ? 'clair' : null;
  const accents = new Set(couleurs.map((c) => proche(c, ACCENTS)).filter(Boolean));
  if (!theme) erreurs.push(`thème de l'app : fond ${fond} hors des fonds cave et clair de DESIGN.md`);
  if (accents.size < 2) erreurs.push(`thème de l'app : ${accents.size} couleur(s) d'accent de DESIGN.md (EBC, zones) visibles, 2 au moins (« et pas de couleur ? »)`);
  if (petits.length) erreurs.push(`${petits.length} texte(s) sous 14 px : ${petits.slice(0, 5).join(' ; ')}${petits.length > 5 ? ' ; …' : ''}`);
  return { erreurs, resume: `thème ${theme ?? '?'}, ${accents.size} accents, ${plus.detail}` };
}

function statique(html) {
  const erreurs = [];
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].filter((m) => m[1].trim() || /\bsrc=/i.test(m[0]));
  if (scripts.length) erreurs.push(`${scripts.length} <script> : une mini maquette est du HTML et du CSS seuls (L30)`);
  const gestes = html.match(/\son[a-z]+\s*=/gi) ?? [];
  if (gestes.length) erreurs.push(`${gestes.length} gestionnaire(s) on…= : pas de jouable avant son choix (L30)`);
  return erreurs;
}

export async function controler(chantier, fichier, { dures = false, estStatique = false, registre = REGISTRE } = {}) {
  const reg = JSON.parse(fs.readFileSync(registre, 'utf8'));
  const [nom, portee] = chantier.split(':');
  const brut = reg.chantiers?.[nom];
  if (!brut) throw new Error(`chantier inconnu : ${nom} (connus : ${Object.keys(reg.chantiers ?? {}).join(', ')})`);
  const garder = (l) => (l ?? []).filter((e) => !portee || !e.portee || e.portee === portee);
  const c = { gardes: garder(brut.gardes), refuses: garder(brut.refuses), idees: garder(brut.idees) };
  const puppeteer = require('puppeteer-core');
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  try {
    const page = await ouvrir(nav, fichier, TEL);
    const ctx = { nav, page, fichier, html: fs.readFileSync(fichier, 'utf8'), texte: normaliser(await texteVisible(page)) };
    const lignes = []; let absents = 0, presents = 0, nonVerif = 0;
    for (const [genre, liste] of [['gardé', c.gardes ?? []], ['refusé', c.refuses ?? []]]) {
      for (const e of liste) {
        if (!e.signature) { nonVerif++; lignes.push(`  ${genre.padEnd(6)} ?    ${e.id} ${e.element} — non vérifiable mécaniquement (${e.raison ?? 'sans signature'})`); continue; }
        const r = await verifier(e.signature, ctx);
        const bon = genre === 'gardé' ? r.ok : !r.ok;
        if (!bon) genre === 'gardé' ? absents++ : presents++;
        lignes.push(`  ${genre.padEnd(6)} ${bon ? 'ok  ' : 'KO  '} ${e.id} ${e.element} — ${r.detail}`);
      }
    }
    for (const e of c.idees ?? []) {
      if (!e.signature) continue;
      const r = await verifier(e.signature, ctx);
      lignes.push(`  idée   ${r.ok ? 'là  ' : '—   '} ${e.id} ${e.element} (non bloquant)`);
    }
    const res = { ok: !absents && !presents, lignes, absents, presents, nonVerif };
    if (dures) res.dures = await reglesDures(ctx);
    if (estStatique) res.statique = statique(ctx.html);
    return res;
  } finally { await nav.close(); }
}

async function main(argv) {
  const opt = (nom) => { const i = argv.indexOf(nom); return i >= 0 ? argv[i + 1] : undefined; };
  const libres = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--registre');
  const [chantier, f] = libres;
  if (!chantier || !f) { console.error('usage : node scripts/agents/controle-base.mjs <chantier> <fichier.html> [--dures] [--statique] [--registre <json>]'); return 2; }
  const fichier = path.resolve(f);
  if (!fs.existsSync(fichier)) { console.error(`fichier introuvable : ${fichier}`); return 2; }
  let r;
  try { r = await controler(chantier, fichier, { dures: argv.includes('--dures'), estStatique: argv.includes('--statique'), registre: opt('--registre') ? path.resolve(opt('--registre')) : REGISTRE }); }
  catch (err) { console.error(String(err.message ?? err)); return 2; }
  console.log(`controle-base ${chantier} ${path.relative(RACINE, fichier).replace(/\\/g, '/')}`);
  for (const l of r.lignes) console.log(l);
  let ok = r.ok;
  console.log(r.ok ? `BASE OK (${r.nonVerif} non vérifiable(s))` : `BASE ECHEC (${r.absents} gardé(s) absent(s), ${r.presents} refusé(s) présent(s))`);
  if (r.dures) { for (const e of r.dures.erreurs) console.log(`  - ${e}`); console.log(r.dures.erreurs.length ? 'DURES ECHEC' : `DURES OK (${r.dures.resume})`); ok = ok && !r.dures.erreurs.length; }
  if (r.statique) { for (const e of r.statique) console.log(`  - ${e}`); console.log(r.statique.length ? 'STATIQUE ECHEC' : 'STATIQUE OK'); ok = ok && !r.statique.length; }
  return ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
