// Voie r4 (mission 2026-11-09-levure-retours) : un article du stock sans fiche se relie à la fiche du catalogue, seulement si la
// correspondance est unique et sûre. Constat en ligne du 09.11 : « Levure LALLEMAND Verdant IPA » (4 sachets) donnait une carte vide.
import { describe, expect, it } from 'vitest';
import { motsUtiles, relierAuCatalogue } from '../../../src/domain/levure/relier';
import { yeastReferences } from '../../../src/domain/yeastReferences';

const refs = yeastReferences([]);
const lie = (name: string, lab?: string, strain?: string) => relierAuCatalogue({ name, lab, strain }, refs)?.id;

describe('relierAuCatalogue : unique et sûr', () => {
  it('le nom du stock du 09.11 se relie à la fiche Verdant', () => {
    const id = lie('Levure LALLEMAND Verdant IPA');
    expect(id).toBeTruthy();
    expect(refs.find(r => r.id === id)!.name).toMatch(/Verdant/i);
  });
  it('les mots de bruit, la quantité et le poids ne changent rien', () => {
    const attendu = lie('Levure LALLEMAND Verdant IPA');
    expect(lie('LALLEMAND Verdant IPA (2 sachets)')).toBe(attendu);
    expect(lie('Levure LalBrew Verdant IPA 11 g')).toBe(attendu);
    expect(lie('Verdant IPA', 'Lallemand')).toBe(attendu);
    expect(motsUtiles('Levure LALLEMAND Verdant IPA (2 sachets) 11g')).toBe('lallemand verdant ipa');
  });
  it('le fabricant seul ne désigne aucune fiche', () => {
    expect(lie('Levure Lallemand')).toBeUndefined();
    expect(lie('Levure')).toBeUndefined();
  });
  it('un nom inconnu, ou un mot qui n’est qu’un début de mot, ne relie rien', () => {
    expect(lie('Ma souche maison')).toBeUndefined();
    expect(lie('Verd')).toBeUndefined();
  });
  it('un autre laboratoire que celui de la fiche ne relie pas', () => {
    expect(lie('Verdant IPA', 'Fermentis')).toBeUndefined();
  });
  it('un code proche n’est pas le code : US-05 relie, US-06 ne relie pas à US-05', () => {
    const us05 = lie('SafAle US-05');
    expect(us05).toBe('fermentis-us05');
    expect(lie('SafAle US-04')).not.toBe('fermentis-us05');
  });
  it('deux fiches répondent : on ne choisit pas', () => {
    const doublons = [refs.find(r => r.id === 'fermentis-us05')!, { ...refs.find(r => r.id === 'fermentis-us05')!, id: 'copie-us05' }];
    expect(relierAuCatalogue({ name: 'SafAle US-05' }, doublons)).toBeUndefined();
  });
});
