ECHEC — 4e règle de la carte : le biais 1 crée 6 contradictions carte / liste (« Aucune voie houblon » avec 4 rangées) tant que l'écran compte le neutre dans `hors` ; le reste est tenu (tests, états, 3 biais)

Moteur : trois biais corrigés, réversibles (`debordementNeutre`, `selection`), tests 1061/1061, états 138/138. Le build à part, B5, la fumée, `check:hop-perf` et `f2-perf` sont rendus à l'exécutant (consigne du pilote).

## Les règles posées (écrites AVANT la mesure sur les autres styles : `general-*.json`, `phares/`)
Chacune se justifie par une donnée générale, pas par ses six.
1. **Débordement.** Une famille que le style ne cite pas (`status: neutre` dans `style-bands.json`, `from: []`, bande 0–30 posée par hypothèse [H], sans citation BJCP) n'est pas une faute de style. Son dépassement reste dit (`styleOverflow`) et reste compté plus loin dans le rang, par les effets de bord (`sideTotal`, déjà dans RANKING). Le rang ne lit que le dépassement d'une famille attendue (sous sa bande) ou indésirable. La dose d'un houblon lit le même débordement (champ `overflowStyle`) : sinon la dose qui évite le dépassement neutre l'emportait sur la distance (au whirlpool, El Dorado, Mosaic, Idaho 7, Calypso restaient à 0,104 de la visée contre 0,007 pour Citra).
2. **Présélection (borne de 80).** La présélection met d'abord la typicité du style (typé/courant, puis inconnu borné, puis rare, puis sans donnée), puis la documentation des fiches (l'ordre d'avant). Sans table : tous égaux, ordre d'avant, à l'octet près (test).
3. **Typicité inconnue.** Par la borne `p16` de Beer Analytics : style hors des 16 premiers du houblon et `p16` sous le seuil du courant (1 %, celui de f9) : « rare », connu par la borne. `p16` au-dessus : inconnu borné, entre courant et rare (jamais derrière un rare connu, jamais devant un courant). Aucune donnée : après le connu, comme avant.
Aucun seuil nouveau : le 1 % et les paliers sont ceux de f9 ; la valeur 1,5 est un ordre (entre 2 et 1), pas un poids.

## Ce que j'ai vu de ses six pendant l'écriture (honnêteté)
- Pour trouver la cause du biais 1 j'ai lu les voies d'El Dorado, Mosaic, Idaho 7, Calypso, Citra (`a4-diag.ts`) : la cause est la bande neutre du style, pas un réglage.
- J'ai imprimé le rang de ses six trois fois (`rapport-avant.json`, `rapport-apres1/2.json`, `rapport-apres.json`). Aucun seuil ni poids n'a été retouché à leur lecture.
- Deux choix ont changé en route, pour des raisons étrangères à ses six, mais le rang de ses six était dans la même sortie :
  - présélection : ma 1re version suivait la clé entière (radar compris) ; elle coupait Mosaic, Simcoe, Cascade en 21C (test D105 des phares) ; je suis revenu à « typicité d'abord, documentation ensuite » ;
  - typicité : ma 1re version plaçait TOUS les inconnus devant les rares ; en stout S1 elle faisait entrer X13459 et Sitiva Blend (sans aucune donnée) devant Pekko ; je l'ai limitée aux inconnus bornés.

## Fichiers écrits
- Moteur : `voies.ts` (options `debordementNeutre`, `selection`, champ `overflowStyle`, présélection), `typicite.ts` (rare par la borne), `typicite-acces.ts` (`PALIER_INCONNU_DANS_LA_CLE`, `palierDansLaCle`, origine `borne`), `departage.ts` (clé k3k1t, texte d'origine).
- Tests : `tests/unit/hopIndexV4/a4Biais.test.ts` (12, neuf) ; adaptés, raison « D125 » : `apportCDefaut`, `apportMinoritaire`, `f8Intensite` (ils rejouent leur mesure d'avant avec `debordementNeutre: true`), `f9Typicite` (pool entier pour « mêmes houblons » ; origine de l'inconnu), `prototypes/houblons-v4/tests/{client-async,worker-calculs}.test.ts` (proposer `3a04edf5a1af` → `d6e084ff0c95`, raison dans l'en-tête).
- Données : `prototypes/houblons-v4/data/pack-mini-protos.json` régénéré (`build-pack.ts` : « TROP GROS > 500 ko » existait déjà sur HEAD : 566 713 octets, fiches à part).
- États : `work/refonte-frontend/v4/choix/etats/acquis.json`, `etat-acquis-q2b-suite-s5` : `verif.attendu` « Pekko » → « Strisselspalt » ; `verif.choisie` inchangé ; note D125 ; capture ouverte `suggerer-s1-apres.png` (East Kent Goldings, First Gold, Motueka du stock, Strisselspalt, Huell Melon ; mêmes lignes, mêmes colonnes).
- Outils (`scripts/eval-hop/`) : `a4-rapport.ts`, `a4-diag.ts`, `a4-pool.ts`, `a4-typicite.ts`, `a4-cout.ts`, `a4-perf-options.ts`, `a4-general.ts`. Sorties : `rapport-*.json`, `general-*.json`, `f9-nonreg-*.txt`, `phares/`, `rouge-sur-head.txt`.

## Critères
- **Trois tests rouges sur HEAD** : `a4Biais.test.ts` copié sur une extraction de HEAD (2deafff1+7eb087e7) : 9 rouges, 3 verts (`rouge-sur-head.txt`) ; sur l'arbre : 12/12.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : **109 fichiers, 1061 tests verts** (après tous les changements, dernier tour).
- `npx tsc --noEmit` : sans sortie.
- États : `construire.mjs` : `CONSTRUIT OK (9 pages)` ; `controle-etats.mjs` : `ETATS OK (138/138)`, aussi avec `--choisie`. Un seul état dépendait de l'ordre des données (convention e3, note « D125 »).
- Coût (L20, deux arbres identiques sauf mes quatre fichiers, mesuré côte à côte) : `f2-perf` HEAD / après : froid 247 / 254, chaud 75,8 / 77,4, 16D 83,2 / 85, g2b 406 / 414 ms (bruit). `a4-cout` (catalogue plein, typicité posée) : chaud 42,2 / 42,7 ms. Une 1re version de la présélection (clé entière) coûtait +8 ms à chaud : remplacée. Les mesures dans l'arbre de travail (`f2-perf-apres.txt`, ~155 ms chaud) sont 2× plus lentes que dans l'extraction pour les deux versions (poste) : elles ne se comparent pas aux références de c8 (127 ms, prises sous charge) ; à rejouer par l'exécutant.

## Non-régressions (HEAD → après ; `f9-nonreg-*.txt`, `phares/`)
| contrôle | avant | après |
|---|---|---|
| Citra cryo premier, 16 listes (colonne défaut) | 2 | **2** (D121 : au plus 2) |
| Citra simple premier | 1 | 3 |
| East Kent Goldings premier du stout S1 | oui | **oui** (suivis de First Gold, Strisselspalt, Liberty ; avant Pekko, Barbe Rouge) |
| D105 (`affinageD102.test.ts`, phares non coupés avant le rang) | vert | vert |
| D106 (`coutD106.test.ts` ; palier 60′ f9-nonreg §4) | « même ordre : oui » | « même ordre : oui » |
| `f5-phares` (31 styles, `quickAdds`) | 18/31 dans les 10, 12/31 dans les 5, médiane 37,5 | identique |
| `f2-borne` | phares manquants : aucun, aucun, « mosaic, cascade » | identique (hors temps) |
| `f2-phares` 21C, défaut | 9 houblons | 8 houblons (sha différent : l'ordre change) |
| 21C, dry hop actif, typicité : Nelson / Mosaic | 12 / 8 | 20 / 14 |
| 21C, 10′ agrumes : premier | nectaron | citra |
| stout 16D 10′ : Citra / Mosaic | 66 / 59 | 26 / 22 |

## Généralisation sur des cas qu'il n'a jamais nommés (`a4-general.ts`)
31 styles de `pharesParStyle` × 2 demandes (plus d'agrumes, plus floral) × 2 moments = 124 cas. Phares de L14 écrits avant tout classement.
- Médiane des phares : mieux 65, pire 31, égal 28 ; médiane des médianes 17,5 → 5.
- Meilleur phare : mieux 45, pire 18, égal 61 ; un phare dans les 5 : 83 → 100 sur 124 ; dans les 10 : 100 → 103.
- Au 10′ : mieux 37, pire 5, aucun recul de plus de 20 places. Au dry hop actif : mieux 28, pire 26, **11 reculs de plus de 20 places**, dans 8 styles : 16B, 20B, 9C, 1A, 4A, 10A, 24A, 25A. Exemple : 25A (Belgian strong) et 9C, « plus d'agrumes » au dry hop : la tête passait de golding, mount-hood, phoenix, spalter-select à celeia, citra, centennial, amarillo ; médiane des phares 18 → 78. Cause : au dry hop, la pureté des nobles (aucun débordement) ne les place plus devant les houblons intenses. C'est la même cause que celle qui monte El Dorado (D191), et le même sens que D118. Je ne l'ai pas corrigé (ce serait un réglage) ; à juger.

## Carte « Plus agrumes — Aucune voie houblon » avec des rangées (vu sur une capture d'ia3)
- **Oui, c'est un défaut que mon code expose, pas un bug de mon code.** La carte (`verdict` dans `src/ui/hopIndex/suggerer/voies.ts`) ignore toute voie dont `hors` est non vide ; `hors` est construit à 4 endroits (lignes 140, 182, 207, 258) avec TOUT `styleOverflow`, neutre compris. Mon biais 1 laisse monter des voies qui n'ont que du dépassement neutre : la carte dit « Aucune » et le groupe montre 4 rangées.
- Mesure (`a4-general.ts`, les 124 listes montrées, défaut de l'écran) : listes où la carte dirait « Aucune » alors que des rangées ont un effet établi : HEAD 4 sur 62 (non neutre : inchangé), après **10 sur 62** ; avec le neutre exclu de `hors` : 4 sur 62 (comme HEAD). Les six nouveaux : 20B et 20A, 5B, 5D, 12C (agrumes et floral).
- Dire « hors du style » d'une famille neutre contredit aussi la règle 1 (le libellé « hors 16D : … » des rangées).
- **BESOIN IA3 :** dans `src/ui/hopIndex/suggerer/voies.ts`, `hors` = `v.styleOverflow.filter((o) => o.status !== 'neutre').map((o) => o.family)` aux 4 endroits. Non fait (hors de mon « Possède », ia3 y travaille). Tant que ce n'est pas fait, ne pas livrer le biais 1 seul, ou poser `DEBORDEMENT_NEUTRE_DEFAUT = true` (une constante, `voies.ts`).

## Jugement : ses six, lus une seule fois (neipa v3, 22A, liste principale, pool de 80) — un rapport, pas une porte
Rangs avant → après (`rapport-avant.json`, `rapport-apres.json` ; la présélection refactorée ensuite donne les mêmes rangs).
| demande · moment | El Dorado | Mosaic | Mandarina | Calypso | Pacific Jade | Idaho 7 |
|---|---|---|---|---|---|---|
| agrumes · dry hop actif | 74 → 15 | 10 → 13 | 18 → 23 | hors pool → 41 | 27 → 36 | 11 → 14 |
| agrumes · whirlpool | 45 → 15 | 43 → 13 | 11 → 23 | hors pool → 41 | 16 → 36 | 44 → 14 |
| tropicaux · dry hop actif | 71 → 7 | 7 → 11 | 20 → 26 | 73 → 28 | ne cite pas | 3 → 4 |
| tropicaux · whirlpool | 49 → 7 | 50 → 11 | 14 → 26 | 56 → 28 | ne cite pas | 47 → 4 |
- Gagnants : El Dorado (74 → 15 ; 71 → 7), Calypso (classé : 41 et 28), Idaho 7 au whirlpool. Perdants : Mandarina (11 ou 18 → 23 ou 26), Pacific Jade, Mosaic de 3 à 4 places.
- Au dry hop et au whirlpool, les listes deviennent identiques : tous les houblons ont la même distance, le rang est la clé de départage (famille citée, typicité, radar, fiches). La tête : Citra, Centennial, Amarillo, Simcoe, Nectaron (agrumes) ; Strata, Citra, Bru-1, Idaho 7, Nectaron (tropicaux).
- Mandarina est « courante » dans la table (palier 2 : 1,2 % des Hazy, concentration 18 %), pas inconnue : le biais 3 ne la concerne donc pas ; elle recule parce que les typés (palier 3) passent devant. Ce que la voie disait de son cas (« inconnue, bornée par p16 ») ne correspond pas à la table.
- Le biais 2 est réel (Calypso était hors du pool), mais sans effet sur le haut de liste : Calypso n'arrive qu'au 41e rang. Les données de Beer Analytics (1 % des Double IPA) ne le portent pas plus haut.

## DEMANDE EXECUTANT :
Dans l'ordre, depuis la racine, sur l'arbre courant (ia3 y écrit : relire `git status` avant) ; tout est mécanique.
1. `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-a4`
2. `node scripts/check-hop-budget.mjs --dist C:/Users/mrspa/AppData/Local/Temp/dist-a4 --chunk-outils profil-simule` ; attendu : B5 ≤ 164 ko (mesuré avant la dernière retouche : 147,5 ko ; B1 et B2 dépassés comme à HEAD).
3. `node work/missions/2026-10-25-integration-houblons/voies/w1-worker-app/fumee-worker-prod.mjs --dist=C:/Users/mrspa/AppData/Local/Temp/dist-a4` ; attendu : `WORKER PROD OK`.
4. `npm run check:hop-perf` ; attendu : `PERF-OUTILS ECHEC (6)`, les 6 mêmes dépassements que c8 (Dryhopper frise, Comparer 12 houblons, feuille 7 jours, Suggérer par adresse, tranche de préchauffage, le tout), aucun de plus ; mesuré avant la dernière retouche : 263 / 407 / 418 ms médianes, mêmes 6.
5. `npx vite-node scripts/eval-hop/f2-perf.ts` 3 fois, et la même chose dans une extraction de HEAD si le poste est chargé (la copie de travail est 2× plus lente que `%TEMP%`, pour HEAD comme pour après) ; seuil : après ≤ HEAD + 10 %.
6. Ouvrir une capture de l'écran Suggérer de l'app (neipa v3, plus d'agrumes) quand ia3 aura corrigé `hors` : la carte et le groupe ne se contredisent pas.

DÉCISION À PRENDRE :
1. Le biais 1 et la carte : (a) ia3 filtre le neutre dans `hors` (4 lignes) ; (b) on remet `DEBORDEMENT_NEUTRE_DEFAUT = true` en attendant. Recommandation : (a), puis relancer `a4-general.ts` (attendu : 4 sur 62 comme HEAD).
2. Les 11 reculs au dry hop dans 8 styles (nobles derrière les houblons intenses pour « plus d'agrumes »). Options : (a) les accepter (même sens que D118 et D191) ; (b) montrer au brasseur une paire de listes 25A ou 9C, avant et après (L24). Recommandation : (b), car c'est son goût.
3. La valeur de « Strisselspalt devant Pekko » en stout S1 (inconnu borné devant un rare connu) : c'est la lettre de sa demande (« un inconnu n'est pas une rareté »). Recommandation : la garder.

CONNAISSANCE : le débordement d'une famille neutre (bande 0–30 par hypothèse) était la cause de la place d'El Dorado, Mosaic, Idaho 7 et Calypso au whirlpool (distance 0,104 : la dose qui évitait le dépassement l'emportait sur la distance), pas seulement au dry hop. Une carte d'objectif qui exclut toute voie « hors style » doit lire le même statut que le rang, sinon elle se contredit.

LEÇON PROPOSÉE : quand une règle de rang change qui passe devant (ici le neutre), rejouer aussi ce que l'écran déduit de la liste (la carte « Aucune voie ») : un contrôle carte / liste sur 31 styles trouve en une minute ce qu'une capture trouve par hasard. Et : une consigne qui vise « l'overfit » se prouve par l'écriture des règles avant la mesure sur d'autres styles, ce que `a4-general.ts` permet (rôles : pilote, auteur).
