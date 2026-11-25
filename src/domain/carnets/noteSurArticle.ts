/**
 * NOTE-EXPLOITEE (N1 à N4) et LIEN-PAS-PRODUIT (N5), 25.11. Ses mots : « J'ai ajouté une note, l'ia devrait en faire qqch » ; « un lien peut être ajouté sans
 * que ce soit un produit à comparer, comme par exemple un lien sur les frais d'envoi ».
 *
 * Une note qui parle d'UN article (« le site français semble ne plus avoir de stock ») devient un fait de cet article : « dispo douteuse · ta note, 24 nov. »,
 * à côté de ce que la page dit (« en stock »), jamais à sa place. Ce fichier ne fait que des gardes déterministes, sans réseau et sans IA :
 *  - `articleVise` : l'IA désigne un article en citant le passage ; le client ne le croit que si le passage ne désigne QUE cet article (vendeur, adresse du site,
 *    pays du site) ; deux articles qui correspondent (« le site français » avec deux sites .fr) : aucun rattachement ;
 *  - `sujetDeNote` : de quoi parle la phrase (dispo, qualité, délai), lu dans SES mots ; rien n'est inventé, un sujet inconnu reste inconnu ;
 *  - `pageSansProduit` : une page lue qui n'a ni prix, ni offre, ni photo, ni dispo, ni caractéristique n'est pas un produit à comparer (frais d'envoi, conditions) ;
 *  - `faitDeNote`, `verificationProposee` : le fait gardé (SES mots tels quels, jamais la réécriture de l'IA) et la vérification proposée (jamais lancée seule).
 * Aucun score de confiance ; « semble » ne devient jamais une certitude : le libellé dit « douteuse », sa phrase est montrée telle quelle.
 */
import type { Article, NoteSurArticle, Origine, SujetNote } from './modele';

const sans = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").toLowerCase();

/** L'article tel que l'IA et le garde le connaissent : de quoi le reconnaître dans une phrase. */
export interface ArticleDesigne { id?: string; nom?: string; vendeur?: string; domaine?: string; pays?: string }

const PAYS_DITS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(francais|francaise|france)\b/, 'fr'], [/\b(suisse|suisses)\b/, 'ch'], [/\b(allemand|allemande|allemagne)\b/, 'de'], [/\b(belge|belges|belgique)\b/, 'be'],
  [/\b(autrichien|autrichienne|autriche)\b/, 'at'], [/\b(italien|italienne|italie)\b/, 'it'], [/\b(anglais|anglaise|britannique|royaume-uni)\b/, 'uk'],
  [/\b(neerlandais|neerlandaise|hollandais|hollandaise|hollande|pays-bas)\b/, 'nl'], [/\b(tcheque|tchequie)\b/, 'cz'], [/\b(polonais|polonaise|pologne)\b/, 'pl'],
  [/\b(espagnol|espagnole|espagne)\b/, 'es'], [/\b(americain|americaine|etats-unis)\b/, 'us']
];
/** Des mots d'adresse qui ne désignent aucun vendeur. */
const BANAL = new Set(['exemple', 'boutique', 'shop', 'store', 'test', 'www', 'online', 'brew', 'brewing', 'pellets']);

/** Le pays d'un site : la fin de son adresse (« .fr »), sinon le pays écrit sur l'article. `.com` ne dit aucun pays. */
function paysDuSite(a: ArticleDesigne): string | undefined {
  const fin = a.domaine ? sans(a.domaine).split('.').pop() : undefined;
  if (fin) return fin === 'gb' ? 'uk' : fin;
  return a.pays ? sans(a.pays).slice(0, 2) : undefined;
}

/** Le passage cité désigne-t-il cet article : son vendeur, un mot de son adresse, ou le pays de son site. */
function designe(citation: string, a: ArticleDesigne): boolean {
  const c = ` ${sans(citation)} `;
  const mot = (m: string) => new RegExp(`(^|[^a-z0-9])${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(c);
  const vendeur = a.vendeur ? sans(a.vendeur).trim() : '';
  if (vendeur.length >= 3 && mot(vendeur)) return true;
  /* les mots de l'adresse, sans sa fin (« .fr ») : « motlerhops-exemple.fr » → motlerhops */
  const jetons = a.domaine ? sans(a.domaine).split(/[^a-z0-9]+/).slice(0, -1).filter(t => t.length >= 4 && !BANAL.has(t)) : [];
  if (jetons.some(mot)) return true;
  const pays = paysDuSite(a);
  return !!pays && PAYS_DITS.some(([re, code]) => code === pays && re.test(sans(citation)));
}

/**
 * N1 : l'article que la note désigne, ou `undefined`. L'`articleId` rendu par l'IA doit être celui d'un article du carnet, la citation doit désigner cet article
 * et lui seul (deux sites français : « le site français » ne choisit pas). Jamais deviné.
 */
export function articleVise(articleId: unknown, citation: string | undefined, articles: readonly ArticleDesigne[] | undefined): string | undefined {
  if (typeof articleId !== 'string' || !citation || citation.trim().length < 3 || !articles?.length) return undefined;
  if (!articles.some(a => a.id === articleId)) return undefined;
  const concernes = articles.filter(a => designe(citation, a));
  return concernes.length === 1 && concernes[0].id === articleId ? articleId : undefined;
}

const DISPO = /\b(stock|dispo|disponib\w*|rupture|epuis\w*|indisponible|introuvable)/;
const DELAI = /\b(livr\w*|delais?|semaines?|jours?|expedi\w*|attente|attendre|arriv\w*|retard\w*)/;
const QUALITE = /\b(event\w*|qualit\w*|fraich\w*|frais|perim\w*|rassis|vieux|moisi\w*|oxyd\w*|abim\w*|mauvais\w*|decevant\w*|odeur|degrad\w*|stale)/;

/** De quoi parle la phrase : la dispo, le délai de livraison, la qualité ; rien de ces trois, rien n'est dit (jamais un sujet inventé). */
export function sujetDeNote(phrase: string): SujetNote | undefined {
  const t = sans(phrase);
  if (DISPO.test(t)) return 'dispo';
  if (DELAI.test(t)) return 'delai';
  if (QUALITE.test(t)) return 'qualite';
  return undefined;
}

/** Ce que dit le fait, en deux ou trois mots, sans verdict (« semble » ne devient jamais « rupture »). */
export const LIBELLE_SUJET: Record<SujetNote, string> = { dispo: 'dispo douteuse', qualite: 'qualité douteuse', delai: 'délai à vérifier' };
export const libelleFait = (f: Pick<NoteSurArticle, 'sujet'>): string => (f.sujet ? LIBELLE_SUJET[f.sujet] : 'à noter');

const PREFIXE_TEST = /^\s*ZZ TEST\s*[—–-]\s*/i;

/** La phrase de SES mots qui porte le passage cité (sans la marque des données de test) ; à défaut, le message. 200 caractères au plus. */
export function phraseDe(message: string, citation: string): string {
  const net = message.replace(PREFIXE_TEST, '').trim();
  const phrases = net.split(/(?<=[.!?])\s+|\r?\n/).map(s => s.trim()).filter(Boolean);
  return (phrases.find(s => s.includes(citation)) ?? net).slice(0, 200);
}

export function faitDeNote(a: { messageId: string; message: string; citation: string; le: string; origine: Origine }): NoteSurArticle {
  const mots = phraseDe(a.message, a.citation);
  const sujet = sujetDeNote(mots);
  return { messageId: a.messageId, mots, le: a.le, ...(sujet ? { sujet } : {}), origine: a.origine };
}

/** N4 : la vérification que la note appelle, dite comme une phrase (jamais lancée seule : une lecture est facturée). La qualité ne se lit pas sur une page : rien. */
export function verificationProposee(sujet: SujetNote | undefined, article: Pick<Article, 'vendeur' | 'domaine' | 'nom' | 'url'>): string | undefined {
  const chez = article.vendeur?.trim() || article.domaine?.trim() || article.nom?.trim();
  if (!chez || !article.url) return undefined;
  if (sujet === 'dispo') return `Vérifier la dispo chez ${chez}`;
  if (sujet === 'delai') return `Vérifier le délai chez ${chez}`;
  return undefined;
}

/** Une page lue sans produit : ni prix, ni offre, ni photo, ni disponibilité, ni caractéristique. Frais d'envoi, conditions de vente, guide : jamais un article à comparer (N5). */
export function pageSansProduit(p: { statut?: string; prix?: number; prixUnite?: unknown; offres?: readonly unknown[]; conditionnement?: unknown; dispo?: string; photo?: string; photos?: readonly string[]; valeurs?: readonly unknown[] } | undefined): boolean {
  if (!p || p.statut !== 'lue') return false;
  return p.prix === undefined && !p.prixUnite && !p.offres?.length && !p.conditionnement && !p.dispo && !p.photo && !p.photos?.length && !p.valeurs?.length;
}

/** Le site d'une page, sans « www. » : ce qui relie une page du vendeur à ses articles (N5). */
export const siteDe = (domaine: string | undefined): string => (domaine ?? '').trim().toLowerCase().replace(/^www\./, '');
