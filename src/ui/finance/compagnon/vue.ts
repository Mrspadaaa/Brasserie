import type { PeriodeSynthese, Reste } from '../../../domain/finance/periodeSynthese';

/** Ce que la feuille m4ia-c montre, en fonctions pures (aucun calcul de montant : tout vient de `periodeSynthese`). */

/** La pile visée : le plus gros poste de charge de la période (même règle que `questionPoste`, Opérations). Aucun poste : null. */
export function posteVise(periode: PeriodeSynthese): string | null {
  const plus = [...periode.postes].filter(p => p.cents > 0).sort((a, b) => b.cents - a.cents)[0];
  return plus ? plus.categorie : null;
}

/** Un mois `AAAA-MM` dit en brasseur : « novembre 2026 » (t2, point 5) ; la forme machine ne se montre jamais. */
export function moisDit(mois: string): string {
  const d = new Date(`${mois}-15T12:00:00`);
  return Number.isNaN(d.getTime()) ? mois : new Intl.DateTimeFormat('fr-CH', { month: 'long', year: 'numeric' }).format(d);
}

/** Quelle période la question de la puce couvre : `mois` (celui de la barre), `tout`, ou `autre` (une plage que la feuille ne connaît pas). */
export function periodeDeLaQuestion(question: string | undefined, mois: string, toutesDates: boolean): 'mois' | 'tout' | 'autre' {
  if (!question) return toutesDates ? 'tout' : 'mois';
  if (question.includes(`en ${moisDit(mois)}`) || question.includes(`le mois ${moisDit(mois)}`)) return 'mois';
  if (/tout l[’']historique/.test(question)) return 'tout';
  return 'autre';
}

const COURT = 18;
const court = (texte: string) => {
  const t = texte.trim();
  return t.length > COURT ? `${t.slice(0, COURT - 1).trimEnd()}…` : t;
};

/** « loyer à payer 400,00 » pour une seule pièce, « 3 à payer 640,00 » pour plusieurs ; rien à payer : null (la pastille n'existe pas). */
export function pastilleAPayer(restes: Reste[], totalCents: number, montant: (cents: number) => string): string | null {
  if (!restes.length || totalCents <= 0) return null;
  if (restes.length === 1) return `${court(restes[0].libelle || 'pièce')} à payer ${montant(restes[0].cents)}`;
  return `${restes.length} à payer ${montant(totalCents)}`;
}

export const pastilleOperations = (n: number) => `${n} ${n > 1 ? 'opérations' : 'opération'}`;
export const pastilleSansPiece = (n: number) => `${n} sans pièce`;

/** Le statut TVA du profil : « sans TVA », « avec TVA », ou « profil financier » quand il n'est pas renseigné (l'inconnu n'est pas « sans »). */
export function pastilleProfil(vatRegistered: boolean | undefined): string {
  if (vatRegistered === true) return 'profil : avec TVA';
  if (vatRegistered === false) return 'profil : sans TVA';
  return 'profil financier';
}

/** La phrase de la feuille : libellé de la puce + les deux montants de la bande, comme « … 468,00 sur 696,80 dépensés. » (maquette). */
export function questionCourte(libelle: string, posteCents: number | null, depenseCents: number, montant: (cents: number) => string): string {
  return posteCents == null ? libelle : `${libelle} ${montant(posteCents)} sur ${montant(depenseCents)} dépensés.`;
}
