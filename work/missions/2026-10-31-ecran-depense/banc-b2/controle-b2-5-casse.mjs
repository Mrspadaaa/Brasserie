// B2 n° 5 : un toucher sur la case « Kg » déjà active passait l'unité en « kg » : rangée « 2 kg × », carte FACTURE « 2 kg », alors que l'écran écrit « Kg ».
// Attendu : à 390, clair et cave, Weizenmalz hell : (a) un toucher sur « Kg » actif ne change rien (rangée identique) ; (b) Kg → g → Kg : aucun « kg » en minuscule
// dans le texte rendu de la ligne (rangée, plateau, face à face) ; (c) une ligne en g (Galaxy) passée en Kg s'écrit « Kg » partout, y compris dans la pastille de conversion.
// Usage : node controle-b2-5-casse.mjs [<build>] [<dossier captures>]   → CASSE OK | CASSE ECHEC <raisons>
import { demarrer, ouvrirLigne, uniteChoisir, rangee, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const texteLigne = (p, nom) => p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); return a?.innerText.replace(/\s+/g, ' ') ?? ''; }, nom);
const minuscule = t => t.match(/.{0,24}\bkg\b.{0,8}/g) ?? [];
const infos = [];
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await ouvrirLigne(p, 'Weizenmalz');
  const avant = await rangee(p, 'Weizenmalz');
  await uniteChoisir(p, 'Weizenmalz', 'Kg'); // (a) déjà actif
  const apresA = await rangee(p, 'Weizenmalz');
  if (apresA !== avant) raisons.push(`${theme} (a) : toucher sur « Kg » actif : « ${apresA} » au lieu de « ${avant} »`);
  let t = minuscule(await texteLigne(p, 'Weizenmalz')); if (t.length) raisons.push(`${theme} (a) : « kg » minuscule après un toucher sur « Kg » actif : ${t.join(' | ')}`);
  await uniteChoisir(p, 'Weizenmalz', 'g'); await uniteChoisir(p, 'Weizenmalz', 'Kg'); // (b)
  t = minuscule(await texteLigne(p, 'Weizenmalz')); if (t.length) raisons.push(`${theme} (b) : « kg » minuscule après Kg → g → Kg : ${t.join(' | ')}`);
  await cap(p, `5-weizen-${theme}`);
  await uniteChoisir(p, 'Weizenmalz', 'g'); // (b') en g : la pastille de conversion dit « Kg » elle aussi
  t = minuscule(await texteLigne(p, 'Weizenmalz')); if (t.length) raisons.push(`${theme} (b') : « kg » minuscule en g : ${t.join(' | ')}`);
  await ouvrirLigne(p, 'Galaxy'); await uniteChoisir(p, 'Galaxy', 'Kg'); await dormir(200); // (c)
  t = minuscule(await texteLigne(p, 'Galaxy')); if (t.length) raisons.push(`${theme} (c) : « kg » minuscule sur Galaxy passée en Kg : ${t.join(' | ')}`);
  infos.push({ theme, avant, apresA });
  await p.close();
}
await verdict('CASSE', infos[0]);
