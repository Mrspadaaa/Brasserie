# Voie b1
- AM-47 | corrigé | be70fa7c3 | déjà corrigé : « Nouveau brassin » compare le volume repris au matériel actuel (`avertissementMaterielActuel`, `QuickActionModal.tsx` l.208 et 1272) : avertit et propose « Adapter à mon matériel actuel », sans refuser ni changer seul ; tests `bStockMaterielActuelModal.test.tsx`, `bStockMaterielActuel.test.ts`
- TE-35 | ouvert | — | hors voie : src/ui/finance/UpgradeSheet.tsx (zone Finances) ; correctif en une ligne : bornes et message au champ prix et livraison, total TTC qui compte les achats, bandeau « mois » avant l'enregistrement
- TE-36 | ouvert | — | hors voie : src/ui/finance/UpgradeWorkspace.tsx et projet/ProjetPiste.tsx (zone Finances) ; correctif en une ligne : un seul libellé « Inclure dans mes prévisions » pour la case, cochée ou non
- TE-39 | corrigé | 221dedb80 | déjà corrigé : l'empâtage est plafonné par la cuve (plus de grain, moins d'eau : physique) et la feuille Volumes le dit en toutes lettres (« Empâtage plafonné par la cuve (x L utiles) », `AdapterVolumes.tsx` l.163) ; a2 : non reproduit sur le calcul
- TE-44 | corrigé | f15d3b34e | déjà corrigé : l'aide du volume vient de la cible de l'étape (plus de « 25 ») ; la tuile « pH 7 » avant mesure : non reproduite (l'inconnu s'affiche « — », aucun 7 par défaut dans `BrewDayMeasurements.tsx`)
- BR-114 | corrigé | bf535b302 | déjà corrigé (RJ-2) : OG hors 0,990–1,200 refusée avec message au champ, jamais enregistrée, courbe et alcool inchangés ; test rendu `bugs-b1-mesures.test.tsx` (OG 2,5 : alerte, rien d'écrit, pas d'« 194 »), vert
- BR-115 | corrigé | 117a0de39 | test rouge d'abord (aucune alerte pour 57,9 L conditionnés / 19,8 L brassés) ; maintenant ligne d'alerte « 57,9 L pour 19,8 L brassés : vérifie le volume ou les fûts » sous « Contenants » de la fiche et sous « Corriger les mesures » ; la valeur n'est jamais effacée (alerte, pas refus : la saisie est déjà bornée au passage Conditionné) ; lecture étroite : la liste « Brassins de Hazy » (autre écran) n'a pas été touchée
- BR-117 | corrigé | 65104713e | déjà corrigé : « Supprimer ce brassin » ouvre `SuppressionLiee` (maquette suppression/v2 : feuille avec liens, ou bandeau « supprimé · Annuler » sans lien) ; test rendu vert
- BE-23 | ouvert | — | hors voie : src/ui/finance/ExpenseSheet.tsx (zone Finances, déjà à trancher par b-divers) ; correctif en une ligne : écrire « 5 pièces » / « 5 × » au lieu de « 5 Stk × — » quand le prix manque
- BE-26 | ouvert | — | hors voie : src/ui/finance/CreativePricing.tsx (zone Finances) ; correctif en une ligne : prix de vente TTC borné (0,05 à 1 000 CHF) et arrondi au centime, avec message au champ
- BE-27 | ouvert | — | hors voie : src/ui/finance/ExpenseSheet.tsx (zone Finances) ; correctif en une ligne : marge de fin de défilement sous la barre « Enregistrer » pour que la dernière aide reste lisible
- BE-42 | corrigé | 9ba6c9670 | étiquette « 20,5 °C » : liseré de la couleur du fond et `setpointLabelBaseline` l'écartent des traits de grille (capture courbe-clair-390 : « 20,5 °C » lisible sur la plage, « fin J9 » libre) ; le « + » flottant sur « fin J9 » dépend du bouton de l'app (hors banc) : marge de fin de défilement à confirmer par le pilote en ligne, hors voie (App, pas FermentationTemperatureChart)
- BE-85 | corrigé | bf535b302 | doublon de BR-114 : même correctif, même test
- BE-86 | corrigé | 117a0de39 | doublon de BR-115 : même correctif, même test
- BE-88 | corrigé | 65104713e | doublon de BR-117 : même correctif, même test
- RL-13 | corrigé | dfa5c774b | test rouge d'abord (`notesEnVirgule` absente) ; le bloc de notes du jour de brassage affiche « OG 1,031 · 11,3 % AA · 27,5 °C · 22,8 L » ; dates (05.09.2026) et versions gardent leurs points ; le texte enregistré n'est pas réécrit (affichage seul)

Tests : `npx vitest run tests/unit/bugs-b1-mesures.test.tsx tests/unit/bugs-b1-notes-recette.test.ts tests/integration/batchPackagingVolume.test.tsx tests/integration/impotBiereLien.test.tsx tests/unit/gravityBounds.test.ts tests/unit/port-p5-depot.test.tsx tests/integration/batchScheduling.test.tsx tests/integration/brassageLevureAbsenteParcours.test.tsx tests/integration/brewCompanion.test.tsx tests/integration/brewDayDefautsB.test.tsx` → 52 passés, 0 échoué (tests.txt). `tsc --noEmit` : aucune erreur sur les fichiers touchés.

Captures : banc `banc/` (VRAIE `BatchDetailSheet` et VRAIE `FermentationTemperatureChart` sur fixture « ZZ TEST — Hazy IPA » simulée, port 3105). Ouvertes : `captures/mesures-clair-1280.png` (prise AVANT le correctif BR-115 : « 57,9 L en place » et seulement « non répartis », aucune alerte vs brassé) et `captures/courbe-clair-390.png`, `courbe-clair-1280.png`, `mesures-clair-390.png`. Reste à prendre après correctif, deux thèmes et 390/1280 : voir ci-dessous.

DEMANDE EXECUTANT :
1. Supprimer les 4 anciennes captures : `rm work/missions/2026-11-19-bugs-ecrans/voies/b1/captures/*.png`.
2. Depuis `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` : `PORT=3105 node scripts/with_server.mjs --server "npx vite --port 3105 --strictPort" --port 3105 --timeout 300 -- node work/missions/2026-11-19-bugs-ecrans/voies/b1/banc/capturer.mjs` en arrière-plan, sans `timeout` court (la première page met ~2 min à compiler ; compter 20 min en tout).
3. Sortie attendue : le journal liste `mesures-clair-1280 : ALERTE conditionné présente` et `mesures-ok-clair-1280 : pas d’alerte conditionné`, sans « pageerror » ni « racine vide ».
4. Fichiers : `captures/{mesures,courbe}-{clair,cave}-{1280,390}.png`, `mesures-ok-clair-1280.png`, `og-2-5-clair-1280.png`, `supprimer-clair-1280.png`.
5. Les ouvrir toutes (Read) : alerte ambre « 57,9 L pour 19,8 L brassés » sous « Contenants » ; OG 2,5 : message rouge au champ ; supprimer : feuille ou bandeau « supprimé · Annuler » ; courbe : « 20,5 °C » lisible, « fin J9 » libre, thème cave lisible. Renvoyer les défauts vus au pilote.

CONNAISSANCE : une voie qui ne touche qu'un affichage fige-le dans le banc `banc-main.tsx` : le carnet est vide sous `?dev-local`, monter la vraie feuille sur une fixture ZZ TEST évite tout passage par Firestore.
LEÇON PROPOSÉE : aucune

## Preuves (exécutant)

Point 1 non fait : `rm captures/*.png` refusé (suppression interdite par le cadre d'exécution). Les 4 anciennes captures portent les mêmes noms que les nouvelles : le banc les a écrasées, aucune capture périmée ne reste (11 PNG, tous datés du passage final).

Corrections du banc (`banc/capturer.mjs`, seul fichier modifié hors RESULTAT) : (a) saisie OG ouverte via « Corriger les mesures » avant le clic (`not clickable` sinon) ; (b) sélection Ctrl+A avant « 2,5 » (la saisie s'ajoutait à « 1.060 » → « 1.0602,5 ») ; (c) sonde d'alerte sur le texte réel « pour 19,8 L brassés » ; (d) sonde de disponibilité sur le texte du body (la feuille se monte en portail, `#root` reste vide) ; (e) `racine vide` ne sort plus sur les feuilles.

Journal, dernier passage (`with_server.mjs`, port 3105, `npx vite`, code 0) :
```
mesures-clair-1280 : ALERTE conditionné présente
courbe-clair-1280 : pas d’alerte conditionné
mesures-clair-390 : ALERTE conditionné présente
courbe-clair-390 : pas d’alerte conditionné
mesures-cave-1280 : ALERTE conditionné présente
courbe-cave-1280 : pas d’alerte conditionné
mesures-cave-390 : ALERTE conditionné présente
courbe-cave-390 : pas d’alerte conditionné
mesures-ok-clair-1280 : pas d’alerte conditionné
og-2-5-clair-1280 : ALERTE conditionné présente
supprimer-clair-1280 : pas d’alerte conditionné
```
`pageerror` : 0. `racine vide` : 0.

Captures ouvertes, une ligne chacune :
- mesures-clair-1280 : alerte ambre « 57,9 L pour 19,8 L brassés : vérifie le volume ou les fûts » sous « Bouteilles », et « 57,9 L non répartis ». Visible, pas de défaut.
- mesures-clair-390 : même alerte, retour à la ligne propre, « Corriger les mesures » replié en bas. OK.
- mesures-cave-1280 : alerte ambre lisible sur fond sombre. OK.
- mesures-cave-390 : idem. OK.
- courbe-clair-1280 : « 20,5 °C » lisible sur la bande, « fin J9 » libre. OK.
- courbe-clair-390 : idem, légende repliée. OK.
- courbe-cave-1280 : lisible ; légende « J5 · Montée de fin » en bleu clair peu contrasté, graduations grises discrètes. À surveiller, pas bloquant.
- courbe-cave-390 : lisible. OK.
- mesures-ok-clair-1280 (18,5 L conditionnés) : pas d’alerte conditionné. Reste « 18,5 L non répartis » : avertissement existant, sans lien avec BR-115.
- og-2-5-clair-1280 : champ « 2,5 », message rouge au champ « OG 2,500 : au-dessus de 1,130, … Cette valeur est impossible : elle ne s’enregistre pas. ». Le refus est visible. Défauts, voir ci-dessous.
- supprimer-clair-1280 : feuille « ZZ-LOT-004 · suppression demandée », « plus rien ne le retient », boutons « Supprimer ZZ-LOT-004 » et « Archiver plutôt ». Visible, rien cliqué. OK.

Défauts renvoyés au pilote (point 5) :
1. OG 2,5 : la ligne de résumé « Densité OG 2,500 · 0 relevé » affiche la valeur refusée (la courbe et l'alcool restent inchangés, mais le chiffre refusé s'affiche).
2. Le message donne la borne haute 1,130 ; le verdict BR-114 cite 0,990–1,200. À trancher : quelle borne et quel texte.
3. Double alerte : « 57,9 L conditionnés pour 19,8 L brassés » apparaît aussi sous « Corriger les mesures ». Deux lignes pour un même fait.
4. Hors banc, non vérifié : marge de fin de défilement pour le « + » flottant sur « fin J9 » (BE-42, à confirmer en ligne).

Commande de capture du point 2 : `PORT=3105 node scripts/with_server.mjs --server "npx vite --port 3105 --strictPort" --port 3105 --timeout 300 -- node work/missions/2026-11-19-bugs-ecrans/voies/b1/banc/capturer.mjs`, lancée 5 fois : 1 échec de clic (OG), 3 passages où une sonde ou la saisie était fausse (corrigés), dernier passage propre.
