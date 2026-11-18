// @vitest-environment jsdom
// Port du carnet, correction 3, lot C3-L2 : Comparer (R06), Choisir (R07), Supprimer une idée (R23). Rendus par props, aucune IA.
// P4 (suite à droite, ligne « Écarté » jamais vide), P5 et constat 5 (lien sans aperçu, jamais choisi tant qu'il n'est pas lu),
// Supprimer allumé à 0 lien (2 px, contraste ≥ 4,5:1 dans les deux thèmes), icônes nommées.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Comparer, apercuLigne, nonLusDe, sansApercu, type TableauV } from '../../src/ui/carnets/Comparer';
import { Choisir } from '../../src/ui/carnets/Choisir';
import { SupprimerCarnet } from '../../src/ui/carnets/SupprimerCarnet';
import type { ArticleV, ContenuCarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(cleanup);
const rien = () => undefined;

const tableau: TableauV = {
  colonnes: [{ nom: 'tient 80 °C', sens: 'oui-non' }, { nom: 'débit', unite: 'm³/h', sens: 'plus' }],
  rangePar: "tient 80 °C d'abord, puis le débit",
  lignes: [
    { articleId: 'a1', nom: 'Hotte inox 120 cm', rang: 1, cellules: { 'tient 80 °C': { valeur: true, origine: 'page' }, débit: { valeur: 1800, origine: 'page' } } as never, prixCentimes: 260000, devise: 'CHF', moinsBienPartout: false },
    { articleId: 'a2', nom: 'Hotte murale 100 cm', rang: 2, cellules: { 'tient 80 °C': { valeur: true, origine: 'page' }, débit: { valeur: 1200, origine: 'page' } } as never, prixCentimes: 145000, devise: 'CHF', moinsBienPartout: false },
    { articleId: 'a5', nom: 'exemple.invalid', rang: 3, cellules: {}, moinsBienPartout: false },
    { articleId: 'a4', nom: 'Extracteur centrifuge', rang: null, cellules: { débit: { valeur: 900, origine: 'page' } } as never, prixCentimes: 69000, devise: 'CHF', moinsBienPartout: false, ecarte: { raison: 'ne capte pas la buée' } },
  ],
};
const sansEcarte: TableauV = { ...tableau, lignes: tableau.lignes.filter(l => !l.ecarte) };

const article = (x: Partial<ArticleV> & { id: string }): ArticleV => ({ valeurs: {}, lecture: 'lue', ...x }) as ArticleV;
const lu = article({ id: 'a1', nom: 'Hotte inox 120 cm', vendeur: 'Inox Broye', pays: 'CH', prixCentimes: 260000, dispo: 'en stock', url: 'https://inox-broye.example/hotte' });
const nonLu = article({ id: 'a5', lecture: 'illisible', url: 'https://exemple.invalid/hotte-x' });

describe('P4 · Comparer à 390 : suite à droite visible, ligne « Écarté » jamais vide', () => {
  it('les écartés se lisent sous le tableau, nom et raison, et aucune case du tableau n\'est vide', () => {
    const { container } = render(<Comparer titre="Ventilation" statut="research" tableau={tableau} onRetour={rien} onChoisir={rien} />);
    const bloc = container.querySelector('table.cn-ecartes')!;
    expect(bloc.querySelector('caption')!.textContent).toBe('Écartés · 1');
    expect(bloc.querySelector('th')!.textContent).toBe('Extracteur centrifuge');
    /* correction 4, P41 : « écarté : <raison> », le nom une fois (dans le th) */
    expect(bloc.querySelector('td.cn-ecarte-raison')!.textContent).toBe('écarté : ne capte pas la buée');
    /* plus de rangée « Écarté » dans le tableau, où les colonnes en lice restaient vides */
    const lignesTableau = [...container.querySelectorAll('table.cn-tableau-comparer tbody tr')];
    expect(lignesTableau.map(tr => tr.querySelector('th')!.textContent)).not.toContain('Écarté');
    for (const td of container.querySelectorAll('table.cn-tableau-comparer tbody td')) expect((td.textContent ?? '').trim()).not.toBe('');
    /* l'écarté garde sa colonne, à la fin, grisée (D-52) */
    const tetes = [...container.querySelectorAll('table.cn-tableau-comparer thead th')];
    expect(tetes[tetes.length - 1].className).toContain('cn-ecarte');
  });
  it('sans écarté, aucune ligne « Écartés »', () => {
    const { container } = render(<Comparer titre="Ventilation" statut="research" tableau={sansEcarte} onRetour={rien} />);
    expect(container.querySelector('.cn-ecartes')).toBeNull();
    expect(container.textContent).not.toMatch(/Écarté/);
  });
  it('« → n de plus » compte les colonnes d\'article pas entièrement visibles ; rien quand tout tient', () => {
    const proto = HTMLElement.prototype;
    const zone = (el: Element) => el.classList.contains('cn-tableau-zone');
    const sw = vi.spyOn(proto, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) { return zone(this) ? 900 : 0; });
    const cw = vi.spyOn(proto, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) { return zone(this) ? 340 : 0; });
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (zone(this)) return { right: 370 } as DOMRect;
      const i = this.parentElement ? [...this.parentElement.children].indexOf(this) : 0;
      return { right: 100 + i * 150 } as DOMRect; /* th 1 : 250, th 2 : 400, th 3 : 550, th 4 : 700 */
    });
    try {
      const { container } = render(<Comparer titre="Ventilation" statut="research" tableau={tableau} onRetour={rien} />);
      expect(container.querySelector('.cn-tableau-cadre')!.hasAttribute('data-suite')).toBe(true);
      expect(container.querySelector('.cn-suite-indice')!.textContent).toBe('→ 3 de plus');
    } finally { sw.mockRestore(); cw.mockRestore(); rect.mockRestore(); }
    const { container } = render(<Comparer titre="Ventilation" statut="research" tableau={tableau} onRetour={rien} />);
    expect(container.querySelector('.cn-suite-indice')).toBeNull();
  });
});

describe('P5 et constat 5 · un lien sans aperçu s\'écrit honnêtement, jamais vide ni par son domaine seul', () => {
  it('sansApercu : libellé de la carte R04, domaine tiré de l\'adresse, rien pour un article nommé', () => {
    expect(sansApercu(nonLu)).toEqual({ titre: 'Lien sans aperçu', sous: 'exemple.invalid · page non lue', enCours: false });
    expect(sansApercu(article({ id: 'x', lecture: 'a-lire', domaine: 'gastro.example' }))).toEqual({ titre: 'gastro.example', sous: 'gastro.example · lecture…', enCours: true });
    expect(sansApercu(article({ id: 'y', lecture: 'illisible' }))!.sous).toBe('page non lue');
    expect(sansApercu(lu)).toBeNull();
    expect(nonLusDe([lu, nonLu])).toEqual({ a5: { lecture: 'illisible', nom: undefined, domaine: undefined, url: 'https://exemple.invalid/hotte-x' } });
  });
  it('Comparer : la colonne du lien non lu dit « Lien sans aperçu · exemple.invalid · page non lue » (par nonLus ou sans)', () => {
    for (const nonLus of [undefined, { a5: nonLu }]) {
      const { container } = render(<Comparer titre="Ventilation" statut="research" tableau={tableau} nonLus={nonLus} onRetour={rien} />);
      const th = container.querySelector('th[data-apercu]')!;
      expect(th.textContent).toBe('3eLien sans aperçuexemple.invalid · page non lue');
      expect(container.querySelectorAll('th[data-apercu]').length).toBe(1);
      cleanup();
    }
    /* un nom qui ressemble à un domaine mais porte des valeurs n'est pas « sans aperçu » */
    expect(apercuLigne({ ...tableau.lignes[2], cellules: { débit: { valeur: 1500, origine: 'page' } } as never })).toBeNull();
  });
  it('Choisir : la 5e offre non lue porte son libellé, la 1re non lue ne se choisit pas', () => {
    const onChoisir = vi.fn();
    const r = render(<Choisir etape="choisir" titre="Ventilation" onRetour={rien} article={lu} sur={2} valeurs={[]} autres={[{ article: nonLu, rang: 5 }]} onChoisir={onChoisir} onEcarter={rien} />);
    const carte = r.container.querySelector('.cn-article[data-apercu]')!;
    expect(carte.textContent).toBe('5Lien sans aperçuexemple.invalid · page non lue');
    for (const c of r.container.querySelectorAll('.cn-article')) expect(c.querySelector('b')!.textContent!.trim()).not.toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Choisir chez Inox Broye' }));
    expect(onChoisir).toHaveBeenCalledTimes(1);
    cleanup();
    const onChoisir2 = vi.fn();
    const r2 = render(<Choisir etape="choisir" titre="Ventilation" onRetour={rien} article={nonLu} sur={1} valeurs={[]} autres={[]} onChoisir={onChoisir2} onEcarter={rien} />);
    const bouton = screen.getByRole('button', { name: 'Choisir' }) as HTMLButtonElement;
    expect(bouton.disabled).toBe(true);
    fireEvent.click(bouton);
    expect(onChoisir2).not.toHaveBeenCalled();
    expect(r2.container.textContent).toContain('Lien sans aperçu');
    expect(r2.container.textContent).toContain('Elle se choisit une fois lue.');
    expect(r2.container.textContent).not.toMatch(/Part dans À venir :\s*,/);
    expect(r2.container.textContent).not.toMatch(/\b0 CHF/);
  });
});

/* Couleurs du thème : `rgb` en triplets « r g b » dans src/theme/themes.css. */
const THEMES = fs.readFileSync(path.resolve(__dirname, '../../src/theme/themes.css'), 'utf8');
function couleur(theme: string, nom: string): [number, number, number] {
  const debut = THEMES.indexOf(`[data-theme='${theme}'] {`);
  const bloc = THEMES.slice(debut, THEMES.indexOf('}', debut));
  const ligne = bloc.split('\n').find(l => l.trim().startsWith(`--${nom}:`));
  if (debut < 0 || !ligne) throw new Error(`${theme} ${nom} introuvable`);
  const [r, g, b] = ligne.split(':')[1].split(';')[0].trim().split(/\s+/).map(Number);
  return [r, g, b];
}
function luminance([r, g, b]: [number, number, number]) {
  const c = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
function contraste(a: [number, number, number], b: [number, number, number]) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

describe('(3) Supprimer (R23) : allumé à 0 lien, grisé avec au moins un lien', () => {
  const contenu = { articles: [], photos: [], facons: [], notes: [] } as unknown as ContenuCarnetV;
  const base = { titre: 'Évier inox 2 bacs', contenu, onDetacher: rien, onArchiver: rien, onGarder: rien };
  it('0 lien : actif et marqué allumé ; 1 lien : grisé', () => {
    const onSupprimer = vi.fn();
    const r = render(<SupprimerCarnet {...base} liens={[]} onSupprimer={onSupprimer} />);
    const b = screen.getByRole('button', { name: /Supprimer/ }) as HTMLButtonElement;
    expect(b.disabled).toBe(false);
    expect(b.hasAttribute('data-allume')).toBe(true);
    fireEvent.click(b);
    expect(onSupprimer).toHaveBeenCalled();
    r.rerender(<SupprimerCarnet {...base} liens={[{ sorte: 'plan-a-venir', planId: 'p1', libelle: 'Évier', reglage: 'detacher' }]} onSupprimer={onSupprimer} />);
    const g = screen.getByRole('button', { name: /^Supprimer/ }) as HTMLButtonElement;
    expect(g.disabled).toBe(true);
    expect(g.hasAttribute('data-allume')).toBe(false);
  });
  it('contour de 2 px, rouge sur le fond de page : ≥ 4,5:1 dans les deux thèmes ; grisé lisible (≥ 4,5:1)', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets-decider.css'), 'utf8');
    expect(css).toContain('.cn-supprimer .cn-supprimer-bouton { border-width: 2px !important;');
    expect(css).toContain('.cn-supprimer .cn-supprimer-bouton:not(:disabled) { border-color: var(--c-rouge) !important; color: var(--c-rouge) !important; background: var(--c-bg) !important; }');
    for (const theme of ['clair', 'cave']) {
      const fond = couleur(theme, 'cave-950');
      expect(contraste(couleur(theme, 'alert-texte'), fond), `${theme} rouge`).toBeGreaterThanOrEqual(4.5);
      expect(contraste(couleur(theme, 'cave-texte-400'), fond), `${theme} grisé`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('(4) Icônes de ces trois écrans : chacune nommée, ou décorative dans un bouton ou un lien qui se nomme', () => {
  function verifierIcones(container: HTMLElement) {
    const svgs = [...container.querySelectorAll('svg')];
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      if (svg.getAttribute('aria-label')) continue;
      expect(svg.getAttribute('aria-hidden'), svg.outerHTML.slice(0, 80)).toBe('true');
      const porteur = svg.closest('button, a, [role=img]')!;
      expect(porteur, svg.outerHTML.slice(0, 80)).toBeTruthy();
      const nom = porteur.getAttribute('aria-label') ?? porteur.textContent ?? '';
      expect(nom.trim().length, porteur.outerHTML.slice(0, 80)).toBeGreaterThan(1);
    }
  }
  it('Comparer, Choisir (choisir et choisi), Supprimer', () => {
    verifierIcones(render(<Comparer titre="Ventilation" statut="research" tableau={tableau} compromis="la 1re, à peine plus chère" onRetour={rien} onChoisir={rien} />).container);
    verifierIcones(render(<Choisir etape="choisir" titre="Ventilation" onRetour={rien} article={lu} sur={2} valeurs={[]} autres={[]} onChoisir={rien} onEcarter={rien} />).container);
    verifierIcones(render(<Choisir etape="choisi" titre="Ventilation" onRetour={rien} choix={{ articleId: 'a1', pourquoi: 'tient 80 °C', le: '2026-11-14', ecartes: [], remplaces: [] } as never}
      article={lu} critere={{ id: 'k', texte: 'tient 80 °C', origine: 'ia' } as never} ecartes={[{ nom: 'Extracteur centrifuge', raison: 'ne capte pas la buée' }]} onEnvoyerAVenir={rien} />).container);
    verifierIcones(render(<SupprimerCarnet titre="Frigo" contenu={{ articles: [], photos: [], facons: [], notes: [] } as never} liens={[{ sorte: 'plan-realise', planId: 'p', libelle: 'Frigo', reglage: 'archiver' }]} onDetacher={rien} onArchiver={rien} onSupprimer={rien} onGarder={rien} />).container);
    expect(screen.getAllByRole('img', { name: 'retenu' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: 'écarté' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Compromis' })).toBeTruthy();
  });
});
