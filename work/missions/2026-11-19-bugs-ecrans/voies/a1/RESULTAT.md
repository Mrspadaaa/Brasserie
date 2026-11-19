REPRISE — 13 verdicts écrits : 8 corrigés (SU-NOTE-2 déjà), 0 écarté, 5 ouverts (B1-NOTE-3, BR-6 hors voie ; TL-10, MV-9, TE-17 accord requis) ; reste la preuve (captures M-4, tests.txt), voir DEMANDE EXECUTANT

# Voie a1
- M-4 | corrigé | 2d8cd9c44 | alerte « Teinte 267,2 EBC : plus noire que les stouts les plus foncées (40 SRM ≈ 79 EBC, BJCP 2021). Vérifier les masses de malts colorés. » au-delà de 79 EBC (source citée dans modele.ts) ; le repère « 267 EBC › » existait déjà (AM-11) ; une teinte inconnue ne dit rien. Lecture étroite : alerte seule, rien de refusé. Nota : à OG > 1,130 la teinte est masquée par BrewWizard (déjà là)
- B1-NOTE-3 | ouvert | — | hors voie : src/pages/BrewWizard.tsx (ligne 2258 : `abandonner` exige `draftNotice || draftError`, donc le bouton n'apparaît qu'après le premier enregistrement du brouillon ; défaut toujours présent)
- TL-10 | ouvert | — | accord requis : aucune table de couleurs/PPG de malts sourcée n'existe (src/data/fermentables/fermentescibles.json = noms et catégories Beer Analytics, sans EBC ni PPG). Options : A) saisir les fiches Weyermann/Castle/Viking (fiches fabricants, source citée) dans un fichier de données (hors voie : src/data) ; B) laisser « ? » à renseigner (état actuel, honnête : inconnu ≠ 0) et compter sur « Compléter avec l'IA » des fiches de stock (4daf08e98). Recommandation : A pour les 25 malts courants
- TE-17 | ouvert | — | accord requis : le « cycle à trois positions sans retour arrière » est déjà corrigé (table famille × moment AM 1 et 2 : un grain n'a qu'un moment, un sucre ou un fruit en a deux ; « Annuler » 6 s, commit 883732eed et suivants). Reste le nom : la ligne dit « J+3 », le plateau « fermentation » avec « J+ 3 » (vu sur captures te17-fruit-*), forme m1 de la maquette s1 (D218). Options : A) garder (recommandé, la maquette choisie) ; B) écrire « ferm. J+3 » sur la ligne (change la forme m1)
- SU-NOTE-2 | corrigé | 883732eed | déjà corrigé : l'ajout d'une ligne neuve (sans masse tapée) donne le focus à sa masse (`aFocaliser`), « 0,2 » Entrée pose 0,2 kg puis le focus revient au champ d'ajout ; test de non-régression dans bugs-a1-fermentescibles.test.tsx
- AM-33 | corrigé | 7a7f62e0d | RecipeTextParser (import collé) : un houblon sans moment ni durée, ou à l'empâtage (« mash », « empattage »), est lu à l'ébullition MAIS signalé (« Moment absent : X — lu à l'ébullition faute d'indication ; à confirmer » / « Houblon à l'empâtage : X — ce moment n'existe pas ici »). Lecture étroite : le modèle n'a pas de houblon d'empâtage ; l'additif « Empattage » est déjà normalisé en « Empâtage » (AM-32)
- MV-7 | corrigé | 2d8cd9c44 | « Miel » tapé dans Grain (famille par défaut) crée un sucre à l'ébullition, rayon Sucre ; le bouton « Créer » le dit avant le geste (« sucre : à l'ébullition ») ; « Honey Malt » reste un malt
- MV-8 | corrigé | 2d8cd9c44 | lecture étroite : aucune famille d'épice n'existe, la ligne n'est pas refusée ; l'écran dit « Coriandre : une épice n'est pas un fermentescible, elle serait comptée comme du grain. Elle se note en additif, en grammes. »
- MV-9 | ouvert | — | accord requis : « Mangue 20 » dans Grain devient maintenant un fruit de 20 kg (famille devinée, MV-7). Mais dans la famille Sucre de lait CHOISIE à la bascule, la famille du brasseur n'est jamais écrasée par le nom (test). Question : un nom de fruit tapé dans une famille choisie à la main doit-il changer de famille ? Options : A) non, jamais (actuel) ; B) proposer la bonne famille sur la ligne « Créer ». Recommandation : A
- PI-1 | corrigé | 2d8cd9c44 | la pastille d'un grain mal placé porte une flèche de retour (↩, `.fer-remet`) au lieu de la flèche de cycle, et dit « Remettre à l'empâtage » (ligne et plateau)
- BR-6 | ouvert | — | hors voie : src/ui/numericInput.ts et src/ui/QuantityStepper.tsx (houblons, BrewWizard) : `push` lit « 0,1 » puis ignore « 0,1 k », `settle` rend 0,1 en silence ; le champ n'est pas à Malts/sucres
- BR-11 | corrigé | 2d8cd9c44 | lecture étroite : un malt trouvé seulement par son surnom (Carapils pour « dext ») passe derrière un autre rayon dont le nom COMMENCE par le texte (Dextrose) ; le reste de l'ordre est inchangé
- BR-19 | corrigé | 3c1050a7e | cinq points dans la bascule de famille, le plein est la famille courante (position et nombre de familles, sans mot de plus) ; l'infobulle et le nom accessible « Toucher : X » existaient

Tests : à produire (voir DEMANDE EXECUTANT) ; vérifiés verts avant : bugs-a1-fermentescibles (13), bugs-a1-AM-33 (4), tests/unit/fermentescibles + rejeu-ff0f (194/195, le seul échec rechargementAssistant est instable sous charge, vert seul 5/5), recipeParser, d100RecipeImportResult ; tsc sans erreur sur mes fichiers.
Captures (20 prises dans voies/a1/captures/, journal captures-journal.txt, relevés releves.txt) : OUVERTES : pi1-br19-390-clair (flèche de retour ↩ sur « fermentation », 5 points dans la bascule « Grain ⇄ ●○○○○ »), br11-dext-390-clair (relevé : Dextrose > Carapils), m4-mv8-390-clair (alerte Coriandre vue ; teinte masquée car la couleur de Coriandre est inconnue : honnête), te17-fruit-390-clair (ligne « J+ 3 », plateau « fermentation » + « J+ 3 »). À OUVRIR : les 16 autres (cave, 1280) ; M-4 : la capture de l'alerte de teinte reste à prendre (voir REPRISE).

REPRISE : agent a1 arrêté à 200 k de contexte (hook). Fait : 13 verdicts écrits ci-dessus ; commits 7a7f62e0d (AM-33), 2d8cd9c44 (PI-1, M-4, MV-7, MV-8, BR-11), 3c1050a7e (BR-19). Non commités : voies/a1/capturer.mjs, RESULTAT.md, captures (travail, à `git add -f`).
Reste à faire (mécanique, pour un exécutant Haiku ; le pilote juge) :

DEMANDE EXECUTANT :
1. Corriger voies/a1/capturer.mjs : la scène « Coriandre » et la scène « Malt noir » doivent être sur deux pages (état 'couleurs', rouvrir la page entre les deux) ; Coriandre laisse sa couleur inconnue et masque la teinte. Scène M-4 : état 'couleurs', taper « Malt noir 2,5 », Entrée, Entrée, cliquer la pastille « ? » de la ligne, taper 1400, Entrée ; photo `m4-teinte-<mode>-<thème>` ; relevé attendu : le texte des alertes contient « Teinte » et « 79 EBC ».
2. `node --check` puis `node scripts/with_server.mjs --server "npm run dev -- --port 3103 --strictPort" --port 3103 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-19-bugs-ecrans/voies/a1/capturer.mjs > work/missions/2026-11-19-bugs-ecrans/voies/a1/captures-journal.txt 2>&1` (en arrière-plan, ~8 min, sans `timeout`) ; sortie attendue : `CAPTURES OK`.
3. `npx vitest run tests/unit/bugs-a1-fermentescibles.test.tsx tests/unit/bugs-a1-AM-33.test.ts tests/unit/fermentescibles tests/unit/recipeParser.test.ts --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/a1/tests.txt 2>&1` puis `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs a1` (VERDICTS OK) et `--tests` (TESTS OK).
4. Ouvrir (Read) toutes les captures : cave et 1280 de pi1-br19, mv7-miel, br11-dext, m4-mv8, m4-teinte, te17-fruit ; dire en une ligne ce qu'on y voit.
5. `git add -f work/missions/2026-11-19-bugs-ecrans/voies/a1/` puis `git commit -m "Bugs a1 : preuves (captures, tests)" -- work/missions/2026-11-19-bugs-ecrans/voies/a1/` avec la ligne Co-Authored-By de COMMUN.md.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un agent qui lance un serveur Vite et des captures consomme son contexte en essais ; confier la série de captures à l'exécutant dès le premier essai (L18).

## Preuves (exécutant)
- CAPTURES OK 24 : `capturer.mjs` via `with_server.mjs` (port 3103), sortie 0 ; journal `captures-journal.txt`, relevés `captures/releves.txt`. Scènes : pi1-br19, mv7-miel, br11-dext, m4-mv8 (Coriandre, page propre), m4-teinte (Malt noir, page propre), te17-fruit ; × 390 tactile et 1280, clair et cave.
- Relevé M-4 : `Teinte 169,5 EBC : plus noire que les stouts les plus foncées (40 SRM ≈ 79 EBC, BJCP 2021). Vérifier les masses de malts colorés.` ; « contient Teinte et 79 EBC » = true sur les 4 thèmes/modes.
- VERDICTS OK (13) ; TESTS OK.
- TESTS OK : Vitest, 12 fichiers, 140 passés, 0 échoué (`tests.txt`).

Captures ouvertes (24) :
- pi1-br19-390-clair : Pilsner et Caramünch en « fermentation ↩ », « compté 0 », bascule Grain à 5 points, bandeaux « Touche son moment pour le remettre ».
- pi1-br19-1280-clair : même état en 1280, flèche ↩ et 5 points visibles.
- pi1-br19-390-cave : même état en cave, lisible.
- pi1-br19-1280-cave : même état en cave 1280.
- mv7-miel-390-clair : « + Créer « Miel » (stock à zéro) », sous-ligne « sucre : à l'ébullition ».
- mv7-miel-1280-clair : même, en 1280.
- mv7-miel-390-cave : même, en cave.
- mv7-miel-1280-cave : même, en cave 1280.
- br11-dext-390-clair : « Dextrose » (5 kg, sucre) avant « Carapils » (1,2 kg), « Dext » surligné.
- br11-dext-1280-clair : même ordre en 1280.
- br11-dext-390-cave : même ordre, en cave.
- br11-dext-1280-cave : même ordre, en cave 1280.
- m4-mv8-390-clair : Coriandre 0,05 kg, pastille « ? », « 1 couleur à renseigner », alerte épice ; EBC affiché « — ».
- m4-mv8-1280-clair : même, en 1280 ; teinte masquée.
- m4-mv8-390-cave : même, en cave.
- m4-mv8-1280-cave : même, en cave 1280.
- m4-teinte-390-clair : Malt noir 2,5 kg, EBC 169,5, alerte « Teinte 169,5 EBC … (40 SRM ≈ 79 EBC) », bascule « Noire ».
- m4-teinte-1280-clair : même, en 1280 ; « 169,5 EBC › » sur la bascule.
- m4-teinte-390-cave : même, en cave.
- m4-teinte-1280-cave : même, en cave 1280.
- te17-fruit-390-clair : Purée de mangue (Fruit), « J+3 · 90 % ferm. », plateau fermentation « J+ 3 » sur J0 J7 J14.
- te17-fruit-1280-clair : même, en 1280.
- te17-fruit-390-cave : même, en cave.
- te17-fruit-1280-cave : même, en cave 1280.

Doute : le « 1400 » saisi donne 169,5 EBC au mélange (valeur calculée), pas 1400 ; c'est le texte d'alerte qui est testé. Relevé te17 « J+390 % ferm. » = concaténation du sélecteur, pas un défaut visible. Attribution du commit : ligne Co-Authored-By Haiku 5.5 (le système le demande) au lieu de la ligne Opus de COMMUN.md.
