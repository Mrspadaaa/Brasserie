/**
 * Q-2 C (D435, 23.11) : la recherche des carnets fouille les titres, les Faits (à part), le texte des articles et des notes ; la ligne
 * trouvée est citée sous la carte (« article : Chambre froide 1500 x 1200 mm », le mot en gras). Accents et majuscules ignorés.
 */
import { plier } from './domaines';

export interface Trouve {
  sorte: 'titre' | 'article' | 'note';
  /** La ligne citée (article ou note), rognée autour du mot ; absente pour un titre. */
  texte?: string;
  /** Le mot trouvé dans `texte` : [début, fin[. */
  debut?: number;
  fin?: number;
}

export interface CarnetCherche {
  title: string;
  carnet: { articles: readonly { nom?: string; domaine?: string }[]; notes: readonly { texte: string }[] };
}

/** La requête pliée (sans accent, minuscule, espaces resserrés) ; vide si rien à chercher. */
export const requete = (q: string): string => plier(q).replace(/\s+/g, ' ').trim();

const AVANT = 24, LONGUEUR = 70;

/** La ligne citée autour du mot : au plus ~70 signes, « … » où elle est coupée ; les positions suivent la coupe. */
export function extrait(texte: string, debut: number, fin: number): { texte: string; debut: number; fin: number } {
  const t = texte.replace(/\s+/g, ' ');
  if (t.length <= LONGUEUR) return { texte: t, debut, fin };
  const de = Math.max(0, debut - AVANT);
  const a = Math.min(t.length, Math.max(fin, de + LONGUEUR));
  const pre = de > 0 ? '…' : '', post = a < t.length ? '…' : '';
  return { texte: `${pre}${t.slice(de, a)}${post}`, debut: debut - de + pre.length, fin: fin - de + pre.length };
}

const dans = (texte: string, q: string): number => plier(texte.replace(/\s+/g, ' ')).indexOf(q);

/** Ce que la recherche trouve dans un carnet : son titre d'abord, sinon un article, sinon une note ; `null` sinon. */
export function chercherCarnet(c: CarnetCherche, q: string): Trouve | null {
  const r = requete(q);
  if (!r) return null;
  if (dans(c.title, r) >= 0) return { sorte: 'titre' };
  const lignes: { sorte: 'article' | 'note'; texte: string }[] = [
    ...c.carnet.articles.map(a => ({ sorte: 'article' as const, texte: a.nom ?? '' })),
    ...c.carnet.notes.map(n => ({ sorte: 'note' as const, texte: n.texte }))
  ];
  for (const l of lignes) {
    const i = dans(l.texte, r);
    if (i < 0) continue;
    const e = extrait(l.texte, i, i + r.length);
    return { sorte: l.sorte, texte: e.texte, debut: e.debut, fin: e.fin };
  }
  return null;
}
