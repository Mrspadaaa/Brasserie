OK — la liste Ajouter se joue sur un compte de familles ; plan P1 à P6 chiffré, dans rapport.md

## Fichiers écrits
- `scripts/eval-hop/f3-ajouter.ts` (nouveau, déterministe) ; rien dans `src/`.
- `work/missions/2026-10-25-integration-houblons/voies/f3-ajouter-diagnostic/` : `rapport.md`, `ajouter.json`, `durees.json`, ce fichier.

## Résultat (détail dans rapport.md)
- **La capture est une IPA, pas une Hazy** : le balayage des 31 styles ne donne « Citra cryo, Galaxy, Pacific Sunrise, 12 g, 10′ » que
  pour 21A et 22A. 21C : Galaxy, Nelson Sauvin, Belma ; 16D : Motueka, Target, Wild Wolf.
- **Citra cryo 1er (21A)** : par la clé « familles attendues citées » (7, le max), pas par l'α ni le stock. Preuves : α du lot à 5 %
  → rang 1 ; stocks tous égaux → rang 1 ; sans stock → Citra (pellets) 1er. L'α n'est dans aucune clé (`quickAdd.ts` l. 124).
- **D174** : le tri ne la viole pas (clés de style identiques à celles de la variété) ; `quickAdd.ts` l. 79 cache Citra (pellets) tant que
  Citra cryo est au stock (1 variété sur 505).
- **12 g, 10′** : 0,5 g/L × 24 L (`hopSolverBootstrap.json` l. 157, hypothèse de l'Affinée, pas une dose de style) ; 10′ forcé par
  `aromatique: true` (`Ajouter.tsx` l. 44, `quickAdd.ts` l. 77 et 88, D40). Doses distinctes : 12 et 5 (stock de Target).
- **Coupes** : le moteur ne coupe que 1 variété (l. 79) ; l'écran montre 3 des 505 (`Ajouter.tsx` l. 108 à 112), un seul achat.
- **Phares** : Mosaic 23e des achats en IPA, 25e en Hazy, 231e en stout ; cause : les familles neutres pèsent comme les indésirables, avant
  les attendues (`quickAdd.ts` l. 86 et 124). Strata hors style en Hazy (D93, déjà signalé).
- **Durées** (Node) : `quickAdds` 9,8 ms (317) et 13,1 ms (505) par recette nouvelle ; une variante de tri +0,2 ms ; `ibuParMoment` paresseux −2,4 à −3,5 ms.

## Critères
Pas de GATES.md dans le dossier ; la mission demandait un script déterministe : deux passes, même empreinte `06cffb7d9a27e451`
(`npx vite-node scripts/eval-hop/f3-ajouter.ts`). Essais : 5 passes (corrections : empreinte instable à cause de ms dans le JSON, retirés).

## Doutes et limites
- Les IBU de la reproduction (+9,1 / +6,3 / +4,9) diffèrent de la capture (+8 / +5 / +4) : OG et volume réels du brasseur inconnus.
- Stock des fixtures, non son stock réel du jour. Dégustation de la 21C et de la 21A **simulée** ; celle de la 16D est sa phrase du 18.10.
- Durées sous Node, pas Chrome (D134 : 66 ms dans le navigateur) : la fluidité de P1 et P3 est à mesurer par un exécutant dans Chrome.
- Aucune vérité de référence pour l'ordre d'Ajouter : K1 à K3 sont choisies et jugées sur les mêmes 3 recettes ; à éprouver sur les 28 autres styles (D77).
- J'ai passé deux `sed` simples (sans barre inverse) pour retoucher le script ; il a ensuite tourné deux fois à l'identique.

## DEMANDE EXECUTANT (optionnelle, pour P1 et P3)
Après que le pilote a choisi : porter P1 et P3 dans `quickAdd.ts`, puis rejouer `npx vite-node scripts/eval-hop/f3-ajouter.ts` ; sorties
attendues : Mosaic parmi les 5 premiers achats de la 21A, aucune forme devant sa variété, `quickAdds` ≤ 13 ms (Node) ; mesure Chrome du
premier écran d'Ajouter avec 505 variétés.

DÉCISION À PRENDRE : voir `rapport.md`, section « DÉCISION À PRENDRE ». P1 (tri K3), P3 (ibuParMoment paresseux) : ordre et coût seuls,
à faire sans lui (D102). P2 (Citra pellets candidate), P4 (places et formes), P5 (dose et moment par défaut) changent l'écran : mini
maquettes. Ma recommandation : K3 après l'avoir rejoué sur les 28 autres styles ; P5-A tout de suite (dire que 0,5 g/L est un départ de recherche).

CONNAISSANCE : la liste Ajouter ordonne par `[usage, conflit dégustation, poids neutres+indésirables, −nombre d'attendues citées, −stock]` ;
l'α n'y entre pas ; le stock ne départage que les ex æquo ; les familles neutres du style pèsent comme des défauts (Mosaic 23e en IPA).

LEÇON PROPOSÉE : un diagnostic d'écran commence par reproduire la capture du brasseur (ici un balayage des 31 styles) : la recette citée dans
la demande (21C, 16D) ne donnait pas sa liste ; la capture venait d'une IPA.
