// Collecte c3d — Brewer's Friend, index des houblons (www.brewersfriend.com/hops/) : une ligne par houblon et par forme,
// avec l'alpha moyen des recettes d'utilisateurs, l'emploi (Boil, Dry Hop…) et le nombre de recettes. Ce sont des statistiques d'usage
// de recettes, pas des analyses : à ne jamais lire comme la plage d'un fournisseur.
// Les pages de détail (une par houblon) ne sont pas lues : serveur lent (13 s par page) et contenu = statistiques de recettes par style.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { lecteurPoli, lireValeur, norm, json, rattacher, catalogue } from './communautaire-commun.mjs';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { load } = require('cheerio');

export const HOTE = 'www.brewersfriend.com';
export const INDEX = `https://${HOTE}/hops/`;

/** Les lignes du tableau de l'index : { nom, chemin, forme, alphaMoyen, emploi, recettes }. */
export function lireIndexBrewersFriend(html) {
  const $ = load(html);
  const lignes = [];
  $('tr').each((_, tr) => {
    const td = $(tr).find('td').toArray();
    if (td.length < 5) return;
    const a = $(td[0]).find('a').first(), nom = norm(a.text());
    if (!nom) return;
    lignes.push({ nom, chemin: a.attr('href') ?? null, forme: norm($(td[1]).text()) || null, alpha: norm($(td[2]).text()), emploi: norm($(td[3]).text()) || null, recettes: norm($(td[4]).text()).replace(/,/g, '') });
  });
  return lignes;
}

export async function main() {
  const journal = [], lecteur = lecteurPoli(HOTE, { journal });
  const page = await lecteur.page(INDEX);
  if (page.arrete || page.absent) throw Error(`Index Brewer's Friend inaccessible : ${page.arrete ?? page.statut}`);
  const { index } = catalogue();
  const parNom = new Map();
  for (const l of lireIndexBrewersFriend(page.content)) {
    if (!parNom.has(l.nom)) parNom.set(l.nom, []);
    parNom.get(l.nom).push(l);
  }
  const fiches = [...parNom].map(([nom, lignes]) => {
    const rat = rattacher(nom, [], index);
    const premier = lignes[0];
    return {
      nom, alias: [], varietyId: rat.varietyId, ...(rat.rattachement ? { rattachement: rat.rattachement } : {}), ...(rat.ambigu ? { rattachementAmbigu: rat.ambigu } : {}), ...(rat.douteux ? { rattachementDouteux: rat.douteux } : {}),
      url: new URL(premier.chemin ?? '', INDEX).href, releve: page.retrievedAt, publie: null, champs: {},
      formes: lignes.map(l => {
        const a = lireValeur(l.alpha, { unite: '%' });
        return { forme: l.forme, emploi: l.emploi, recettes: /^\d+$/.test(l.recettes) ? Number(l.recettes) : null,
          alphaMoyenRecettes: { etiquette: 'Average AA', brut: l.alpha || null, valeur: a.valeur, min: null, max: null, unite: '%', base: 'moyenne des recettes d’utilisateurs' } };
      }).sort((x, y) => String(x.forme).localeCompare(String(y.forme)) || String(x.emploi).localeCompare(String(y.emploi))),
      listes: { formes: [...new Set(lignes.map(l => l.forme).filter(Boolean))].sort(), emplois: [...new Set(lignes.map(l => l.emploi).filter(Boolean))].sort() },
    };
  }).sort((a, b) => a.nom.localeCompare(b.nom));
  return {
    source: { nom: 'Brewer’s Friend (index des houblons)', hote: HOTE, type: 'logiciel de brassage ; statistiques de recettes d’utilisateurs',
      conditions: 'Contenu © Brewer’s Friend ; seules des valeurs et des noms sont gardés. robots.txt : pages /hops/ non interdites', releve: page.retrievedAt, sha256Index: page.sha256,
      lignesIndex: [...parNom.values()].reduce((n, l) => n + l.length, 0), pagesDetailLues: 0 },
    fiches,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sortie = await main(), texte = json(sortie);
  const cible = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/data/hopSources/brewersfriend.json');
  await mkdir(dirname(cible), { recursive: true }); await writeFile(cible, texte);
  console.log(`brewersfriend : ${sortie.fiches.length} houblons, ${sortie.source.lignesIndex} lignes ; sha256 ${createHash('sha256').update(texte).digest('hex')}`);
}
