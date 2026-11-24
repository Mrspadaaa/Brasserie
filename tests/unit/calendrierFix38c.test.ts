import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import * as C from '../../src/domain/calendrier';
import { etiquettesPosees, grainDeFenetre, pasEtiquettes } from '../../src/ui/calendrier/entete/BandeSemaines';
import { iconeChose } from '../../src/ui/calendrier/frise/Marque';
import { pastille, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { plageDuDoigt } from '../../src/ui/calendrier/frise/usePointeur';
import { semainesDeVue, vueDeFenetre, vueEnUnites } from '../../src/ui/calendrier/entete/Fenetre';
import { enIso } from './proprietes/_dates';

/**
 * C38-1 (tour 38, en ligne : à 19 mois, cadre avr. 2026 – nov. 2027, l'axe disait « 2025 M J S N 2027 M M J S N 2028 », « 2025 » posé sur S52
 * (22 – 28 déc. 2025), 2026 nulle part ; à 14 et 16 mois, aucune année) : à toute durée où l'axe porte des initiales de mois, au téléphone,
 *  - chaque année qui tient 26 px au moins dans le cadre (« ’25 » et le trait du janvier suivant) est nommée au moins une fois ;
 *  - jamais une année fausse : le centre d'un nom d'année est sur un jour de cette année.
 * Même chemin que l'écran : vue de la fenêtre, semaines de la vue, grain, noms posés (comme bandeJamaisVide).
 */
const PASSE = 60, TOTAL = PASSE + 6 * 53 + 8, JOUR = 86400000;
const W_S53 = [21, 23, 25];
const anneeDuNom = (t: string): number | null => (/^\d{4}$/.test(t) ? Number(t) : /^’\d\d$/.test(t) ? 2000 + Number(t.slice(1)) : null);

function fautes(auj: string, nombre: number, index: number, largeur: number, w: number): string[] {
  const semaines = C.semainesDe(auj, TOTAL, PASSE).map(s => ({ debut: s.debut, numero: s.numero }));
  const i = Math.min(Math.max(0, index), TOTAL - nombre);
  const vue = vueEnUnites(vueDeFenetre(i, nombre, largeur));
  const sv = semainesDeVue(TOTAL, vue, largeur);
  if (!sv) return ['aucune semaine dans la vue'];
  const sem = semaines.slice(sv.debut, sv.debut + sv.abscisses.length - 1), a = sv.abscisses;
  const lc = largeur / vue.span, grain = grainDeFenetre(nombre);
  if (grain === 'jour' || grain === 'an' || (grain === 'semaine' && pasEtiquettes(lc, w) !== 'mois')) return [];
  const noms = etiquettesPosees(sem, a, grain, lc, w);
  const cas = `${nombre} sem. du ${semaines[i].debut}, ${largeur} px, S53 ${w} px, axe ${sem[0].debut}…${sem[sem.length - 1].debut} : « ${noms.map(n => n.texte).join(' ')} »`;
  const t0 = Date.parse(`${sem[0].debut}T00:00:00Z`), ref = a[1] - lc;
  const X = (iso: string) => ref + ((Date.parse(`${iso}T00:00:00Z`) - t0) / JOUR) * (lc / 7);
  const anneeAu = (x: number) => new Date(t0 + ((x - ref) / (lc / 7)) * JOUR).getUTCFullYear();
  const f: string[] = [];
  for (const n of noms) { const an = anneeDuNom(n.texte); if (an !== null && anneeAu(n.x) !== an) f.push(`année fausse « ${n.texte} » posée sur ${anneeAu(n.x)} : ${cas}`); }
  const cadreG = Math.max(0, (i - vue.v0) * lc), cadreD = Math.min(largeur, (i + nombre - vue.v0) * lc);
  /* une courbe tout entière dans une année n'en nomme aucune (pas de janvier à marquer) */
  if (new Date(t0).getUTCFullYear() === new Date(t0 + 7 * sem.length * JOUR - 1).getUTCFullYear()) return f;
  const nommees = new Set(noms.map(n => anneeDuNom(n.texte)).filter(v => v !== null));
  for (let an = new Date(t0).getUTCFullYear(); an <= new Date(t0 + 7 * sem.length * JOUR).getUTCFullYear(); an++) {
    const part = Math.min(cadreD, X(`${an + 1}-01-01`)) - Math.max(cadreG, X(`${an}-01-01`));
    if (part >= 26 && !nommees.has(an)) f.push(`année ${an} (${part.toFixed(0)} px dans le cadre) sans nom : ${cas}`);
  }
  return f;
}

describe('C38-1 : l’axe porte l’année juste, à toute durée', () => {
  it('ses captures : 14, 16 et 19 mois, cadre dès avr. 2026', () => {
    const auj = '2026-11-23', index = C.semainesDe(auj, TOTAL, PASSE).findIndex(s => s.debut === '2026-04-06');
    for (const mois of [14, 16, 19]) expect(fautes(auj, Math.round(mois * 52 / 12), index, 366, 23), `${mois} mois`).toEqual([]);
  });

  it('à toute durée d’un an à trois ans (et en mois sous l’an), sur tout l’horizon, au téléphone : chaque année du cadre nommée, aucune fausse', () => {
    fc.assert(fc.property(
      fc.integer({ min: 20000, max: 23000 }), fc.integer({ min: 20, max: 156 }), fc.integer({ min: 0, max: TOTAL }), fc.integer({ min: 340, max: 374 }), fc.constantFrom(...W_S53),
      (auj, nombre, index, largeur, w) => { const f = fautes(enIso(auj), nombre, index, largeur, w); if (f.length) throw new Error(f.slice(0, 3).join('\n')); }
    ), { numRuns: 3000 });
  });
});

/* C38-3 (tour 38) : « +1 201 reçu » dans la pastille Ventes pour un apport de 1 200 et un autre de 1 CHF, aucune vente ; l'apport portait la flèche montante
   des ventes alors que la saisie lui donne une tirelire. Attendu : l'apport reste visible, hors du total de la rangée, avec son picto. */
const cols = (debut: string, n: number): Colonne[] => C.semainesDe(debut, n).map(s => ({ debut: s.debut, fin: enIso(Date.parse(`${s.debut}T00:00:00Z`) / 864e5 + 6), etiquette: `S${s.numero}` }) as Colonne);
const apport = (id: string, titre: string, centimes: number, horsVentes: 'apport' | 'autre-entree' = 'apport') => ({ id, titre, rangee: 'ventes', debut: '2026-11-24', fin: '2026-11-24', centimes, horsVentes, source: { genre: 'facture', id: 'T-' + id } }) as unknown as C.ChoseCalendrier;
describe('C38-3 : l’apport, hors du total des Ventes, avec son picto', () => {
  it('un apport prend la tirelire, une autre entrée ses trois points, une vente garde sa flèche', () => {
    const base = { rangee: 'ventes', titre: 'x', source: { genre: 'facture', id: 'T' } } as unknown as Parameters<typeof iconeChose>[0];
    const nom = (c: Parameters<typeof iconeChose>[0]) => iconeChose(c).displayName ?? (iconeChose(c) as unknown as { render?: { displayName?: string } }).render?.displayName;
    expect(nom({ ...base, horsVentes: 'apport' })).toBe('PiggyBank');
    expect(nom({ ...base, horsVentes: 'autre-entree' })).toBe('Ellipsis');
    expect(nom(base)).toBe('TrendingUp');
  });
  it('la pastille ne dit jamais « reçu » pour un apport : ni son texte, ni son mot ; le montant reste dans la lecture et sur les marques', () => {
    const choses = [apport('paiement-1', 'De ma poche', 120000), apport('paiement-2', 'ZZ apport', 100)];
    const p = pastille('ventes', choses, cols('2026-11-23', 6));
    expect(p.solde).toBeNull();
    expect(p.texte).not.toMatch(/reçu|1s?201/);
    expect(p.conf).not.toMatch(/reçu/);
    expect(p.conf).toMatch(/^hors ventes /);
    expect(p.lecture).toMatch(/reçu, hors ventes/);
  });
  it('avec une vente, le total ne compte que la vente', () => {
    const vente = { id: 'v1', titre: 'Vente', rangee: 'ventes', debut: '2026-11-25', fin: '2026-11-25', centimes: 40000, source: { genre: 'facture', id: 'F1' } } as unknown as C.ChoseCalendrier;
    const p = pastille('ventes', [vente, apport('paiement-1', 'De ma poche', 120000)], cols('2026-11-23', 6));
    expect(p.solde).toBe(40000);
  });
});

/* T29-6 / C38-2 : un doigt sur la frise vise une colonne que la fenêtre montre (jamais la marge hors fenêtre) ; sorti de la frise, la marge reste permise. */
describe('T29-6 : la pose reste dans le cadre visible', () => {
  it('sur la frise, la plage est celle de la fenêtre ; hors de la frise, elle s’élargit de la marge', () => {
    expect(plageDuDoigt([-2, 12], [3, 5], true)).toEqual([-2, 12]);
    expect(plageDuDoigt([-2, 12], [3, 5], false)).toEqual([-5, 17]);
    expect(plageDuDoigt(undefined, [3, 5], true)).toBeUndefined();
  });
});
