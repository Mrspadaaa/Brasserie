// Le worker des calculs de la maquette (#171) : la vraie table (calculs.ts) servie par la boucle du worker
// (src/ui/hopIndex/hopTools.worker.ts) à travers des messages clonés rend les mêmes empreintes que l'appel direct (banc ×1,
// fixtures, mêmes empreintes que client-async.test.ts) ; les résultats se clonent sans perte ; les données injectées
// passent au worker en données simples.
import { createHash } from 'node:crypto';
import './typicite-posee'; // D120 : la table de typicité (défaut de Suggérer) est là, comme dans l'app ; empreinte `proposer` ci-dessous
import { afterEach, describe, expect, it } from 'vitest';
import { creerClient, servirSurFilPrincipal } from '../../../src/domain/hopIndex/v4/client';
import { ecouter, type PorteeWorker } from '../../../src/ui/hopIndex/hopTools.worker';
import { servirParWorker, type WorkerOutils } from '../../../src/ui/hopIndex/hopToolsTransport';
import * as adapter from '../parcours/src/moteur';
import { CALCULS, type CalculsParcours } from '../parcours/src/moteur/calculs';
import { configurerDonnees, configurerDonneesClonables, donnees, donneesClonables, type DonneesClonables } from '../parcours/src/moteur/donnees';
import { recetteDegustee, H } from '../parcours/src/donnees/cas';

const empreinte = (x: unknown) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const recette = recetteDegustee();
const DIR = { floral: 1, resin: -1 } as const;
// remplacants : 81efdc544613 → d646d7130b2f au commit 883e1c9b (mots sans famille distincts) : voir client-async.test.ts.
// 26.10 (d4 et e2) : les quatre empreintes changent, raisons dans client-async.test.ts.
// D99 (26.10) : c par défaut au dry hop ; les quatre empreintes sont rejouées, inchangées (raison dans client-async.test.ts).
// remplacants 6561a4d6240b → 32e2ef725fec (t1, D160) : champs « autres » traduits, aucun score ni rang.
// proposer 3584e2c7dabd → 31d7feb6324c (g2c, D90, 26.10) : raison dans client-async.test.ts (exclusion par la moitié au moins des fiches).
// c6 (26.10, catalogue-complet) : suggerer 166a7dbd9516 → af7f2ecc1069 (Equinox est Ekuanot ; 26 variétés rattachées à des fiches de plus par la table d'alias).
// D118 (voie f8, 27.10) : suggerer af7f2ecc1069 → 45120c1bc857 (D190, cryo simulé) ; proposer 3b946ac8a4ff → 3c7fcd571305 (départage par intensité par défaut : champ departage dans chaque voie, ordre à distance égale par le radar ; voir client-async.test.ts).
// D102 (voie f2-affinage-a-b1-c-d, 26.10) : proposer → 3b946ac8a4ff (B1, D105, pool non coupé), remplacants → e6b71ac8e04d et substitutes → c6399d7b6596 (C, J1 : α 0,15 à 60′) ; raisons dans client-async.test.ts.
// D120 (t2, 27.10) : proposer 3c7fcd571305 → 3a04edf5a1af (la typicité du style est le défaut, table posée : raison dans client-async.test.ts).
// D125 (a4, 27.10) : proposer 3a04edf5a1af → d6e084ff0c95 (trois biais du classement : raison dans client-async.test.ts).
// D195 (s3, 27.10) : proposer d6e084ff0c95 → 89b74f788939. La demande prime sur la bande (chaque dépassement porte `voulu` et `minuscule`, le rang ne les compte plus) et les remplacements qui font baisser une famille à baisser gardent leur place (REMPLACEMENTS_RESERVES) : voir saturationD195.test.ts.
const EMPREINTES = { substitutes: '289ca4efaed4', suggerer: '45120c1bc857', proposer: '89b74f788939', remplacants: '5c602de7c804' };
const optionsNugget = () => ({ moment: 'b60' as const, grams: 46, recipe: recette as never, style: adapter.style(recette.styleCode), stockFirst: true, limit: 8 });

/** Le worker joué dans le même processus : messages clonés dans les deux sens, une tâche plus tard. */
function workerEnMemoire(): WorkerOutils {
  const portee: PorteeWorker = { onmessage: null, postMessage: (m) => { const c = structuredClone(m); setTimeout(() => w.onmessage?.({ data: c }), 0); } };
  ecouter(portee, CALCULS, { alimenter: (d) => configurerDonneesClonables(d as DonneesClonables) });
  const w = { onmessage: null, onerror: null, onmessageerror: null, terminate: () => {},
    postMessage: (m: unknown) => { const c = structuredClone(m); setTimeout(() => portee.onmessage?.({ data: c }), 0); } } as unknown as WorkerOutils;
  return w;
}
const client = () => creerClient(servirParWorker<CalculsParcours>({
  creer: workerEnMemoire, repli: servirSurFilPrincipal(CALCULS) as never, donnees: donneesClonables,
}), { cles: { substitutes: (cle, o) => JSON.stringify([cle, { ...o, style: o.style?.code ?? null }]) } });

afterEach(() => configurerDonnees());

describe('worker des calculs : mêmes résultats que l\'appel direct', () => {
  it('proposer, suggerer, remplacants, substitutes : les empreintes du banc ×1, à travers des messages clonés', async () => {
    const c = client();
    expect(empreinte((await c.calculs.proposer(recette, DIR)).voies)).toBe(EMPREINTES.proposer);
    expect(empreinte((await c.demander('suggerer', recette, 'floral')).map((x) => [x.cle, x.visee, x.besoin]))).toBe(EMPREINTES.suggerer);
    expect(empreinte(await c.demander('remplacants', recette, recette.additions[0].id))).toBe(EMPREINTES.remplacants);
    const sr = await c.demander('substitutes', H.nugget, optionsNugget());
    expect(empreinte(sr.remplacants.map((r) => [r.key, r.rank, r.score, r.dose, r.stock, r.raison, r.amertumeDeconseillee]))).toBe(EMPREINTES.substitutes);
  });

  it('chaque résultat de la table se clone sans perte (ni fonction, ni classe) : égal au résultat direct', () => {
    const direct = [
      CALCULS.proposer(recette, DIR), CALCULS.leviers(recette, DIR), CALCULS.suggerer(recette, 'floral'),
      CALCULS.remplacants(recette, recette.additions[0].id), CALCULS.substitutes(H.nugget, optionsNugget()),
    ];
    for (const r of direct) expect(structuredClone(r)).toStrictEqual(r);
  });
});

describe('worker des calculs : données injectées', () => {
  it('fixtures : rien à envoyer (le worker les a) ; k2 (sans dégustation) : la dégustation à null', () => {
    expect(donneesClonables()).toEqual({});
    configurerDonnees({ degustation: null });
    expect(donneesClonables()).toEqual({ degustation: null });
  });

  it('une dégustation passe en valeur, et le worker la rend en recette neuve à chaque appel', () => {
    const d = donnees().degustation!;
    configurerDonnees({ degustation: { tasting: d.tasting, recette: () => recetteDegustee() } });
    const c = structuredClone(donneesClonables()!);
    configurerDonnees();
    configurerDonneesClonables(c);
    const r1 = donnees().degustation!.recette(), r2 = donnees().degustation!.recette();
    expect(r1).toEqual(recetteDegustee());
    expect(r1).not.toBe(r2);
  });

  it('un α du lot calculé par une fonction propre : non clonable, pas de worker (null)', () => {
    configurerDonnees({ alphaDuLot: () => 7 });
    expect(donneesClonables()).toBeNull();
  });
});
