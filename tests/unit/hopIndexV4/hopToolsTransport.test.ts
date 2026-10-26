// Worker persistant des outils houblons v4 (#171) : le transport (côté page) et la boucle (côté worker), joués sans
// worker réel. Un faux worker relie les deux par des messages clonés (structuredClone) rendus dans une tâche suivante.
import { describe, expect, it, vi } from 'vitest';
import { creerClient, servirSurFilPrincipal, type Calculs } from '../../../src/domain/hopIndex/v4/client';
import { ecouter, type PorteeWorker } from '../../../src/ui/hopIndex/hopTools.worker';
import { servirParWorker, type WorkerOutils } from '../../../src/ui/hopIndex/hopToolsTransport';

const tache = () => new Promise((r) => setTimeout(r, 0));

/** Un faux worker : la portée du worker sert `calculs` par `ecouter` ; les messages passent clonés, une tâche plus tard. */
function fauxWorker<C extends Calculs>(calculs: C, o: { alimenter?: (d: unknown) => void; panneAuDemarrage?: boolean } = {}) {
  const recus: unknown[] = [];
  let termine = false;
  const portee: PorteeWorker = { onmessage: null, postMessage: (m) => { const c = structuredClone(m); setTimeout(() => { if (!termine) w.onmessage?.({ data: c }); }, 0); } };
  ecouter(portee, calculs, { alimenter: o.alimenter });
  const w: WorkerOutils = {
    onmessage: null, onerror: null, onmessageerror: null,
    postMessage: (m: unknown) => {
      const c = structuredClone(m);
      recus.push(c);
      setTimeout(() => {
        if (termine) return;
        if (o.panneAuDemarrage) { w.onerror?.({ message: 'script introuvable' }); return; }
        portee.onmessage?.({ data: c });
      }, 0);
    },
    terminate: () => { termine = true; },
  } as WorkerOutils;
  return { w, recus, estTermine: () => termine };
}

const T = {
  double: (x: number) => 2 * x,
  objet: (n: number) => ({ n, liste: [n, n + 1], carte: { a: n } }),
  casse: (_x: number): number => { throw new Error('panne'); },
};
const repliDe = <C extends Calculs>(c: C) => servirSurFilPrincipal(c) as ReturnType<typeof servirSurFilPrincipal<C>> & { servirTout: NonNullable<ReturnType<typeof servirSurFilPrincipal<C>>['servirTout']> };

describe('transport du worker : le worker sert le contrat', () => {
  it('une requête part au worker et revient au même identifiant ; les objets traversent clonés, égaux', async () => {
    const f = fauxWorker(T);
    const s = servirParWorker({ creer: () => f.w, repli: repliDe(T) });
    const c = creerClient(s);
    expect(s.etat).toBe('worker');
    expect(c.immediat).toBe(false);
    expect(await c.demander('double', 21)).toBe(42);
    expect(await c.calculs.objet(3)).toEqual(T.objet(3));
    expect(f.recus.map((m) => (m as { nom?: string }).nom)).toEqual(['double', 'objet']);
  });

  it('une erreur du calcul revient en message et rejette la demande, sans faire tomber le worker', async () => {
    const f = fauxWorker(T);
    const s = servirParWorker({ creer: () => f.w, repli: repliDe(T) });
    const c = creerClient(s);
    await expect(c.demander('casse', 1)).rejects.toThrow('panne');
    expect(s.etat).toBe('worker');
    expect(await c.demander('double', 1)).toBe(2);
  });

  it('une réponse périmée (le doigt a bougé) est ignorée par le canal', async () => {
    const f = fauxWorker(T);
    const canal = creerClient(servirParWorker({ creer: () => f.w, repli: repliDe(T) })).canal('double');
    const ancienne = canal.demander(1);
    const recente = canal.demander(2);
    expect(await ancienne).toBeUndefined();
    expect(await recente).toEqual({ valeur: 4, args: [2] });
  });
});

describe('transport du worker : alimenté une fois, puis à chaque changement de données', () => {
  it('les données partent avant toute requête, et une nouvelle alimentation précède les requêtes suivantes', async () => {
    let facteur = 0;
    const calculs = { fois: (x: number) => x * facteur };
    const f = fauxWorker(calculs, { alimenter: (d) => { facteur = (d as { facteur: number }).facteur; } });
    const s = servirParWorker({ creer: () => f.w, repli: repliDe(calculs), donnees: () => ({ facteur: 3 }) });
    const c = creerClient(s);
    expect(f.recus[0]).toEqual({ type: 'donnees', donnees: { facteur: 3 } });
    expect(await c.demander('fois', 2)).toBe(6);
    c.vider(); s.alimenter({ facteur: 5 });
    expect(await c.demander('fois', 2)).toBe(10);
  });

  it('des données non clonables (null) : pas de worker, tout sur le fil principal', async () => {
    const creer = vi.fn(() => fauxWorker(T).w);
    const s = servirParWorker({ creer, repli: repliDe(T), donnees: () => null });
    expect(s.etat).toBe('repli');
    expect(creer).not.toHaveBeenCalled();
    expect(await creerClient(s).demander('double', 4)).toBe(8);
  });

  it('une alimentation qui échoue dans le worker (panne) fait passer au repli', async () => {
    const f = fauxWorker(T, { alimenter: () => { throw new Error('données illisibles'); } });
    const surRepli = vi.fn();
    const s = servirParWorker({ creer: () => f.w, repli: repliDe(T), donnees: () => ({}), surRepli });
    const c = creerClient(s);
    const r = c.demander('double', 5);
    expect(await r).toBe(10);
    expect(s.etat).toBe('repli');
    expect(s.raison).toMatch(/données illisibles/);
    expect(surRepli).toHaveBeenCalledTimes(1);
  });
});

describe('transport du worker : repli sur le fil principal (option b)', () => {
  it('worker impossible à créer (page file://) : tout sur le fil principal, mêmes réponses', async () => {
    const s = servirParWorker({ creer: () => { throw new Error('file:// refusé'); }, repli: repliDe(T) });
    expect(s.etat).toBe('repli');
    expect(s.raison).toMatch(/file:\/\/ refusé/);
    expect(await creerClient(s).demander('double', 7)).toBe(14);
  });

  it('worker en erreur au démarrage : les requêtes en vol sont reservies sur le fil principal, une seule fois', async () => {
    const f = fauxWorker(T, { panneAuDemarrage: true });
    const repli = repliDe(T);
    const envoyer = vi.spyOn(repli, 'envoyer');
    const s = servirParWorker({ creer: () => f.w, repli });
    const c = creerClient(s);
    const [a, b] = [c.demander('double', 1), c.demander('double', 2)];
    expect(await a).toBe(2);
    expect(await b).toBe(4);
    expect(envoyer).toHaveBeenCalledTimes(2);
    expect(f.estTermine()).toBe(true);
    expect(s.etat).toBe('repli');
  });

  it('lire : une réponse préchauffée sans attendre ; sinon le repli synchrone (première ouverture) ; lireGarde, jamais', async () => {
    const f = fauxWorker(T);
    const c = creerClient(servirParWorker({ creer: () => f.w, repli: repliDe(T) }));
    await c.prechauffer('double', 10);
    const avant = f.recus.length;
    expect(c.lire('double', 10)).toBe(20); // gardée : rien ne part
    expect(c.lireGarde('double', 11)).toBeUndefined();
    expect(c.lire('double', 11)).toBe(22); // repli synchrone, sur le fil principal
    expect(f.recus.length).toBe(avant);
    expect(c.lireGarde('double', 11)).toBe(22); // gardée depuis
  });

  it('un toucher pendant un préchauffage en vol attend sa réponse au lieu d\'en refaire une', async () => {
    const f = fauxWorker(T);
    const c = creerClient(servirParWorker({ creer: () => f.w, repli: repliDe(T) }));
    const p = c.prechauffer('objet', 2);
    const v = c.demander('objet', 2);
    await p;
    expect(await v).toEqual(T.objet(2));
    expect(f.recus.filter((m) => (m as { nom?: string }).nom === 'objet')).toHaveLength(1);
  });

  it('vider pendant un calcul en vol : sa réponse (données d\'avant) n\'est pas gardée', async () => {
    const f = fauxWorker(T);
    const c = creerClient(servirParWorker({ creer: () => f.w, repli: repliDe(T) }));
    const p = c.prechauffer('double', 3);
    c.vider();
    await p; await tache();
    expect(c.lireGarde('double', 3)).toBeUndefined();
  });

  it('fermer : le worker est arrêté, la suite passe sur le fil principal', async () => {
    const f = fauxWorker(T);
    const s = servirParWorker({ creer: () => f.w, repli: repliDe(T) });
    s.fermer?.();
    expect(f.estTermine()).toBe(true);
    expect(await creerClient(s).demander('double', 6)).toBe(12);
  });
});
