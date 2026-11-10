REPRISE — rvC : code et tests écrits et verts ; il reste le build, les captures et les contrôles de bord (contexte épuisé à 200 k)

## Fichiers écrits (tous dans « Possède »)
- src/ui/finance/CoutBrassinFlux.tsx (+ cout-brassin-renvois.css, neuf) : ligne « Déjà payé » / « Coût de l'année » inconnue = bouton + ligne-tâche (data-manque="stock|an") ; « avant le brassage ? » / « plus tard ? » = boutons ; « ÷ ? L » = bouton vers les litres ; « litres nets à confirmer › » et « prix à compléter › » = boutons ; barre « payé ? à payer ? année ? » = bouton. Le « ? » hachuré des nœuds reste (ils étaient déjà des boutons).
- src/ui/finance/BrewBudgetSheet.tsx : liste `manques` (litres, prix par groupe d'ingrédients, densité, frais, production annuelle, charges fixes, usure) rendue en lignes-tâches « Données à compléter » à la place des anciens paragraphes `cbf-statut` ; chaque ligne dit ce que le manque empêche ; « Prévoir attend : … › » est un bouton (aria-label « Compléter : … ») ; nouvelles props `onMesures`, `profile` (ProfileSheet `parametres`), `onRegistre`, `onTarif` ; textes de vues (« à compléter : le prix ci-dessus », « Litres nets à confirmer : impôt non calculé › », « Densité à noter : impôt non calculé › », avertissements d'usure) en boutons ; « Tarif d'emballage des formats › » sous Emballage ; ProfileSheet est un frère du Sheet (fragment).
- src/ui/finance/BrewBudgetDialog.tsx : passe `onMesures`, `profile`, `onRegistre` (AssetSheet), `onTarif` (PrixFeuille, brassin seulement).
- src/ui/prix/ChaineArgent.tsx (+ chaine-argent-renvois.css, neuf) : « ? » des marches 3 (Coût du format) et 5 (Il te reste) et « à compléter » de l'emballage = boutons (`Q`) ; bloc « Pour compléter cette chaîne » (lignes-tâches de `manquesPrix`, comme le Prix) ; ProfileSheet `parametres` pour le volume annuel ; `onMesures={onNoteDensity}` vers le coût.
- src/ui/finance/synthese/Lignes.tsx : « À compléter » du litre = bouton vers le budget ; « Origine et limites » : chaque limite (solde à confirmer, date à corriger, paiements à confirmer) = bouton ; prop `onProfile` optionnelle de `Verifier`. Scene.tsx : légende « n à confirmer » en `data-renvoi="aucun"` (raison écrite : la ligne « Confirmer les paiements » juste dessous). synthese.css : `.syn-litre-bouton`.
- tests/integration/coutBrassinRenvois.test.tsx (neuf, 8 tests). Rouge sur HEAD par construction (le bloc « Données à compléter » et les boutons n'y existent pas) ; la rougeur sur HEAD n'a pas été rejouée (pas de git stash permis).

## Preuves
- `voies/rv/rvC-tests.txt` : 12 fichiers, 124 tests verts (coutBrassinRenvois, brewBudgetSheet, brewBudgetDialog, coutBrassinCorrections, coutBrassinFlux, f2ReelCout, f2ReelArgent, f3ReelCoutImpotClient, prixCorrectionsFz, prixACompleter, impotBiereLien, previsionsPrevoir).
- tsc hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch : aucune erreur.
- renvoisPartout.test.tsx : avant, Synthèse 3 fautes, coût du brassin 4, fiche › Argent 3. Après mes changements, la dernière commande (rejeu de ces trois blocs) n'a pas pu se terminer : à rejouer (voir DEMANDE EXECUTANT). Le dernier rejeu partiel (coût du brassin, Argent) était vert dans mon test propre.

## DEMANDE EXECUTANT
1. `cd C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`
2. `npx vitest run tests/integration/renvoisPartout.test.tsx -t "Synthèse|coût du brassin|fiche › Argent" --reporter=default` : attendu 3 tests verts (Synthèse peut rester rouge sur 1 ligne tant que `onProfile` n'est pas branché : voir BESOIN).
3. `npx vitest run tests/integration/batchStockFollowUp.test.tsx tests/integration/batchNombresFr.test.tsx tests/integration/batchDefautsB.test.tsx tests/integration/prixEcran.test.tsx tests/integration/batchPackagingVolume.test.tsx --reporter=dot` : attendu tout vert (lisent ChaineArgent).
4. `npx vite build --outDir "$TEMP/rvc-build" > work/missions/2026-11-09-compta-prix/voies/rv/rvC-build.txt 2>&1` : attendu « built in ».
5. `npx vite --port 3010 --strictPort` ; captures 390 tactile, clair et cave, sur `?dev-local&finance-demo=reel` : coût de « Ssr » (flux, ligne « Déjà payé » sélectionnée, bloc « Données à compléter », vue Ingrédients), fiche brassin › Argent, Finances › Synthèse. À ouvrir en image (L12). Arrêter le serveur.

## BESOIN hors Possède
- FinanceOverview.tsx ligne 83 : `<Verifier … onProfile={props.onProfile}/>` (sinon le « Solde de trésorerie initial à confirmer. » de « Origine et limites » est exempté par `data-renvoi="aucun"`, porté par la caisse).
- BatchDetailSheet.tsx : « Litres nets » renvoie à Mesures par `onNoteDensity` (focus sur la densité) ; mieux : un `onMesures` qui focalise « Saisir le volume conditionné ».
- PrixEcran (Prix) et ImpotBiereSheet restent rouges dans renvoisPartout (6 et 2 fautes) : voies rvA ou autre.

## Écarts et doutes
- Énergie, nettoyage, emballage : le renvoi ouvre la vue Frais du brassin (où le montant se saisit, chemin existant du nœud), pas la feuille du solde : ces montants sont propres au brassin. Charges fixes, usure et « coût de l'année » : production annuelle absente → feuille du solde, paramètres dépliés ; sinon vue « Charges fixes et usure » (+ registre : AssetSheet).
- Emballage → tarif : lien « Tarif d'emballage des formats › » (PrixFeuille) sous la ligne Emballage, pour un brassin seulement.
- Sources « Déjà payé ? » / « Coût de l'année ? » : un toucher sélectionne (geste c3a gardé) et la ligne s'ouvre en bouton avec sa tâche ; pas de saisie en un toucher.
- Pas de capture ouverte : validation visuelle NON effectuée.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un renvoi dans un nœud qui contient déjà des boutons (marche de la chaîne d'argent) ne peut pas envelopper la marche : le « ? » devient son propre bouton.
