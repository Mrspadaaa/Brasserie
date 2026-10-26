// D180 et D181 (26.10), sur le radar commun : ses mots, « si les traits haché traversent le graph, ça enlève de la visibilité » et
// « Les points bleu sont difficile à voir ». Le contrôle Chrome, sur les écrans : tests/integration/controle-radar-lisible.mjs.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RadarBase, type SerieRadar } from '../../../src/ui/hopIndex/commun/RadarBase';
import type { FamilyId } from '../../../src/domain/hopIndex/v4';

const FAMILLES: FamilyId[] = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
// Les familles 4 à 8 (pomeFruit à herbal) sont inconnues de toutes les séries : un secteur « sans donnée » regroupé en bas.
const bas = { citrus: 1, tropical: 2, melon: 1, stoneFruit: 2, spice: 1, earthy: 2, resin: 1 };
const serie = (cle: string, role: SerieRadar['role'], couleur: string, valeurs = bas): SerieRadar => ({ cle, nom: cle, couleur, role, valeurs });
const rendre = (series: SerieRadar[]) => renderToStaticMarkup(
  <RadarBase familles={FAMILLES} mode="absolu" objet="houblons" label="radar" echelleAbsolue={{ pas: 1, nb: 3 }} series={series} />,
);

const [CX, CY] = [179, 156]; // data-centre du radar commun (W = 358, RR = 124)
const RR = 124;
/** Les tiretés d'un rendu : leur géométrie, lue dans le HTML. */
function tires(html: string) {
  const bal = html.match(/<(?:line|path)[^>]*data-role="tirete"[^>]*>/g) ?? [];
  return bal.map((b) => ({ html: b, d: /\bd="([^"]+)"/.exec(b)?.[1] ?? null, l: ['x1', 'y1', 'x2', 'y2'].map((k) => Number(new RegExp(`${k}="([\\d.-]+)"`).exec(b)?.[1] ?? NaN)) }));
}
const dSeg = (p: number[], q: number[]) => {
  const dx = q[0] - p[0], dy = q[1] - p[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((CX - p[0]) * dx + (CY - p[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] + t * dx - CX, p[1] + t * dy - CY);
};
/** La distance minimale d'un tireté au centre : segments droits, et arcs (au rayon donné). */
function distMin(t: ReturnType<typeof tires>[number]) {
  if (!t.d) return dSeg([t.l[0], t.l[1]], [t.l[2], t.l[3]]);
  const jetons = t.d.match(/[MLA][^MLA]*/g)!;
  let cur: number[] = [], mini = Infinity;
  for (const j of jetons) {
    const n = j.slice(1).trim().split(/[ ,]+/).map(Number);
    if (j[0] === 'M') cur = n;
    else if (j[0] === 'L') { mini = Math.min(mini, dSeg(cur, n)); cur = n; }
    else { mini = Math.min(mini, n[0]); cur = n.slice(-2); } // l'arc est au rayon n[0]
  }
  return mini;
}

describe('radar commun D180 : le tireté longe le secteur « sans donnée »', () => {
  const html = rendre([serie('Lotus', 'contour', '#4d4d4d'), serie('Caliente', 'autre', '#0072B2'), serie('Citra cryo', 'retenu', '#009E73', { ...bas, citrus: 2, resin: 2 })]);
  const t = tires(html);

  it('un tireté par série enjambe le secteur, et aucun ne passe par la corde qui coupait le radar', () => {
    expect(html).toContain('data-role="secteur-sans-donnee"');
    expect(t).toHaveLength(3);
    for (const x of t) {
      expect(x.d).not.toBeNull(); // un chemin qui contourne, plus une ligne droite
      expect(distMin(x)).toBeGreaterThanOrEqual(0.3 * RR - 0.5);
    }
  });

  it('les trois tiretés prennent chacun leur liseré : ils ne se recouvrent pas', () => {
    const rim = t.map((x) => x.d!.split(' ').filter((s) => s.startsWith('L')).slice(1, 3).join(' '));
    expect(new Set(rim).size).toBe(3);
  });

  it('un inconnu isolé entre deux axes voisins garde son tireté droit', () => {
    // La retenue ne manque que de « melon » (entre tropical et stoneFruit) : un tireté droit, haut dans le radar.
    const tout = Object.fromEntries(FAMILLES.map((f) => [f, 3]));
    const h = rendre([serie('A', 'retenu', '#009E73', { ...tout, melon: null }), serie('B', 'autre', '#0072B2', tout)]);
    const droits = tires(h).filter((x) => !x.d);
    expect(droits).toHaveLength(1);
    expect(distMin(droits[0])).toBeGreaterThan(0.3 * RR);
  });
});

describe('radar commun D180, Comparer en Absolu (critique r2) : une corde basse ne monte pas au bord', () => {
  it('une série à qui il manque trois familles que les autres décrivent : un arc d\'anneau, pas de rayon vers le bord', () => {
    const bas1 = Object.fromEntries(FAMILLES.map((f) => [f, 1]));
    const h = rendre([serie('A', 'retenu', '#009E73', { ...bas1, stoneFruit: null, pomeFruit: null, berries: null }), serie('B', 'autre', '#0072B2', bas1)]);
    const t = tires(h);
    expect(t).toHaveLength(1);
    expect(t[0].html).toContain('data-contour="arc"');
    const jetons = t[0].d!.match(/[MLA][^MLA]*/g)!;
    const rayons = jetons.map((j) => { const n = j.slice(1).trim().split(/[ ,]+/).map(Number); return j[0] === 'A' ? n[0] : Math.hypot(n[0] - CX, n[1] - CY); });
    expect(Math.max(...rayons)).toBeLessThan(0.55 * RR); // les deux points sont à 50 % : rien au-delà
    expect(distMin(t[0])).toBeGreaterThanOrEqual(0.3 * RR - 0.5);
  });
});

describe('radar commun D181 : des points qu\'on voit', () => {
  const html = rendre([serie('Caliente', 'autre', '#0072B2'), serie('Citra cryo', 'retenu', '#009E73', { ...bas, citrus: 2 })]);
  const cercles = (nom: string) => (html.slice(html.indexOf(`data-serie="${nom}"`)).match(/<circle[^>]*data-point[^>]*>/g) ?? []);

  it('9 px de diamètre au moins pour une série, 10 pour la retenue, et un liseré clair', () => {
    for (const [nom, mini] of [['Caliente', 4.5], ['Citra cryo', 5]] as const) {
      const c = cercles(nom).slice(0, 7);
      expect(c.length).toBeGreaterThan(0);
      for (const x of c) {
        expect(Number(/ r="([\d.]+)"/.exec(x)![1])).toBeGreaterThanOrEqual(mini);
        expect(x).toContain('stroke="#fff"');
        expect(Number(/stroke-width="([\d.]+)"/.exec(x)![1])).toBeGreaterThanOrEqual(1.5);
      }
    }
  });

  it('les couleurs de série ne changent pas', () => {
    expect(html).toContain('fill="#0072B2"');
    expect(html).toContain('fill="#009E73"');
  });
});
