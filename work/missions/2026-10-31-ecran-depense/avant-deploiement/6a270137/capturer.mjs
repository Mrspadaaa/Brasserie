// node capturer.mjs [port] : test d'écran 6a270137 — Payer (m5pa-d), Apport (m5ap-a), Fiche (m5fo-a), Modifier (m5mo-c).
// Banc local ?dev-local&finance-demo, profil Chrome neuf par scénario (rien d'écrit hors du navigateur de test).
// Sorties : <état>-<largeur>-<thème>.png et textes.json (texte de la feuille et mesures par capture).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const PORT = process.argv[2] ?? '3000';
const OUT = fileURLToPath(new URL('./', import.meta.url));
const textes = {};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const clic = (page, re, racine = 'body') => page.evaluate(([src, racine]) => {
  const r = new RegExp(src);
  const e = [...document.querySelectorAll(`${racine} button, ${racine} [role=tab], ${racine} [role=radio], ${racine} a`)].filter((e) => e.offsetParent && r.test(e.textContent.replace(/\s+/g, ' ').trim()));
  if (!e.length) return false; e.at(-1).scrollIntoView({ block: 'center' }); e.at(-1).click(); return e.at(-1).textContent.replace(/\s+/g, ' ').trim().slice(0, 90);
}, [re.source, racine]);
const ligne = (page, re) => page.evaluate((src) => {
  const r = new RegExp(src);
  const b = [...document.querySelectorAll('button')].filter((e) => e.offsetParent && r.test(e.textContent) && e.textContent.length < 260);
  if (!b.length) return null; b[0].scrollIntoView({ block: 'center' }); b[0].click(); return b[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 160);
}, re.source);
async function taper(page, sel, v, sortir = true) {
  await page.evaluate((s) => { const i = document.querySelector(s); i.scrollIntoView({ block: 'center' }); i.focus(); i.select?.(); }, sel);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(v, { delay: 30 });
  if (sortir) await page.evaluate((s) => document.querySelector(s)?.blur(), sel);
  await calme(page, 600);
}
async function mesure(page) {
  return page.evaluate(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].filter((e) => e.offsetParent).at(-1);
    const champs = [...(d ?? document).querySelectorAll('input:not([type=file]):not([hidden]), textarea')].filter((i) => i.offsetParent).map((i) => {
      const r = i.getBoundingClientRect(); const cs = getComputedStyle(i);
      return `${i.getAttribute('aria-label') ?? i.name ?? i.placeholder ?? '?'}=${JSON.stringify(i.value)} h${Math.round(r.height)} lh${cs.lineHeight} pt${cs.paddingTop} x${Math.round(r.left)}-${Math.round(r.right)}`;
    });
    const sc = d && [d, ...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY));
    return { titre: document.title, dialogue: d ? d.innerText.replace(/\n{2,}/g, '\n').slice(0, 2500) : null, champs, defile: sc ? `${sc.scrollHeight}/${sc.clientHeight}` : null,
      actif: document.activeElement ? `${document.activeElement.tagName} ${document.activeElement.type ?? ''} ${document.activeElement.getAttribute('aria-label') ?? ''}` : null,
      boites: d ? (() => { const r = d.getBoundingClientRect(); const enfants = [...d.querySelectorAll('section, form, footer, header, [class*=pay-], [class*=mvt]')].filter((e) => e.offsetParent).slice(0, 6).map((e) => `${e.className?.toString().slice(0, 20)}:${Math.round(e.getBoundingClientRect().left)}-${Math.round(e.getBoundingClientRect().right)}`); return `dlg ${Math.round(r.left)}-${Math.round(r.right)} | ${enfants.join(' ')}`; })() : null };
  });
}
let cfg;
async function cap(page, nom, { bas = false, pageEntiere = false } = {}) {
  const f = `${nom}-${cfg}.png`;
  if (bas) await page.evaluate(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].filter((e) => e.offsetParent).at(-1);
    const sc = d && [d, ...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY));
    if (sc) sc.scrollTop = sc.scrollHeight; else window.scrollTo(0, document.body.scrollHeight);
  });
  if (bas) await pause(400);
  await page.screenshot({ path: OUT + f, fullPage: pageEntiere });
  textes[f] = await mesure(page);
  if (!textes[f].dialogue) textes[f].page = await page.evaluate(() => document.querySelector('main')?.innerText.replace(/\n{2,}/g, '\n').slice(0, 3000) ?? '');
}
async function demarrer(largeur, mobile, theme) {
  const o = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
  const { page } = o;
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, /^Opérations/); await calme(page, 1200);
  return o;
}
const VIR = '[aria-label="Montant du virement (CHF)"]';
const MT = '[role=dialog] [aria-label="Montant (CHF)"]';
const journal = [];

for (const [largeur, mobile] of [[390, true], [1280, false]]) for (const theme of ['clair', 'cave']) {
  cfg = `${largeur}-${theme === 'cave' ? 'sombre' : 'clair'}`;
  // Scénario 1 : Opérations, fiche à payer, Payer et ses états, paiement, puis Modifier en baisse au-dessus du payé.
  let { browser, page, journal: j } = await demarrer(largeur, mobile, theme);
  await cap(page, 'ops'); await cap(page, 'ops-long', { pageEntiere: true });
  journal.push([cfg, 'loyer', await ligne(page, /Loyer/)]); await calme(page, 900); await cap(page, 'fiche-apayer');
  journal.push([cfg, 'noter', await clic(page, /^Noter un paiement/, '[role=dialog]')]); await calme(page, 1000);
  await cap(page, 'payer-ouvert'); await cap(page, 'payer-ouvert-bas', { bas: true });
  await taper(page, VIR, '700'); await cap(page, 'payer-trop');
  await taper(page, VIR, '300'); await cap(page, 'payer-300');
  journal.push([cfg, 'decoche', await page.evaluate(() => { const b = [...document.querySelectorAll('[role=checkbox]')].find((e) => /Loyer/i.test(e.getAttribute('aria-label') ?? '') && !e.disabled); b?.click(); return b?.getAttribute('aria-label'); })]);
  await calme(page, 500); await cap(page, 'payer-decoche');
  await page.evaluate(() => [...document.querySelectorAll('[role=checkbox]')].find((e) => /Loyer/i.test(e.getAttribute('aria-label') ?? '') && !e.disabled)?.click()); await calme(page, 400);
  await taper(page, VIR, '300');
  journal.push([cfg, 'autre', await clic(page, /^autre$/, '[role=dialog]')]); await calme(page, 500); await cap(page, 'payer-autre', { bas: true });
  journal.push([cfg, 'choisis', await clic(page, /^Choisis la date/, '[role=dialog]')]); await calme(page, 400); await cap(page, 'payer-autre-toucher', { bas: true });
  journal.push([cfg, 'auj', await clic(page, /aujourd/i, '[role=dialog]')]); await calme(page, 400);
  journal.push([cfg, 'payer', await clic(page, /^✓ Payer/, '[role=dialog]')]); await calme(page, 2000);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.offsetParent && /Loyer/.test(e.textContent) && e.textContent.length < 260)?.scrollIntoView({ block: 'center' })); await pause(300);
  await cap(page, 'payer-apres');
  journal.push([cfg, 'loyer2', await ligne(page, /Loyer/)]); await calme(page, 900); await cap(page, 'fiche-partielle'); await cap(page, 'fiche-partielle-bas', { bas: true });
  journal.push([cfg, 'modifier-loyer', await clic(page, /^Modifier/, '[role=dialog]')]); await calme(page, 1000);
  await taper(page, MT, '300'); await cap(page, 'modif-dessus'); await cap(page, 'modif-dessus-bas', { bas: true });
  journal.push([cfg, 'enr-dessus', await clic(page, /^Enregistrer/, '[role=dialog]')]); await calme(page, 1800);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.offsetParent && /Loyer/.test(e.textContent) && e.textContent.length < 260)?.scrollIntoView({ block: 'center' })); await pause(300);
  await cap(page, 'modif-dessus-apres');
  journal.push([cfg, 'erreurs1', j.erreurs.slice(0, 3)]); await browser.close();

  // Scénario 2 : fiche payée, Modifier en hausse, en baisse sous le payé, enregistrer.
  ({ browser, page, journal: j } = await demarrer(largeur, mobile, theme));
  journal.push([cfg, 'nettoyant', await ligne(page, /Nettoyant/)]); await calme(page, 900);
  await cap(page, 'fiche-payee'); await cap(page, 'fiche-payee-bas', { bas: true });
  journal.push([cfg, 'modifier', await clic(page, /^Modifier/, '[role=dialog]')]); await calme(page, 1000);
  await cap(page, 'modif-ouvert');
  await taper(page, MT, '45,50'); await cap(page, 'modif-hausse'); await cap(page, 'modif-hausse-bas', { bas: true });
  journal.push([cfg, 'reste', await clic(page, /^Reste à payer/, '[role=dialog]')]); await calme(page, 400); await cap(page, 'modif-hausse-reste', { bas: true });
  await taper(page, MT, '30'); await cap(page, 'modif-30'); await cap(page, 'modif-30-bas', { bas: true });
  journal.push([cfg, 'enr-30', await clic(page, /^Enregistrer/, '[role=dialog]')]); await calme(page, 1800);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.offsetParent && /Nettoyant/.test(e.textContent) && e.textContent.length < 260)?.scrollIntoView({ block: 'center' })); await pause(300);
  await cap(page, 'modif-30-apres');
  journal.push([cfg, 'nettoyant2', await ligne(page, /Nettoyant/)]); await calme(page, 900); await cap(page, 'fiche-apres-30'); await cap(page, 'fiche-apres-30-bas', { bas: true });
  await page.keyboard.press('Escape'); await calme(page, 600);
  journal.push([cfg, 'malt', await ligne(page, /Malt et houblons/)]); await calme(page, 900); await cap(page, 'fiche-malt');
  journal.push([cfg, 'modifier-malt', await clic(page, /^Modifier/, '[role=dialog]')]); await calme(page, 1000);
  await taper(page, MT, '45,50'); await cap(page, 'modif-4550', { bas: true });
  journal.push([cfg, 'erreurs2', j.erreurs.slice(0, 3)]); await browser.close();

  // Scénario 3 : Apport ou prélèvement privé.
  ({ browser, page, journal: j } = await demarrer(largeur, mobile, theme));
  journal.push([cfg, 'apport', await clic(page, /^Apport ou prélèvement privé/)]); await calme(page, 1000);
  await cap(page, 'apport-ouvert'); await cap(page, 'apport-ouvert-bas', { bas: true });
  journal.push([cfg, 'enr-vide', await clic(page, /^Enregistrer/, '[role=dialog]')]); await calme(page, 600); await cap(page, 'apport-erreur', { bas: true });
  await taper(page, '[role=dialog] [aria-label="Montant (CHF)"]', '500'); await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].at(-1); const s = d && [d, ...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (s) s.scrollTop = 0; }); await pause(300);
  await cap(page, 'apport-500');
  await taper(page, '[role=dialog] [aria-label="Motif"]', 'Apport pour le malt'); await cap(page, 'apport-motif', { bas: true });
  journal.push([cfg, 'autre-date', await clic(page, /^autre date/, '[role=dialog]')]); await calme(page, 400); await cap(page, 'apport-date', { bas: true });
  journal.push([cfg, 'sens', await clic(page, /autre sens/, '[role=dialog]')]); await calme(page, 500);
  await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].at(-1); const s = d && [d, ...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (s) s.scrollTop = 0; }); await pause(300);
  await cap(page, 'apport-sens'); await cap(page, 'apport-sens-bas', { bas: true });
  journal.push([cfg, 'erreurs3', j.erreurs.slice(0, 3)]); await browser.close();
  console.log('fait', cfg);
}
writeFileSync(OUT + 'textes.json', JSON.stringify({ journal, textes }, null, 1));
console.log(journal.map((l) => JSON.stringify(l)).join('\n'));
