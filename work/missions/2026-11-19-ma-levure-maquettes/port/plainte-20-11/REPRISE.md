# REPRISE — plainte levure du 20.11 (tour 7 : plan A à D codé, vision en cours)

Arrêt au plafond de contexte (202 k). Diagnostic des 11 problèmes : inchangé, voir la liste ci-dessous (tour 6). Décision du pilote (20.11) :
« White Labs Munich Lager Yeast 500g » = brique SÈCHE de 500 g → grammes, besoin lager en grammes (≈ 22 g) comme repère, signal de sur-dosage ;
la branche « liquide écrite en grammes → packs » seulement pour une forme liquide.

Worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche `claude/port-carnet-1711`), RIEN COMMITÉ encore.
Commit par chemins seulement (d'autres sessions y ont des fichiers M), pas de push. Fichiers CRLF : Chart et YeastRecipePlan (garder CRLF).

## Fichiers modifiés (à moi)
- `src/ui/etapeLevure/dose.ts` : `poidsDuCatalogue` (poids dans nom/alias ; sert SEULEMENT à reconnaître une brique > 100 g), `formeDuCatalogue`
  (g/kg dans le nom ou pitchRate g/hL → sèche ; White Labs/Wyeast/Imperial/Omega/Escarpment sans poids → liquide), `CELLULES_PAR_G_SEC` exporté,
  `PACK_LIQUIDE_MD = 100`, `BesoinLevure.forme` et `.grammes` (sèche : cellules ÷ 13,04), liquide sans cellules → sachet `{unite:'pack', cellules:100, estime}`,
  `grammesAuChoix(g) = ceil(g − 0,05)` (22,01 → 22), `doseApresChoix` : brique → écrit `grammesAuChoix` g ; pack liquide estimé → n'écrit rien (la carte
  propose « Mettre N packs ») ; fiche résolue par `hopIndexId` (cache `yeastReferences([])`) quand l'appelant (BrewWizard l. 3132) ne la passe pas.
- `src/ui/etapeLevure/CarteDose.tsx` : `echelleGrammes`, `pasGrammes` (1 g ≤ 30 g, puis 5 g calés), mode `enG` (unite g + besoin.grammes) en repos /
  après / à choisir : repère « besoin lager 22 g », « sur-dosé · 5× le besoin » + remède « → 22 g », « Mettre 22 g », « % du besoin » ; repère
  « ≈ 13 Md/g à confirmer » ; `ecritsG` (liquide en g : « 112 g écrits · une liquide se compte en packs ») ; libre : ± sur champ ouvert écrivent
  (`onEcrire`), borne droite « fabricant ≥ N g » au lieu de « pas de repère » s'il y a un fabricant ; PuceStock `g` (« manque 23 g »).
- `src/ui/etapeLevure/MaLevure.tsx` : `forme`, `enGrammes`, `liquideEnGrammes`, `uniteBande` ; état de dose ; stock en grammes ; `ecrireDose` écrit `uniteBande`.
- `src/ui/etapeLevure/apercuDev.ts` : `recetteApercuMunich()` (29 L, OG 1,026, Munich 112 g, 19 °C·10 j → 4 °C·5 j).
- `src/ui/FermentationTemperatureChart.tsx` : brouillon = un `path[data-reference-path]` (2,5 px, dash 5 4), crans de 6 px en haut, étiquette
  `[data-reference-label]` « brouillon · fin J15 » avec liseré ; `horsPlage(step)` → trait + valeur `text-attention`, `data-hors-plage`, « 14,5 °C · sous la
  plage » si segment > 150 px ; liseré sur « plage levure » ; guide ↔ = `<g data-duration-guide>` coupé au bas du graphe.
- `src/ui/YeastRecipePlan.tsx` : ProgrammeSpark relié (V) ; alertes « 14.5 °C » → « 14,5 °C » (affichage ; la source est
  `functions/src/fermentationContext.ts` l. 52, hors voie : DÉCISION pilote) ; puce « À vérifier · <alerte hors plage d'abord> (+N) », ellipse en style inline.
- Tests : `tests/integration/etapeLevure/plainte2011.test.tsx` (13 tests, tous rouges sur b3af06b83, 13 verts après) ;
  `maLevure1911.test.tsx` LEV-6 mis à jour (brique : « besoin lager N g », « Mettre N g », « fabricant ≥ 13 g »).

## Preuves
- plainte2011 : 13/13 verts (avant fix6). Suite etapeLevure + levureMontage + Chart + YeastRecipeChoice + Workshop rejouée APRÈS fix6 : résultat dans
  `C:\Users\mrspa\AppData\Local\Temp\claude\2574149e6fd34767\16fc09ec-4e69-48a9-9744-5912b6ef6552\tasks\bua8hc5vn.output` (NON LU) ; avant fix6, 4 rouges
  (etapeDose ×3, LEV-6) que fix6 vise. `monkey.test.tsx` « atelier de l'eau, graine 42 » rouge (31,7 s, hors voie probable : à rejouer seul et sur HEAD).
- Vision : banc `C:/Users/mrspa/AppData/Local/Temp/ml-banc` (worktree détaché b3af06b83 + mes 6 fichiers + App.tsx du banc seul routant `&recette=munich`),
  vite sur 127.0.0.1:3127 ARRÊTÉ depuis (code 127) : le relancer depuis ml-banc (`npx vite --port 3127 --host 127.0.0.1 --strictPort`) avant le script. Script `plainte-20-11/vision-apres.mjs` → `apres/*.png` + `journal.json`. 1er passage (avant fix6) : 1280 deux thèmes OK
  (tous gestes : ± , remède, Caler à 11 °C, palier tiré ↕ ↔, changer pour Munich) ; 390 instable (rechargement vite à la 1re ouverture : refaire).

## Reste à faire
1. Lire bua8hc5vn.output ; corriger les rouges ; rejouer `tests/integration/monkey.test.tsx` seul (et sur HEAD si rouge).
2. CarteDose repos à 390 : la ligne déborde (« 112 g · sur-dosé · 5× le besoin [→ 23 g] [manque…] ») → en mode `enG`, ne pas répéter « 112 g · »
   (l'en-tête le dit) et, en sur-dosage, le remède REMPLACE la puce stock (comme l'état après) ; « ≈ 13 Md/g » en espaces insécables.
3. Recopier les 6 fichiers dans ml-banc, relancer `node vision-apres.mjs` (vite déjà chaud), ouvrir les captures 390/1280 × 2 thèmes (carte Munich repos,
   après +, remède, caler ; conduite US-05 tirée : brouillon, guide ↔, plage, « sous la plage », puce ; changer → Munich « Mettre 56 g »).
4. `npx tsc --noEmit` (sans nouvelle erreur) ; vitest final : etapeLevure, levureMontage, monkey (+ Chart, YeastRecipeChoice, Workshop).
5. Commit par chemins (les 6 src + 2 tests), message avec Co-Authored-By ; écrire `plainte-20-11/RESULTAT.md` (« combien et quels problèmes restent ? » :
   n° 6 et 7 non touchés par décision ; n° 5 : conduite ale gardée, « Caler à 11 °C » joué ; décimale à corriger à la source dans functions/src).

## Liste des 11 problèmes (tour 6, pour mémoire)
1 libre sans besoin ; 2 « couvre le fabricant » + « pas de repère » ; 3 + ouvre 113 sans écrire ; 4 sur-dosage muet ; 5 conduite ale pour une lager ;
6 fabricant sous la barre (D391, ne pas toucher) ; 7 floculation US-05 inconnue (donnée, hors voie) ; 8 brouillon illisible ; 9 J34,5 barré par le guide ↔ ;
10 « plage levure » barrée ; 11 palier hors plage muet + puce muette + « 14.5 » ; bonus spark « ▬ _ ».
