// node fnx.mjs [cfgs] : FN-5, FN-6, FN-7, FN-9, FN-10 sur deux pièces « ZZ TEST » écrites dans le navigateur de test (banc local, profil neuf).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
const OUT = fileURLToPath(new URL('./', import.meta.url));
const BANC = 'http://localhost:3000/?dev-local&finance-demo';
const SEULS = process.argv[2] ? process.argv[2].split(',') : ['390-clair', '1280-sombre'];
const sortie = {};
for (const [L, M, T] of [[390, true, 'clair'], [1280, false, 'cave'], [390, true, 'cave'], [1280, false, 'clair']]) {
  const cfg = `${L}-${T === 'cave' ? 'sombre' : 'clair'}`; if (!SEULS.includes(cfg)) continue;
  const { browser, page, journal: j } = await ouvrir({ largeur: L, hauteur: M ? 844 : 900, mobile: M, echelle: 1 });
  const log = (k, v) => { sortie[`${cfg} ${k}`] = v; };
  await page.goto(BANC); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), T); await page.reload(); await calme(page, 1800);
  log('ecrit', await page.evaluate(async () => {
    const { StorageService } = await import('/src/services/storage.ts');
    const jour = new Date().toISOString().slice(0, 10);
    const f = (id, nom, c, n) => ({ id, description: `ZZ TEST — ${nom}`, date: jour, category: 'brassage', subcategory: '', amountHT: c / 100, amountTTC: c / 100, tvaAmount: 0, tvaRate: 0,
      finance: { version: 1, kind: 'expense', amountCents: c, paymentStatus: 'unpaid', recordedAt: new Date(Date.now() - n * 60000).toISOString(), vendor: 'ZZ TEST — Fournisseur', invoiceNumber: id, lines: [] } });
    StorageService.addTransaction(f('ZZ-FNA', 'pièce A', 1000, 5)); StorageService.addTransaction(f('ZZ-FNB', 'pièce B', 1500, 4));
    return StorageService.getTransactions().filter((t) => t.id.startsWith('ZZ-FN')).length; }));
  const clic = (src, { racine = 'body', sel = 'button,[role=tab],[role=radio],summary,label' } = {}) => page.evaluate((src, racine, sel) => {
    const r = new RegExp(src); const rs = [...document.querySelectorAll(racine)].filter((e) => e.getClientRects().length); const rr = racine === 'body' ? rs : rs.slice(-1);
    const e = rr.flatMap((x) => [...x.querySelectorAll(sel)]).filter((x) => x.getClientRects().length && r.test(((x.getAttribute('aria-label') || '') + ' ' + x.textContent).replace(/\s+/g, ' ').trim()));
    const b = e[0]; if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return b.textContent.replace(/\s+/g, ' ').trim().slice(0, 70); }, src, racine, sel);
  const dlg = '[role=dialog]';
  const cap = async (n, bas = false) => {
    if (bas) await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].filter((e) => e.getClientRects().length).at(-1); const s = d && [d, ...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (s) s.scrollTop = s.scrollHeight; });
    await calme(page, 600); await page.screenshot({ path: `${OUT}${n}-${cfg}.png` });
    log(n, await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].filter((e) => e.getClientRects().length).at(-1) ?? document.querySelector('main'); const ch = [...d.querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea')].filter((i) => i.getClientRects().length).map((i) => `${i.getAttribute('aria-label') ?? i.placeholder ?? '?'}=${i.value}`); return d.innerText.replace(/\n+/g, ' / ').slice(0, 1500) + ' ## ' + ch.join(' ; '); })); };
  const tape = async (sel, v) => { const ok = await page.evaluate((s) => { const i = [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length)[0]; if (!i) return false; i.scrollIntoView({ block: 'center' }); i.focus(); i.select?.(); return i.getAttribute('aria-label') || true; }, sel); if (!ok) return false; await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type(v, { delay: 25 }); await page.keyboard.press('Tab'); await calme(page, 600); return ok; };
  const taperValeur = async (val, nv) => { const r = await page.evaluate((val) => { const d = [...document.querySelectorAll('[role=dialog]')].filter((e) => e.getClientRects().length).at(-1); const c = [...d.querySelectorAll('input')].find((i) => i.value === val) ?? [...d.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === val); if (!c) return null; c.scrollIntoView({ block: 'center' }); const b = c.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, tag: c.tagName + (c.getAttribute('aria-label') ? ':' + c.getAttribute('aria-label') : ''), vis: b.width + 'x' + b.height }; }, val); if (!r) return false; await page.mouse.click(r.x, r.y); await calme(page, 300); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type(nv, { delay: 30 }); await page.keyboard.press('Tab'); await calme(page, 700); return r.tag + ' ' + r.vis; };
  const fermer = async () => { for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await calme(page, 400); } };
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic('^Opérations'); await calme(page, 1200);
  // FN-6 : ✓ Payé de la rangée A puis Annuler de l'avis, puis la fiche A.
  log('paye-A', await page.evaluate(() => { const r = [...document.querySelectorAll('.ops-act')].filter((e) => { if (!e.getClientRects().length) return false; let p = e; for (let i = 0; i < 4 && p; i++) { p = p.parentElement; if (p && /pièce A/.test(p.textContent) && !/pièce B/.test(p.textContent)) return true; } return false; }); r[0]?.scrollIntoView({ block: 'center' }); r[0]?.click(); return r.length; })); await calme(page, 900);
  await cap('fn6-avis');
  log('annuler-avis', await clic('Annuler', { sel: '.ops-avis-b' })); await calme(page, 1200);
  log('fiche-A', await clic('ZZ TEST — pièce A', { sel: 'button' })); await calme(page, 900); await cap('fn6-ficheA', true);
  log('corr-ouvre', await clic('corrigé', { racine: dlg, sel: 'summary' })); await cap('fn6-ficheA-detail', true);
  // FN-7 : Noter un paiement, virement 12,00 sur A et B.
  log('noter', await clic('^Noter un paiement', { racine: dlg, sel: 'button' })); await calme(page, 1000); await cap('fn7-payer');
  log('vir', await taperValeur('25,00', '12')); await cap('fn7-payer12');
  log('payer', await clic('^✓ Payer', { racine: dlg, sel: 'button' })); await calme(page, 1600); await fermer();
  log('fiche-B', await clic('ZZ TEST — pièce B', { sel: 'button' })); await calme(page, 900); await cap('fn7-ficheB', true); await fermer();
  // FN-9, FN-5, FN-10 : Modifier A (payé 10,00), Précision, Autres frais, montant 9,00.
  log('fiche-A2', await clic('ZZ TEST — pièce A', { sel: 'button' })); await calme(page, 900); await cap('fn7-ficheA', true);
  log('modif1', await clic('Modifier', { racine: dlg, sel: 'button' })); await calme(page, 900); await cap('fn9-modif1'); await cap('fn9-modif1-bas', true);
  log('autres', await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].at(-1); const se = [...d.querySelectorAll('select')].find((x) => [...x.options].some((o) => /Autres frais/.test(o.text))); if (!se) return false; const o = [...se.options].find((o) => /Autres frais/.test(o.text)); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(se, o.value); se.dispatchEvent(new Event('change', { bubbles: true })); return o.value; })); await cap('fn5-autres');
  await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].at(-1); const l = [...d.querySelectorAll('label')].find((x) => /^Montant/.test(x.textContent.trim())); const i = l?.querySelector('input') ?? (l?.htmlFor && document.getElementById(l.htmlFor)); if (i) i.setAttribute('data-zzmt', '1'); }); log('mt9', await taperValeur('10,00', '9')); await cap('fn10-baisse'); await cap('fn10-baisse-bas', true);
  log('boutons', await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].filter((b) => b.getClientRects().length).map((b) => b.textContent.trim().slice(0, 40)).join(' | ')));
  log('choix', await clic('J.ai bien payé', { racine: dlg, sel: 'button,label,[role=radio]' })); await cap('fn10-choix', true);
  log('enr', await clic('^Enregistrer', { racine: dlg, sel: 'button' })); await calme(page, 1600); await cap('fn10-apres');
  log('fiche-A3', await clic('^ZZ TEST — pièce A', { sel: 'button' })); await calme(page, 900); await cap('fn10-ficheA', true);
  log('modif2', await clic('Modifier', { racine: dlg, sel: 'button' })); await calme(page, 900); await cap('fn9-modif2'); await cap('fn9-modif2-bas', true);
  await fermer(); log('compte', await page.evaluate(async () => { const { StorageService } = await import('/src/services/storage.ts'); const { FinanceService } = await import('/src/services/financeService.ts'); const tx = StorageService.getTransactions().filter((t) => /ZZ TEST/.test(t.description) || t.id.startsWith('ZZ-FN')); const ids = new Set(tx.map((t) => t.id)); return { tx: tx.map((t) => [t.id, t.description, t.category, t.finance?.kind, t.finance?.amountCents, t.finance?.paymentStatus, t.finance?.refundOfId ?? t.finance?.offsetOfId ?? '']), pay: FinanceService.getPayments().filter((p) => ids.has(p.transactionId)).map((p) => [p.transactionId, p.direction, p.amountCents, p.reversalOfId ? 'contre' : '', p.note ?? '', p.transferId ?? p.groupId ?? '']) }; }));
  log('err', j.erreurs.slice(0, 3)); await browser.close();
}
writeFileSync(OUT + 'fnx.json', JSON.stringify(sortie, null, 1));
console.log(Object.entries(sortie).map(([k, v]) => k + ' => ' + JSON.stringify(v).slice(0, 300)).join('\n'));
