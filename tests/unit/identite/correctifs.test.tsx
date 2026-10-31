// @vitest-environment jsdom
// Les correctifs du verdict du critique (p2) : ce que l'étape Identité garde de r4-a quand on la touche.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarteVolume } from '../../../src/ui/identite/CarteVolume';
import { PlagesStyle } from '../../../src/ui/identite/PlagesStyle';
import { TuilesMateriel } from '../../../src/ui/identite/TuilesMateriel';
import { VolumesReplies } from '../../../src/ui/identite/VolumesReplies';
import { recetteApercuIdentite } from '../../../src/ui/identite/apercuDev';
import { brewingStyles, resolveBrewingStyle } from '../../../src/domain/brewingStyles';

afterEach(cleanup);

describe('n° 9 et n° 10 : la carte du volume', () => {
  const rendre = () => render(
    <CarteVolume volumeL={55} onVolume={() => undefined} capaciteL={60} profilL={30} conseilL={48} cuveL={35}
      avantEbullition={{ litres: 71.2, evapL: 12 }} onOuvrirFermenteur={() => undefined} />
  );
  it('« cuve 35 L », sans « utile »', () => {
    rendre();
    const cuve = [...document.querySelectorAll('.idn-k')].map((n) => n.textContent!.replace(/\s+/g, ' ').trim()).find((t) => /^cuve/.test(t));
    expect(cuve).toBe('cuve 35 L');
  });
  it('fermenteur 60 L : règle 0–65, dernier chiffre « 60 », même quand le moût (71,2 L) la dépasse', () => {
    rendre();
    const echelle = document.querySelector('[data-role="echelle-volume"]')!;
    expect(echelle.getAttribute('data-max')).toBe('65');
    expect(document.querySelector('[data-role="echelle-volume"] .idn-dern')!.textContent).toBe('60');
  });
  it('la cuve dit son dépassement sur la barre, une fois', () => {
    rendre();
    const deb = document.querySelector('[data-role="debordement"]')!;
    expect(deb.textContent).toMatch(/\+36,2 L.*de trop/);
    expect(document.querySelectorAll('[data-role="debordement"]')).toHaveLength(1);
  });
  it('les zones de la barre se lisent sur la règle : la zone rouge va jusqu\'au bout de la barre coupée', () => {
    rendre();
    const dep = document.querySelector('.idn-cdep') as HTMLElement;
    const piste = document.querySelector('[data-role="cbox"]') as HTMLElement;
    expect(piste.style.width).toBe('100%');
    // 35 L / 65 L = 53,8 % → la zone rouge commence là et s'étend jusqu'à 100 %.
    expect(parseFloat(dep.style.left)).toBeCloseTo((35 / 65) * 100, 1);
    expect(parseFloat(dep.style.left) + parseFloat(dep.style.width)).toBeCloseTo(100, 1);
  });
});

describe('n° 7 : « à adopter » est le sous-titre de la tuile Matériel', () => {
  const tuiles = (aAdopter: boolean) => (
    <TuilesMateriel espaceLibrePct={20} materielNom="Système 30L" aAdopter={aAdopter} capaciteL={30} profilL={30}
      onCapacite={() => undefined} onRaz={() => undefined} ouvertMateriel={false} onOuvertMateriel={() => undefined} />
  );
  it('à adopter : « Système 30L · à adopter », le nom tel qu\'il a été saisi', () => {
    render(tuiles(true));
    expect(screen.getByRole('button', { name: /Matériel/ }).textContent!.replace(/\s+/g, ' ')).toContain('Système 30L · à adopter');
  });
  it('adopté : le nom seul', () => {
    render(tuiles(false));
    expect(screen.getByRole('button', { name: /Matériel/ }).textContent).not.toContain('adopter');
  });
});

describe('n° 3 : « Volumes » replié sur une ligne', () => {
  it('replié au repos, son contenu reste dans la page, caché ; un toucher le montre', () => {
    render(<VolumesReplies resume="Volumes · 34,7 / 35 L avant ébullition"><p>tableau</p></VolumesReplies>);
    const pli = screen.getByRole('button', { name: /Volumes · 34,7 \/ 35 L avant ébullition/ });
    expect(pli.getAttribute('aria-expanded')).toBe('false');
    expect((screen.getByText('tableau').parentElement as HTMLElement).hidden).toBe(true);
    fireEvent.click(pli);
    expect(pli.getAttribute('aria-expanded')).toBe('true');
    expect((screen.getByText('tableau').parentElement as HTMLElement).hidden).toBe(false);
  });
});

describe('n° 2 : une seule ligne de source, deux liens discrets', () => {
  const styles = brewingStyles();
  const style = resolveBrewingStyle(recetteApercuIdentite().style, undefined, styles)!;
  const rendre = (onChange?: (r: never) => void) => render(
    <PlagesStyle recipe={recetteApercuIdentite() as never} style={style} styles={styles} onChange={onChange as never} valeurs={{ og: 1.06, ibu: 55 }} />
  );
  it('« 16D · BJCP 2021 · Lire la source » une fois, et la source n\'est écrite qu\'une fois', () => {
    rendre(vi.fn());
    const src = document.querySelectorAll('.idn-src');
    expect(src).toHaveLength(1);
    expect(src[0].textContent!.replace(/\s+/g, ' ').trim()).toBe('16D · BJCP 2021 · Lire la source');
    expect(document.body.textContent!.match(/BJCP/g)).toHaveLength(1);
  });
  it('les deux propositions sont des liens sur une ligne, sans la phrase explicative (elle est l\'info-bulle)', () => {
    const onChange = vi.fn();
    rendre(onChange);
    expect(document.body.textContent).not.toContain('Points de départ');
    // « Repères » est replié au repos : ses boutons sont cachés, mais dans la page.
    const empat = screen.getByRole('button', { name: /Proposer l’empâtage/, hidden: true });
    expect(empat.className).toContain('idn-lien-ligne');
    expect(empat.closest('.idn-liens')!.getAttribute('title')).toContain('Points de départ');
    fireEvent.click(empat);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
