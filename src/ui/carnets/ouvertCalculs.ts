/** Les calculs du carnet ouvert (état, étendue des prix, provenance d'un critère, conclusion sur place), sortis de CarnetOuvert.tsx. */
import { sourceDuCritere } from '../../domain/carnets/modele';
import { avecArticle, passe, texteMoinsBienQue } from '../../domain/carnets/comparer';
import { moinsBienQueDe, type TableauV } from './Comparer';
import { dateCourte, montant, STATUT_LIBELLE, type CarnetV, type ContenuCarnetV, type CritereV, type FaconV } from './EtatIA';

export type Ligne = TableauV['lignes'][number];

/** f7 n° 7 : une raison d'écart sans son préfixe « écarté : », pour comparer celle d'un article à celle de sa façon. */
export const sansEcarte = (r: string) => r.trim().replace(/^écartée?s*:s*/i, '').trim().toLowerCase();

export function etiquetteStatut(c: CarnetV): string {
  /* CRN-8 (vision au doigt, 21.11) : un projet fait au Planning n'est pas une « Idée » ; la date d'archivage est celle de la migration,
     elle ne se dit pas comme la date du fait */
  if (c.carnet.archive) return /planning/i.test(c.carnet.archive.raison) ? 'Fait au Planning' : `Archivé${dateCourte(c.carnet.archive.le) ? ` le ${dateCourte(c.carnet.archive.le)}` : ''}`;
  if (c.status === 'idea') { const d = dateCourte(c.carnet.creeLe); return d ? `Idée · ${d}` : 'Idée'; }
  /* tour 3, PCN-151 : réalisé (plan payé), la pastille le dit comme la ligne de sortie */
  if (c.status === 'validated' && c.carnet.sortie?.etat === 'realise') { const d = dateCourte(c.carnet.sortie.realiseLe); return d ? `Réalisé le ${d}` : 'Réalisé'; }
  if (c.status === 'validated') { const d = dateCourte(c.carnet.choix?.le); return d ? `Choisi le ${d}` : 'Choisi'; }
  return STATUT_LIBELLE.research;
}

export function etendue(centimes: number[]): string | null {
  if (!centimes.length) return null;
  const min = montant(Math.min(...centimes)), max = montant(Math.max(...centimes));
  return min === max ? `${min} CHF` : `${min} à ${max} CHF`; // virgule-ok : min et max sortent de montant(), déjà formaté
}

/**
 * D'où vient un critère, en mots (critique 5, n° 1) : « de votre phrase » seulement pour ce qu'il a écrit (`vous`, ou `phrase` si le
 * lot A le nomme ainsi) ; le calcul local et la page se disent tels quels ; l'IA (et l'exemple simulé du banc) : « proposé par l'IA ».
 */
export function provenanceCritere(cr: Pick<CritereV, 'origine' | 'source'>): string {
  const o = String(cr.origine);
  if (o === 'phrase') return 'de votre phrase';
  if (o === 'locale' && !cr.source) return 'calculé sur place';
  if (o === 'page' && !cr.source) return 'lu sur la page';
  /* l'exemple du banc sans source dite : proposé (simulé) par l'IA, comme h05-3 */
  if (o === 'exemple' && !cr.source) return "proposé par l'IA";
  /* Critique 6, point 13 : la source réelle du critère se lit par `sourceDuCritere` (lot A, modele.ts) : `phrase` = tiré de ses mots,
     même quand l'IA l'a mis en forme ; `ia` = proposé par l'IA. */
  return sourceDuCritere(cr as Parameters<typeof sourceDuCritere>[0]) === 'phrase' ? 'de votre phrase' : "proposé par l'IA";
}

/**
 * « moins bien que la 3e sur tout » (critique 5, n° 23) : le rang du dominant comme Comparer le calcule (`moinsBienQueDe`, qui lit
 * `moinsBienQue` du lot A), dit par `texteMoinsBienQue` (comparer.ts, lot A) ; `null` si personne ne le domine.
 */
export function texteMoinsBien(t: TableauV, l: Ligne): string | null {
  if (l.ecarte) return null;
  const par = moinsBienQueDe(t as never, l as never);
  return par === null ? null : texteMoinsBienQue(par);
}

/* ---------- la conclusion sur place (P5, h05-3) ---------- */

/** « la hotte », « l'extracteur », « le frigo » : le premier mot du nom d'une façon, avec son article. */
export function nomCourt(nom: string): { texte: string; feminin: boolean } {
  const mot = nom.trim().split(/\s+/)[0] ?? nom;
  const bas = mot.charAt(0).toLowerCase() + mot.slice(1);
  if (/^h/i.test(mot)) { const f = /e$/i.test(mot); return { texte: `${f ? 'la' : 'le'} ${bas}`, feminin: f }; }
  const t = avecArticle(bas);
  const feminin = t.startsWith('la ') || (t.startsWith("l'") && /(tion|sion|ure|ence|ance|ite|ette|elle|ise|ade|ude|iere|ine|ille)$/i.test(mot));
  return { texte: t, feminin };
}

/** k1d (h05-3 « capte la buée ») : une pastille dit le critère en minuscule ; « Tient 2 °C » (mis en forme par l'IA) → « tient 2 °C ».
 *  Un sigle (« CO2 », « SAV ») garde sa majuscule : seule une initiale suivie d'une minuscule baisse. */
export function enMinuscule(t: string): string {
  return /^\p{Lu}\p{Ll}/u.test(t) ? t.charAt(0).toLocaleLowerCase('fr') + t.slice(1) : t;
}

/** « tient 80 °C » → « ne tient pas 80 °C » ; « aspire … » → « n'aspire pas … » (un critère oui-non se dit par un verbe). */
export function nier(texte: string): string {
  const t = enMinuscule(texte.trim());
  const m = /^(\S+)(\s.*)?$/.exec(t);
  if (!m) return `pas : ${t}`;
  return `${/^[aeiouyéèêàâîôû]/i.test(m[1]) ? "n'" : 'ne '}${m[1]} pas${m[2] ?? ''}`;
}

export interface Separation { critere: CritereV; retenue: FaconV; texte: string; retenir: string; verdicts: Record<string, boolean | null> }

/** Le verdict d'une façon sur un critère : vrai si l'un de ses articles lus le passe ; faux si tous ceux qu'on connaît échouent. */
function verdictFacon(k: ContenuCarnetV, f: FaconV, cr: CritereV): boolean | null {
  const v = k.articles.filter(a => a.faconId === f.id && a.lecture === 'lue').map(a => passe(a as never, cr as never));
  if (v.some(x => x === true)) return true;
  return v.some(x => x === false) ? false : null;
}

/**
 * Le premier critère (dans leur ordre) qui sépare les façons en lice : une seule le passe, toutes les autres échouent. `null` sinon.
 * Calcul local, sans IA : chaque mot vient du carnet (noms, critère).
 */
export function separationDe(k: ContenuCarnetV): Separation | null {
  const facons = k.facons.filter(f => f.etat !== 'ecartee');
  if (facons.length < 2) return null;
  for (const cr of k.criteres) {
    if (!cr.caracteristique) continue;
    const verdicts = Object.fromEntries(facons.map(f => [f.id, verdictFacon(k, f, cr)]));
    const vals = Object.values(verdicts);
    if (vals.filter(x => x === true).length !== 1 || vals.some(x => x === null)) continue;
    const retenue = facons.find(f => verdicts[f.id] === true)!;
    const court = nomCourt(retenue.nom);
    const positif = cr.caracteristique.sens === 'oui-non' ? cr.texte : `passe : ${cr.texte}`;
    const texte = `Le critère sépare ${facons.length === 2 ? 'les deux façons' : 'les façons'} : ${court.feminin ? 'seule' : 'seul'} ${court.texte} ${positif}.`;
    return { critere: cr, retenue, texte, retenir: court.texte, verdicts };
  }
  return null;
}

/** La pastille d'une façon sur le critère qui sépare (ou le 1er critère oui-non connu) : « capte la buée » / « ne capte pas la buée ». */
export function pastilleFacon(k: ContenuCarnetV, f: FaconV, sep: Separation | null): { texte: string; passe: boolean | null } | null {
  if (f.etat === 'ecartee') return f.raison ? { texte: f.raison, passe: false } : null;
  const cr = sep?.critere ?? k.criteres.find(c => c.caracteristique?.sens === 'oui-non');
  const v = cr ? (sep ? sep.verdicts[f.id] ?? null : verdictFacon(k, f, cr)) : null;
  if (cr && v !== null) {
    const oui = cr.caracteristique?.sens === 'oui-non';
    return { texte: v ? enMinuscule(cr.texte) : oui ? nier(cr.texte) : 'hors critère', passe: v };
  }
  return f.raison ? { texte: f.raison, passe: f.etat === 'retenue' ? true : null } : null;
}
