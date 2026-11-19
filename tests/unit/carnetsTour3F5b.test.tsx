// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f5b (critique v4) : un test par constat, rouge sur le code d'avant.
 * n° 3 : « Ventilation de la salle » tapé dans la liste proposait « Y ajouter en façon » au carnet qui porte ce titre ; attendu « Ouvrir ce carnet ».
 * n° 10 : « moins bien que la 1re sur tout » alors que la 2e a le meilleur débit (40 contre 25 L/min, colonne lue sans sens).
 * n° 12 : un lien de hotte collé depuis la liste annonçait « Nouveau carnet · exemple.invalid » et « Y ajouter en façon » ; attendu : l'article
 *   va dans Ventilation, annoncé puis rangé.
 * n° 13 : seule, la puce « Coller : exemple.in » était bornée à 55 % et coupée net.
 * Fixture « ZZ TEST — … », magasin mémoire, IA rejouée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { CadreArrivee } from '../../src/ui/carnets/CadreArrivee';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { type AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { domine, moinsBienPartout, tableau, type Colonne } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets, type Article, type CarnetDoc, type DonneesCarnet } from '../../src/domain/carnets/modele';
import { nommeLeCarnet } from '../../src/domain/carnets/rattacher';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); });

const attendre = async (ms = 40) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
/** L'IA rejouée ne dit rien (aucune ligne) : l'annonce locale fait foi. */
const iaMuette: AppelsIA = {
  async ranger() { return { ok: true, data: { lignes: [] } }; },
  async lire(url) { return { url, domaine: '', statut: 'indisponible', luLe: 0 }; }
};
function monter(appels: AppelsIA = iaMuette) {
  const magasin = magasinMemoire(fixtureCarnets());
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={appels}
    aides={aidesCarnet('simule', {})} ecrirePlan={() => {}} />);
  return magasin;
}
const rien = () => {};

describe('f5b n° 3 : le titre d’un carnet existant tapé dans la liste ouvre ce carnet', () => {
  it('nommeLeCarnet : tous les mots tapés sont dans le titre', () => {
    expect(nommeLeCarnet('Ventilation de la salle', 'ZZ TEST — Ventilation de la salle de brassage')).toBe(true);
    expect(nommeLeCarnet('Hotte au-dessus de la cuve', 'ZZ TEST — Ventilation de la salle de brassage')).toBe(false);
    expect(nommeLeCarnet('', 'Ventilation')).toBe(false);
  });
  it('le cadre propose « Ouvrir ce carnet » ; un toucher ouvre Ventilation, champ vidé', async () => {
    monter();
    await attendre();
    fireEvent.focus(champ());
    fireEvent.change(champ(), { target: { value: 'Ventilation de la salle' } });
    await attendre(10);
    const cadre = document.querySelector('.cn-cadre')?.textContent ?? '';
    expect(cadre).toContain('Déjà un carnet proche : ZZ TEST — Ventilation de la salle de brassage');
    expect(cadre).not.toContain('Y ajouter en façon');
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir ce carnet/ }));
    await attendre();
    expect(champ().value).toBe('');
    expect(document.body.textContent).toContain('Ajouter à');
  });
  it('une autre phrase garde « Y ajouter en façon » (R10, g5:v08-3)', () => {
    render(<CadreArrivee cadre={{ sorte: 'creer', titre: 'Hotte au-dessus de la cuve', proche: { titre: 'Ventilation de la salle de brassage', onAjouter: rien } }} onAnnuler={rien} />);
    expect(screen.getByRole('button', { name: /Y ajouter en façon/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Ouvrir ce carnet/ })).toBeNull();
  });
});

describe('f5b n° 10 : « moins bien … sur tout » jamais quand une colonne lue les sépare', () => {
  const temp: Colonne = { nom: 'température max', unite: '°C', sens: 'plus', critereId: 'K1', critereTexte: 'Supporter le moût chaud' };
  const debit: Colonne = { nom: 'débit', unite: 'L/min', sens: 'texte', lue: true };
  const art = (id: string, t: number, d: number, prix: number): Article => ({ id, nom: id, lecture: 'lue', prixCentimes: prix * 100, devise: 'CHF',
    valeurs: { 'température max': { valeur: t, unite: '°C', origine: 'exemple' }, 'débit': { valeur: d, unite: 'L/min', origine: 'exemple' } } });
  const magnetique = art('Pompe magnétique 12 V', 100, 25, 245);
  const inox = art('Pompe de transfert inox', 90, 40, 690);
  it('domine : la 2e n’est pas dominée, elle a le meilleur débit ; à débit égal, elle l’est', () => {
    expect(domine(inox, magnetique, [temp, debit])).toBe(false);
    expect(moinsBienPartout(inox, [magnetique, inox], [temp, debit])).toBe(false);
    const inox25 = art('Pompe de transfert inox', 90, 25, 690);
    expect(domine(inox25, magnetique, [temp, debit])).toBe(true);
  });
  it('tableau : la ligne de la pompe inox ne porte ni « moins bien que la 1re » ni « moins bien partout »', () => {
    const V = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
    const avec = (c: CarnetDoc, d: Partial<DonneesCarnet>): CarnetDoc => ({ ...c, carnet: { ...c.carnet, ...d } });
    const c = avec(V, { facons: [], choix: undefined, criteres: [{ id: 'K1', texte: 'Supporter le moût chaud', origine: 'ia', caracteristique: { nom: 'température max', unite: '°C', sens: 'plus' } }],
      articles: [magnetique, inox] });
    const t = tableau(c)!;
    expect(t.colonnes.map(k => k.nom)).toEqual(['température max', 'débit']);
    const l = t.lignes.find(x => x.articleId === inox.id)!;
    expect(l.rang).toBe(2);
    expect(l.moinsBienQue).toBeUndefined();
    expect(l.moinsBienPartout).toBe(false);
  });
});

describe('f5b n° 12 : un lien de hotte collé depuis la liste va dans Ventilation', () => {
  const URL_HOTTE = 'https://exemple.invalid/hotte-140';
  it('le cadre annonce Ventilation, sans carnet titré du domaine ni façon ; l’envoi y range l’article, aucun carnet neuf', async () => {
    const magasin = monter();
    await attendre();
    const avant = lireCarnets(magasin.lire()).length;
    const articlesAvant = lireCarnets(magasin.lire()).find(c => c.id === ID_VENTILATION)!.carnet.articles.length;
    fireEvent.focus(champ());
    fireEvent.change(champ(), { target: { value: URL_HOTTE } });
    await attendre(10);
    const cadre = document.querySelector('.cn-cadre')?.textContent ?? '';
    expect(cadre).toContain('va dans ZZ TEST — Ventilation de la salle de brassage');
    expect(cadre).not.toContain('Nouveau carnet');
    expect(cadre).not.toContain('Y ajouter en façon');
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(300);
    const apres = lireCarnets(magasin.lire());
    expect(apres.length).toBe(avant);
    expect(apres.some(c => /exemple\.invalid/.test(c.title))).toBe(false);
    const ventil = apres.find(c => c.id === ID_VENTILATION)!.carnet;
    expect(ventil.articles.length).toBe(articlesAvant + 1);
    expect(ventil.facons.some(f => /exemple|hotte-140/.test(f.nom))).toBe(false);
  });
});

describe('f5b n° 13 : la puce « Coller : … » seule n’est pas bornée ni coupée net', () => {
  it('sans bulle, la puce est dans `.cnf-aides` (pas la ligne à 55 %) ; son lien se coupe par « … » s’il le faut', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: vi.fn().mockResolvedValue('https://exemple.invalid/hotte-140') } });
    monter();
    await attendre();
    await act(async () => { fireEvent.focus(champ()); });
    await attendre();
    const puce = screen.getByRole('button', { name: /Coller :/ });
    expect(puce.parentElement?.className).toBe('cnf-aides');
    const lien = puce.querySelector('.cn-mono') as HTMLElement;
    expect(lien.style.textOverflow).toBe('ellipsis');
    expect(lien.textContent).toContain('exemple.invalid');
  });
});
