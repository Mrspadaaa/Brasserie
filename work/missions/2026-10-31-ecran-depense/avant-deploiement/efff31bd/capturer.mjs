// node capturer.mjs [port] [cfgs] [scénarios] : test d’écran efff31bd (copie de 762f37df) — 8 vues portées + FN-2 à FN-12. Banc local seulement, profil neuf par scénario.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath } from 'node:url';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const SEULS = process.argv[3] && process.argv[3] !== 'tout' ? process.argv[3].split(',') : null;
const SCEN = process.argv[4] ? process.argv[4].split(',') : null;
const OUT = fileURLToPath(new URL('./', import.meta.url));
const BANC = `http://localhost:${PORT}/?dev-local&finance-demo`;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const prec = existsSync(OUT + 'textes.json') ? JSON.parse(readFileSync(OUT + 'textes.json', 'utf8')) : { journal: [], textes: {} };
const textes = prec.textes, journal = prec.journal;
const cl = (page, re, { aria = false, racine = 'body', dernier = false, sel = 'button,[role=tab],[role=radio],[role=button],a,[role=checkbox]' } = {}) => page.evaluate((src, aria, racine, dernier, sel) => {
  const r = new RegExp(src); const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const e = [...document.querySelectorAll(racine)].flatMap((x) => [...x.querySelectorAll(sel)]).filter((x) => x.getClientRects().length && r.test(aria ? n(x.getAttribute('aria-label')) + ' ' + n(x.textContent) : n(x.textContent)));
  if (!e.length) return false; const b = dernier ? e.at(-1) : e[0]; b.scrollIntoView({ block: 'center' }); if (b.disabled) return 'desactive'; b.click(); return n(b.textContent || b.getAttribute('aria-label')).slice(0, 80) || 'ok';
}, re.source, aria, racine, dernier, sel);
const boutons = (page) => page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length).map((b) => (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 30)).filter(Boolean).slice(0, 60).join(' | '));
async function taper(page, sel, v) {
  const ok = await page.evaluate((s) => { const i = document.querySelector(s); if (!i) return false; i.scrollIntoView({ block: 'center' }); i.focus(); i.select?.(); return true; }, sel);
  if (!ok) return false;
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace');
  await page.keyboard.type(v, { delay: 25 }); await page.evaluate((s) => document.querySelector(s)?.blur(), sel); await calme(page, 600); return true;
}
let cfg;
async function cap(page, nom, { bas = false, full = false } = {}) {
  const f = `${nom}-${cfg}.png`;
  if (bas) { await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].filter((e) => e.getClientRects().length).at(-1); const sc = d && [d, ...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (sc) sc.scrollTop = sc.scrollHeight; else window.scrollTo(0, document.body.scrollHeight); }); await pause(400); }
  await calme(page, 500); await page.screenshot({ path: OUT + f, fullPage: full });
  textes[f] = await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].filter((e) => e.getClientRects().length).at(-1);
    const champs = [...(d ?? document).querySelectorAll('input:not([type=file]):not([type=hidden]), textarea, select')].filter((i) => i.getClientRects().length).map((i) => `${i.getAttribute('aria-label') ?? i.placeholder ?? i.name ?? '?'}=${JSON.stringify(i.value).slice(0, 60)}`);
    return { t: (d ?? document.querySelector('main') ?? document.body).innerText.replace(/\n{2,}/g, '\n').slice(0, 2200), champs, deborde: document.documentElement.scrollWidth > innerWidth + 2 ? document.documentElement.scrollWidth : 0 }; });
}
async function versFinances(page, onglet) {
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  if (onglet) { await cl(page, new RegExp('^' + onglet)); await calme(page, 1200); }
}
async function demarrer(largeur, mobile, theme, url = BANC, onglet = 'Opérations') {
  const o = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
  const { page } = o;
  await page.goto(url); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1800);
  await versFinances(page, onglet);
  return o;
}
async function ecrirePaire(page) {
  return page.evaluate(async () => {
    const { StorageService } = await import('/src/services/storage.ts'); const { FinanceService } = await import('/src/services/financeService.ts');
    const jour = new Date().toISOString().slice(0, 10), an = jour.slice(0, 4);
    const f = (id, recu) => ({ id, description: 'Atelier du Houblon · F-2024-117', date: jour, category: 'brassage', subcategory: '', amountHT: 94.5, amountTTC: 94.5, tvaAmount: 0, tvaRate: 0,
      finance: { version: 1, kind: 'expense', amountCents: 9450, paymentStatus: 'paid', recordedAt: recu, vendor: 'Atelier du Houblon', invoiceNumber: 'F-2024-117', lines: [] } });
    for (const [id, recu] of [['ZZ-DBL-A', `${an}-01-14T09:00:00Z`], ['ZZ-DBL-B', `${an}-01-15T10:00:00Z`]]) FinanceService.stageNewTransactionPayment(f(id, recu), { id: `PAY-${id}`, transactionId: id, date: jour, amountCents: 9450, direction: 'out', method: 'bank', recordedAt: new Date().toISOString() });
    return StorageService.getTransactions().filter((t) => t.id.startsWith('ZZ-DBL')).length; });
}
const J = (...a) => journal.push([cfg, ...a]);
const scen = {
  async dbl(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T);
    J('paire', await ecrirePaire(page)); await calme(page, 800);
    J('puce', await cl(page, /^Doublons/)); await cap(page, 'dbl-repos');
    J('annuler', await cl(page, /^Annuler cette pièce en double/, { aria: true })); await cap(page, 'dbl-annule');
    await page.goto(BANC); await calme(page, 1500); await versFinances(page, 'Opérations');
    J('filtres', await cl(page, /^Filtres/)); await calme(page, 500); J('archives', await cl(page, /^Gérer les archives$/)); await cap(page, 'arc-repos');
    J('annee', await cl(page, new RegExp(`^${new Date().getFullYear() - 1} : .*ranger`), { aria: true })); await cap(page, 'arc-poignee');
    J('ranger', await cl(page, /^Ranger \d{4}/)); await cap(page, 'arc-range');
    J('consulter', await cl(page, /^Consulter /, { aria: true })); await cap(page, 'arc-consulte');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async pay(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T);
    J('paye', await cl(page, /Payé/, { sel: '.ops-act' })); await cap(page, 'fn2-avis');
    J('autre', await cl(page, /Autre montant/, { sel: '.ops-avis-b,button' })); await calme(page, 900); await cap(page, 'fn2-autre'); await cap(page, 'fn2-autre-bas', { bas: true });
    J('payer', await cl(page, /^✓ Payer/, { racine: '[role=dialog]' })); await calme(page, 1800); await cap(page, 'fn2-apres');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async fiche(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T);
    J('ligne', await cl(page, /Malt et houblons/, { sel: 'button' })); await calme(page, 900); await cap(page, 'fiche-malt'); await cap(page, 'fiche-malt-bas', { bas: true });
    J('modifier', await cl(page, /^Modifier/, { racine: '[role=dialog]' })); await calme(page, 900); await cap(page, 'modif-malt'); await cap(page, 'modif-malt-bas', { bas: true });
    J('autres-frais', await cl(page, /^Autres frais$/, { racine: '[role=dialog]', sel: 'label,button,[role=radio],span,div' })); await calme(page, 500); await cap(page, 'modif-autres');
    await page.keyboard.press('Escape'); await calme(page, 500); await page.keyboard.press('Escape'); await calme(page, 500);
    await page.goto(BANC); await calme(page, 1500); await versFinances(page, 'Opérations');
    J('apport', await cl(page, /^Apport ou prélèvement privé/)); await calme(page, 900);
    await taper(page, '[role=dialog] [aria-label="Montant (CHF)"]', '500'); J('enr-apport', await cl(page, /^Enregistrer/, { racine: '[role=dialog]' })); await calme(page, 1800);
    J('apres-enr', await page.evaluate(() => [...document.querySelectorAll('[role=dialog]')].filter((e) => e.getClientRects().length).length)); await cap(page, 'apport-apres'); J('ligne-apport', await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((e) => e.getClientRects().length && /pport/.test(e.textContent) && !/^Apport ou prélèvement/.test(e.textContent.trim())); b[0]?.scrollIntoView({ block: 'center' }); b[0]?.click(); return b.map((x) => x.textContent.slice(0, 70)).join(' || ') || false; })); await calme(page, 900); await cap(page, 'fiche-apport'); await cap(page, 'fiche-apport-bas', { bas: true });
    J('boutons-apport', (await boutons(page)).slice(0, 400));
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async prev(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T, BANC, 'Prévisions');
    await cap(page, 'prev-onglet');
    let ap = await cl(page, /Ajouter une prévision/); if (!ap) { J('sorties', await cl(page, /sorties$/)); await calme(page, 600); ap = await cl(page, /Ajouter une prévision/); } J('ajouter', ap); await calme(page, 900); await cap(page, 'pr-ouvert');
    J('nom', await taper(page, 'input[placeholder^="Loyer"]', 'Loyer')); J('mt', await taper(page, '[role=dialog] [aria-label="Montant (CHF)"], [aria-label="Montant (CHF)"]', '500,50'));
    J('mois', await cl(page, /^Chaque mois/)); await calme(page, 500); await cap(page, 'pr-rempli'); await cap(page, 'pr-rempli-bas', { bas: true });
    await page.goto(BANC); await calme(page, 1500); await versFinances(page, 'Prévisions');
    J('projets', (await cl(page, /Mes projets de matériel/)) || (await cl(page, /achats? de matériel pas compt/))); await calme(page, 900); await cap(page, 'pm-liste');
    J('fermenteur', await cl(page, /Fermenteur supplémentaire/)); await calme(page, 1000); await cap(page, 'pm-ouvert'); await cap(page, 'pm-ouvert-bas', { bas: true });
    J('pret', await cl(page, /^Prêt à acheter/)); await calme(page, 600); await cap(page, 'pm-pret');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async bien(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T, BANC, 'Annuel');
    J('etape4', await cl(page, /^4\. Matériel et usure/, { aria: true })); await calme(page, 900); await cap(page, 'im-etape4');
    let ok = false; for (const c of [/Cuve/, /Ajouter un (matériel|bien)/, /amortir/]) if (!ok) { const r = await cl(page, c); if (r) { ok = true; J('bien', r); } }
    await calme(page, 900); await cap(page, 'im-ouvert'); await cap(page, 'im-ouvert-bas', { bas: true });
    J('10pc', await cl(page, /10 % du prix/)); await calme(page, 500); await cap(page, 'im-10pc');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async profil(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T, BANC + '=reel', 'Synthèse');
    J('profil', await cl(page, /Solde et paramètres financiers/, { aria: true })); await calme(page, 900); await cap(page, 'pf-ouvert'); await cap(page, 'pf-ouvert-bas', { bas: true });
    J('range', await page.evaluate(() => { const r = document.querySelector('input.pfc-range'); if (!r) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, '2500'); r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); return true; }));
    J('depuis', await cl(page, /Tout est noté depuis/, { aria: true })); await calme(page, 500); await cap(page, 'pf-apres');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async profildemo(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T, BANC, 'Synthèse');
    J('profild', await cl(page, /Solde et paramètres financiers/, { aria: true })); await calme(page, 900); await cap(page, 'pfd-ouvert'); await cap(page, 'pfd-ouvert-bas', { bas: true });
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async budget(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T, BANC, null);
    J('plus', await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => e.getClientRects().length && e.textContent.trim() === '+'); b?.click(); return !!b; })); await calme(page, 1000); await cap(page, 'bb-choix');
    J('row', await page.evaluate(() => { const b = document.querySelector('.bbx-row'); b?.click(); return b?.textContent.slice(0, 60) ?? false; })); await calme(page, 1200); await cap(page, 'bb-repos'); await cap(page, 'bb-complet', { full: true });
    J('litre', await page.evaluate(() => { const b = document.querySelector('.bbx-lit'); b?.click(); return b?.textContent.slice(0, 60) ?? false; })); await calme(page, 900); await cap(page, 'bb-c3a'); await cap(page, 'bb-c3a-bas', { bas: true });
    J('retour', await cl(page, /^Retour au budget/)); await calme(page, 700);
    J('op', await page.evaluate(() => { const b = document.querySelector('.bbx-op[data-noeud=emb], .bbx-op'); b?.click(); return b?.textContent.slice(0, 60) ?? false; })); await calme(page, 700); await cap(page, 'bb-rangee');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async ia(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T);
    J('puce', await page.evaluate(() => { const e = document.querySelector('.finance-assistant'); e?.scrollIntoView(); e?.click(); return e?.textContent?.slice(0, 60) ?? false; })); await calme(page, 900); await cap(page, 'ia-feuille'); await cap(page, 'ia-feuille-bas', { bas: true });
    await page.evaluate(() => { document.querySelector('[data-pastille=aPayer]')?.click(); document.querySelector('[data-pastille=toutHistorique]')?.click(); }); await calme(page, 500); await cap(page, 'ia-coche');
    J('envoyer', await cl(page, /^Envoyer$/)); await calme(page, 1500); await cap(page, 'ia-chat');
    J('bloquees', j.bloquees.slice(0, 5)); J('err', j.erreurs.slice(0, 3)); await browser.close(); },
};
for (const [L, M] of [[390, true], [1280, false]]) for (const T of ['clair', 'cave']) {
  cfg = `${L}-${T === 'cave' ? 'sombre' : 'clair'}`; if (SEULS && !SEULS.includes(cfg)) continue;
  for (const [n, f] of Object.entries(scen)) { if (SCEN && !SCEN.includes(n)) continue; try { await f(L, M, T); } catch (e) { J(n, 'ECHEC ' + String(e?.message ?? e).slice(0, 200)); } }
  console.log('fait', cfg);
  writeFileSync(OUT + 'textes.json', JSON.stringify({ journal, textes }, null, 1));
}
console.log(journal.filter((l) => !SEULS || SEULS.includes(l[0])).map((l) => JSON.stringify(l).slice(0, 300)).join('\n'));
