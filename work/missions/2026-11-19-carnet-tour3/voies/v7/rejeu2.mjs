// Voie v7, suite : groupe et citation des carnets nés d'une note en vrac (PCN-76, 112) ; planches des captures app/banc (PCN-NOTE-4).
import fs from 'node:fs';
import path from 'node:path';
import { lancer, page, capture, captureSansBlur, log, ecrireJournal, attendre, CAP } from './outil.mjs';

const NOTES = { sol: 'résine pour le sol du local\nPour la hotte : tient 80 °C.\nacheter 2 sachets de levure', levure: 'Sachets de levure x2.\nProchain brassage mardi.\nTient 80 °C pour la hotte.' };
async function note(p, n) {
  const c = await p.$('textarea'); await c.click();
  for (const [i, l] of n.split('\n').entries()) { if (i) { await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); } await p.keyboard.type(l, { delay: 2 }); }
  await attendre(300); await p.keyboard.press('Enter'); await attendre(5000);
}
/* Carte de carnet (bouton dont la 1re ligne est le titre), hors du cadre des lignes rangées : groupe, texte, white-space de la citation */
const cartes = (p, re) => p.evaluate((s) => {
  const r = new RegExp(s, 'i'); const out = [];
  const groupes = [...document.querySelectorAll('*')].filter((e) => e.children.length <= 2 && /^(À comparer|Idée|Choisi|En cours)\s*\d*$/.test((e.innerText || '').trim()) && e.getClientRects().length);
  for (const e of document.querySelectorAll('button, a, li, article')) {
    const t = (e.innerText || '').trim(); const l1 = t.split('\n')[0];
    if (!r.test(l1) || t.length > 300 || !e.getClientRects().length || e.querySelector('select')) continue;
    const g = groupes.filter((h) => h.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
    const cite = [...e.querySelectorAll('*')].find((c) => /^«/.test((c.innerText || '').trim()) && !c.children.length);
    out.push({ tag: e.tagName, groupe: g?.innerText.replace(/\s+/g, ' ') ?? null, texte: t, cite: cite ? { txt: cite.innerText, ws: getComputedStyle(cite).whiteSpace, h: Math.round(cite.getBoundingClientRect().height) } : null, top: Math.round(e.getBoundingClientRect().top) });
  }
  return out.slice(0, 4);
}, re);
const versCarte = (p, re) => p.evaluate((s) => { const r = new RegExp(s, 'i'); const e = [...document.querySelectorAll('button, a, li, article')].filter((x) => r.test((x.innerText || '').trim().split('\n')[0]) && (x.innerText || '').length < 300 && x.getClientRects().length && !x.querySelector('select')).pop(); e?.scrollIntoView({ block: 'center' }); return !!e; }, re);

const nav = await lancer();
try {
  for (const L of [1280, 390]) {
    for (const [nom, ia] of [['sol', ''], ['levure', ''], ['levure', '&ia=eteint']]) {
      const tag = `${nom}${ia ? '-eteint' : ''}`;
      const p = await page(nav, `&theme=clair${ia}`, L);
      await note(p, NOTES[nom]);
      log(`${tag} ${L} cartes Résine|Prochain|sol : ${JSON.stringify(await cartes(p, 'Résine|Prochain|sol'))}`);
      for (const [k, re] of [['brassin', 'Prochain brassin'], ['resine', 'Résine']]) if (await versCarte(p, re)) { await attendre(400); await capture(p, `t2-${tag}-${L}-${k}`); }
      await p.close();
    }
  }
  /* planches : app et banc sombre (PCN-NOTE-4) */
  const q = await nav.newPage(); await q.setViewport({ width: 1600, height: 1000 });
  const planche = async (nom, fichiers, larg) => {
    const imgs = fichiers.filter((f) => fs.existsSync(path.join(CAP, f))).map((f) => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(CAP, f)).toString('base64')}" style="width:${larg}px"><figcaption>${f}</figcaption></figure>`).join('');
    await q.setContent(`<body style="margin:0;font:12px sans-serif;display:flex;flex-wrap:wrap;gap:6px;background:#888">${imgs}</body>`);
    await attendre(500); await q.screenshot({ path: path.join(CAP, `${nom}.png`), fullPage: true }); log(`planche ${nom}`);
  };
  const etapes = ['1-vide', '2-carnet', '3-carnet-lien', '4-liste'];
  await planche('pl-app-390', etapes.flatMap((e) => [`app-390-${e}-clair.png`, `app-390-${e}-sombre.png`]), 190);
  await planche('pl-app-1280', etapes.flatMap((e) => [`app-1280-${e}-clair.png`, `app-1280-${e}-sombre.png`]), 520);
  await planche('pl-banc-sombre', ['banc-zero-390-sombre.png', 'banc-liste-390-sombre.png', 'banc-ouvert-390-sombre.png', 'banc-zero-1280-sombre.png', 'banc-liste-1280-sombre.png', 'banc-ouvert-1280-sombre.png'], 300);
} finally { await nav.close(); ecrireJournal('journal-rejeu2'); }
