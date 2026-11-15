import type { TaskDef } from './prompts.js';

/**
 * ks4 : la note du Carnet rangée par l'IA (MISSION atelier, § « État de l'art — ks4 »).
 * Extraction structurée d'une phrase courte : sortie imposée (`responseSchema`), date de saisie fournie, rien d'inventé.
 * L'app revérifie tout (`src/domain/rangerNote.ts` : dates, nombres, contacts et bières connus) et n'écrit qu'au toucher « Ranger ».
 *
 * ÉCRITE ET TESTÉE, PAS DÉPLOYÉE : la déployer attend son accord (Gemini en production). Le client ne l'appelle qu'avec
 * `VITE_RANGER_NOTE_IA=production`.
 */
const S = (properties: Record<string, unknown>, required: string[]) => ({ type: 'OBJECT', properties, required });
const str = { type: 'STRING', nullable: true };
const num = { type: 'NUMBER', nullable: true };

export const RANGER_NOTE_SCHEMA = S({
  effets: {
    type: 'ARRAY',
    items: S({
      sorte: { type: 'STRING', enum: ['tache', 'contact', 'client', 'idee-biere'] },
      titre: { type: 'STRING' },
      date: str,
      jour: str,
      nombre: num,
      contenanceL: num,
      contact: str,
      lieu: str,
      personne: str,
      biere: str,
      texte: str
    }, ['sorte', 'titre'])
  }
}, ['effets']);

export const RANGER_NOTE: TaskDef = {
  defaultTier: 'fast',
  tier: 'fast',
  maxOutputTokens: 1200,
  acceptsFile: false,
  system: `Tu assistes une micro-brasserie suisse. Le brasseur a noté une phrase courte dans son carnet. Range-la en choses
concrètes, sans rien inventer.

Tu reçois : « note » (la phrase), « saisie » (date de saisie AAAA-MM-JJ) et « jourSaisie », « contacts » (lieux connus),
« bieres » (bières connues).

Rends « effets », une entrée par chose, au plus 6 :
  • "tache" : une chose à faire. « titre » commence par un verbe (« Livrer 2 fûts de 20 L »). Si la note donne une date ou une
    échéance (« avant le 12 déc. », « samedi »), « date » = AAAA-MM-JJ résolue depuis « saisie » (jamais dans le passé) et « jour »
    = son jour abrégé (dim., lun., mar., mer., jeu., ven., sam.). Sans date dans la note : date nulle.
    « nombre » et « contenanceL » seulement s'ils sont écrits dans la note (2 fûts de 20 L → 2 et 20).
  • "contact" : un lieu ou une personne. Si c'est un des « contacts », « contact » = ce titre EXACT ; sinon « lieu » (et « personne »)
    tels que la note les dit.
  • "client" : seulement si la note dit qu'il commande ou achète (idée de conversion en client).
  • "idee-biere" : une idée de bière ; « titre » court, « texte » = le détail tel quel (un houblon « en fin d'ébu » reste ce texte :
    jamais un moment, une durée ni une dose).
« biere » seulement si une des « bieres » est nommée, écrite exactement comme dans la liste.
Aucun prix, aucun montant : l'app les cherche dans ses tarifs. Un champ inconnu est nul, jamais 0.`,
  schema: RANGER_NOTE_SCHEMA
};

const SORTES = new Set(['tache', 'contact', 'client', 'idee-biere']);
const CHAMPS = ['date', 'jour', 'contact', 'lieu', 'personne', 'biere', 'texte'] as const;

/** Garde serveur : ne laisse passer que la forme du schéma (l'app revérifie le sens). Une forme fausse rend `{ effets: [] }`. */
export function assainirRangerNote(data: unknown): { effets: Array<Record<string, unknown>> } {
  const effets = (data as { effets?: unknown } | null)?.effets;
  if (!Array.isArray(effets)) return { effets: [] };
  return {
    effets: effets.slice(0, 6).flatMap((e) => {
      if (!e || typeof e !== 'object') return [];
      const r = e as Record<string, unknown>;
      if (!SORTES.has(r.sorte as string) || typeof r.titre !== 'string' || !r.titre.trim()) return [];
      const out: Record<string, unknown> = { sorte: r.sorte, titre: r.titre.trim() };
      for (const c of CHAMPS) if (typeof r[c] === 'string' && (r[c] as string).trim()) out[c] = (r[c] as string).trim();
      for (const c of ['nombre', 'contenanceL'] as const) if (typeof r[c] === 'number' && Number.isFinite(r[c]) && (r[c] as number) > 0) out[c] = r[c];
      return [out];
    })
  };
}

/** Le texte envoyé au modèle : la note et son contexte, rien d'autre. */
export function contexteRangerNote(context: unknown): { note: string; saisie: string } | null {
  const c = context as { note?: unknown; saisie?: unknown } | null;
  if (!c || typeof c.note !== 'string' || !c.note.trim() || c.note.length > 1000) return null;
  if (typeof c.saisie !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(c.saisie)) return null;
  return { note: c.note.trim(), saisie: c.saisie };
}
