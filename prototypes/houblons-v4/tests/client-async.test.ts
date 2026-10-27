// Client asynchrone des calculs lourds (#165, D65 § Recommandation 2) : mêmes résultats que l'appel direct (empreintes
// du banc scripts/bench-hop-v4.ts à ×1, fixtures), une réponse périmée est ignorée, le contrat tient pour un worker.
import { createHash } from 'node:crypto';
import './typicite-posee'; // D120 : la table de typicité (défaut de Suggérer) est là, comme dans l'app ; empreinte `proposer` ci-dessous
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
// 26.10, voies d4 (descripteurs de 12 sources) et e2 (moteur de substitution v2) : substitutes 9ef77aa53ecc → cac6de6d0c72 et remplacants d646d7130b2f →
// 6561a4d6240b (v2 sur les fiches de d4) ; suggerer 85aab6303283 → 166a7dbd9516 et proposer b42c299e6ebf → 3584e2c7dabd (les fiches de d4 changent
// les niveaux de famille que lisent ces deux calculs ; ils n'importent pas substitution.ts).
// remplacants 6561a4d6240b → 32e2ef725fec (t1, D160, 26.10) : seuls les champs « autres » changent, par la traduction des
// descripteurs des nouvelles sources ; aucun score ni rang (voies/t1-traduction/RESULTAT.md).
// proposer 3584e2c7dabd → 31d7feb6324c (g2c, D90, 26.10) : une famille « moins » n'exclut plus un houblon que si la moitié au moins de ses fiches la citent ;
// Citra cryo (résineux : 1 fiche sur 7) n'est plus en conflit sur la stout, et « Remplacer Nugget par Citra cryo » (24 g) prend la place de « Retirer Nugget » (voies/g2c-exclusion-style).
// Les trois autres empreintes ne bougent pas (stout 16D : aucune famille indésirable ; substitutes sans conflit de style).
// D99 (26.10, voie d99-apport-c-defaut) : l'option c de g2d est le défaut au dry hop (le débordement d'une famille non marquée ne compte plus dans le rang). Les quatre
// empreintes sont rejouées et NE BOUGENT PAS (mesuré : la liste retenue de ce cas, stout, floral +1 / résineux −1, garde les mêmes voies dans le même ordre) ; l'ordre de
// Suggérer au dry hop est contrôlé dans tests/unit/hopIndexV4/apportCDefaut.test.ts.
// c6 (26.10, catalogue-complet) : suggerer 166a7dbd9516 → af7f2ecc1069 (Equinox est Ekuanot ; 26 variétés rattachées à des fiches de plus par la table d'alias).
// D102 (voie f2-affinage-a-b1-c-d, 26.10), trois empreintes sur quatre : suggerer ne bouge pas.
//  - proposer 31d7feb6324c → 3b946ac8a4ff (B1, D105 : le pool « à acheter » n'est plus coupé à 6 avant le classement mais à 80, et l'ordre de qualité du pool (documentation d'abord)
//    départage avant les effets de bord : les 4 voies « à acheter » de S1 passent d'Aurum, East Kent Goldings, Boadicea, Celeia à East Kent Goldings, Hallertau Tradition, Huell Melon, Saphir. 14 rangées, 230 → 932 voies évaluées).
//  - D106 (voie f4, 3) : remplacants e6b71ac8e04d → 5c602de7c804 (à 60′, un houblon d'usage « arôme » de Beer Maverick recule avec sa raison écrite, comme Suggérer le lit) et substitutes c6399d7b6596 → 289ca4efaed4 ; proposer et suggerer ne bougent pas.
//  - remplacants 32e2ef725fec → e6b71ac8e04d et substitutes cac6de6d0c72 → c6399d7b6596 (C, J1 : à 60′ l'α passe de 0,4 à 0,15 dans l'amertume ; β 0,25, cohumulone 0,3, usage 0,3)).
// D118 (voie f8, 27.10) : suggerer af7f2ecc1069 → 45120c1bc857 (D190 : Citra cryo reprend la composition d'huile de Citra, donc son effet simulé sur la famille visée n'est plus 0 ; il se classe parmi les houblons du stock). proposer 3b946ac8a4ff → 3c7fcd571305. Le départage par intensité (k3k1) est le défaut : chaque voie porte sa clé (champ departage) et, à distance égale, les ajouts d'arôme se rangent par le radar Beer Maverick de la famille visée (S1, plus floral : Loral, Pekko, Barbe Rouge, Pacifica devant East Kent Goldings). substitutes, suggerer et remplacants ne bougent pas.
// D120 (voie t2-typicite-defaut, 27.10) : proposer 3c7fcd571305 → 3a04edf5a1af. La typicité du style (Beer Analytics) est le défaut : chaque voie porte son champ `typicite`, la clé de départage est k3k1t
// (typicité entre la famille citée et le radar), et les 4 achats de S1 (plus floral, moins résineux) passent de Loral, Pekko, Barbe Rouge, Pacifica à East Kent Goldings, First Gold, Pekko, Barbe Rouge
// (acquis D105 : Goldings devant Citra cryo). Table posée (typicite-posee.ts), comme dans l'app. Sans la table, l'ordre est celui de k3k1 (f9Typicite.test.ts). Les trois autres empreintes ne bougent pas.
// D125 (voie a4-algo-biais, 27.10) : proposer 3a04edf5a1af → d6e084ff0c95. Trois biais du classement : (1) le dépassement d'une famille neutre du style ne compte plus dans le rang (chaque voie porte `overflowStyle`, et
// `overflowRang` si le moment le veut) ; (2) la présélection du pool met la typicité du style avant la documentation ; (3) une typicité inconnue mais bornée par Beer Analytics (p16) prend la place 1,5 dans la clé,
// entre courant et rare, et un houblon dont la borne est sous 1 % est « rare » connu. S1 (plus floral, moins résineux) : les 4 achats passent de East Kent Goldings, First Gold, Pekko, Barbe Rouge à East Kent Goldings,
// First Gold, Strisselspalt, Liberty (Pekko et Barbe Rouge sont des rares connus en stout ; Strisselspalt et Liberty, bornés, passent devant). Les trois autres empreintes ne bougent pas.
const EMPREINTES = { substitutes: '289ca4efaed4', suggerer: '45120c1bc857', proposer: 'd6e084ff0c95', remplacants: '5c602de7c804' };
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
