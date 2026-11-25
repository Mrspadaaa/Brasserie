/**
 * D451, voie liste : les règles pures de la liste en arbre (maquettes3/v01, écrans `liste`, `saisie`, `epreuve`). Aucune interface ici :
 * la valeur utile d'un carnet replié, le dernier pas d'un problème, les filtres du coup d'œil, la cloche, le résumé d'un sous-domaine replié,
 * et le déplacement du contenu d'un carnet dans un autre (« Rattacher à … », OK de la carte `deplacer`), un seul Annuler.
 * Honnêteté : une valeur absente reste absente (jamais 0, jamais « ? ») ; un compte nul est un compte et s'écrit 0.
 */
import type { CarnetDoc, MessageDoc } from '../../domain/carnets/modele';
import { appliquerEcritures, deplacer, supprimerCarnet, type CibleLigne, type EcritureCarnet, type Resultat } from '../../domain/carnets/operations';
import { etatDe, etatOption, genreDe, optionRetenue, suiviDe } from '../../domain/carnets/suivi';
import type { EtatSuivi } from '../../domain/carnets/modele';
import type { GroupeArbre } from '../../domain/carnets/arbre';
import type { CarnetV } from './EtatIA';
import { dateCourte, montant as montantTexte } from './EtatIA';
import { articlesEnLice, prixDe, quandDe } from './ListeCarnets';
import { titreAffiche } from './titre';
import { coutDeOption } from './filRegles';

export const ETATS_LISTE: readonly EtatSuivi[] = ['note', 'cherche', 'decide', 'resolu'];
/** La jauge à 4 pastilles : Noté 1, Je cherche 2, Décidé 3, Résolu 4 (maquette : `i <= n`). */
export const jaugeDe = (e: EtatSuivi): number => ETATS_LISTE.indexOf(e) + 1;

/** Un filtre du coup d'œil : un toucher sur une case ne garde que cet état ; le même toucher le retire. */
export type FiltreOeil = EtatSuivi | null;
/** L'onglet de la rangée « Arbre · À faire n · cloche n ». */
export type OngletListe = 'arbre' | 'afaire' | 'veille';

const coupe = (t: string, n: number): string => { const s = t.replace(/\s+/g, ' ').trim(); return s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`; };
const vueDe = (c: CarnetDoc): CarnetV => c as unknown as CarnetV;
export const titreLigne = (c: CarnetDoc): string => titreAffiche(c.title);

/** Une option est-elle en veille (demandée) ou un article porte-t-il une veille active ? */
export const aVeille = (c: CarnetDoc): boolean => c.carnet.facons.some(f => etatOption(f) === 'veille') || c.carnet.articles.some(a => a.veille?.active);
export const carnetsAvecVeille = (carnets: readonly CarnetDoc[]): CarnetDoc[] => carnets.filter(c => !c.carnet.archive && aVeille(c));

/** Le jour (AAAA-MM-JJ) d'un instant, en heure locale. */
const jourDe = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** La date d'une tâche, dite comme la maquette : « fin du mois » (mois en cours), « cette semaine », sinon « 26 nov. » ou « sem. du 30 nov. ». Sans échéance : rien. */
export function quandTacheCourt(t: { echeance?: string; precision?: string }, maintenant: Date): string | null {
  if (!t.echeance) return null;
  const auj = jourDe(maintenant);
  if (t.precision === 'mois') return t.echeance.slice(0, 7) === auj.slice(0, 7) ? 'fin du mois' : dateCourte(t.echeance)?.split(' ').slice(1).join(' ') ?? null;
  const lundi = new Date(`${t.echeance}T12:00:00`);
  const fin = new Date(lundi); fin.setDate(fin.getDate() + 6);
  if (auj >= t.echeance && auj <= jourDe(fin)) return 'cette semaine';
  const d = dateCourte(t.echeance);
  return d ? `sem. du ${d}` : null;
}

/**
 * Le dernier pas d'un problème (sous son titre) : décidé, l'option retenue (et la date de sa tâche) ; je cherche, la prochaine tâche ; noté, la
 * dernière phrase citée. Tout vient de ses écritures ; rien n'est déduit des mots. `null` : rien à dire (la ligne n'invente pas).
 */
export function dernierPas(c: CarnetDoc, messages: readonly MessageDoc[], maintenant: Date): string | null {
  const e = etatDe(c);
  const ouvertes = (c.carnet.taches ?? []).filter(t => !t.faiteLe).sort((a, b) => (a.echeance ?? '9999').localeCompare(b.echeance ?? '9999'));
  const retenue = optionRetenue(c);
  if (e === 'decide') {
    const choisi = retenue?.nom ?? c.carnet.articles.find(a => a.id === c.carnet.choix?.articleId)?.nom;
    const t = ouvertes.find(x => retenue && x.optionId === retenue.id) ?? ouvertes[0];
    const q = t ? quandTacheCourt(t, maintenant) : null;
    if (choisi) return [coupe(choisi, 30), q].filter(Boolean).join(', ');
    if (t) return coupe(t.texte, 34);
  }
  if (e === 'cherche' && ouvertes[0]) return coupe(ouvertes[0].texte, 34);
  const dits = messages.filter(m => m.carnetMessage.effets.some(x => x.carnetId === c.id) || m.carnetMessage.depuis === c.id)
    .sort((a, b) => b.carnetMessage.le.localeCompare(a.carnetMessage.le));
  const phrase = dits[0]?.carnetMessage.texte ?? [...c.carnet.notes].reverse()[0]?.texte;
  if (e !== 'resolu' && phrase && phrase.trim() && phrase.trim() !== 'photo') return `« ${coupe(phrase, 30)} »`;
  return null;
}

/**
 * La valeur utile d'un carnet qui n'est pas un problème ouvert (idée, mémo, récolte, achat), sur sa ligne ou dans le résumé d'un sous-domaine :
 * « Dans À venir », « à comparer · ≈41 CHF/kg », « choisi · 540 CHF », « budget 500 CHF », « vers S10 ». Une idée sans prix ni date : rien.
 * « dès » et le prix à droite de l'ancienne liste disparaissent (D451 disparaît n° 3) : la valeur se lit une fois, avec son unité.
 */
export function valeurUtile(c: CarnetDoc, maintenant: Date, messages: readonly MessageDoc[] = []): string | null {
  /* C68-4 : un problème RÉSOLU dit ce qui a été retenu et son coût ; jamais « à comparer » ni le prix d'une piste pas prise (le condenseur B, hors stock, jamais choisi) */
  if (etatDe(c) === 'resolu') {
    const retenue = optionRetenue(c);
    const cout = retenue ? coutDeOption(messages, c.id, retenue.id) : null;
    const m = cout ? montantTexte(cout.centimes) : null;
    return retenue ? [`retenu : ${retenue.nom}`, ...(m ? [`${m} ${cout!.devise}`] : [])].join(' · ') : null;
  }
  const v = vueDe(c);
  const k = c.carnet;
  const prix = prixDe(v);
  const montant = prix ? `${prix.texte} ${prix.devise}${prix.quantite ? ` ${prix.quantite}` : ''}` : null;
  const parts: string[] = [];
  if (k.sortie) parts.push('Dans À venir');
  else if (c.status === 'validated' && k.choix) parts.push('choisi');
  else if (articlesEnLice(v).length >= 2) parts.push('à comparer');
  if (montant) parts.push(prix?.sorte === 'budget' ? `budget ${montant}` : prix?.sorte === 'estime' ? `estimé ${montant}` : montant);
  else if (!parts.length) {
    const quand = quandDe(v, jourDe(maintenant));
    if (quand) parts.push(quand);
  }
  return parts.length ? parts.join(' · ') : null;
}

/** Le résumé d'un sous-domaine replié : « Houblons citra · à comparer » ; deux titres au plus, puis « +n ». */
export function resumeReplie(g: GroupeArbre, maintenant: Date): string {
  const titres = g.carnets.slice(0, 2).map(titreLigne);
  const reste = g.carnets.length - titres.length;
  const val = g.carnets.length === 1 ? valeurUtile(g.carnets[0], maintenant) : null;
  return [...titres, ...(val ? [val] : []), ...(reste > 0 ? [`+${reste}`] : [])].join(' · ');
}

/** Le chemin d'un sous-domaine, ou « Sans catégorie » pour les carnets sans sous-domaine (jamais montré replié : ils se lisent à plat). */
export const nomGroupe = (g: GroupeArbre): string => g.chemin ?? 'Sans catégorie';

/** Un filtre d'état du coup d'œil : seul l'état demandé reste (le même compte que la case) ; sans filtre, tous. */
export function passeFiltre(c: CarnetDoc, f: FiltreOeil): boolean {
  if (f === null) return true;
  /* comme le coup d'œil : « notés » ne compte que les problèmes (une idée du Planning n'est pas un constat) ; les autres cases comptent tous les genres */
  if (f === 'note') return genreDe(c) === 'probleme' && etatDe(c) === 'note';
  return etatDe(c) === f;
}

/** « Pompe qui cavite · 14 oct. · Joint de vanne · 16 nov. › » : les résolus les plus récents, titre et jour. */
export function ligneResolus(carnets: readonly CarnetDoc[], n = 2): string {
  return carnets.slice(0, n).map(c => { const d = dateCourte(suiviDe(c).resolu?.le); return d ? `${titreLigne(c)} · ${d}` : titreLigne(c); }).join(' · ');
}

/* ---------- déplacer le contenu d'un carnet dans un autre ---------- */

const CIBLES: readonly [CibleLigne, (c: CarnetDoc) => { id: string }[]][] = [
  ['critere', c => c.carnet.criteres], ['facon', c => c.carnet.facons], ['article', c => c.carnet.articles], ['note', c => c.carnet.notes], ['photo', c => c.carnet.photos]
];
export const contenuDe = (c: CarnetDoc): { cible: CibleLigne; id: string }[] => CIBLES.flatMap(([cible, liste]) => liste(c).map(x => ({ cible, id: x.id })));

type Items = import('../../types').CreativeItem[];

/** Enchaîne des intentions du domaine : chacune lit l'état que les précédentes ont écrit ; une écriture, un inverse (le dernier pas se défait d'abord). */
export function enchainer(etat: readonly import('../../types').CreativeItem[], etapes: readonly ((e: Items) => Resultat)[], avis: string): Resultat {
  let e: Items = [...etat];
  const ecritures: EcritureCarnet[] = [];
  let inverse: EcritureCarnet[] = [];
  for (const etape of etapes) {
    const r = etape(e);
    if (!r.ok) return r;
    e = appliquerEcritures(e, r.ecritures);
    ecritures.push(...r.ecritures);
    inverse = [...r.inverse, ...inverse];
  }
  return { ok: true, ecritures, inverse, avis };
}

const titreDe = (etat: readonly import('../../types').CreativeItem[], id: string): string => (etat.find(i => i.id === id) as unknown as CarnetDoc | undefined)?.title ?? 'ce carnet';

/**
 * Rattacher : tout le contenu du carnet `depuis` passe dans `vers` (les lignes, les photos ; les messages suivent leurs effets), puis le carnet
 * source, vidé, part. Une seule suite d'écritures, un seul inverse : Annuler rend tout. Rien ne bouge sans le geste du brasseur (l'appelant).
 * Un carnet que des finances retiennent ne part pas : il reste, vide.
 */
export function rattacherContenu(etat: readonly import('../../types').CreativeItem[], args: { depuis: string; vers: string }): Resultat {
  const lu = etat.find(i => i.id === args.depuis) as unknown as CarnetDoc | undefined;
  if (!lu?.carnet) return { ok: false, raison: 'Ce carnet n’existe plus.' };
  if (args.depuis === args.vers) return { ok: false, raison: 'Déjà dans ce carnet.' };
  const deplacements = contenuDe(lu).map(x => (e: Items) => deplacer(e, { cible: x.cible, id: x.id, depuis: args.depuis, vers: args.vers }));
  const vide = (e: Items): Resultat => {
    const r = supprimerCarnet(e, { carnetId: args.depuis, plans: [], transactions: [], payments: [] });
    return r.ok ? r : { ok: true, ecritures: [], inverse: [], avis: '' };
  };
  return enchainer(etat, [...deplacements, vide], `Rattaché à ${titreDe(etat, args.vers)}`);
}

/**
 * La carte « Rattacher à … ? » (proposition `deplacer`) : les lignes que CE message a rangées dans `depuis` passent dans `vers` (jamais le reste
 * du carnet), puis la carte est retirée. Le message reste dans son carnet tant que le brasseur n'a pas dit OK (MESSAGE-RESTE-DANS-SON-CARNET).
 */
export function deplacerLesLignesDuMessage(etat: readonly import('../../types').CreativeItem[], args: { messageId: string; depuis: string; vers: string; retirerCarte?: (e: Items) => Resultat }): Resultat {
  const m = etat.find(i => i.id === args.messageId) as unknown as MessageDoc | undefined;
  if (!m?.carnetMessage) return { ok: false, raison: 'Message introuvable.' };
  const cibles: readonly string[] = ['critere', 'facon', 'article', 'note', 'photo'];
  const lignes = m.carnetMessage.effets.filter(x => x.carnetId === args.depuis && !x.carnetSupprime && cibles.includes(x.cible));
  if (!lignes.length) return { ok: false, raison: 'Rien à rattacher : ce message n’a rien rangé ici.' };
  const pas = lignes.map(x => (e: Items) => deplacer(e, { cible: x.cible as CibleLigne, id: x.id, depuis: args.depuis, vers: args.vers }));
  return enchainer(etat, args.retirerCarte ? [...pas, args.retirerCarte] : pas, `Rattaché à ${titreDe(etat, args.vers)}`);
}
