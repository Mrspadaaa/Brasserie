// @vitest-environment jsdom
/**
 * Port du carnet, correction du tour 3, lot L3 (champ, fil, bandeau, état de l'IA). Problèmes de vision-3 :
 * - P8 (bloquant) : « ✓ Carnet créé · ↺ Annuler » agit même si l'IA finit pendant le toucher (le bouton n'est pas remplacé) ;
 * - P10, 40b : l'IA en cours dit « ✻ L'IA range… », avec un ✕ « Arrêter l'IA » ; fini = « ✓ Rangé », sans ✻ (Q19) ;
 * - P6 : « Va dans » est un libellé insécable ;
 * - P7 : photo choisie → vignette « photo jointe · lecture… » retirable ; dictée → micro à l'état « écoute » ;
 * - d1280-18 : après un rangement, le bandeau est amené dans la zone visible.
 * Fixture, magasin mémoire, IA simulée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { ChampCarnet } from '../../src/ui/carnets/ChampCarnet';
import { EtatIA } from '../../src/ui/carnets/EtatIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));

const dicteeEtat = vi.hoisted(() => ({ ecoute: false, basculer: () => {} }));
vi.mock('../../src/ui/atelier/dictee', () => ({
  useDictee: () => ({ disponible: true, ecoute: dicteeEtat.ecoute, basculer: dicteeEtat.basculer })
}));

const reduire = vi.hoisted(() => ({ attente: null as null | ((v: string | null) => void) }));
vi.mock('../../src/ui/carnets/photo', async orig => {
  const vrai = await orig<typeof import('../../src/ui/carnets/photo')>();
  return { ...vrai, reduirePhoto: () => new Promise<string | null>(r => { reduire.attente = r; }) };
});

let scrolls: Element[] = [];
beforeEach(() => {
  scrolls = [];
  dicteeEtat.ecoute = false;
  reduire.attente = null;
  Element.prototype.scrollIntoView = function (this: Element) { scrolls.push(this); } as never;
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const rien = () => {};
const PHRASE = 'ZZ TEST — moulin à malt 2 cylindres';
function monter(delai: number, ouvrir?: string) {
  const magasin = magasinMemoire(fixtureCarnets());
  const nb0 = lireCarnets(magasin.lire()).length;
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={appelsSimules('normal', delai)}
    aides={aidesCarnet('simule', {})} {...(ouvrir ? { ouvrir: { id: ouvrir, at: 1 } } : {})} ecrirePlan={rien} />);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  const nb = () => lireCarnets(magasin.lire()).length;
  return { magasin, champ, nb, nb0 };
}
const attendre = async (ms = 30) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const envoyer = async (champ: () => HTMLTextAreaElement, txt: string) => {
  fireEvent.change(champ(), { target: { value: txt } });
  await act(async () => { fireEvent.submit(champ().closest('form')!); });
};
const boutonAnnuler = () => {
  const b = document.querySelector('.cn-bandeau[data-sorte="cree"] button.cn-lien') as HTMLButtonElement | null;
  if (!b) throw new Error('bandeau « Carnet créé » absent');
  return b;
};

describe('P8 (R11) : « ✓ Carnet créé · ↺ Annuler » agit même si l’IA finit pendant le toucher', () => {
  it('le bouton Annuler visé avant la fin de l’IA reste le même nœud après, et défait tout', async () => {
    const { champ, nb, nb0 } = monter(120);
    await envoyer(champ, PHRASE);
    expect(nb()).toBe(nb0 + 1);
    const avant = boutonAnnuler();
    const bandeauAvant = avant.closest('.cn-bandeau');
    await attendre(250); /* l’IA a fini et réécrit le carnet */
    expect(document.contains(avant)).toBe(true);
    expect(boutonAnnuler()).toBe(avant);
    expect(avant.closest('.cn-bandeau')).toBe(bandeauAvant);
    /* P10 : l'état en cours est devenu « ✓ Rangé », à la même place, sans ✻ */
    expect(document.querySelector('.cn-etat[data-etat="en-cours"]')).toBeNull();
    expect(document.querySelector('.cn-etat[data-etat="range"]')?.textContent).toContain('Rangé');
    fireEvent.click(avant);
    await attendre();
    expect(nb()).toBe(nb0);
    expect(document.querySelector('[data-vue]')!.getAttribute('data-vue')).toBe('liste');
  });
  it('Annuler pendant l’IA coupe l’IA puis défait : rien n’est réécrit après', async () => {
    const { champ, nb, nb0 } = monter(150);
    await envoyer(champ, PHRASE);
    expect(nb()).toBe(nb0 + 1);
    fireEvent.click(boutonAnnuler());
    await attendre(300);
    expect(nb()).toBe(nb0);
    expect(lireCarnets(fixtureCarnets()).length).toBe(nb0);
  });
  it.each([['pendant la lecture de la page', 60], ['après la fin de l’IA', 600]])('phrase avec lien et prix (état 08 du banc) : Annuler %s défait tout', async (_q, ms) => {
    const { champ, nb, nb0 } = monter(150);
    await envoyer(champ, 'ZZ TEST — ventilateur de condensation https://exemple.test/ZZ-TEST-ventilo 189,90 CHF');
    await attendre(ms);
    expect(nb()).toBe(nb0 + 1);
    fireEvent.click(boutonAnnuler());
    await attendre(600);
    expect(nb()).toBe(nb0);
    expect(document.querySelector('[data-vue]')!.getAttribute('data-vue')).toBe('liste');
  });
  it('Annuler après la fin de l’IA défait l’écriture de l’IA et la locale', async () => {
    const { champ, nb, nb0 } = monter(0);
    await envoyer(champ, PHRASE);
    await attendre(60);
    expect(nb()).toBe(nb0 + 1);
    fireEvent.click(boutonAnnuler());
    await attendre();
    expect(nb()).toBe(nb0);
  });
});

describe('P10, 40b : l’IA en cours ne se confond pas avec l’état fini', () => {
  it('en cours : « L’IA range… », signe d’activité, ✻, et ✕ « Arrêter l’IA »', () => {
    const arreter = vi.fn();
    render(<EtatIA etat="en-cours" quoi={PHRASE} onAnnuler={arreter} />);
    const s = screen.getByRole('status');
    expect(s.getAttribute('data-etat')).toBe('en-cours');
    expect(s.getAttribute('aria-busy')).toBe('true');
    expect(s.textContent).toContain("L'IA range…");
    expect(s.textContent).toContain(PHRASE);
    expect(s.querySelector('.cn-prov-ia')).not.toBeNull();
    expect(s.querySelector('.cn-actif')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: "Arrêter l'IA" }));
    expect(arreter).toHaveBeenCalledOnce();
  });
  it('fini : « ✓ Rangé », sans ✻ ni signe d’activité', () => {
    render(<EtatIA etat="range" />);
    const s = screen.getByRole('status');
    expect(s.getAttribute('data-etat')).toBe('range');
    expect(s.textContent).toContain('Rangé');
    expect(s.textContent).not.toContain('✻');
    expect(s.querySelector('.cn-actif')).toBeNull();
    expect(s.getAttribute('aria-busy')).toBeNull();
  });
  it('dans la vue : pendant l’IA lente, « L’IA range… » et le ✕ arrête ; le carnet local reste', async () => {
    const { champ, nb, nb0 } = monter(400, ID_VENTILATION);
    await envoyer(champ, 'ZZ TEST — prévoir une gaine de 200 mm');
    const s = document.querySelector('.cn-etat[data-etat="en-cours"]');
    expect(s?.textContent).toContain("L'IA range…");
    await attendre(40);
    expect(scrolls).toContain(s); /* en haut du carnet, le champ en bas : l'état vient en vue */
    fireEvent.click(screen.getByRole('button', { name: "Arrêter l'IA" }));
    await attendre(450);
    expect(document.querySelector('.cn-etat[data-etat="en-cours"]')).toBeNull();
    expect(nb()).toBe(nb0);
  });
});

describe('P6 (R13) : « Va dans » tient sur une ligne', () => {
  it('le libellé est insécable et porte sa classe', () => {
    render(<ChampCarnet valeur="laisser la fenêtre ouverte" onChange={rien} onEnvoyer={rien} titreCarnet="Ventilation"
      vaDans={{ options: [{ id: 'critere', libelle: 'Ce qui compte' }, { id: 'note', libelle: 'Note' }], choisi: 'note', onChoisir: rien }} />);
    const l = document.querySelector('.cn-vadans-libelle')!;
    expect(l.textContent).toBe('Va dans');
  });
});

describe('P7 : un retour visible après 📷 et 🎤', () => {
  it('photo choisie : vignette « photo jointe · lecture… » dans le champ, retirable d’un ✕, avant l’envoi', async () => {
    const { magasin, nb, nb0 } = monter(0, ID_VENTILATION);
    const entree = document.querySelector('.cn-champ input[type=file]') as HTMLInputElement;
    const f = new File(['x'], 'evier.jpg', { type: 'image/jpeg' });
    await act(async () => { fireEvent.change(entree, { target: { files: [f] } }); });
    const v = document.querySelector('.cn-jointe');
    expect(v?.textContent).toContain('photo jointe');
    expect(v?.textContent).toContain('lecture…');
    fireEvent.click(screen.getByRole('button', { name: 'Retirer la photo' }));
    expect(document.querySelector('.cn-jointe')).toBeNull();
    await act(async () => { reduire.attente?.('data:image/jpeg;base64,AAAA'); });
    await attendre();
    expect(document.querySelector('.cn-jointe')).toBeNull(); /* la lecture finie après le ✕ ne la ramène pas */
    expect(nb()).toBe(nb0);
    const photos = (m: typeof magasin) => lireCarnets(m.lire()).find(x => x.id === ID_VENTILATION)!.carnet.photos.length;
    expect(photos(magasin)).toBe(photos(magasinMemoire(fixtureCarnets())));
  });
  it('photo prête : « photo jointe » puis l’envoi la range dans le carnet ouvert', async () => {
    const { magasin } = monter(0, ID_VENTILATION);
    const avant = lireCarnets(magasin.lire()).find(x => x.id === ID_VENTILATION)!.carnet.photos.length;
    const entree = document.querySelector('.cn-champ input[type=file]') as HTMLInputElement;
    await act(async () => { fireEvent.change(entree, { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } }); });
    await act(async () => { reduire.attente?.('data:image/jpeg;base64,AAAA'); });
    const v = document.querySelector('.cn-jointe')!;
    expect(v.textContent).toContain('photo jointe');
    expect(v.textContent).not.toContain('lecture…');
    expect(v.querySelector('img')?.getAttribute('src')).toBe('data:image/jpeg;base64,AAAA');
    await act(async () => { fireEvent.submit(document.querySelector('.cn-champ')!); });
    await attendre();
    expect(lireCarnets(magasin.lire()).find(x => x.id === ID_VENTILATION)!.carnet.photos.length).toBe(avant + 1);
    expect(document.querySelector('.cn-jointe')).toBeNull();
  });
  it('dictée en cours : le micro passe à l’état « écoute », libellé « Arrêter la dictée »', () => {
    dicteeEtat.ecoute = true;
    render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} />);
    const m = screen.getByRole('button', { name: 'Arrêter la dictée' });
    expect(m.getAttribute('aria-pressed')).toBe('true');
    expect(m.classList.contains('cn-ecoute')).toBe(true);
    expect(document.querySelector('.cn-champ')!.classList.contains('cn-champ-ecoute')).toBe(true);
  });
  it('dictée au repos : « Dicter », sans état écoute', () => {
    render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} />);
    const m = screen.getByRole('button', { name: 'Dicter' });
    expect(m.classList.contains('cn-ecoute')).toBe(false);
  });
});

describe('d1280-18 (R27, G21) : le bandeau d’un rangement est amené dans la zone visible', () => {
  it('« Rangé ici · Annuler » ou « Carnet créé » : le bandeau défile en vue à son arrivée', async () => {
    const { champ } = monter(0);
    await envoyer(champ, PHRASE);
    await attendre(60);
    const b = document.querySelector('.cn-bandeau');
    expect(b).not.toBeNull();
    expect(scrolls.some(e => e === b || e.contains(b!))).toBe(true);
  });
});
