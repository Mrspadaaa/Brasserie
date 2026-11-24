// @vitest-environment jsdom
// Voie maj-pwa (23.11) : la règle « l'app est-elle au repos ? » qui décide d'appliquer la nouvelle version.
// Au repos = aucune feuille ni saisie ouverte, aucun appel serveur (lecture IA, lien) en cours. Jamais de rechargement sinon.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  VERIFICATION_MS, appelsEnCours, estAuRepos, estAppelServeur, marquerTravail, suivreAppelsServeur,
} from '../../src/services/miseAJour';

afterEach(() => { document.body.innerHTML = ''; });

describe('estAuRepos', () => {
  it('page nue, rien en cours : au repos', () => {
    expect(estAuRepos(document, 0)).toBe(true);
  });

  it('un champ de saisie a le focus : pas au repos', () => {
    document.body.innerHTML = '<input id="q" type="text">';
    (document.getElementById('q') as HTMLInputElement).focus();
    expect(estAuRepos(document, 0)).toBe(false);
  });

  it('une feuille ouverte : pas au repos', () => {
    document.body.innerHTML = '<dialog open>feuille</dialog>';
    expect(estAuRepos(document, 0)).toBe(false);
  });

  it('une lecture IA ou de lien en cours : pas au repos, même sans feuille ni champ', () => {
    expect(estAuRepos(document, 1)).toBe(false);
    expect(estAuRepos(document, 2)).toBe(false);
  });
});

describe('appels serveur suivis', () => {
  it('seuls les appels de fonctions (IA, lecture de lien) comptent, pas Firestore ni les fichiers de l\'app', () => {
    expect(estAppelServeur('https://europe-west6-brasserie-l-affinee.cloudfunctions.net/aiTask')).toBe(true);
    expect(estAppelServeur('https://aitask-abc123-oa.a.run.app/')).toBe(true);
    expect(estAppelServeur('https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel')).toBe(false);
    expect(estAppelServeur('https://brasserie-l-affinee.web.app/assets/index-abc.js')).toBe(false);
  });

  it('un appel de fonction en vol compte jusqu\'à sa réponse, même en échec', async () => {
    let finir!: (r: Response) => void;
    let casser!: (e: Error) => void;
    const reseau = vi.fn((url: string) => new Promise<Response>((ok, ko) => {
      if (url.includes('echec')) casser = ko; else finir = ok;
    }));
    const fetchSuivi = suivreAppelsServeur(reseau as unknown as typeof fetch);
    const avant = appelsEnCours();

    const p1 = fetchSuivi('https://x.cloudfunctions.net/aiTask', { method: 'POST' });
    expect(appelsEnCours()).toBe(avant + 1);
    finir(new Response('{}'));
    await p1;
    expect(appelsEnCours()).toBe(avant);

    const p2 = fetchSuivi('https://x.cloudfunctions.net/echec', { method: 'POST' });
    expect(appelsEnCours()).toBe(avant + 1);
    casser(new Error('réseau'));
    await expect(p2).rejects.toThrow('réseau');
    expect(appelsEnCours()).toBe(avant);

    void fetchSuivi('https://brasserie-l-affinee.web.app/assets/a.js');
    expect(appelsEnCours()).toBe(avant);
  });

  it('marquerTravail déclare un travail à terminer ; le libérer deux fois ne compte qu\'une fois', () => {
    const avant = appelsEnCours();
    const fin = marquerTravail();
    expect(appelsEnCours()).toBe(avant + 1);
    fin(); fin();
    expect(appelsEnCours()).toBe(avant);
  });
});

describe('vérification à intervalle court', () => {
  it('toutes les minutes au plus : un onglet resté ouvert trouve la nouvelle version vite', () => {
    expect(VERIFICATION_MS).toBeLessThanOrEqual(2 * 60_000);
  });
});
