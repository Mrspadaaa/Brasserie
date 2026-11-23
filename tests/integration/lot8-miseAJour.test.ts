// E-2 (23.11) : la version en attente prend la main au démarrage ; une visite suivante cherche la version tout de suite.
// La preuve au navigateur (vrai service worker, deux versions servies) est e2e/carnet/lot-8.spec.ts.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prendreVersionEnAttente } from '../../src/services/miseAJour';
import { programmerPrecache } from '../../src/services/precacheHorsLigne';

function conteneur({ controle = true, attente = true } = {}) {
  const postMessage = vi.fn();
  const addEventListener = vi.fn();
  const sw = {
    controller: controle ? {} : null,
    getRegistration: vi.fn(async () => ({ waiting: attente ? { postMessage } : null })),
    addEventListener,
  } as unknown as ServiceWorkerContainer;
  return { sw, postMessage, addEventListener };
}

describe('prendreVersionEnAttente', () => {
  afterEach(() => { sessionStorage.clear(); });

  it('version en attente sous contrôle : SKIP_WAITING et rechargement à la prise de main', async () => {
    const { sw, postMessage, addEventListener } = conteneur();
    const relancer = vi.fn();
    expect(await prendreVersionEnAttente(sw, relancer)).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(addEventListener).toHaveBeenCalledWith('controllerchange', relancer, { once: true });
  });

  it('rien en attente, ou première visite : l\'app démarre', async () => {
    expect(await prendreVersionEnAttente(conteneur({ attente: false }).sw)).toBe(false);
    const premiere = conteneur({ controle: false });
    expect(await prendreVersionEnAttente(premiere.sw)).toBe(false);
    expect(premiere.postMessage).not.toHaveBeenCalled();
    expect(await prendreVersionEnAttente(undefined)).toBe(false);
  });

  it('garde anti-boucle : pas deux activations au démarrage en moins de 15 s', async () => {
    const a = conteneur();
    expect(await prendreVersionEnAttente(a.sw, vi.fn())).toBe(true);
    const b = conteneur();
    expect(await prendreVersionEnAttente(b.sw, vi.fn())).toBe(false);
    expect(b.postMessage).not.toHaveBeenCalled();
  });
});

describe('programmerPrecache', () => {
  const entree = (over: Partial<Parameters<typeof programmerPrecache>[0]> = {}) => ({
    disponible: () => true,
    dejaInstalle: () => false,
    reseauAMenager: () => false,
    enLigne: () => true,
    auRepos: vi.fn(),
    enregistrer: vi.fn(() => Promise.resolve()),
    ...over,
  });

  it('visite suivante : enregistre tout de suite, sans attendre le repos, même hors ligne ou en économie de données', () => {
    const e = entree({ dejaInstalle: () => true, enLigne: () => false, reseauAMenager: () => true });
    expect(programmerPrecache(e)).toBe(true);
    expect(e.enregistrer).toHaveBeenCalledTimes(1);
    expect(e.auRepos).not.toHaveBeenCalled();
  });

  it('première visite : au repos seulement, et jamais en économie de données', () => {
    const e = entree();
    expect(programmerPrecache(e)).toBe(true);
    expect(e.enregistrer).not.toHaveBeenCalled();
    expect(e.auRepos).toHaveBeenCalledTimes(1);
    expect(programmerPrecache(entree({ reseauAMenager: () => true }))).toBe(false);
  });
});
