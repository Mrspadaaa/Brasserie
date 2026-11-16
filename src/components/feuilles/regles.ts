/**
 * Règles pures des feuilles (d3p2) : Journal, Conversations, Encaisser une vente.
 * Rien ici ne lit l'app ni l'horloge : tout se teste avec des entrées données.
 */
import type { AuditLog } from '../../types';

export type Personne = 'Gaëtan' | 'Aricia';
export const FENETRE_JOURS = 14;
export const RUBRIQUES = ['Finances', 'Production', 'Stocks', 'Clients', 'Fûts'] as const;

const deux = (n: number) => String(n).padStart(2, '0');
export const cleJour = (d: Date) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const INITIALE_JOUR = ['d', 'l', 'm', 'm', 'j', 'v', 's'];

/** Horodatage ISO d'une écriture ; `null` si illisible (jamais une date inventée). */
export function lireHorodatage(ts: string): Date | null {
  if (!ts) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface JourHisto { cle: string; g: number; a: number; legende: string; aujourdhui: boolean }

/** Quatorze colonnes, la plus récente à droite : écritures de Gaëtan et d'Aricia par jour civil local. */
export function histogramme14(logs: AuditLog[], maintenant: Date): JourHisto[] {
  const colonnes: JourHisto[] = [];
  for (let i = FENETRE_JOURS - 1; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - i);
    const premiere = i === FENETRE_JOURS - 1, milieu = i === 7;
    colonnes.push({
      cle: cleJour(d), g: 0, a: 0, aujourdhui: i === 0,
      legende: premiere || milieu || i === 0 ? `${deux(d.getDate())}.${deux(d.getMonth() + 1)}` : INITIALE_JOUR[d.getDay()]
    });
  }
  const index = new Map(colonnes.map(c => [c.cle, c]));
  for (const l of logs) {
    const d = lireHorodatage(l.timestamp);
    const c = d && index.get(cleJour(d));
    if (!c) continue;
    if (l.user === 'Gaëtan') c.g++; else if (l.user === 'Aricia') c.a++;
  }
  return colonnes;
}

export interface Parts { g: number; a: number; total: number; pctG: number | null; pctA: number | null }
/** Part de chacun sur la fenêtre ; sans écriture, `null` (jamais 0 %). */
export function partsParPersonne(histo: JourHisto[]): Parts {
  const g = histo.reduce((s, j) => s + j.g, 0), a = histo.reduce((s, j) => s + j.a, 0), total = g + a;
  return { g, a, total, pctG: total ? Math.round((100 * g) / total) : null, pctA: total ? Math.round((100 * a) / total) : null };
}

export interface Filtre { rubrique: string; personne: Personne | null; jour: string | null; mot: string }
export const SANS_FILTRE: Filtre = { rubrique: 'all', personne: null, jour: null, mot: '' };
export const filtreActif = (f: Filtre) => f.rubrique !== 'all' || f.personne !== null || f.jour !== null || f.mot.trim() !== '';

const contientMot = (l: AuditLog, mot: string) => {
  const m = mot.trim().toLowerCase();
  if (!m) return true;
  return l.summary.toLowerCase().includes(m) || l.entityId.toLowerCase().includes(m) || (l.details ?? '').toLowerCase().includes(m) || l.timestamp.includes(mot.trim());
};

/** Applique les filtres, sauf ceux qu'on ignore (pour compter les pastilles sans la rubrique choisie). */
export function filtrerJournal(logs: AuditLog[], f: Filtre, ignorer: 'rubrique' | null = null): AuditLog[] {
  return logs.filter(l => {
    if (ignorer !== 'rubrique' && f.rubrique !== 'all' && l.category !== f.rubrique) return false;
    if (f.personne && l.user !== f.personne) return false;
    if (f.jour) { const d = lireHorodatage(l.timestamp); if (!d || cleJour(d) !== f.jour) return false; }
    return contientMot(l, f.mot);
  });
}

/** Les chiffres des pastilles : ce que donnerait chaque rubrique avec les autres filtres posés. */
export function comptesRubriques(logs: AuditLog[], f: Filtre): Record<string, number> {
  const base = filtrerJournal(logs, f, 'rubrique');
  const out: Record<string, number> = { all: base.length };
  for (const r of RUBRIQUES) out[r] = base.filter(l => l.category === r).length;
  return out;
}

export function libelleJour(d: Date, maintenant: Date): string {
  const court = `${JOURS_COURTS[d.getDay()]} ${deux(d.getDate())}.${deux(d.getMonth() + 1)}`;
  const hier = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - 1);
  if (cleJour(d) === cleJour(maintenant)) return `Aujourd’hui · ${court}`;
  if (cleJour(d) === cleJour(hier)) return `Hier · ${court}`;
  return d.getFullYear() === maintenant.getFullYear() ? court : `${court}.${d.getFullYear()}`;
}

export interface GroupeJour { cle: string; titre: string; entrees: AuditLog[] }
/** La frise : un groupe par jour, du plus récent au plus ancien, écritures de la plus récente à la plus ancienne. Les horodatages illisibles vont à part. */
export function groupesParJour(logs: AuditLog[], maintenant: Date): GroupeJour[] {
  const datees = logs.map(l => ({ l, d: lireHorodatage(l.timestamp) }));
  const groupes = new Map<string, GroupeJour & { t: number }>();
  for (const { l, d } of [...datees].sort((x, y) => (y.d?.getTime() ?? -Infinity) - (x.d?.getTime() ?? -Infinity))) {
    const cle = d ? cleJour(d) : 'sans-date';
    let g = groupes.get(cle);
    if (!g) { g = { cle, titre: d ? libelleJour(d, maintenant) : 'Sans date lisible', entrees: [], t: d?.getTime() ?? -Infinity }; groupes.set(cle, g); }
    g.entrees.push(l);
  }
  return [...groupes.values()].sort((x, y) => y.t - x.t).map(({ t: _t, ...g }) => g);
}

export const heureCourte = (ts: string): string => {
  const d = lireHorodatage(ts);
  return d ? `${deux(d.getHours())}:${deux(d.getMinutes())}` : '—';
};

export const actionCourte = (action: string): { texte: string; classe: 'cre' | 'mod' | 'sup' | 'sta' } =>
  action === 'Création' ? { texte: 'Création', classe: 'cre' }
  : action === 'Suppression' ? { texte: 'Suppr.', classe: 'sup' }
  : action === 'Statut' ? { texte: 'Statut', classe: 'sta' }
  : { texte: 'Modif.', classe: 'mod' };

/** Pied de la feuille : ce qui reste vraiment à dire quand la liste est vide. */
export function etatVideJournal(total: number, f: Filtre): { titre: string; texte: string; effacer: boolean } {
  if (total === 0) return { titre: 'Aucune modification pour l’instant', texte: 'Chaque saisie de Gaëtan ou d’Aricia s’inscrira ici, jour par jour.', effacer: false };
  return { titre: 'Aucune modification ne correspond', texte: filtreActif(f) ? 'Un filtre est posé : enlève-le pour revoir les autres écritures.' : '', effacer: filtreActif(f) };
}

/* ---------- Conversations ---------- */

/** L'heure du jour si c'est aujourd'hui, sinon la date courte (jj.mm) : « hier » n'est jamais écrit. */
export function horodatageConversation(createdAt: number, maintenant: Date): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return cleJour(d) === cleJour(maintenant) ? `${deux(d.getHours())}:${deux(d.getMinutes())}` : `${deux(d.getDate())}.${deux(d.getMonth() + 1)}`;
}

export type IconeConversation = 'flask' | 'file' | 'box' | 'wallet' | 'msg';
/** Le picto d'une conversation d'après sa portée : brassin, recette, ou écran de l'app. */
export function iconeConversation(kind: string, label: string): { icone: IconeConversation; zone: 'prod' | 'sto' | 'fin' | 'hop' } {
  if (kind === 'batch') return { icone: 'flask', zone: 'prod' };
  if (kind === 'recipe' || kind === 'draft') return { icone: 'file', zone: 'prod' };
  if (/^stocks?\b/i.test(label)) return { icone: 'box', zone: 'sto' };
  if (/^finances?\b/i.test(label)) return { icone: 'wallet', zone: 'fin' };
  return { icone: 'msg', zone: 'hop' };
}

/** Ce que la feuille dit du lien avec le compagnon : hors ligne, jamais un silence. */
export function etatLienCompagnon(enLigne: boolean, erreur: string): { coupe: boolean; titre: string; texte: string } {
  if (!enLigne) return { coupe: true, titre: 'Compagnon hors connexion · mode local', texte: 'Tes échanges restent lisibles ; ta question part dès que le réseau revient.' };
  if (erreur) return { coupe: true, titre: 'Compagnon injoignable', texte: erreur };
  return { coupe: false, titre: 'Compagnon en ligne', texte: 'Tes questions continuent pendant que tu brasses.' };
}
