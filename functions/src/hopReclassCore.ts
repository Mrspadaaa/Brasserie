// Re-classement des substituts par l'IA : l'invite, le schéma, la lecture de la réponse. Module PUR (aucun import de Firebase) :
// il est partagé par le callable `hopReclasserIA` (functions/src/hopReclasserIA.ts) et par l'essai hors `npm test`
// `scripts/eval-hop/ia-reclassement.ts` (voie ia1), qui le réemploie sans le copier. Le texte de l'invite et la règle de lecture
// sont ceux que l'essai a mesurés (ia1, ia2 ; version `v1`) : les changer, c'est refaire l'essai.
//
// Le moteur garde la liste : le modèle reçoit les 20 premiers candidats du moteur, avec leurs fiches courtes, et rend l'ordre
// des 10 premiers avec une phrase par choix. Il ne donne aucun score.

export const PROMPT_VERSION = 'v1';
export const TAILLE_POOL = 20;
export const TAILLE_REPONSE = 10;

export const SYSTEME = [
  'Tu es un brasseur artisanal expert des houblons. Un brasseur veut remplacer un houblon par un autre, à un moment précis de son brassin.',
  `Tu reçois la fiche du houblon à remplacer et ${TAILLE_POOL} candidats présélectionnés par un moteur de calcul, listés dans l'ordre du moteur (c01 = le plus proche selon lui). Choisis les ${TAILLE_REPONSE} meilleurs remplaçants parmi ces ${TAILLE_POOL} candidats seulement, du meilleur au dixième, avec une phrase par choix.`,
  'Juge comme un brasseur, dans cet ordre :',
  '1. Les arômes perçus (les mots des fiches), y compris ceux qu\'aucune famille classique ne range (vin blanc, groseille à maquereau, sauvignon blanc, mojito, noix de coco…). Un houblon qui sent autre chose n\'est pas un substitut, même avec le même α.',
  '2. Le rôle au moment donné. À 60 minutes d\'ébullition, seule l\'amertume compte vraiment : α, cohumulone, finesse de l\'amertume ; l\'arôme est perdu à la chaleur. En dry hop, l\'arôme et les huiles priment ; l\'α est secondaire.',
  '3. Les huiles (myrcène, humulène, caryophyllène, farnésène, linalol) et la classe thiol, qui disent le caractère quand les mots sont rares.',
  '4. L\'usage déclaré (aroma, dual, bittering) : un amérisant neutre ne remplace pas un houblon d\'arôme au dry hop.',
  'Règles : l\'ordre du moteur est une indication, pas une vérité : il se trompe quand une fiche est creuse ou que les mots sont hors des familles ; corrige-le quand ton jugement de brasseur le demande, sans le suivre ni le contredire par principe. « inconnu » veut dire que la donnée manque, pas qu\'elle vaut zéro : ne pénalise pas et ne favorise pas sur cette base. Ne choisis qu\'un identifiant (c01 à c20) donné dans la liste, une seule fois. Chaque phrase tient en 25 mots au plus, en français, et dit ce qui rapproche et ce qui sépare du houblon d\'origine.',
].join('\n');

export const SCHEMA = {
  type: 'OBJECT',
  properties: { classement: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, phrase: { type: 'STRING' } }, required: ['id', 'phrase'], propertyOrdering: ['id', 'phrase'] } } },
  required: ['classement'],
};
export const GENERATION = { temperature: 0, maxOutputTokens: 4000, thinkingLevel: 'low' };

// ---------- La fiche courte d'un houblon ----------
export type Plage = [number, number] | null;
/** Ce que le modèle lit d'un houblon : mots, α, usage, huiles. `null` : la donnée manque (jamais 0). */
export interface FicheCourte {
  nom: string; origine: string | null; usage: string | null;
  alpha: Plage; beta: Plage; cohumulone: Plage; huile: Plage;
  myrcene: Plage; humulene: Plage; caryophyllene: Plage; farnesene: Plage; linalol: Plage;
  thiol: string | null; mots: string[];
}
/** Ce que la fiche du catalogue (CatalogueHop) offre : typage structurel, pour ne rien importer de `src/`. */
export interface FicheCatalogue {
  name: string; origin: string | null; purpose?: string | null;
  alpha: Plage; beta: Plage; cohumulone?: Plage; oil: Plage;
  oils: { myrcene: Plage; humulene: Plage; caryophyllene: Plage; farnesene?: Plage };
  hsLinalool: { range: [number, number] } | null; hsThiol: { class: string } | null; tagsFr: string[];
}
export function ficheDeCatalogue(h: FicheCatalogue): FicheCourte {
  return {
    nom: h.name, origine: h.origin, usage: h.purpose ?? null,
    alpha: h.alpha, beta: h.beta, cohumulone: h.cohumulone ?? null, huile: h.oil,
    myrcene: h.oils.myrcene, humulene: h.oils.humulene, caryophyllene: h.oils.caryophyllene, farnesene: h.oils.farnesene ?? null,
    linalol: h.hsLinalool?.range ?? null, thiol: h.hsThiol?.class ?? null, mots: h.tagsFr,
  };
}

const plage = (r: Plage | undefined, unite = '') => (r ? `${r[0] === r[1] ? r[0] : `${r[0]}–${r[1]}`}${unite}` : 'inconnu');
const virgule = (s: string) => s.replace(/(\d)\.(\d)/g, '$1,$2');
export function ficheTexte(f: FicheCourte, etiquette: string): string {
  const parts = [
    `${etiquette} · ${f.nom} (${f.origine ?? 'origine inconnue'})`,
    `usage ${f.usage ?? 'inconnu'}`,
    `α ${plage(f.alpha, ' %')}`, `β ${plage(f.beta, ' %')}`, `cohumulone ${plage(f.cohumulone, ' % des α')}`,
    `huile totale ${plage(f.huile, ' mL/100 g')}`,
    `myrcène ${plage(f.myrcene, ' %')}`, `humulène ${plage(f.humulene, ' %')}`, `caryophyllène ${plage(f.caryophyllene, ' %')}`, `farnésène ${plage(f.farnesene, ' %')}`,
    `linalol (Hopsteiner) ${plage(f.linalol, ' % de l\'huile')}`,
    `thiol (Hopsteiner) ${f.thiol ? 'classe ' + f.thiol : 'inconnu'}`,
    `mots : ${f.mots.length ? f.mots.join(', ') : 'aucun'}`,
  ];
  return virgule(parts.join(' · ') + ' (huiles en % de l\'huile totale)');
}

// ---------- Le moment ----------
/** Les moments que l'écran sait dire. `ebullition` : minutes avant la fin ; `premierMout` : ébullition longue, l'amertume prime. */
export type MomentIA = { type: 'ebullition'; minutes: number } | { type: 'premierMout' } | { type: 'whirlpool' } | { type: 'dryhop' };
/** Les deux libellés de l'essai (dry hop actif, 60′) sont gardés mot pour mot ; les autres moments sont dits dans la même forme. */
export function libelleMoment(m: MomentIA): string {
  if (m.type === 'dryhop') return 'dry hop, en fermentation active (l\'arôme prime)';
  if (m.type === 'whirlpool') return 'whirlpool (l\'arôme et les huiles comptent, l\'amertume est secondaire)';
  if (m.type === 'premierMout') return 'premier moût, ébullition complète (l\'amertume prime)';
  return m.minutes >= 30 ? `ébullition de ${m.minutes} minutes (l'amertume prime)` : `ébullition de ${m.minutes} minutes (l'amertume prime, un peu d'arôme)`;
}

// ---------- La requête ----------
export const identifiant = (i: number) => `c${String(i + 1).padStart(2, '0')}`;
/** Le message de l'utilisateur : le moment, la fiche de l'original, les candidats dans l'ordre du moteur (c01, c02…). */
export function construireInvite(moment: MomentIA, original: FicheCourte, candidats: FicheCourte[]): string {
  return [`Moment du houblon à remplacer : ${libelleMoment(moment)}.`, '', "Houblon à remplacer (huiles en % de l'huile totale ; « inconnu » : donnée absente) :", ficheTexte(original, 'à remplacer'), '',
    `Candidats (ordre du moteur) :`, ...candidats.map((f, i) => ficheTexte(f, identifiant(i))), '',
    `Rends le classement des ${TAILLE_REPONSE} meilleurs remplaçants (identifiants c01 à c${String(TAILLE_POOL).padStart(2, '0')}), du meilleur au dixième, avec une phrase chacun.`].join('\n');
}
/** Le corps envoyé à Gemini : celui de l'essai (JSON imposé par le schéma, température 0, réflexion basse). */
export function corpsRequete(user: string) {
  return {
    systemInstruction: { parts: [{ text: SYSTEME }] }, contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: GENERATION.temperature, maxOutputTokens: GENERATION.maxOutputTokens, thinkingConfig: { thinkingLevel: GENERATION.thinkingLevel } },
  };
}

// ---------- Lecture d'une réponse ----------
export interface Analyse { valide: boolean; ordre: string[]; phrases: Record<string, string>; erreurs: string[]; avertissements?: string[] }
/** Un classement valide : 10 identifiants distincts, tous dans la liste donnée, chacun avec une phrase non vide. Au-delà de la
 * dixième, les entrées sont ignorées (l'app garderait les 10 premières) et signalées. Une réponse invalide n'est jamais corrigée :
 * elle est refusée. `ids` : les identifiants c01… donnés au modèle. */
export function analyserReponse(texte: string | undefined, ids: readonly string[]): Analyse {
  const erreurs: string[] = [], permis = new Set(ids);
  let json: any;
  try { json = JSON.parse(String(texte ?? '').replace(/```json/g, '').replace(/```/g, '').trim()); } catch { return { valide: false, ordre: [], phrases: {}, erreurs: ['JSON illisible'] }; }
  const toutes: any[] = Array.isArray(json?.classement) ? json.classement : [];
  const liste = toutes.slice(0, TAILLE_REPONSE), avertissements = toutes.length > TAILLE_REPONSE ? [`${toutes.length} entrées : les ${toutes.length - TAILLE_REPONSE} dernière(s) ignorée(s)`] : [];
  if (!liste.length) erreurs.push('classement absent');
  const ordre: string[] = [], phrases: Record<string, string> = {};
  for (const x of liste) {
    const id = typeof x?.id === 'string' ? x.id.trim().toLowerCase() : '';
    if (!permis.has(id)) { erreurs.push(`identifiant hors liste : ${String(x?.id).slice(0, 12)}`); continue; }
    if (ordre.includes(id)) { erreurs.push(`identifiant en double : ${id}`); continue; }
    ordre.push(id); phrases[id] = typeof x.phrase === 'string' ? x.phrase.trim() : '';
    if (!phrases[id]) erreurs.push(`phrase vide : ${id}`);
  }
  if (liste.length !== TAILLE_REPONSE) erreurs.push(`${liste.length} entrées au lieu de ${TAILLE_REPONSE}`);
  return { valide: erreurs.length === 0 && ordre.length === TAILLE_REPONSE, ordre, phrases, erreurs, ...(avertissements.length ? { avertissements } : {}) };
}

// ---------- L'entrée du callable : lue, bornée, jamais crue ----------
export interface EntreeReclassement { moment: MomentIA; original: FicheCourte; candidats: { id: string; fiche: FicheCourte }[] }
const MAX_TEXTE = 120, MAX_MOTS = 40;
const texteBorne = (v: unknown, nul = false): string | null => {
  if (v == null && nul) return null;
  if (typeof v !== 'string' || !v.trim() || v.length > MAX_TEXTE) throw new Error('texte invalide');
  return v.trim();
};
const plageLue = (v: unknown): Plage => {
  if (v == null) return null;
  if (!Array.isArray(v) || v.length !== 2 || !v.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1000)) throw new Error('plage invalide');
  return [v[0], v[1]];
};
function ficheLue(v: any): FicheCourte {
  if (!v || typeof v !== 'object') throw new Error('fiche absente');
  if (!Array.isArray(v.mots) || v.mots.length > MAX_MOTS) throw new Error('mots invalides');
  return {
    nom: texteBorne(v.nom)!, origine: texteBorne(v.origine, true), usage: texteBorne(v.usage, true),
    alpha: plageLue(v.alpha), beta: plageLue(v.beta), cohumulone: plageLue(v.cohumulone), huile: plageLue(v.huile),
    myrcene: plageLue(v.myrcene), humulene: plageLue(v.humulene), caryophyllene: plageLue(v.caryophyllene), farnesene: plageLue(v.farnesene), linalol: plageLue(v.linalol),
    thiol: texteBorne(v.thiol, true), mots: v.mots.map((m: unknown) => texteBorne(m)!),
  };
}
function momentLu(v: any): MomentIA {
  if (v?.type === 'whirlpool' || v?.type === 'dryhop' || v?.type === 'premierMout') return { type: v.type };
  if (v?.type === 'ebullition' && Number.isInteger(v.minutes) && v.minutes >= 0 && v.minutes <= 240) return { type: 'ebullition', minutes: v.minutes };
  throw new Error('moment invalide');
}
/** Lève une Error au message lisible si l'entrée n'est pas celle qu'on attend : 10 à 20 candidats, des identifiants distincts. */
export function lireEntree(data: unknown): EntreeReclassement {
  const d = data as any;
  if (!d || typeof d !== 'object' || !Array.isArray(d.candidats)) throw new Error('entrée absente');
  if (d.candidats.length < TAILLE_REPONSE || d.candidats.length > TAILLE_POOL) throw new Error(`il faut ${TAILLE_REPONSE} à ${TAILLE_POOL} candidats`);
  const vus = new Set<string>();
  const candidats = d.candidats.map((c: any) => {
    const id = texteBorne(c?.id)!;
    if (vus.has(id)) throw new Error('identifiant de candidat en double');
    vus.add(id);
    return { id, fiche: ficheLue(c?.fiche) };
  });
  return { moment: momentLu(d.moment), original: ficheLue(d.original), candidats };
}

// =====================================================================================================================
// MODE « SUGGÉRER » (voie ia3, `suggerer-v1`). Une invite NEUVE : celle de Substituer (`v1`, figée par un test d'identité sur
// 78 messages) ne bouge pas. Ici il n'y a pas d'original à remplacer : le brasseur veut AJOUTER un houblon pour une demande
// (« plus d'agrumes », d'un cran), à un moment, dans un style, à une recette. Le moteur garde la liste, les scores et les barres ;
// l'IA ne rend que l'ORDRE de tous les candidats donnés et une phrase courte par candidat.
//
// Taille du pool : 30. Elle doit couvrir les houblons du brasseur quand ils sont dans les 30 premiers du moteur (m9, neipa v3, dry
// hop actif, agrumes : Mosaic 10e, Idaho 7 11e, Mandarina 18e, Pacific Jade 27e), donc 20 ne suffit pas. Coût : ~150 jetons par
// fiche, soit ~5 k jetons d'entrée et ~1,3 k de sortie : de l'ordre de 0,001 à 0,002 CHF en Flash-Lite (mesuré dans l'essai réel).
// La latence suit la sortie : phrases courtes (18 mots) pour tenir près de la fenêtre de 3 s de l'écran.
// =====================================================================================================================
export const PROMPT_VERSION_SUGGERER = 'suggerer-v1';
export const TAILLE_POOL_SUGGERER = 30;
export const MIN_POOL_SUGGERER = 10;
/** Les phrases ne servent qu'aux rangées montrées (3 à 14 par groupe) : seuls les 10 premiers du classement en ont une. Mesuré (essai réel, 4 appels, 29 candidats) :
 * une phrase par candidat = 1 150 à 1 260 jetons de sortie et 3,5 à 4,7 s, donc hors de la fenêtre de 3 s de l'écran (l'ordre n'est plus appliqué tout seul). */
export const PHRASES_SUGGERER = 10;

export const SYSTEME_SUGGERER = [
  'Tu es un brasseur artisanal expert des houblons. Un brasseur veut AJOUTER un houblon à sa bière pour pousser un arôme, à un moment précis du brassin.',
  `Tu reçois le style, la recette en bref, la demande du brasseur, puis des candidats présélectionnés par un moteur de calcul, listés dans l'ordre du moteur (c01 = le premier selon lui). Classe TOUS les candidats donnés, du meilleur au dernier. Écris une phrase pour chacun des ${PHRASES_SUGGERER} premiers seulement ; pour les suivants, la phrase est vide ("").`,
  'Juge comme un brasseur, dans cet ordre :',
  '1. La demande : l\'arôme visé, tel qu\'il sera perçu à ce moment. Lis les mots des fiches, y compris ceux qu\'aucune famille classique ne range (vin blanc, groseille à maquereau, sauvignon blanc, mojito, noix de coco…).',
  '2. Le style : ce qui est typé pour ce style. Tu peux t\'appuyer sur ton savoir du style (par exemple ce qui fait une IPA, une stout ou une saison) ; un houblon hors de l\'esprit du style passe après.',
  '3. Le moment : à 60 minutes, seule l\'amertume compte ; à 10 minutes et au whirlpool, l\'arôme et les huiles comptent, l\'amertume est secondaire ; en dry hop, l\'arôme et les huiles priment, et pendant la fermentation active la levure peut en transformer certains composés.',
  '4. La recette : ce qu\'elle contient déjà. Complète-la plutôt que de la doubler.',
  '5. Les huiles (myrcène, humulène, caryophyllène, farnésène, linalol) et la classe thiol, qui disent le caractère quand les mots sont rares ; l\'usage déclaré (aroma, dual, bittering).',
  'Règles : l\'ordre du moteur est une indication, pas une vérité : il se trompe quand une fiche est creuse ou que les mots sont hors des familles ; corrige-le quand ton jugement de brasseur le demande, sans le suivre ni le contredire par principe. « inconnu » veut dire que la donnée manque, pas qu\'elle vaut zéro : ne pénalise pas et ne favorise pas sur cette base. Ne cite qu\'un identifiant (c01, c02…) donné dans la liste, une seule fois, et tous les identifiants donnés.',
  'Chaque phrase : en français, 18 mots au plus, ce que ce houblon apporte à CETTE demande dans CE style. Elle ne contient AUCUN chiffre qui ne soit pas écrit dans le message : tu peux t\'appuyer sur ton savoir du style, mais tu n\'inventes jamais de valeur chiffrée. Elle ne cite jamais un identifiant cNN, et elle n\'emploie aucun mot d\'appréciation (« excellent », « parfait », « parfaitement », « idéal ») : elle dit pourquoi.',
].join('\n');
export const GENERATION_SUGGERER = { temperature: 0, maxOutputTokens: 6000, thinkingLevel: 'low' };

/** Les moments de Suggérer. `dryhop.phase` : pendant la fermentation active, ou après. */
export type MomentSuggerer = { type: 'ebullition'; minutes: number } | { type: 'premierMout' } | { type: 'whirlpool' } | { type: 'dryhop'; phase: 'actif' | 'apres' };
export function libelleMomentSuggerer(m: MomentSuggerer): string {
  if (m.type === 'dryhop') return m.phase === 'actif' ? 'dry hop pendant la fermentation active (l\'arôme et les huiles priment ; la levure peut transformer certains composés)' : 'dry hop après la fermentation (l\'arôme et les huiles priment ; pas de biotransformation)';
  return libelleMoment(m);
}
export interface EntreeSuggerer {
  mode: 'suggerer';
  style: { code: string; nom: string };
  recette: { og: number | null; ibu: number | null; volumeL: number | null; houblons: { nom: string; grammes: number; moment: string }[] };
  /** « plus d'agrumes », d'un cran : `crans` est un entier de 1 à 3, `sens` +1 (plus) ou −1 (moins). */
  demande: { objectifs: { famille: string; sens: 1 | -1; crans: number }[]; moment: MomentSuggerer };
  candidats: { id: string; fiche: FicheCourte }[];
}

const nombreFr = (n: number | null | undefined, unite = '') => (n == null ? 'inconnu' : `${String(Math.round(n * 1000) / 1000).replace('.', ',')}${unite}`);
/** Le message de l'utilisateur du mode « suggérer » : le style, la recette, la demande, les candidats dans l'ordre du moteur (c01, c02…). */
export function construireInviteSuggerer(e: EntreeSuggerer): string {
  const cran = (c: number) => (c === 1 ? 'd\'un cran' : `de ${c} crans`);
  const de = (f: string) => (/^[aeiouyhéèêâî]/i.test(f) ? `d'${f}` : `de ${f}`);
  const objectifs = e.demande.objectifs.map((o) => `${o.sens > 0 ? 'plus' : 'moins'} ${de(o.famille)} (${cran(o.crans)})`).join(' ; ');
  const houblons = e.recette.houblons.length ? e.recette.houblons.map((h) => `${h.nom} ${nombreFr(h.grammes, ' g')} (${h.moment})`).join(' ; ') : 'aucun';
  return [
    `Style : ${e.style.nom} (${e.style.code}).`,
    `Recette : OG ${nombreFr(e.recette.og)} · IBU ${nombreFr(e.recette.ibu)} · ${nombreFr(e.recette.volumeL, ' L')} · houblons déjà là : ${houblons}.`,
    `Demande du brasseur : ${objectifs}. Moment visé : ${libelleMomentSuggerer(e.demande.moment)}.`,
    '',
    "Candidats (ordre du moteur ; huiles en % de l'huile totale ; « inconnu » : donnée absente) :",
    ...e.candidats.map((c, i) => ficheTexte(c.fiche, identifiant(i))), '',
    `Rends le classement des ${e.candidats.length} candidats (identifiants c01 à c${String(e.candidats.length).padStart(2, '0')}), tous, du meilleur au dernier, avec une phrase pour chacun des ${PHRASES_SUGGERER} premiers.`,
  ].join('\n');
}
export function corpsRequeteSuggerer(user: string) {
  return {
    systemInstruction: { parts: [{ text: SYSTEME_SUGGERER }] }, contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: GENERATION_SUGGERER.temperature, maxOutputTokens: GENERATION_SUGGERER.maxOutputTokens, thinkingConfig: { thinkingLevel: GENERATION_SUGGERER.thinkingLevel } },
  };
}

const NOMBRES = /\d+(?:[.,]\d+)?/g;
const normaliser = (s: string) => s.replace(/,/g, '.');
/** Les nombres d'une phrase qui ne sont pas dans le message : une valeur inventée. Un identifiant cNN cité compte aussi. */
export function chiffresInventes(phrase: string, message: string): string[] {
  const permis = new Set((message.match(NOMBRES) ?? []).map(normaliser));
  const sansId = phrase.replace(/\bc\d{1,2}\b/gi, ' ');
  const inventes = (sansId.match(NOMBRES) ?? []).map(normaliser).filter((n) => !permis.has(n));
  return /\bc\d{1,2}\b/i.test(phrase) ? [...inventes, 'identifiant'] : inventes;
}
/** Ce qu'une phrase a le droit de citer : le contexte (style, recette, demande) et la ligne de SON candidat, pas celles des autres :
 * une valeur de la fiche d'un voisin, attribuée à ce candidat, est une valeur inventée pour lui. */
export function contexteDe(message: string, id: string): string {
  const fin = message.indexOf('Candidats (');
  const ligne = message.split('\n').find((l) => l.startsWith(`${id} · `)) ?? '';
  return `${fin < 0 ? '' : message.slice(0, fin)}\n${ligne}`;
}
export interface AnalyseSuggerer { valide: boolean; ordre: string[]; phrases: Record<string, string>; erreurs: string[]; retirees: string[] }
/** Un classement valide range TOUS les candidats donnés, une fois chacun, tous dans la liste, chacun avec une phrase. Jamais corrigé : refusé
 * sinon. Une phrase qui contient une valeur chiffrée absente du message (ou un identifiant) est RETIRÉE (l'ordre reste, la rangée n'a pas
 * de phrase) : l'IA ne dit jamais un chiffre qu'on ne lui a pas donné. `ids` : c01… donnés ; `message` : l'invite envoyée. */
export function analyserReponseSuggerer(texte: string | undefined, ids: readonly string[], message: string): AnalyseSuggerer {
  const erreurs: string[] = [], retirees: string[] = [], permis = new Set(ids);
  let json: any;
  try { json = JSON.parse(String(texte ?? '').replace(/```json/g, '').replace(/```/g, '').trim()); } catch { return { valide: false, ordre: [], phrases: {}, erreurs: ['JSON illisible'], retirees }; }
  const liste: any[] = Array.isArray(json?.classement) ? json.classement : [];
  if (!liste.length) erreurs.push('classement absent');
  const ordre: string[] = [], phrases: Record<string, string> = {};
  for (const x of liste) {
    const id = typeof x?.id === 'string' ? x.id.trim().toLowerCase() : '';
    if (!permis.has(id)) { erreurs.push(`identifiant hors liste : ${String(x?.id).slice(0, 12)}`); continue; }
    if (ordre.includes(id)) { erreurs.push(`identifiant en double : ${id}`); continue; }
    ordre.push(id);
    const phrase = typeof x.phrase === 'string' ? x.phrase.trim() : '';
    // Les PHRASES_SUGGERER premiers ont une phrase ; après, une phrase vide est permise (elle n'est jamais montrée).
    if (!phrase) { if (ordre.length <= PHRASES_SUGGERER) erreurs.push(`phrase vide : ${id}`); continue; }
    if (chiffresInventes(phrase, contexteDe(message, id)).length) retirees.push(id); else phrases[id] = phrase;
  }
  if (ordre.length !== ids.length) erreurs.push(`${ordre.length} candidats rangés sur ${ids.length}`);
  return { valide: erreurs.length === 0, ordre, phrases, erreurs, retirees };
}

const nombreLu = (v: unknown, min: number, max: number, nul = false): number | null => {
  if (v == null && nul) return null;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error('nombre invalide');
  return v;
};
function momentSuggererLu(v: any): MomentSuggerer {
  if (v?.type === 'whirlpool' || v?.type === 'premierMout') return { type: v.type };
  if (v?.type === 'dryhop' && (v.phase === 'actif' || v.phase === 'apres')) return { type: 'dryhop', phase: v.phase };
  if (v?.type === 'ebullition' && Number.isInteger(v.minutes) && v.minutes >= 0 && v.minutes <= 240) return { type: 'ebullition', minutes: v.minutes };
  throw new Error('moment invalide');
}
/** Lève une Error au message lisible si l'entrée n'est pas celle qu'on attend : 10 à 30 candidats, des identifiants distincts, des textes et nombres bornés. */
export function lireEntreeSuggerer(data: unknown): EntreeSuggerer {
  const d = data as any;
  if (!d || typeof d !== 'object' || !Array.isArray(d.candidats) || d.mode !== 'suggerer') throw new Error('entrée absente');
  if (d.candidats.length < MIN_POOL_SUGGERER || d.candidats.length > TAILLE_POOL_SUGGERER) throw new Error(`il faut ${MIN_POOL_SUGGERER} à ${TAILLE_POOL_SUGGERER} candidats`);
  const vus = new Set<string>();
  const candidats = d.candidats.map((c: any) => {
    const id = texteBorne(c?.id)!;
    if (vus.has(id)) throw new Error('identifiant de candidat en double');
    vus.add(id);
    return { id, fiche: ficheLue(c?.fiche) };
  });
  if (!d.style || typeof d.style !== 'object' || !d.recette || typeof d.recette !== 'object' || !d.demande || typeof d.demande !== 'object') throw new Error('style, recette ou demande absents');
  if (!Array.isArray(d.recette.houblons) || d.recette.houblons.length > 12) throw new Error('houblons de la recette invalides');
  if (!Array.isArray(d.demande.objectifs) || d.demande.objectifs.length < 1 || d.demande.objectifs.length > 4) throw new Error('objectifs invalides');
  return {
    mode: 'suggerer',
    style: { code: texteBorne(d.style.code)!, nom: texteBorne(d.style.nom)! },
    recette: {
      og: nombreLu(d.recette.og, 1, 1.3, true), ibu: nombreLu(d.recette.ibu, 0, 300, true), volumeL: nombreLu(d.recette.volumeL, 1, 10000, true),
      houblons: d.recette.houblons.map((h: any) => ({ nom: texteBorne(h?.nom)!, grammes: nombreLu(h?.grammes, 0, 100000)!, moment: texteBorne(h?.moment)! })),
    },
    demande: {
      objectifs: d.demande.objectifs.map((o: any) => {
        if (o?.sens !== 1 && o?.sens !== -1) throw new Error('sens invalide');
        if (!Number.isInteger(o?.crans) || o.crans < 1 || o.crans > 3) throw new Error('crans invalides');
        return { famille: texteBorne(o.famille)!, sens: o.sens as 1 | -1, crans: o.crans as number };
      }),
      moment: momentSuggererLu(d.demande.moment),
    },
    candidats,
  };
}
