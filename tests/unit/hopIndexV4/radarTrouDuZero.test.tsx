// D114 (26.10), sa variante G de m8 : « G le trou du o, met ça sur tout les radar de comparaison btw ». Le disque du 0 (« non
// décrit ») est teinté d'un gris uni très clair, sans hachures ni mot ; un point à 0 devient un rond creux. Substituer et Comparer
// l'activent (option `trouDuZero` du radar commun) ; Ma bière et la fiche, non. Le contrôle Chrome, sur les écrans :
// tests/integration/controle-trou-du-0.mjs.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RadarBase, type SerieRadar } from '../../../src/ui/hopIndex/commun/RadarBase';
import { RadarU4, AXES_U4 } from '../../../src/ui/hopIndex/substituer/Radar';
import type { FamilyId } from '../../../src/domain/hopIndex/v4';

const FAMILLES: FamilyId[] = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
// Tropical : Lotus 2, Solero 0 (non décrit), Calypso 1 ; melon : Lotus 0, Solero 0, Calypso 2 ; herbal : inconnu de toutes.
const base = { citrus: 2, tropical: 2, melon: 0, stoneFruit: 1, pomeFruit: 1, berries: 0, floral: 1, green: 0, herbal: null, spice: null, earthy: null, resin: 1 };
const series: SerieRadar[] = [
  { cle: 'lotus', nom: 'Lotus', couleur: '#4d4d4d', role: 'contour', valeurs: base },
  { cle: 'solero', nom: 'Solero', couleur: '#0072B2', role: 'autre', valeurs: { ...base, tropical: 0, melon: 0, berries: 0 } },
  { cle: 'calypso', nom: 'Calypso', couleur: '#009E73', role: 'retenu', valeurs: { ...base, tropical: 1, melon: 2, berries: 0 } },
];
const rendre = (trouDuZero?: boolean, s = series) => renderToStaticMarkup(
  <RadarBase familles={FAMILLES} mode="absolu" objet="houblons" label="radar" echelleAbsolue={{ pas: 1, nb: 2, etiquettes: ['0', 'cité', 'marqué'] }} series={s} trouDuZero={trouDuZero} />,
);
const cercles = (html: string) => html.match(/<circle[^>]*data-point[^>]*>/g) ?? [];

describe('radar commun : le trou du 0 (D114, variante G)', () => {
  const avec = rendre(true), sans = rendre(false);

  it('le disque du 0 existe quand l’option est donnée, sous la grille, à l’anneau du zéro (R/3), sans hachures ni mot', () => {
    const d = avec.match(/<polygon[^>]*data-role="trou-du-zero"[^>]*>/)?.[0] ?? '';
    expect(d).toContain('class="rb-trou"');
    expect(avec.indexOf('data-role="trou-du-zero"')).toBeLessThan(avec.indexOf('data-role="anneaux"'));
    // chaque sommet à 124 / 3 = 41,3 du centre (179, 156)
    const pts = /points="([^"]+)"/.exec(d)![1].split(' ').map((p) => p.split(',').map(Number));
    expect(pts).toHaveLength(12);
    for (const [x, y] of pts) expect(Math.hypot(x - 179, y - 156)).toBeCloseTo(124 / 3, 0);
    expect(d).not.toContain('url(#');
    expect(sans).not.toContain('trou-du-zero');
  });

  it('un point à 0 est creux, 4,2 de rayon, trait de la couleur de la série, sur un fond blanc ; un point connu reste plein', () => {
    const solero = avec.slice(avec.indexOf('data-serie="Solero"'), avec.indexOf('data-serie="Calypso"'));
    const zeros = cercles(solero).filter((c) => c.includes('data-valeur="0"'));
    expect(zeros.map((c) => /data-point="(\w+)"/.exec(c)![1])).toEqual(['tropical', 'melon', 'berries', 'green']);
    for (const c of zeros) {
      expect(c).toContain('fill="none"');
      expect(c).toContain('r="4.2"');
      expect(c).toContain('stroke="#0072B2"');
      expect(c).toContain('data-creux="0"');
    }
    expect(solero).toContain('data-role="creux-fond"');
    const pleins = cercles(solero).filter((c) => !c.includes('data-valeur="0"'));
    expect(pleins.length).toBeGreaterThan(0);
    for (const c of pleins) expect(c).not.toContain('fill="none"');
  });

  it('l’original déjà en anneau creux (6,2) ne change pas ; sans l’option, rien ne change', () => {
    const lotus = (h: string) => h.slice(h.indexOf('data-serie="Lotus"'), h.indexOf('data-serie="Solero"'));
    expect(lotus(avec)).toBe(lotus(sans));
    for (const c of cercles(sans)) expect(c).not.toContain('data-creux');
    expect(sans).not.toContain('creux-fond');
  });

  it('l’inconnu reste inconnu : « sans donnée » regroupé, pas de rond creux sur un axe inconnu', () => {
    expect(avec).toContain('data-role="secteur-sans-donnee"');
    expect(cercles(avec).filter((c) => /data-point="(herbal|spice|earthy)"/.test(c))).toHaveLength(0);
  });

  it('D186 : des points de même rayon sur un axe s’écartent le long de l’anneau, l’original au centre, puis l’ordre des séries', () => {
    const v = { ...base, citrus: 1 }; // citrus est le premier axe (en haut) : la tangente est horizontale
    const trio: SerieRadar[] = [
      { cle: 'lotus', nom: 'Lotus', couleur: '#4d4d4d', role: 'contour', valeurs: v },
      { cle: 'solero', nom: 'Solero', couleur: '#0072B2', role: 'autre', valeurs: v },
      { cle: 'calypso', nom: 'Calypso', couleur: '#009E73', role: 'retenu', valeurs: v },
    ];
    const rendu = (ecarter: boolean) => renderToStaticMarkup(
      <RadarBase familles={FAMILLES} mode="absolu" objet="houblons" label="radar" echelleAbsolue={{ pas: 1, nb: 2, etiquettes: ['0', 'cité', 'marqué'] }} series={trio} ecarterConfondus={ecarter} />);
    const citrus = (h: string, nom: string) => {
      const g = h.slice(h.indexOf(`data-serie="${nom}"`)); const c = (g.match(/<circle[^>]*data-point="citrus"[^>]*>/) ?? [''])[0];
      return { x: Number(/cx="([\d.-]+)"/.exec(c)![1]), y: Number(/cy="([\d.-]+)"/.exec(c)![1]), decale: /data-decale="([\d.-]+)"/.exec(c)?.[1] };
    };
    const [avec, sans] = [rendu(true), rendu(false)];
    const L = citrus(sans, 'Lotus'), S = citrus(sans, 'Solero'), C = citrus(sans, 'Calypso');
    expect([S.x, C.x]).toEqual([L.x, L.x]); // sans l'option, tout se superpose
    expect(sans).not.toContain('data-decale');
    const l = citrus(avec, 'Lotus'), s = citrus(avec, 'Solero'), c = citrus(avec, 'Calypso');
    expect(l.x).toBe(L.x); expect(l.decale).toBeUndefined(); // l'original reste au centre
    expect(s.x).toBeCloseTo(L.x - 7.3, 1); expect(c.x).toBeCloseTo(L.x + 7.3, 1);
    expect([s.y, c.y]).toEqual([L.y, L.y]); // le long de l'anneau seulement : pas de changement de rayon
    // les traits et les aires restent sur la valeur exacte
    expect(avec.match(/data-role="voile"[^>]*/g)).toEqual(sans.match(/data-role="voile"[^>]*/g));
    expect(avec.match(/<polygon[^>]*data-role="contour"[^>]*>/g)).toEqual(sans.match(/<polygon[^>]*data-role="contour"[^>]*>/g));
  });

  it('Substituer l’active, avec la légende et le reste inchangés', () => {
    const niveaux = (n: number) => Object.fromEntries(AXES_U4.map((f) => [f, n])) as Record<FamilyId, 0 | 1 | 2>;
    const html = renderToStaticMarkup(<RadarU4 series={[
      { cle: 'a', nom: 'A', couleur: '#4d4d4d', original: true, niveaux: niveaux(1) },
      { cle: 'b', nom: 'B', couleur: '#0072B2', original: false, niveaux: niveaux(0) },
    ]} retenu="b" attendues={new Set()} inconnues={new Set()} nomStyle="16D" />);
    expect(html).toContain('data-role="trou-du-zero"');
    expect(html).toContain('data-creux="0"');
  });
});
