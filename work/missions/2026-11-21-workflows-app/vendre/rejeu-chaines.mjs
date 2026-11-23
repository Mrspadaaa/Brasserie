// Rejeu au doigt des chaînes 2 à 5 (VENDRE) sur la fixture simulée, en ?dev-local, 390 tactile.
// Usage : node chaines.mjs <dossier> <cpu>. Gestes = taps comptés, hors observations (regarder).
import fs from 'node:fs'; import path from 'node:path';
import { ouvrir, sleep } from 'file:///C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-21-workflows-app/vendre/outils.mjs';
const S = process.argv[2]; const CPU = Number(process.argv[3] ?? 1);
const o = await ouvrir(S, { cpu: CPU });
const R = { cpu: CPU, chaines: {}, obs: [], notes: [] };
let obsG = 0, extra = 0;
const B = async n => console.log(n, JSON.stringify(await o.boutons()).slice(0, 1000));
const a = async (nom, f) => {
  const g0 = o.nb(), o0 = obsG, x0 = extra, t0 = Date.now(), l0 = o.log.length;
  let statut = 'OK';
  try { await f(); } catch (e) { statut = 'BLOCAGE: ' + e.message; await o.cap(nom.replace(/\W+/g, '-') + '-blocage'); await B(nom + ' BLOCAGE'); }
  const inps = o.log.slice(l0).map(l => (l.match(/INP (\d+)/) || [])[1]).filter(Boolean).map(Number);
  R.chaines[nom] = { statut, gestes: o.nb() - g0 - (obsG - o0) + (extra - x0), ms: Date.now() - t0, inp: inps, inpMax: Math.max(0, ...inps) };
  console.log('== ' + nom, JSON.stringify(R.chaines[nom]));
};
// Observation : taps non comptés dans la chaîne, INP gardés à part.
const regarder = async (nom, f) => { const g0 = o.nb(), l0 = o.log.length; try { await f(); } catch (e) { R.obs.push([nom, 'ERR ' + e.message]); } obsG += o.nb() - g0; R.obs.push([nom, o.log.slice(l0).filter(l => /INP/.test(l)).map(l => l.replace(/^\[g\d+\] /, ''))]); o.log.splice(l0); };
// Bouton visible, exact ou par regex, hors « Retour au tableau » (piège WFV-14 du banc).
const premier = (re) => o.p.evaluate(src => { const r = new RegExp(src, 'i'); const e = [...document.querySelectorAll('button,[role=button]')].find(b => { const q = b.getBoundingClientRect(); const t = (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(); return q.width > 0 && q.height > 0 && !b.disabled && r.test(t) && !/tableau/.test(t); }); return e ? (e.innerText || e.getAttribute('aria-label')).replace(/\s+/g, ' ').trim() : null; }, re.source);
// Tap au doigt sur un sélecteur CSS (champ client : textarea role=combobox, aria-label « Client »).
const tapSel = async (sel) => {
  const c = await o.p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [q.x + q.width / 2, q.y + q.height / 2, Math.round(q.width), Math.round(q.height), s]; }, sel);
  if (!c) throw new Error('absent ' + sel);
  await sleep(80); await o.p.evaluate(() => { window.__inp = 0; }); await o.p.touchscreen.tap(c[0], c[1]); extra++; await sleep(700);
  const inp = await o.p.evaluate(() => Math.round(window.__inp)); o.log.push(`[x${extra}] « ${c[4]} » ${c[2]}×${c[3]} px · INP ${inp} ms`);
};
// Tap au doigt d'un élément choisi par regex et par sélecteur (listes déroulantes, options) : compté comme un geste.
const tapRe = async (re, sel) => {
  const c = await o.p.evaluate((src, s) => { const r = new RegExp(src, 'i'); const e = [...document.querySelectorAll(s)].find(x => { const q = x.getBoundingClientRect(); return q.width > 0 && q.height > 0 && r.test((x.innerText || x.getAttribute('aria-label') || '').replace(/\s+/g, ' ')); }); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [q.x + q.width / 2, q.y + q.height / 2, Math.round(q.width), Math.round(q.height), (e.innerText || '').replace(/\s+/g, ' ').slice(0, 40)]; }, re.source, sel);
  if (!c) throw new Error('introuvable ' + re);
  await sleep(80); await o.p.evaluate(() => { window.__inp = 0; }); await o.p.touchscreen.tap(c[0], c[1]); extra++; await sleep(700);
  const inp = await o.p.evaluate(() => Math.round(window.__inp)); o.log.push(`[x${extra}] « ${c[4]} » ${c[2]}×${c[3]} px · INP ${inp} ms`);
};
try {
  await o.demarrer(); o.raz();

  // CHAÎNE 2 : facture à un pro, 2 fûts (puce client entière, pas le nom : WFV-12)
  await a('C2 facture 2 fûts', async () => {
    await o.tap('Actions rapides'); await o.tap('Vente');
    R.notes.push(['WFV-12 cible du nom', await o.trouve('La Cigogne')]);
    await o.tap('C Pro La Cigogne');
    await o.tap('fût 20 L'); await o.tap('fût 20 L');
    await o.cap('c2-01-panier'); await B('C2-PANIER');
    const p = await premier(/^Facturer/); console.log('PRIM2', p);
    if (!p) throw new Error('pas de bouton Facturer');
    await o.tap(p, { pref: false, att: 2500 });
    await o.cap('c2-02-apres'); await B('C2-APRES');
    if ((await o.boutons()).includes('OK')) await o.tap('OK', { pref: false, att: 1200 });
    if ((await o.boutons()).includes('Fermer')) await o.tap('Fermer', { i: -1 });
  });
  await regarder('C2 cal après', async () => { await o.onglet('Calendrier'); await sleep(900); await o.cap('c2-03-cal-apres'); console.log('CAL2', (await o.texte(260)).slice(55, 260)); });
  await regarder('C2 fûts après', async () => { await o.onglet('Stocks'); await o.tap('Fûts', { pref: false }); await o.cap('c2-04-futs'); console.log('FUTS2', (await o.texte(900)).slice(60, 700)); });

  // CHAÎNE 3 : commande promise (plan La Cigogne 2 fûts) → vendre → facturer
  await a('C3 commande promise', async () => {
    await o.onglet('Calendrier'); await sleep(600);
    await o.tap('La Cigogne, 2 fûts', { dans: '[data-rangee="ventes"] [data-chose-id]' });
    await o.cap('c3-01-chose'); await B('C3-CHOSE');
    const p = await premier(/^Facturer|^Vendre|^Vente/i); console.log('PRIM3', p);
    if (!p) throw new Error('pas de bouton Vendre sur la chose');
    await o.tap(p, { pref: false, att: 1500 });
    await o.cap('c3-02-apres-facturer'); await B('C3-APRES-FACTURER');
    const p2 = await premier(/^Facturer \d/i); console.log('PRIM3b', p2);
    if (!p2) throw new Error('Facturer de la chose ne mène à aucune caisse préremplie (Finances affiché, aucune vente créée)');
    await o.tap(p2, { pref: false, att: 2500 });
    await o.cap('c3-03-apres'); await B('C3-APRES');
    if ((await o.boutons()).includes('OK')) await o.tap('OK', { pref: false, att: 1200 });
    if ((await o.boutons()).includes('Fermer')) await o.tap('Fermer', { i: -1 });
  });
  await regarder('C3 cal après', async () => { await o.onglet('Calendrier'); await sleep(900); await o.cap('c3-04-cal'); const v = await o.p.evaluate(() => [...document.querySelectorAll('[data-rangee="ventes"] [data-chose-id]')].map(e => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').slice(0, 70))); console.log('VENTES3', JSON.stringify(v)); });

  // CHAÎNE 4 : livraison d'un fût (F-001 à La Cigogne), puis retour vide
  await a('C4 livraison F-001', async () => {
    await o.onglet('Stocks'); await o.tap('Fûts', { pref: false });
    await o.tap('F-001'); await o.cap('c4-01-fiche'); await B('C4-FICHE');
    await tapSel('textarea[role=combobox]');
    await o.cap('c4-02-choix'); await B('C4-CHOIX');
    await tapRe(/^(C Pro )?La Cigogne/, '[role=option],li,[role=button],button,div');
    await o.cap('c4-03-client'); await B('C4-CLIENT');
    const p = await premier(/^Livrer/); console.log('PRIM4', p);
    if (!p) throw new Error('bouton Livrer absent');
    await o.tap(p, { pref: false, att: 2000 });
    await o.cap('c4-04-livre'); await B('C4-LIVRE');
  });
  await a('C4 retour F-004', async () => {
    await o.tap('F-004'); await o.cap('c4-05-fiche-f004'); await B('C4-FICHE4');
    const p = await premier(/^Retour vide/i); console.log('PRIM4b', p);
    if (!p) throw new Error('pas de bouton de retour sur F-004');
    await o.tap(p, { pref: false, att: 1500 });
    await o.cap('c4-06-apres'); await B('C4-APRES');
  });
  await regarder('C4 fûts après', async () => { await o.onglet('Stocks'); await o.tap('Fûts', { pref: false }); await o.cap('c4-07-futs'); console.log('FUTS4', (await o.texte(900)).slice(60, 700)); });

  // CHAÎNE 5 : encaisser la facture due (140,00 : la facture de la fixture)
  await a('C5 encaisser', async () => {
    await o.onglet('Finances'); await o.tap('Noter l’encaissement'); await o.cap('c5-01'); await B('C5');
    const p = await premier(/^✓ Encaisser/); console.log('PRIM5', p);
    if (!p) throw new Error('pas de bouton « ✓ Encaisser »');
    await o.tap(p, { pref: false, att: 2500 }); await o.cap('c5-02-apres'); await B('C5-APRES');
    if ((await o.boutons()).includes('OK')) await o.tap('OK', { pref: false, att: 1500 });
    await o.cap('c5-03-ok'); await B('C5-OK');
  });
} catch (e) { console.log('ERR GLOBAL', e.message); }
console.log('--- LOG ---'); console.log(o.log.filter(l => !l.startsWith('[cap]')).join('\n'));
console.log('ERREURS', o.err.slice(0, 6).join(' | '));
for (const [c, nom] of [['kegs', 'KEGS'], ['financialPlans', 'PLANS']]) { const d = await o.store(c); console.log(nom, JSON.stringify(d.map(x => [x.id, x.status ?? x.state, x.amountCents ?? x.clientName ?? '', x.batchRef ?? x.date ?? '']))); }
const tx = await o.store('transactions'); console.log('TX', JSON.stringify(tx.map(t => [t.id.slice(0, 14), t.amountTTC, t.description?.slice(0, 40), t.finance?.paymentStatus])));
R.chaines.__total = Object.values(R.chaines).reduce((s, c) => s + (c.gestes || 0), 0);
fs.writeFileSync(path.join(S, `rapport-cpu${CPU}.json`), JSON.stringify(R, null, 1));
console.log('RAPPORT', JSON.stringify(R.chaines));
console.log('OBS', JSON.stringify(R.obs));
await o.fermer();
