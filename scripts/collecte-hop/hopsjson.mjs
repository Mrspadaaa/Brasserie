// Collecte c3d — hops-json (stuartraetaylor/hops-json), d'après la base BrewDB de Samir Boulema. Révision fixée dans scripts/scrape-hop-community.mjs.
// Tous les champs du fichier. Les phrases de prose (Info, Trade) ne sont pas copiés dans src/ : ils restent dans le cache.
// Lit le cache (déjà rempli) ; `--offline` interdit tout téléchargement. Même JSON à chaque lancement.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { lire, norm, liste, json, rattacher, catalogue } from './communautaire-commun.mjs';
import { plage } from './hopdatabase.mjs';

export const REVISION = '655499ffda7166abff83f52f8012390ffc1107f7';
export const URL_DONNEES = `https://raw.githubusercontent.com/stuartraetaylor/hops-json/${REVISION}/hops.json`;
export const URL_LICENCE = `https://raw.githubusercontent.com/stuartraetaylor/hops-json/${REVISION}/LICENSE`;
export const URL_LISEZMOI = `https://raw.githubusercontent.com/stuartraetaylor/hops-json/${REVISION}/README.md`;
const BLOB = `https://github.com/stuartraetaylor/hops-json/blob/${REVISION}/hops.json`;
const nul = v => (v === undefined || v === null || v === '' ? null : v);
/** Une ligne de prose (> 12 mots) ne va pas dans src/. */
const court = (s, max = 12) => { const t = norm(s); return t && t.split(' ').length <= max ? t : null; };

/** Un nom de la base se termine parfois par le pays « (US) » : il devient l'origine, le nom reste tel qu'écrit. */
export function ficheHopsJson(r, { index, releve } = {}) {
  const nom = norm(r.Name ?? r.name);
  const rat = rattacher(nom, [], index);
  const champs = {
    alpha: plage('AlphaMin / AlphaMax', r.AlphaMin, r.AlphaMax),
    beta: plage('BetaMin / BetaMax', r.BetaMin, r.BetaMax),
    cohumulone: plage('CoHumuloneMin / CoHumuloneMax', r.CoHumuloneMin, r.CoHumuloneMax),
    huileTotale: plage('TotalOilMin / TotalOilMax', r.TotalOilMin, r.TotalOilMax),
  };
  const pays = (nom.match(/\(([A-Za-z]{2,3})\)\s*$/) ?? [])[1] ?? null;
  const pedigree = court(r.Pedigree, 30);
  return {
    nom, alias: [], varietyId: rat.varietyId, ...(rat.rattachement ? { rattachement: rat.rattachement } : {}), ...(rat.ambigu ? { rattachementAmbigu: rat.ambigu } : {}), ...(rat.douteux ? { rattachementDouteux: rat.douteux } : {}),
    url: BLOB, releve, publie: null, idSource: nul(r.Id),
    champs,
    listes: {
      descripteurs: nul(r.Aroma) ? liste(r.Aroma) : null,
      styles: nul(r.Styles) ? liste(r.Styles) : null,
      origine: pays ? [pays] : null,
      lignee: pedigree ? [pedigree] : null,
    },
    // Le code d'usage (1, 2, 3) n'est pas expliqué par la source : gardé tel quel, non interprété.
    codeUsage: nul(r.BrewingUsage),
    proseNonCopiee: { info: nul(r.Info) ? norm(r.Info).split(' ').length : 0, trade: nul(r.Trade) ? norm(r.Trade).split(' ').length : 0, pedigree: nul(r.Pedigree) && !pedigree ? norm(r.Pedigree).split(' ').length : 0 },
  };
}

export async function main() {
  const donnees = await lire(URL_DONNEES), licence = await lire(URL_LICENCE), lisezmoi = await lire(URL_LISEZMOI);
  const lignes = JSON.parse(donnees.content);
  if (!Array.isArray(lignes)) throw Error('Format inattendu : hops-json');
  const index = catalogue().index;
  const fiches = lignes.map(r => ficheHopsJson(r, { index, releve: donnees.retrievedAt })).sort((a, b) => a.nom.localeCompare(b.nom) || String(a.idSource).localeCompare(String(b.idSource)));
  return {
    source: { nom: 'hops-json (stuartraetaylor)', hote: 'github.com/stuartraetaylor/hops-json', type: 'base communautaire (export de BrewDB, Samir Boulema)',
      licence: norm(licence.content.split('\n').slice(0, 3).join(' ')), conditions: 'licence du dépôt, notice à conserver', revision: REVISION, reference: BLOB,
      unites: 'Aucune unité écrite dans le fichier : unite et base restent null ; usage courant : α, β, cohumulone en %, huile en mL/100 g',
      releve: donnees.retrievedAt, sha256Donnees: donnees.sha256, sha256Licence: licence.sha256, sha256Lisezmoi: lisezmoi.sha256, entrees: lignes.length },
    fiches,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sortie = await main(), texte = json(sortie);
  const cible = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/data/hopSources/hopsjson.json');
  await mkdir(dirname(cible), { recursive: true }); await writeFile(cible, texte);
  console.log(`hopsjson : ${sortie.fiches.length} fiches ; sha256 ${createHash('sha256').update(texte).digest('hex')}`);
}
