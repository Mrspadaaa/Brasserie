// B2 n° 18 : « + Ajouter une ligne » : la ligne neuve portait quatre puces rouges « libellé / quantité / prix / montant à remplir » qui répétaient les quatre champs déjà en rouge tireté, plus le cadre
// « unité à remplir » : neuf marques rouges pour une ligne vide (DEFAUTS : trop de texte).
// Attendu, état 3, 390 clair et cave, ligne neuve ouverte : UNE marque rouge par champ manquant (libellé, quantité, prix, montant : leur propre champ ; l'unité : son cadre), soit 5 au plus, aucune
// puce `data-dp-a-remplir` en double, et chaque champ rouge porte son nom (placeholder) ; une fois la quantité tapée, sa marque disparaît seule.
// Usage : node controle-b2-18-marques.mjs [<build>] [<dossier captures>]   → MARQUES OK | MARQUES ECHEC <raisons>
import { demarrer, saisir, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const marques = p => p.evaluate(() => {
  const a = document.querySelector('[data-dp-neuve], article[data-dp-ligne]:has([aria-label^="Libellé ligne"])') ?? [...document.querySelectorAll('[data-dp-ligne]')].find(x => x.querySelector('[aria-label^="Libellé ligne"]'));
  // Le plateau (corps de la ligne ouverte) : c'est là que les marques se répétaient ; la rangée repliée garde ses propres marques (sa vue du même champ).
  const corps = a.querySelector('[data-dp-corps]');
  const rouges = [...corps.querySelectorAll('[data-dp-niveau="inconnu"]')].filter(e => !e.parentElement.closest('[data-dp-niveau="inconnu"]'));
  return { n: rouges.length, noms: rouges.map(e => (e.querySelector('[aria-label]')?.getAttribute('aria-label') ?? e.getAttribute('aria-label') ?? e.tagName).replace(/ligne \d+/, '').trim()), puces: a.querySelectorAll('[data-dp-a-remplir]').length, aRemplir: (corps.innerText.match(/à remplir/g) ?? []).length,
    placeholders: ['Quantité', 'Prix', 'Montant'].map(c => a.querySelector(`[aria-label^="${c} ligne"]`)?.placeholder ?? '∅'), id: a.dataset.dpLigne };
});
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Ajouter une ligne/.test(b.innerText))?.click()); await dormir(600);
  const m = await marques(p); infos.push({ theme, ...m });
  // 6 = libellé, quantité, prix, montant + l'unité (sa boîte tiretée ET ses cinq cases : une seule chose dans la maquette pu4d).
  if (m.n > 6) raisons.push(`${theme} : ${m.n} marques rouges sur la ligne vide (${m.noms.join(', ')}) : plus d'une par champ manquant`);
  if (m.puces > 0) raisons.push(`${theme} : ${m.puces} puce(s) « à remplir » en double des champs`);
  if (m.aRemplir > 1) raisons.push(`${theme} : « à remplir » écrit ${m.aRemplir} fois dans la ligne (une seule, celle de l'unité)`);
  if (m.placeholders.some(x => x === '∅' || x === '')) raisons.push(`${theme} : un champ rouge sans son nom (${m.placeholders.join(' / ')})`);
  await p.evaluate(id => document.querySelector(`[data-dp-ligne="${id}"]`).scrollIntoView({ block: 'center' }), m.id); await dormir(300);
  await cap(p, `18-ligne-vide-${theme}`);
  const q = `[aria-label="Quantité ligne ${m.id ? await p.evaluate(id => document.querySelector(`[data-dp-ligne="${id}"] [aria-label^="Quantité ligne"]`).getAttribute('aria-label').replace(/\D+/g, ''), m.id) : ''}"]`;
  await saisir(p, q, '2');
  const m2 = await marques(p);
  if (m2.n >= m.n) raisons.push(`${theme} : la quantité tapée n'a pas retiré sa marque (${m.n} → ${m2.n})`);
  await p.close();
}
await verdict('MARQUES', infos);
