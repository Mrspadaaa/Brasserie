/**
 * cal-74 : la lenteur mesurée du Calendrier (K73-3) et les constats de cal-73 (K73-1, K73-2, CALP-6).
 * Règles pures et garde-fous de code : la preuve sur le vrai rendu est dans scripts/mesure-calendrier.mjs (avant / après).
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { etiquetteSemainesAnnees } from '../../src/ui/calendrier/entete/Fenetre';
import { distinguerHomonymes, placerBulle } from '../../src/ui/calendrier/frise/Rangee';
import { courbeCaisse, courbeSans } from '../../src/domain/calendrierCaisse';
import { creerPlanificateur } from '../../src/ui/calendrier/useApresRendu';
import { largeurMemo, viderLargeurs } from '../../src/ui/calendrier/cacheTexte';
import { ACCELERATION_MAX, ACCELERATION_S, BANDE_CALENDRIER_PX, DETTE_POSE_MAX_MS, IMAGE_LENTE_MS, PART_LIBRE, PROFONDEUR_PLEINE_PX, accelerationTenue, plafondFenetre, posePermise, vitesseBordCalendrier } from '../../src/ui/calendrier/frise/defileBord';
import { colonnesParImage, sensDefilement } from '../../src/ui/calendrier/frise/usePointeur';
import { ajouterJours, numeroSemaine } from '../../src/domain/calendrier';
import { utc, versIso } from '../../src/domain/calendrier/dates';
import type { ChoseCalendrier } from '../../src/domain/calendrier';

const src = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

describe('K73-1 : le bouton de durée suit la fenêtre sous le doigt', () => {
  it('l’en-tête dit la fenêtre tirée (`tiree`) dans la pastille, pas seulement la fenêtre posée', () => {
    const t = src('src/ui/calendrier/entete/EnTete.tsx');
    expect(t).toMatch(/const nombreDit = !annee && tiree \? tiree\.nombre : nombre;/);
    expect(t).toMatch(/const pastille = libellePastille\(libelle, nombreDit, annee\);/);
    expect(t).toMatch(/libelleDuree\(nombreDit, annee\)/);
  });
});

describe('K73-2 : une semaine se dit sans année', () => {
  const semaines = (du: string, n: number) => Array.from({ length: n }, (_, k) => ajouterJours(du, 7 * k));
  it('S53 seule, jamais « S53 2026 » ; deux bouts : l’année reste', () => {
    const l = semaines('2026-12-21', 3);
    expect(numeroSemaine(l[1])).toBe(53);
    expect(etiquetteSemainesAnnees(l, 1, 1)).toBe('S53');
    expect(etiquetteSemainesAnnees(l, 0, 1)).toBe('S52');
    expect(etiquetteSemainesAnnees(l, 1, 2)).toBe('S53 2026 – S1 2027');
    expect(etiquetteSemainesAnnees(l, 0, 2)).toBe('S52 – S53 2026');
  });
});

describe('CALP-6 : deux brassins homonymes ne font jamais deux lignes identiques', () => {
  const brassin = (id: string, debut: string, extra: Partial<ChoseCalendrier> = {}) => ({
    id, rangee: 'brassins', titre: 'Jhhh', debut, fin: debut, coutAVenir: true, source: { genre: 'batch', id }, ouvre: { type: 'brassin', id }, deplacable: true, ...extra
  }) as unknown as ChoseCalendrier;
  it('même nom, même coût à venir, deux jours : le jour distingue', () => {
    const r = distinguerHomonymes([brassin('b5', '2027-09-05'), brassin('b7', '2027-09-07')]);
    expect(r[0].titre).toBe('Jhhh · 5 sept.');
    expect(r[1].titre).toBe('Jhhh · 7 sept.');
    expect(new Set(r.map(c => c.titre)).size).toBe(2);
    expect(r.map(c => c.id)).toEqual(['b5', 'b7']);
  });
  it('même jour aussi : le rang (1/2), (2/2)', () => {
    const r = distinguerHomonymes([brassin('a', '2027-09-05'), brassin('b', '2027-09-05')]);
    expect(r.map(c => c.titre)).toEqual(['Jhhh · 5 sept. (1/2)', 'Jhhh · 5 sept. (2/2)']);
  });
  it('un brassin seul, ou deux brassins de coûts différents : titres inchangés', () => {
    expect(distinguerHomonymes([brassin('a', '2027-09-05')])[0].titre).toBe('Jhhh');
    const r = distinguerHomonymes([brassin('a', '2027-09-05', { centimes: -100, coutAVenir: undefined }), brassin('b', '2027-09-07')]);
    expect(r.map(c => c.titre)).toEqual(['Jhhh', 'Jhhh']);
  });
  it('une série de loyers (genre plan, même titre) n’est pas touchée : elle se range en barre « / mois »', () => {
    const loyer = (id: string, d: string) => ({ id, rangee: 'finances', titre: 'Loyer du local', debut: d, fin: d, centimes: -40000, source: { genre: 'plan', id }, ouvre: { type: 'plan', id }, deplacable: true }) as unknown as ChoseCalendrier;
    const r = distinguerHomonymes([loyer('l1', '2027-01-01'), loyer('l2', '2027-02-01'), loyer('l3', '2027-03-01')]);
    expect(r.map(c => c.titre)).toEqual(['Loyer du local', 'Loyer du local', 'Loyer du local']);
  });
});

describe('K73-3 : lire la mise en page après le rendu, regroupé et espacé', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('requestAnimationFrame', (f: () => void) => setTimeout(f, 16) as unknown as number); vi.stubGlobal('cancelAnimationFrame', (n: number) => clearTimeout(n)); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it('une rafale de 30 demandes en 500 ms : la dernière seule part, jamais pendant le rendu', () => {
    let t = 0;
    const p = creerPlanificateur(250, () => t);
    const lu: number[] = [];
    for (let i = 0; i < 30; i++) { p.planifier(() => lu.push(i)); }
    expect(lu).toEqual([]);
    vi.advanceTimersByTime(40);
    expect(lu).toEqual([29]);
  });
  it('deux lectures successives sont espacées d’au moins `espaceMs`, et la dernière demande est toujours servie', () => {
    let t = 0;
    const p = creerPlanificateur(250, () => t);
    const lu: number[] = [];
    p.planifier(() => lu.push(1)); t += 20; vi.advanceTimersByTime(20);
    expect(lu).toEqual([1]);
    p.planifier(() => lu.push(2)); p.planifier(() => lu.push(3));
    vi.advanceTimersByTime(100); t += 100;
    expect(lu).toEqual([1]);
    t = 20 + 250; vi.advanceTimersByTime(260);
    expect(lu).toEqual([1, 3]);
  });
  it('annuler efface la demande en attente', () => {
    const p = creerPlanificateur(250, () => 0);
    const lu: number[] = [];
    p.planifier(() => lu.push(1)); p.annuler(); vi.advanceTimersByTime(1000);
    expect(lu).toEqual([]);
  });
  it('les lectures de mise en page ne sont plus dans un useLayoutEffect sans dépendances (rentrée, sous-poignées, mesure de l’en-tête, bulle)', () => {
    expect(src('src/ui/calendrier/frise/useRentree.ts')).not.toMatch(/useLayoutEffect\(/);
    expect(src('src/ui/calendrier/frise/useRentree.ts')).toMatch(/useApresRendu\(/);
    expect(src('src/ui/calendrier/entete/Courbe.tsx')).toMatch(/useApresRendu\(\(\) => \{ if \(racineCb\.current\) taireSousPoignees/);
    expect(src('src/ui/calendrier/entete/EnTete.tsx')).toMatch(/planMesure\.current\.planifier\(mesurer\)/);
    expect(src('src/ui/calendrier/frise/Rangee.tsx')).toMatch(/plan\.current\.planifier\(\(\) => plein\.current\(\)\)/);
  });
  it('le cadre de la frise et son bord gauche ne se lisent plus à chaque image du défilement', () => {
    const t = src('src/ui/calendrier/frise/usePointeur.ts');
    /* cal-75 : lus UNE fois par geste, non plus toutes les 250 ms (chaque relecture forçait la mise en page de tout l'onglet) */
    expect(t).toMatch(/cacheCadre\.current\.geste === geste/);
    expect(t).toMatch(/s\.gaucheT === undefined\) \{/);
    expect(t).toMatch(/cacheCadre\.current = null;/);
  });
});

describe('cal-75 : la lenteur du défilement au bord, ses causes mesurées', () => {
  it('`--cw` (variable custom) ne se pose plus sur chaque rangée de l’axe partagé : elle refaisait le style de tout le sous-arbre à chaque image', () => {
    const t = src('src/ui/calendrier/frise/Rangee.tsx');
    expect(t).toMatch(/props\.lineaire \? \{\} : \{ \['--cw' as string\]/);
    expect(src('src/ui/calendrier/frise/frise.css')).toMatch(/\.cal-frise--axe \.cal-lane \{ background-image: none; \}/);
  });
  it('les graduations de l’axe ont une clé de rang : elles ne sont plus démontées à chaque image', () => {
    expect(src('src/ui/calendrier/frise/Frise.tsx')).toMatch(/graduations\.map\(\(x, k\) => <i key=\{k\}/);
  });
  it('le jugement de la pastille du creux passe par le planificateur, plus par un flushSync à chaque image', () => {
    const t = src('src/ui/calendrier/entete/EnTete.tsx');
    expect(t).toMatch(/jugeCle\.current\.planifier\(planifie\)/);
    expect(t).not.toMatch(/requestAnimationFrame\(\(\) => flushSync\(juger\)\)/);
  });
  it('courbeSans rend la même courbe pour la même courbe et la même chose, et une courbe neuve pour une autre', () => {
    const c = courbeCaisse({ depart: 100000, lundi0: '2026-11-23', nbSemaines: 12, mouvements: [
      { id: 'm1', jour: '2026-12-01', centimes: -20000, nom: 'A', choseId: 'a' }, { id: 'm2', jour: '2026-12-08', centimes: 5000, nom: 'B', choseId: 'b' }] })!;
    const sansA = courbeSans(c, 'a');
    expect(courbeSans(c, 'a')).toBe(sansA);
    expect(sansA.mouvements.map(m => m.choseId)).toEqual(['b']);
    expect(courbeSans(c, 'b').mouvements.map(m => m.choseId)).toEqual(['a']);
    expect(c.mouvements).toHaveLength(2);
    const autre = courbeCaisse({ depart: 100000, lundi0: '2026-11-23', nbSemaines: 12, mouvements: [] })!;
    expect(courbeSans(autre, 'a')).not.toBe(sansA);
  });
});

describe('cal-75 : la bulle « lâcher ici » (tri par hauteur) garde sa règle', () => {
  const base = { w: 80, h: 24, x: 100, haut: 40, bas: 60, largeur: 300, piste: { left: 0, top: 0, height: 100 } };
  it('un mur ou un texte à la hauteur de la place la repousse ; un texte plus bas, jamais', () => {
    const libre = placerBulle({ ...base, murs: [], obstacles: [] });
    const gene = placerBulle({ ...base, murs: [], obstacles: [{ left: libre.left, top: libre.top, right: libre.left + 80, bottom: libre.top + 24, poids: 3 }] });
    expect(gene.left !== libre.left || gene.top !== libre.top).toBe(true);
    const loin = placerBulle({ ...base, murs: [], obstacles: [{ left: libre.left, top: 5000, right: libre.left + 80, bottom: 5024, poids: 3 }] });
    expect(loin).toEqual(libre);
    const mur = { left: libre.left - 4, top: libre.top - 4, right: libre.left + 90, bottom: libre.top + 30 };
    const evite = placerBulle({ ...base, murs: [mur], obstacles: [] });
    expect(evite.left !== libre.left || evite.top !== libre.top).toBe(true);
  });
});

describe('K73-3 : mémoires de l’ouverture', () => {
  it('largeurMemo ne mesure qu’une fois par (police, texte) et se vide', () => {
    viderLargeurs();
    const mesurer = vi.fn(() => 42);
    expect(largeurMemo('400|x', 'Jhhh', mesurer)).toBe(42);
    expect(largeurMemo('400|x', 'Jhhh', mesurer)).toBe(42);
    expect(mesurer).toHaveBeenCalledTimes(1);
    expect(largeurMemo('700|x', 'Jhhh', () => 50)).toBe(50);
    viderLargeurs();
    largeurMemo('400|x', 'Jhhh', mesurer);
    expect(mesurer).toHaveBeenCalledTimes(2);
  });
  it('utc et versIso rendent les mêmes valeurs qu’avant la mémoïsation, dates d’été et d’hiver comprises', () => {
    for (const iso of ['2026-03-29', '2026-10-25', '2026-12-31', '2027-01-01', '2024-02-29']) {
      const [y, m, d] = iso.split('-').map(Number);
      expect(utc(iso)).toBe(Date.UTC(y, m - 1, d));
      expect(utc(iso)).toBe(Date.UTC(y, m - 1, d));
      expect(versIso(utc(iso))).toBe(iso);
      expect(versIso(utc(iso))).toBe(new Date(utc(iso)).toISOString().slice(0, 10));
    }
  });
});

describe('Q-4 : le défilement au bord, plus rapide, réglé, atteignable au pouce', () => {
  it('la bande du Calendrier fait 72 px et la vitesse pleine est atteinte à 24 px du bord (hors du geste retour d’Android)', () => {
    expect(BANDE_CALENDRIER_PX).toBe(72);
    expect(PROFONDEUR_PLEINE_PX).toBe(24);
    const v = (d: number) => vitesseBordCalendrier(390 - d, 390, 1);
    expect(v(80).sens).toBe(0);
    expect(v(71).sens).toBe(1);
    expect(v(24).vitesse).toBeCloseTo(1.35, 6);
    expect(v(4).vitesse).toBeCloseTo(1.35, 6);
    expect(v(48).vitesse).toBeGreaterThan(v(60).vitesse);
    expect(v(60).vitesse).toBeGreaterThan(0.15);
    /* à 24 px le doigt allait à ~0,45 largeur par seconde avant (bande de 40 px) : maintenant 3 fois plus */
    expect(v(24).vitesse / 0.45).toBeGreaterThan(2.5);
    expect(vitesseBordCalendrier(5, 390, -1).sens).toBe(-1);
    expect(vitesseBordCalendrier(5, 390, 1).sens).toBe(0);
  });
  it('sensDefilement suit la nouvelle bande', () => {
    expect(sensDefilement(330, 1, { left: 0, right: 390 })).toBe(1);
    expect(sensDefilement(300, 1, { left: 0, right: 390 })).toBe(0);
  });
  it('la vitesse monte avec le temps tenu, de ×1 à ×1,6 en 1,2 s, jamais plus', () => {
    expect(accelerationTenue(0)).toBe(1);
    expect(accelerationTenue(ACCELERATION_S / 2)).toBeCloseTo(1 + (ACCELERATION_MAX - 1) / 2, 9);
    expect(accelerationTenue(ACCELERATION_S)).toBeCloseTo(ACCELERATION_MAX, 9);
    expect(accelerationTenue(30)).toBeCloseTo(ACCELERATION_MAX, 9);
    expect(accelerationTenue(-1)).toBe(1);
  });
  it('le plafond de colonnes par seconde suit l’accélération ; sans temps tenu, il reste 8 (K57-1)', () => {
    expect(plafondFenetre(12, 1)).toBeCloseTo(16, 9);
    expect(plafondFenetre(12, 1, ACCELERATION_S)).toBeCloseTo(16 * ACCELERATION_MAX, 9);
    expect(colonnesParImage(100, 1, 390, 65)).toBeCloseTo(8, 9);
    expect(colonnesParImage(100, 1, 390, 65, ACCELERATION_MAX)).toBeCloseTo(8 * ACCELERATION_MAX, 9);
  });
  it('tenu 2 s au fond de la bande, 6 sem. (colonne de 65 px) : plus de colonnes qu’au tour 73, jamais d’emballement (≤ 8 × 1,6 par seconde)', () => {
    let tenu = 0, acc = 0;
    for (let i = 0; i < 120; i++) { const dt = 1 / 60; tenu += dt; acc += colonnesParImage(1.35 * 2.5, dt, 390, 65, accelerationTenue(tenu)); }
    expect(acc).toBeGreaterThan(16);
    expect(acc).toBeLessThanOrEqual(8 * ACCELERATION_MAX * 2 + 1e-6);
  });
  it('les trois défilements gardent le pas de temps élargi (une image lente n’est plus rabotée au quart)', () => {
    const t = src('src/ui/calendrier/frise/usePointeur.ts');
    expect(t).toMatch(/Math\.min\(DT_MAX_S, \(t - s\.tPrec\) \/ 1000\)/);
    expect(src('src/ui/calendrier/entete/Fenetre.tsx')).toMatch(/accelerationTenue\(s\.tenu\)/);
    expect(src('src/ui/calendrier/frise/DureeFenetre.tsx')).toMatch(/accelerationTenue\(s\.tenu\)/);
  });
});

describe('cal-76 : le geste au bord hors du rendu de chaque image, le lâcher en un rendu', () => {
  it('contre-pression : la première pose part tout de suite ; la suivante attend un tiers du temps occupé, au plus 400 ms de dette comptée', () => {
    expect(posePermise(0, 0)).toBe(true);
    expect(posePermise(300, 99)).toBe(false);
    expect(posePermise(300, 100)).toBe(true);
    expect(posePermise(5000, DETTE_POSE_MAX_MS * PART_LIBRE)).toBe(true);
    expect(IMAGE_LENTE_MS).toBeGreaterThan(17);
  });
  it('simulé à ×6 (une pose coûte 180 ms, une image libre 8 ms) : 2 s au bord donnent au moins 3 poses par seconde et une image médiane libre', () => {
    let t = 0, occupe = 0, libre = 0, poses = 0; const images: number[] = [];
    while (t < 2000) {
      if (posePermise(occupe, libre)) { poses++; occupe = 180; libre = 0; images.push(180); t += 180; }
      else { libre += 8; images.push(8); t += 8; }
    }
    const med = [...images].sort((a, b) => a - b)[Math.floor((images.length - 1) / 2)];
    expect(poses / 2).toBeGreaterThanOrEqual(3);
    expect(med).toBeLessThanOrEqual(17);
  });
  it('la fenêtre du geste avance dans une référence, se pose au rythme du rendu, et le lâcher garde la fenêtre montrée (celle du pas lu)', () => {
    const t = src('src/components/tabs/CalendrierTab.tsx');
    const defiler = t.slice(t.indexOf('const defilerFenetre = useCallback'), t.indexOf('const actionsBarre ='));
    expect(defiler).toMatch(/const f = poseGeste\.current\.fen \?\? fenetreRef\.current;/);
    expect(defiler).toMatch(/poserFenetreGeste\(fen\);/);
    expect(defiler).not.toMatch(/agirCadre\(\{ type: 'poser'/);
    expect(defiler).toMatch(/if \(!poseGeste\.current\.fen\) agirCadre\(\{ type: 'debutGeste' \}\);/);
    const rendre = t.slice(t.indexOf('const rendreFenetre = '), t.indexOf('const finGeste = '));
    expect(rendre).not.toMatch(/agirCadre\(\{ type: 'poser'/);
    expect(rendre).toMatch(/cancelAnimationFrame\(g\.raf\)/);
    expect(t).toMatch(/if \(enAttente && posePermise\(g\.occupe, g\.libre\)\)/);
  });
  it('le lâcher : la fin du geste attend l’écriture et se rend avec son message (un rendu, la barre ne revient pas une image en arrière)', () => {
    const t = src('src/components/tabs/CalendrierTab.tsx');
    expect(t).toMatch(/finEnAttente\.current\?\.\(\);\s*compteur\.current \+= 1;/);
    const glisse = t.slice(t.indexOf('const surLacheGlisse = useCallback'), t.indexOf('const surBord = useCallback'));
    expect(glisse).toMatch(/if \(annule \|\| k === 0\) \{ finir\(\); return; \}/);
    expect(glisse).toMatch(/if \(ecrit\) void ecrit\.finally\(finUneFois\); else finUneFois\(\);/);
    const bord = t.slice(t.indexOf('const surLacheBord = useCallback'), t.indexOf('const surToucher = useCallback'));
    expect(bord).toMatch(/\.finally\(finUneFois\)/);
  });
  it('l’axe, la mesure et le pas relu suivent la pose avant la peinture ; la mesure sous le + est figée pendant un geste', () => {
    expect(src('src/ui/calendrier/entete/EnTete.tsx')).toMatch(/useLayoutEffect\(\(\) => \{ onAxeRef\.current\?\.\(/);
    const f = src('src/ui/calendrier/frise/Frise.tsx');
    expect(f).toMatch(/React\.useLayoutEffect\(\(\) => \{ onMesureRef\.current\?\.\(/);
    expect(f).toMatch(/const cleMise = props\.drag \? cleMiseFigee\.current : cleMiseVive;/);
    expect(src('src/ui/calendrier/frise/usePointeur.ts')).toMatch(/useLayoutEffect\(\(\) => \{\s*const s = etat\.current;\s*if \(!s \|\| !\(opts\.current\.largeurColonne > 0\)\) return;/);
  });
});
