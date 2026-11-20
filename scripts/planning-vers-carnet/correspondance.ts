/**
 * Planning → Carnet (20.11, MISSION work/missions/2026-11-20-planning-carnet) : une étape du Planning devient une idée du Carnet, par
 * le chemin même de l'app (`creerCarnet` : un carnet neuf et son message, rangement local, aucune IA). Ids fixes : relancer ne crée rien.
 * Budget : un critère « Budget prévu : 3 500 CHF » (pas un article : ce n'est l'offre d'aucun vendeur). Dates : une note « à faire » et
 * `date` = le lundi du début (l'icône de l'idée au Calendrier, R48). Jalon : une idée « Jalon — … », sans date ni budget (jamais 0).
 * Étape faite : archivée (« Fait au Planning »). Rien d'autre n'est écrit ni lu.
 */
import type { CreativeItem } from '../../src/types';
import { lundiDe } from '../../src/domain/calendrier';
import { creerCarnet, type LigneARanger } from '../../src/domain/carnets/operations';
import { prixTexte } from '../../src/domain/carnets/comparer';

/** Une étape du Planning telle que stockée (ancien `GanttTask`, retiré du code le 20.11). */
export interface TachePlanning { id: string; category?: string; description: string; cost?: number; startDate?: string; endDate?: string; isMilestone?: boolean; completed?: boolean }

/** « 08.12.2025 », « 01,08,2026 », « 1/5/2027 » → ISO ; vide ou invalide (31.02) → null. */
export function dateDuPlanning(texte: string | undefined): string | null {
  const m = /^\s*(\d{1,2})[.,/-](\d{1,2})[.,/-](\d{4})\s*$/.exec(texte ?? '');
  if (!m) return null;
  const [j, mo, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(a, mo - 1, j));
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null;
  return d.toISOString().slice(0, 10);
}

const frDate = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
export const idCarnetPlanning = (tacheId: string) => `CARNET-PLANNING-${tacheId}`;
export const idMessagePlanning = (tacheId: string) => `MSG-PLANNING-${tacheId}`;
/** « 🏁  JALON — Peut brasser… » → « Peut brasser… ». */
const sansMarqueJalon = (t: string) => t.replace(/^\s*(?:🏁\s*)?JALON\s*[—–-]\s*/iu, '').trim();

export interface CarnetPlanning { tacheId: string; docs: CreativeItem[]; titre: string; budget: string | null; dates: string; date?: string; jalon: boolean; fait: boolean }

/** Le carnet d'une étape (et son message), prêts à écrire. `le` : l'instant de la migration. */
export function carnetDeTache(t: TachePlanning, le: string): CarnetPlanning {
  const jalon = t.isMilestone === true;
  const nom = jalon ? `Jalon — ${sansMarqueJalon(t.description)}` : t.description.trim();
  const debut = dateDuPlanning(t.startDate), fin = dateDuPlanning(t.endDate);
  const budget = !jalon && typeof t.cost === 'number' && t.cost > 0 ? prixTexte(Math.round(t.cost * 100), 'CHF') : null;
  const periode = debut && fin ? `du ${frDate(debut)} au ${frDate(fin)}` : debut ? `dès le ${frDate(debut)}` : fin ? `pour le ${frDate(fin)}` : null;
  const rubrique = t.category && !jalon ? `Planning, ${t.category}` : 'Planning';
  const dates = periode ? `À faire ${periode} (${rubrique})` : jalon ? 'Jalon du Planning, sans date prévue' : `À faire, sans date prévue (${rubrique})`;
  const id = idCarnetPlanning(t.id);
  const neuf = { id, titre: nom };
  const lignes: LigneARanger[] = [
    ...(budget ? [{ carnetNeuf: neuf, sorte: 'critere', texte: `Budget prévu : ${budget}`, origine: 'vous' } as LigneARanger] : []),
    { carnetNeuf: neuf, sorte: 'note', texte: dates, genre: 'a-faire' } as LigneARanger
  ];
  const texte = [nom, ...(budget ? [`Budget prévu : ${budget}`] : []), dates].join('\n');
  const r = creerCarnet([], { id, titre: nom, message: { id: idMessagePlanning(t.id), texte, le, depuis: 'liste', rangement: 'locale' }, lignes });
  if (!r.ok) throw new Error(`${t.id} : ${(r as { raison: string }).raison}`);
  const docs = r.ecritures.map(w => { if (w.op !== 'put') throw new Error('écriture inattendue'); return w.doc; });
  const carnet = docs.find(d => d.id === id);
  if (!carnet?.carnet) throw new Error(`${t.id} : carnet absent`);
  carnet.carnet.phrase = nom;
  if (debut) carnet.date = lundiDe(debut);
  if (t.completed === true) carnet.carnet.archive = { le, raison: 'Fait au Planning' };
  return { tacheId: t.id, docs, titre: carnet.title, budget, dates, ...(carnet.date ? { date: carnet.date } : {}), jalon, fait: t.completed === true };
}

export interface PlanMigration { aEcrire: CarnetPlanning[]; dejaLa: string[]; conflits: string[] }

/** Le plan : une étape déjà portée (ses deux ids présents) est sautée ; un seul des deux présent est un conflit, rien n'est écrit pour elle. */
export function planMigration(taches: readonly TachePlanning[], idsExistants: ReadonlySet<string>, le: string): PlanMigration {
  const plan: PlanMigration = { aEcrire: [], dejaLa: [], conflits: [] };
  const vus = new Set<string>();
  const ordre = (t: TachePlanning) => Number(String(t.id).replace(/\D/g, '')) || 0;
  for (const t of [...taches].sort((a, b) => ordre(a) - ordre(b))) {
    if (!t.id || !t.description?.trim() || vus.has(t.id)) { plan.conflits.push(t.id || '(sans id)'); continue; }
    vus.add(t.id);
    const c = idsExistants.has(idCarnetPlanning(t.id)), m = idsExistants.has(idMessagePlanning(t.id));
    if (c && m) plan.dejaLa.push(t.id);
    else if (c || m) plan.conflits.push(t.id);
    else plan.aEcrire.push(carnetDeTache(t, le));
  }
  return plan;
}
