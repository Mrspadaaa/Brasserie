// Voie w1, tour 2 (k3) : captures APRÈS correctif. Fixtures du banc local `?dev-local` (jamais Firestore réel).
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3103 --env PORT=3103 -- node work/missions/2026-11-19-bugs-ecrans/voies/w1/capturer-k3.mjs [banc|reprise|ouverture]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3103').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const filtreLargeur = args.filter((a) => /^\d+$/.test(a)).map(Number);
const filtreTheme = args.filter((a) => /^(clair|cave)$/.test(a));
const nomParties = args.filter((a) => /^(banc|reprise|ouverture)$/.test(a));
const parties = nomParties.length ? nomParties : ['banc', 'reprise', 'ouverture'];

const cliquer = (page, re, sel = 'button,[role=button],[role=menuitem],[role=tab],[role=switch],summary,a') => page.evaluate((src, s) => {
  const r = new RegExp(src, 'i');
  const b = [...document.querySelectorAll(s)].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
  if (b) { b.click(); return (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 40); } return false;
}, re.source, sel);
const attendreCharge = (page) => page.waitForFunction(() => !!document.querySelector('[aria-current="step"]') && !/Chargement/.test(document.body.innerText), { timeout: 170000 });
const photo = async (page, nom, mobile, bas = mobile) => {
  await dormir(600);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`) });
  if (bas) {
    await page.evaluate(() => { document.querySelectorAll('*').forEach((n) => { if (n.scrollHeight > n.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(n).overflowY)) n.scrollTop = n.scrollHeight; }); window.scrollTo(0, 99999); });
    await dormir(700);
    await page.screenshot({ path: path.join(SORTIE, `${nom}-bas.png`) });
  }
};
const ouvrirDepliant = (page, sel) => page.evaluate((s) => { const d = document.querySelector(s); if (d) { d.open = true; d.scrollIntoView({ block: 'center' }); return true; } return false; }, sel);
const nouvellePage = async (largeur, theme) => {
  const mobile = largeur < 600;
  const o = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
  await o.page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
  return { ...o, mobile, tag: `${largeur}-${theme}` };
};

// --- banc : TL-7 (Identité, Levure, Récap), BK2-5 (additifs, conversion), TL-16 (eau) -------------------------------------------------------
async function banc(largeur, theme) {
  const { browser, page, journal, mobile, tag } = await nouvellePage(largeur, theme);
  try {
    await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
    await attendreCharge(page); await dormir(2000);
    await cliquer(page, /^Identité/); await dormir(1200);
    await cliquer(page, /Objectif NOLO/, '[role=switch]'); await dormir(1500);
    await photo(page, `w1-tl7-identite-${tag}`, mobile, true);
    await cliquer(page, /^Levure/); await dormir(2500);
    console.log(tag, 'levure : renvoi', await page.evaluate(() => !!document.querySelector('[data-role="nolo-materiel-renvoi"]')), 'invite', await page.evaluate(() => !!document.querySelector('aside[aria-label="Matériel requis pour le scénario NOLO"]')));
    await photo(page, `w1-tl7-levure-${tag}`, mobile, true);
    await cliquer(page, /^Récap/); await dormir(2500);
    console.log(tag, 'recap : phrase jargon', await page.evaluate(() => /Relation de fermentation limitée/.test(document.body.innerText)));
    await page.evaluate(() => window.scrollTo(0, 0)); await dormir(300);
    await photo(page, `w1-tl7-recap-haut-${tag}`, mobile, false);
    await cliquer(page, /^Plus/, 'summary'); await dormir(600);
    await photo(page, `w1-tl7-recap-${tag}`, mobile, true);

    // BK2-5 : une coriandre rangée parmi les fermentescibles (conversion), puis une ligne d'additif saisie.
    await cliquer(page, /^Malts/); await dormir(2500);
    await page.evaluate(() => { const c = document.querySelector('input[placeholder^="Nom (et kg)"]'); if (c) c.focus(); });
    await page.keyboard.type('Coriandre 0,03'); await page.keyboard.press('Enter'); await dormir(1200);
    const epice = await page.evaluate(() => document.querySelector('[data-role="epices-a-noter"]')?.textContent ?? null);
    console.log(tag, 'epice à noter', epice);
    if (largeur >= 1000 && epice) {
      await ouvrirDepliant(page, '[data-role="additifs"]'); await dormir(500);
      await photo(page, `w1-bk25-conversion-${tag}-avant`, false, false);
      await cliquer(page, /Noter .* en additif|Noter en additif/); await dormir(900);
      await ouvrirDepliant(page, '[data-role="additifs"]'); await dormir(400);
      await photo(page, `w1-bk25-conversion-${tag}-apres`, false, false);
    } else if (!epice) {
      await ouvrirDepliant(page, '[data-role="additifs"]'); await dormir(300);
      await cliquer(page, /Ajouter un additif/); await dormir(500);
      await page.evaluate(() => document.querySelector('[aria-label="Nom de l’additif 1"]')?.focus());
      await page.keyboard.type('Coriandre'); await dormir(400);
      await page.evaluate(() => document.querySelector('[aria-label^="Quantité de Coriandre"]')?.focus());
      await page.keyboard.type('12,5'); await dormir(500);
    } else {
      await ouvrirDepliant(page, '[data-role="additifs"]'); await dormir(300);
      await cliquer(page, /Noter .* en additif|Noter en additif/); await dormir(900);
    }
    console.log(tag, 'additif', await page.evaluate(() => { const l = document.querySelector('[data-additif="0"]'); const g = l?.querySelector('[data-role="additif-ligne"]'); return l ? { texte: l.textContent.slice(0, 80), largeurs: [...(g?.children ?? [])].map((c) => Math.round(c.getBoundingClientRect().width)) } : null; }));
    await page.evaluate(() => document.querySelector('[data-role="additifs"]')?.scrollIntoView({ block: 'center' }));
    await photo(page, `w1-bk25-additifs-${tag}`, mobile, mobile);

    // TL-16 : eau d'empâtage tapée trop courte.
    await cliquer(page, /^Eau/); await dormir(2500);
    await page.evaluate(() => { const c = document.getElementById('wz-mash-water'); if (c) { c.focus(); c.select?.(); } });
    await page.keyboard.type('12,0'); await page.keyboard.press('Tab'); await dormir(800);
    console.log(tag, 'eau', JSON.stringify(await page.evaluate(() => { const m = document.querySelector('[data-role="messages-volumes"]'); const cs = m && getComputedStyle(m); return { msg: m?.textContent?.slice(0, 80), bord: cs?.borderColor }; })));
    await photo(page, `w1-tl16-eau-${tag}`, mobile, mobile);
  } catch (e) { console.log(tag, 'banc ÉCHEC', String(e?.message ?? e).slice(0, 200)); }
  console.log(tag, 'erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
  await browser.close();
}

const versRecettes = async (page, mobile) => {
  await page.goto(`${url}/?dev-local`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 170000 });
  await dormir(2500);
  const nav = await cliquer(page, /^Brassins$/, 'nav button, nav a, [role=tab], button, a'); await dormir(2000);
  const onglet = await cliquer(page, /^Recettes/, '[role=tab], button'); await dormir(2000);
  return { nav, onglet };
};

// --- reprise : TL-19, par Brassins › Recettes › Nouvelle recette ----------------------------------------------------------------------------
async function reprise(largeur, theme) {
  const { browser, page, journal, mobile, tag } = await nouvellePage(largeur, theme);
  const etapes = [];
  try {
    etapes.push(JSON.stringify(await versRecettes(page, mobile)));
    etapes.push('nouvelle ' + await cliquer(page, /^Nouvelle recette$/)); await dormir(2500);
    await page.waitForSelector('#wz-title', { timeout: 20000 });
    await page.type('#wz-title', 'ZZ TEST — reprise'); await dormir(1200);
    await cliquer(page, /^Malts/); await dormir(1500);
    etapes.push('retour ' + await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^(Retour|Fermer|Quitter|Revenir)/i.test(x.getAttribute('aria-label') || '') && x.getClientRects().length); if (b) { b.click(); return b.getAttribute('aria-label'); } return false; }));
    await dormir(1800);
    etapes.push(JSON.stringify(await versRecettes(page, mobile)));
    etapes.push('nouvelle 2 ' + await cliquer(page, /^Nouvelle recette$/)); await dormir(1500);
    const lu = await page.evaluate(() => { const s = document.querySelector('[data-reprise="true"]'); return s ? { texte: s.textContent.trim(), taille: getComputedStyle(s).fontSize, bord: getComputedStyle(s).borderTopWidth } : 'absent'; });
    etapes.push('reprise ' + JSON.stringify(lu));
    await photo(page, `w1-tl19-reprise-${tag}`, false, false);
  } catch (e) { etapes.push('ÉCHEC ' + String(e?.message ?? e).slice(0, 160)); }
  console.log(tag, 'reprise', etapes.join(' | '), 'erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
  await browser.close();
}

// --- ouverture : TL-16, une recette enregistrée de la démo ouverte par « Modifier », étape Eau sans rien toucher ------------------------------
async function ouverture(largeur, theme) {
  const { browser, page, journal, mobile, tag } = await nouvellePage(largeur, theme);
  const etapes = [];
  try {
    // La démo locale n'a aucune recette enregistrée (« Recettes (0) ») : le banc ouvre la recette d'aperçu directement à l'étape Eau, sans rien toucher.
    await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
    await attendreCharge(page); await dormir(2500);
    etapes.push('eau ' + await cliquer(page, /^Eau/)); await dormir(2500);
    etapes.push(JSON.stringify(await page.evaluate(() => { const m = document.querySelector('[data-role="messages-volumes"]'); const cs = m && getComputedStyle(m); return { msg: m?.textContent?.slice(0, 90) ?? null, bord: cs?.borderColor ?? null, rouge: [...document.querySelectorAll('[class*="alert-strong"]')].filter((n) => n.getClientRects().length).map((n) => n.textContent.slice(0, 50)) }; })));
    await photo(page, `w1-tl16-ouverture-${tag}`, false, false);
  } catch (e) { etapes.push('ÉCHEC ' + String(e?.message ?? e).slice(0, 160)); }
  console.log(tag, 'ouverture', etapes.join(' | '), 'erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
  await browser.close();
}

const fonctions = { banc, reprise, ouverture };
for (const [l, t] of [[1280, 'clair'], [1280, 'cave'], [390, 'clair'], [390, 'cave']].filter(([l, t]) => (!filtreLargeur.length || filtreLargeur.includes(l)) && (!filtreTheme.length || filtreTheme.includes(t)))) {
  for (const p of parties) {
    for (let essai = 1; essai <= 2; essai++) {
      try { await fonctions[p](l, t); break; } catch (e) { console.log(l, t, p, 'essai', essai, 'échec :', String(e?.message ?? e).slice(0, 160)); }
    }
  }
}
console.log('FIN');
