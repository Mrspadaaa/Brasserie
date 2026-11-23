// Voie w1 (D115) : la préchauffe de Suggérer dans un worker, pour l'app. Joué sans worker réel (le vrai rendu est mesuré dans Chrome, work/missions/.../w1-worker-app) :
// un faux worker sert la VRAIE table de calculs (CALCULS) par la VRAIE boucle (`ecouter`), les messages passent clonés (structuredClone : les arguments et les résultats
// réels doivent traverser) et reviennent une tâche plus tard.
//  - le client posé n'est plus immédiat : la préchauffe part au worker, sa réponse est gardée et lue sans recalcul ;
//  - la liste s'affiche toujours : une première lecture sans réponse gardée est calculée sur le fil principal (repli synchrone) ;
//  - un changement des données vide les réponses gardées et renvoie les données (le catalogue seulement quand son tableau change) ;
//  - le repli reste entier : worker qui ne démarre pas, client déjà posé (la maquette), pas de worker possible (Node, jsdom).
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { s1Recipe } from '../../../prototypes/houblons-v4/src/pack/buildPack';
import { servir } from '../../../src/domain/hopIndex/v4/client';
import { ecouter, type PorteeWorker } from '../../../src/ui/hopIndex/hopTools.worker';
import type { WorkerOutils } from '../../../src/ui/hopIndex/hopToolsTransport';
import { CALCULS } from '../../../src/ui/hopIndex/parcours/calculs';
import { calcul, clientEstPose, poserClient, reinitialiserClient } from '../../../src/ui/hopIndex/parcours/calcul';
import { activerWorker, arreterWorker, workerPossible } from '../../../src/ui/hopIndex/parcours/clientWorker';
import { configurerDonnees, lancerTypicite } from '../../../src/ui/hopIndex/parcours/donnees';
import { preparerEnvoi, recevoirDonnees, type DonneesApp } from '../../../src/ui/hopIndex/parcours/donneesWorker';
import { mesures, viderMesures } from '../../../src/ui/hopIndex/parcours/mesure';
import type { RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';
import type { StockHop } from '../../../src/domain/hopIndex/v4';

const tache = () => new Promise((r) => setTimeout(r, 0));
const recette = (): RecetteParcours => s1Recipe() as unknown as RecetteParcours;
const DIRECTION = { floral: 1 };

/** Un faux worker qui sert la table de l'app. `donnees` reçoit les messages `donnees` (le moteur du worker réel n'est pas rejoué ici : il partage le module du test). */
function fauxWorker() {
  const recus: { type: string; nom?: string }[] = [];
  const donneesRecues: DonneesApp[] = [];
  let termine = false;
  const portee: PorteeWorker = { onmessage: null, postMessage: (m) => { const c = structuredClone(m); setTimeout(() => { if (!termine) w.onmessage?.({ data: c }); }, 0); } };
  ecouter(portee, CALCULS, { alimenter: (d) => { donneesRecues.push(d as DonneesApp); } });
  const w: WorkerOutils = {
    onmessage: null, onerror: null, onmessageerror: null,
    postMessage: (m: unknown) => {
      const c = structuredClone(m);
      recus.push(c as { type: string; nom?: string });
      setTimeout(() => { if (!termine) portee.onmessage?.({ data: c }); }, 0);
    },
    terminate: () => { termine = true; },
  } as WorkerOutils;
  return { w, recus, donneesRecues, estTermine: () => termine };
}

// D120 (t2) : `activerWorker` lance le chargement de la table de typicité (défaut de Suggérer) ; à son arrivée la configuration est rejouée et les caches vidés, ce qui ferait recalculer
// un test en cours. La table est donc là avant chaque test (son arrivée en cours de session est éprouvée dans t2Typicite.test.ts).
beforeAll(() => lancerTypicite());
afterEach(() => { arreterWorker(); reinitialiserClient(); configurerDonnees(); viderMesures(); vi.restoreAllMocks(); });

describe('client du worker de l\'app : la préchauffe part au worker', () => {
  it('Node : aucun worker possible, le fil principal reste le client (défaut des tests)', () => {
    expect(workerPossible()).toBe(false);
    expect(activerWorker()).toBeNull();
    expect(clientEstPose()).toBe(false);
    expect(calcul().immediat).toBe(true);
  });

  it('la préchauffe part au worker, sa réponse est gardée, et la lire ne recalcule pas sur le fil principal', async () => {
    const f = fauxWorker();
    const t = activerWorker({ creer: () => f.w });
    expect(t?.etat).toBe('worker');
    expect(clientEstPose()).toBe(true);
    expect(calcul().immediat).toBe(false);
    viderMesures();
    await calcul().prechauffer('proposerRapide', recette(), { ...DIRECTION });
    expect(f.recus.filter((m) => m.type === 'prechauffer').map((m) => m.nom)).toEqual(['proposerRapide']);
    // Le faux worker tourne dans ce même processus : son calcul est le seul journalisé (un calcul, celui du worker).
    expect(mesures().filter((m) => m.nom === 'proposerRapide' && !m.cache)).toHaveLength(1);
    const lu = calcul().lire('proposerRapide', recette(), { ...DIRECTION });
    expect(lu).toBeDefined();
    expect(mesures().filter((m) => m.nom === 'proposerRapide')).toHaveLength(1);     // lue dans les réponses gardées : aucun second calcul, nulle part
    expect(f.recus.filter((m) => m.type === 'calcul')).toEqual([]);                  // et aucune requête de plus au worker
  });

  it('la liste de Suggérer s\'affiche toujours : sans réponse gardée, la première lecture est calculée sur le fil principal', () => {
    const f = fauxWorker();
    activerWorker({ creer: () => f.w });
    const lu = calcul().lire('proposer', recette(), { ...DIRECTION });
    expect(lu).toBeDefined();
    expect((lu as { voies: unknown[] }).voies.length).toBeGreaterThan(0);
    // Même valeur que celle du moteur appelé directement (aucun état d'attente, rien d'inventé).
    const direct = servir(CALCULS, { id: 1, type: 'calcul', nom: 'proposer', args: [recette(), { ...DIRECTION }] });
    expect(direct.type).toBe('resultat');
    expect(JSON.stringify(lu)).toBe(JSON.stringify((direct as { valeur: unknown }).valeur));
  });

  it('un changement des données du brasseur vide les réponses gardées et renvoie les données au worker', async () => {
    const f = fauxWorker();
    activerWorker({ creer: () => f.w });
    await calcul().prechauffer('proposerRapide', recette(), { ...DIRECTION });
    const nAvant = f.recus.filter((m) => m.type === 'donnees').length;
    const stock: StockHop[] = [];
    configurerDonnees({ stock });
    await tache();
    expect(f.recus.filter((m) => m.type === 'donnees').length).toBe(nAvant + 1);
    // La réponse gardée est oubliée : lire(‘…’) repasse par le repli (fil principal), pas par l'ancienne réponse.
    viderMesures();
    calcul().lire('proposerRapide', recette(), { ...DIRECTION });
    expect(mesures().some((m) => m.nom === 'proposerRapide' && !m.cache)).toBe(true);
  });

  it('le worker qui ne démarre pas : repli sur le fil principal, la liste se calcule', () => {
    const surRepli = vi.fn();
    const t = activerWorker({ creer: () => { throw new Error('script introuvable'); }, surRepli });
    expect(t?.etat).toBe('repli');
    expect(surRepli).toHaveBeenCalledOnce();
    expect(calcul().lire('proposer', recette(), { ...DIRECTION })).toBeDefined();
  });

  it('une seule fois par session ; un client déjà posé (la maquette) n\'est pas remplacé', () => {
    const f = fauxWorker();
    const t = activerWorker({ creer: () => f.w });
    expect(activerWorker({ creer: () => fauxWorker().w })).toBe(t);
    arreterWorker(); reinitialiserClient();
    const posé = calcul();
    poserClient(posé, false);
    expect(activerWorker({ creer: () => fauxWorker().w })).toBeNull();
    expect(calcul()).toBe(posé);
  });
});

describe('données envoyées au worker : le catalogue une fois, puis « inchangé »', () => {
  const C1 = [{ id: 'a' }] as never[], C2 = [{ id: 'b' }] as never[];
  it('premier envoi complet ; mêmes tableaux : « inchangé » sans catalogue ni fiches ; autre tableau : complet ; non clonable : null', () => {
    let cat = C1, clonable: object | null = { catalogue: C1, fiches: C1, stock: [] };
    const envoi = preparerEnvoi(() => clonable as never, () => ({ catalogue: cat, fiches: cat }), () => null); // D120 : sans table de typicité (celle-ci : t2Typicite.test.ts)
    expect(envoi()).toEqual({ catalogue: C1, fiches: C1, stock: [] });
    expect(envoi()).toEqual({ stock: [], catalogueInchange: true });
    cat = C2; clonable = { catalogue: C2, fiches: C2, stock: [] };
    expect(envoi()).toEqual({ catalogue: C2, fiches: C2, stock: [] });
    clonable = null;
    expect(envoi()).toBeNull();
  });

  it('sans catalogue clonable (celui des fixtures), rien à marquer : le message est rendu tel quel', () => {
    const envoi = preparerEnvoi(() => ({ stock: [] }), () => ({ catalogue: C1, fiches: C1 }), () => null); // D120 : sans table de typicité
    expect(envoi()).toEqual({ stock: [] });
    expect(envoi()).toEqual({ stock: [] });
  });

  it('côté worker : « inchangé » reprend le catalogue du message précédent', () => {
    const reçus: unknown[] = [];
    const recevoir = recevoirDonnees((c) => { reçus.push(c); });
    recevoir({ catalogue: C1, fiches: C1, stock: [1] });
    recevoir({ stock: [2], catalogueInchange: true });
    recevoir({ catalogue: C2, fiches: C2, stock: [3] });
    recevoir({ stock: [4], catalogueInchange: true });
    expect(reçus).toEqual([
      { catalogue: C1, fiches: C1, stock: [1] },
      { stock: [2], catalogue: C1, fiches: C1 },
      { catalogue: C2, fiches: C2, stock: [3] },
      { stock: [4], catalogue: C2, fiches: C2 },
    ]);
  });
});
