import type { FinanceCategory } from '../../../types';
import { RANGEES, ajouterJours, dateDeSemaine, jourLisible, lundiDe, type ChoseCalendrier, type Rangee as IdRangee } from '../../../domain/calendrier';
import type { BrouillonAjout } from '../../../domain/calendrierAjout';
import type { Promesse } from '../../../domain/calendrierGestes';
import { SEMAINES_ANNEE } from '../entete/Fenetre';

/* D444 : les textes et règles pures de l'onglet Calendrier, sortis de CalendrierTab.tsx (qui les réexporte). */

/** « déc.. » et « nov. . » deviennent « déc. » et « nov. » : une abréviation qui finit une phrase ne double pas son point (CRITIQUE-3 n° 37). */
/**
 * CRITIQUE-6 n° 3 (D-68, E34, E38) : la catégorie d'une prévision ouverte par « Plus de détails › » depuis une rangée. Un achat de matières
 * est « Brassage » (le domaine le range dans Achats), jamais « Charges fixes » (rangé dans Papiers). Clés de `CATEGORY_LABELS`.
 */
export const CATEGORIE_DE_RANGEE: Partial<Record<IdRangee, FinanceCategory>> = { achats: 'brassage', travaux: 'renovation', papiers: 'chargesFixes' };

export function sansPointDouble(texte: string): string {
  return texte.replace(/\.(?:\s*\.)+/g, () => '.');
}

/**
 * CRITIQUE-7 (A6) : le résumé d'une pose (« 3 fûts La Cigogne · S47 ») suivi de l'effet sur la caisse (« S47 : 3 268 → 4 168 ») disait deux fois
 * la semaine. Quand l'effet commence par une semaine que le résumé porte déjà en segment « · Snn », ce segment part ; le reste du résumé
 * (« vente confirmée ») est gardé. Assemblé par segments, sans remplacement de chaîne (L26).
 */
export function resumeSansSemaine(resume: string, effet: string): string {
  const semaine = /^S\d{1,2}\b/.exec(effet)?.[0];
  if (!semaine) return resume;
  const segments = resume.split(' · ');
  /* « S2 ’27 » (une semaine de l'an prochain) est la même semaine que l'effet « S2 : … » */
  const i = segments.findIndex((s, k) => k > 0 && (s === semaine || s.startsWith(`${semaine} `)));
  return i < 0 ? resume : segments.filter((_, k) => k !== i).join(' · ');
}

/** Une semaine dite en phrase : « S52, 21 – 27 déc. » suivi d'une phrase, sans « déc.. ». */
export const phraseSemaine = (lundi: string, suite: string) => sansPointDouble(`${dateDeSemaine(lundi)}. ${suite}`);

/**
 * f6-b (E32, CRITIQUE-3 n° 20) : « 3 fûts promis à La Cigogne le 15 déc. · prête le 4 janv. », composé depuis la promesse du domaine. Le client
 * vient de `clientId` ; s'il manque ou est inconnu, la phrase du domaine reste (« 3 fûts La Cigogne promis le … »), sans rien inventer.
 */
export function textePromesse(p: Promesse, clients: ReadonlyArray<{ id: string; name: string }>): string {
  const client = p.clientId ? clients.find(c => c.id === p.clientId)?.name?.trim() : undefined;
  if (!client) return sansPointDouble(p.texte);
  const titre = p.titre.trim();
  const i = titre.toLocaleLowerCase('fr').indexOf(client.toLocaleLowerCase('fr'));
  const quoi = (i >= 0 ? `${titre.slice(0, i)} ${titre.slice(i + client.length)}` : titre).replace(/\s+/g, ' ').replace(/[\s,·–-]+$/, '').trim() || titre;
  return sansPointDouble(`${quoi} promis à ${client} le ${jourLisible(p.jourPromis)} · prête le ${jourLisible(p.preteLe)}`);
}

/** Les durées du menu période (E07), en semaines : « Voir S20 › » prend la plus petite qui contient la chose posée (CRITIQUE-10 n° 2). */
export const DUREES_MENU: readonly number[] = [6, 13, 26, SEMAINES_ANNEE];

/** L'étendue d'une chose posée par la feuille, du lundi de son début au dimanche de sa fin ; un brassin court jusqu'à « prête ». */
export function etendueDuBrouillon(b: BrouillonAjout): { du: string; au: string } | null {
  if (!b.debut) return null;
  const du = lundiDe(b.debut);
  const finBrassin = b.rangee === 'brassins' && b.tempsEnCuve ? ajouterJours(du, b.tempsEnCuve) : null;
  const fin = finBrassin ?? (b.fin && b.fin > du ? b.fin : du);
  return { du, au: ajouterJours(lundiDe(fin), 6) };
}

export type CritereTri = 'urgent' | 'date' | 'montant';
export const CRITERES_TRI: readonly CritereTri[] = ['urgent', 'date', 'montant'];
export const NOM_CRITERE: Record<CritereTri, string> = { urgent: 'Urgent', date: 'Date', montant: 'Montant' };

/**
 * « Trier les rangées » (k15 du jouable, `k15Ordre`) : sans critère, l'ordre par genre ; « Urgent » met d'abord les rangées en retard, puis
 * celle dont la prochaine chose de la fenêtre arrive le plus tôt ; « Date » la première chose qui commence ; « Montant » la plus grosse somme,
 * les rangées sans montant en dernier. Égalité : l'ordre par genre.
 */
export function ordreSelon(critere: CritereTri | null, choses: readonly ChoseCalendrier[], retards: ReadonlyArray<{ id: string }>, du: string, au: string): IdRangee[] {
  const base = RANGEES.map(r => r.id);
  if (!critere) return base;
  const enRetard = new Set(retards.map(r => r.id));
  const score = new Map<IdRangee, number>();
  base.forEach(r => {
    const dans = choses.filter(c => c.rangee === r && !c.sansDate && !c.fait && c.debut && c.debut <= au && (c.fin || c.debut) >= du);
    const jour = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86400000;
    let v: number;
    if (critere === 'urgent') {
      v = dans.reduce((m, c) => Math.min(m, jour(c.debut > du ? c.debut : du)), 1e9);
      if (choses.some(c => c.rangee === r && (enRetard.has(c.id) || enRetard.has((c.source as { id?: string }).id ?? '')))) v = -1e9;
    } else if (critere === 'date') v = dans.reduce((m, c) => Math.min(m, jour(c.debut)), 1e9);
    else v = dans.some(c => c.centimes != null) ? -dans.reduce((m, c) => Math.max(m, Math.abs(c.centimes ?? 0)), 0) : 1e12;
    score.set(r, v);
  });
  return [...base].sort((a, b) => (score.get(a)! - score.get(b)!) || base.indexOf(a) - base.indexOf(b));
}
