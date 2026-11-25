/**
 * R98 / R99 (c75, CARNET-SES-DONNEES-EXISTANTES) : un carnet écrit avant les correctifs de rangement garde l'erreur DANS sa donnée (voies/c75-releve) :
 * « Autre fournisseur : en stock, 4 CHF de plus le sac. » enregistré comme ARTICLE (veille, Choisir), « La pompe … est brûlante … » comme CRITÈRE,
 * « Commandé 2 sacs » rangé « à acheter », « Résolu » coupé en note seule, carnet resté « idée ».
 *
 * État de l'art (L29) : pas d'algorithme neuf. Le « détecteur » est l'analyse locale d'aujourd'hui (`analyserLigne`, qui a déjà les règles R96 : un écart n'est pas un prix,
 * un constat n'est pas un critère), REJOUÉE sur la phrase d'origine (le message) de chaque article et critère nés d'une phrase libre ; un article à lien, à photo ou à valeurs
 * lues, un critère à caractéristique ou écrit par lui ne sont jamais touchés. Un motif absent : aucune proposition.
 * Aucune migration automatique : `propositionReclasser` et `sansErreurDeRangement` sont PURES ; seul `reclasser` écrit, sur son geste (« Reclasser »), en une écriture
 * annulable (l'inverse vient du `Brouillon`). Tant qu'il n'a pas touché, `sansErreurDeRangement` cache l'erreur à l'écran (pas de veille ni de Choisir sur une phrase).
 */
import { analyserLigne, normaliser, prixDe } from './analyseLocale';
import { GESTE_FINI } from './filAncien';
import { nouvelIdCarnet, type Article, type CarnetDoc, type Critere, type EffetMessage, type MessageDoc, type Note } from './modele';
import { appliquerEcritures, Brouillon, poser, refus, type EcritureCarnet, type Etat, type Resultat } from './operations';
import { etatDe, genreDe, poserGenre, resoudre } from './suivi';

export interface PropositionReclasser {
  carnetId: string;
  /** Les articles nés d'une phrase : une piste (« Autre fournisseur : … ») ou une note ; le montant relatif s'écrit « +4 CHF le sac ». */
  articles: { id: string; nom: string; messageId?: string; relatif: string | null; texteNote: string; /** « Autre fournisseur : … » : une piste, son nom et sa raison (montant en relatif) */ piste?: { nom: string; raison: string } }[];
  /** Les critères nés d’un constat : ils deviennent une note de constat. */
  criteres: { id: string; texte: string; messageId?: string }[];
  /** Les notes « à acheter » qui disent un achat fait (« Commandé 2 sacs … ») : elles passent en simple note (fait). */
  faits: { noteId: string; texte: string }[];
  /** « Résolu » seul : l'état du carnet devient Résolu ; `texte` : la phrase de la même bulle qui dit comment. */
  resolu?: { noteId: string; texte?: string };
  /** Le genre « problème » : un constat ou un Résolu dit que c'en est un (carnet sans genre posé). */
  genre?: 'probleme';
  /** Ce qui change, en phrases, pour la carte. */
  lignes: string[];
}

const nette = (t: string): string => normaliser(t).replace(/[^a-z0-9]+/g, ' ').trim();
const RESOLU_SEUL = /^(?:probleme )?(?:resolu|regle|repare|corrige|c est (?:resolu|regle|repare|fait))$/;
/** « 4 CHF de plus le sac », « 20 francs en moins par kilo » : le montant relatif, tel qu'on l'écrit : « +4 CHF le sac ». */
const ECART = /(\d+(?:[.,]\d+)?)\s*(chf|francs?|fr\.?|eur|euros?|€)\s+(?:de|en)\s+(plus|moins)(?:\s+(le|la|l['’]|par|pour)\s*([\p{L}]+))?/iu;
const MONNAIE: Record<string, string> = { chf: 'CHF', franc: 'CHF', francs: 'CHF', fr: 'CHF', 'fr.': 'CHF', eur: 'EUR', euro: 'EUR', euros: 'EUR', '€': 'EUR' };

/** « +4 CHF le sac » et la phrase de la note (la phrase d'origine, montant remis en relatif) ; `relatif: null` : la phrase ne dit pas d'écart. */
function ecartDe(nom: string): { relatif: string | null; texteNote: string } {
  const m = ECART.exec(nom);
  if (!m) return { relatif: null, texteNote: nom.trim() };
  const signe = /^moins$/i.test(m[3]) ? '−' : '+';
  const unite = m[4] && m[5] ? ` ${m[4].replace(/['’]$/, '’')}${/['’]$/.test(m[4]) ? '' : ' '}${m[5]}` : '';
  const relatif = `${signe}${m[1]} ${MONNAIE[m[2].toLowerCase()] ?? m[2].toUpperCase()}${unite}`;
  return { relatif, texteNote: nom.replace(ECART, () => relatif).trim() };
}

/** « Autre fournisseur : en stock, 4 CHF de plus le sac. » : l'étiquette d'une piste et sa raison, le montant remis en relatif. */
const ETIQUETTE_PISTE = /^\s*(autres?\s+[^:\n]{2,40}?)\s*:\s*(\S[^]*)$/i;
function pisteDe(texteNote: string, relatif: string): { nom: string; raison: string } | undefined {
  const m = ETIQUETTE_PISTE.exec(texteNote);
  if (!m) return undefined;
  const nom = m[1].trim();
  /* le nom de la piste porte l'écart (« Autre fournisseur · +4 CHF le sac ») ; la raison garde le reste de sa phrase (« en stock ») */
  const reste = m[2].replace(relatif, () => '').replace(/[\s,;:.–-]+$/, '').replace(/^[\s,;:.–-]+/, '');
  return { nom: `${nom.charAt(0).toLocaleUpperCase('fr-CH') + nom.slice(1)} · ${relatif}`, raison: reste };
}

const phraseDeMessage = (messages: readonly MessageDoc[], id?: string): string | null => {
  const m = id ? messages.find(x => x.id === id) : undefined;
  return m ? m.carnetMessage.texte : null;
};

const articleNeDUnePhrase = (a: Article, messages: readonly MessageDoc[]): boolean => {
  if (!a.nom || a.url || a.photo || a.photos?.length || a.domaine || a.vendeur || Object.keys(a.valeurs ?? {}).length) return false;
  const phrase = phraseDeMessage(messages, a.messageId);
  if (phrase !== null && nette(phrase) !== nette(a.nom)) return false;
  return !!prixDe(a.nom) && analyserLigne(a.nom).sorte === 'note';
};

const critereNeDUnConstat = (k: Critere, messages: readonly MessageDoc[]): boolean => {
  if (k.origine !== 'locale' || k.caracteristique) return false;
  const phrase = phraseDeMessage(messages, k.messageId);
  if (phrase === null || nette(phrase) !== nette(k.texte)) return false;
  return analyserLigne(k.texte).sorte === 'note';
};

/** La proposition de reclassement d'un carnet, ou `null` : rien de mal rangé (un carnet bien rangé ne propose rien). */
export function propositionReclasser(c: CarnetDoc, messages: readonly MessageDoc[]): PropositionReclasser | null {
  const k = c.carnet;
  if (k.archive) return null;
  const articles = k.articles.filter(a => articleNeDUnePhrase(a, messages)).map(a => ({ id: a.id, nom: a.nom!, ...(a.messageId ? { messageId: a.messageId } : {}), ...(() => { const e = ecartDe(a.nom!); const piste = e.relatif ? pisteDe(e.texteNote, e.relatif) : undefined; return { ...e, ...(piste ? { piste } : {}) }; })() }));
  const criteres = k.criteres.filter(x => critereNeDUnConstat(x, messages)).map(x => ({ id: x.id, texte: x.texte, ...(x.messageId ? { messageId: x.messageId } : {}) }));
  const faits = k.notes.filter(n => n.genre === 'a-acheter' && GESTE_FINI.test(normaliser(n.texte))).map(n => ({ noteId: n.id, texte: n.texte }));
  const noteResolu = etatDe(c) === 'resolu' ? undefined : k.notes.find(n => RESOLU_SEUL.test(nette(n.texte)));
  const resolu = noteResolu
    ? { noteId: noteResolu.id, ...(k.notes.find(n => n.id !== noteResolu.id && !!noteResolu.messageId && n.messageId === noteResolu.messageId) ? { texte: k.notes.find(n => n.id !== noteResolu.id && n.messageId === noteResolu.messageId)!.texte.trim() } : {}) }
    : undefined;
  const genre = !k.genre && genreDe(c) !== 'probleme' && (criteres.length > 0 || !!resolu) ? ('probleme' as const) : undefined;
  if (!articles.length && !criteres.length && !faits.length && !resolu && !genre) return null;
  const lignes: string[] = [
    ...articles.map(a => `L’article « ${a.nom} » n’est pas un article : il devient ${a.piste ? `la piste « ${a.piste.nom} »` : 'une note'}${a.relatif ? ` (${a.relatif} : un écart, pas un prix)` : ''}.`),
    ...criteres.map(x => `Le critère « ${x.texte} » est un constat : il devient une note du problème.`),
    ...faits.map(f => `« ${f.texte} » : de « à acheter » à fait.`),
    ...(resolu ? [`« Résolu » seul : l’état du carnet passe à Résolu${resolu.texte ? `, avec « ${resolu.texte} »` : ''}.`] : []),
    ...(genre ? ['Idée → problème.'] : [])
  ];
  return { carnetId: c.id, articles, criteres, faits, ...(resolu ? { resolu } : {}), ...(genre ? { genre } : {}), lignes };
}

/** Le carnet tel que l'écran le montre tant qu'il n'a pas touché « Reclasser » : sans l'article ni le critère nés d'une phrase (l'erreur n'est pas affichée comme un fait). */
export function sansErreurDeRangement(c: CarnetDoc, messages: readonly MessageDoc[]): CarnetDoc {
  const p = propositionReclasser(c, messages);
  if (!p || (!p.articles.length && !p.criteres.length)) return c;
  const ids = new Set([...p.articles.map(a => a.id), ...p.criteres.map(x => x.id)]);
  return { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => !ids.has(a.id)), criteres: c.carnet.criteres.filter(x => !ids.has(x.id)) } };
}

/** Son geste « Reclasser » : une écriture annulable, toutes les corrections de la proposition. Un refus n'écrit rien. */
export function reclasser(etat: Etat, args: { proposition: PropositionReclasser; le: string }): Resultat {
  const p = args.proposition;
  let courant: Etat = etat;
  const ecritures: EcritureCarnet[] = [];
  let inverse: EcritureCarnet[] = [];
  const passer = (r: Resultat): string | null => {
    if (!r.ok) return (r as { raison: string }).raison;
    const ok = r as Extract<Resultat, { ok: true }>;
    ecritures.push(...ok.ecritures);
    inverse = [...ok.inverse, ...inverse];
    courant = appliquerEcritures(courant, ok.ecritures);
    return null;
  };
  const rangement = (): Resultat => {
    const b = new Brouillon(courant);
    const c = b.carnet(p.carnetId);
    if (!c) return refus('Ce carnet n’existe plus.');
    const k = c.carnet;
    /* `cible:id` → l'effet qui le remplace dans les messages ; `null` : l'effet est retiré (la note « Résolu » seule n'existe plus) */
    const effets = new Map<string, EffetMessage | null>();
    const apres: Note[] = [];
    const avant: Note[] = [];
    for (const a of p.articles) {
      if (!k.articles.some(x => x.id === a.id)) continue;
      k.articles = k.articles.filter(x => x.id !== a.id);
      if (a.piste) {
        const id = nouvelIdCarnet('FACON');
        k.facons = [...k.facons, { id, nom: a.piste.nom, etat: 'ouverte', ...(a.piste.raison ? { raison: a.piste.raison } : {}), origine: 'vous', ...(a.messageId ? { messageId: a.messageId } : {}) }];
        effets.set(`article:${a.id}`, { carnetId: c.id, cible: 'facon', id });
      } else {
        const id = nouvelIdCarnet('NOTE');
        apres.push({ id, texte: a.texteNote, genre: 'note', ...(a.messageId ? { messageId: a.messageId } : {}) });
        effets.set(`article:${a.id}`, { carnetId: c.id, cible: 'note', id });
      }
    }
    for (const x of p.criteres) {
      if (!k.criteres.some(y => y.id === x.id)) continue;
      const id = nouvelIdCarnet('NOTE');
      k.criteres = k.criteres.filter(y => y.id !== x.id);
      avant.push({ id, texte: x.texte, genre: 'note', ...(x.messageId ? { messageId: x.messageId } : {}) });
      effets.set(`critere:${x.id}`, { carnetId: c.id, cible: 'note', id });
    }
    const faits = new Set(p.faits.map(f => f.noteId));
    k.notes = k.notes.map(n => (faits.has(n.id) && n.genre === 'a-acheter' ? { ...n, genre: 'note' as const } : n));
    if (p.resolu) {
      k.notes = k.notes.filter(n => n.id !== p.resolu!.noteId);
      effets.set(`note:${p.resolu.noteId}`, null);
    }
    k.notes = [...avant, ...k.notes, ...apres];
    for (const m of b.messages()) {
      let change = false;
      const nouveaux: EffetMessage[] = [];
      for (const e of m.carnetMessage.effets) {
        const cle = `${e.cible}:${e.id}`;
        if (e.carnetId === c.id && effets.has(cle)) { change = true; const v = effets.get(cle); if (v) nouveaux.push({ ...e, ...v }); } else nouveaux.push(e);
      }
      if (change) b.ecrire({ ...m, carnetMessage: { ...m.carnetMessage, effets: nouveaux } });
    }
    poser(b, c);
    return b.resultat('Reclassement');
  };
  const etapes: Array<() => Resultat> = [
    rangement,
    ...(p.genre ? [() => poserGenre(courant, { carnetId: p.carnetId, genre: p.genre!, origine: 'vous' })] : []),
    ...(p.resolu ? [() => resoudre(courant, { carnetId: p.carnetId, le: args.le, sorte: 'texte', texte: p.resolu!.texte ?? '', origine: 'vous' })] : [])
  ];
  for (const etape of etapes) {
    const raison = passer(etape());
    if (raison) return refus(raison);
  }
  return { ok: true, ecritures, inverse, avis: '✓ Carnet reclassé' };
}
