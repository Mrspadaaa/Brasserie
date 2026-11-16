// node capturer.mjs <port> : Doublons (m1do-a), Archives (m1ar-c) et l'avis du geste « ✓ Payé » (FN-2) au banc local `?dev-local&finance-demo`.
// Jamais de donnée réelle : la paire de doublons est écrite sur le banc local seulement (import dynamique du module de l'app servi par Vite).
// Sortie : cap/<vue>-<largeur>-<thème>.png, puis cap/planche-<vue>-<largeur>-<thème>.png (app avant, app après, maquette choisie).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = process.argv[2] ?? '3000';
const SEULS = process.argv[3] ? process.argv[3].split(',') : null; // ex. « 390-clair,1280-cave »
const OUT = fileURLToPath(new URL('./cap/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const MAQ = { dbl: fileURLToPath(new URL('../m1/m1do-a/m1do-a.png', import.meta.url)), arc: fileURLToPath(new URL('../m1/m1ar-c/m1ar-c.png', import.meta.url)) };
const URL_BANC = `http://localhost:${PORT}/?dev-local&finance-demo`;

const clic = (page, debut, { exact = false } = {}) => page.evaluate((debut, exact) => {
  const e = [...document.querySelectorAll('[role=tab],button')].filter((b) => b.offsetParent && (exact ? b.textContent.trim() === debut : b.textContent.trim().startsWith(debut)));
  if (!e.length) return false; e[0].click(); return true;
}, debut, exact);
const clicAria = (page, regex) => page.evaluate((src) => {
  const r = new RegExp(src);
  const e = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && r.test(b.getAttribute('aria-label') ?? ''));
  if (!e.length) return false; e[0].click(); return true;
}, regex);

async function ecrirePaire(page) {
  // Deux factures du même fournisseur et du même numéro, payées : le cas de m1do-a. Écrites sur le banc local seulement.
  return page.evaluate(async () => {
    const { StorageService } = await import('/src/services/storage.ts');
    const { FinanceService } = await import('/src/services/financeService.ts');
    const jour = new Date().toISOString().slice(0, 10), an = jour.slice(0, 4);
    const f = (id, recu) => ({ id, description: 'Atelier du Houblon · F-2024-117', date: jour, category: 'brassage', subcategory: '', amountHT: 94.5, amountTTC: 94.5, tvaAmount: 0, tvaRate: 0,
      finance: { version: 1, kind: 'expense', amountCents: 9450, paymentStatus: 'paid', recordedAt: recu, vendor: 'Atelier du Houblon', invoiceNumber: 'F-2024-117', lines: [] } });
    for (const [id, recu] of [['ZZ-DBL-A', `${an}-01-14T09:00:00Z`], ['ZZ-DBL-B', `${an}-01-15T10:00:00Z`]]) {
      FinanceService.stageNewTransactionPayment(f(id, recu), { id: `PAY-${id}`, transactionId: id, date: jour, amountCents: 9450, direction: 'out', method: 'bank', recordedAt: new Date().toISOString() });
    }
    return StorageService.getTransactions().filter((t) => t.id.startsWith('ZZ-DBL')).length;
  });
}

async function vers(page, theme) {
  await page.goto(URL_BANC); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, 'Opérations'); await calme(page, 1200);
}

const planches = [];
for (const [largeur, mobile, hauteur] of [[390, true, 1500], [1280, false, 1000]]) for (const theme of ['clair', 'cave']) {
  const cle = `${largeur}-${theme}`;
  if (SEULS && !SEULS.includes(cle)) continue;
  const note = [];
  const photo = async (page, nom) => { await calme(page, 700); await page.screenshot({ path: `${OUT}${nom}-${cle}.png` }); };
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  try {
    await vers(page, theme);
    // 1. Doublons : la paire au repos, puis après « Annuler celle-ci ».
    note.push(`paire écrite : ${await ecrirePaire(page)}`); await calme(page, 800);
    note.push(`puce Doublons : ${await clic(page, 'Doublons')}`); await photo(page, 'dbl-repos');
    note.push(`Annuler celle-ci : ${await clicAria(page, '^Annuler cette pièce en double')}`); await photo(page, 'dbl-annule');
    // 2. Archives : la frise au repos, la poignée posée sur l'année passée, après « Ranger », puis « Consulter ».
    await vers(page, theme);
    note.push(`Filtres : ${await clic(page, 'Filtres')}`); await calme(page, 600);
    note.push(`Gérer les archives : ${await clic(page, 'Gérer les archives', { exact: true })}`); await photo(page, 'arc-repos');
    note.push(`année touchée : ${await clicAria(page, `^${new Date().getFullYear() - 1} : .*ranger jusqu’à fin`)}`); await photo(page, 'arc-poignee');
    note.push(`Ranger : ${await page.evaluate(() => { const b = [...document.querySelectorAll('.arc-b[data-fort]')].find((e) => /^Ranger \d{4}/.test(e.textContent)); if (!b) return false; b.click(); return b.textContent; })}`); await calme(page, 900); await photo(page, 'arc-range');
    note.push(`Consulter : ${await clicAria(page, '^Consulter ')}`); await photo(page, 'arc-consulte');
    // 3. FN-2 : l'avis après « ✓ Payé », puis « Autre montant ».
    await vers(page, theme);
    note.push(`✓ Payé : ${await page.evaluate(() => { const b = [...document.querySelectorAll('.ops-act')].find((e) => /Payé/.test(e.textContent)); if (!b) return false; b.click(); return true; })}`); await photo(page, 'fn2-avis');
    note.push(`Autre montant : ${await page.evaluate(() => { const b = [...document.querySelectorAll('.ops-avis-b')].find((e) => /Autre montant/.test(e.textContent)); if (!b) return false; b.click(); return true; })}`); await photo(page, 'fn2-autre');
  } catch (e) { note.push(`ERREUR ${e?.message ?? e}`); }
  console.log(cle, note.join(' | '), '| erreurs page :', journal.erreurs.slice(0, 3).join(' ; ') || 'aucune');
  await browser.close();
  planches.push(cle);
}

// Planches : app avant | app après | maquette choisie, même largeur d'affichage.
const L = (n) => pathToFileURL(OUT + n).href;
for (const cle of planches) {
  const larg = cle.startsWith('390') ? 390 : 640;
  for (const [vue, nom, avant, apres, maq] of [['dbl', 'Doublons', 'dbl-repos', 'dbl-annule', MAQ.dbl], ['arc', 'Archives', 'arc-poignee', 'arc-range', MAQ.arc]]) {
    const fig = (src, t) => `<figure style="margin:0"><figcaption>${t}</figcaption><img src="${src}" width="${larg}"></figure>`;
    writeFileSync(`${OUT}planche-${vue}-${cle}.html`, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#777;display:flex;gap:10px;align-items:flex-start;font:13px sans-serif;color:#fff">${fig(L(`${avant}-${cle}.png`), `App ${cle} : ${nom}, avant`)}${fig(L(`${apres}-${cle}.png`), `App ${cle} : après le geste`)}${fig(pathToFileURL(maq).href, `Maquette ${vue === 'dbl' ? 'm1do-a' : 'm1ar-c'}`)}</body>`);
    const { browser, page } = await ouvrir({ largeur: larg * 3 + 40, hauteur: 1700, mobile: false, echelle: 1, externe: 'laisser' });
    await page.goto(pathToFileURL(`${OUT}planche-${vue}-${cle}.html`).href); await calme(page, 600);
    await page.screenshot({ path: `${OUT}planche-${vue}-${cle}.png`, fullPage: true });
    await browser.close();
  }
}
console.log('captures écrites :', planches.join(', '));
