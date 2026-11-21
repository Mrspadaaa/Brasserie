// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f4c (fin de f4a et f4b) : un test par constat. Rouges sur le code d'avant : PCN-126 / v2-neuf 3 (la phrase d'un autre
 * objet, annoncée « Nouveau carnet », devenait un critère du carnet ouvert ; « autre projet, sans rapport : … » restait ici), PCN-20
 * (la fixture `g35` n'offrait aucun carnet proche), PCN-42 (la pastille de lien doublait la carte de suppression). Verts dès l'abord,
 * preuves que le code dit juste : PCN-19 (G25 atteinte sur une note du banc), PCN-61 (« Déjà un carnet proche » pendant la frappe).
 * Fixture « ZZ TEST — … », magasin mémoire, IA simulée ou rejouée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue, CARNET_NEUF, destinationDans } from '../../src/ui/carnets/CarnetsVue';
import { CarnetOuvert } from '../../src/ui/carnets/CarnetOuvert';
import { AIDES_ETEINTES } from '../../src/ui/carnets/EtatIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules, type AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { analyserLigne } from '../../src/domain/carnets/analyseLocale';
import { fixtureCarnets, ID_EXTRACTION, ID_FRIGO, ID_VENTILATION, ID_VENTILATION_CAVE, NOTE_COMME_CRITERE } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { carnetProche, rattacher } from '../../src/domain/carnets/rattacher';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); });

const attendre = async (ms = 40) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
/** L'IA rejouée : elle range la phrase en critère du carnet ouvert (ce que l'IA simulée du banc faisait de « tuyau silicone » dans Pompe). */
const iaDansLOuvert = (texte: string): AppelsIA => ({
  async ranger(ctx) { return { ok: true, data: { lignes: [{ sorte: 'critere', texte, carnetId: ctx.depuis }] } }; },
  async lire(url) { return { url, domaine: '', statut: 'indisponible', luLe: 0 }; }
});
function monter(appels: AppelsIA, ouvrir?: string) {
  const magasin = magasinMemoire(fixtureCarnets());
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={appels}
    aides={aidesCarnet('simule', {})} ecrirePlan={() => {}} {...(ouvrir ? { ouvrir: { id: ouvrir, at: 1 } } : {})} />);
  return { magasin, carnets: () => lireCarnets(magasin.lire()) };
}

describe('PCN-126 : une phrase qui se dit d’un autre projet ne reste pas dans le carnet ouvert', () => {
  const TUYAU = 'tuyau silicone 8 mm, 5 m';
  it('« autre projet, sans rapport : un frigo de garde pour 20 fûts » dans Ventilation : jamais « ici »', () => {
    const cs = lireCarnets(fixtureCarnets());
    const v = cs.find(c => c.id === ID_VENTILATION)!;
    const d = destinationDans('autre projet, sans rapport : un frigo de garde pour 20 fûts', v, cs);
    expect(d.carnetId).toBe(ID_FRIGO);
    /* sans carnet du frigo : un carnet neuf titré par l'objet, pas par « autre projet » */
    const sans = cs.filter(c => c.id !== ID_FRIGO);
    const neuf = destinationDans('autre projet, sans rapport : un frigo de garde pour 20 fûts', v, sans);
    expect(neuf.carnetId).toBe(CARNET_NEUF);
    expect(neuf.titre).toMatch(/^Frigo de garde/);
  });
});

describe('PCN-20 : `&g35=1` montre G35 (un carnet du même besoin reçoit les articles en veille)', () => {
  it('Ventilation de la salle de brassage a un carnet proche du même besoin ; jamais la cave de garde ni l’extracteur CO₂', () => {
    const cs = lireCarnets(fixtureCarnets({ g35: true }));
    const p = carnetProche(cs.find(c => c.id === ID_VENTILATION)!, cs);
    expect(p).not.toBeNull();
    expect([ID_VENTILATION_CAVE, ID_EXTRACTION]).not.toContain(p!.carnetId);
    expect(p!.titre).toMatch(/Ventilation de la salle/);
  });
});

describe('PCN-42 : pendant la suppression, la pastille du lien ne double pas la carte', () => {
  it('Frigo grisé derrière la carte « Supprimer » : aucune ligne « Dans À venir … » ; au repos, elle est là', () => {
    const f = lireCarnets(fixtureCarnets()).find(c => c.id === ID_FRIGO)! as CarnetDoc;
    const liens = [{ sorte: 'a-venir' as const, id: 'P1', libelle: 'ZZ TEST — Frigo de garde pour fûts', etat: 'present' as const, le: '2026-11-16' }];
    const rien = () => {};
    const props = { carnet: f as never, aides: AIDES_ETEINTES, liens, tableau: null, onRetour: rien, onRenommer: rien, onSupprimer: rien, onNote: rien, onOuvrirArticle: rien, onComparer: rien };
    const a = render(<CarnetOuvert {...props} />);
    expect(a.container.querySelectorAll('.cn-lien-ligne')).toHaveLength(1);
    cleanup();
    const b = render(<CarnetOuvert {...props} grise />);
    expect(b.container.querySelectorAll('.cn-lien-ligne')).toHaveLength(0);
  });
});

describe('PCN-19 : la feuille G25 s’atteint sur le banc (preuve, code juste)', () => {
  it('la note de Ventilation « il faudrait au moins 1 500 m³/h » ressemble à un critère ; les aides du banc sont allumées', () => {
    const v = lireCarnets(fixtureCarnets()).find(c => c.id === ID_VENTILATION)!;
    expect(v.carnet.notes.some(n => n.texte === NOTE_COMME_CRITERE)).toBe(true);
    expect(analyserLigne(NOTE_COMME_CRITERE).sorte).toBe('critere');
    expect(aidesCarnet('simule', {}, null).noteEnCritere).toBe(true);
  });
});

describe('PCN-61 : « Ventilation de la salle » tapé dans la liste : « Déjà un carnet proche » avant l’envoi (preuve, code juste)', () => {
  it('le cadre de création nomme Ventilation de la salle de brassage', async () => {
    const cs = lireCarnets(fixtureCarnets());
    expect(rattacher('Ventilation de la salle', cs)?.carnetId).toBe(ID_VENTILATION);
    monter(appelsSimules('lent', 4000));
    fireEvent.focus(champ());
    fireEvent.change(champ(), { target: { value: 'Ventilation de la salle' } });
    await attendre(10);
    expect(document.body.textContent).toContain('Déjà un carnet proche : ZZ TEST — Ventilation de la salle de brassage');
  });
});
