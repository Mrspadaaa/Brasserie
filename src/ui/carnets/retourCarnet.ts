/** Le retour « après » d'un message, lu sur ses effets dans le magasin ; sorti de CarnetsVue.tsx (`retourDe`), pur. */
import { estLienSeul, lireCarnets, lireMessages, nomArticle, titreDePhrase } from '../../domain/carnets/modele';
import type { EcritureCarnet } from '../../domain/carnets/operations';
import { tableau as tableauDe } from '../../domain/carnets/comparer';
import type { LigneCarnet } from '../../domain/carnets/ia';
import type { CreativeItem } from '../../types';
import { retourDuRangement } from './rangement';
import { origineDuTitre, type BandeauV, type TitreDe } from './Bandeau';
import { montant } from './EtatIA';
import { plusieursLignes } from './envoiRegles';
import { detailDe, rangDuLien } from './lignesRegles';
import type { RetourNeuf } from './carnetsTypes';

/**
 * `etat` (BL-2, GH-4) : l'état juste après l'écriture, quand l'appelant le connaît. Le magasin Firestore ne voit une écriture qu'à son
 * instantané suivant : relu aussitôt, il rendait l'écriture locale d'avant l'IA (« Lien rangé ici · page non lue » pour un lien lu, ou
 * parti dans un autre carnet).
 */
export type RetourDe = (messageId: string, txt: string, depuisM: string | null, inverse: EcritureCarnet[], lignesIA?: readonly LigneCarnet[], titresIA?: readonly (string | undefined)[], etat?: CreativeItem[]) => RetourNeuf | null;

/**
 * P1, P2 : le retour « après » se lit sur les effets du message tels qu'ils sont au bout du compte (magasin), jamais sur l'écriture
 * locale que l'IA a remplacée. Carnet créé (R11, g5:v04-4), rangé ici (R14, g5:v03-8), rangé dans un autre carnet avec le message cité et
 * l'article (G21, g5:v06-14, état 20), ou n lignes dans m carnets (R19, g5:v01-16). `inverse` : tout ce qu'Annuler défait.
 */
export function retourDeMessage(etat: CreativeItem[], messageId: string, txt: string, depuisM: string | null, inverse: EcritureCarnet[], lignesIA?: readonly LigneCarnet[], titresIA?: readonly (string | undefined)[]): RetourNeuf | null {
  const effets = lireMessages(etat).find(m => m.id === messageId)?.carnetMessage.effets ?? [];
  const rr = retourDuRangement(effets, { depuis: depuisM, plusieursLignes: plusieursLignes(txt) });
  if (!rr) return null;
  const detail = detailDe(etat, effets);
  if (rr.sorte === 'vrac') return { bandeau: { sorte: 'vrac', lignes: rr.lignes, carnets: rr.carnets }, inverse, messageId, detail };
  const c = lireCarnets(etat, { archives: true }).find(x => x.id === rr.carnetId);
  /* P9 (R25) : un lien seul dont la page n'est pas lue dit lequel, en clair, et qu'il n'est pas lu ; P21 : une photo dit « Photo rangée » */
  const propres = effets.filter(e => e.carnetId === rr.carnetId && e.cible !== 'carnet');
  const art = propres.length === 1 && propres[0].cible === 'article' ? c?.carnet.articles.find(x => x.id === propres[0].id) : undefined;
  /* T25-5 : tout ce que le message a « rangé » était déjà là (même lien, même carnet) : on le dit, on n'annonce aucun rangement */
  if (rr.sorte !== 'cree' && propres.length && propres.every(e => e.existant)) return { bandeau: { sorte: 'doublon' }, inverse, messageId, carnetId: rr.carnetId, detail };
  if (rr.sorte === 'range') {
    /* BL-1 : le lien collé dans le carnet ouvert y est resté ; le carnet existant que l'IA voyait est proposé (« Déplacer vers … ? ») */
    const sugId = lignesIA?.find(l => l.carnetSuggere && l.carnetSuggere !== rr.carnetId)?.carnetSuggere;
    const sug = sugId ? lireCarnets(etat).find(x => x.id === sugId) : undefined;
    const suggestion = sug ? { suggestion: { carnetId: sug.id, titre: sug.title } } : {};
    /* lot 11 (L-4, hors lot du lot 1) : la raison de la page non lue (site qui bloque, adresse introuvable…) se dit dans le bandeau */
    const statut = lignesIA?.find(l => l.page && (l.url === art?.url || l.page.url === art?.url))?.page?.statut ?? lignesIA?.find(l => l.page)?.page?.statut;
    if (art?.url && art.lecture !== 'lue') return { bandeau: { sorte: 'lien', url: art.url, lu: false, ici: true, ...(statut ? { statut } : {}) }, inverse, messageId, carnetId: rr.carnetId, detail, ...suggestion };
    if (propres.length && propres.every(e => e.cible === 'photo')) return { bandeau: { sorte: 'photo', ici: true }, inverse, messageId, carnetId: rr.carnetId, detail };
    return { bandeau: { sorte: 'range' }, inverse, messageId, carnetId: rr.carnetId, detail, ...suggestion };
  }
  if (rr.sorte === 'cree' && propres.length && propres.every(e => e.cible === 'photo')) {
    return { bandeau: { sorte: 'photo', ici: true }, inverse, messageId, carnetId: rr.carnetId, detail };
  }
  if (rr.sorte === 'cree') {
    const titre = c?.title ?? '';
    const nomLu = c?.carnet.articles.some(a => a.nom && a.nom === titre);
    /* « Embouteillage » pour « embouteillage » reste sa phrase en titre (g5:v04-4). `ia` seulement si l'IA a fourni ce titre ; sinon la règle locale */
    const titreDe: TitreDe = origineDuTitre({ titre, titreDePhrase: titreDePhrase(txt), lienSeul: estLienSeul(txt), nomLu: !!nomLu, titresIA });
    /* lot 11 (L-2, hors lot du lot 1) : l'IA voyait un carnet existant ; la phrase a créé le sien (son annonce), le carnet de l'IA est proposé */
    const sugId = lignesIA?.find(l => l.carnetSuggere && l.carnetSuggere !== rr.carnetId)?.carnetSuggere;
    const sug = sugId ? lireCarnets(etat).find(x => x.id === sugId) : undefined;
    return { bandeau: { sorte: 'cree', phrase: txt, titreDe }, inverse, messageId, carnetId: rr.carnetId, detail, ...(sug ? { suggestion: { carnetId: sug.id, titre: sug.title } } : {}) };
  }
  const effet = effets.find(e => e.cible === 'article' && e.carnetId === rr.carnetId);
  const a = effet ? c?.carnet.articles.find(x => x.id === effet.id) : undefined;
  const prix = a ? montant(a.prixCentimes) : null;
  const detailArt = a ? [a.nom ? a.domaine ?? a.vendeur : a.vendeur, a.pays].filter(Boolean).join(' · ') : '';
  const raison = lignesIA?.find(l => l.carnetId === rr.carnetId && l.raisonCarnet)?.raisonCarnet;
  /* tour 3, PCN-100 : déposé depuis la liste, le retour dit aussi la place de l'article dans le carnet d'arrivée */
  const tA = c && a ? tableauDe(c) : null;
  const rangA = tA && a && c ? rangDuLien(tA, a.id, c.carnet.articles) : null;
  const bandeau: BandeauV = {
    sorte: 'ailleurs', carnet: c?.title ?? 'un autre carnet', cite: txt, ...(raison ? { raison } : {}), ...(rangA ? { rang: rangA } : {}),
    ...(a ? { article: { nom: nomArticle(a), ...(detailArt ? { detail: detailArt } : {}), ...(prix ? { prix: `${prix} ${a.devise ?? 'CHF'}` } : {}), ...(a.origine === 'exemple' ? { exemple: true } : {}) } } : {})
  };
  return { bandeau, inverse, messageId, detail, ...(depuisM ? { carnetId: depuisM } : {}) };
}
