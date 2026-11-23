// T10-M2-1 (D429) : politique de mise à jour. Horloge simulée, aucun service worker réel (la preuve au navigateur est à part).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CALME_MS, SONDE_MS, INTERVALLE_MIN_MS, VERIFICATION_MS, creerMiseAJour, interfaceOccupee, type EntreeMiseAJour } from '../../src/services/miseAJour';

function banc(over: Partial<EntreeMiseAJour> = {}) {
  const e = {
    occupe: vi.fn(() => false),
    appliquer: vi.fn(() => true),
    verifier: vi.fn(() => Promise.resolve()),
    visible: vi.fn(() => true),
    montrer: vi.fn(),
    ...over,
  };
  return { e, m: creerMiseAJour(e) };
}

describe('creerMiseAJour', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('active la version prête quand rien n\'est ouvert, après le calme, sans bandeau', () => {
    const { e, m } = banc();
    m.versionPrete();
    expect(e.appliquer).not.toHaveBeenCalled();
    vi.advanceTimersByTime(CALME_MS + 2 * SONDE_MS);
    expect(e.appliquer).toHaveBeenCalledTimes(1);
    expect(e.appliquer).toHaveBeenCalledWith(true);
    expect(e.montrer).not.toHaveBeenCalledWith(true);
  });

  it('avec une feuille ouverte : bandeau, rien d\'appliqué ; à la fermeture, appliqué une seule fois', () => {
    let ouvert = true;
    const { e, m } = banc({ occupe: vi.fn(() => ouvert) });
    m.versionPrete();
    vi.advanceTimersByTime(30_000);
    expect(e.montrer).toHaveBeenCalledWith(true);
    expect(e.appliquer).not.toHaveBeenCalled();
    ouvert = false;
    vi.advanceTimersByTime(CALME_MS + 2 * SONDE_MS);
    expect(e.appliquer).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    expect(e.appliquer).toHaveBeenCalledTimes(1);
  });

  it('une feuille rouverte pendant le calme remet le délai à zéro', () => {
    let ouvert = false;
    const { e, m } = banc({ occupe: vi.fn(() => ouvert) });
    m.versionPrete();
    vi.advanceTimersByTime(1000);
    ouvert = true; vi.advanceTimersByTime(1000);
    ouvert = false; vi.advanceTimersByTime(1000);
    expect(e.appliquer).not.toHaveBeenCalled();
    vi.advanceTimersByTime(CALME_MS);
    expect(e.appliquer).toHaveBeenCalledTimes(1);
  });

  it('garde anti-boucle : un refus laisse le bandeau et n\'insiste pas', () => {
    const { e, m } = banc({ appliquer: vi.fn(() => false) });
    m.versionPrete();
    vi.advanceTimersByTime(20_000);
    expect(e.appliquer).toHaveBeenCalledTimes(1);
    expect(e.montrer).toHaveBeenLastCalledWith(true);
  });

  it('« Recharger » applique tout de suite, même avec une feuille ouverte', () => {
    const { e, m } = banc({ occupe: vi.fn(() => true) });
    m.versionPrete();
    m.recharger();
    expect(e.appliquer).toHaveBeenCalledWith(false);
    vi.advanceTimersByTime(10_000);
    expect(e.appliquer).toHaveBeenCalledTimes(1);
  });

  it('vérifie au retour sur l\'app, pas hors écran, pas plus d\'une fois par intervalle minimal', () => {
    let visible = true;
    const { e, m } = banc({ visible: vi.fn(() => visible) });
    const arret = m.demarrer();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(e.verifier).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(e.verifier).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(INTERVALLE_MIN_MS + 1);
    visible = false; document.dispatchEvent(new Event('visibilitychange'));
    expect(e.verifier).toHaveBeenCalledTimes(1);
    visible = true; document.dispatchEvent(new Event('visibilitychange'));
    expect(e.verifier).toHaveBeenCalledTimes(2);
    arret();
    vi.advanceTimersByTime(VERIFICATION_MS * 2);
    expect(e.verifier).toHaveBeenCalledTimes(2);
  });

  it('vérifie toutes les 30 min tant que l\'app est visible', () => {
    const { e, m } = banc();
    m.demarrer();
    vi.advanceTimersByTime(VERIFICATION_MS * 3 + 100);
    expect(e.verifier).toHaveBeenCalledTimes(3);
  });

  it('un échec de vérification (hors ligne) ne casse rien', async () => {
    const { e, m } = banc({ verifier: vi.fn(() => Promise.reject(new Error('réseau'))) });
    m.verifier();
    await Promise.resolve();
    expect(e.verifier).toHaveBeenCalledTimes(1);
  });
});

describe('interfaceOccupee', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  it('libre sur une page nue', () => {
    document.body.innerHTML = '<main><button id="b">Ok</button></main>';
    (document.getElementById('b') as HTMLElement).focus();
    expect(interfaceOccupee()).toBe(false);
  });
  it('occupée si un champ de texte a le focus', () => {
    document.body.innerHTML = '<input id="i" type="text"><textarea id="t"></textarea>';
    (document.getElementById('i') as HTMLElement).focus();
    expect(interfaceOccupee()).toBe(true);
    (document.getElementById('t') as HTMLElement).focus();
    expect(interfaceOccupee()).toBe(true);
  });
  it('une case à cocher focalisée n\'est pas une saisie', () => {
    document.body.innerHTML = '<input id="c" type="checkbox">';
    (document.getElementById('c') as HTMLElement).focus();
    expect(interfaceOccupee()).toBe(false);
  });
  it('occupée si une feuille est ouverte, libre une fois fermée', () => {
    document.body.innerHTML = '<div role="dialog" aria-modal="true" id="d">x</div>';
    expect(interfaceOccupee()).toBe(true);
    document.body.innerHTML = '<div role="dialog" data-state="closed">x</div>';
    expect(interfaceOccupee()).toBe(false);
    document.body.innerHTML = '<div data-vaul-drawer data-state="open">x</div>';
    expect(interfaceOccupee()).toBe(true);
    document.body.innerHTML = '<div data-saisie-ouverte></div>';
    expect(interfaceOccupee()).toBe(true);
  });
});
