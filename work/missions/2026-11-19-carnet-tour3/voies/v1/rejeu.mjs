// Voie v1 (tour 3) : rejeu des lignes de LIGNES.md par la vision, en local. Repris de voies/f2/captures.mjs.
// Usage : node rejeu.mjs <port> [scenario,...]. Écrit seulement dans ./captures. Banc ?preview=carnets et app ?dev-local (IA simulée).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const PORT = process.argv[2] ?? '5181';
const SEULS = process.argv[3] ? process.argv[3].split(',') : null;
const H = `http://localhost:${PORT}/`;
const CAP = path.join(ICI, 'captures');
fs.mkdirSync(CAP, { recursive: true });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const journal = [];
const log = (s) => { journal.push(s); };
const norm = (s) => (s ?? '').replace(/[\u00a0\u202f]/g, ' ').replace(/’/g, "'");

async function ouvrir(nav, url, largeur, hauteur) {
  const p = await nav.newPage();
  const tactile = largeur < 600;
  await p.setViewport({ width: largeur, height: hauteur ?? (tactile ? 844 : 800), deviceScaleFactor: tactile ? 2 : 1, isMobile: tactile, hasTouch: tactile });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/googleapis|firebase|gstatic|google\.com|firebaseio|generativelanguage/.test(new URL(r.url()).hostname) ? r.abort() : r.continue()));
  p.on('pageerror', (e) => log(`pageerror ${url}: ${e.message.slice(0, 160)}`));
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
  await attendre(900);
  for (let i = 0; i < 30 && /Chargement de la brasserie/.test(await p.evaluate(() => document.body.innerText)); i++) await attendre(500);
  return p;
}
const banc = (nav, q, l, h) => ouvrir(nav, `${H}?preview=carnets${q}`, l, h);
const texte = async (p) => norm(await p.evaluate(() => document.body.innerText));
async function toucher(p, t, { label = false, exact = false, dernier = false } = {}) {
  const h = await p.evaluateHandle((t, parLabel, exact, dernier) => {
    const n = (s) => (s ?? '').replace(/[\u00a0\u202f]/g, ' ').replace(/’/g, "'").trim();
    const els = [...document.querySelectorAll('button, a, [role="button"], [role="menuitem"], [role="tab"], summary, label')]
      .filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
    const ok = (e) => { const v = n(parLabel ? e.getAttribute('aria-label') : e.textContent); return exact ? v === t : v.includes(t); };
    const tous = els.filter(ok);
    return (dernier ? tous.at(-1) : tous[0]) ?? null;
  }, norm(t), label, exact, dernier);
  const el = h.asElement();
  if (!el) { log(`introuvable : ${t}`); return false; }
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  try { await el.tap(); } catch { await el.click(); }
  await attendre(700);
  return true;
}
const champ = (p) => p.evaluateHandle(() => [...document.querySelectorAll('textarea, input[type="text"], input:not([type])')]
  .find((e) => /Ajouter à|Une idée|J'écoute|J’écoute/.test(e.getAttribute('placeholder') ?? '') && e.offsetParent !== null) ?? null);
async function taper(p, phrase) {
  const el = (await champ(p)).asElement();
  if (!el) { log(`champ introuvable pour « ${phrase} »`); return false; }
  try { await el.tap(); } catch { await el.click(); }
  await el.type(phrase, { delay: 5 });
  await attendre(300);
  const fait = await p.evaluate(() => {
    const b = [...document.querySelectorAll('button')].filter((e) => e.offsetParent !== null && /^(Ajouter|Envoyer)$/.test((e.textContent ?? '').trim() || e.getAttribute('aria-label') || ''));
    if (b.length) { b.at(-1).click(); return true; } return false;
  });
  if (!fait) await p.keyboard.press('Enter');
  return true;
}
/** Suit l'état de la ligne d'état pendant ms : roue « L'IA range… » et bandeau fini en même temps ? */
async function suivre(p, ms, nom) {
  const vus = []; let simultane = 0;
  for (let t = 0; t < ms; t += 120) {
    const s = await p.evaluate(() => document.body.innerText.replace(/’/g, "'"));
    const roue = /L'IA range/.test(s);
    const fini = (s.match(/Carnet créé|\d+ lignes? rangées?|Rangé ici|Rangé dans|Photo rangée|Note modifiée|rangé sur l'appareil/g) ?? []).join('+');
    const etat = `${roue ? 'ROUE' : '-'}|${fini || '-'}`;
    if (roue && fini) simultane++;
    if (vus.at(-1) !== etat) vus.push(etat);
    await attendre(120);
  }
  log(`suivi [${nom}] ${vus.join(' → ')} ; roue+bandeau simultanés : ${simultane} relevés`);
}
const cap = async (p, nom, plein = false) => { await p.evaluate(() => document.activeElement?.blur?.()); await p.screenshot({ path: path.join(CAP, `${nom}.png`), fullPage: plein }); };
const capFocus = async (p, nom, plein = false) => p.screenshot({ path: path.join(CAP, `${nom}.png`), fullPage: plein });
const haut = (p) => p.evaluate(() => { window.scrollTo(0, 0); for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0; });
const bas = (p) => p.evaluate(() => { window.scrollTo(0, 1e6); for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== 'visible') e.scrollTop = 1e6; });
const lignesDe = (p, motif) => p.evaluate((m) => {
  const re = new RegExp(m);
  const tous = [...document.querySelectorAll('body *')].filter((e) => e.offsetParent !== null && re.test(e.innerText?.replace(/’/g, "'") ?? ''));
  const feuilles = tous.filter((e) => ![...e.children].some((c) => re.test(c.innerText?.replace(/’/g, "'") ?? '')));
  return feuilles.slice(0, 6).map((e) => { const r = e.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.25; return { t: e.innerText.slice(0, 70).replace(/\n/g, ' / '), lignes: Math.round(r.height / lh), y: Math.round(r.top + scrollY), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }; });
}, motif);
const contraste = (p, motif) => p.evaluate((m) => {
  const lum = (c) => { const v = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const fond = (e) => { for (let x = e; x; x = x.parentElement) { const b = getComputedStyle(x).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; } return 'rgb(255,255,255)'; };
  return [...document.querySelectorAll('button')].filter((e) => e.offsetParent !== null && new RegExp(m).test(e.innerText)).map((e) => {
    const cs = getComputedStyle(e); const a = lum(cs.color), b = lum(fond(e));
    return { t: e.innerText.slice(0, 40), disabled: e.disabled, color: cs.color, fond: fond(e), opacite: cs.opacity, ratio: +(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 1).toFixed(2) };
  });
}, motif);
const placeholders = (p) => p.evaluate(() => [...document.querySelectorAll('textarea, input')].filter((e) => e.offsetParent !== null).map((e) => e.getAttribute('placeholder')).filter(Boolean));
const colonnes = (p) => p.evaluate(() => [...document.querySelectorAll('main *, [class*="cn-"]')].filter((e) => e.offsetParent !== null && getComputedStyle(e).maxWidth !== 'none' && e.getBoundingClientRect().width > 300)
  .slice(0, 4).map((e) => `${(e.className?.toString?.() ?? '').split(' ')[0]}:${Math.round(e.getBoundingClientRect().width)}`));
const extrait = async (p, motif, n = 400) => { const t = await texte(p); const i = t.search(new RegExp(motif)); return i < 0 ? `(absent : ${motif})` : t.slice(Math.max(0, i - 40), i + n).replace(/\n/g, ' / '); };

const S = {};

/* PCN-43, 29, 28 : liste au repos et champ touché ; deux thèmes */
S.liste = async (nav) => {
  for (const l of [390, 1280]) for (const th of ['clair', 'sombre']) {
    const p = await banc(nav, `&theme=${th}`, l);
    await cap(p, `liste-${l}-${th}`);
    if (th === 'clair') {
      log(`[liste ${l}] lignes compte : ${JSON.stringify(await lignesDe(p, 'façons? · .*articles?'))}`);
      log(`[liste ${l}] 0 façon : ${/0 façon/.test(await texte(p))}`);
      log(`[liste ${l}] champ/En veille : ${JSON.stringify(await p.evaluate(() => {
        const c = [...document.querySelectorAll('textarea, input')].find((e) => e.offsetParent !== null); const cr = c?.getBoundingClientRect();
        const v = [...document.querySelectorAll('body *')].filter((e) => e.offsetParent !== null && /^En veille/.test(e.innerText ?? '') && e.children.length < 3).map((e) => e.getBoundingClientRect());
        const rc = (r) => r && { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
        return { champ: rc(cr), enVeille: v.slice(0, 2).map(rc), recouvre: v.some((r) => cr && r.top < cr.bottom && r.bottom > cr.top && r.left < cr.right && r.right > cr.left) };
      }))}`);
      log(`[liste ${l}] pastille À comparer : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.offsetParent !== null && (e.innerText ?? '').trim() === 'À comparer').map((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color])))}`);
      const c = (await champ(p)).asElement();
      if (c) { try { await c.tap(); } catch { await c.click(); } await attendre(700); }
      await capFocus(p, `liste-focus-${l}-${th}`);
      log(`[liste-focus ${l}] Collez le lien : ${/Collez le lien/.test(await texte(p))} ; extrait : ${await extrait(p, 'Collez le lien', 200)}`);
      log(`[liste-focus ${l}] placeholders : ${JSON.stringify(await placeholders(p))}`);
    }
    await p.close();
  }
};

/* PCN-4, 25, 27, 29 : créer « Moulin à malt… » depuis la liste */
S.creer = async (nav) => {
  for (const l of [390, 1280]) for (const th of ['clair', 'sombre']) {
    const p = await banc(nav, `&theme=${th}`, l);
    await taper(p, 'Moulin à malt 2 cylindres, 150 kg/h');
    await attendre(250); await capFocus(p, `creer-pendant-${l}-${th}`);
    await suivre(p, 5000, `creer ${l} ${th}`);
    await haut(p); await cap(p, `creer-apres-${l}-${th}`);
    if (th === 'clair') {
      log(`[creer ${l}] Ce qui compte : ${await extrait(p, 'Ce qui compte', 160)}`);
      log(`[creer ${l}] en-tête : ${await extrait(p, 'Idée · ', 80)} | Photos · aucune : ${/Photos · aucune/.test(await texte(p))} | Façons · aucune : ${/Façons · aucune/.test(await texte(p))}`);
      log(`[creer ${l}] placeholders : ${JSON.stringify(await placeholders(p))} ; champ w : ${await p.evaluate(() => Math.round([...document.querySelectorAll('textarea, input')].find((e) => e.offsetParent !== null)?.getBoundingClientRect().width ?? 0))}`);
      await cap(p, `creer-apres-plein-${l}`, true);
    }
    await p.close();
  }
};

/* Défaut neuf ? le carnet créé à 1280 se referme seul : 4 essais, relevé chaque seconde */
S.creer3 = async (nav) => {
  for (let k = 1; k <= 4; k++) {
    const l = k % 2 ? 1280 : 390;
    const p = await banc(nav, '&theme=clair', l);
    await taper(p, 'Moulin à malt 2 cylindres, 150 kg/h');
    const vus = [];
    for (let s = 0; s < 8; s++) { await attendre(1000); vus.push(await p.evaluate(() => (/Ajouter à/.test([...document.querySelectorAll('textarea, input')].find((e) => e.offsetParent !== null)?.getAttribute('placeholder') ?? '') ? 'ouvert' : 'liste'))); }
    log(`[creer3 ${k} ${l}] ${vus.join(' ')}`);
    if (vus.includes('liste')) { await cap(p, `creer3-referme-${k}-${l}`, true); log(`[creer3 ${k}] liste : ${(await texte(p)).slice(0, 900).replace(/\n/g, ' / ')}`); }
    await p.close();
  }
};

/* PCN-7, 47, 38, 31, 19 : Ventilation ouverte */
S.ventilation = async (nav) => {
  for (const l of [390, 1280]) {
    let p = await banc(nav, '&theme=clair', l);
    await toucher(p, 'Ventilation');
    await haut(p); await cap(p, `vent-ouvert-${l}`); await cap(p, `vent-ouvert-plein-${l}`, true);
    log(`[vent ${l}] Critère : ${JSON.stringify(await lignesDe(p, "Critère :"))}`);
    log(`[vent ${l}] tableau y : ${JSON.stringify(await p.evaluate(() => { const t = document.querySelector('table, [role="table"], [class*="tableau"]'); return t ? Math.round(t.getBoundingClientRect().top + scrollY) : null; }))} ; hauteur écran ${l < 600 ? 844 : 800}`);
    log(`[vent ${l}] noms 2 lignes : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.cn-deux-lignes')].filter((e) => e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(e).lineHeight) || 18; return `${e.innerText.slice(0, 28)}:${Math.round(r.height / lh)}`; })))}`);
    log(`[vent ${l}] tient 80 °C : ${JSON.stringify(await lignesDe(p, 'tient 80 °C'))}`);
    log(`[vent ${l}] colonnes : ${JSON.stringify(await colonnes(p))}`);
    await bas(p); await attendre(400); await cap(p, `vent-bas-${l}`);
    log(`[vent-bas ${l}] champ : ${JSON.stringify(await p.evaluate(() => { const c = [...document.querySelectorAll('textarea, input')].find((e) => e.offsetParent !== null); const r = c?.getBoundingClientRect(); return r && { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, w: Math.round(r.width) }; }))}`);
    // PCN-7 : « doit tenir 80 °C »
    await taper(p, 'doit tenir 80 °C');
    await attendre(200); await capFocus(p, `vent-80-pendant-${l}`);
    await suivre(p, 5000, `vent 80 ${l}`);
    await haut(p); await cap(p, `vent-80-apres-${l}`);
    log(`[vent-80 ${l}] Ce qui compte : ${await extrait(p, 'Ce qui compte|Critère :', 220)}`);
    log(`[vent-80 ${l}] « doit tenir 80 » ailleurs : ${await extrait(p, 'doit tenir 80', 120)}`);
    await p.close();
    // PCN-19 : note qui ressemble à un critère
    p = await banc(nav, '&theme=clair&ouvrir=ventilation', l);
    await taper(p, 'moins de 60 dB');
    await suivre(p, 3000, `vent 60dB ${l}`);
    await capFocus(p, `vent-60db-${l}`);
    log(`[vent-60dB ${l}] Ressemble à un critère : ${/Ressemble à un critère/.test(await texte(p))} ; extrait : ${await extrait(p, 'Ressemble|moins de 60', 200)}`);
    await p.close();
  }
  for (const th of ['sombre']) {
    const p = await banc(nav, `&theme=${th}&ouvrir=ventilation`, 1280);
    await bas(p); await attendre(400); await cap(p, `vent-bas-1280-${th}`);
    await p.close();
  }
};

/* PCN-14, 46, 41, 30, 13, 40, 23-bis : Comparer, Choisir, article, Pourquoi */
S.decider = async (nav) => {
  for (const l of [390, 1280]) {
    const p = await banc(nav, '&theme=clair&ouvrir=ventilation', l);
    log(`[decider ${l}] carnet colonnes : ${JSON.stringify(await colonnes(p))} ; placeholders ${JSON.stringify(await placeholders(p))}`);
    if (!(await toucher(p, 'Comparer', { exact: true }))) await toucher(p, 'Comparer');
    await haut(p); await cap(p, `comparer-${l}`); await cap(p, `comparer-plein-${l}`, true);
    const t = await texte(p);
    log(`[comparer ${l}] Compromis : ${await extrait(p, 'Compromis', 140)} | Valeurs annoncées : ${/Valeurs annoncées par les vendeurs/.test(t)} | de plus : ${await extrait(p, '→ \\d+ de plus|\\d+ de plus', 30)} | img : ${await p.evaluate(() => [...document.querySelectorAll('img')].filter((e) => e.offsetParent !== null).length)}`);
    log(`[comparer ${l}] écartés : ${await extrait(p, 'écarté', 200)}`);
    log(`[comparer ${l}] colonnes : ${JSON.stringify(await colonnes(p))} ; placeholders ${JSON.stringify(await placeholders(p))}`);
    log(`[comparer ${l}] défilement horizontal : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 10 && getComputedStyle(e).overflowX !== 'visible' && e.offsetParent !== null).map((e) => `${(e.className?.toString?.() ?? '').split(' ')[0]} ${e.clientWidth}/${e.scrollWidth}`)))}`);
    await p.goBack?.().catch(() => {});
    await p.close();
    // Choisir
    const q = await banc(nav, '&theme=clair&ouvrir=ventilation', l);
    if (await toucher(q, 'Retenir la hotte')) {
      await haut(q); await cap(q, `choisir-${l}`); await cap(q, `choisir-plein-${l}`, true);
      log(`[choisir ${l}] écartés : ${await extrait(q, 'écarté', 200)} ; placeholders ${JSON.stringify(await placeholders(q))}`);
      log(`[choisir ${l}] prix : ${(await texte(q)).match(/[\d' ]+(?:[.,]\d+)?\s*(?:CHF)?/g)?.filter((x) => /\d{2,}/.test(x)).slice(0, 12).join(' | ')}`);
      await q.goto(`${H}?preview=carnets&theme=clair&ouvrir=frigo`, { waitUntil: 'networkidle0' }); await attendre(900); if (await toucher(q, 'Pourquoi')) { await cap(q, `pourquoi-${l}`); log(`[pourquoi ${l}] texte : ${(await extrait(q, 'Pourquoi', 300))} ; placeholders ${JSON.stringify(await placeholders(q))}`); }
    }
    await q.close();
    // Article ouvert : premier article de la Ventilation
    const r = await banc(nav, '&theme=clair&ouvrir=ventilation', l);
    const nomArticle = await r.evaluate(() => document.querySelector('.cn-deux-lignes')?.innerText ?? '');
    log(`[article ${l}] ouvre : ${nomArticle.slice(0, 40)}`);
    if (nomArticle && await toucher(r, nomArticle.slice(0, 18))) {
      await haut(r); await cap(r, `article-${l}`); await cap(r, `article-plein-${l}`, true);
      log(`[article ${l}] texte : ${(await texte(r)).slice(0, 500).replace(/\n/g, ' / ')}`);
      log(`[article ${l}] Choisir : ${JSON.stringify(await contraste(r, '^Choisir'))} ; img : ${await r.evaluate(() => [...document.querySelectorAll('img')].filter((e) => e.offsetParent !== null).map((e) => e.src.slice(-40)))}`);
    }
    await r.close();
  }
};

/* PCN-10, 23 (D-35), 40 (lien déposé) : deux pompes depuis la liste */
S.pompes = async (nav) => {
  for (const l of [390, 1280]) {
    const p = await banc(nav, '&theme=clair', l);
    await taper(p, 'https://exemple.invalid/pompe-inox');
    await suivre(p, 2500, `pompe1 ${l}`); await haut(p); await cap(p, `pompe1-${l}`);
    log(`[pompe1 ${l}] texte : ${(await texte(p)).slice(0, 400).replace(/\n/g, ' / ')}`);
    await taper(p, 'https://exemple.invalid/pompe-magnetique');
    await suivre(p, 2500, `pompe2 ${l}`); await haut(p); await cap(p, `pompe2-${l}`); await cap(p, `pompe2-plein-${l}`, true);
    log(`[pompe2 ${l}] texte : ${(await texte(p)).slice(0, 700).replace(/\n/g, ' / ')}`);
    const puce = await p.evaluate(() => { const z = [...document.querySelectorAll('body *')].find((e) => /Comparer sur/.test(e.innerText ?? '') && e.querySelector('button') && e.innerText.length < 120); const b = z && [...z.querySelectorAll('button')].find((x) => /Ajouter/.test(x.innerText)); b?.click(); return !!b; }); await attendre(700); log(`[pompe2 ${l}] tableau : ${await extrait(p, 'rang · article|1re', 300)}`);
    if (puce) { await suivre(p, 1500, `puce ${l}`); await haut(p); await cap(p, `pompe-puce-${l}`); log(`[puce ${l}] après : ${(await texte(p)).slice(0, 500).replace(/\n/g, ' / ')}`); }
    await p.close();
  }
};

/* PCN-20 : g35, Supprimer l'idée */
S.g35 = async (nav) => {
  for (const l of [390, 1280]) {
    const p = await banc(nav, '&theme=clair&g35=1&ouvrir=ventilation', l);
    await toucher(p, 'Plus', { label: true }); await toucher(p, "Supprimer l'idée");
    await attendre(500); await haut(p); await cap(p, `g35-supprimer-${l}`);
    log(`[g35 ${l}] : ${await extrait(p, 'veille|Déplacer', 250)}`);
    await p.close();
  }
};

/* PCN-35, 42, 45 : Supprimer une idée liée (Frigo, plan À venir) ; deux thèmes */
S.lie = async (nav) => {
  for (const l of [390, 1280]) for (const th of ['clair', 'sombre']) {
    const p = await banc(nav, `&theme=${th}&lien-retient=a-venir`, l);
    await haut(p); await cap(p, `lie-ouvert-${l}-${th}`);
    await toucher(p, 'Plus', { label: true }); await toucher(p, 'Supprimer le carnet');
    await attendre(500); await haut(p); await cap(p, `lie-supprimer-${l}-${th}`);
    if (th === 'clair') {
      log(`[lie ${l}] phrase en titre : ${await extrait(p, 'phrase en titre', 120)}`);
      log(`[lie ${l}] page : ${(await texte(p)).slice(0, 600).replace(/\n/g, ' / ')}`);
      log(`[lie ${l}] lignes lien : ${JSON.stringify(await lignesDe(p, 'À venir'))}`);
    }
    log(`[lie ${l} ${th}] bouton Supprimer : ${JSON.stringify(await contraste(p, '^Supprimer'))}`);
    await p.close();
  }
};

/* PCN-22 : hors ligne et IA éteinte, Frigo, 390 */
S.horsligne = async (nav) => {
  for (const [q, n] of [['&hors-ligne=1', 'horsligne'], ['&ia=eteint', 'iaeteinte']]) for (const l of [390, 1280]) {
    const p = await banc(nav, `&theme=clair&ouvrir=frigo${q}`, l);
    await cap(p, `${n}-avant-${l}`);
    log(`[${n} ${l}] avant : ${await extrait(p, 'IA|hors ligne|Hors ligne', 120)}`);
    await taper(p, 'filtre à air G4, 2 pièces');
    await suivre(p, 3000, `${n} ${l}`);
    await capFocus(p, `${n}-apres-${l}`); await cap(p, `${n}-apres-plein-${l}`, true);
    log(`[${n} ${l}] bandeau : ${await extrait(p, 'IA éteinte|rangé sur|Hors ligne|hors ligne', 160)} ; filtre : ${await extrait(p, 'filtre à air', 120)}`);
    log(`[${n} ${l}] rubriques : ${JSON.stringify(await p.evaluate(() => { const e = [...document.querySelectorAll('body *')].filter((x) => x.offsetParent !== null && /filtre à air G4/.test(x.innerText ?? '') && x.children.length === 0)[0]; const out = []; for (let x = e; x && out.length < 8; x = x.parentElement) { const h = x.querySelector?.('h2, h3, [class*="rubrique"], [class*="titre"]'); if (h && !out.includes(h.innerText)) out.push(h.innerText.slice(0, 40)); } return out; }))}`);
    await p.close();
  }
};

/* PCN-24 : scénario D-63 de zéro */
S.zero = async (nav) => {
  for (const l of [390, 1280]) {
    const p = await banc(nav, '&theme=clair&zero=1', l);
    const phrases = ['frigo de garde', 'hotte 1 200 m³/h', 'évier inox 2 bacs', 'tuyau silicone 8 mm 5 m', 'résine pour le sol'];
    let i = 0;
    for (const ph of phrases) {
      await taper(p, ph); await suivre(p, 2600, `zero ${l} ${ph}`);
      await haut(p); await cap(p, `zero-${++i}-${l}`);
      log(`[zero ${l} ${i}] ${ph} → ${(await texte(p)).slice(0, 260).replace(/\n/g, ' / ')}`);
      if (!(await toucher(p, 'Carnets', { label: true }))) await toucher(p, '‹ Carnets') || await toucher(p, 'Carnets', { exact: true });
      await attendre(500);
    }
    await haut(p); await cap(p, `zero-liste-${l}`); await cap(p, `zero-liste-plein-${l}`, true);
    log(`[zero ${l}] liste : ${(await texte(p)).slice(0, 700).replace(/\n/g, ' / ')}`);
    await p.close();
  }
};

/* PCN-21 : photo */
S.photo = async (nav) => {
  const image = path.join(CAP, '..', '..', 'f2', 'captures', 'frigo-390-clair.png');
  for (const l of [390, 1280]) {
    const p = await banc(nav, '&theme=clair&ouvrir=ventilation', l);
    const input = await p.$('input[type="file"]');
    log(`[photo ${l}] input file : ${!!input} ; boutons photo : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /photo|📷/i.test((b.getAttribute('aria-label') ?? '') + b.innerText)).map((b) => b.getAttribute('aria-label') || b.innerText)))}`);
    if (input) {
      await input.uploadFile(image); await attendre(800); await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent !== null && (b.innerText ?? '').trim() === 'Ajouter').at(-1)?.click());
      await suivre(p, 3000, `photo ${l}`);
      await capFocus(p, `photo-apres-${l}`); await cap(p, `photo-apres-plein-${l}`, true);
      log(`[photo ${l}] : ${await extrait(p, 'Photo|photo', 200)} ; non lue : ${/non lue/.test(await texte(p))}`);
    }
    await p.close();
  }
};

/* PCN-33 : modifier une note du bas */
S.note = async (nav) => {
  for (const l of [390, 1280]) {
    const p = await banc(nav, '&theme=clair&ouvrir=ventilation', l);
    const n = await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /Actions|···|Plus de/.test(b.getAttribute('aria-label') ?? '') && b.offsetParent !== null).map((b) => b.getAttribute('aria-label')));
    log(`[note ${l}] menus : ${JSON.stringify(n)}`);
    const h = await p.evaluateHandle(() => [...document.querySelectorAll('button')].filter((b) => /note/i.test(b.getAttribute('aria-label') ?? '') && b.offsetParent !== null).at(-1) ?? null);
    const el = h.asElement();
    if (el) {
      await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); try { await el.tap(); } catch { await el.click(); } await attendre(500);
      await toucher(p, 'Modifier'); await attendre(500);
      await capFocus(p, `note-modifier-${l}`);
      log(`[note ${l}] Se modifie ici : ${JSON.stringify(await lignesDe(p, 'Se modifie ici'))} ; scrollY ${await p.evaluate(() => Math.round(scrollY))} ; vh ${await p.evaluate(() => innerHeight)} ; champ : ${await p.evaluate(() => [...document.querySelectorAll('textarea, input')].find((e) => e.offsetParent !== null)?.value?.slice(0, 60))}`);
    }
    await p.close();
  }
};

/* PCN-37 : 390×660, champ touché (clavier non simulé en sans écran) */
S.clavier = async (nav) => {
  const p = await banc(nav, '&theme=clair&ouvrir=ventilation&g8=1', 390, 660);
  const c = (await champ(p)).asElement(); if (c) { try { await c.tap(); } catch { await c.click(); } await attendre(800); }
  await capFocus(p, 'clavier-390x660');
  log(`[clavier] visualViewport ${await p.evaluate(() => `${visualViewport.height}/${innerHeight}`)} ; bulle : ${await extrait(p, 'peut trancher', 100)} ; champ+bulle : ${JSON.stringify(await p.evaluate(() => { const c = [...document.querySelectorAll('textarea, input')].find((e) => e.offsetParent !== null)?.getBoundingClientRect(); return c && { top: Math.round(c.top), bas: Math.round(c.bottom) }; }))}`);
  await p.close();
};

/* PCN-39 : À venir */
S.avenir = async (nav) => {
  for (const l of [390, 1280]) {
    const p = await banc(nav, '&theme=clair', l);
    await toucher(p, 'À venir');
    await attendre(800); await haut(p); await cap(p, `avenir-${l}`); await cap(p, `avenir-plein-${l}`, true);
    const t = await texte(p);
    log(`[avenir ${l}] « Ouvrir le carnet » ×${(t.match(/Ouvrir le carnet/g) ?? []).length} ; « + » visibles : ${await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent !== null && /^\+$|^＋$/.test((b.innerText ?? '').trim() || '') || /Ajouter|Nouveau/.test(b.getAttribute('aria-label') ?? '')).map((b) => b.getAttribute('aria-label') || b.innerText).join(' | '))} ; À venir ×${(t.match(/À venir/g) ?? []).length}`);
    log(`[avenir ${l}] texte : ${t.slice(0, 500).replace(/\n/g, ' / ')}`);
    await p.close();
  }
};

/* L11 : le parcours réel dans l'app (?dev-local, Stocks › Matériel › Carnets) */
S.app = async (nav) => {
  for (const l of [390, 1280]) {
    const p = await ouvrir(nav, `${H}?dev-local`, l);
    await toucher(p, 'Stocks'); await attendre(800);
    await toucher(p, 'Matériel'); await attendre(800);
    await p.evaluate(() => [...document.querySelectorAll('button, [role=tab]')].find((b) => b.offsetParent !== null && /^Carnetss*d*$/.test((b.innerText ?? '').replace(/s+/g, ' ').trim()))?.click()); await attendre(1200);
    await cap(p, `app-carnets-${l}`);
    log(`[app ${l}] carnets : ${(await texte(p)).slice(0, 300).replace(/\n/g, ' / ')}`);
    await taper(p, 'Moulin à malt 2 cylindres, 150 kg/h');
    await suivre(p, 5000, `app creer ${l}`);
    await haut(p); await cap(p, `app-creer-${l}`);
    log(`[app ${l}] créé : ${await extrait(p, 'Ce qui compte', 160)} ; placeholders ${JSON.stringify(await placeholders(p))}`);
    await taper(p, 'https://exemple.invalid/pompe-inox'); await suivre(p, 2500, `app pompe1 ${l}`);
    await taper(p, 'https://exemple.invalid/pompe-magnetique'); await suivre(p, 2500, `app pompe2 ${l}`);
    await haut(p); await cap(p, `app-pompes-${l}`);
    log(`[app ${l}] après pompes : ${(await texte(p)).slice(0, 500).replace(/\n/g, ' / ')}`);
    await p.close();
  }
};

/* M9-3, LR1-9 : Dépense ?dev-local&depense=… */
async function feuilleDepense(nav, etat, l) {
  const p = await ouvrir(nav, `${H}?dev-local&depense=${etat}`, l);
  await p.click('[aria-label="Actions rapides"]').catch(() => log('Actions rapides introuvable'));
  await attendre(600);
  await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent))?.click());
  await attendre(2500);
  return p;
}
S.depense = async (nav) => {
  for (const l of [390, 1280]) {
    const p = await feuilleDepense(nav, '3', l);
    log(`[M9-3 ${l}] avant : ${await extrait(p, 'Somme', 80)} | pied : ${await extrait(p, 'Lignes \\d', 80)}`);
    await cap(p, `m93-avant-${l}`);
    const ok = await p.evaluate(() => { const b = document.querySelector('[aria-label="Retirer la ligne 3"]'); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true; });
    await attendre(1200);
    log(`[M9-3 ${l}] retiré : ${ok} | Somme : ${await extrait(p, 'Somme', 80)} | pied : ${await extrait(p, 'Lignes \\d', 80)}`);
    await haut(p); await cap(p, `m93-apres-${l}`); await cap(p, `m93-apres-plein-${l}`, true);
    await p.close();
  }
  for (const etat of ['3', 'deux-taux', 's6', 'commande', 'vaccins', 'renovation', 'familles', 'lenteur-lue', 'port']) {
    const p = await feuilleDepense(nav, etat, 390);
    const t = await texte(p);
    log(`[LR1-9 sonde ${etat}] désaccord : ${/désaccord/.test(t)} ; Voir le désaccord : ${/Voir le désaccord/.test(t)}`);
    if (/Voir le désaccord/.test(t)) {
      await cap(p, `lr19-avant-${etat}-390`);
      await toucher(p, 'Voir le désaccord'); await attendre(800);
      await capFocus(p, `lr19-apres-${etat}-390`);
      log(`[LR1-9 ${etat}] après : ${await extrait(p, 'lecture|Lecture', 300)} ; pied : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('footer, [class*="pied"], [class*="sticky"], [class*="fixed"]')].filter((e) => e.offsetParent !== null).map((e) => Math.round(e.getBoundingClientRect().height))))}`);
      await p.close(); break;
    }
    await p.close();
  }
};

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--lang=fr-CH'] });
try {
  for (const [id, jouer] of Object.entries(S)) {
    if (SEULS && !SEULS.includes(id)) continue;
    log(`=== ${id}`);
    try { await jouer(nav); } catch (e) { log(`ÉCHEC ${id} : ${e.message.slice(0, 200)}`); }
    fs.writeFileSync(path.join(CAP, `journal${SEULS ? '-' + SEULS.join('-') : ''}.txt`), journal.join('\n'));
  }
} finally {
  await nav.close();
  fs.writeFileSync(path.join(CAP, `journal${SEULS ? '-' + SEULS.join('-') : ''}.txt`), journal.join('\n'));
}
