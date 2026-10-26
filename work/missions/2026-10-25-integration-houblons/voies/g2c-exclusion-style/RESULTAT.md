OK — D90 en place : seule une famille citée par la moitié des fiches exclut ; Nelson Sauvin, Motueka, Mosaic, Citra restent dans une Hazy.

## Fichiers écrits
- `src/domain/hopIndex/v4/hops.ts` : `marquee(variété, famille)` (sources ≥ moitié des fiches lues, au moins une) ; `styleFit` s'en sert pour « hors style ».
- `src/domain/hopIndex/v4/voies.ts` : pool « à acheter », conflits « moins » et « style indésirable » passent par `marque` (cache par moteur). Les goûts du brasseur gardent « une fiche suffit ». Un houblon à citation minoritaire est re-admis mais passe après ceux dont aucune fiche ne cite la famille (clé `mineure`, à nombre égal de familles visées). Phrase de `RANKING` mise à jour.
- `src/domain/hopIndex/v4/substitution.ts` : `conflitsStyle` lit `marquees` (même règle) ; phrase de règle mise à jour.
- Tests : `tests/unit/hopIndexV4/exclusionStyle.test.ts` (7 tests : 1/8 reste, 3/8 reste, 4/8 sort, sans fiche, conflit en stock, styleFit, Substituer) ; `engine.test.ts` (Idaho 7 en conflit, Cascade non) ; empreintes `moteurInchange`, `client-async`, `worker-calculs`.
- Mesure : `scripts/eval-hop/exclusion-style.ts`, `scripts/eval-hop/exclusion-style-rapport.ts` ; ici `rapport.md`, `exclusion-style-{prod,head,d90}.json`, `maj-etats.mjs`, `captures/`.
- Hors « Possède » mais imposés par les critères : `prototypes/houblons-v4/data/pack-mini-protos.json` et `pack-fiches.json` (régénérés par `build-pack.ts`, le test du pack l'exige) ; `work/refonte-frontend/v4/choix/etats/{suggerer,acquis}.json` (3 états, voir plus bas).

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : 79 fichiers, 751 tests verts.
- `npm run build` : vert.
- Mesure déterministe : `d90` rendu deux fois, même sha256 `5b95cb09…45`. prod (`c2b522a5…`) et head (`4ed45d86…`) lancés une fois chacun avec la version finale du script.
- `rapport.md` : trois sections (production, HEAD, HEAD + D90), chacune avec pool, phares, Suggérer 21C (10 voies, fixtures et catalogue entier), Substituer ; plus les trois lectures de « citée ».
- 21C avec D90 : Nelson Sauvin (végétal vert 1/9), Motueka (herbacé 1/7), Mosaic (1/7), Citra ne sont plus exclus. Hallertau Blanc (2/6) et Cascade (3/9) non plus. **Restent exclus : Idaho 7 (herbacé 3/6) et Strata (herbacé 3/4)**, par la règle de la moitié. Retirés du pool de la 21C : 175 variétés (HEAD) → 113 (D90).
- `construire.mjs` OK (9 pages) ; `controle-etats.mjs` : OK 138/138 (voir états changés).

## Mesures utiles (détail dans rapport.md)
- Styles des fixtures avec familles indésirables : seulement 21C (herbacé, végétal vert), 23A et 23G (les douze). La stout 16D n'en a aucune : mesurée par la visée « moins de résineux » (HEAD : 133 houblons retirés → D90 : 88 ; Citra, Nelson Sauvin, Mosaic, Hallertau Blanc, Cascade redeviennent proposables).
- Substituer 21C : Galaxy a 175 candidats en conflit de style sur 317 en HEAD, 113 avec D90. Rang de Nelson Sauvin parmi les remplaçants de Galaxy : 168 (HEAD) → 41 ; Mosaic 143 → 2 ; Citra reste 2. Pour Nelson Sauvin, Hallertau Blanc passe 164 → 1.
- Stout S1 (Suggérer du brasseur) : les 12 premières voies sont identiques à HEAD ; « Remplacer Nugget par Citra cryo » remplace « Retirer Nugget ». Sans la clé `mineure`, East Kent Goldings sortait des 14 voies (les houblons re-admis prenaient les 6 places du pool).

## Empreintes (une raison dans chaque test)
- `moteurInchange` substituts `ea61f2e1…` → `3a8bf578…` : seule la phrase de `RANKING` change (sans le champ `regle`, `97779b94…` avant et après).
- `client-async` et `worker-calculs` : `proposer` `3584e2c7dabd` → `31d7feb6324c` (Citra cryo n'est plus en conflit sur la stout). `substitutes`, `suggerer`, `remplacants` inchangés.

## États changés (3, convention e3 : `attendu` neuf, `choisie` ancien, `note`)
- `etat-sugg-plus`, `etat-acquis-plus-comparer` : « Comparer (3) » → « Comparer (4) » ; la page s'ouvre avec trois voies cochées au lieu de deux (Target n'a plus de conflit).
- `etat-sugg-dry-hop` : « 20 g » → « Target », « 5 g » ; la section Dry hop s'ouvre sur Target 5 g, plus sur Motueka 20 g.
- Captures après ouvertes et regardées (`captures/`). **L'avant n'est pas une capture rejouée** : je n'ai pas reconstruit la maquette sur HEAD ; l'avant est l'état OK 138/138 avant ma correction.

## Doutes et limites
- La mesure prod/HEAD s'est faite sur des extraits `git archive` (hors du dépôt) ; la mesure du pool lit le moteur (liste « ajouter », catalogue sans stock, un seul moment, dry hop actif), pas une réplique de la règle.
- La première passe de tests dans l'arbre de travail montrait 27 échecs ; 16 venaient du travail en cours de p5 (Dryhopper) et ont disparu à la relance. Ne pas relire ce chiffre.
- `pack-mini-protos.json` fait 539 ko : `build-pack.ts` dit « TROP GROS (> 500 ko) » et sort en code 1. HEAD avait déjà 551 973 octets ; non dû à D90.
- D90 ne change pas l'« apport établi » (`cites`) : un houblon à citation minoritaire garde donc ses pénalités de classement (effets de bord, débordement) et sa distance ; seule l'exclusion tombe. Sur la 21C, Nelson Sauvin reste donc moins bien classé qu'un houblon sans citation vert.
- Berliner Weisse / Gose (23A, 23G, douze familles indésirables) : 298 sur 299 houblons restent exclus, 1 reste.
- Les nouveaux tests n'ont pas été rejoués sur HEAD pour prouver qu'ils échouent avant ; la mesure `head` le montre (Nelson Sauvin, Motueka, Mosaic exclus).

DÉCISION À PRENDRE : « marqué » = la moitié au moins des fiches (texte de D90, retenu) ou le niveau d'affichage `marqué` de `describeFamilies` (deux fiches, ou premier descripteur) ? Sur la 21C, la moitié retire 113 variétés, le niveau « marqué » 95 (la moitié compte un houblon dont l'unique fiche cite la famille). Mais le niveau « marqué » garderait Hallertau Blanc (2/6) et Cascade (3/9) exclus. Recommandation : garder la moitié (texte de D90, convention des gros points de la fiche, et elle rend Hallertau Blanc et Cascade). VOIE.md confond les deux noms : à corriger.

CONNAISSANCE : une famille « marquée » (moitié des fiches) est la seule citation qui exclut ; une fiche isolée ne suffit plus (D90). Le pool « à acheter » est trié avant d'être tronqué à `maxBuy` : tout élargissement d'admission doit garder l'ordre des mieux classés devant.

LEÇON PROPOSÉE : un assouplissement d'exclusion se mesure sur la liste que le brasseur voit (stout S1, 14 voies), pas seulement sur le pool : les houblons re-admis ont pris les places du pool tronqué et fait sortir East Kent Goldings.
