// @vitest-environment jsdom
/**
 * D451, voie ia : le chemin complet. Un message tapé dans un carnet ouvert (CarnetsVue), l'IA répond avec le suivi (réponse simulée, aucun appel réel) :
 * le jeton se pose sous la bulle, la tâche et « Rattacher à … ? » restent des cartes, l'autre carnet n'est pas touché, Annuler défait tout.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ID_EVIER, ID_FRIGO, ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages } from '../../src/domain/carnets/modele';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const MSG = 'ZZ TEST — Ferblantier contacté, devis 480 CHF, à rappeler cette semaine';

async function envoyer(ia: unknown) {
  const appels: AppelsIA = { async ranger() { await new Promise(r => setTimeout(r, 5)); return { ok: true, data: ia }; }, async lire() { throw new Error('aucun lien ici'); } };
  const magasin = magasinMemoire(fixtureCarnets() as never[]);
  const avant = JSON.stringify(magasin.lire());
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels}
    aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
  await attendre(30);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  fireEvent.change(champ(), { target: { value: MSG } });
  await attendre(40);
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(900);
  return { magasin, avant };
}

const message = (magasin: ReturnType<typeof magasinMemoire>) => lireMessages(magasin.lire()).find(m => m.carnetMessage.texte === MSG)!;

describe('D451 : le suivi de l’IA, de la réponse à l’écriture annulable', () => {
  const reponse = { lignes: [
    { sorte: 'note', genre: 'a-faire', texte: 'Rappeler le ferblantier', carnetId: ID_FRIGO, etiquette: 'devis', prix: 480, devise: 'CHF', tachePropose: { texte: 'Rappeler le ferblantier', quand: 'semaine' } },
    { sorte: 'note', genre: 'note', texte: 'Ferblantier contacté', carnetId: ID_VENTILATION, etiquette: 'contact' }
  ] };

  it('jeton sous la bulle, tâche proposée, « Rattacher à … ? » : le message reste dans son carnet et rien d’autre n’est écrit', async () => {
    const { magasin, avant } = await envoyer(reponse);
    const m = message(magasin);
    expect(m, 'le message est gardé').toBeTruthy();
    expect(m.carnetMessage.effets.filter(e => e.carnetId !== ID_VENTILATION), 'aucun effet hors de Ventilation').toEqual([]);
    const sortes = (m.carnetMessage.etiquettes ?? []).map(e => `${e.sorte}${e.montantCentimes !== undefined ? `:${e.montantCentimes}` : ''}`).sort();
    expect(sortes, 'un devis de 480 CHF et un contact, sans doublon avec le repli local').toEqual(['contact', 'devis:48000']);
    expect((m.carnetMessage.etiquettes ?? []).every(e => e.carnetId === ID_VENTILATION)).toBe(true);
    const cartes = (m.carnetMessage.propositionsSuivi ?? []).map(p => p.sorte).sort();
    expect(cartes).toEqual(['deplacer', 'tache']);
    expect(m.carnetMessage.propositionsSuivi!.find(p => p.sorte === 'deplacer')).toMatchObject({ carnetId: ID_VENTILATION, versCarnetId: ID_FRIGO });
    expect(m.carnetMessage.propositionsSuivi!.find(p => p.sorte === 'tache')).toMatchObject({ carnetId: ID_VENTILATION, texte: 'Rappeler le ferblantier', precision: 'semaine' });
    const frigoAvant = JSON.stringify(lireCarnets(JSON.parse(avant)).find(c => c.id === ID_FRIGO));
    expect(JSON.stringify(lireCarnets(magasin.lire()).find(c => c.id === ID_FRIGO)), 'le Frigo n’est pas touché').toBe(frigoAvant);
    const vent = lireCarnets(magasin.lire()).find(c => c.id === ID_VENTILATION)!;
    expect(vent.carnet.taches ?? [], 'la tâche n’est pas écrite : elle attend son geste').toEqual([]);
    expect(vent.carnet.suivi, 'aucun état écrit').toBeUndefined();
  }, 30000);

  /* C65-1 (chemin IA) et C65-2 (chemin local, IA sans réponse) : le vrai chemin de l'écran. Le cadre et l'envoi lisaient `destinationDans`, qui désignait le carnet
     voisin (celui dont la phrase nomme l'objet) : `ici` valait ce carnet, la note (IA) ou le critère (repli) y était écrite. */
  async function envoyerDansFrigo(texte: string, ranger: AppelsIA['ranger']) {
    const appels: AppelsIA = { ranger, async lire() { throw new Error('aucun lien ici'); } };
    const magasin = magasinMemoire(fixtureCarnets() as never[]);
    const avant = lireCarnets(magasin.lire()).map(c => [c.id, JSON.stringify(c)] as const);
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels}
      aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID_FRIGO, at: 1 }} />);
    await attendre(30);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: texte } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(1500);
    const apres = lireCarnets(magasin.lire());
    const m = lireMessages(magasin.lire()).find(x => x.carnetMessage.texte === texte)!;
    return { m, apres, intact: (id: string) => JSON.stringify(apres.find(c => c.id === id)) === avant.find(([i]) => i === id)![1] };
  }
  const TEXTE_EVIER = 'ZZ TEST — évier 2 bacs pour laver les fûts';

  it('C65-1, chemin IA : l’IA désigne le carnet Évier, le message tapé dans le Frigo y reste, l’Évier est intact, « Rattacher à Évier ? » est proposé', async () => {
    const { m, intact } = await envoyerDansFrigo(TEXTE_EVIER, async () => ({ ok: true, data: { lignes: [{ sorte: 'note', texte: 'Évier 2 bacs pour laver les fûts', carnetId: ID_EVIER }] } }));
    expect(m, 'le message est gardé').toBeTruthy();
    expect(m.carnetMessage.effets.length, 'il a rangé quelque chose').toBeGreaterThan(0);
    expect(m.carnetMessage.effets.filter(e => e.carnetId !== ID_FRIGO), 'aucun effet hors du Frigo').toEqual([]);
    expect(intact(ID_EVIER), 'l’Évier n’est pas touché').toBe(true);
    expect(m.carnetMessage.propositionsSuivi).toEqual([{ sorte: 'deplacer', carnetId: ID_FRIGO, versCarnetId: ID_EVIER, origine: 'locale' }]);
  }, 30000);

  it('C65-2, chemin local : l’IA est refusée (panne), le message reste dans le Frigo, aucun critère ni note chez l’Évier, la carte est là malgré tout', async () => {
    const { m, intact } = await envoyerDansFrigo(TEXTE_EVIER, async () => ({ ok: false, error: 'panne simulée' }));
    expect(m).toBeTruthy();
    expect(m.carnetMessage.effets.length).toBeGreaterThan(0);
    expect(m.carnetMessage.effets.filter(e => e.carnetId !== ID_FRIGO), 'aucun effet hors du Frigo').toEqual([]);
    expect(intact(ID_EVIER), 'l’Évier n’est pas touché').toBe(true);
    expect(m.carnetMessage.rangement).toBe('locale');
    expect(m.carnetMessage.propositionsSuivi).toEqual([{ sorte: 'deplacer', carnetId: ID_FRIGO, versCarnetId: ID_EVIER, origine: 'locale' }]);
  }, 30000);

  it('une réponse sans les champs du suivi (serveur ancien) : le repli local garde ses jetons, aucune carte, aucune erreur', async () => {
    const { magasin } = await envoyer({ lignes: [{ sorte: 'note', genre: 'a-faire', texte: 'Rappeler le ferblantier', carnetId: ID_VENTILATION }] });
    const m = message(magasin);
    expect(m).toBeTruthy();
    expect((m.carnetMessage.etiquettes ?? []).map(e => `${e.sorte}:${e.origine}`).sort()).toEqual(['contact:locale', 'devis:locale']);
    expect(m.carnetMessage.propositionsSuivi).toBeUndefined();
  }, 30000);
});
