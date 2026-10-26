OK — Ajouter : tri K3, Citra simple candidate, ibuParMoment paresseux, règle « dose de départ » ; tests rouges sur HEAD puis verts

## Fichiers écrits
- `src/domain/hopIndex/v4/quickAdd.ts` (lignes de c7 gardées : `peuDeDonnees`, tie-break) ; `prototypes/houblons-v4/tests/donnees.test.ts` (1 ligne : `keyOf` en K3).
- Tests neufs : `tests/unit/hopIndexV4/ajouterClassement.test.ts` (9 tests), `tests/unit/hopIndexV4/pharesParStyle.ts` (la table des phares).
- `scripts/eval-hop/` : `f5-perf.ts`, `f5-phares.ts`, `f5-sonde.ts`. Dossier : `capturer.mjs`, `img/` (2 captures + 2 json), `perf-*.json`, `phares-*.json`, `check-hop-perf-*.txt`.

## Ce qui change (quickAdd.ts)
- **P1 (K3)** : `quickAddKey` = [usage, conflit dégustation, indésirables, −attendues, neutres, −stock], chaque poids par niveau (marqué 2, cité 1). Nouveau champ de ligne `poids {indesirables, attendues, neutres}` ; `offStyleWeight` garde son sens (lu par `cases.ts`, non touché). `QUICK_ADD_RULE` ligne 3 réécrite.
- **P2** : comparaison au stock par clé (`s.key`), non par variété. Dans une même liste, une forme prend la plus mauvaise de sa clé et de celle de sa variété, puis passe après elle (nom et `peuDeDonnees` de la variété) : ni l'α ni le stock ne la devancent.
- **P3** : `ibuParMoment` calculé après le tri, pour les disponibles ; épuisés et achats gardés seulement avec `ibuParMomentPartout`.
- **P5 A** : la règle dit « 10′ et 0,5 g/L : dose de départ, pas une dose de style » (valeur lue dans `searchDoses`). Aucun autre texte d'écran.

## Critères
- **Deux tests rouges sur HEAD** (copie de l'arbre avec `quickAdd.ts` de `git show HEAD`, hors du dépôt) : P6a « Citra cryo sans sa variété simple : expected undefined to be defined » et « Citra simple (5 g) derrière Citra cryo (65 g) : expected 2 to be less than 1 » ; P6b « Mosaic : expected 24 to be ≤ 5 » et « 5 styles sur 31 ont un phare dans les 10 : expected 5 ≥ 15 ». Sur l'arbre : 9/9 verts.
- **`npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests`** : 890 verts, **4 rouges, tous hors de ma voie et déjà rouges avant mon changement** (6 avant, dont `pack.test`, vert depuis que quelqu'un a régénéré le pack à 17 h 27, avec mes champs) : `client-async` ×2, `worker-calculs` ×1 (empreintes du banc ×1), `substitution` « aucun cryo en tête » ×1. C'est la zone de f4. Le critère « vert » n'est donc pas tenu par l'arbre, il l'est pour ma part.
- **`npm run build`** : vert (tsc, vite, check-private-research).
- **Fluidité (D105, bloquante)** : `quickAdds`, 505 variétés, médiane par passe de 3×15 appels (`f5-perf.ts`), 3 séries : avant 12,07 / 12,17 / 12,65 ms, après 8,57 / 9,43 / 10,60 ms (−2 à −3,5 ms ; chaque série après est plus rapide que chaque série avant). Node, pas Chrome (D134 : 66 ms au navigateur, non mesuré ici).
- **`npm run check:hop-perf`** : ECHEC (6) avant ET après, les mêmes 6 lignes (Dryhopper, Comparer ×2, Suggérer ×3 ; aucune ne passe par `quickAdds`) ; aucune ligne nouvelle. Sorties dans `check-hop-perf-avant.txt` et `-apres.txt`.
- **Captures 390 × 844, ouvertes**, IPA 21A (24 L, Nugget 20 g à 60′), stock des fixtures posé dans le cache du banc (rien de réel) : `img/ajouter-21A-avant.png` reproduit exactement la plainte (Citra cryo, Galaxy, Pacific Sunrise ; 12 g, 10′ ; +9, +6, +5 IBU) ; `img/ajouter-21A-apres.png` : Cascade, Citra cryo, Chinook (même mise en page, mêmes doses, 12 g et 10′ partout, aucun mot en plus). Le « avant » vient d'un serveur lancé sur une copie de l'arbre (`quickAdd.ts` de HEAD plus les deux lignes de c7).

## Mesure de la réputation (L14), table écrite avant de regarder les rangs
`pharesParStyle.ts` : 2 à 7 houblons phares par style, 31 styles (BJCP 2021 et pratique) ; jugement de métier, à corriger par le brasseur. Stock vide, 505 achats (`phares-avant.json`, `phares-apres.json`) :
- phare dans les 10 premiers : **5/31 styles avant, 18/31 après** ; rang médian des phares (médiane des 31 médianes) : 176 → 37,5 sur 505 ;
- 21A, stock des fixtures : Mosaic 24e → **4e** des achats ; Citra simple, absente → **6e** des achats.
- **Quatre styles restent hors de la règle** (déjà à 240 à 440 avant) : 16C et 20C (aucune famille « attendue » : le frein des neutres décide seul et met en tête les houblons les moins décrits, Fantasia Blend, Gaia, Marco Polo, à une seule famille citée) ; 23A et 23G (toutes les familles « indésirables » : tout houblon décrit est « hors style », les non documentés passent devant). Listés dans le test comme connus, non couverts.

## Doutes et limites
- **Citra simple est candidate, pas visible** : à l'écran la liste montre 2 houblons du stock et 1 achat ; avec K3, le premier achat est Chinook, et Citra simple est 6e. D174 (« on voit pas citra simple ») n'est donc répondu que par le moteur ; la place à l'écran reste P4 (hors voie). De plus, dans la liste à l'écran, un houblon du stock (Citra cryo) passe avant un achat (Citra) : c'est « le stock d'abord », pas une clé de rang ; le test P6a vise le classement.
- Seuils de P6b (≥ 15 styles, meilleur phare ≤ 75) posés après la mesure : ils prouvent le progrès sur HEAD, pas une justesse indépendante (D77 : pas de moitié de réserve). La table, elle, précède la mesure.
- K3 jugé sur les 31 styles avec la table, mais la table et la règle partagent mon regard ; le brasseur n'a pas vu l'ordre.
- Dégustation non exercée dans P6b (sans dégustation). `f3-ajouter.ts` (voie f3) lit `quickAddKey` : son empreinte `06cffb7d…` change maintenant.
- Pack : régénéré par quelqu'un d'autre avant la fin ; il contient mes champs. À régénérer par le pilote si `quickAdd.ts` bouge encore.

DÉCISION À PRENDRE : styles sans famille « attendue » (16C, 20C) et tout « indésirable » (23A, 23G). Options : (a) laisser (statu quo, déjà mauvais avant) ; (b) le frein des neutres ne joue que si le style a au moins une famille attendue, sinon l'ordre retombe sur le stock puis le nom ; (c) un houblon à une seule famille citée ne passe plus pour « moins chargé » (l'inconnu ne vaut pas 0, `peuDeDonnees`). Recommandation : (c), puis re-mesurer ; (b) seul rendrait l'ordre alphabétique. À soumettre au pilote, hors du lot D107.

CONNAISSANCE : la clé d'Ajouter est [usage, conflit dégustation, indésirables, −attendues, neutres, −stock], en poids par niveau ; l'α n'y entre pas ; une forme ne passe jamais devant sa variété ; en IPA 21A, Mosaic 4e et Citra simple 6e des achats (stock des fixtures). Un houblon peu décrit paraît « léger » en neutres : l'inconnu gagne dans les styles sans famille attendue.

LEÇON PROPOSÉE : pour montrer l'« avant » d'un écran dans une voie qui modifie un fichier partagé, lancer le serveur de développement sur une copie de l'arbre (jonction `node_modules`, `.env`, `functions/src`) plutôt que de remplacer le fichier ; la capture « avant » a reproduit la plainte à l'identique.
