// @vitest-environment jsdom
/**
 * Voie p5, bloquant 1 du jeu en ligne 9 : « À 1280, sur une longue liste (BAUHAUS 29 lignes), la ligne ajoutée reste sous le pied et son focus est dans un champ invisible. » La ligne se voit entière,
 * à toute largeur : on défile l'ANCÊTRE qui défile réellement, sur les rectangles du moment. Mise en page simulée (jsdom n'en a pas) ; la preuve sur Chrome réel est au banc (`mesurer-ajout.mjs`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { amenerEnVue, ancetreDefilant, basDesCollants, decalageVoulu } from '../../../../src/ui/depense/defilement';

describe('decalageVoulu : la ligne sous les collants, l\'unité au-dessus du pied', () => {
  const base = { ligneHaut: 602, ligneBas: 1003, uniteBas: 877, collantBas: 82, basVisible: 748 };
  it('« haut » : la ligne ajoutée, sous le pied, monte juste sous les éléments collants (HEAD ne descendait jamais : `dec<0` seulement)', () => {
    expect(decalageVoulu(base, 'haut')).toBe(602 - 86);
  });
  it('« haut » : une ligne plus haute que la zone garde le bas de l\'unité visible avant son haut', () => {
    expect(decalageVoulu({ ...base, ligneHaut: 100, ligneBas: 950, uniteBas: 880, basVisible: 700 }, 'haut')).toBe(880 - 700); // le haut resterait sous la bande de 100 − 86, l'unité passe avant
  });
  it('« minimal » : rien ne bouge quand la ligne est entière dans la zone', () => {
    expect(decalageVoulu({ ligneHaut: 120, ligneBas: 520, uniteBas: 420, collantBas: 82, basVisible: 748 }, 'minimal')).toBe(0);
  });
  it('« minimal » : après la saisie du nom, l\'unité sous le pied revient en vue, de juste ce qu\'il faut', () => {
    expect(decalageVoulu({ ...base, ligneHaut: 289, ligneBas: 700, uniteBas: 790 }, 'minimal')).toBe(790 - 748);
  });
  it('« minimal » : une ligne sous les collants descend juste sous eux', () => {
    expect(decalageVoulu({ ligneHaut: 60, ligneBas: 400, uniteBas: 300, collantBas: 82, basVisible: 748 }, 'minimal')).toBe(60 - 86);
  });
});

describe('amenerEnVue : le bon conteneur', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  const rect = (haut: number, bas: number, gauche = 0, droite = 800) => ({ top: haut, bottom: bas, left: gauche, right: droite, width: droite - gauche, height: bas - haut, x: gauche, y: haut, toJSON: () => ({}) }) as DOMRect;
  /** Un décor de 1280 : un parent qui n'a que `overflow:auto` sans rien à défiler (le faux conteneur), le vrai conteneur dessous, une bande collante, la ligne ajoutée tout en bas, le pied. */
  const decor = (origineLigne = 1063) => {
    const faux = document.createElement('div'); faux.style.overflowY = 'auto'; Object.defineProperty(faux, 'scrollHeight', { value: 700 }); Object.defineProperty(faux, 'clientHeight', { value: 700 }); faux.getBoundingClientRect = () => rect(0, 800);
    const vrai = document.createElement('div'); vrai.style.overflowY = 'auto';
    let scrollTop = 461; const MAX = 776;
    Object.defineProperty(vrai, 'scrollHeight', { value: 708 + MAX }); Object.defineProperty(vrai, 'clientHeight', { value: 708 });
    vrai.getBoundingClientRect = () => rect(40, 748);
    vrai.scrollBy = ((o: ScrollToOptions) => { scrollTop = Math.max(0, Math.min(MAX, scrollTop + (o.top ?? 0))); }) as never;
    const bande = document.createElement('div'); bande.className = 'dp-p3c-bande-entete'; bande.style.position = 'sticky'; bande.getBoundingClientRect = () => rect(40, 82);
    const gauche = document.createElement('div'); gauche.style.position = 'sticky'; gauche.getBoundingClientRect = () => rect(40, 748, 0, 440); // la colonne de gauche : ni sa largeur ni son bas ne comptent
    const ligne = document.createElement('div'); ligne.setAttribute('data-dp-ligne', 'x');
    ligne.getBoundingClientRect = () => rect(origineLigne - scrollTop, origineLigne - scrollTop + 401, 480, 1240);
    const unite = document.createElement('div'); unite.setAttribute('data-dp-cases-unite', ''); unite.getBoundingClientRect = () => rect(origineLigne - scrollTop + 191, origineLigne - scrollTop + 275, 480, 1240);
    ligne.append(unite); vrai.append(gauche, bande, ligne); faux.append(vrai);
    const pied = document.createElement('footer'); pied.getBoundingClientRect = () => rect(748, 800);
    document.body.append(faux, pied);
    return { faux, vrai, ligne, unite, bande, haut: () => scrollTop };
  };

  it('l\'ancêtre qui défile réellement est celui dont le contenu dépasse, pas le premier `overflow:auto` venu', () => {
    const d = decor();
    expect(ancetreDefilant(d.ligne)).toBe(d.vrai);
  });
  it('les collants comptent ceux de SA colonne seulement', () => {
    const d = decor();
    expect(basDesCollants(d.vrai, d.ligne)).toBe(82);
  });
  it('1280, longue liste : la ligne ajoutée sous le pied arrive entière (haut sous la bande, bas des cases au-dessus du pied)', () => {
    const d = decor();
    const avant = d.ligne.getBoundingClientRect(), uAvant = d.unite.getBoundingClientRect();
    expect(avant.top).toBe(602); expect(uAvant.bottom).toBeGreaterThan(748); // l'état du jeu 9 : cases sous le pied
    amenerEnVue(d.ligne, 'haut', d.faux); // le conteneur supposé (`faux`) est passé en repli : il ne doit PAS être préféré
    expect(d.haut()).toBe(776); // le défilement a eu lieu sur le vrai, jusqu'au bout de sa course
    const l = d.ligne.getBoundingClientRect(), u = d.unite.getBoundingClientRect();
    expect(l.top).toBeGreaterThanOrEqual(82); expect(u.bottom).toBeLessThanOrEqual(748);
  });
});
