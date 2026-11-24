/**
 * D451 : l'arbre domaine › sous-domaine (le « chemin matérialisé » de PLAN § État de l'art : `domaine` existant + `categorie.chemin` de 1 à 2
 * niveaux, l'arbre est un regroupement fait à la lecture), le coup d'œil, et la catégorie posée avec son vocabulaire contrôlé.
 *
 * Vocabulaire qui grandit : un chemin proposé est comparé, plié (sans accent, minuscule), à ceux déjà employés ; le plus proche est repris.
 * Distance d'édition de Levenshtein (Wagner–Fischer, la définition standard : une dizaine de lignes, aucune dépendance ; `fuse.js` classe des
 * résultats, il ne fixe pas un seuil de fautes). Seuil : 2 au plus, et au plus le quart de la longueur du mot (« vis » ne devient pas « via »).
 */
import { DOMAINES, domaineDe, plier, type DomaineCarnet, type ParMots } from './domaines';
import { lireCarnet, type CarnetDoc, type OrigineVousIA } from './modele';
import { Brouillon, refus, type Etat, type Resultat } from './operations';
import { etatDe, genreDe, jourLocal, suiviDe } from './suivi';

export const NIVEAU_MAX = 30;

const plie = (t: string): string => plier(t).replace(/\s+/g, ' ').trim();

/** Distance d'édition (insertion, suppression, substitution à 1) entre deux textes. */
export function distanceEdition(a: string, b: string): number {
  let ligne = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const suivante = [i];
    for (let j = 1; j <= b.length; j += 1) suivante[j] = Math.min(ligne[j] + 1, suivante[j - 1] + 1, ligne[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    ligne = suivante;
  }
  return ligne[b.length];
}

/** Les mots déjà employés, du plus fréquent au moins fréquent (puis par ordre alphabétique : stable). */
function parFrequence(mots: readonly string[]): string[] {
  const n = new Map<string, number>();
  for (const m of mots) n.set(m, (n.get(m) ?? 0) + 1);
  return [...n.keys()].sort((x, y) => n.get(y)! - n.get(x)! || x.localeCompare(y, 'fr'));
}

/** Un mot rapproché des candidats : égalité pliée d'abord, sinon le plus proche à 2 fautes près (et au plus le quart du mot) ; sinon tel quel. */
function rapprocherMot(mot: string, candidats: readonly string[]): string {
  const p = plie(mot);
  const egal = candidats.find(c => plie(c) === p);
  if (egal) return egal;
  const seuil = Math.min(2, Math.floor(p.length / 4));
  if (seuil < 1) return mot;
  let meilleur: string | undefined, d = seuil + 1;
  for (const c of candidats) {
    const dc = distanceEdition(p, plie(c));
    if (dc < d) { d = dc; meilleur = c; }
  }
  return meilleur ?? mot;
}

/** Les chemins déjà employés par les carnets (leur catégorie posée). */
export const cheminsEmployes = (carnets: readonly CarnetDoc[]): string[][] => carnets.flatMap(c => (c.carnet.categorie ? [c.carnet.categorie.chemin] : []));

/** Un chemin proposé, rapproché du vocabulaire : le niveau 1 contre les premiers niveaux employés, le niveau 2 contre ceux du même parent. */
export function rapprocherChemin(chemin: readonly string[], vocabulaire: readonly (readonly string[])[]): string[] {
  if (!chemin.length) return [];
  const premier = rapprocherMot(chemin[0], parFrequence(vocabulaire.map(v => v[0]).filter(Boolean)));
  if (chemin.length < 2) return [premier];
  const memeParent = vocabulaire.filter(v => v[0] && plie(v[0]) === plie(premier) && v[1]).map(v => v[1]);
  return [premier, rapprocherMot(chemin[1], parFrequence(memeParent))];
}

const majuscule = (t: string): string => `${t.charAt(0).toLocaleUpperCase('fr-CH')}${t.slice(1)}`;

/**
 * Pose la catégorie (1 à 2 niveaux, 30 caractères au plus chacun), rapprochée du vocabulaire des autres carnets. Celle qu'il a posée ne se laisse
 * pas écraser par l'IA. Même chemin : sans effet.
 */
export function poserCategorie(etat: Etat, args: { carnetId: string; chemin: readonly string[]; origine: OrigineVousIA }): Resultat {
  const brut = args.chemin.map(s => s.trim()).filter(Boolean);
  if (!brut.length || brut.length > 2) return refus('Une catégorie a un ou deux niveaux.');
  if (brut.some(s => s.length > NIVEAU_MAX)) return refus(`Un niveau tient en ${NIVEAU_MAX} caractères au plus.`);
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const pose = c.carnet.categorie;
  if (pose?.origine === 'vous' && args.origine === 'ia') return refus('Catégorie posée par vous : l’IA n’y touche pas.');
  const autres = etat.map(d => lireCarnet(d)).filter((x): x is CarnetDoc => !!x && x.id !== c.id);
  const chemin = rapprocherChemin(brut.map(majuscule), cheminsEmployes(autres)).map(s => s.slice(0, NIVEAU_MAX));
  if (pose && pose.origine === args.origine && pose.chemin.join('\u0000') === chemin.join('\u0000')) return b.resultat('Catégorie inchangée');
  c.carnet.categorie = { chemin, origine: args.origine };
  b.ecrire(c);
  return b.resultat(`✓ Rangé : ${chemin.join(' › ')}`);
}

/* ---------- projections ---------- */

const plusRecentD = (a: CarnetDoc, b: CarnetDoc): number => b.carnet.creeLe.localeCompare(a.carnet.creeLe) || a.id.localeCompare(b.id);

export interface GroupeArbre { chemin: string | null; carnets: CarnetDoc[] }
export interface NoeudDomaine { domaine: DomaineCarnet; /** les problèmes ouverts, à plat */ ouverts: CarnetDoc[]; /** les autres genres, repliés par sous-domaine (`null` : sans sous-domaine) */ groupes: GroupeArbre[]; n: number }
export interface ResolusAnnee { annee: number | null; carnets: CarnetDoc[] }
export interface ArbreCarnets { domaines: NoeudDomaine[]; aRanger: CarnetDoc[]; resolus: ResolusAnnee[] }

/**
 * L'arbre de la liste : domaine › sous-domaine (`categorie.chemin[0]`). Les problèmes ouverts à plat sous leur domaine ; les autres genres repliés
 * par sous-domaine ; « À ranger » : aucun domaine (posé, du Planning ou lu dans ses mots) ; « Résolus <année> » à part, l'année la plus récente
 * d'abord. Ordre stable : domaines dans l'ordre de `DOMAINES`, carnets du plus récent au plus ancien (id en départage), sous-domaines
 * alphabétiques (« sans » en dernier). Passer aussi les archivés (`lireCarnets(items, { archives: true })`) pour que les résolus s'y trouvent.
 */
export function arbreDe(carnets: readonly CarnetDoc[], parMots?: ParMots): ArbreCarnets {
  const ouverts = new Map<DomaineCarnet, CarnetDoc[]>();
  const groupes = new Map<DomaineCarnet, Map<string | null, CarnetDoc[]>>();
  const aRanger: CarnetDoc[] = [];
  const resolus = new Map<number | null, CarnetDoc[]>();
  for (const c of [...carnets].sort(plusRecentD)) {
    if (etatDe(c) === 'resolu') {
      const an = Number(jourLocal(suiviDe(c).resolu?.le ?? '').slice(0, 4));
      const cle = Number.isFinite(an) && an > 0 ? an : null;
      resolus.set(cle, [...(resolus.get(cle) ?? []), c]);
      continue;
    }
    const d = domaineDe(c, parMots);
    if (!d) { aRanger.push(c); continue; }
    if (genreDe(c) === 'probleme') { ouverts.set(d, [...(ouverts.get(d) ?? []), c]); continue; }
    const g = groupes.get(d) ?? new Map<string | null, CarnetDoc[]>();
    const chemin = c.carnet.categorie?.chemin[0] ?? null;
    g.set(chemin, [...(g.get(chemin) ?? []), c]);
    groupes.set(d, g);
  }
  const noeuds: NoeudDomaine[] = DOMAINES.flatMap(domaine => {
    const o = ouverts.get(domaine) ?? [];
    const g = [...(groupes.get(domaine) ?? new Map<string | null, CarnetDoc[]>()).entries()]
      .map(([chemin, liste]) => ({ chemin, carnets: liste }))
      .sort((x, y) => (x.chemin === null ? 1 : 0) - (y.chemin === null ? 1 : 0) || plie(x.chemin ?? '').localeCompare(plie(y.chemin ?? ''), 'fr'));
    const n = o.length + g.reduce((s, x) => s + x.carnets.length, 0);
    return n ? [{ domaine, ouverts: o, groupes: g, n }] : [];
  });
  const parDate = (a: CarnetDoc, b: CarnetDoc) => (suiviDe(b).resolu?.le ?? '').localeCompare(suiviDe(a).resolu?.le ?? '') || a.id.localeCompare(b.id);
  const annees = [...resolus.entries()].sort(([x], [y]) => (y ?? -1) - (x ?? -1)).map(([annee, liste]) => ({ annee, carnets: [...liste].sort(parDate) }));
  return { domaines: noeuds, aRanger, resolus: annees };
}

export interface CoupDOeil { annee: number; cherche: number; decides: number; notes: number; resolus: number }

/** Le coup d'œil : je cherche, décidés, notés (genre problème seulement : une idée du Planning n'est pas un constat), résolus dans l'année. */
export function coupDOeil(carnets: readonly CarnetDoc[], annee: number): CoupDOeil {
  const r: CoupDOeil = { annee, cherche: 0, decides: 0, notes: 0, resolus: 0 };
  for (const c of carnets) {
    const e = etatDe(c);
    if (e === 'cherche') r.cherche += 1;
    else if (e === 'decide') r.decides += 1;
    else if (e === 'note' && genreDe(c) === 'probleme') r.notes += 1;
    else if (e === 'resolu' && jourLocal(suiviDe(c).resolu?.le ?? '').slice(0, 4) === String(annee)) r.resolus += 1;
  }
  return r;
}
