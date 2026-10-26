// Client asynchrone des calculs lourds (#165, D65 § Recommandation 2) : mêmes résultats que l'appel direct (empreintes
// du banc scripts/bench-hop-v4.ts à ×1, fixtures), une réponse périmée est ignorée, le contrat tient pour un worker.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  CALCULS_LOURDS, creerClient, servir, servirSurFilPrincipal, verifierCalculs,
  type Calculs, type ReponseCalcul, type RequeteCalcul, type ServeurCalculs,
} from '../../../src/domain/hopIndex/v4/client';
import * as adapter from '../parcours/src/moteur';
import { CALCULS, calcul } from '../parcours/src/moteur/client';
import { recetteDegustee, H } from '../parcours/src/donnees/cas';

const empreinte = (x: unknown) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const recette = recetteDegustee();
const DIR = { floral: 1, resin: -1 } as const;
const optionsNugget = () => ({ moment: 'b60' as const, grams: 46, recipe: recette as never, style: adapter.style(recette.styleCode), stockFirst: true, limit: 8 });
// Empreintes de RESULTAT.md de t5-causes (banc ×1, après la fabrique) : la même forme que le banc les calcule.
// remplacants : 81efdc544613 → d646d7130b2f au commit 883e1c9b (« autres n % » : mots sans famille distincts après traduction) ;
// seuls partSansFamille et motsSansFamille de deux houblons changent, aucun score ni rang (voie r180-pack, RESULTAT.md).
const EMPREINTES = { substitutes: '9ef77aa53ecc', suggerer: '85aab6303283', proposer: 'b42c299e6ebf', remplacants: 'd646d7130b2f' };
const forme = {
  substitutes: (sr: ReturnType<typeof CALCULS.substitutes>) => empreinte(sr.remplacants.map((r) => [r.key, r.rank, r.score, r.dose, r.stock, r.raison, r.amertumeDeconseillee])),
  suggerer: (c: ReturnType<typeof CALCULS.suggerer>) => empreinte(c.map((x) => [x.cle, x.visee, x.besoin])),
  proposer: (v: ReturnType<typeof CALCULS.proposer>) => empreinte(v.voies),
  remplacants: (r: ReturnType<typeof CALCULS.remplacants>) => empreinte(r),
};

describe('client asynchrone : mêmes résultats que l\'appel direct', () => {
  it('le banc ×1 : l\'appel direct de l\'adaptateur rend les empreintes de t5', () => {
    expect(forme.proposer(adapter.proposer(recette, DIR))).toBe(EMPREINTES.proposer);
    expect(forme.suggerer(adapter.suggerer(recette, 'floral'))).toBe(EMPREINTES.suggerer);
    expect(forme.remplacants(adapter.remplacants(recette, recette.additions[0].id))).toBe(EMPREINTES.remplacants);
  });

  for (const differer of [false, true]) {
    it(`serveur du fil principal${differer ? ' différé (comme un worker)' : ''} : mêmes empreintes par le client`, async () => {
      const c = differer ? creerClient(servirSurFilPrincipal(CALCULS, { differer: true })) : calcul();
      expect(c.immediat).toBe(!differer);
      expect(forme.proposer(await c.calculs.proposer(recette, DIR))).toBe(EMPREINTES.proposer);
      expect(forme.suggerer(await c.demander('suggerer', recette, 'floral'))).toBe(EMPREINTES.suggerer);
      expect(forme.remplacants(await c.demander('remplacants', recette, recette.additions[0].id))).toBe(EMPREINTES.remplacants);
      expect(forme.substitutes(await c.demander('substitutes', H.nugget, optionsNugget()))).toBe(EMPREINTES.substitutes);
    });
  }

  it('lire : tout de suite sur le fil principal ; d\'un serveur différé, seulement une réponse déjà reçue (préchauffée)', async () => {
    expect(forme.proposer(calcul().lire('proposer', recette, DIR)!)).toBe(EMPREINTES.proposer);
    const c = creerClient(servirSurFilPrincipal(CALCULS, { differer: true }));
    expect(c.lire('proposer', recette, DIR)).toBeUndefined();
    await c.prechauffer('proposer', recette, DIR);
    expect(forme.proposer(c.lire('proposer', recette, DIR)!)).toBe(EMPREINTES.proposer);
    c.vider();
    expect(c.lire('proposer', recette, DIR)).toBeUndefined();
  });
});

// Un serveur dont on rend les réponses à la main, dans l'ordre voulu (un worker peut répondre dans le désordre).
function serveurManuel<C extends Calculs>(calculs: C) {
  const enVol: { requete: RequeteCalcul<C>; rendre: (r: ReponseCalcul<C>) => void }[] = [];
  const serveur: ServeurCalculs<C> = { envoyer: (requete) => new Promise((rendre) => { enVol.push({ requete, rendre }); }) };
  const repondre = (i: number) => { const x = enVol[i]; x.rendre(servir(calculs, x.requete)); };
  return { serveur, enVol, repondre };
}

describe('client asynchrone : une réponse périmée est ignorée', () => {
  const T = { double: (x: number) => 2 * x, casse: (_x: number): number => { throw new Error('panne'); } };

  it('deux requêtes sur un canal, la plus ancienne répond APRÈS : seule la plus récente est rendue', async () => {
    const { serveur, enVol, repondre } = serveurManuel(T);
    const canal = creerClient(serveur).canal('double');
    const ancienne = canal.demander(1);
    const recente = canal.demander(2);
    expect(enVol.map((x) => x.requete.id)).toEqual([1, 2]); // un identifiant par requête
    repondre(1);
    expect(await recente).toEqual({ valeur: 4, args: [2] });
    repondre(0);
    expect(await ancienne).toBeUndefined();
  });

  it('dans l\'ordre aussi : la première, rendue périmée par la seconde, est ignorée', async () => {
    const { serveur, repondre } = serveurManuel(T);
    const canal = creerClient(serveur).canal('double');
    const a = canal.demander(1), b = canal.demander(3);
    repondre(0); repondre(1);
    expect(await a).toBeUndefined();
    expect(await b).toEqual({ valeur: 6, args: [3] });
  });

  it('canal fermé (écran démonté) : la réponse en vol est ignorée', async () => {
    const { serveur, repondre } = serveurManuel(T);
    const canal = creerClient(serveur).canal('double');
    const a = canal.demander(5);
    canal.fermer();
    repondre(0);
    expect(await a).toBeUndefined();
  });

  it('deux canaux sont indépendants (deux écrans)', async () => {
    const { serveur, repondre } = serveurManuel(T);
    const c = creerClient(serveur);
    const a = c.canal('double').demander(1), b = c.canal('double').demander(2);
    repondre(1); repondre(0);
    expect(await a).toEqual({ valeur: 2, args: [1] });
    expect(await b).toEqual({ valeur: 4, args: [2] });
  });

  it('une erreur du calcul traverse le contrat en message et rejette la requête la plus récente seulement', async () => {
    const { serveur, repondre } = serveurManuel(T);
    const canal = creerClient(serveur).canal('casse');
    const a = canal.demander(1), b = canal.demander(2);
    repondre(0); repondre(1);
    expect(await a).toBeUndefined();
    await expect(b).rejects.toThrow('panne');
    expect(servir(T, { id: 9, type: 'calcul', nom: 'casse', args: [1] })).toEqual({ id: 9, type: 'erreur', nom: 'casse', message: 'panne' });
  });
});

describe('contrat pour un worker (T7)', () => {
  it('la table de la maquette sert les quatre calculs lourds de D65', () => {
    expect(CALCULS_LOURDS).toEqual(['proposer', 'suggerer', 'remplacants', 'substitutes']);
    expect(verifierCalculs(CALCULS)).toEqual([]);
    expect(verifierCalculs({ proposer: () => 0 })).toEqual(['suggerer', 'remplacants', 'substitutes']);
  });

  it('requêtes et réponses sont des données simples : un aller-retour structuredClone (postMessage) les garde', () => {
    const requetes: RequeteCalcul<typeof CALCULS>[] = [
      { id: 1, type: 'calcul', nom: 'proposer', args: [recette, DIR] },
      { id: 2, type: 'calcul', nom: 'suggerer', args: [recette, 'floral'] },
      { id: 3, type: 'calcul', nom: 'remplacants', args: [recette, recette.additions[0].id] },
      { id: 4, type: 'prechauffer', nom: 'substitutes', args: [H.nugget, optionsNugget()] },
      { id: 5, type: 'calcul', nom: 'leviers', args: [recette, DIR] },
    ];
    for (const q of requetes) {
      const r = servir(CALCULS, structuredClone(q));
      expect(r.id).toBe(q.id);
      expect(r.type).toBe('resultat');
      expect(structuredClone(r)).toEqual(r);
    }
  });
});
