// Contrôle CAL-APP (17.11, port du calendrier dans l'app) : l'onglet Calendrier de l'app, joué sur un vrai rendu Chrome.
// « Le bouton+ ici n'a pas du tout la bonne fonctionne… NE PERDS RIEN DANS LE PORTAGE » ; « Trop d'info quand on bouge qqch, ça devient illisible » ;
// « les évènements sont trop petites, peut être utilisé un icône » ; « Ça forcé pas à renverser le téléphone ??? ».
//
// node scripts/agents/controle-calendrier-app.mjs <url> [--sans-banc]   → CAL-APP OK | CAL-APP ECHEC
//   <url> : le banc `http://localhost:3017/?preview=calendrier` (fixture « banc — données simulées »), servi par `PORT=3017 npm run dev`.
//
// Neuf mesures, 390 × 844 tactile puis 844 × 390 :
//   ENTETE        courbe d'au moins 80 px, bande des semaines de 40 px au plus, en-tête de 180 px au plus (portrait)
//   BANDE         au repos, la bande ne contient que « S\d+ » (la semaine seule : ni solde, ni mouvement, ni icône)
//   PLUS          les carrés + des sept rangées forment une colonne (x à 2 px près) et sont des boutons
//   PLUS-AGIT     chaque carré ouvre la feuille d'ajout déjà réglée sur sa rangée
//   BRUIT         après f1-a puis f6-b : un seul role="status" ou "alert", deux lignes au plus
//   FAB           le + volant dans le tiers droit, de 4 à 24 px au-dessus des onglets
//   ROTATION      390 × 844 → 844 × 390 → 390 × 844 : une chose ajoutée reste, sans recharger
//   PAYS          en paysage : 13 semaines, en-tête de 120 px au plus, rangée médiane de 48 px au plus
//   BARRE-PETITE  en 6 mois : aucune barre de moins de 24 px ; la chose courte est une marque nommée
// Témoin négatif (L13) : l'onglet v1 de `claude/ports-nuit-1611` rend CAL-APP ECHEC (pas de rangées, pas de carrés +).
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const puppeteer = req('puppeteer-core');
const url = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!url) { console.log('usage : node scripts/agents/controle-calendrier-app.mjs <url>'); process.exit(2); }
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const attendre = ms => new Promise(r => setTimeout(r, ms));
const ecran = (w, h) => ({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1, isLandscape: w > h });

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const bilan = [];
const note = (nom, ok, dit) => { bilan.push({ nom, ok }); console.log(`${ok ? 'ok' : 'KO'} ${nom} : ${dit}`); };

async function page(w, h) {
  const p = await nav.newPage();
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  await p.setViewport(ecran(w, h));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 });
  await p.waitForSelector('[data-frise], [data-calendrier]', { timeout: 20000 }).catch(() => {});
  await attendre(900);
  p.erreurs = erreurs;
  return p;
}
const centre = async (p, sel, i = 0) => p.evaluate((s, k) => { const e = document.querySelectorAll(s)[k]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }, sel, i);
async function glisser(p, sel, nomRe, colonnes) {
  const c = await p.evaluate((s, re) => {
    const e = [...document.querySelectorAll(s)].find(x => new RegExp(re).test(x.getAttribute('aria-label') || ''));
    if (!e) return null;
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    const lc = parseFloat(document.querySelector('[data-frise]').getAttribute('data-largeur-colonne'));
    return { x: r.left + Math.min(r.width / 2, 20), y: r.top + r.height / 2, lc };
  }, sel, nomRe);
  if (!c) return false;
  await p.mouse.move(c.x, c.y); await p.mouse.down();
  for (let i = 1; i <= 6; i++) { await p.mouse.move(c.x + (colonnes * c.lc * i) / 6, c.y); await attendre(15); }
  await p.mouse.up(); await attendre(350);
  return true;
}

try {
  /* ---- portrait ---- */
  let p = await page(390, 844);
  const aRangees = await p.evaluate(() => document.querySelectorAll('section[data-rangee]').length);
  if (!aRangees) {
    note('ENTETE', false, 'aucune rangée de la frise : ce n’est pas l’onglet Calendrier du port');
    note('PLUS', false, 'aucun carré + de rangée');
  }

  const ent = await p.evaluate(() => {
    const zone = document.querySelector('[data-entete-zone]') || document.querySelector('[data-calendrier-entete]');
    const svg = [...document.querySelectorAll('[data-calendrier-entete] svg')].map(s => s.getBoundingClientRect()).filter(r => r.width > 150);
    const bande = document.querySelector('[data-bande-semaines]');
    return {
      zone: zone ? Math.round(zone.getBoundingClientRect().height) : 0,
      courbe: Math.max(0, ...svg.map(r => Math.round(r.height))),
      bande: bande ? Math.round(bande.getBoundingClientRect().height) : 0,
      bandeTexte: bande ? [...bande.querySelectorAll('button')].map(b => (b.textContent || '').trim()) : []
    };
  });
  if (aRangees) {
    note('ENTETE', ent.courbe >= 80 && ent.bande > 0 && ent.bande <= 40 && ent.zone <= 180, `courbe ${ent.courbe} px (min 80), bande ${ent.bande} px (max 40), en-tête ${ent.zone} px (max 180)`);
    const sales = ent.bandeTexte.filter(t => !/^S\d+$/.test(t));
    note('BANDE', ent.bandeTexte.length > 0 && sales.length === 0, `${ent.bandeTexte.length} semaines, ${sales.length} avec autre chose que « S\\d+ »${sales.length ? ` (${sales.slice(0, 2).join(' | ')})` : ''}`);

    const plus = await p.evaluate(() => [...document.querySelectorAll('button[data-plus]')].map(b => { const r = b.getBoundingClientRect(); return { x: Math.round(r.left), id: b.getAttribute('data-plus') }; }));
    const xs = plus.map(q => q.x);
    note('PLUS', plus.length === 7 && Math.max(...xs) - Math.min(...xs) <= 2, `${plus.length} carrés + ; écart de colonne ${xs.length ? Math.max(...xs) - Math.min(...xs) : '—'} px`);

    let ouverts = 0; const faux = [];
    for (const q of plus) {
      await p.evaluate(id => document.querySelector(`button[data-plus="${id}"]`).scrollIntoView({ block: 'center' }), q.id);
      await p.click(`button[data-plus="${q.id}"]`); await attendre(500);
      const d = await p.evaluate(() => { const f = document.querySelector('[data-feuille-rangee]'); return f ? f.getAttribute('data-feuille-rangee') : null; });
      if (d === q.id) ouverts++; else faux.push(`${q.id}→${d}`);
      await p.keyboard.press('Escape'); await attendre(450);
    }
    note('PLUS-AGIT', ouverts === 7 && plus.length === 7, `${ouverts}/${plus.length} carrés ouvrent la feuille sur leur rangée${faux.length ? ` (${faux.join(', ')})` : ''}`);
    await p.close();

    /* BRUIT : f1-a (un achat glissé) puis f6-b (un brassin lié à une vente promise) */
    p = await page(390, 844);
    const f1 = await glisser(p, '[data-barre]', '^Hotte', 1);
    const f6 = await glisser(p, '[data-barre]', '^Blonde d’automne', 1);
    const msg = await p.evaluate(() => {
      const m = [...document.querySelectorAll('[role="status"], [role="alert"]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      const ligne = document.querySelector('.cal-msg-ligne');
      const lh = ligne ? parseFloat(getComputedStyle(ligne).lineHeight) || 18 : 18;
      return { n: m.length, roles: m.map(e => e.getAttribute('role')), lignes: ligne ? Math.round(ligne.getBoundingClientRect().height / lh) : 0 };
    });
    note('BRUIT', f1 && f6 && msg.n === 1 && msg.lignes <= 2, `${msg.n} message(s) [${msg.roles.join(',')}], ${msg.lignes} ligne(s)${f1 && f6 ? '' : ' (geste non joué : barre introuvable)'}`);
    await p.close();

    /* FAB : tiers droit, 4 à 24 px au-dessus des onglets */
    p = await page(390, 844);
    const fab = await p.evaluate(() => {
      const f = document.querySelector('button[aria-label^="Actions rapides"]');
      const nv = document.querySelector('nav[aria-label="Navigation principale"]');
      if (!f || !nv) return null;
      const r = f.getBoundingClientRect(), n = nv.getBoundingClientRect();
      return { droite: r.left + r.width / 2 >= innerWidth * (2 / 3), ecart: Math.round(n.top - r.bottom), nom: f.getAttribute('aria-label') };
    });
    note('FAB', !!fab && fab.droite && fab.ecart >= 4 && fab.ecart <= 24 && !/S\d+/.test(fab.nom), fab ? `tiers droit ${fab.droite}, ${fab.ecart} px au-dessus des onglets, nom « ${fab.nom} »` : 'bouton ou onglets introuvables');

    /* ROTATION : une chose ajoutée reste */
    await p.evaluate(() => { window.__jeton = 'portrait-1'; });
    await p.evaluate(() => document.querySelector('button[data-plus="fetes"]').scrollIntoView({ block: 'center' }));
    await p.click('button[data-plus="fetes"]'); await attendre(500);
    await p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); [...d.querySelectorAll('button')].find(b => /^Marché de Noël$/.test((b.textContent || '').trim()))?.click(); });
    await attendre(200);
    await p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); [...d.querySelectorAll('button')].find(b => (b.textContent || '').trim() === 'Ajouter')?.click(); });
    await attendre(700);
    const compte = () => p.evaluate(() => [...document.querySelectorAll('[data-chose]')].filter(e => /^Marché de Noël/.test(e.getAttribute('aria-label') || '')).length);
    const avant = await compte();
    const vues = [];
    for (const [w, h] of [[844, 390], [390, 844]]) {
      await p.setViewport(ecran(w, h)); await attendre(800);
      vues.push(await p.evaluate(() => ({ jeton: window.__jeton, n: [...document.querySelectorAll('[data-chose]')].filter(e => /^Marché de Noël/.test(e.getAttribute('aria-label') || '')).length, o: document.querySelector('[data-calendrier]')?.getAttribute('data-orientation'), w: innerWidth })));
      if (w === 844) {
        /* PAYS : mesuré ici, au même état */
        const pays = await p.evaluate(() => {
          const z = document.querySelector('[data-entete-zone]');
          const hs = [...document.querySelectorAll('section[data-rangee]')].map(s => s.getBoundingClientRect().height).sort((a, b) => a - b);
          return { cols: Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes')), tete: z ? Math.round(z.getBoundingClientRect().height) : 0, mediane: Math.round(hs[Math.floor(hs.length / 2)] || 0) };
        });
        note('PAYS', pays.cols === 13 && pays.tete <= 120 && pays.mediane <= 48, `${pays.cols} semaines, en-tête ${pays.tete} px (max 120), rangée médiane ${pays.mediane} px (max 48)`);
      }
    }
    const garde = avant >= 2 && vues.every(v => v.n === avant && v.jeton === 'portrait-1') && vues[0].o === 'paysage' && vues[1].o === 'portrait';
    note('ROTATION', garde, `la chose ajoutée : ${avant} avant, ${vues.map(v => `${v.n} en ${v.o}`).join(', ')} ; page non rechargée ${vues.every(v => v.jeton === 'portrait-1')}`);
    await p.close();

    /* BARRE-PETITE : 6 mois */
    p = await page(390, 844);
    await p.click('[data-ent-periode]'); await attendre(300);
    await p.evaluate(() => { const d = document.querySelector('[role="dialog"][aria-label="Période et vue"]'); [...d.querySelectorAll('button')].find(b => /^6 mois/.test((b.textContent || '').trim()))?.click(); });
    await attendre(700);
    const petit = await p.evaluate(() => {
      const barres = [...document.querySelectorAll('[data-barre]')].map(b => b.getBoundingClientRect().width);
      const marques = [...document.querySelectorAll('[data-marque]')];
      return { barres: barres.length, min: barres.length ? Math.round(Math.min(...barres)) : null, marques: marques.length, nommees: marques.filter(m => (m.getAttribute('aria-label') || '').length > 3).length, cols: Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes')) };
    });
    note('BARRE-PETITE', petit.cols === 26 && (petit.min === null || petit.min >= 24) && petit.marques > 0 && petit.nommees === petit.marques, `${petit.cols} semaines : ${petit.barres} barres (la plus étroite ${petit.min} px, min 24), ${petit.marques} marques dont ${petit.nommees} nommées`);
    if (p.erreurs.length) note('ERREURS', false, `${p.erreurs.length} erreur(s) de page : ${p.erreurs[0]}`);
    await p.close();
  } else await p.close();
} catch (e) {
  note('EXECUTION', false, String(e && e.message ? e.message : e));
} finally {
  await nav.close();
}
const ko = bilan.filter(b => !b.ok).length;
console.log(ko || !bilan.length ? 'CAL-APP ECHEC' : 'CAL-APP OK');
process.exit(ko || !bilan.length ? 1 : 0);
