// B2 n° 9 (D378, ses mots : « on peut toujours pas fermé les famille ») : une bande d'une seule ligne (« Services 1 », « Levures 1 », « Sucres 1 », « Nettoyage 1 »)
// n'avait ni chevron, ni pli : « Plié » la laissait ouverte, et son point de couleur n'était pas aligné sur celui des autres bandes.
// Attendu, 390 (clair et cave) et 1280 : (a) chaque en-tête de bande a son chevron, ou ses lignes de sous-famille ; (b) après « Plié », aucune rangée visible, sauf la rangée seule
// d'un sous-groupe d'une ligne sous une bande à sous-familles (D307) ; (c) le toucher sur le chevron d'une bande d'une ligne plie et déplie ; (d) les points de couleur
// de toutes les bandes à chevron sont alignés (même x).
// Usage : node controle-b2-9-plie.mjs [<build>] [<dossier captures>]   → PLIE OK | PLIE ECHEC <raisons>
import { demarrer, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const lire = p => p.evaluate(() => {
  const bandes = [...document.querySelectorAll('[data-dp-bande]:not([hidden])')].filter(b => b.dataset.dpBande !== 'papier').map(b => {
    const e = b.querySelector('[data-dp-bande-entete]');
    const lignes = [...b.querySelectorAll('[data-dp-ligne]')];
    return { cle: b.dataset.dpBande, nom: e.querySelector('strong')?.innerText, pli: !!e.querySelector('[data-dp-bande-pli]'), sg: b.querySelectorAll('[data-dp-sg-ligne]').length, n: lignes.length, visibles: lignes.filter(a => a.offsetParent !== null).length, pointX: Math.round(e.querySelector('i[aria-hidden]').getBoundingClientRect().left) };
  });
  return bandes;
});
for (const [etat, mode, theme] of [['3', 't390', 'clair'], ['3', 't390', 'cave'], ['commande', 't390', 'clair'], ['renovation', 't390', 'clair'], ['3', 'pc1280', 'clair'], ['commande', 'pc1280', 'cave']]) {
  const p = await ouvrir(etat, mode, theme);
  // « Déplié » d'abord : l'arrivée de certains états est repliée (n° 10, à lui montrer), ce n'est pas l'objet ici.
  await p.evaluate(() => document.querySelector('[data-dp-plier-bouton="deplie"]')?.click()); await dormir(400);
  const ou = `${etat} ${mode} ${theme}`;
  const ouvert = await lire(p);
  for (const b of ouvert) if (!b.pli && !b.sg && b.n >= 1) raisons.push(`${ou} : la bande « ${b.nom} » (${b.n} ligne) n'a ni chevron ni sous-famille`);
  const xs = [...new Set(ouvert.map(b => b.pointX))]; if (xs.length > 1) raisons.push(`${ou} : points de couleur non alignés (x = ${xs.join(', ')})`);
  await p.evaluate(() => document.querySelector('[data-dp-plier-bouton="plie"]')?.click()); await dormir(500);
  const plie = await lire(p);
  for (const b of plie) if (b.visibles > 0 && !(b.sg > 0 && b.visibles <= b.sg + 3 && b.pli === false)) raisons.push(`${ou} : après « Plié », la bande « ${b.nom} » garde ${b.visibles} rangée(s) visible(s)`);
  await cap(p, `9-plie-${etat}-${mode}-${theme}`);
  // (c) le chevron d'une bande d'une ligne plie et déplie
  const unique = plie.find(b => b.pli && b.n === 1);
  if (unique) {
    const bascule = () => p.evaluate(cle => { document.querySelector(`[data-dp-bande="${cle}"] [data-dp-bande-pli]`).click(); }, unique.cle);
    await bascule(); await dormir(300); const rouvert = (await lire(p)).find(b => b.cle === unique.cle).visibles;
    await bascule(); await dormir(300); const referme = (await lire(p)).find(b => b.cle === unique.cle).visibles;
    if (rouvert !== 1 || referme !== 0) raisons.push(`${ou} : chevron de « ${unique.nom} » : ${rouvert} rangée(s) après déplier, ${referme} après replier (attendu 1 puis 0)`);
    await p.evaluate(() => document.querySelector('[data-dp-plier-bouton="deplie"]')?.click()); await dormir(400);
    await cap(p, `9-deplie-${etat}-${mode}-${theme}`);
  }
  infos.push({ ou, ouvert: ouvert.map(b => `${b.nom}:${b.n}${b.pli ? ' chev' : ''}${b.sg ? ' sg' + b.sg : ''}`), plie: plie.map(b => `${b.nom}:${b.visibles}`) });
  await p.close();
}
await verdict('PLIE', infos);
