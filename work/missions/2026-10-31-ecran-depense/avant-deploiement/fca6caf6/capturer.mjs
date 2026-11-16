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
  if (!e.length) return false; const b = dernier ? e.at(-1) : e[0]; b.scrollIntoView({ block: 'center' }); if (b.disabled) return 'desactive'; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.click(); return n(b.textContent || b.getAttribute('aria-label')).slice(0, 80) || 'ok';
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
const totaux = (page) => page.evaluate(() => { const t = (document.querySelector('main') ?? document.body).innerText.replace(/\s+/g, ' '); return t.slice(0, 420); });
const dlg = '[role=dialog]';
const scen = {
  async ret(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T);
    J('avant', await totaux(page));
    J('ecrit', await page.evaluate(async () => { const { StorageService } = await import('/src/services/storage.ts'); const { FinanceService } = await import('/src/services/financeService.ts');
      const jour = new Date().toISOString().slice(0, 10);
      const f = { id: 'ZZ-RET', description: 'ZZ TEST — pièce payée', date: jour, category: 'brassage', subcategory: '', amountHT: 40, amountTTC: 40, tvaAmount: 0, tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents: 4000, paymentStatus: 'paid', recordedAt: new Date().toISOString(), vendor: 'ZZ TEST — Fournisseur', invoiceNumber: 'ZZ-RET', lines: [] } };
      FinanceService.stageNewTransactionPayment(f, { id: 'PAY-ZZ-RET', transactionId: 'ZZ-RET', date: jour, amountCents: 4000, direction: 'out', method: 'bank', recordedAt: new Date().toISOString() });
      return StorageService.getTransactions().filter((t) => t.id === 'ZZ-RET').length; }));
    await calme(page, 1200); J('apres-ajout', await totaux(page)); await cap(page, 'ret-liste');
    J('fiche', await cl(page, /ZZ TEST — pièce payée/, { sel: 'button' })); await calme(page, 900);
    J('corr', await cl(page, /^Corriger une erreur de saisie/, { racine: dlg, sel: 'summary' })); await calme(page, 500);
    J('retirer', await cl(page, /^Retirer cette écriture/, { racine: dlg })); await cap(page, 'ret-confirm', { bas: true });
    J('confirmer', await cl(page, /^Confirmer le retrait/, { racine: dlg })); await calme(page, 1800); await cap(page, 'ret-fiche', { bas: true });
    J('fermer', await cl(page, /^Fermer/, { aria: true, racine: dlg })); await calme(page, 1500);
    J('apres-retrait', await totaux(page)); J('encore-liste', await page.evaluate(() => (document.querySelector('main') ?? document.body).innerText.includes('ZZ TEST — pièce payée'))); await cap(page, 'ret-apres');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async apport(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T);
    J('apport', await cl(page, /^Apport ou prélèvement privé/)); await calme(page, 900);
    await taper(page, '[role=dialog] [aria-label="Montant (CHF)"]', '5'); await taper(page, '[role=dialog] [aria-label="Motif"]', 'ZZ TEST — Apport');
    J('enr', await cl(page, /^Enregistrer/, { racine: dlg })); await calme(page, 1800); J('apres-apport', await totaux(page));
    J('fiche', await cl(page, /ZZ TEST — Apport/, { sel: 'button' })); await calme(page, 900); await cap(page, 'ap-fiche', { bas: true });
    J('corr-pay', await cl(page, /^Corriger ce paiement saisi par erreur/, { racine: dlg })); await cap(page, 'ap-corriger', { bas: true });
    J('conf', await cl(page, /^Confirmer la correction/, { racine: dlg })); await calme(page, 1200);
    J('corr', await cl(page, /^Corriger une erreur de saisie/, { racine: dlg, sel: 'summary' })); J('annuler', await cl(page, /^(Annuler|Retirer) cette écriture/, { racine: dlg })); await calme(page, 400);
    J('conf2', await cl(page, /^Confirmer (la correction|le retrait)/, { racine: dlg })); await calme(page, 1500); await cap(page, 'ap-annule', { bas: true });
    J('fermer', await cl(page, /^Fermer/, { aria: true, racine: dlg })); await calme(page, 1200); J('apres-annul', await totaux(page));
    J('encore-liste', await page.evaluate(() => (document.querySelector('main') ?? document.body).innerText.includes('ZZ TEST — Apport')));
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async dep(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T);
    await page.click('button[aria-label="Actions rapides"]').catch(() => J('ar', 'absent')); await calme(page, 800);
    J('ne', await cl(page, /^Nouvelle écriture/)); await calme(page, 800); J('sj', await cl(page, /^Saisir sans justificatif/)); await calme(page, 1000); await cap(page, 'dep-feuille');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async prev(L, M, T, url = BANC, p = 'pv') { const { browser, page, journal: j } = await demarrer(L, M, T, url, 'Prévisions');
    J('rien-avant', await page.evaluate(() => document.body.innerText.includes('Rien de prévu'))); await cap(page, p + '-onglet');
    J('cartes', await page.evaluate(() => (document.body.innerText.match(/(Avec|Sans) [^\n]{0,40}/g) ?? []).slice(0, 4)));
    let ap = await cl(page, /Ajouter une prévision/); if (!ap) { J('sorties', await cl(page, /sorties$/)); await calme(page, 600); ap = await cl(page, /Ajouter une prévision/); } J('ajouter', ap); await calme(page, 900);
    J('nom', await taper(page, 'input[placeholder^="Loyer"]', 'ZZ TEST — prévue')); J('mt', await taper(page, '[role=dialog] [aria-label="Montant (CHF)"]', '7'));
    J('enr', await cl(page, /^Enregistrer/, { racine: dlg })); await calme(page, 1500);
    J('rien-apres', await page.evaluate(() => document.body.innerText.includes('Rien de prévu'))); await cap(page, p + '-apres');
    J('deplie', await cl(page, /\d+ sorties$/)); await calme(page, 600); J('ouvre', await cl(page, /ZZ TEST — prévue/, { sel: 'button,[role=button],li,a,div', dernier: true })); await calme(page, 900); J('btn1', await boutons(page));
    J('modif', await cl(page, /^Modifier la prévision/, { aria: true })); await calme(page, 900); await cap(page, p + '-modifier', { bas: true });
    J('suppr', await cl(page, /^Supprimer/, { racine: dlg, dernier: true })); await calme(page, 600); await cap(page, p + '-confirm', { bas: true });
    J('oui', await cl(page, /^Oui, supprimer/, { racine: dlg })); await calme(page, 1500);
    J('encore', await page.evaluate(() => document.body.innerText.includes('ZZ TEST — prévue'))); J('rien-fin', await page.evaluate(() => document.body.innerText.includes('Rien de prévu'))); await cap(page, p + '-supprime');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async vide(L, M, T) { return scen.prev(L, M, T, BANC + '=reel', 'pvr'); },
  async projet(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T, BANC, 'Prévisions');
    J('projets', (await cl(page, /Mes projets de matériel/)) || (await cl(page, /achats? de matériel pas compt/))); await calme(page, 900); await cap(page, 'pj-liste');
    J('ferm', await cl(page, /Fermenteur supplémentaire/)); await calme(page, 1000); await cap(page, 'pj-pied', { bas: true }); J('btn', await boutons(page));
    J('arch', await cl(page, /^Archiver/, { racine: dlg, dernier: true })); await calme(page, 600); await cap(page, 'pj-archiver', { bas: true });
    J('garder', await cl(page, /^Garder/, { racine: dlg })); await calme(page, 400);
    J('suppr', await cl(page, /^Supprimer/, { racine: dlg, dernier: true })); await calme(page, 600); await cap(page, 'pj-supprimer', { bas: true });
    J('oui', await cl(page, /^Oui, supprimer/, { racine: dlg })); await calme(page, 1500); await cap(page, 'pj-apres');
    J('encore', await page.evaluate(() => document.body.innerText.includes('Fermenteur supplémentaire')));
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async budgetreel(L, M, T) { return scen.budget(L, M, T, BANC + '=reel', 'bbr'); },
  async budget(L, M, T, url = BANC, p = 'bb') { const { browser, page, journal: j } = await demarrer(L, M, T, url, null);
    J('plus', await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => e.getClientRects().length && e.textContent.trim() === '+'); b?.click(); return !!b; })); await calme(page, 1000);
    J('rows', await page.evaluate(() => [...document.querySelectorAll('.bbx-row')].map((b) => b.textContent.slice(0, 40)).join(' | ')));
    for (let k = 0; k < 8; k++) { const ok = await page.evaluate((k) => { const b = document.querySelectorAll('.bbx-row')[k]; b?.click(); return b?.textContent.slice(0, 40) ?? null; }, k); if (ok === null) break; await calme(page, 1200); const t = await page.evaluate(() => (document.body.innerText.match(/Prix de \d+ ingr[^\n]{0,80}/) ?? [''])[0]); J('row' + k, ok, t); if (t) break; await page.keyboard.press('Escape'); await calme(page, 600); await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => e.getClientRects().length && e.textContent.trim() === '+'); b?.click(); }); await calme(page, 900); }
    J('prix', await page.evaluate(() => (document.body.innerText.match(/Prix de [^\n]{0,80}/) ?? [''])[0])); await page.evaluate(() => { const e = [...document.querySelectorAll('[role=dialog] *')].find((x) => !x.children.length && /^Prix de /.test(x.textContent.trim())); e?.scrollIntoView({ block: 'center' }); }); await cap(page, p + '-prix');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
  async profil(L, M, T) { const { browser, page, journal: j } = await demarrer(L, M, T, BANC, 'Synthèse');
    J('profil', await cl(page, /Solde et paramètres financiers/, { aria: true })); await calme(page, 900);
    J('axe', await page.evaluate(() => [...document.querySelectorAll('.pfc-ax span')].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 24).join(' | ')));
    await page.evaluate(() => document.querySelector('.pfc-ax')?.scrollIntoView({ block: 'center' })); await cap(page, 'pf-frise');
    J('err', j.erreurs.slice(0, 3)); await browser.close(); },
};
for (const [L, M] of [[390, true], [1280, false]]) for (const T of ['clair', 'cave']) {
  cfg = `${L}-${T === 'cave' ? 'sombre' : 'clair'}`; if (SEULS && !SEULS.includes(cfg)) continue;
  for (const [n, f] of Object.entries(scen)) { if (SCEN && !SCEN.includes(n)) continue; try { await f(L, M, T); } catch (e) { J(n, 'ECHEC ' + String(e?.message ?? e).slice(0, 200)); } }
  writeFileSync(OUT + 'textes.json', JSON.stringify({ journal, textes }, null, 1));
}
console.log(journal.filter((l) => !SEULS || SEULS.includes(l[0])).map((l) => JSON.stringify(l).slice(0, 460)).join('\n'));
