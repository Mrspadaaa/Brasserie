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
