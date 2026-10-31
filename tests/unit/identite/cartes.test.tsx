// @vitest-environment jsdom
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CarteEbullition } from '../../../src/ui/identite/CarteEbullition';
import { CarteVolume } from '../../../src/ui/identite/CarteVolume';
import { ChampNombre } from '../../../src/ui/identite/ChampNombre';

afterEach(cleanup);

function Boil({ depart = 60 }: { depart?: number }) {
  const [m, setM] = useState(depart);
  return <CarteEbullition minutes={m} onMinutes={setM} evaporation={{ litres: (3 * (Number.isFinite(m) ? m : 0)) / 60, source: 'profil' }} />;
}
function Vol(props: { depart?: number; capaciteL?: number; avant?: number | null; cuveL?: number }) {
  const [v, setV] = useState(props.depart ?? 24);
  return (
    <CarteVolume
      volumeL={v} onVolume={setV} capaciteL={props.capaciteL ?? 30} profilL={30} conseilL={24} cuveL={props.cuveL ?? 36}
      avantEbullition={props.avant === null ? null : { litres: props.avant ?? 27, evapL: 3 }} onOuvrirFermenteur={() => undefined}
    />
  );
}
const boilField = () => screen.getByRole('textbox', { name: 'Durée d’ébullition' }) as HTMLInputElement;
const volField = () => screen.getByRole('textbox', { name: 'Volume en fermenteur' }) as HTMLInputElement;
const derniereGraduation = (nom: string) => document.querySelector(`[data-role="echelle-${nom}"] .idn-dern`)!.textContent;

describe('ChampNombre : jamais type="number", inputmode, clavier', () => {
  it('est un champ texte avec inputmode', () => {
    render(<Boil />);
    expect(boilField().type).toBe('text');
    expect(boilField().getAttribute('inputmode')).toBe('numeric');
    render(<Vol />);
    expect(volField().getAttribute('inputmode')).toBe('decimal');
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });

  it('Tab passe du volume au curseur du volume puis à l’ébullition', async () => {
    const user = userEvent.setup();
    render(<><Vol /><Boil /></>);
    act(() => volField().focus());
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'Volume en fermenteur, curseur' }));
    await user.tab();
    expect(document.activeElement).toBe(boilField());
  });

  it('taper 240 donne 240 min et ouvre la règle à 270', async () => {
    const user = userEvent.setup();
    render(<Boil />);
    expect(derniereGraduation('ebullition')).toBe('120');
    await user.click(boilField());
    await user.keyboard('240{Enter}');
    expect(boilField().value).toBe('240');
    expect(derniereGraduation('ebullition')).toBe('270');
    expect(screen.getByText('~12 L')).toBeTruthy();
    expect((screen.getByRole('slider', { name: 'Durée d’ébullition, curseur' }) as HTMLInputElement).max).toBe('270');
  });

  it('ramène l’ébullition tapée à 5′ à la sortie', async () => {
    const user = userEvent.setup();
    render(<Boil />);
    await user.click(boilField());
    await user.keyboard('47{Enter}');
    expect(boilField().value).toBe('45');
  });

  it('↑ ↓ : ±5′ dans le champ ; ±1 L pour le volume', async () => {
    const user = userEvent.setup();
    render(<><Vol /><Boil /></>);
    act(() => boilField().focus());
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}');
    expect(boilField().value).toBe('65');
    act(() => volField().focus());
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(volField().value).toBe('26');
  });

  it('Échap rend la valeur d’avant, Entrée valide', async () => {
    const user = userEvent.setup();
    render(<Boil />);
    await user.click(boilField());
    await user.keyboard('120{Enter}');
    expect(boilField().value).toBe('120');
    await user.click(boilField());
    await user.keyboard('45{Escape}');
    expect(boilField().value).toBe('120');
    expect(document.activeElement).not.toBe(boilField());
  });

  it('Entrée valide sur place : le formulaire parent ne la reçoit pas', async () => {
    const user = userEvent.setup();
    let vue = 0;
    render(<div onKeyDown={() => { vue++; }}><Boil /></div>);
    await user.click(boilField());
    await user.keyboard('{Enter}');
    expect(vue).toBe(0);
  });

  it('un texte illisible n’écrase rien : la valeur d’avant revient à la sortie', async () => {
    const user = userEvent.setup();
    render(<Vol />);
    await user.click(volField());
    await user.keyboard('abc{Enter}');
    expect(volField().value).toBe('24');
  });

  it('effacer laisse le champ vide (à renseigner), jamais 0', async () => {
    const user = userEvent.setup();
    render(<Vol />);
    await user.click(volField());
    await user.keyboard('{Backspace}{Backspace}{Enter}');
    expect(volField().value).toBe('');
    expect(screen.getByText('Volume à renseigner')).toBeTruthy();
  });

  it('une valeur hors règle est acceptée : 88 L ouvre la règle et le dépassement se voit', async () => {
    const user = userEvent.setup();
    render(<Vol />);
    await user.click(volField());
    await user.keyboard('88{Enter}');
    expect(volField().value).toBe('88');
    expect(screen.getByRole('alert').textContent).toContain('+58 L');
    expect(Number(derniereGraduation('volume'))).toBeGreaterThanOrEqual(80);
  });

  it('accepte une virgule : 22,5 L', async () => {
    const user = userEvent.setup();
    render(<Vol />);
    await user.click(volField());
    await user.keyboard('22,5{Enter}');
    expect(volField().value).toBe('22,5');
  });

  it('autonome : fonctionne sans parent contrôlé (valeur tapée sans focus)', () => {
    const vus: number[] = [];
    render(<ChampNombre libelle="x" valeur={5} onValeur={(v) => vus.push(v)} pas={1} min={0} max={10} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'x' }), { target: { value: '7' } });
    expect(vus).toEqual([7]);
  });
});

describe('CarteVolume', () => {
  it('au repos : « 6 L libres », conseil ~24, la cuve et le moût avant ébullition, le « › » au bout de la règle', () => {
    render(<Vol />);
    expect(screen.getByText('libres').textContent).toContain('6 L');
    expect(document.querySelector('[data-element="r4a-conseil"]')!.textContent).toContain('~24');
    expect(screen.getByText(/avant ébullition/).textContent).toContain('~27 L');
    expect(document.querySelector('[data-role="echelle-volume"] .idn-dern')!.textContent).toBe('40');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('31 L dans 30 L : « +1 L de trop » en alerte', () => {
    render(<Vol depart={31} />);
    expect(screen.getByRole('alert').textContent).toContain('+1 L');
    expect(screen.getByRole('alert').textContent).toContain('de trop');
  });

  it('à égalité : « 0 L libre, plein »', () => {
    render(<Vol depart={30} />);
    expect(screen.getByText(/libre, plein/)).toBeTruthy();
  });

  it('55 L, fermenteur 60 L, ~67 L avant ébullition dans une cuve de 45 L : la cuve dit « +22 L de trop »', () => {
    render(<Vol depart={55} capaciteL={60} avant={67} cuveL={45} />);
    const alerte = document.querySelector('[data-role="debordement"]')!;
    expect(alerte.getAttribute('role')).toBe('alert');
    expect(alerte.textContent).toContain('+22 L');
    expect(alerte.textContent).toContain('de trop');
    expect(document.querySelector('.idn-ctrack.idn-deb')).toBeTruthy();
    expect(document.querySelector('.idn-cdep')).toBeTruthy();
    expect(screen.getByText(/5 L/, { selector: '.idn-etat span' })).toBeTruthy(); // 5 L libres dans le fermenteur
  });

  it('la cuve dans sa limite : ni alerte ni zone rouge', () => {
    render(<Vol avant={27} />);
    expect(document.querySelector('[data-role="debordement"]')).toBeNull();
    expect(document.querySelector('.idn-cdep')).toBeNull();
  });

  it('moût d’avant ébullition inconnu (sans malts) : dit « — », jamais 0 L ni un autre nombre', () => {
    render(<Vol avant={null} />);
    expect(screen.getByText(/sans malts/).textContent).toContain('—');
    expect(document.querySelector('[data-role="preb"]')!.textContent).toBe('—');
    expect(screen.queryByText(/~0 L/)).toBeNull();
  });

  it('la puce du fermenteur ouvre le matériel', () => {
    let ouvert = 0;
    render(<CarteVolume volumeL={24} onVolume={() => undefined} capaciteL={60} profilL={30} onOuvrirFermenteur={() => { ouvert++; }} />);
    const puce = screen.getByRole('button', { name: 'Changer de fermenteur' });
    expect(puce.className).toContain('idn-modif'); // la capacité s’écarte du profil
    fireEvent.click(puce);
    expect(ouvert).toBe(1);
  });

  it('sans fermenteur connu : pas de puce, pas de « libres »', () => {
    render(<CarteVolume volumeL={24} onVolume={() => undefined} onOuvrirFermenteur={() => undefined} />);
    expect(screen.queryByRole('button', { name: 'Changer de fermenteur' })).toBeNull();
    expect(screen.queryByText('libres')).toBeNull();
  });

  it('le curseur : sans pouce quand le volume est effacé', () => {
    render(<CarteVolume volumeL={Number.NaN} onVolume={() => undefined} capaciteL={30} onOuvrirFermenteur={() => undefined} />);
    expect(screen.getByRole('slider', { name: 'Volume en fermenteur, curseur' }).getAttribute('data-vide')).toBe('true');
  });
});
