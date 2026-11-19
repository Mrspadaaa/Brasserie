// @vitest-environment jsdom
/**
 * Port du carnet, critique 4, lot D (fil, champ et gestes). Problèmes de CRITIQUE-4.md :
 * P7 et P25 (texte · après, une seule ligne d'état), P9 (lien sans retour), P11 (note en vrac après : type ▾, carnet ▾), P18 (G11
 * « Garder à part » branché), P22 et P36 (IA éteinte, hors ligne, échec), P23 (D-35, puce proposée d'un toucher), P28 (Créer · avant),
 * P33 (« Se modifie ici » à la place de la note), P34 (le bandeau « Note supprimée » part après Annuler).
 * Fixture « ZZ TEST — … », magasin mémoire, IA simulée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules, type AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_FRIGO, ID_VENTILATION, PHRASE_DOUBLON } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages } from '../../src/domain/carnets/modele';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import type { ModeCarnetIA } from '../../src/config/carnetIA';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function monter(o: { delai?: number; ouvrir?: string; mode?: ModeCarnetIA; horsLigne?: boolean; appels?: AppelsIA } = {}) {
  const magasin = magasinMemoire(fixtureCarnets());
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={o.mode ?? 'simule'}
    appels={o.appels ?? appelsSimules('normal', o.delai ?? 20)} aides={aidesCarnet('simule', {})} horsLigne={o.horsLigne}
    {...(o.ouvrir ? { ouvrir: { id: o.ouvrir, at: 1 } } : {})} ecrirePlan={() => {}} />);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  const carnet = (id: string) => lireCarnets(magasin.lire(), { archives: true }).find(c => c.id === id)!;
  return { magasin, champ, carnet };
}
const attendre = async (ms = 30) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const taper = (champ: () => HTMLTextAreaElement, txt: string) => fireEvent.change(champ(), { target: { value: txt } });
const envoyer = async (champ: () => HTMLTextAreaElement, txt: string) => {
  taper(champ, txt);
  await act(async () => { fireEvent.submit(champ().closest('form')!); });
};
const enCours = () => document.querySelector('.cn-etat[data-etat="en-cours"]');

describe('P18 (G11) : « Garder à part » branché', () => {
  it('PHRASE_DOUBLON dans Ventilation montre « Garder à part » ; le toucher retire la proposition et l’envoi écrit garderAPart, sans fusion', async () => {
    const { magasin, champ, carnet } = monter({ ouvrir: ID_VENTILATION });
    const n0 = carnet(ID_VENTILATION).carnet.notes.length;
    taper(champ, PHRASE_DOUBLON);
    expect(document.body.textContent).toContain('elles seront fusionnées');
    fireEvent.click(screen.getByRole('button', { name: 'Garder à part' }));
    expect(screen.queryByRole('button', { name: 'Garder à part' })).toBeNull();
    expect(document.body.textContent).not.toContain('elles seront fusionnées');
    await act(async () => { fireEvent.submit(champ().closest('form')!); });
    await attendre(120);
    const msg = lireMessages(magasin.lire()).find(m => m.carnetMessage.texte === PHRASE_DOUBLON)!;
    expect(msg.carnetMessage.gardeAPart).toBe(true);
    expect(carnet(ID_VENTILATION).carnet.notes.length).toBe(n0 + 1);
  });

  it('sans « Garder à part », la note répétée est fusionnée, comme annoncé', async () => {
    const { champ, carnet } = monter({ ouvrir: ID_VENTILATION });
    const n0 = carnet(ID_VENTILATION).carnet.notes.length;
    await envoyer(champ, PHRASE_DOUBLON);
    await attendre(120);
    const notes = carnet(ID_VENTILATION).carnet.notes;
    expect(notes.length).toBe(n0);
    expect(notes.find(n => n.id === 'ZZ-V-N1')?.fusionDe?.length).toBe(2);
  });
});

describe('P34 : Annuler une suppression de note', () => {
  it('la note revient et le bandeau « Note supprimée · Annuler » disparaît', async () => {
    const { carnet } = monter({ ouvrir: ID_VENTILATION });
    const note = carnet(ID_VENTILATION).carnet.notes[0];
    fireEvent.click(screen.getByRole('button', { name: `Note : ${note.texte}, actions` }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Supprimer/ }));
    expect(carnet(ID_VENTILATION).carnet.notes.some(n => n.id === note.id)).toBe(false);
    const bandeau = document.querySelector('.cn-bandeau[data-sorte="note-supprimee"]')!;
    expect(bandeau).not.toBeNull();
    fireEvent.click(bandeau.querySelector('button')!);
    expect(carnet(ID_VENTILATION).carnet.notes.some(n => n.id === note.id)).toBe(true);
    expect(document.querySelector('.cn-bandeau[data-sorte="note-supprimee"]')).toBeNull();
    expect(document.body.textContent).not.toContain('Note supprimée');
  });

  it('même quand un écouteur du magasin échoue après la restauration (banc : reflet du cache), le bandeau part et la note revient', async () => {
    const vrai = magasinMemoire(fixtureCarnets());
    let armer = false;
    const magasin = { ...vrai, appliquer: (l: Parameters<typeof vrai.appliquer>[0], j?: Parameters<typeof vrai.appliquer>[1]) => {
      vrai.appliquer(l, j);
      if (armer) throw new Error('reflet du cache en échec');
    } };
    const erreurs: unknown[] = [];
    const surErreur = (e: ErrorEvent) => { erreurs.push(e.error); e.preventDefault(); };
    window.addEventListener('error', surErreur);
    try {
      render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="eteint" aides={aidesCarnet('simule', {})}
        ouvrir={{ id: ID_VENTILATION, at: 1 }} ecrirePlan={() => {}} />);
      const note = lireCarnets(vrai.lire()).find(c => c.id === ID_VENTILATION)!.carnet.notes[0];
      fireEvent.click(screen.getByRole('button', { name: `Note : ${note.texte}, actions` }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Supprimer/ }));
      armer = true;
      fireEvent.click(document.querySelector('.cn-bandeau[data-sorte="note-supprimee"] button')!);
      expect(lireCarnets(vrai.lire()).find(c => c.id === ID_VENTILATION)!.carnet.notes.some(n => n.id === note.id)).toBe(true);
      expect(document.querySelector('.cn-bandeau[data-sorte="note-supprimee"]')).toBeNull();
      expect(erreurs).toEqual([]);
    } finally { window.removeEventListener('error', surErreur); }
  });
});

describe('P7, P25, P26 : une seule ligne d’état ; « L’IA range… » s’arrête à la réponse', () => {
  it('texte · après dans Ventilation : plus de roue, « ✓ Rangé ici » et sa phrase citée', async () => {
    const { champ } = monter({ ouvrir: ID_VENTILATION, delai: 60 });
    const PHRASE = 'ZZ TEST — buées au-dessus de la cuve, 1 200 m³/h';
    await envoyer(champ, PHRASE);
    expect(enCours()).not.toBeNull();
    await attendre(200);
    expect(enCours()).toBeNull();
    expect(document.body.textContent).not.toContain('L\'IA range…');
    expect(document.body.textContent).toMatch(/Rangé ici/);
    expect(document.body.textContent).toContain(PHRASE);
  });

  it('Créer : « ✓ Carnet créé » seul, jamais la roue dessous, ni « ✓ Rangé » en double', async () => {
    const { champ } = monter({ delai: 120 });
    await envoyer(champ, 'ZZ TEST — moulin à malt 2 cylindres');
    expect(document.querySelector('.cn-bandeau[data-sorte="cree"]')).not.toBeNull();
    expect(enCours()).toBeNull();
    await attendre(250);
    expect(document.querySelector('.cn-bandeau[data-sorte="cree"]')).not.toBeNull();
    expect(document.querySelectorAll('.cn-etat').length).toBe(0);
  });
});

describe('P9 (R25), P21 : un lien sans page lue, une photo', () => {
  it('lien seul illisible dans un carnet : « ✓ Lien rangé ici · page non lue », le lien en clair, Ouvrir ↗', async () => {
    const { champ } = monter({ ouvrir: ID_VENTILATION });
    await envoyer(champ, 'https://exemple.invalid/inconnu-42');
    await attendre(500);
    const b = document.querySelector('.cn-bandeau[data-sorte="lien"]')!;
    expect(b).not.toBeNull();
    expect(b.textContent).toContain('Lien rangé ici · page non lue');
    expect(b.textContent).toContain('exemple.invalid/inconnu-42');
    expect(b.querySelector('a')?.getAttribute('href')).toBe('https://exemple.invalid/inconnu-42');
  });
});

describe('P22, P36 : IA éteinte, hors ligne, en échec', () => {
  it('IA éteinte : l’avis et ce qui a été rangé, où', async () => {
    const { champ } = monter({ ouvrir: ID_FRIGO, mode: 'eteint' });
    await envoyer(champ, 'filtre à air G4, 2 pièces');
    const b = document.querySelector('.cn-bandeau[data-avis="eteint"]')!;
    expect(b).not.toBeNull();
    expect(b.textContent).toContain('IA éteinte : rangé sur l’appareil');
    expect(b.textContent).toContain('« filtre à air G4, 2 pièces »');
    /* décision du pilote (critique 6) : le titre stocké, « ZZ TEST — » compris */
    expect(b.textContent).toMatch(/dans (ZZ TEST — )?Frigo de garde/);
  });

  it('hors ligne : même chose', async () => {
    const { champ } = monter({ ouvrir: ID_FRIGO, horsLigne: true });
    await envoyer(champ, 'filtre à air G4, 2 pièces');
    const b = document.querySelector('.cn-bandeau[data-avis="hors-ligne"]')!;
    expect(b.textContent).toContain('Hors ligne : rangé sur l’appareil');
    expect(b.textContent).toMatch(/dans (ZZ TEST — )?Frigo de garde/);
  });

  it('échec : un avis distinct de « L’IA range… », sans roue', async () => {
    const { champ } = monter({ ouvrir: ID_FRIGO, appels: appelsSimules('echec', 20) });
    await envoyer(champ, 'filtre à air G4, 2 pièces');
    await attendre(80);
    expect(enCours()).toBeNull();
    expect(document.querySelector('.cn-actif')).toBeNull();
    expect(document.body.textContent).toContain('L’IA n’a pas répondu');
    expect(document.querySelector('.cn-bandeau[data-avis="echec"]')).not.toBeNull();
  });
});

describe('P23 (D-35) : une ligne proposée par l’IA, rangée d’un toucher', () => {
  it('« ✻ Comparer sur le débit (m³/h) · Ajouter » sous le bandeau ; le toucher range le critère sans `propose`', async () => {
    const base = appelsSimules('normal', 20);
    const appels: AppelsIA = {
      lire: base.lire,
      async ranger(ctx, signal) {
        await new Promise(r => setTimeout(r, 20));
        if (signal.aborted) return { ok: false };
        const rep = reponseSimulee(ctx) as { lignes?: unknown[] } | null;
        return { ok: true, data: { ...rep, lignes: [...(rep?.lignes ?? []), {
          sorte: 'critere', texte: 'débit', carnetId: ID_FRIGO, propose: true, caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' }
        }] } };
      }
    };
    const { champ, carnet } = monter({ ouvrir: ID_FRIGO, appels });
    const k0 = carnet(ID_FRIGO).carnet.criteres.length;
    await envoyer(champ, 'ZZ TEST — compresseur silencieux');
    await attendre(120);
    expect(document.body.textContent).toContain('Comparer sur le débit (m³/h)');
    expect(carnet(ID_FRIGO).carnet.criteres.length).toBe(k0);
    const groupe = screen.getByRole('group', { name: 'Proposé par l’IA' });
    fireEvent.click(groupe.querySelector('button.cn-puce')!);
    const ks = carnet(ID_FRIGO).carnet.criteres;
    expect(ks.length).toBe(k0 + 1);
    const k = ks[ks.length - 1] as unknown as Record<string, unknown>;
    expect(k.caracteristique).toMatchObject({ nom: 'débit', unite: 'm³/h' });
    expect('propose' in k).toBe(false);
    expect(screen.queryByRole('group', { name: 'Proposé par l’IA' })).toBeNull();
  });
});

describe('P11 (g5:v01-16) : note en vrac après', () => {
  it('chaque ligne a son type ▾ et son carnet ▾ ; changer le carnet déplace la ligne', async () => {
    const { champ, magasin } = monter({ delai: 20 });
    await envoyer(champ, 'ZZ TEST — rappeler le ferblantier pour la hotte\nacheter un joint pour le frigo de garde\nest-ce que l’évier passe la porte ?');
    await attendre(150);
    const vrac = document.querySelector('.cn-vrac-apres')!;
    expect(vrac).not.toBeNull();
    expect(vrac.textContent).toMatch(/lignes? rangées? dans/);
    expect(vrac.textContent).toContain('Texte d\'origine');
    const carnetsChoix = vrac.querySelectorAll('select[aria-label^="Carnet de"]');
    expect(carnetsChoix.length).toBeGreaterThan(0);
    const sel = carnetsChoix[0] as HTMLSelectElement;
    const avant = sel.value;
    const autre = [...sel.options].map(o => o.value).find(v => v !== avant)!;
    fireEvent.change(sel, { target: { value: autre } });
    const msg = lireMessages(magasin.lire()).find(m => m.carnetMessage.texte.startsWith('ZZ TEST — rappeler'))!;
    expect(msg.carnetMessage.effets.some(e => e.carnetId === autre && e.cible !== 'carnet')).toBe(true);
  });
});

describe('P28 (R09) et P33 (R20)', () => {
  it('Créer · avant : le champ de la liste pris montre la phrase, les exemples touchables et « Une note en vrac marche aussi. »', () => {
    const { champ } = monter();
    fireEvent.focus(champ());
    expect(document.body.textContent).toContain('on garde sa photo et son prix, pour comparer');
    expect(document.body.textContent).toContain('Une note en vrac marche aussi.');
    fireEvent.click(screen.getByRole('button', { name: 'Frigo de garde' }));
    expect(champ().value).toBe('Frigo de garde');
  });

  it('« Se modifie ici » s’ouvre à la place de la note, avec son texte', () => {
    const { carnet } = monter({ ouvrir: ID_VENTILATION });
    const note = carnet(ID_VENTILATION).carnet.notes[0];
    fireEvent.click(screen.getByRole('button', { name: `Note : ${note.texte}, actions` }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Modifier/ }));
    const bloc = document.querySelector('.cnf-cadre-modifier')!;
    expect(bloc).not.toBeNull();
    expect(bloc.textContent).toContain(note.texte);
    expect(bloc.closest('section[aria-label="Notes"]')).not.toBeNull();
    expect(bloc.previousElementSibling?.classList.contains('cn-note')).toBe(true);
  });
});
