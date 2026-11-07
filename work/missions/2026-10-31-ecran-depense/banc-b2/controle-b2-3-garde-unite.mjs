// B2 n° 3 (GARDE-FOU, le choix convertir / vider reste au brasseur) : la case g laissait « 2 Kg » devenir « 2 g » (pas 2 000 g) ; le stock disait « 1 → 1,002 Kg », la bande « 16,002 Kg ».
// Attendu : après Kg → g, le nombre n'est jamais gardé sous une autre unité : la quantité est vide et marquée « à remplir » ; le stock ne dit pas « 1,002 » ; la bande ne
// dit pas « 16,002 » ; le montant lu reste ; et la même règle vaut pour une ligne en g passée en Kg (Galaxy : « 60 g » ne devient pas « 60 Kg »).
// Usage : node controle-b2-3-garde-unite.mjs [<build>] [<dossier captures>]   → GARDEUNITE OK | GARDEUNITE ECHEC <raisons>
import { demarrer, ouvrirLigne, numeroLigne, uniteChoisir, champs, rangee } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  for (const [nom, vers] of [['Weizenmalz', 'g'], ['Galaxy', 'Kg']]) {
    await ouvrirLigne(p, nom); const n = await numeroLigne(p, nom);
    const avant = await champs(p, n);
    await uniteChoisir(p, nom, vers);
    const apres = await champs(p, n);
    const etat = await p.evaluate((n, nom) => {
      const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(nom));
      const q = document.querySelector(`[aria-label="Quantité ligne ${n}"]`);
      return { qDoute: q?.closest('[data-dp-niveau]')?.dataset.dpNiveau ?? null, stock: [...a.querySelectorAll('[data-dp-apres]')].map(e => e.innerText).join(' | '), bande: a.closest('[data-dp-bande]').querySelector('[data-dp-sous-qte]')?.innerText.replace(/\s+/g, ' ') };
    }, n, nom);
    infos.push({ theme, nom, vers, avant, apres, etat });
    if (apres.Quantité !== '') raisons.push(`${theme} ${nom} → ${vers} : la quantité « ${apres.Quantité} » est gardée sous la nouvelle unité (avant : « ${avant.Quantité} »)`);
    if (etat.qDoute !== 'inconnu') raisons.push(`${theme} ${nom} → ${vers} : la quantité vidée n'est pas marquée « à remplir » (niveau ${etat.qDoute})`);
    if (/1,002|1 002|2,234|60,/.test(etat.stock)) raisons.push(`${theme} ${nom} → ${vers} : le stock annonce « ${etat.stock} »`);
    if (/16,002|16,06|120/.test(etat.bande ?? '') ) raisons.push(`${theme} ${nom} → ${vers} : la bande annonce « ${etat.bande} »`);
    if (apres.Montant !== avant.Montant) raisons.push(`${theme} ${nom} → ${vers} : le montant lu ${avant.Montant} est devenu « ${apres.Montant} »`);
    if (nom === 'Weizenmalz') await cap(p, `3-g-${theme}`);
  }
  await p.close();
}
await verdict('GARDEUNITE', infos.slice(0, 2));
