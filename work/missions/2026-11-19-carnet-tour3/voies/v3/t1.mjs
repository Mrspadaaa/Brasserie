import { lancer, ouvrir, capture, texte, boutons, dormir } from './outil.mjs';
const nav = await lancer();
for (const q of ['?dev-local&depense=v3-lent', '?dev-local']) {
  const p = await ouvrir(nav, q, 390, 'clair'); await dormir(8000);
  console.log(q, 'texte:', (await texte(p)).slice(0, 300).replace(/\n+/g, ' ¦ '));
  console.log('boutons:', JSON.stringify(await boutons(p)).slice(0, 900)); console.log('erreurs:', JSON.stringify(p.erreurs).slice(0, 500));
  console.log(await capture(p, 'diag-' + (q.includes('v3') ? 'lent' : 'nu'))); await p.close();
}
await nav.close();
