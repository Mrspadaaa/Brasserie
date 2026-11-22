import { lundiDe } from '../domain/calendrier';

/**
 * D425 (22.11, GESTE-DATE-PARTOUT) : la plage de la frise d'un champ de date = [min(valeur, aujourd'hui − 5 ans), max(valeur, aujourd'hui + 5 ans)],
 * jamais bornée en dur : une pièce de 2024 se corrige au doigt sans retomber sur janv. 2025. Rendue en lundis (la frise compte ses unités depuis un lundi) :
 * `epoque` = le lundi de la semaine de la borne basse, `dernier` = le lundi de la semaine de la borne haute.
 */
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Ce même jour, `n` années plus tôt ou plus tard (le 29 févr. devient le 28 les années non bissextiles). */
export function ajouterAnnees(iso: string, n: number): string {
  const [a, m, j] = iso.split('-').map(Number);
  const annee = a + n;
  const dernierDuMois = new Date(Date.UTC(annee, m, 0)).getUTCDate();
  return `${String(annee).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(Math.min(j, dernierDuMois)).padStart(2, '0')}`;
}

export function plageDate(valeur: string, aujourdhui: string): { epoque: string; dernier: string } {
  const v = ISO.test(valeur) ? valeur : aujourdhui;
  const bas = ajouterAnnees(aujourdhui, -5), haut = ajouterAnnees(aujourdhui, 5);
  return { epoque: lundiDe(v < bas ? v : bas), dernier: lundiDe(v > haut ? v : haut) };
}
