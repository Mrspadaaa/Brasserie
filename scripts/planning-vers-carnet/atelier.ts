/**
 * Planning → Brassins › Atelier › Carnet et Matériel › À venir (20.11, « Mais et le carnet ??? »). Son « carnet » est celui de l'Atelier :
 * ses projets s'y lisent en « À faire » (`event`, `todo`, échéance en date suisse, coût estimé, fenêtre du lundi au dimanche, `activite` :
 * une barre chiffrée d'Activités au Calendrier ; un jalon sans date va dans « Sans date »). Un achat d'équipement va dans À venir, comme les
 * autres achats (`FinancialPlan` matériel, intention), lié à son idée des Carnets d'idées par le lien existant (`sortie`, `sourceCarnetId`).
 * Un coût n'est porté qu'une fois. Les idées des travaux quittent les Carnets d'idées par l'archive (rien d'effacé). Ids fixes : idempotent.
 */
import type { CreativeItem } from '../../src/types';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { lundiDe } from '../../src/domain/calendrier';
import { lireCarnet } from '../../src/domain/carnets/modele';
import { appliquerEcritures, archiverCarnet, poserSortie, type EcritureCarnet } from '../../src/domain/carnets/operations';
import { dateDuPlanning, idCarnetPlanning, type TachePlanning } from './correspondance';
import { ETATS_20_11, type EtatEtape } from './etats';

/** Les achats d'équipement du Planning (un objet à acheter) ; le reste est travaux, démarches ou jalons. */
export const ACHATS: readonly string[] = ['T-12', 'T-13', 'T-14', 'T-16', 'T-17', 'T-18', 'T-19', 'T-21'];
const padde = (id: string) => id.replace(/(\d+)$/, n => n.padStart(2, '0'));
export const idAtelier = (t: string) => `CR-PLANNING-${padde(t)}`;
export const idPlan = (t: string) => `PLAN-PLANNING-${padde(t)}`;
const suisse = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const plusJours = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const sansMarque = (t: string) => t.replace(/^\s*(?:🏁\s*)?JALON\s*[—–-]\s*/iu, '').trim();
const ETAT_TEXTE: Record<Exclude<EtatEtape, 'fait'>, string> = { 'en-cours': 'En cours au 20.11.2026', 'pas-fait': 'Pas encore fait au 20.11.2026' };

export interface PlanAtelier { atelier: CreativeItem[]; plans: FinancialPlan[]; carnet: EcritureCarnet[]; lignes: string[] }

export function planAtelier(taches: readonly TachePlanning[], items: readonly CreativeItem[], idsExistants: ReadonlySet<string>, le: string, etats: Readonly<Record<string, EtatEtape>> = ETATS_20_11): PlanAtelier {
  const sortie: PlanAtelier = { atelier: [], plans: [], carnet: [], lignes: [] };
  const jour = le.slice(0, 10);
  let docs = [...items];
  const ordre = (t: TachePlanning) => Number(t.id.replace(/\D/g, '')) || 0;
  for (const t of [...taches].sort((a, b) => ordre(a) - ordre(b))) {
    const debut = dateDuPlanning(t.startDate), fin = dateDuPlanning(t.endDate);
    const jalon = t.isMilestone === true, etat = etats[t.id];
    const titre = jalon ? `Jalon — ${sansMarque(t.description)}` : t.description.trim();
    const cout = !jalon && typeof t.cost === 'number' && t.cost > 0 ? t.cost : undefined;
    const fenetre = debut && fin ? { du: lundiDe(debut), au: plusJours(lundiDe(fin), 6) } : undefined;
    const periode = debut && fin ? `du ${suisse(debut)} au ${suisse(fin)}` : null;
    const detail = jalon ? 'Jalon du Planning, sans date' : `Planning, ${t.category ?? 'sans catégorie'}${periode ? ` · ${periode}` : ''}`;
    const carnetId = idCarnetPlanning(t.id), c = lireCarnet(docs.find(d => d.id === carnetId));
    if (ACHATS.includes(t.id)) {
      const id = idPlan(t.id);
      if (!idsExistants.has(id)) {
        const echeance = fin ?? debut ?? '';
        const jours = echeance ? (Date.parse(echeance) - Date.parse(jour)) / 864e5 : Infinity;
        sortie.plans.push({
          id, title: titre, date: echeance, amountCents: Math.round((cout ?? 0) * 100), direction: 'out', category: 'materiel', source: 'equipment', status: 'draft',
          ...(fenetre ? { fenetre } : {}), notes: [detail, etat && etat !== 'fait' ? ETAT_TEXTE[etat] : null].filter(Boolean).join(' · '),
          createdAt: t.creeLe ?? le, updatedAt: le,
          upgrade: {
            version: 1, timing: jours <= 90 ? 'soon' : jours <= 365 ? 'next' : 'later', stage: 'idea', budgetKnown: cout !== undefined, datePrecision: 'day', estimateSource: 'estimate',
            ...(cout !== undefined ? { purchaseCents: Math.round(cout * 100) } : {}), ...(c ? { sourceCarnetId: carnetId, sourceCarnetTitre: c.title } : {})
          }
        });
        sortie.lignes.push(`${t.id.padEnd(5)} À venir · ${titre} · ${cout ?? '—'} CHF · ${echeance || 'sans date'}`);
      }
      if (c && c.carnet.sortie?.planId !== id) {
        const r = poserSortie(docs, { carnetId, planId: id, le });
        if (r.ok) { sortie.carnet.push(...r.ecritures); docs = appliquerEcritures(docs, r.ecritures); }
      }
    } else {
      const id = idAtelier(t.id);
      if (!idsExistants.has(id)) {
        const item: CreativeItem = {
          id, type: 'event', activite: true, title: titre, status: etat === 'fait' || t.completed === true ? 'done' : 'todo', description: detail,
          ...(fin ? { date: suisse(fin) } : debut ? { date: suisse(debut) } : {}), ...(fenetre ? { fenetre } : {}), ...(cout !== undefined ? { estimatedCost: cout } : {}),
          ...(etat && etat !== 'fait' ? { notes: ETAT_TEXTE[etat] } : {})
        };
        sortie.atelier.push(item);
        sortie.lignes.push(`${t.id.padEnd(5)} Atelier · À faire · ${titre} · ${cout ?? '—'} CHF · ${item.date ?? 'sans date'}${item.status === 'done' ? ' · fait' : ''}`);
      }
      if (c && !c.carnet.archive) {
        const r = archiverCarnet(docs, { carnetId, le, raison: 'Porté dans Brassins › Atelier › Carnet (À faire)' });
        if (r.ok) { sortie.carnet.push(...r.ecritures); docs = appliquerEcritures(docs, r.ecritures); }
      }
    }
  }
  return sortie;
}
