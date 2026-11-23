// Voie c3e (#180) : « Opisna sortna lista za hmelj 2021 » (IHPS Žalec / ministère slovène de l'agriculture), relue depuis le cache avec --offline.
// Le PDF a des tableaux couchés : lecture visuelle (pages tournées), transcrite dans transcriptions-ihps.json (versionné, dans la voie).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ecrire, fiche, lire, lireValeur, racine, releveDe, robots } from './c3c-commun.mjs';

export const TRANSCRIPTIONS = resolve(racine, 'work/missions/2026-10-25-integration-houblons/voies/c3e-pdf-images/transcriptions-ihps.json');
export const SOURCE = { id: 'ihps', nom: 'Inštitut za hmeljarstvo in pivovarstvo Slovenije (IHPS Žalec) et ministère slovène de l’agriculture', hote: 'www.gov.si', type: 'liste variétale officielle (Slovénie)', conditions: 'robots.txt de www.gov.si : Disallow /admin, /resources, /pomoc seulement ; PDF public ; aucune licence lue', lecturePdf: 'tableaux couchés lus en image (pages tournées), valeurs recopiées telles qu’imprimées' };
const BASE_SS = 'Matière sèche (SS, ou à 11 % d’humidité)';

const sansEtoile = s => s.replace(/\s*\*+$/, '').trim();

/** Une ligne du tableau 7.1 → { nom, champs, listes, extra }. `colonnes` = en-tête du fichier. */
export function ligneDeSorte(colonnes, ligne, resistance) {
  const l = Object.fromEntries(colonnes.map((c, i) => [c, ligne[i]]));
  const inconnu = x => x === '/' || x === '';
  const plage = (brut, unite, base, libelle) => { const v = lireValeur(brut); return { champ: libelle, brut, valeur: v.valeur, min: v.min, max: v.max, unite, base, transcrit: 'lecture visuelle', page: l.pageImprimee }; };
  const champs = {};
  if (!inconnu(l.alfa)) champs.alpha = plage(l.alfa, '%', BASE_SS, 'Alfa-kisline (% v SS)');
  if (!inconnu(l.olje)) champs.huileTotale = plage(l.olje, '%', BASE_SS, 'Eterično olje (% v SS)');
  if (!inconnu(l.pridelek)) champs.rendement = plage(l.pridelek, 'kg/ha', null, 'Pridelek (kg/ha)');
  const listes = {
    classification: [l.razvrstitev === 'aroma' ? 'aroma (aromatique)' : 'grenčica (amérisant)'],
    registre: [l.registrska],
    obtenteur: [l.zlahtnitelj === '120' ? '120 : Institut za hmeljarstvo in pivovarstvo Slovenije (Žalec)' : l.zlahtnitelj === '70' ? '70 : Gesellschaft für Hopfenforschung (Hüll, Allemagne)' : l.zlahtnitelj],
    dateInscription: [l.datumVpisa.replace(/\s+/g, ' ')],
    maturite: [l.casZrelosti, ...(inconnu(l.zacetek) ? [] : [`début ${l.zacetek}`]), ...(inconnu(l.trajanje) ? [] : [`durée ${l.trajanje}`])],
    periodeTaille: [l.casRezi.replace(/\s*\*+$/, '')],
  };
  const extra = { page: 'tableau 7.1', pageImprimee: l.pageImprimee, transcrit: 'lecture visuelle', ...(/\*\s*$/.test(l.sorta) ? { horsProduction: true } : {}), ...(/\*\*\*$/.test(l.casRezi) ? { periodeTailleIndicative: true } : {}) };
  if (resistance) extra.resistances = { peronosporaPrimaire: resistance[0], peronosporaSecondaire: resistance[1], pepelovka: resistance[2], verticilijaBlaga: resistance[3], verticilijaLetalna: resistance[4], sivaPlesen: resistance[5], cbcvd: resistance[6], page: 22 };
  return { nom: sansEtoile(l.sorta), champs, listes, extra };
}

/** Fiches de la liste : une par sorte. `recu` rend { releve, sha256 } du PDF en cache. */
export async function fichesIhps(doc, recu) {
  const r = await recu(doc.pdf);
  const fiches = [];
  for (const ligne of doc.lignes) {
    const nom = sansEtoile(ligne[0]);
    const { champs, listes, extra } = ligneDeSorte(doc.colonnes, ligne, doc.resistance[nom] ?? null);
    fiches.push(fiche({ nom, url: doc.pdf, releve: r.releve, publie: doc.publie, champs, listes, extra: { ...extra, sha256Pdf: r.sha256, pageIhps: doc.page_ihps } }));
  }
  return fiches;
}

async function principal() {
  const rb = await robots('https://www.gov.si');
  const doc = JSON.parse(readFileSync(TRANSCRIPTIONS, 'utf8'));
  const recu = async url => {
    if (!rb(new URL(url).pathname)) throw Error(`robots.txt interdit : ${url}`);
    const b = await lire(url, { binaire: true });
    return { releve: releveDe(b), sha256: b.sha256 };
  };
  ecrire(SOURCE, await fichesIhps(doc, recu));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
