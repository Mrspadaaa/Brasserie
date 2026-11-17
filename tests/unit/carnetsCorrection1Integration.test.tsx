// @vitest-environment jsdom
/**
 * Port du carnet, correction du tour 1 (intégration) : ce que les lots L1 à L3 ont laissé à câbler dans `CarnetsVue.tsx`
 * (P5 « Va dans », P12 sortie du mode modification, G14 puce « Coller », R14/R17 ligne rangée à sa place) et les constats de L3
 * rangés dans le calcul (valeur lue en chaîne, libellé d'écarté). Fixture, magasin mémoire, IA simulée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { libelleEcarte, nombreDe, tableau } from '../../src/domain/carnets/comparer';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const rien = () => {};
const monter = () => {
  const magasin = magasinMemoire(fixtureCarnets());
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={appelsSimules('normal', 0)}
    aides={aidesCarnet('simule', {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} ecrirePlan={rien} />);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  const ventilation = () => lireCarnets(magasin.lire()).find(c => c.id === ID_VENTILATION)!;
  return { magasin, champ, ventilation };
};
const attendre = async () => { await act(async () => { await new Promise(r => setTimeout(r, 30)); }); };

describe('Comparer : une valeur lue sur une page est une chaîne (constat L3 n° 1)', () => {
  it('« 2000 » et « 1 200,5 » s’ordonnent ; « environ 2000 m³/h » reste inconnue, jamais 0', () => {
    expect(nombreDe('2000')).toBe(2000);
    expect(nombreDe(' 1 200,5 ')).toBe(1200.5);
    expect(nombreDe('environ 2000 m³/h')).toBeNull();
    expect(nombreDe('')).toBeNull();
    expect(nombreDe(true)).toBeNull();
  });
  it('le tableau range la hotte au débit « 2000 » (chaîne) devant celle à « 1200 »', () => {
    const v = fixtureCarnets().map(d => d).length; /* la fixture existe */
    expect(v).toBeGreaterThan(0);
    const c = lireCarnets(fixtureCarnets()).find(x => x.id === ID_VENTILATION)!;
    const deb = c.carnet.criteres.find(k => k.caracteristique?.nom === 'débit')!;
    const neuf = { ...c.carnet, criteres: [deb], articles: [
      { ...c.carnet.articles[0], id: 'S1', valeurs: { 'débit': { valeur: '1200', unite: deb.caracteristique!.unite, origine: 'page' as const } } },
      { ...c.carnet.articles[1], id: 'S2', valeurs: { 'débit': { valeur: '2000', unite: deb.caracteristique!.unite, origine: 'page' as const } } }
    ], facons: [], choix: undefined };
    const t = tableau(neuf as never)!;
    expect(t.lignes.map(l => l.articleId)).toEqual(['S2', 'S1']);
  });
  it('libellé d’écarté : pas de « écarté : X écartée : … »', () => {
    expect(libelleEcarte('Ventilateur de plafond écartée : brasse la buée')).toBe('Ventilateur de plafond écartée : brasse la buée');
    expect(libelleEcarte('ne tient pas 80 °C')).toBe('écarté : ne tient pas 80 °C');
  });
});

describe('P5 : puces « Va dans » dans le carnet ouvert', () => {
  it('une phrase simple : « Note » cochée d’avance ; corriger en « Façon » range une façon, et l’IA ne la défait pas', async () => {
    const { champ, ventilation } = monter();
    fireEvent.change(champ(), { target: { value: 'laisser la fenêtre ouverte' } });
    const groupe = screen.getByRole('group', { name: 'Va dans' });
    expect(groupe.textContent).toContain('Ce qui compte');
    const note = screen.getByRole('button', { name: 'Note' });
    expect(note.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Façon' }));
    expect(screen.getByRole('button', { name: 'Façon' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('.cn-cadre-titre')!.textContent).toContain('Façons : laisser la fenêtre ouverte');
    await act(async () => { fireEvent.submit(champ().closest('form')!); });
    await attendre();
    const v = ventilation();
    expect(v.carnet.facons.some(f => f.nom === 'laisser la fenêtre ouverte' && f.origine === 'vous')).toBe(true);
    expect(v.carnet.notes.some(n => n.texte === 'laisser la fenêtre ouverte')).toBe(false);
    expect(v.carnet.criteres.some(k => k.texte === 'laisser la fenêtre ouverte')).toBe(false);
    expect(screen.queryByRole('group', { name: 'Va dans' })).toBeNull();
  });
  it('un lien : aucune puce', () => {
    const { champ } = monter();
    fireEvent.change(champ(), { target: { value: 'https://exemple.invalid/pompe' } });
    expect(screen.queryByRole('group', { name: 'Va dans' })).toBeNull();
  });
});

describe('P12 : modifier une note, puis en sortir', () => {
  it('le cadre « Se modifie ici » paraît ; ✕ referme et vide le champ', () => {
    const { champ } = monter();
    fireEvent.click(screen.getByRole('button', { name: /Note : attendre l’avis du ferblantier, actions/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Modifier/ }));
    expect(champ().value).toBe('attendre l’avis du ferblantier');
    expect(screen.getByRole('region', { name: 'Se modifie ici' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(champ().value).toBe('');
    expect(screen.queryByRole('region', { name: 'Se modifie ici' })).toBeNull();
  });
  it('quitter le carnet referme la modification : le texte ne contamine pas le champ suivant', () => {
    const { champ } = monter();
    fireEvent.click(screen.getByRole('button', { name: /Note : attendre l’avis du ferblantier, actions/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Modifier/ }));
    fireEvent.click(screen.getByRole('button', { name: /Carnets/ }));
    expect(champ().value).toBe('');
  });
});

describe('G14 : la puce « Coller : … » (R15)', () => {
  it('au focus, un lien seul dans le presse-papier est proposé ; un toucher le met dans le champ', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: vi.fn().mockResolvedValue('https://exemple.invalid/zz-pompe') } });
    const { champ } = monter();
    expect(screen.queryByRole('button', { name: /Coller :/ })).toBeNull();
    await act(async () => { fireEvent.focus(champ()); });
    await attendre();
    const puce = screen.getByRole('button', { name: /Coller :/ });
    expect(puce.textContent).toContain('exemple.invalid');
    fireEvent.click(puce);
    expect(champ().value).toBe('https://exemple.invalid/zz-pompe');
  });
  it('un presse-papier qui n’est pas un lien, ou refusé : aucune puce, aucune erreur', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: vi.fn().mockRejectedValue(new Error('refusé')) } });
    const { champ } = monter();
    await act(async () => { fireEvent.focus(champ()); });
    await attendre();
    expect(screen.queryByRole('button', { name: /Coller :/ })).toBeNull();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: vi.fn().mockResolvedValue('une phrase quelconque') } });
    await act(async () => { fireEvent.blur(champ()); fireEvent.focus(champ()); });
    await attendre();
    expect(screen.queryByRole('button', { name: /Coller :/ })).toBeNull();
  });
});

describe('R14, R25 : la ligne rangée s’éclaire à sa place, sa phrase citée', () => {
  it('une note ajoutée dans Ventilation : « Rangé ici · Annuler » et « votre phrase » une fois ; Annuler la retire', async () => {
    const { champ, ventilation } = monter();
    const avant = ventilation().carnet.notes.length;
    fireEvent.change(champ(), { target: { value: 'demander un devis au ferblantier' } });
    await act(async () => { fireEvent.submit(champ().closest('form')!); });
    await attendre();
    const rangee = document.querySelector('.cn-rangee');
    expect(rangee).toBeTruthy();
    expect(rangee!.textContent).toContain('votre phrase : « demander un devis au ferblantier »');
    expect(document.querySelectorAll('.cn-rangee')).toHaveLength(1);
    expect(ventilation().carnet.notes.length).toBe(avant + 1);
    fireEvent.click(rangee!.querySelector('button')!);
    await attendre();
    expect(ventilation().carnet.notes.length).toBe(avant);
    expect(document.querySelector('.cn-rangee')).toBeNull();
  });
});
