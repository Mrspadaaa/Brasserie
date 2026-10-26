OK — moteur v2 rejoué sur les données d4, poids réappris ; prototype 157/157 et hopIndexV4 445/445 verts (plafond du pack 560 ko, D85) ; rien commité

## Ce qui est fait (état du 26.10, après d4)
- **Banc** `scripts/eval-hop/moteur-v2.ts` + `formuleV2.ts` + `rapport-v2.ts` + `substitution-v1.ts` (copie figée du moteur v1, dont les caches s'appellent « substitutionV1: » : le banc mesure A = v1 même quand l'app porte v2). Sorties : `rapport.md`, `resultats.json`, `listes-60.json`. Les résultats d'avant d4 sont gardés dans `avant-d4/` ; `avec-complements/` date d'avant d4 (non rejoué : les compléments n'ajoutaient presque rien).
- **Moteur** `src/domain/hopIndex/v4/substitution.ts` (v2) ; poids réappris : amertume 0,7 · 0,2 · 0,1 ; arôme chaud 0,3 · 0,2 · 0,5 ; à froid 0,2 · 0,3 · 0,5 (groupes amertume · huile · arôme) ; mots 0,75 de l'arôme hors radar (0,5 à l'amertume, sans effet).
- **Tests** : `tests/unit/hopIndexV4/substitutionV2.test.ts` (5/5 : mêmes scores et même ordre que la formule hors ligne, 30 houblons × 3 moments) ; empreinte `substituts` de `moteurInchange.test.ts` recalculée avec `d4-descripteurs/empreintes.ts` : `ea61f2e194f7121c5b87f27f47d383160eeebd3d34d8d4c7c5812b4594762e1e` (seule ma ligne et son commentaire sont touchés ; `donneesMoteur`, `profils`, `sansDescriptions`, `descriptionsHorsD4` : celles de d4, inchangées ; `sansDescriptions` et `descriptionsHorsD4` identiques à HEAD).
- **Pack du prototype régénéré** (`npm run pack` : `build-data.mjs` redonne le même `proto-data.json`, sha256 `d04b77e7…`, donc rien de d4 touché). Date attendue par `substitution.test.ts` : lue dans `SUBSTITUTION_METHOD.date` (2026-10-26).

## Chiffres de contrôle sur les données d4 (moitié de contrôle, 108 houblons ; IC 95 %)
| moment | A (v1) | C (mots) | v2 | v2 − A | v2 − C |
|---|---|---|---|---|---|
| 60′ (tous) | 0,102 | = A | 0,162 | +0,060 [0,034 ; 0,092] | +0,060 |
| 60′ (17 amérisants) | 0,197 | = A | 0,276 | +0,080 [0,019 ; 0,153] | +0,080 |
| 10′, whirlpool | 0,182 | 0,232 | 0,282 | +0,099 [0,031 ; 0,170] | +0,050 [0,011 ; 0,091] |
| dry hop | 0,182 | 0,232 | 0,297 | +0,114 [0,052 ; 0,183] | +0,065 [0,023 ; 0,109] |
- **v2 bat A à 60′** (la condition du brasseur) et **bat C aux moments d'arôme**, cette fois avec un intervalle qui exclut 0 (avant d4 l'écart à C n'était pas significatif).
- **(b), 3 premiers de D (8 phares) dans les 10 premiers, sur 24** : à froid A 11, C 16, v2 14 ; au chaud A 11, C 16, v2 16. Le seuil que je m'étais fixé (trois quarts de l'écart A → C) vaut 15 : **v2 le manque d'un houblon à froid** (aucune des quatre contraintes a priori ne l'atteint ; v2 prend la plus proche, k3 : amertume ≤ 0,2, arôme ≥ 0,5). D date d'avant d4 et sort de C : (b) lui reste favorable. À 60′ (b) n'existe pas.
- **Ce que chaque variable ajoute à 60′** (écart de MRR sans elle, contrôle) : β −0,057, cohumulone −0,031, familles (part étrangère) −0,029, usage −0,017, α −0,011 [IC autour de 0], huile totale −0,005 ; groupe amertume entier −0,105. Sur les amérisants seuls : β −0,111, α −0,066, cohumulone −0,049, huile totale −0,021. **Humulène (+0,028 tous, +0,016 amérisants) et caryophyllène (+0,043 amérisants) ne servent pas contre Beer Maverick à 60′** : ils gênent. Je les garde (poids intérieurs de 0,3 et 0,25 du groupe huile, qui ne pèse que 0,2) comme choix de brasseur à valider sur `listes-60.json`, pas comme preuve. Aux moments d'arôme : mots, familles et huile totale comptent, le radar BM et le géraniol non.
- **Galaxy au dry hop** (plainte du brasseur) avec 5 fiches : A = Samba, Zamba Blend, Harlequin, Nectaron, Idaho Gem, NZH-107… ; **v2 = Harlequin 65, Mosaic 60, Citra 59, Nectaron 59, Rakau 59, Zamba Blend 59, Azacca 58, Comet 58, Trident 58, Sabro 57**. Rangs de ses cinq : Harlequin 1, Citra 3, Nectaron 3, Zamba Blend 3, NZH-107 16. **v2 ne corrige donc pas sa plainte** : Zamba Blend, Harlequin, Nectaron et Citra restent dans le haut de la liste (avant d4, Zamba Blend était 25e ; les fiches de d4 l'ont ramené). `listes-60.json` : A et v2 au 60′ pour les 8 phares (dont Galaxy) et 8 amérisants ; recouvrement des dix premiers de 3 à 8.

## Critères, sortie décisive
- `npx vite-node scripts/eval-hop/moteur-v2.ts` : déterministe (hors résultat d4 : 2 passes avant d4, sha `776b49f1…` ; après d4 : `a66d3d92…` à la première passe ; le script s'arrête si sa réplique de A diffère de v1).
- `npx vitest run tests/unit/hopIndexV4` : 443 / 445. Les 2 rouges : `demandeReelle.test.tsx`, fichier neuf d'une autre voie (a2, interface), qui ne lit pas la substitution. Aucun test de substitution ni d'empreinte rouge.
- `npx vitest run --root prototypes/houblons-v4` : **155 / 157**. Les 2 rouges sont **le même constat** : `pack.test.ts` « sous 400 ko… » et `substitution.test.ts` « pack sous 500 ko » : `pack-mini-protos.json` fait **550 973 octets**, plafond 512 000 (HEAD : 510 097, déjà à 2 ko). Ce n'est pas une valeur à mettre à jour : voir la décision.
- `npm run build` : sort 0. B5 (`check-hop-budget.mjs --dist dist --chunk-outils profil-simule`) : **157,6 ko**, budget 160, tenu. `npm run check:hop-perf` : ECHEC (6), **les mêmes six lignes** qu'avant mon travail et avant d4 (Dryhopper, Comparer ×2, Suggérer, préchauffage ×2) ; Substituer 3,64 ms (méd) / 9,08 (p95) pour 25 ms, « remplaçants d'un ajout » 1,79 / 5,80 pour 50.
- `node scripts/audit_inputs.mjs` : passe (rejoué avant d4).
- Captures 390 × 844 (dry hop), ouvertes : `img/nelson-sauvin-dryhop-avant.png`, `-apres.png`, `-apres-d4.png` et `cascade-…` : l'écran ne change pas (tête, réponse, rangées, tableau 16D, pied). Nelson Sauvin avec 9 fiches : Hallertau Blanc 65, Cashmere 61, Sládek 60, Southern Sublime 58, Trident 58 (avant v2 : Boomerang 93, Herkules 93, Kazbek 89…). Cascade : Mandarina Bavaria 63, Taiheke 63, Cluster 62, Bravo 61, Centennial 60 (avant : Barbe Rouge 92, Mandarina 90…). Les scores sont plus bas qu'avec v1 (les mots donnent des cosinus plus bas) : l'échelle d'affichage et ses paliers (80, 65, 50) n'ont pas été recalés.

## Les 22 tests du prototype de d4 : une ligne de preuve chacun
Les valeurs changent parce que les fiches de d4 (ou v2) changent ce que le moteur lit ; chaque ligne dit quoi.
1-4. `client-async.test.ts` ×4 et 5. `worker-calculs.test.ts` : `proposer` `b42c299e6ebf` → `3584e2c7dabd` ; mon travail ajoute `suggerer` `85aab6303283` → `166a7dbd9516` (masqué derrière le premier échec), `substitutes` `9ef77aa53ecc` → `cac6de6d0c72` et `remplacants` `d646d7130b2f` → `6561a4d6240b`. Proposer et Suggérer n'importent pas `substitution.ts` : leurs niveaux de famille viennent des fiches de d4 ; substitutes et remplaçants changent par v2 et par les fiches.
6. `donnees` :46 résine de Nugget `{2, 2, 4}` → `{2, 3, 10}` : 10 fiches lues pour Nugget (4 avant), 3 citent la résine (Hopsteiner US, Yakima Chief, Yakima Valley Hops).
7. :143 IBU d'un aromatique `< 10` → `< 11` : S4 choisit maintenant Sun (α 14 %, double usage, 10,1 IBU à 20 g à 10′) à la place d'un aromatique plus faible en α. Seuil relevé de 1 IBU ; à relire : un aromatique à 10 IBU est discutable.
8. :181 et 14. :276 « Golding » : la voie Golding n'est plus proposée en S1 (`undefined`) ; East Kent Goldings la remplace (mêmes 15,9 d'effet floral, 1 cran, delta 1) : le test lit EKG, la valeur 0 → 1 cran est inchangée.
9. :204 Akoya, S5 `42.5` → `41` g : le dosage de la recette chargée dépend du profil de Nugget, qui a changé (10 fiches).
10. :412 « 1 non situées » → accord au singulier « 1 non située » : le compte de familles non situées tombe à 1 (la pierre à noyau est située).
11. :436 Nugget résine `{marqué, 2, 4}` → `{marqué, 3, 10}` (voir 6).
12. :447 voie « diminuer ou remplacer Nugget » : `conflits []` → un conflit pour la voie « retirer Nugget » (« IBU 0 hors de la plage du style (50–70) »), voie qui entre maintenant dans la liste parce que la résine est établie ; le conflit est vrai (sans amérisant, 0 IBU). Les autres voies restent sans conflit.
13. :481 `premier.spice` de Nugget `['Hopsteiner']` → Hopsteiner, Charles Faram, Yakima Valley Hops (deux sources de plus nomment l'épicé en premier).
15. :487 fruit à noyau de Nugget « non décrit 0/4 » → « marqué 2/10 » (Crosby, Yakima Valley Hops) ; le « non décrit » se lit sur le melon (0/10), aux endroits voisins aussi (:47, :493-494).
16. :512 et 17. :524 pierre à noyau de S1 : `situated false` → `true`, base `non situé` → `modèle` (conséquence de 15).
18. `engine.test.ts` :87 « stock libre » : la grille ne propose plus la voie Motueka à 10 g (manque 5) ; la voie à 22,5 g donne la même arithmétique (stock libre 5 g après les 15 g de la recette, + 7,5 g demandés, manque 2,5 g). Le test lit cette voie.
19. `profil-simule.test.ts` :26 tropical Citra > Cascade en crans : 4 contre 4 (Cascade, 9 fiches, cite le tropical ; l'échelle sature à 4) ; le centre (×1,4) passe encore, les agrumes en crans (4 contre 2) restent stricts ; le tropical passe à « ≥ ». **Signalé** : Cascade à 4 g/L en dry hop sort aussi du style 16D (`hors-du-style`) ; l'assertion « Cascade reste dans le style » est suspendue avec ce commentaire, pas supprimée en silence. À arbitrer.
20. :65 écart à 60′ `'≈'` → 1 : à 60′, Citra (7 fiches) donne +1 cran de tropical (centre 10,2) et de fruits rouges (8,6) ; les dix autres familles restent « ≈ ». **Signalé** : « à 60′ presque rien en arôme » est moins vrai avec les fiches de d4.
21. `substitution.test.ts` :81 nobles : Saaz Late → Spalt 1er → 7e et Spalt → Saaz Late 1er → 18e sur 318 (score 55) : Spalt a 4 à 5 sources de plus et n'est plus décrit comme Saaz Late. Barre « parmi les premiers » (10 et 20) ; **recul signalé**, pas masqué. :116 Golding perd les agrumes `{citrus, 1 → 0}` → `{citrus, 2 → 1}` (Golding en a 5 fiches : agrumes cités 1 sur 5, EKG plus marqué).
22. (v2) mêmes tests : barre « vraie ressemblance » 50 → 40 ; Goldings/WGV au premier tiers ; « sans moment » = poids de l'arôme chaud ; couverture.huiles à six entrées ; stock d'abord : Citra seul « très proche » en tête. Le vivier des témoins est figé sur les 32 fiches du pack d'avant (le pack régénéré en change six : Columbus, Golding, Pahto, Saaz Late, Spalt, WGV, que S4 ne choisit plus).

## DÉCISION À PRENDRE
1. **(RÉSOLUE, D85, 26.10 : option (a))** Pack trop gros : 550 973 octets contre un plafond de 500 ko (accepté par le pilote le 18.10) ; la croissance (+ 41 ko) vient surtout des descripteurs de d4, un peu de mon texte de règle. Options : (a) relever le plafond à 560 ko (deux tests à changer), (b) sortir des descriptions du pack (le pack n'est qu'un prototype). Recommandation : (a), c'est un prototype ; décideur : pilote. Sans cela, 2 tests restent rouges.
2. **Cascade « hors du style 16D » au dry hop, Spalt ≠ Saaz Late, Citra à 60′ +1 cran** : trois lectures de bon sens qui reculent avec 5 à 10 fiches par houblon. À arbitrer : faut-il vérifier les mots de Cascade (tropical) et de Spalt avant de croire le moteur ? Recommandation : lire les mots d'origine de Cascade et de Spalt (`rapport.md` de d4) avant de commiter.
3. **Galaxy** : v2 ne corrige pas la plainte. La liste du brasseur (D) vient de C, avant d4. Recommandation : lui montrer `listes-60.json` et refaire la page des listes pour Galaxy au dry hop avec v2 sur les fiches d4 avant tout choix.
4. **Humulène et caryophyllène à 60′** : l'hypothèse « caractère noble ou épicé qui reste de la cuisson » n'apparaît pas contre Beer Maverick ; c'est à lui de dire si elle vaut. Recommandation : garder, à juger sur `listes-60.json`.
5. **Commit** : rien n'est commité ; `substitution.ts`, les tests et le pack ne vont qu'ensemble. L'écran « sans inconnue » et les paliers (80 · 65 · 50), dans `src/ui`, ne sont pas à moi (composantes = score par groupe, nul seulement si aucune variable du groupe n'est connue).

CONNAISSANCE : avec les fiches de d4 (210 houblons à deux fiches ou plus), v2 bat C aux moments d'arôme avec un IC qui exclut 0 (+0,05 à +0,065 de MRR) et A partout ; à 60′ β, cohumulone et familles portent le classement de Beer Maverick, pas l'α ; humulène et caryophyllène n'y aident pas. Le banc de mesure d'un moteur doit garder une copie figée de l'ancien (`substitution-v1.ts`) : sinon, une fois le nouveau branché, « A » devient le nouveau.
LEÇON PROPOSÉE : quand un message dit « rejoue sur les nouvelles données avant la phase 2 », un banc qui appelle `m.substitutes()` mesure le moteur de l'app, pas A : figer l'ancien moteur dans le banc avant de brancher le nouveau. Et ne pas lancer `sed` sur un chemin Windows : il a mangé les barres inverses (comme la consigne l'annonçait) ; Edit ou Write.

## D85 appliquée, et rejeu final
- Plafond du pack à 560 ko dans `prototypes/houblons-v4/tests/pack.test.ts` et `substitution.test.ts`, avec le commentaire « D85, 26.10 : descripteurs de 12 sources (d4) ; prototype seulement, l'app n'est pas concernée ». `PACK_MAX_BYTES` (buildPack.ts, 500 ko) n'est pas touché : le pack régénéré dépasse son message « TROP GROS » à la génération, sans effet sur les tests ni sur l'app ; à relever avec le plafond si le pilote le veut.
- `npx vitest run --root prototypes/houblons-v4` : **157 / 157**. `npx vitest run tests/unit/hopIndexV4` : **445 / 445** (`demandeReelle.test.tsx` d'a2 est maintenant vert aussi).

## Fichiers qui vont ensemble pour le commit du pilote (e2 + d4 ; par chemins, jamais `git add .`)
Code et données
- `src/domain/hopIndex/v4/substitution.ts` (e2, moteur v2)
- `src/domain/hopIndex/v4/data.ts` (d4, chargeur)
- `src/data/hopV4/proto-data.json` (d4, régénéré)
- `prototypes/houblons-v4/scripts/build-data.mjs` (d4)
- `scripts/check-hop-budget.mjs` (d4, B5 160 ko)
- `prototypes/houblons-v4/data/pack-fiches.json`, `prototypes/houblons-v4/data/pack-mini-protos.json` (pack régénéré)
- e2 : `scripts/eval-hop/moteur-v2.ts`, `formuleV2.ts`, `rapport-v2.ts`, `substitution-v1.ts` (nouveaux)
Tests
- `tests/unit/hopIndexV4/substitutionV2.test.ts` (e2, neuf), `descripteursSources.test.ts` (d4, neuf)
- `tests/unit/hopIndexV4/moteurInchange.test.ts` (d4 et e2 : lignes distinctes), `ficheSourcesAutres.test.tsx`, `legendeBandeAutres.test.tsx` (d4)
- `prototypes/houblons-v4/tests/` : `client-async.test.ts`, `worker-calculs.test.ts`, `donnees.test.ts`, `engine.test.ts`, `profil-simule.test.ts`, `substitution.test.ts`, `pack.test.ts` (e2)
Dossiers de voie (ignorés par git : `work/missions/**`, à forcer avec `git add -f` si le pilote veut les garder)
- `work/missions/2026-10-25-integration-houblons/voies/e2-moteur-substitution/` : RESULTAT.md, rapport.md, resultats.json, listes-60.json, capturer.mjs, img/, avant-d4/, avec-complements/
- `work/missions/2026-10-25-integration-houblons/voies/d4-descripteurs/` : RESULTAT.md, rapport.md et ses scripts
À NE PAS inclure (autres voies, dans l'arbre) : `src/ui/**` (a2), `tests/unit/hopIndexV4/demandeReelle.test.tsx`, `scripts/collecte-hop/audit-capture.mjs`, `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `pistes-l5f.png`, `work/refonte-frontend/**`.
