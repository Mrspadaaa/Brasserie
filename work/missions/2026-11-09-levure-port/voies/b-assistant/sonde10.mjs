// Récap : sections Levure et Fermentation ouvertes (BR-25, BR-26, TE-33) ; compte des « Fermer » visibles (TL-18).
import { ouvrir, etape, texte, cliquer, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const theme = process.argv[3] ?? 'clair';
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900, theme });
await etape(page, 'Récap');
for (const s of ['Levure', 'Fermentation', 'Paliers d’empâtage']) { await page.evaluate((x) => { const b = [...document.querySelectorAll('summary,button[aria-expanded]')].find((e) => (e.textContent || '').trim().startsWith(x)); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }, s); await dormir(500); }
const t = await texte(page);
console.log('lignes ->', t.split('\n').filter((l) => /^Quantité|phase|Fermentation prim|Atténuation|Durée de fermentation|US-05/.test(l.trim())).join(' | ').slice(0, 400));
const fermer = await page.evaluate(() => [...document.querySelectorAll('button,a,[role=button]')].filter((e) => /^(Fermer|Retour)$/.test((e.getAttribute('aria-label') || e.textContent || '').trim())).map((e) => ({ t: (e.getAttribute('aria-label') || e.textContent).trim(), visible: !!(e.offsetWidth || e.offsetHeight) })));
console.log('Fermer/Retour ->', JSON.stringify(fermer));
await page.evaluate(() => { const b = [...document.querySelectorAll('summary,button[aria-expanded]')].find((e) => (e.textContent || '').trim().startsWith('Levure')); b?.scrollIntoView({ block: 'start' }); });
await dormir(400);
await capture(page, `s10-recap-${largeur}-${theme}`);
await browser.close();
