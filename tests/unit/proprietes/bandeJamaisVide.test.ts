import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import * as C from '../../../src/domain/calendrier';
import { etiquettesPosees, grainDeFenetre } from '../../../src/ui/calendrier/entete/BandeSemaines';
import { semainesDeVue, vueDeFenetre, vueEnUnites } from '../../../src/ui/calendrier/entete/Fenetre';
import { enIso } from './_dates';

/**
 * CAL-BANDE-JAMAIS-VIDE (23.11, en ligne, tour 22 : à « 20 mois », période Tout, la bande des graduations était vide ; « Répare déjà ça ») :
 * à toute durée de fenêtre, d'un jour à six ans, au téléphone (courbe de 340 à 374 px), la bande posée sur la courbe montre au moins trois
 * noms lisibles, aucun rogné au bord, aucun sur un autre. Même chemin que l'écran : vue de la fenêtre, semaines de la vue, grain, noms posés.
 */
const PASSE = 60, TOTAL = PASSE + 6 * 53 + 8;
/** La largeur de « S53 » hors navigateur (repli de largeurEtiquetteMax) ; mesurée en ligne, 22 à 25 px selon la police. */
const W_S53 = [21, 23, 25];

function fautes(auj: string, jours: number, index: number, largeur: number, w: number): string[] {
  const nombre = Math.max(1, Math.ceil(jours / 7));
  const semaines = C.semainesDe(auj, TOTAL, PASSE).map(s => ({ debut: s.debut, numero: s.numero }));
  const i = Math.min(index, TOTAL - nombre);
  const vue = vueEnUnites(vueDeFenetre(i, nombre, largeur));
  const sv = semainesDeVue(TOTAL, vue, largeur);
  if (!sv) return ['aucune semaine dans la vue'];
  const sem = semaines.slice(sv.debut, sv.debut + sv.abscisses.length - 1);
  const noms = etiquettesPosees(sem, sv.abscisses, grainDeFenetre(nombre), largeur / vue.span, w).sort((p, q) => p.x - q.x);
  const f: string[] = [];
  const cas = `${jours} j (${nombre} sem., grain ${grainDeFenetre(nombre)}), index ${i}, ${largeur} px, S53 ${w} px`;
  if (noms.length < 3) f.push(`${cas} : ${noms.length} nom(s) : ${noms.map(n => n.texte).join(' ')}`);
  for (const n of noms) if (n.x - n.w / 2 < -0.01 || n.x + n.w / 2 > largeur + 0.01) f.push(`${cas} : « ${n.texte} » rogné (x ${n.x.toFixed(1)})`);
  noms.slice(1).forEach((n, k) => { const p = noms[k]; if (n.x - p.x < (n.w + p.w) / 2) f.push(`${cas} : « ${p.texte} » et « ${n.texte} » se chevauchent`); });
  return f;
}

describe('CAL-BANDE-JAMAIS-VIDE : la bande des graduations n’est jamais vide', () => {
  it('sa capture : 20 mois, période Tout (24 nov. 2025 – 11 juil. 2027), 366 px', () => {
    // Tout commence au début de la courbe : la fenêtre part de l'index 0 (CAL-PASSE), aujourd'hui le 23 nov. 2026.
    const auj = '2026-11-23', debut = C.semainesDe(auj, TOTAL, PASSE).findIndex(s => s.debut === '2025-11-24');
    const jours = (Date.parse('2027-07-12') - Date.parse('2025-11-24')) / 86400000;
    expect(fautes(auj, jours, debut, 366, 23)).toEqual([]);
  });

  it('à toute durée d’un jour à six ans, au téléphone : au moins trois noms, lisibles, non rognés, sans chevauchement', () => {
    fc.assert(fc.property(
      fc.integer({ min: 20000, max: 23000 }), fc.integer({ min: 1, max: 6 * 365 }), fc.integer({ min: 0, max: TOTAL }), fc.integer({ min: 340, max: 374 }), fc.constantFrom(...W_S53),
      (auj, jours, index, largeur, w) => { const f = fautes(enIso(auj), jours, index, largeur, w); if (f.length) throw new Error(f.slice(0, 3).join('\n')); }
    ), { numRuns: 1500 });
  });

  it('les durées qu’il joue : 14 mois, 20 mois, 3 ans, 6 ans', () => {
    for (const jours of [427, 594, 1096, 2191]) for (const index of [0, PASSE, PASSE + 20]) expect(fautes('2026-11-23', jours, index, 366, 23)).toEqual([]);
  });
});
