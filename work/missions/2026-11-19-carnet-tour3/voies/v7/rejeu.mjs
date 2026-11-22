// Voie v7 : PCN-76, PCN-110, PCN-112, PCN-NOTE-4 (port 5197). Usage : node rejeu.mjs [scenario,...] [390,1280]
import { lancer, page, toucher, taper, texte, haut, capture, captureSansBlur, log, ecrireJournal, attendre } from './outil.mjs';

const nbCarnets = () => { const b = [...document.querySelectorAll('button,[role=tab]')].find((e) => /^Carnets\s*\d+/.test((e.innerText || '').trim())); return b ? b.innerText.replace(/\s+/g, ' ') : null; };
const plat = (t, n = 1500) => t.slice(0, n).replace(/\n+/g, ' ¦ ');
/* note sur plusieurs lignes : Maj+Entrée entre les lignes, Entrée pour envoyer */
async function note(p, n) {
  const c = await p.$('textarea'); await c.click();
  for (const [i, l] of n.split('\n').entries()) { if (i) { await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); } await p.keyboard.type(l, { delay: 2 }); }
  await attendre(300); await p.keyboard.press('Enter'); await attendre(5000);
}
/* carte de carnet de la liste dont le texte contient re : texte brut (retours conservés), rect, groupe (titre de section qui précède) */
const carte = (p, re) => p.evaluate((s) => {
  const r = new RegExp(s, 'i');
  const els = [...document.querySelectorAll('li, article, [role="listitem"], button')].filter((e) => r.test(e.innerText || '') && e.getClientRects().length && (e.innerText || '').length < 400);
  const e = els[0]; if (!e) return null;
  e.scrollIntoView({ block: 'center' });
  const heads = [...document.querySelectorAll('h2, h3, h4, [class*="groupe"] > :first-child')].filter((h) => h.getClientRects().length && (h.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));
  const b = e.getBoundingClientRect();
  const cites = [...e.querySelectorAll('q, blockquote, [class*="cite"], [class*="phrase"]')].map((c) => ({ txt: c.innerText, ws: getComputedStyle(c).whiteSpace }));
  return { texte: e.innerText, rect: [Math.round(b.top), Math.round(b.bottom)], groupe: heads.length ? heads[heads.length - 1].innerText.replace(/\s+/g, ' ').slice(0, 60) : null, cites };
}, re);
const ordre = (p) => p.evaluate(() => [...document.querySelectorAll('h2, h3, h4, li, article')].filter((e) => e.getClientRects().length)
  .map((e) => `${e.tagName}:${(e.innerText || '').split('\n')[0].trim().slice(0, 50)}`).filter((s) => s.length > 4).slice(0, 40));

const S = {
  /* PCN-76 : liste peuplée, note en vrac « sol » : groupe du carnet né et casse du titre */
  sol: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    log(`sol ${L} ${th} avant ${await p.evaluate(nbCarnets)}`);
    await note(p, 'résine pour le sol du local\nPour la hotte : tient 80 °C.\nacheter 2 sachets de levure');
    log(`sol ${L} ${th} après ${await p.evaluate(nbCarnets)} ; ${plat(await texte(p))}`);
    await captureSansBlur(p, `sol-${L}-${th}-a-apres`);
    if (!(await toucher(p, 'Carnets', { exact: true, sel: 'button, a, [role="tab"]' }))) await toucher(p, '‹');
    await attendre(900); await haut(p);
    log(`sol ${L} ${th} liste ${await p.evaluate(nbCarnets)} ordre ${JSON.stringify(await ordre(p))}`);
    log(`sol ${L} ${th} carte ${JSON.stringify(await carte(p, 'sol'))}`);
    await capture(p, `sol-${L}-${th}-b-liste`);
    await p.close();
  },
  /* PCN-112 : note levure, IA simulée puis IA éteinte (chemin local) : phrase citée de la carte du carnet brassin */
  levure: async (nav, L, th) => {
    for (const ia of ['simule', 'eteint']) {
      const p = await page(nav, `&theme=${th}${ia === 'eteint' ? '&ia=eteint' : ''}`, L);
      await note(p, 'Sachets de levure x2.\nProchain brassage mardi.\nTient 80 °C pour la hotte.');
      log(`levure-${ia} ${L} après ${await p.evaluate(nbCarnets)} ; ${plat(await texte(p))}`);
      await captureSansBlur(p, `levure-${ia}-${L}-${th}-a-apres`);
      if (!(await toucher(p, 'Carnets', { exact: true, sel: 'button, a, [role="tab"]' }))) await toucher(p, '‹');
      await attendre(900); await haut(p);
      log(`levure-${ia} ${L} ordre ${JSON.stringify(await ordre(p))}`);
      log(`levure-${ia} ${L} carte ${JSON.stringify(await carte(p, 'brass'))}`);
      await capture(p, `levure-${ia}-${L}-${th}-b-liste`);
      await p.close();
    }
  },
  /* PCN-110 : article avec photo (Hotte murale), sans photo (Hotte inox 120), lien collé lu (hotte-140) : photo, légende, ligne « lues… » */
  article: async (nav, L, th) => {
    const mesure = (p, nom) => p.evaluate(() => {
      const f = document.querySelector('.cn-fiche-photo'); const r = f?.getBoundingClientRect(); const s = f?.querySelector('svg, img')?.getBoundingClientRect();
      const img = f?.querySelector('img');
      return { cadre: f?.getAttribute('data-cadre'), fig: r && [Math.round(r.width), Math.round(r.height)], dedans: s && [Math.round(s.top - r.top), Math.round(r.bottom - s.bottom), Math.round(s.width), Math.round(s.height)],
        imgCharge: img ? img.complete && img.naturalWidth > 0 : null, legende: f?.querySelector('figcaption')?.innerText ?? null,
        lues: (document.body.innerText.match(/lues sur la fiche[^\n]*/) ?? [null])[0], caract: (document.body.innerText.match(/Caractéristiques[^\n]*/) ?? [null])[0] };
    }).then((m) => log(`mesure ${nom} ${JSON.stringify(m)}`));
    for (const [nom, ligne] of [['murale', 'Hotte murale 100 cm'], ['inox', 'Hotte inox 120 cm']]) {
      const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
      if (!(await toucher(p, ligne, { sel: 'button, [role="button"], a' }))) { await p.close(); continue; }
      await attendre(700); await haut(p);
      await mesure(p, `${nom}-${L}-${th}`);
      await capture(p, `article-${nom}-${L}-${th}`);
      await p.close();
    }
    const q = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
    await taper(q, 'https://exemple.invalid/hotte-140', { attente: 5000 });
    log(`lien hotte-140 ${L} : ${plat(await texte(q), 600)}`);
    if (await toucher(q, 'Hotte inox 140', { sel: 'button, [role="button"], a' })) { await attendre(700); await haut(q); await mesure(q, `lu140-${L}-${th}`); await capture(q, `article-lu140-${L}-${th}`); }
    await q.close();
  },
  /* PCN-NOTE-4 : app ?dev-local, Stocks › Matériel › Carnets : liste vide, carnet né, carnet ouvert ; clair et sombre (data-theme=cave posé) */
  app: async (nav, L) => {
    const p = await page(nav, '?dev-local', L, { racine: true });
    await attendre(2500);
    await toucher(p, 'Stocks', { exact: true, sel: 'button, a, [role="tab"]' }); await attendre(1500);
    await toucher(p, 'Matériel', { sel: 'button, a, [role="tab"]' }); await attendre(1200);
    await toucher(p, 'Carnets', { sel: 'button, a, [role="tab"]' }); await attendre(2500);
    const deux = async (nom) => {
      log(`app ${nom} ${L} : ${plat(await texte(p), 900)}`);
      await capture(p, `app-${L}-${nom}-clair`);
      await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'cave')); await attendre(400);
      await capture(p, `app-${L}-${nom}-sombre`);
      await p.evaluate(() => document.documentElement.removeAttribute('data-theme')); await attendre(300);
    };
    await deux('1-vide');
    await taper(p, 'frigo de garde pour 6 fûts', { attente: 4500 }); await haut(p);
    await deux('2-carnet');
    await taper(p, 'https://exemple.invalid/pompe-inox', { attente: 4500 }); await haut(p);
    await deux('3-carnet-lien');
    await toucher(p, 'Carnets', { exact: true, sel: 'button, a' }); await attendre(1000); await haut(p);
    await deux('4-liste');
    await p.close();
  },
  /* PCN-NOTE-4 au banc : liste vide (zero) et liste peuplée en sombre */
  bancSombre: async (nav, L) => {
    for (const [nom, q] of [['zero', '&zero=1'], ['liste', ''], ['ouvert', '&ouvrir=ventilation']]) {
      const p = await page(nav, `&theme=sombre${q}`, L);
      log(`banc-sombre ${nom} ${L} : ${plat(await texte(p), 500)}`);
      await capture(p, `banc-${nom}-${L}-sombre`);
      await p.close();
    }
  }
};

const [choix, larg] = process.argv.slice(2);
const noms = choix ? choix.split(',') : Object.keys(S);
const tailles = larg ? larg.split(',').map(Number) : [1280, 390];
const nav = await lancer();
try {
  for (const n of noms) for (const L of tailles) {
    log(`=== ${n} ${L}`);
    try { await S[n](nav, L, 'clair'); } catch (e) { log(`ERREUR ${n} ${L} : ${e.message.slice(0, 160)}`); }
  }
} finally { await nav.close(); ecrireJournal(`journal-${(choix ?? 'tout').replace(/,/g, '+')}`); }
