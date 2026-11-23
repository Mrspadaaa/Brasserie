// Voie t2 (D120) : la typicité du style est le défaut de Suggérer. Sa table (Beer Analytics) arrive à part : ces tests éprouvent le câblage, pas le classement (f9Typicite.test.ts).
//  - le chargement part avec `activerWorker` (montage de l'étape), une fois ; un échec (hors ligne sans le morceau) est silencieux et le prochain appel réessaie ;
//  - à l'arrivée de la table : la configuration est rejouée, les réponses gardées sont vidées, le worker reçoit la table UNE fois dans le message `donnees` suivant ;
//  - côté worker : la table est posée AVANT la configuration (qui vide les caches), donc avant toute requête qui la lit.
// Joué sans worker réel (le vrai rendu : fumee-worker-prod.mjs et la maquette dans Chrome) : un faux worker sert la VRAIE table de calculs par la VRAIE boucle.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { s1Recipe } from '../../../prototypes/houblons-v4/src/pack/buildPack';
import { ecouter, type PorteeWorker } from '../../../src/ui/hopIndex/hopTools.worker';
import type { WorkerOutils } from '../../../src/ui/hopIndex/hopToolsTransport';
import { CALCULS } from '../../../src/ui/hopIndex/parcours/calculs';
import { calcul, reinitialiserClient } from '../../../src/ui/hopIndex/parcours/calcul';
import { activerWorker, arreterWorker } from '../../../src/ui/hopIndex/parcours/clientWorker';
import { configurerDonnees, lancerTypicite } from '../../../src/ui/hopIndex/parcours/donnees';
import { preparerEnvoi, recevoirDonnees, type DonneesApp } from '../../../src/ui/hopIndex/parcours/donneesWorker';
import { mesures, viderMesures } from '../../../src/ui/hopIndex/parcours/mesure';
import type { RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';
import { tableTypicitePosee, type TableTypicite } from '../../../src/domain/hopIndex/v4/typicite-acces';

// Le chargement de la table est piloté : en échec, puis tenu fermé, puis ouvert (la vraie table arrive alors).
const pilote = vi.hoisted(() => {
  const etat = { appels: 0, echec: false, ouvrir: () => {}, porte: Promise.resolve() };
  etat.porte = new Promise<void>((r) => { etat.ouvrir = r; });
  return etat;
});
vi.mock('../../../src/domain/hopIndex/v4/typicite-acces', async (original) => {
  const reel = await original<typeof import('../../../src/domain/hopIndex/v4/typicite-acces')>();
  return { ...reel, chargerTypicite: () => { pilote.appels++; return pilote.echec ? Promise.reject(new Error('hors ligne')) : pilote.porte.then(() => reel.chargerTypicite()); } };
});

const tache = () => new Promise((r) => setTimeout(r, 0));
const recette = (): RecetteParcours => s1Recipe() as unknown as RecetteParcours;
const DIRECTION = { floral: 1 };

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
  return { w, recus, donneesRecues };
}

afterEach(() => { arreterWorker(); reinitialiserClient(); configurerDonnees(); viderMesures(); });

describe('le chargement de la table de typicité', () => {
  it('hors ligne (le morceau manque) : silencieux, la typicité reste inconnue, et le prochain appel réessaie', async () => {
    pilote.echec = true;
    const avant = pilote.appels;
    await expect(lancerTypicite()).resolves.toBeUndefined();
    expect(tableTypicitePosee()).toBeNull();
    await lancerTypicite();
    expect(pilote.appels).toBe(avant + 2); // un échec n'est pas mémorisé
    pilote.echec = false;
  });

  it('part avec activerWorker, une seule fois ; à l\'arrivée : configuration rejouée, réponses gardées vidées, table envoyée au worker une fois', async () => {
    const f = fauxWorker();
    const avant = pilote.appels;
    activerWorker({ creer: () => f.w });
    activerWorker({ creer: () => f.w });
    expect(pilote.appels).toBe(avant + 1);            // le chargement part au montage de l'étape, une fois
    expect(tableTypicitePosee()).toBeNull();
    await calcul().prechauffer('proposerRapide', recette(), { ...DIRECTION });
    expect(calcul().lire('proposerRapide', recette(), { ...DIRECTION })).toBeDefined(); // une réponse gardée, calculée sans la table
    const nAvant = f.donneesRecues.length;
    expect(f.donneesRecues.every((d) => d.typicite === undefined)).toBe(true);

    pilote.ouvrir();
    await lancerTypicite();                            // la table est là (code posé sur le fil principal)
    await tache();
    expect(tableTypicitePosee()?.source.nom).toBe('Beer Analytics');
    // le worker reçoit un message de plus, qui porte la table ; les suivants ne la portent plus
    expect(f.donneesRecues.length).toBe(nAvant + 1);
    expect((f.donneesRecues[nAvant].typicite as TableTypicite).source.nom).toBe('Beer Analytics');
    configurerDonnees({ stock: [] });
    await tache();
    expect(f.donneesRecues.length).toBe(nAvant + 2);
    expect(f.donneesRecues[nAvant + 1].typicite).toBeUndefined();
    // la réponse gardée d'avant la table est oubliée : la liste est recalculée avec elle, avant l'affichage
    viderMesures();
    calcul().lire('proposerRapide', recette(), { ...DIRECTION });
    expect(mesures().some((m) => m.nom === 'proposerRapide' && !m.cache)).toBe(true);
    // rien ne recharge ensuite
    const appels = pilote.appels;
    await lancerTypicite();
    expect(pilote.appels).toBe(appels);
  });
});

describe('la table dans le message `donnees`', () => {
  const T = { source: { nom: 'x' } } as unknown as TableTypicite, T2 = { source: { nom: 'y' } } as unknown as TableTypicite;
  const C = [{ id: 'a' }] as never[];
  it('envoyée une fois, avec le catalogue ou sans ; renvoyée seulement si la table change', () => {
    let table: TableTypicite | null = null;
    const envoi = preparerEnvoi(() => ({ catalogue: C, fiches: C, stock: [] }), () => ({ catalogue: C, fiches: C }), () => table);
    expect(envoi()).toEqual({ catalogue: C, fiches: C, stock: [] });                                    // pas de table : pas de clé
    table = T;
    expect(envoi()).toEqual({ stock: [], catalogueInchange: true, typicite: T });                       // première fois
    expect(envoi()).toEqual({ stock: [], catalogueInchange: true });                                    // gardée par le worker
    table = T2;
    expect(envoi()).toEqual({ stock: [], catalogueInchange: true, typicite: T2 });
  });

  it('côté worker : la table est posée AVANT la configuration (qui vide les caches), et n\'entre pas dans les données configurées', () => {
    const ordre: string[] = [];
    const reçus: unknown[] = [];
    const recevoir = recevoirDonnees((c) => { ordre.push('configurer'); reçus.push(c); }, (t) => { ordre.push(`poser ${(t.source as { nom: string }).nom}`); });
    recevoir({ stock: [1], typicite: T });
    recevoir({ stock: [2] });
    expect(ordre).toEqual(['poser x', 'configurer', 'configurer']);
    expect(reçus).toEqual([{ stock: [1] }, { stock: [2] }]);
  });
});
