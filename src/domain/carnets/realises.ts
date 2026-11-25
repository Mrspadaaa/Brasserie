/**
 * C68-13 (tour 68 : « Réalisés 0 » avec 6 problèmes résolus en 2026) : un problème résolu « ira dans Réalisés » (ResoluProbleme). Stocks › Matériel › Réalisés compte et liste
 * donc les problèmes résolus, en plus des projets d'À venir menés à terme. Un problème fermé par l'achat d'un plan lié n'est pas compté deux fois : c'est le plan de l'achat qui
 * y va. Rien n'est inventé : le nom de la retenue et le jour n'existent que s'ils sont écrits.
 */
import type { CreativeItem } from '../../types';
import { lireCarnets } from './modele';
import { etatDe, optionRetenue, suiviDe } from './suivi';

export interface ResoluRealise { id: string; titre: string; le: string | null; retenue: string | null }

export function resolusRealises(items: readonly CreativeItem[]): ResoluRealise[] {
  return lireCarnets(items)
    .filter(c => etatDe(c) === 'resolu')
    .filter(c => { const par = suiviDe(c).resolu?.par; return !(par?.sorte === 'achat' && par.planId); })
    .map(c => ({ id: c.id, titre: c.title, le: suiviDe(c).resolu?.le ?? null, retenue: optionRetenue(c)?.nom ?? null }))
    .sort((a, b) => (b.le ?? '').localeCompare(a.le ?? ''));
}
