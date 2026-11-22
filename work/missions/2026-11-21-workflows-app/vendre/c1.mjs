// C1 : vente au comptoir (6 × 33 cl Pale Ale, TWINT), puis où elle se voit.
import { ouvrir, sleep } from './outils.mjs';
const S = process.argv[2];
const o = await ouvrir(S, { cpu: Number(process.argv[3] ?? 1) });
const B = async (n) => console.log(n, JSON.stringify(await o.boutons()).slice(0, 1100));
try {
  await o.demarrer(); o.raz();
  const t0 = Date.now();
  await o.tap('Actions rapides'); await o.cap('c1-01-menu'); await B('MENU');
  await o.tap('Vendre').catch(() => o.tap('Vente'));
  await o.cap('c1-02-caisse'); await B('CAISSE'); console.log('TXT', await o.texte(900));
  for (let k = 0; k < 6; k++) await o.tap('33 cl', { att: 250 });
  await o.cap('c1-03-panier');
  await o.tap('TWINT').catch(e => console.log('twint', e.message));
  await o.cap('c1-04-twint'); await B('APRES-TWINT');
  const prim = await o.p.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.getBoundingClientRect().width > 0 && /encaiss|enregistr|valider|payé/i.test(e.innerText)).map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  console.log('PRIM', JSON.stringify(prim));
  if (prim[0]) await o.tap(prim.at(-1), { att: 2500 });
  await o.cap('c1-05-apres');
  console.log('GESTES C1', o.nb(), 'durée', Date.now() - t0, 'ms');
  console.log('TXT-APRES', await o.texte(500));
  // où la vente se voit
  for (const t of ['Finances', 'Calendrier', 'Brassins', 'Clients', 'Bord']) { await o.onglet(t); await sleep(900); await o.cap(`c1-v-${t}`); console.log('VU', t, (await o.texte(900)).slice(60, 900)); }
  await o.onglet('Stocks'); await o.tap('Fûts', { pref: false }); await o.cap('c1-v-futs'); console.log('FUTS', (await o.texte(1200)).slice(60));
  const tx = await o.store('transactions'); console.log('TX', JSON.stringify(tx.map(t => [t.id.slice(0, 12), t.amountTTC, t.description, t.finance?.batchId, t.finance?.paymentStatus])));
} catch (e) { console.log('ERR', e.message); await o.cap('c1-err'); await B('ERR-BOUTONS'); }
console.log(o.log.join('\n')); console.log('ERREURS', o.err.slice(0, 6).join(' | '));
await o.fermer();
