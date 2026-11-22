// B2 n° 13 : quantité « −1 » devenait « 0 » en silence (la ligne « 0 Kg × 0,50 = 0,00 » restait comptée), « abc » devenait vide, prix « 99999999 » était accepté sans borne.
// Attendu, Weizenmalz hell, 390 clair et cave : taper « -1 » dans la quantité : le champ reste lisible (« -1 »), marqué (aria-invalid = true, title qui dit pourquoi), rien n'est retenu (la rangée garde « 2 Kg »)
// et la valeur d'avant (« 2 ») revient en quittant le champ, jamais « 0 » ; « 99999999 » dans le prix : marqué « Au plus … », rien retenu, « 1,55 » revient ; « abc » : marqué « Pas un nombre » ;
// un nombre ordinaire (« 4 ») se retient sans marque.
// Usage : node controle-b2-13-bornes.mjs [<build>] [<dossier captures>]   → BORNES OK | BORNES ECHEC <raisons>
import { demarrer, ouvrirLigne, numeroLigne, rangee, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await ouvrirLigne(p, 'Weizenmalz'); const n = await numeroLigne(p, 'Weizenmalz');
  const lire = champ => p.evaluate((c, n) => { const e = document.querySelector(`[aria-label="${c} ligne ${n}"]`); return { v: e.value, invalide: e.getAttribute('aria-invalid'), titre: e.title }; }, champ, n);
  const taper = async (champ, texte) => { const h = await p.$(`[aria-label="${champ} ligne ${n}"]`); await h.click({ clickCount: 3 }); await h.type(texte, { delay: 20 }); await dormir(250); };
  const sortie = async () => { await p.keyboard.press('Tab'); await dormir(350); };
  const cas = [['Quantité', '-1', '2', 'Pas de valeur négative'], ['Prix', '99999999', '1,55', 'Au plus'], ['Quantité', 'abc', '2', 'Pas un nombre'], ['Montant', '-5', '3,10', 'Pas de valeur négative']];
  for (const [champ, texte, retour, motif] of cas) {
    const avant = await rangee(p, 'Weizenmalz');
    await taper(champ, texte);
    const pendant = await lire(champ), r = await rangee(p, 'Weizenmalz');
    const ou = `${theme} ${champ} « ${texte} »`;
    if (pendant.v !== texte) raisons.push(`${ou} : le champ ne garde pas ce qui est tapé (« ${pendant.v} »)`);
    if (pendant.invalide !== 'true') raisons.push(`${ou} : pas de aria-invalid (${pendant.invalide})`);
    if (!pendant.titre.includes(motif)) raisons.push(`${ou} : title « ${pendant.titre} » au lieu de « ${motif}… »`);
    // Un plafond se franchit au dernier chiffre : les chiffres d'avant (« 99999 ») ont pu être retenus en route, la rangée les montre ; ils sont rendus à la sortie du champ.
    if (r !== avant && texte !== '99999999') raisons.push(`${ou} : la rangée a changé pendant le refus : « ${r} » au lieu de « ${avant} »`);
    if (texte === '-1') await cap(p, `13-negatif-${theme}`);
    await sortie();
    const apres = await lire(champ), r2 = await rangee(p, 'Weizenmalz');
    if (apres.v !== retour) raisons.push(`${ou} : après avoir quitté le champ : « ${apres.v} » au lieu de « ${retour} »`);
    if (apres.invalide) raisons.push(`${ou} : reste marqué invalide après avoir quitté le champ`);
    if (r2 !== avant) raisons.push(`${ou} : la rangée après sortie : « ${r2} » au lieu de « ${avant} »`);
    infos.push({ ou, pendant: pendant.v, apres: apres.v });
  }
  await taper('Quantité', '4'); const ok = await lire('Quantité'); await sortie();
  if (ok.invalide || (await lire('Quantité')).v !== '4') raisons.push(`${theme} : « 4 » n'est pas retenu proprement (${JSON.stringify(ok)})`);
  await p.close();
}
await verdict('BORNES', infos.slice(0, 4));
