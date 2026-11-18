// @vitest-environment jsdom
// Port du carnet, correction 4, lot C : Comparer (R06, g01-8), Choisir et Pourquoi ce choix (R07, g05-9, g05-11), Supprimer une idée
// (R23, G35 g5:v08-27), À venir (R28, h05-9). Problèmes de CRITIQUE-4 : 6, 10, 14, 16, 17, 20, 32, 35, 38, 39, 40, 41, 42, 45, 46.
// Calcul local, aucune IA : chaque nombre cité vient du tableau.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { compromisDe, libelleEcarte, placesDe, pourquoiDe, rangePar, tableau } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type DonneesCarnet } from '../../src/domain/carnets/modele';
import { Comparer, colonnesVue } from '../../src/ui/carnets/Comparer';
import { Choisir } from '../../src/ui/carnets/Choisir';
import { SupprimerCarnet } from '../../src/ui/carnets/SupprimerCarnet';
import type { ArticleV, ChoixV, ContenuCarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(cleanup);
const rien = () => undefined;
const F = fixtureCarnets();
const carnet = (id: string): CarnetDoc => lireCarnet(F.find(i => i.id === id))!;
const V = carnet(ID_VENTILATION);
const avec = (c: CarnetDoc, d: Partial<DonneesCarnet>): CarnetDoc => ({ ...c, carnet: { ...c.carnet, ...d } });
const page = (valeur: string | number | boolean, unite?: string) => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' as const });

/* Le 19 du banc (g5:v06-11) : deux pompes collées, aucun critère chiffré ; le prix est la seule colonne qui classe. */
const pompe690: Article = { id: 'P1', nom: 'Pompe de transfert inox', prixCentimes: 69000, devise: 'CHF', vendeur: 'Pompe Inox', lecture: 'lue',
  valeurs: { 'débit': page('40', 'L/min'), 'température max': page('90', '°C') } };
const pompe245: Article = { id: 'P2', nom: 'Pompe magnétique 12 V', prixCentimes: 24500, devise: 'CHF', lecture: 'lue',
  valeurs: { 'débit': page('25', 'L/min'), 'température max': page('100', '°C') } };
const nonLu: Article = { id: 'P3', url: 'https://exemple.invalid/pompe-x', domaine: 'exemple.invalid', lecture: 'illisible', valeurs: {} };
const pompes = (articles: Article[]): CarnetDoc => avec(V, { criteres: [], facons: [], articles, choix: undefined });

describe('P6 · un lien non lu et sans valeur n\'est jamais classé : il est à relire', () => {
  it('Ventilation : le lien vide sort des lignes et entre dans aRelire', () => {
    const t = tableau(V)!;
    expect(t.lignes.some(l => l.articleId === 'ZZ-V-A5')).toBe(false);
    expect(t.aRelire.map(a => a.id)).toEqual(['ZZ-V-A5']);
  });
  it('pompes : le 3e lien non lu n\'a ni rang ni colonne', () => {
    const t = tableau(pompes([pompe690, pompe245, nonLu]))!;
    expect(t.lignes.map(l => l.articleId)).toEqual(['P2', 'P1']);
    expect(t.aRelire.map(a => a.id)).toEqual(['P3']);
  });
  it('Comparer montre « ? Lien sans aperçu · à relire · Ouvrir ↗ », hors du tableau', () => {
    const { container } = render(<Comparer titre="Pompe" statut="research" tableau={tableau(pompes([pompe690, pompe245, nonLu]))} onRetour={rien} />);
    const liste = container.querySelector('ul.cn-a-relire')!;
    expect(liste.textContent).toContain('Lien sans aperçu');
    expect(liste.textContent).toContain('exemple.invalid · à relire');
    const lien = within(liste as HTMLElement).getByRole('link', { name: /Ouvrir exemple\.invalid/ });
    expect(lien.getAttribute('href')).toBe('https://exemple.invalid/pompe-x');
    expect(container.querySelectorAll('table.cn-tableau-comparer thead th').length).toBe(3);
  });
});

describe('P10 et P32 · l\'ordre suit les critères, puis le prix croissant ; l\'en-tête dit la même règle', () => {
  it('prix seule colonne qui classe : 245 avant 690 (19)', () => {
    const t = tableau(pompes([pompe690, pompe245]))!;
    expect(t.lignes.map(l => l.prixCentimes)).toEqual([24500, 69000]);
    expect(t.rangePar).toBe('le prix');
  });
  it('les valeurs lues sur 2 articles entrent en colonnes (débit, °C), après le prix, sans classer', () => {
    const t = tableau(pompes([pompe690, pompe245]))!;
    expect(t.colonnes.map(k => [k.nom, k.unite, k.lue])).toEqual([['débit', 'L/min', true], ['température max', '°C', true]]);
    expect(colonnesVue(t).map(c => c.nom)).toEqual(['prix', 'débit', 'température max']);
    /* lue sur un seul article : pas de colonne */
    const seul = tableau(pompes([pompe690, { ...pompe245, valeurs: {} }]))!;
    expect(seul.colonnes).toEqual([]);
  });
  it('inconnu après connu, jamais 0 : un prix inconnu passe après', () => {
    const t = tableau(pompes([{ ...pompe245, prixCentimes: undefined }, pompe690, { ...pompe245, id: 'P4', prixCentimes: 30000 }]))!;
    expect(t.lignes.map(l => l.articleId)).toEqual(['P4', 'P1', 'P2']);
    expect(t.lignes[2].prixCentimes).toBeUndefined();
  });
  it('rangePar = l\'ordre réel : Ventilation, critères puis prix ; l\'en-tête de Comparer affiche la même chaîne et le critère qui classe', () => {
    const t = tableau(V)!;
    expect(t.rangePar).toBe(rangePar(V));
    expect(t.rangePar).toBe('tient 80 °C d\'abord, puis le débit, puis le prix');
    /* l'ordre suit bien cette règle : oui (1 800, 1 200), non (1 500), inconnu (1 100) */
    expect(t.lignes.filter(l => l.rang).map(l => l.articleId)).toEqual(['ZZ-V-A1', 'ZZ-V-A2', 'ZZ-V-A3', 'ZZ-V-A4']);
    /* deux articles égaux sur les critères : le prix les départage */
    const egaux = tableau(avec(V, { articles: [V.carnet.articles[0], { ...V.carnet.articles[0], id: 'X', prixCentimes: 200000 }] }))!;
    expect(egaux.lignes.map(l => l.articleId)).toEqual(['X', 'ZZ-V-A1']);
    const { container } = render(<Comparer titre="Ventilation" statut="research" critere={V.carnet.criteres[0] as never} tableau={t} onRetour={rien} />);
    /* critique 6, n° 4 (g01-8) : « classées par … », la même règle */
    expect(container.textContent).toContain(`classées par ${t.rangePar}`);
    /* « Ce qui compte » nomme le critère qui classe d'abord, pas une phrase qui ne classe rien (« plus de condensation ») */
    expect(container.querySelector('.cn-cmp-critere')!.textContent).toBe("Ce qui compte tient 80 °C · proposé par l'IA"); /* critique 6, point 16 : sa source, lue sur la colonne */
  });
});

describe('P14 · Comparer = g01-8 : compromis calculé avec les valeurs, « Valeurs annoncées par les vendeurs », vignettes', () => {
  it('compromisDe cite des valeurs du tableau (Ventilation : la 2e, moins chère, même tenue à 80 °C)', () => {
    const t = tableau(V)!;
    const c = compromisDe(t)!;
    expect(c).toBe('la 2e, 1 450 CHF, soit 1 150 CHF de moins que la 1re ; le débit 1 200 m³/h au lieu de 1 800 m³/h ; tient 80 °C : oui, comme la 1re');
    /* chaque nombre cité est une valeur ou un écart du tableau */
    for (const n of ['1 450', '1 150', '1 200', '1 800']) expect(c).toContain(n);
  });
  it('compromisDe sur le prix seul : la 1re, la moins chère, et les valeurs lues citées sans jugement', () => {
    expect(compromisDe(tableau(pompes([pompe690, pompe245])))).toBe('la 1re, 245 CHF, la moins chère ; 445 CHF de moins que la 2e ; le débit 25 L/min contre 40 L/min ; la température max 100 °C contre 90 °C');
  });
  it('à moins de 2 articles en lice : aucun compromis', () => {
    expect(compromisDe(null)).toBeNull();
    expect(compromisDe(tableau(pompes([pompe690, nonLu])))).toBeNull();
  });
  it('Comparer rend « Compromis : » local (picto local, pas ✻), « Valeurs annoncées par les vendeurs · exemple » et la photo en vignette', () => {
    const t = tableau(V)!;
    const { container } = render(<Comparer titre="Ventilation" statut="research" tableau={t} photos={{ 'ZZ-V-A1': 'data:image/png;base64,AA' }} onRetour={rien} />);
    const encart = container.querySelector('.cn-compromis')!;
    expect(encart.getAttribute('data-source')).toBe('locale');
    expect(encart.textContent).toContain('Compromis : la 2e, 1 450 CHF');
    expect(encart.textContent).not.toContain('✻');
    expect(container.querySelector('.cn-annonce')!.textContent).toContain('Valeurs annoncées par les vendeurs');
    expect(container.querySelector('.cn-annonce')!.textContent).toContain('exemple');
    expect(container.querySelectorAll('thead img.cn-cmp-vignette').length).toBe(1);
  });
  it('le compromis de l\'IA prime quand il existe', () => {
    const { container } = render(<Comparer titre="V" statut="research" tableau={tableau(V)} compromis="la 1re, à peine plus chère" onRetour={rien} />);
    expect(container.querySelector('.cn-compromis')!.getAttribute('data-source')).toBe('ia');
    expect(container.querySelector('.cn-compromis')!.textContent).toContain('la 1re, à peine plus chère');
  });
  it('P38 et P46 : nom sur 2 lignes au plus, colonne de 760 px à 1280 (736 de contenu)', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets-decider.css'), 'utf8');
    expect(css).toMatch(/\.cn-comparer \.cn-cmp-nom \{[^}]*-webkit-line-clamp: 2;/);
    expect(css).toMatch(/@media \(min-width: 900px\) \{ article\.cn-page\.cn-comparer \{ max-width: 760px; \} \}/);
  });
});

describe('P41 · écarté : le nom une fois, l\'accord juste', () => {
  it('la raison ne répète pas « Ventilateur de plafond écartée »', () => {
    const l = tableau(V)!.lignes.find(x => x.articleId === 'ZZ-V-A6')!;
    expect(l.ecarte!.raison).toBe('brasse la buée sans la sortir');
    expect(`${l.nom} · ${libelleEcarte(l.ecarte!.raison)}`).toBe('Ventilateur de plafond 130 cm · écarté : brasse la buée sans la sortir');
    expect(libelleEcarte('')).toBe('écarté');
    expect(libelleEcarte('écarté : trop cher')).toBe('écarté : trop cher');
  });
});

/* Les articles de la fixture, tels que CarnetsVue les passe aux écrans. */
const articleV = (id: string) => V.carnet.articles.find(a => a.id === id) as unknown as ArticleV;

describe('P16 · Choisir = g05-9 et g05-11 : la 1re nommée, le pourquoi prérempli avec valeurs et rangs', () => {
  it('pourquoiDe cite les valeurs et les rangs du tableau', () => {
    const p = pourquoiDe(V, 'ZZ-V-A1')!;
    /* critique 6, n° 21 : le problème réglé, sans recopier les chiffres (ils sont dans le tableau et les réglettes) */
    expect(p).toBe('La seule à tenir 80 °C avec le plus gros débit ; en stock, Inox Broye (CH).');
    const places = placesDe(tableau(V)!, 'ZZ-V-A1');
    expect(places.find(x => x.nom === 'débit')).toMatchObject({ rang: 1, sur: 4, texte: '1 800 m³/h' });
    expect(places.find(x => x.nom === 'prix')).toMatchObject({ rang: 4, sur: 4, texte: '2 600 CHF' });
  });
  it('le cadre nomme l\'article (« Hotte inox 120 cm + moteur », « Inox Broye · CH · en stock ») ; le champ n\'est jamais vide', () => {
    const autres = ['ZZ-V-A2', 'ZZ-V-A3', 'ZZ-V-A4'].map((id, i) => ({ article: articleV(id), rang: i + 2 }));
    render(<Choisir etape="choisir" titre="Ventilation" carnet={V.carnet} article={articleV('ZZ-V-A1')} sur={4} valeurs={[]} autres={autres} onRetour={rien} onChoisir={rien} onEcarter={rien} />);
    const cadre = screen.getByRole('region', { name: 'Choisir' });
    expect(cadre.querySelector('.cn-offre-nom b')!.textContent).toBe('Hotte inox 120 cm + moteur');
    expect(cadre.querySelector('.cn-offre-nom .cn-mut')!.textContent).toBe('Inox Broye · CH · en stock');
    const champ = within(cadre).getByRole('textbox', { name: /Pourquoi/ }) as HTMLTextAreaElement;
    expect(champ.value).toBe(pourquoiDe(V, 'ZZ-V-A1'));
    expect(cadre.textContent).toContain('proposé, à corriger');
    /* les places viennent du carnet : débit 1er, prix 4e */
    expect(cadre.querySelector('table.cn-place')!.textContent).toContain('1 800 m³/h');
  });
  it('sans carnet passé : le pourquoi se calcule sur les articles reçus (prix et rang), jamais vide', () => {
    render(<Choisir etape="choisir" titre="Pompe" article={pompe245 as unknown as ArticleV} sur={2} valeurs={[]} autres={[{ article: pompe690 as unknown as ArticleV, rang: 2 }]} onRetour={rien} onChoisir={rien} onEcarter={rien} />);
    const champ = screen.getByRole('textbox', { name: /Pourquoi/ }) as HTMLTextAreaElement;
    /* critique 6, n° 21 : sans critère, le prix seul départage : « la moins chère », sans chiffre recopié */
    expect(champ.value).toMatch(/^La moins chère/);
    expect(champ.value).not.toMatch(/[0-9]/);
  });
});

describe('P17 et P40 · Pourquoi ce choix = g05-11 : phrase avec valeurs, réglettes, ✕ de chaque écarté, photo, CHF', () => {
  const choix: ChoixV = { articleId: 'ZZ-V-A1', pourquoi: 'la seule qui sort la buée', ecartes: [], le: '2026-11-17T10:00:00.000Z', remplaces: [] };
  const choisi = avec(V, { choix: choix as never });
  const vue = () => render(<Choisir etape="choisi" titre="Ventilation" carnet={choisi.carnet} choix={choix} article={{ ...articleV('ZZ-V-A1'), photo: 'data:image/png;base64,AA' }}
    critere={V.carnet.criteres[1] as never} ecartes={[]} onRetour={rien} />);
  it('la phrase de calcul avec ses valeurs, puis sa phrase à lui', () => {
    const { container } = vue();
    const section = screen.getByRole('region', { name: 'Pourquoi ce choix' });
    expect(section.querySelector('.cn-pourquoi-phrase')!.textContent).toContain('La seule à tenir 80 °C avec le plus gros débit');
    expect(section.querySelector('.cn-pourquoi-sienne')!.textContent).toBe('« la seule qui sort la buée »');
    expect(container.querySelector('img.cn-choisi-photo')).not.toBeNull();
  });
  it('réglettes « 1er sur 4 » (débit) et « 4e sur 4 » (prix), un point par article connu, le choisi plein', () => {
    vue();
    const reglettes = screen.getAllByRole('img', { name: /sur 4/ });
    expect(reglettes.map(r => r.getAttribute('aria-label'))).toEqual(['débit : 1 800 m³/h, 1er sur 4', 'prix : 2 600 CHF, 4e sur 4']);
    expect(reglettes[0].querySelectorAll('.cn-reglette-piste i:not(.cn-reglette-moi)').length).toBe(4);
    expect(reglettes[1].textContent).toContain('‹ moins cher · 420');
    expect(reglettes[1].textContent).toContain('2 600 CHF');
  });
  it('✕ de l\'écarté (façon écartée) avec sa raison, sans « écarté : » doublé ; prix avec CHF', () => {
    const { container } = vue();
    const x = screen.getAllByRole('img', { name: 'écarté' });
    expect(x.length).toBe(1);
    expect(x[0].closest('li')!.textContent).toBe('Ventilateur de plafond 130 cm : brasse la buée sans la sortir');
    expect(container.querySelector('.cn-choisi-carte')!.textContent).toMatch(/2\s600\sCHF/);
  });
});

describe('P20, P42, P45 · Supprimer une idée (g4:v02-18, G35 g5:v08-27)', () => {
  const contenu = {
    articles: [{ id: 'a', valeurs: {}, lecture: 'lue', veille: { active: true, depuis: '2026-11-01' } }, { id: 'b', valeurs: {}, lecture: 'lue', veille: { active: true, depuis: '2026-11-01' } }],
    photos: [], facons: [], notes: [{ id: 'n', texte: 'x', genre: 'note' }]
  } as unknown as ContenuCarnetV;
  it('G35 : « 2 articles en veille : les déplacer dans Ventilation avant · Déplacer » quand un carnet proche est donné', () => {
    let deplace = 0;
    render(<SupprimerCarnet titre="Hotte" contenu={contenu} liens={[]} proche={{ titre: 'Ventilation avant', onDeplacer: () => { deplace += 1; } }} onDetacher={rien} onArchiver={rien} onSupprimer={rien} onGarder={rien} />);
    const aide = document.querySelector('.cn-g35')!;
    expect(aide.textContent).toContain('2 articles en veille : les déplacer dans Ventilation avant');
    within(aide as HTMLElement).getByRole('button', { name: /Déplacer/ }).click();
    expect(deplace).toBe(1);
    expect(document.querySelector('.cn-supprimer')!.textContent).toContain("s'arrête pour les 2");
  });
  it('sans carnet proche : pas d\'offre', () => {
    render(<SupprimerCarnet titre="Hotte" contenu={contenu} liens={[]} proche={null} onDetacher={rien} onArchiver={rien} onSupprimer={rien} onGarder={rien} />);
    expect(document.querySelector('.cn-g35')).toBeNull();
  });
  it('P42 : le plan se nomme une fois, sans « À venir · » en tête', () => {
    render(<SupprimerCarnet titre="Frigo" contenu={contenu} liens={[{ sorte: 'plan-a-venir', planId: 'p', libelle: 'Frigo de garde pour fûts', reglage: 'detacher' }]} onDetacher={rien} onArchiver={rien} onSupprimer={rien} onGarder={rien} />);
    const ligne = document.querySelector('.cn-lien-retient-tx')!;
    expect(ligne.textContent).toBe('Frigo de garde pour fûts · plan dans À venir');
    expect(document.querySelector('.cn-liens-retiennent')!.textContent).not.toMatch(/À venir · /);
  });
  it('P45 : Supprimer grisé, contour et texte --c-mut, ≥ 3:1 sur le fond de la carte dans les deux thèmes', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets-decider.css'), 'utf8');
    expect(css).toMatch(/\.cn-supprimer \.cn-supprimer-bouton:disabled \{ border-color: var\(--c-mut\) !important;[^}]*color: var\(--c-mut\) !important;/);
    const THEMES = fs.readFileSync(path.resolve(__dirname, '../../src/theme/themes.css'), 'utf8');
    const couleur = (theme: string, nom: string): number[] => {
      const debut = THEMES.indexOf(`[data-theme='${theme}'] {`);
      const ligne = THEMES.slice(debut, THEMES.indexOf('}', debut)).split('\n').find(l => l.trim().startsWith(`--${nom}:`))!;
      return ligne.split(':')[1].split(';')[0].trim().split(/\s+/).map(Number);
    };
    const lum = (c: number[]) => { const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    for (const theme of ['clair', 'cave']) {
      /* fond de la carte : --c-rougebg = alert à 7 % sur --c-bg */
      const bg = couleur(theme, 'cave-950'), al = couleur(theme, 'alert');
      const fond = bg.map((v, i) => v * 0.93 + al[i] * 0.07);
      const [x, y] = [lum(couleur(theme, 'cave-texte-400')), lum(fond)].sort((m, n) => n - m);
      expect((x + 0.05) / (y + 0.05), theme).toBeGreaterThanOrEqual(3);
    }
  });
});
