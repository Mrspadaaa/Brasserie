// @vitest-environment jsdom
// Voie q7 : corrections du port e9na (style, rappel, fiche de l'idée, format du prix, convertir en client, colonne de la date).
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreativeItem } from '../../src/types';
import { enClient, enEntree, formatVendu, lireIdee, notesQuiCitent, ranger, rappelDe, styleDe } from '../../src/ui/atelier/atelierModel';
import { Ecrire } from '../../src/ui/atelier/Ecrire';
import { FicheContact } from '../../src/ui/atelier/FicheContact';
import { FicheIdee } from '../../src/ui/atelier/FicheIdee';
import { NoteCarte } from '../../src/ui/atelier/NoteCarte';

afterEach(cleanup);
const noop = () => {};
const HIVER: CreativeItem = {
  id: 'CR-1731412800000', type: 'recipe-idea', status: 'validated', title: 'Bière d’hiver épicée',
  description: 'Bière d’hiver épicée pour le marché de Noël : cannelle, écorce d’orange, ambrée forte autour de 7 %.',
  targetPrice: 6, estimatedCost: 2.1, date: '12.12.2026'
};
const ECORCE: CreativeItem = { id: 'CR-1731063600000', type: 'recipe-idea', status: 'idea', title: 'Écorce d’orange amère', description: 'Écorce d’orange amère 5 min avant la fin, pas plus de 20 g.' };
const TARIF: CreativeItem = { id: 'CR-1730890800000', type: 'pricing-test', status: 'idea', title: '33 cl à 6 au marché, elle me coûte 2,10.', targetPrice: 6, estimatedCost: 2.1 };
const NEIPA: CreativeItem = { id: 'CR-1730545200000', type: 'recipe-idea', status: 'idea', title: 'NEIPA au Nelson Sauvin', description: 'NEIPA au Nelson Sauvin, variante du LOT-12.' };

describe('q7 : ce que la note dit', () => {
  it('le style se lit dans le texte ; « Style : … » des notes le corrige ; « aucun » le retire', () => {
    expect(styleDe(HIVER)).toBe('Ambrée forte');
    expect(styleDe({ title: 'Lager au miel', description: 'Lager au miel du voisin pour l’été.' })).toBe('Lager');
    expect(styleDe({ title: 'Idée', description: 'Un truc', notes: 'Style : IPA' })).toBe('IPA');
    expect(styleDe({ title: 'Lager au miel', notes: 'Style : aucun' })).toBeUndefined();
    expect(styleDe({ title: 'Une bière', description: 'sans style' })).toBeUndefined();
  });

  it('« rappeler » seulement si la note le demande', () => {
    expect(rappelDe({ title: 'Lucie du Café du Midi veut un fût pour décembre. La rappeler.' })).toBe(true);
    expect(rappelDe({ title: 'Café du Midi' })).toBe(false);
  });

  it('degré, arômes, événement et format lus ; l’absent reste indéfini', () => {
    const l = lireIdee(HIVER);
    expect(l).toMatchObject({ degre: '7,0 %', aromes: 'cannelle, écorce d’orange', pour: 'Marché de Noël' });
    expect(lireIdee({ id: 'x', type: 'recipe-idea', status: 'idea', title: 'Stout', description: 'Une stout au cacao, α 12 %.' })).toEqual({ degre: undefined, aromes: undefined, pour: undefined, format: undefined });
    expect(formatVendu('33 cl à 6')).toBe('la 33 cl');
    expect(formatVendu('carton de 24 à 120')).toBe('le carton de 24');
    expect(formatVendu('fût de 20 L')).toBe('le fût de 20 L');
    expect(formatVendu('une idée')).toBeUndefined();
  });

  it('les notes qui citent l’idée : elle-même, les mots communs, le tarif au même prix ; pas la NEIPA', () => {
    const ids = notesQuiCitent(HIVER, [HIVER, ECORCE, TARIF, NEIPA]).map(n => n.id);
    expect(ids).toEqual([HIVER.id, ECORCE.id, TARIF.id]);
  });

  it('une ligne rangée avec un style corrigé le garde dans les notes ; sans correction, aucun champ ajouté', () => {
    const [l] = ranger('Lager au miel du voisin pour l’été.');
    expect(enEntree(l, 'CR-1').notes).toBeUndefined();
    expect(enEntree({ ...l, style: 'IPA' }, 'CR-1').notes).toBe('Style : IPA');
    expect(enEntree({ ...l, style: '' }, 'CR-1').notes).toBe('Style : aucun');
  });

  it('enClient laisse vides le contact et le numéro absents', () => {
    expect(enClient({ id: 'CR-1', type: 'prospect', status: 'idea', title: 'Café du Midi' }, 'CL-009')).toEqual({ id: 'CL-009', name: 'Café du Midi', type: 'Pro', contact: '', phone: '', email: '', notes: undefined });
  });
});

describe('q7 : rangement, carte, fiche', () => {
  it('la ligne de bière porte sa pastille de style, corrigeable au toucher', () => {
    const onRanger = vi.fn();
    render(<Ecrire primaire amorce={null} onReflechir={noop} onRanger={onRanger} />);
    fireEvent.change(screen.getByLabelText('Ta note'), { target: { value: 'Lager au miel du voisin pour l’été.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Noter' }));
    expect(screen.getByText('Lager').getAttribute('data-pastille')).toBe('style');
    expect(screen.getByText(/Le rangement se propose, tu valides/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Corriger' }));
    fireEvent.click(screen.getByRole('button', { name: /Style : Lager/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ranger ainsi' }));
    expect(onRanger.mock.calls[0][0][0].style).toBe('Pilsner');
  });

  it('la carte d’une bière montre « Ambrée forte » ; celle d’un contact à rappeler montre « rappeler »', () => {
    render(<NoteCarte item={HIVER} tva={0} onOuvrir={noop} onCocher={noop} onEnRecette={noop} />);
    expect(screen.getByText('Ambrée forte').getAttribute('data-pastille')).toBe('style');
    cleanup();
    render(<NoteCarte item={{ id: 'CR-1731240000000', type: 'prospect', status: 'idea', title: 'Café du Midi', description: 'Lucie du Café du Midi veut un fût. La rappeler.', contactName: 'Lucie' }} tva={0} onOuvrir={noop} onCocher={noop} onEnRecette={noop} />);
    expect(screen.getByText('rappeler')).toBeTruthy();
  });

  it('la date a sa colonne : elle n’est pas dans le même bloc que le texte', () => {
    render(<NoteCarte item={TARIF} tva={0} onOuvrir={noop} onCocher={noop} onEnRecette={noop} />);
    const date = screen.getByText(/^\d\d\.\d\d$/);
    expect(date.className).toContain('shrink-0');
    expect(date.parentElement?.textContent).toContain('33 cl à 6');
    expect(date.previousElementSibling?.className).toContain('flex-1');
  });

  it('la fiche d’une idée : style, degré, arômes, pour, tarif avec son format, recette, notes qui en parlent', () => {
    render(<FicheIdee item={HIVER} tva={0} carnet={[HIVER, ECORCE, TARIF, NEIPA]} recettes={['Stout du lac']} onClose={noop} onEtape={noop} onModifier={noop} onEnRecette={noop} onSupprimer={noop} />);
    expect(screen.getByText('Ambrée forte')).toBeTruthy();
    expect(screen.getByText('7,0 %')).toBeTruthy();
    expect(screen.getByText('cannelle, écorce d’orange')).toBeTruthy();
    expect(screen.getByText(/Marché de Noël · sam\. 12\.12/)).toBeTruthy();
    expect(screen.getByText('Tarif').nextElementSibling?.textContent).toBe('6,00 la 33 cl · marge 3,90');
    expect(screen.getByText('pas encore écrite')).toBeTruthy();
    expect(screen.getByText('3 notes du carnet en parlent')).toBeTruthy();
    expect(screen.queryByText(/NEIPA au Nelson/)).toBeNull();
  });

  it('une idée sans rien dit « non saisi » partout, jamais 0 ; une recette de même nom est dite écrite', () => {
    const vide: CreativeItem = { id: 'CR-1', type: 'recipe-idea', status: 'idea', title: 'Stout du lac' };
    render(<FicheIdee item={vide} tva={0} carnet={[vide]} recettes={['Stout du lac']} onClose={noop} onEtape={noop} onModifier={noop} onEnRecette={noop} onSupprimer={noop} />);
    expect(screen.getAllByText('non saisi').length).toBe(4);
    expect(screen.getByText('écrite : Stout du lac')).toBeTruthy();
    expect(screen.queryByText(/^0/)).toBeNull();
  });
});

describe('q7 : convertir en client', () => {
  const P: CreativeItem = { id: 'CR-5', type: 'prospect', status: 'idea', title: 'Café du Midi' };
  it('le bouton est en pied de la feuille du prospect et appelle la conversion', () => {
    const onConvertir = vi.fn();
    render(<FicheContact item={P} onClose={noop} onModifier={noop} onConvertir={onConvertir} />);
    fireEvent.click(screen.getByRole('button', { name: /Convertir en client/ }));
    expect(onConvertir).toHaveBeenCalledWith(P);
    expect(screen.getByText('pas de numéro noté')).toBeTruthy();
  });
  it('un prospect déjà converti ne se reconvertit pas', () => {
    render(<FicheContact item={{ ...P, status: 'validated' }} onClose={noop} onModifier={noop} onConvertir={noop} />);
    expect((screen.getByRole('button', { name: /Déjà client/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
