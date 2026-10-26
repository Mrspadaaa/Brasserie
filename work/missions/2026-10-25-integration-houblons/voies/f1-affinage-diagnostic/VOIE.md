# Voie f1-affinage-diagnostic : Cryo boosté, Citra absent, coupes trop tôt, et le bon critère de justesse

Agent : auteur (Sonnet), pour un diagnostic chiffré. **Rien dans `src/`** : tes mesures passent par des scripts neufs dans
`scripts/eval-hop/`. Ta voie se termine par un rapport et un plan d'affinage.

## Ses mots (26.10)
- « elle récompense même surtout l'α c'est pas la bonne métrique. Surtout en fonction du style... Et l'aa est la métrique la plus
  simple à contrôler, augmenté ou diminuer la dose. Elle doit compter mais pas que. »
- « J'ai l'impression que cryo citra est beaucoup trop booster, et on voit pas citra simple » (D174).
- « Il faudrait pas que l'algo trie trop ou exclue trop tôt des potentiels candidats surtout » (D175).
- « Je pense que on est quand même pas mal, mais manque peut être un peu de fine tune ».
- Plus tôt : « Et le class ia semble bien mais change pas mal le classement de base. C'est à de demander à quel point notre algo est
  vraiment correcte. »

Son principe est écrit dans `cerveau/metier/substitution-moteur.md` (dernière puce) : lis toute la note.

## À mesurer
1. **D174, Cryo contre Citra.** Dans Substituer (moteur v2, `src/domain/hopIndex/v4/substitution.ts`) et dans Suggérer
   (`voies.ts`, avec les options de g2b), relève sur la 21C et sur la stout 16D :
   - quand Citra Cryo apparaît ;
   - à quel rang, avec quel score et pour quelle raison (composantes) ;
   - où est Citra simple, et pourquoi il manque.

   Pistes :
   - la règle « même variété, autre forme » ;
   - le dédoublonnage par variété ;
   - un α double qui gagne l'amertume ;
   - l'huile ;
   - le stock des fixtures ;
   - le tri « à acheter ».

   Donne la cause exacte, avec fichier et ligne.
2. **D175, les coupes.** Fais l'inventaire de chaque endroit où le pool de candidats est coupé avant le classement final : `maxBuy`
   (6 « à acheter », par ordre alphabétique), `limit` et `buyLimit`, les cinq du catalogue et les trois du stock de Substituer, la
   fenêtre de 20 de l'IA, les exclusions par le style et par la visée (D90), et les autres que tu trouves. Pour chacune :
   - combien de candidats elle retire, sur la 21C et sur la stout ;
   - si un houblon phare (Citra, Nelson Sauvin, Galaxy, Mosaic, Motueka, Idaho 7, Strata, Simcoe, Cascade, Hallertau Blanc) est
     coupé avant le rang final ;
   - ce que coûterait de couper plus tard : le temps en ms, à chaud et à froid (L20).
3. **Le poids de l'α.** Mesure combien l'α décide aujourd'hui des rangs de Substituer v2 à 60′ (poids amertume 0,8), et ceux de
   Suggérer à 60′ (palier g2b : usage, puis α). Son principe : l'α se règle par la dose ; il compte, mais pas seul.
   - Propose 2 ou 3 jeux de poids où l'α pèse moins à 60′, au profit de la cohumulone, du β, de l'huile, de l'usage et de l'arôme
     restant, pondérés selon le style.
   - Mesure-les par la méthode en deux moitiés : choisir sur une moitié, juger sur l'autre (L20).
   - **Pas contre Beer Maverick seul.** Il récompense l'α (g1), et un banc ne juge ni sur un artefact de l'ordre, ni sur les données
     de la clé (L20).
4. **Un critère de justesse sans artefact.** Propose un banc qui juge selon le style. Il combine :
   - les houblons phares, confrontés à leur réputation (L14) ;
   - les paires que le brasseur a déjà jugées : `work/refonte-frontend/v4/SPEC-BRASSEUR.md` et les pages m3 et m4 ;
   - Beer Maverick en indicateur secondaire, l'α retiré.

   Puis dis ce qu'un test à l'aveugle avec lui apporterait de plus : 10 houblons, deux listes sans étiquette, moteur et IA.
5. **L'écart avec l'IA.** Les essais réels ia1 et i2 (`voies/ia1-reclassement/`, `voies/i2-ia-substituer/img/rapport-reel.json`),
   les phrases et les ordres déjà obtenus, sans appel neuf : sur quoi l'IA et le moteur diffèrent-ils le plus ?

## Livrable
- `rapport.md` : les cinq parties, chiffrées, et un **plan d'affinage** en DÉCISION À PRENDRE, avec le coût estimé de chaque
  partie et ce qui changerait à l'écran.
- `RESULTAT.md` : une ligne, puis les chiffres décisifs.
- Les scripts sont déterministes : deux passes, même sha256.
- `npx vitest run tests/unit/hopIndexV4` vert : rien ne doit bouger.

## Possède
- `scripts/eval-hop/` : nouveaux fichiers seulement.
- `work/missions/2026-10-25-integration-houblons/voies/f1-affinage-diagnostic/`

Les voies g2d (`src/domain`) et s2 (`src/ui`) sont en cours : lis leurs fichiers, n'y écris rien. N'écris aucun code par heredoc ni
par `node -e`. Écris RESULTAT.md tôt. Retour en une ligne.
