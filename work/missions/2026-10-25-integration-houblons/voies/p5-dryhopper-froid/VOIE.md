# Voie p5-dryhopper-froid — porter son choix D (trois mini graphes) dans Dryhopper

Agent : auteur (Sonnet), pour un port dans l'app. Le critique (Fable) jugera ensuite les captures de l'app.

## Son choix (26.10, règle n° 1 : reprise telle quelle)
- Page m5 (https://claude.ai/artifact/WW2mmg7gWgUVSnT4PTWTFf), ses mots : **« La meilleure D · trois mini graphes »**.
- Registre : `work/refonte-frontend/v4/choix/ecrans.json`, entrée `dryhopper`, `complements`.
- Lecture étroite (L01) : c'est D seul. La bande de hop creep de F (greffe D + F) n'en fait pas partie.
- Sa demande d'origine : une croix sur l'espace vide sous la bande IBU, côté ébullition, avec « Amertume, hop creep ? Résineux ? ».

## La référence à reproduire (ouvre chaque image)
- Captures dans `voies/m5-dryhopper-froid/img/` :
  - `d-mini-graphes.png` : D au repos ;
  - `d-ouvert-amer.png`, `d-ouvert-creep.png` et `d-ouvert-limite.png` : les trois feuilles, ouvertes au toucher.
- Le dessin exact (DOM, classes `m5d-…`, styles, tailles, couleurs) est dans `voies/m5-dryhopper-froid/capturer.mjs`, variante D,
  avec les corrections du critique déjà faites :
  - étiquettes à 13 px, au gris des légendes ;
  - « moyen » ni en orange ni en alerte ;
  - feuille Amertume de 45 mots au plus.
- Lis aussi `voies/m5-dryhopper-froid/RESULTAT.md` et `critique.md`.
- **Plancher à enrichir (L07)**. Le dessin de D est la base : on ne le change pas, on le rend vrai et vivant.

## Les valeurs : `src/domain/hopIndex/v4/froid.ts` (voie x1), aucune valeur inventée
- `amertumeAFroid`, `hopCreepDe`, `famillesProchesDeLaLimite`.
- L'inconnu s'écrit « ? ».
- Le signe non établi de l'amertume se dit, sans être arrondi en un seul chiffre.
- Les niveaux du hop creep (faible, moyen, fort) sont une convention de x1 : la feuille le dit.

## À faire
1. **Inventaire avant le port (L03, M16).** Liste dans `voies/p5-dryhopper-froid/inventaire.md` tout ce que montre D :
   - repos : plage, trait de l'IBU à chaud, hachures, jauge, colonnes, ligne de limite, pictos à 12 px ;
   - les trois feuilles ouvertes : leurs lignes, leurs sources ;
   - les gestes : toucher pour ouvrir, toucher pour fermer, la feuille qui repousse le rail.
2. **Le port**, dans `src/ui/hopIndex/dryhopper/`, en composant à part importé par `index.tsx`, avec des classes `pq-dry-froid-…`.
   - Les données viennent de froid.ts, par le même chemin que les autres valeurs de l'écran.
   - Si le calcul est coûteux, mesure-le : le budget est le temps du toucher, et le moteur tourne hors fil quand l'écran le fait déjà.
3. **Les états selon le moment tenu.** Sa demande et D visent un dry hop (actif, après).
   - Aux moments chauds (ébullition, WP), garde l'écran actuel A, sans les mini graphes, et écris-le en DÉCISION À PRENDRE.
     Le pilote lui montrera ce cas.
   - Ne dessine aucun état qu'il n'a pas vu.
   - Le jour (1 j, 2 j, 3 j, 7 j) et la dose changent les valeurs : les mini graphes suivent, sans saut de mise en page (même
     hauteur).
4. **La fidélité (L03, D106, L12)**, à capturer en 390 × 844 sur la même recette que m5 : 21C, Cascade 4 g/L, dry hop après, 3 j.
   - Capture l'app au repos et les trois feuilles ouvertes, puis mets-les côte à côte avec les quatre captures de m5 :
     `fidelite/cote-a-cote-*.png`.
   - Mesure la boîte de chaque élément (les trois cellules, la plage, la jauge, les colonnes) dans l'app et dans m5 : un écart de
     4 px au plus.
   - Ouvre chaque image, et recadre la zone en plein format.
   - Écris le contrôle `tests/integration/controle-froid-dryhopper.mjs`. Il doit échouer sur HEAD (rien n'est dessiné), puis
     passer : les trois cellules sont présentes, aucune n'en chevauche une autre, et le rail reste en dessous.
5. **La maquette.** Reconstruis-la (`node prototypes/houblons-v4/parcours/outils/construire.mjs`), puis lance
   `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours`.
   - Si des états de Dryhopper changent, mets-les à jour dans `work/refonte-frontend/v4/choix/etats/dryhopper.json`, avec la
     preuve avant et après, comme l'a fait e3.
   - Un état qui dépend d'un choix non fait reste « en attente ».

## Critères
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` vert.
- `npm run build` vert.
- `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule`, build avec `VITE_HOP_V4=on`.
- `controle-froid-dryhopper.mjs` : rouge sur HEAD, puis OK.
- `controle-etoile-dryhopper.mjs` OK.
- `controle-etats.mjs` OK.
- Captures côte à côte ouvertes, écarts mesurés notés dans RESULTAT.md.

## Possède
- `src/ui/hopIndex/dryhopper/` : le nouveau composant, son import dans `index.tsx`, la CSS.
- `tests/integration/controle-froid-dryhopper.mjs`, et des tests neufs dans `tests/unit/hopIndexV4/`.
- `work/refonte-frontend/v4/choix/etats/dryhopper.json`.
- `work/missions/2026-10-25-integration-houblons/voies/p5-dryhopper-froid/`.

Ne touche pas `src/domain/hopIndex/v4/voies.ts` (voie g2a en cours) ni `src/ui/hopIndex/substituer/` (voie i2). N'écris aucun code
par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`. Écris RESULTAT.md tôt. Retour en une ligne.
