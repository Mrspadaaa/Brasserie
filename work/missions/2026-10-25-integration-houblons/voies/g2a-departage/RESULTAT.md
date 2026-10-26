OK — option departage k1/k2/k3 (défaut inchangé à l'octet), mesure, rapport, 10 listes

## Fichiers écrits
- `src/domain/hopIndex/v4/departage.ts` (nouveau : les trois clés) ; `src/domain/hopIndex/v4/voies.ts` (option `departage`, champ `Voie.departage` présent seulement si actif, une ligne dans `compareRankKeys` après la distance).
- `tests/unit/hopIndexV4/departage.test.ts` (19 tests).
- `scripts/eval-hop/departage.ts` (mesure), `departage-octet.ts` (preuve HEAD contre actuel), `departage-absents.ts` (pourquoi des phares manquent sur la 21C).
- Voie : `departage.json` (mesure complète, partie D = les 10 listes), `rapport.md`.

## Critères
- `npx vitest run tests/unit/hopIndexV4` : 62 fichiers, 570 tests verts (empreintes de `moteurInchange.test.ts` inchangées).
- `npx vitest run prototypes/houblons-v4/tests` : 15 fichiers, 157 tests verts (`client-async`, `worker-calculs` compris).
- `npm run build` : vert (21 s).
- Octet près : `npx vite-node scripts/eval-hop/departage-octet.ts` : 96 appels (48 433 542 octets) identiques à `voies.ts` de HEAD, sha256 `de5d454595f189494ec296fdd7ee3ab6820a2f51a854e3a87f4dd8aa48c81ecb` des deux côtés. Le test unitaire vérifie aussi que le JSON par défaut ne contient pas « departage ».
- Déterminisme : `departage.ts` en deux passes (deux processus parallèles, deux dossiers) : sha256 **`d5348c106ea9e0c53684846d50f169cf5b7b5f6f77f0b444d049fb35e99daaf9`** les deux fois.
- `rapport.md` : chiffres, rangs des 7 phares (stout à 10′ et au dry hop ; 21C), provenance par étape, deux moitiés du banc.

## Chiffres décisifs
- Dry hop, 21C, agrumes : premier groupe 23 → **1** (k1), 17 (k2), **1** (k3). Banc de 66, premier groupe médian 53 → 1, 5, 2.
- **Le banc est circulaire pour k1** (visée = fiches marquées de X, première étape de k1) : 37 sur 66 dans les 10 premiers. Le rappel@10 sur les substituts Beer Maverick, indépendant des fiches, ne bouge pas à 10′ (k1 20,4 % contre 19,5 %).
- Protocole deux moitiés : k1 gagne dans les deux sens, aux deux moments ; je ne m'y fie pas (ci-dessus).
- Provenance k1 : 86 à 94 % des séparations viennent des trois étapes de vocabulaire. Des 183 valeurs d'agrumes (179 chez g1), 131 viennent de l'huile totale (niveau 1), 50 d'un signal propre. k2 : 23 % des paires d'agrumes restent ex æquo (groupe de 110). k3 : 58 % de ses séparations viennent d'un inconnu face à un connu (137 variétés sans radar).
- Phares (stout, 10′) : k1 et k2 **coulent Galaxy en agrumes** (170e, 214e sur 233 ; k3 : 16e) ; **Motueka tombe en tropical** pour les trois clés (4e → 72e, 80e, 54e sur 123 ; son 4e rang actuel est un effet de l'α) ; Mosaic en floral : 153e sur 154 (k1, k2), 60e (k3). Nelson Sauvin : aucune clé ne le coule, aucune ne le place dans les 10 premiers (45e à 81e en tropical). k3 place Citra 4e en agrumes ; k1 et k2 placent Cascade 11e et 12e (k3 : 74e).

## Essais
Une passe par critère ; le test et le script ont tenu du premier coup (le `tmp-head` de la preuve octet a été effacé après usage).

## Doutes et limites
- Sur la 21C (Hazy IPA), **Nelson Sauvin, Motueka, Mosaic, Hallertau Blanc et Cascade sont exclus du pool par le style** (une fiche qui cite herbacé ou végétal vert suffit), avant tout départage. Seuls Citra et Galaxy se jugent sur la 21C ; les sept se jugent sur la stout. Règle du moteur, hors de ma voie.
- Place de la clé : après la distance, **avant le stock** et la dérive d'IBU (choix de g1). Une voie « à acheter » peut donc passer devant une voie du stock à distance égale, et à 10′ la clé remplace l'α comme ordre. Une ligne à changer pour la mettre après le stock.
- L'écran et l'adaptateur ne passent pas l'option : le basculement demande de la transmettre (adaptateur, client async, worker).
- Mon jugement par réputation est celui d'un auteur, sur 7 houblons : le brasseur juge les 10 listes. Aucune capture : rien ne se voit encore.
- Cause du coulage de Motueka et de Galaxy non vérifiée dans leurs fiches.

DÉCISION À PRENDRE : quelle clé montrer d'abord au brasseur, et le défaut ? Options : (a) k1, qui départage le mieux (premier groupe 1) mais lit à 86–94 % le vocabulaire des fiches, coule Galaxy et se juge sur un banc circulaire ; (b) k3, le radar Beer Maverick, indépendant des fiches, qui met Citra 4e et Galaxy 16e en agrumes mais ne couvre que 181 variétés sur 318 (58 % de ses séparations viennent d'un inconnu) et laisse des groupes jusqu'à 79 ; (c) k2, écartée : ex æquo de 110, coule Citra (127e) et Galaxy (214e). Recommandation : ne rien basculer avant son jugement des 10 listes (partie D de `departage.json`, page à publier par toi) ; à défaut, le défaut serait k3, puis k1 pour les houblons sans radar (clé composée à mesurer dans une voie g2b), parce que k3 est la seule qui ne lit pas les mots qui ont servi à la visée et que k1 seule rejoue le piège de L14.

CONNAISSANCE : à 10′, avec la distance égale entre variétés (l'effet d'une famille citée ne dépend pas de la variété), l'ordre d'aujourd'hui est l'α (dérive d'IBU) ; le départage d'arôme le remplace. Sur une Hazy IPA, le pool exclut Cascade, Mosaic, Nelson Sauvin, Motueka, Hallertau Blanc pour une seule fiche qui cite herbacé ou végétal vert.

LEÇON PROPOSÉE : un banc dont la visée est construite avec les mêmes données que la clé testée est circulaire ; avant de laisser le protocole en deux moitiés trancher, vérifier que la mesure juge sur une donnée que la clé ne lit pas (ici le rappel@10 des substituts Beer Maverick).
