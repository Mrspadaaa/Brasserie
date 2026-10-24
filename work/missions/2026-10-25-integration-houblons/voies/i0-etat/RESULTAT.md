OK — État des lieux mesuré : classement, B1-B9, poids, moteur ×1/×5/×10, 7 risques majeurs, 18 tâches

## Fichiers écrits
- `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md` (six sections dans l'ordre)
- `work/missions/2026-10-25-integration-houblons/voies/i0-etat/RESULTAT.md`
- Hors périmètre, dans `%TEMP%\i0\` : `mesure-moteur.ts`/`.mjs`, `construire-tmp.mjs`, `volumes.mjs`, `bench.mjs`, la maquette construite et ses captures. `dist/` (ignoré par git) est recréé par `npm run build`. `git status --short src functions` : vide.

## Critère
- G1 : `node work/missions/2026-10-25-integration-houblons/voies/i0-etat/verifier.mjs` → `ETAT OK (18 tâches)`. Essais : 1.

## Mesures décisives (détail et commandes dans le document)
- Build app : 149 fichiers JS, 15,11 Mo bruts, 3,39 Mo gzip ; `check-hop-budget.mjs` : démarrage 918 ko gzip (budget 350), étape Houblons +772 ko (budget 150), identiques au 18.10.
- Maquette (construite hors de `maquettes/`) : `parcours.js` 1 749 510 octets, 403 ko gzip ; JSON = 45 %.
- Moteur : un geste 0,05 à 15 ms de ×1 à ×10 ; `substitutes` froid 92 → 560 → 1 522 ms ; `suggerer` avec dose changée 3,9 → 57 → 132 ms (≈ 530 ms sous ×4) ; classement léger froid 478 → 1 887 → 4 533 ms.

## Trouvailles à connaître
- Branche rouge : `npx vitest run` dans `prototypes/houblons-v4` → 2 échecs sur 127 (`Houblon inconnu du moteur : inconnu:hallertau`). `lireBiere` lève une exception pour tout houblon hors catalogue depuis 65155419 (24.10). Les tests du prototype ne sont pas dans `npm test`.
- L'étape Houblons de la maquette est l'étape 3/7 du `BrewWizard` (brouillon non enregistré), alors que ARCHITECTURE.md vise `RecipePage` et `saveRecipeConfirmed`.
- 0 contrôle sur 71 n'a de mode `--url` : `controle-choix.mjs` ne vérifierait pas l'app.
- La note `cerveau/metier/cout-calcul-moteur.md` est périmée : le balayage complet du catalogue (1 590 cas) prend 0,7 à 1,2 s aujourd'hui (banc du 22.10 rejoué), non 8 s.

## Doutes et limites
- Un seul PC (i5-14600KF), processeur non bridé : le ×4 n'est pas rejoué ; budgets t2 non rejoués ; BATTERIE et ETATS du commit du 24.10 non rejoués (ils lisent `maquettes/parcours/`, reconstruit par une autre voie).
- ×5 et ×10 : catalogue et stock clonés (α ±5 %, mêmes fiches) dans les singletons ; ce n'est pas un jeu de données réel. Tas mesuré = processus Node, pas un onglet de téléphone.
- Hors ligne, brassins, recettes de production : non mesurés (production interdite ; chiffres de #120 du 17.10 cités).
- Cause de l'accélération du moteur complet (×9 depuis le 22.10) non établie. Cause de la croissance plus que linéaire du classement léger chaud à ×10 non établie.
- Écart de lecture : MISSION.md dit Dryhopper, Comparer et Substituer « ouverts » ; `ecrans.json` (modifié, non commité) les dit « choisi ».
- Observation hors périmètre, sur la capture 07 : dans Dryhopper, le texte « levure active possible, non chiffrée » recouvre en partie l'étiquette « 38 µg/L ».

## DÉCISION À PRENDRE : hôte de l'outil et survie du brouillon
Question : l'outil entre-t-il dans l'étape 3 du `BrewWizard` (brouillon), dans `RecipePage` (recette enregistrée), ou les deux ? Un outil plein écran par-dessus le wizard ne doit pas faire perdre le brouillon.
Options : A wizard seul ; B `RecipePage` seul ; C les deux, avec un état de brouillon commun.
Recommandation : à trancher par le conseil sur l'état des lieux (R6) ; A en premier, car la maquette montre le fil d'étapes du wizard (D116).

## CONNAISSANCE : à verser dans [[cout-calcul-moteur]] (date 24.10, banc du 22.10 rejoué) : léger 464 ms froid / 81 ms chaud, complet 804 / 883 ms pour 1 590 cas ; `substitutes` croît plus que linéairement avec le catalogue.
## LEÇON PROPOSÉE : une note de mesure du cerveau vieillit dès que le moteur change ; rejouer le banc avant de s'y fier (le complet était 9 fois plus lent dans la note). Et : un test hors de la porte de `npm test` laisse la branche rouge sans alarme.
