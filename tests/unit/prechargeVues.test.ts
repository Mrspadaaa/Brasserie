import { describe, expect, it } from 'vitest';
import { programmerPrechargementVues, type EntreeVues } from '../../src/services/prechargeVues';

/** Repos simulé : chaque `auRepos` met sa fonction en file ; `repos()` en exécute une. */
function banc(sur: Partial<EntreeVues> = {}) {
  const file: Array<() => void> = [];
  const appels: string[] = [];
  const morceau = (nom: string, echec = false) => () => { appels.push(nom); return echec ? Promise.reject(new Error('réseau')) : Promise.resolve(nom); };
  const entree: EntreeVues = {
    enLigne: () => true,
    reseauAMenager: () => false,
    auRepos: (f) => { file.push(f); return () => { const i = file.indexOf(f); if (i >= 0) file.splice(i, 1); }; },
    morceaux: [morceau('brassins'), morceau('stocks'), morceau('finances')],
    ...sur,
  };
  const repos = async () => { const f = file.shift(); f?.(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
  return { entree, file, appels, morceau, repos };
}

describe('préchargement des vues au repos', () => {
  it('ne charge rien avant le premier repos, puis un morceau par repos, dans l\'ordre', async () => {
    const b = banc();
    programmerPrechargementVues(b.entree);
    expect(b.appels).toEqual([]);
    await b.repos(); expect(b.appels).toEqual(['brassins']);
    await b.repos(); expect(b.appels).toEqual(['brassins', 'stocks']);
    await b.repos(); expect(b.appels).toEqual(['brassins', 'stocks', 'finances']);
    expect(b.file).toHaveLength(0);
  });
  it('économie de données ou connexion lente : aucun repos programmé, aucun chargement', () => {
    const b = banc({ reseauAMenager: () => true });
    programmerPrechargementVues(b.entree);
    expect(b.file).toHaveLength(0); expect(b.appels).toEqual([]);
  });
  it('hors ligne au repos : rien n\'est demandé', async () => {
    const b = banc({ enLigne: () => false });
    programmerPrechargementVues(b.entree);
    await b.repos(); expect(b.appels).toEqual([]);
  });
  it('un morceau qui échoue n\'arrête pas la suite', async () => {
    const b = banc();
    b.entree = { ...b.entree, morceaux: [b.morceau('brassins', true), b.morceau('stocks')] };
    programmerPrechargementVues(b.entree);
    await b.repos(); await b.repos();
    expect(b.appels).toEqual(['brassins', 'stocks']);
  });
  it('l\'annulation (déconnexion, démontage) retire le repos en attente et coupe la suite', async () => {
    const b = banc();
    const annuler = programmerPrechargementVues(b.entree);
    await b.repos(); expect(b.appels).toEqual(['brassins']);
    annuler();
    expect(b.file).toHaveLength(0);
    await b.repos(); expect(b.appels).toEqual(['brassins']);
  });
});
