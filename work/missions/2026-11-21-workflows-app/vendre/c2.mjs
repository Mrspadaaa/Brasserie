// C2 facture QR 2 fûts à La Cigogne (commande promise au calendrier) ; C3 livrer un fût ; C4 retour vide ; C6 encaisser la facture.
import { ouvrir, sleep } from './outils.mjs';
const S = process.argv[2];
const o = await ouvrir(S);
const B = async (n) => console.log(n, JSON.stringify(await o.boutons()).slice(0, 1200));
const etape = async (nom, f) => { const g0 = o.nb(), t0 = Date.now(); try { await f(); } catch (e) { console.log(`ERR ${nom}`, e.message); await o.cap(`${nom}-err`); await B(`${nom}-ERR`); } console.log(`== ${nom} : ${o.nb() - g0} gestes, ${Date.now() - t0} ms`); };
const cal = async (n) => { await o.onglet('Calendrier'); await sleep(900); await o.cap(n); const ch = await o.p.evaluate(() => [...document.querySelectorAll('[data-rangee="ventes"] [data-chose-id]')].map(e => (e.getAttribute('aria-label') || e.innerText).replace(/\s+/g, ' ').slice(0, 70))); console.log('CAL', n, (await o.texte(260)).slice(55, 260), '| VENTES', JSON.stringify(ch)); };
try {
  await o.demarrer();
  await cal('c2-00-cal-avant');
  await etape('C2-facture-futs', async () => {
    await o.tap('Actions rapides'); await o.tap('Vente');
    await o.tap('La Cigogne'); await o.tap('fût 20 L'); await o.tap('fût 20 L');
    await o.cap('c2-01-panier'); await B('C2-PANIER');
    const prim = await o.p.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.getBoundingClientRect().width > 0 && /facture|créer|encaiss|enregistr/i.test(e.innerText) && !e.disabled).map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    console.log('PRIM', JSON.stringify(prim));
    await o.tap(prim.at(-1), { att: 3000 }); await o.cap('c2-02-apres'); await B('C2-APRES'); console.log('TXT', (await o.texte(700)).slice(0, 700));
    await o.tap('Fermer').catch(() => {});
  });
  await cal('c2-03-cal-apres');
  await o.onglet('Stocks'); await o.tap('Fûts', { pref: false }); await o.cap('c2-04-futs'); console.log('FUTS', (await o.texte(900)).slice(60, 700));
  await etape('C3-livrer-fut', async () => {
    await o.tap('F-001'); await o.cap('c3-01-fiche'); await B('C3-FICHE');
    await o.tap('Livrer'); await o.cap('c3-02-livrer'); await B('C3-LIVRER');
    await o.tap('La Cigogne').catch(() => {}); await o.cap('c3-03-client'); await B('C3-CLIENT');
    const prim = await o.p.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.getBoundingClientRect().width > 0 && /livr|confirm|enregistr|ok/i.test(e.innerText) && !e.disabled).map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    console.log('PRIM3', JSON.stringify(prim));
  });
  console.log('FUTS-APRES', (await o.texte(900)).slice(60, 700));
  await cal('c3-04-cal');
  await o.onglet('Stocks'); await o.tap('Fûts', { pref: false });
  await etape('C4-retour-vide', async () => {
    await o.tap('F-004'); await o.cap('c4-01-fiche'); await B('C4-FICHE');
    await o.tap('Revenu vide').catch(() => o.tap('Retour'));
    await o.cap('c4-02-apres'); await B('C4-APRES');
  });
  console.log('FUTS-APRES4', (await o.texte(900)).slice(60, 700));
  await etape('C6-encaisser', async () => {
    await o.onglet('Finances'); await o.tap('Noter l’encaissement'); await o.cap('c6-01'); await B('C6');
    const prim = await o.p.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.getBoundingClientRect().width > 0 && /encaiss|payé|confirm|enregistr/i.test(e.innerText) && !e.disabled).map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    console.log('PRIM6', JSON.stringify(prim));
  });
  const k = await o.store('kegs'); console.log('KEGS', JSON.stringify(k.map(x => [x.id, x.state, x.clientName, x.batchRef])));
  const tx = await o.store('transactions'); console.log('TX', JSON.stringify(tx.map(t => [t.id.slice(0, 14), t.amountTTC, t.description?.slice(0, 40), t.finance?.batchId, t.finance?.paymentStatus, t.finance?.dueDate])));
  const pl = await o.store('financialPlans'); console.log('PLANS', JSON.stringify(pl.map(x => [x.id, x.status, x.amountCents, x.date])));
} catch (e) { console.log('ERR', e.message); }
console.log(o.log.filter(l => !l.startsWith('[cap]')).join('\n')); console.log('ERREURS', o.err.slice(0, 6).join(' | '));
await o.fermer();
