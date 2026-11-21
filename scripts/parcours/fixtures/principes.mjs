// Fixture des étapes PRINCIPES neuves (W0a, 21.11) — « ZZ TEST », données simulées, jamais seedData.ts. Elle part de celle des chaînes
// (stock, recettes, clients, tarifs, plans) et :
//   • retire le brassin du jour (B-ZZ-JOUR et sa recette) : sa levure liée au stock sans nom fait tomber le Calendrier du tag
//     en-ligne/2026-11-21-tour7 (« Impossible de charger cet écran », WF2-1, corrigé depuis) ; ces étapes doivent échouer pour LEUR
//     défaut, pas parce que l'écran ne s'ouvre pas ;
//   • ajoute une activité du Calendrier (« ZZ TEST Ranger la cave », cette semaine) : l'événement qu'on renomme en touchant son titre ;
//   • ajoute deux recettes numérotées (« ZZ TEST IPA n° 1 », « ZZ TEST IPA n° 2 ») : un nom posé « IPA n° k » doit suivre le plus grand.
// Les carnets (Évier, Ventilation, Frigo…) viennent du banc `?dev-local`, comme pour le parcours Carnet.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { fixtureChaines, ajouter } = await import(pathToFileURL(path.join(ICI, 'chaines.mjs')).href);

export const NOM_EVENEMENT = 'ZZ TEST Ranger la cave';

export function fixturePrincipes(aujourdhui) {
  const retirer = new Set(['B-ZZ-JOUR', 'R-ZZ-SAISON']);
  const entrees = fixtureChaines(aujourdhui).entrees.filter((e) => !retirer.has(e.id));
  const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });
  add('creativeItems', 'CR-ZZ-CAVE', { type: 'event', title: NOM_EVENEMENT, status: 'todo', activite: true, date: ajouter(aujourdhui, 2) });
  for (const k of [1, 2]) add('recipes', `R-ZZ-IPA-${k}`, { name: `ZZ TEST IPA n° ${k}`, style: 'IPA', volumeL: 100, ingredients: [] });
  return { entrees };
}
