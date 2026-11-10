import type { AppConfig, Batch } from '../../../types';
import { BAREME_IMPOT_BIERE, beerTaxBracket } from '../../../domain/finance/swissBeerTax';
import { isoDate } from '../../../domain/finance/ledger';
import { anneeDuBrassin, baseImpot } from '../ImpotBiereSheet';

/**
 * Impôt bière de l'année (i1a) : le total découpé par bande, chaque brassin sur sa bande.
 * Aucune règle ici : chaque ligne vient de `baseImpot` (la chaîne de la feuille p2b : litres, densité, réduction → `beerTaxForVolume`).
 * Ce module ne fait que ranger et sommer, au centime. L'inconnu reste `null` : jamais 0, jamais un taux par défaut.
 */

export type DonneesImpot = { plans: Parameters<typeof baseImpot>[1]['plans']; fiscal: AppConfig['fiscal'] };
/** note : densité saisie · visee : °P de la visée de la recette (estimé) · inconnue : fourchette ou rien · exonere : sans alcool. */
export type EtatLigne = 'note' | 'visee' | 'inconnue' | 'exonere';
/** 0 légère · 1 normale · 2 forte, dans l'ordre de `BAREME_IMPOT_BIERE`. */
export type Bande = 0 | 1 | 2;

export interface LigneImpot {
  id: string;
  nom: string;
  /** ISO, pour l'ordre ; '' si le brassin n'a pas de date. */
  date: string;
  /** Litres sur lesquels l'impôt est dû ; null = à noter. */
  litres: number | null;
  etat: EtatLigne;
  plato: number | null;
  /** La bande du °P (noté ou visé) ; null quand le °P est inconnu ou le brassin exonéré. */
  bande: Bande | null;
  /** CHF au centime, réduction comprise ; null quand il manque les litres ou le °P. */
  montant: number | null;
  /** Fourchette quand seul le °P manque (litres connus). */
  min: number | null;
  max: number | null;
  /** Pourquoi la densité manque : saisie hors plage ou absente. */
  densite: 'notee' | 'a-verifier' | 'inconnue';
}

const chf = (n: number | null): number | null => n === null ? null : Math.round(n * 100) / 100;
const bandeDuPlato = (plato: number): Bande => BAREME_IMPOT_BIERE.findIndex(t => t.chfParHl === beerTaxBracket(plato)) as Bande;

/** Les brassins de l'année qui doivent l'impôt : ni planifiés (rien n'est sorti), ni annulés ; dans l'ordre des dates. */
export function lignesImpot(batches: readonly Batch[], donnees: DonneesImpot, annee: number): LigneImpot[] {
  return batches
    .filter(batch => batch.status !== 'planifie' && batch.status !== 'annule' && anneeDuBrassin(batch) === annee)
    .map((batch): LigneImpot => {
      const b = baseImpot(batch, donnees);
      const litres = b.litres?.litres ?? null;
      const base = { id: batch.id, nom: batch.name, date: isoDate(batch.bottlingDate || batch.brewDate || batch.plannedBrewDate) ?? '', litres, densite: b.densite };
      if (b.lu.exonere) return { ...base, etat: 'exonere', plato: b.lu.plato, bande: null, montant: 0, min: 0, max: 0 };
      const plato = b.densite === 'notee' ? b.lu.plato : b.visee;
      if (plato != null) {
        return { ...base, etat: b.densite === 'notee' ? 'note' : 'visee', plato, bande: bandeDuPlato(plato),
          montant: litres ? chf(b.calcul(plato, litres).montant) : null, min: null, max: null };
      }
      const fourchette = litres ? b.calcul(null, litres) : null;
      return { ...base, etat: 'inconnue', plato: null, bande: null, montant: null, min: chf(fourchette?.montantMin ?? null), max: chf(fourchette?.montantMax ?? null) };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.nom.localeCompare(b.nom, 'fr'));
}

export interface TotalAnnee {
  nb: number;
  /** Somme des litres connus. */
  litres: number;
  /** Bas et haut du total, CHF au centime ; null quand aucune ligne n'a de nombre. Égaux sans densité inconnue. */
  bas: number | null;
  haut: number | null;
  /** Brassins sans litres : le total est un minimum. */
  sansLitres: number;
  /** Lignes sur la visée de la recette : le total est estimé. */
  visees: number;
  bandes: Array<{ litres: number; chf: number }>;
  /** Densité manquante, litres connus : leurs litres et leur fourchette ; null s'il n'y en a pas. */
  inconnu: { litres: number; bas: number; haut: number } | null;
  exonere: { litres: number } | null;
}

export function totalAnnee(lignes: readonly LigneImpot[]): TotalAnnee {
  let bas = 0, haut = 0, nombres = 0, litres = 0, sansLitres = 0, visees = 0;
  const bandes = BAREME_IMPOT_BIERE.map(() => ({ litres: 0, cents: 0 }));
  let inconnu: { litres: number; bas: number; haut: number } | null = null;
  let exonere: { litres: number } | null = null;
  const cents = (n: number) => Math.round(n * 100);
  for (const l of lignes) {
    if (l.litres === null) sansLitres++; else litres += l.litres;
    if (l.etat === 'visee') visees++;
    if (l.etat === 'exonere') { exonere = { litres: (exonere?.litres ?? 0) + (l.litres ?? 0) }; nombres++; continue; }
    if (l.etat === 'inconnue') {
      if (l.min !== null && l.max !== null && l.litres !== null) {
        bas += cents(l.min); haut += cents(l.max); nombres++;
        inconnu = { litres: (inconnu?.litres ?? 0) + l.litres, bas: ((inconnu ? cents(inconnu.bas) : 0) + cents(l.min)) / 100, haut: ((inconnu ? cents(inconnu.haut) : 0) + cents(l.max)) / 100 };
      }
      continue;
    }
    if (l.montant !== null && l.bande !== null && l.litres !== null) {
      bas += cents(l.montant); haut += cents(l.montant); nombres++;
      bandes[l.bande].litres += l.litres; bandes[l.bande].cents += cents(l.montant);
    }
  }
  return {
    nb: lignes.length, litres, bas: nombres ? bas / 100 : null, haut: nombres ? haut / 100 : null, sansLitres, visees,
    bandes: bandes.map(b => ({ litres: b.litres, chf: b.cents / 100 })), inconnu, exonere
  };
}

const ajouterJours = (annee: number, jours: number): string => new Date(Date.UTC(annee, 11, 31) + jours * 86_400_000).toISOString().slice(0, 10);

/**
 * Déclarer sous 20 jours, payer sous 30 jours après la fin de la période (directive OFDF d'avril 2022, lue par d1).
 * Régime annuel ou non réglé : le 20 et le 30 janvier de l'année suivante. Trimestriel : une date par trimestre, pas de date unique (null).
 */
export function echeances(annee: number, periode: 'annual' | 'quarterly' | undefined): { declarer: string; payer: string } | null {
  if (periode === 'quarterly') return null;
  return { declarer: ajouterJours(annee, 20), payer: ajouterJours(annee, 30) };
}
