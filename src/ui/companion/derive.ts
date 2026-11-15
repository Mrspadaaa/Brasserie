/**
 * Règles de dérivation du compagnon (maquette p2a, « Tout se lit sans lire »).
 *
 * Tout ce que l'écran montre en forme (feu, barres avant → après, jauge de durée, étapes, relecture, statuts)
 * vient d'ici, à partir de champs réels du serveur : `advice.level`, les changements d'une proposition, le mode,
 * `job.stage`, `reviewed`/`reviewModel`/preuves, le budget, les jobs. Aucun nom de modèle n'en sort : les modèles
 * restent enregistrés côté serveur, jamais affichés (DESIGN.md).
 */
import type { BrewerMode, BrewerTurn } from '../../../functions/src/companionTypes';
import { nombreFr } from '../../domain/nombreAffiche';

/** Espace insécable : un nombre et son unité ne se séparent jamais. */
export const NBSP = ' ';

// ---------- Feu du niveau ----------

export type Niveau = 'info' | 'attention' | 'urgent';
export interface Feu {
  niveau: Niveau;
  libelle: 'Info' | 'Attention' | 'Urgent';
  /** Lampe allumée, de haut en bas : rouge (urgent), ambre (attention), vert (info). */
  allume: 'haut' | 'milieu' | 'bas';
}
/** `advice.level` → feu. Un niveau inconnu se lit « attention » : l'inconnu n'est jamais « tout va bien ». */
export function feuDuNiveau(level: string | undefined): Feu {
  if (level === 'urgent') return { niveau: 'urgent', libelle: 'Urgent', allume: 'haut' };
  if (level === 'info') return { niveau: 'info', libelle: 'Info', allume: 'bas' };
  return { niveau: 'attention', libelle: 'Attention', allume: 'milieu' };
}

// ---------- Modes ----------

export const MODES: Array<{ value: BrewerMode; label: string; pips: 1 | 2 | 3; duree: string }> = [
  { value: 'fast', label: 'Rapide', pips: 1, duree: 'quelques s' },
  { value: 'auto', label: 'Auto', pips: 2, duree: '15 à 30 s' },
  { value: 'deep', label: 'Approfondi', pips: 3, duree: '1 à 3 min' }
];
export const modeInfo = (mode: BrewerMode | undefined) => MODES.find((m) => m.value === mode) ?? MODES[1];

/** Mode conseillé pour une question suggérée : les sujets lourds en Approfondi, les courtes en Rapide, le reste en Auto. */
export function modeConseille(question: string): BrewerMode {
  if (/achat|investiss|ann[ée]e|annuel|incoh[ée]rence|v[ée]rifie/i.test(question)) return 'deep';
  return question.trim().length <= 34 ? 'fast' : 'auto';
}

// ---------- Jauge de durée ----------

/** Borne serveur : le traitement s'arrête à 220 s (3:40), dans les trois modes (docs/compagnon-brasseur.md). */
export const BORNE_SERVEUR_S = 220;
/** Durée habituelle, en secondes. Auto et Approfondi : 15–30 s et 1–3 min (maquette). Rapide : « quelques s », estimé 3–15 s. */
export const HABITUEL_S: Record<BrewerMode, [number, number]> = { fast: [3, 15], auto: [15, 30], deep: [60, 180] };

export const dureeTexte = (secondes: number): string => {
  const s = Math.max(0, Math.floor(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
export interface Jauge {
  /** Part écoulée de la borne, 0 à 100. */
  fait: number;
  habituelDebut: number;
  habituelLargeur: number;
  texte: string;
  statut: 'en route' | 'dans l’habituel' | 'plus long que d’habitude' | 'proche de l’arrêt';
}
export function jaugeDuree(mode: BrewerMode, secondes: number): Jauge {
  const s = Math.max(0, secondes);
  const [debut, fin] = HABITUEL_S[mode];
  const pct = (x: number) => Math.min(100, Math.max(0, (x / BORNE_SERVEUR_S) * 100));
  const statut = s < debut ? 'en route' : s <= fin ? 'dans l’habituel' : s <= BORNE_SERVEUR_S - 20 ? 'plus long que d’habitude' : 'proche de l’arrêt';
  return { fait: pct(s), habituelDebut: pct(debut), habituelLargeur: pct(fin) - pct(debut), texte: dureeTexte(s), statut };
}
export const habituelTexte = (mode: BrewerMode): string => {
  const [a, b] = HABITUEL_S[mode];
  return `${dureeTexte(a)}–${dureeTexte(b)}`;
};

// ---------- Étapes de l'attente ----------

/** Les étapes que `job.stage` permet de lire. « Rédiger » n'a pas d'étape serveur propre : elle n'est pas montrée. */
export const ETAPES = ['Lire', 'Calculer', 'Sources', 'Relire'] as const;
/** `-1` : une nouvelle tentative ne dit rien de l'avancement, on garde le dernier point connu. */
export function etapeIndex(stage: string | undefined): number {
  switch (stage) {
    case 'queued':
    case 'context':
      return 0;
    case 'analysis':
    case 'tools':
      return 1;
    case 'research':
      return 2;
    case 'review':
    case 'repair':
    case 'saving':
      return 3;
    default:
      return -1;
  }
}
export type EtatEtape = 'fait' | 'en-cours' | 'a-venir' | 'rompu';
export function etatsEtapes(courante: number, rompu = false): EtatEtape[] {
  return ETAPES.map((_, i) => (i < courante ? 'fait' : i === courante ? (rompu ? 'rompu' : 'en-cours') : 'a-venir'));
}
const ETAPE_TEXTE: Record<string, string> = {
  queued: 'Question enregistrée · en attente',
  context: 'Lecture de ta recette et de ton matériel',
  analysis: 'Analyse de ta question',
  tools: 'Vérification avec les outils',
  research: 'Recherche sur le web',
  review: 'Relecture du conseil',
  repair: 'Correction après relecture',
  saving: 'Enregistrement de la réponse',
  retry: 'Nouvelle tentative automatique'
};
export const etapeTexte = (stage: string | undefined): string => ETAPE_TEXTE[stage ?? ''] ?? 'Traitement en cours';

// ---------- Barres avant → après ----------

export type Barre =
  | { genre: 'carres'; avant: number; apres: number; total: number }
  | { genre: 'echelle'; min: number; max: number; avant: number; apres: number; graduations: number[] }
  | { genre: 'barre'; avantPct: number; apresPct: number }
  | { genre: 'texte' };

const nombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
/**
 * Représente un changement numérique avant → après. Jours entiers : carrés ; températures : échelle graduée ;
 * autres nombres : barre. Un champ non numérique reste en texte (`texte`) : rien ne s'invente.
 */
export function barreAvantApres(avant: unknown, apres: unknown, unite = ''): Barre {
  if (!nombre(avant) || !nombre(apres) || avant < 0 !== apres < 0) return { genre: 'texte' };
  const u = unite.trim().toLowerCase();
  if (/^(j|jours?)$/.test(u) && Number.isInteger(avant) && Number.isInteger(apres) && Math.max(avant, apres) <= 10)
    return { genre: 'carres', avant, apres, total: Math.max(avant, apres) };
  if (/°\s*c/i.test(u)) {
    const bas = Math.min(avant, apres), haut = Math.max(avant, apres);
    const min = Math.floor((bas - 2) / 5) * 5, max = Math.max(min + 5, Math.ceil((haut + 1) / 5) * 5);
    const graduations: number[] = [];
    for (let g = min; g <= max; g += 1) graduations.push(g);
    return { genre: 'echelle', min, max, avant, apres, graduations };
  }
  const max = Math.max(Math.abs(avant), Math.abs(apres));
  if (max === 0) return { genre: 'texte' };
  return { genre: 'barre', avantPct: (Math.abs(avant) / max) * 100, apresPct: (Math.abs(apres) / max) * 100 };
}
/** Un nombre à la française, virgule décimale, sans zéros inutiles. */
export const nombreTexte = (v: number): string => {
  const s = nombreFr(v, 2);
  return s.includes(',') ? s.replace(/0+$/, '').replace(/,$/, '') : s;
};

// ---------- Relecture, sans nom de modèle ----------

export interface Relecture {
  relu: 'relu deux fois' | 'relu' | null;
  calculs: boolean;
  sources: number;
}
type TourRelecture = Pick<BrewerTurn, 'reviewed' | 'reviewModel' | 'evidence'>;
/** « relu deux fois » : relu ET une seconde passe enregistrée (`reviewModel` présent) ; le nom du modèle n'est jamais lu. */
export function libellesRelecture(turn: TourRelecture): Relecture {
  const relu = turn.reviewed ? (turn.reviewModel ? 'relu deux fois' : 'relu') : null;
  const sources = new Set<string>();
  for (const e of turn.evidence ?? []) for (const s of e.sources ?? []) if (/^https:\/\//.test(s.url)) sources.add(s.url);
  return { relu, calculs: (turn.evidence ?? []).length > 0, sources: sources.size };
}
export const motifRelecture = (reason: BrewerTurn['reviewReason']): string => {
  switch (reason) {
    case 'requested': return 'analyse approfondie demandée';
    case 'sensitive': return 'situation sensible';
    case 'research': return 'contrôle des sources web';
    case 'complexity': return 'analyse détaillée';
    case 'repair': return 'vérification renforcée';
    default: return 'rapide';
  }
};

/** Un texte venu du serveur ne montre jamais un nom de modèle ou de fournisseur d'IA. */
export function sansNomDeModele(texte: string): string {
  return texte
    .replace(/\bGoogle\s+AI\s+Studio\b|\bAI\s+Studio\b/gi, 'le service IA')
    .replace(/\bGemini(?:[\s-]*\d+(?:\.\d+)?)?(?:[\s-]*(?:Pro|Flash))?\b/gi, 'l’IA')
    .replace(/\bFlash\b/g, 'l’IA');
}

// ---------- Statuts des conversations ----------

type JobLike = {
  scope: { kind: string; id: string };
  status: string;
  sendError?: string;
  createdAt: number;
};
export type StatutJob = 'pret' | 'cours' | 'echec';
export function statutJob(job: Pick<JobLike, 'status' | 'sendError'>): StatutJob {
  if (job.sendError || job.status === 'error') return 'echec';
  if (job.status === 'done') return 'pret';
  return 'cours';
}
const cleScope = (s: { kind: string; id: string }) => `${s.kind === 'draft' ? 'recipe' : s.kind}:${s.id}`;
/** Une conversation = sa dernière question ; une annulée ne compte pas. */
export function statutsConversations(jobs: JobLike[]): { prets: number; enCours: number; echecs: number } {
  const derniere = new Map<string, JobLike>();
  for (const j of jobs) {
    if (j.status === 'cancelled') continue;
    const k = cleScope(j.scope);
    const old = derniere.get(k);
    if (!old || j.createdAt > old.createdAt) derniere.set(k, j);
  }
  const out = { prets: 0, enCours: 0, echecs: 0 };
  for (const j of derniere.values()) {
    const s = statutJob(j);
    if (s === 'pret') out.prets++;
    else if (s === 'cours') out.enCours++;
    else out.echecs++;
  }
  return out;
}

// ---------- Budget du mois ----------

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export interface Renouvellement {
  /** « le 1er décembre » */
  quand: string;
  jours: number;
  /** Part du mois écoulée, 0 à 100. */
  pct: number;
  debut: string;
  aujourdhui: string;
  fin: string;
}
/** Le budget mensuel est renouvelé le 1er du mois suivant (heure de Zurich, approchée ici par l'heure locale). */
export function renouvellement(month: string, now: Date): Renouvellement | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const an = Number(m[1]), idx = Number(m[2]) - 1;
  if (idx < 0 || idx > 11) return null;
  const debut = new Date(an, idx, 1), suivant = new Date(an, idx + 1, 1);
  const total = suivant.getTime() - debut.getTime();
  const ecoule = Math.min(total, Math.max(0, now.getTime() - debut.getTime()));
  const dernier = new Date(suivant.getTime() - 86400000);
  return {
    quand: `le 1er ${MOIS[suivant.getMonth()]}`,
    jours: Math.max(0, Math.ceil((suivant.getTime() - now.getTime()) / 86400000)),
    pct: (ecoule / total) * 100,
    debut: `1er ${MOIS_COURT[idx]}`,
    aujourdhui: `auj. ${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`,
    fin: `${dernier.getDate()} ${MOIS_COURT[dernier.getMonth()]}`
  };
}

/** Part d'un usage sur sa limite, 0 à 100. Une limite inconnue ou nulle ne donne pas 0 % : `null`. */
export const partDe = (utilise: number | undefined, limite: number | undefined | null): number | null =>
  nombre(utilise) && nombre(limite) && limite > 0 ? Math.min(100, (utilise / limite) * 100) : null;

/** Un jeton de budget : le plafond est atteint (code serveur de la réserve mensuelle). */
export const estPlafondAtteint = (code: string | undefined): boolean =>
  code === 'ai-monthly-limit' || code === 'ai-monthly-unconfigured' || code === 'gemini-spend-cap';

/** Pastilles « Je lis à chaque question » : ce que le serveur recharge selon la portée de la conversation. */
export function sourcesLues(kind: string, finances: boolean): string[] {
  if (finances) return ['Opérations', 'Pièces', 'Matériel'];
  if (kind === 'batch') return ['Recette', 'Brassin', 'Journal', 'Matériel'];
  if (kind === 'draft') return ['Brouillon', 'Matériel'];
  if (kind === 'recipe') return ['Recette', 'Matériel'];
  return ['Écran', 'Matériel'];
}

/** Icône d'une question suggérée, d'après son sujet. */
export type IconeQuestion = 'pression' | 'densite' | 'houblon' | 'calendrier' | 'depenses' | 'achat' | 'annee' | 'materiel' | 'defaut';
export function iconeQuestion(question: string): IconeQuestion {
  const q = question.toLowerCase();
  if (/pression|purge/.test(q)) return 'pression';
  if (/densit|df |levure|gravit/.test(q)) return 'densite';
  if (/houblon|dry|galaxy|citra|mosaic|herb|goût|sent/.test(q)) return 'houblon';
  if (/achat|investiss/.test(q)) return 'achat';
  if (/ann[ée]e|annuel/.test(q)) return 'annee';
  if (/mat[ée]riel|classement|incoh/.test(q)) return 'materiel';
  if (/d[ée]pense|poste|paiement/.test(q)) return 'depenses';
  if (/jour|garde|quand|dur[ée]e/.test(q)) return 'calendrier';
  return 'defaut';
}
