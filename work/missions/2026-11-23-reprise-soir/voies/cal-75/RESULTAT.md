OK partiel — CAL images 128→109 ms (médiane), ≤17 ms 0→7 % ; relâcher 339→315 ms ; ouvrir (tâche) 148→153 ms ; cibles non tenues ebdb57c0f

Cibles de DOSSIER.md : images au bord médiane ≤ 33 ms et 60 % ≤ 17 ms : NON (109 ms, 7 %) ; relâcher ≤ 100 ms : NON (315 ms) ; ouvrir tâche longue ≤ 200 ms : OUI sur ce poste (142 à 164 ms, déjà tenu avant : 145 à 152) ; vitesse de défilement 6,7 sem./s et bande de 72 px : gardées (7,2 sem./s mesurées, bande inchangée).
Le gain est réel mais petit (images −15 %, relâcher −7 %). Les cibles demandent de réduire le rendu React de tout l'onglet à chaque image, ce qui n'a pas été fait (voir « Reste »).

## Mesures (scripts/mesure-calendrier.mjs, même build minifié de la fixture, processeur ×6, 390×844 tactile, mon onglet du Chrome 9222)
Deux séries de 4 essais par build, jouées à tour de rôle (le poste est bruité : une première série a donné 3 s à l'ouverture, écartée). Avant = HEAD sans cal-75 (83d0b18e1 + c74-fix) ; après = ebdb57c0f.
| mesure (médiane des 4 essais) | avant série 1 / 2 | après série 1 / 2 |
|---|---|---|
| Bord, image médiane | 123 / 134 ms | 114 / 104 ms |
| Bord, images ≤ 17 ms | 0 / 0 % | 8 / 7 % |
| Bord, images ≤ 50 ms | 8 / 0 % | 17 / 22 % |
| Bord, image moyenne | 174 / 188 ms | 138 / 129 ms |
| Bord, pire image | 309 / 297 ms | 288 / 245 ms |
| Bord, défilement | 7,0 / 5,8 sem./s | 7,2 / 7,2 sem./s |
| Relâcher, image gelée | 348 / 339 ms | 306 / 324 ms |
| Ouvrir, jusqu'au cadre | 710 / 716 ms | 745 / 739 ms |
| Ouvrir, tâche longue max | 145 / 152 ms | 164 / 142 ms |
Un essai isolé après un seul correctif avait donné relâcher 391 → 261 ms (--cw seul) : les séries longues, plus fiables, donnent −7 %. Ouvrir ne bouge pas (hors bruit : +4 % sur le temps jusqu'au cadre, à surveiller).
Les chiffres de cal-74 (126 ms, 17 %) ne se comparent pas : le poste était moins chargé ; seuls les « avant » de cette voie, rejoués à tour de rôle, comptent.
Profil CPU du bord (non minifié, ×6) : mises en page forcées (`getBoundingClientRect` inclusif) 458 → 98 ms sur 2 s ; JavaScript 1 706 → 1 053 ms ; mais le temps « natif » (style, mise en page, peinture, GC) monte 885 → 1 618 ms : le fil principal reste saturé (2,6 s de travail pour 2 s de mesure). Le gain en JS est repris en grande partie par le navigateur.

## Ce qui a été trouvé et corrigé (trace Chrome et profil V8, L29)
Problème type : style recalculé en entier par une variable CSS custom qui change à chaque image, et lectures de mise en page forcées. Méthode standard suivie : une lecture par geste, écritures groupées, mémoire des calculs purs, planificateur espacé ; bibliothèque : aucune (rien à ajouter).
1. `--cw` posée sur chaque `<section class="cal-rangee">` (Rangee.tsx) : une variable CUSTOM qui change à chaque image du défilement (la fenêtre grandit) refaisait le style de tout le sous-arbre de chaque rangée. Sonde (×6) : une seule variable custom sur l'onglet = 64 ms, une insertion ou un `left` = moins de 2 ms ; trace du bord : 4 recalculs de ~1 400 éléments (87 à 139 ms) en 2 s. Or `--cw` ne sert qu'au quadrillage de `.cal-lane`, supprimé sur l'axe partagé (`.cal-frise--axe .cal-lane { background-image: none }`) : elle n'est plus posée quand `lineaire`. Recalculs ensuite : 4 de 590 à 910 éléments → 2 à 3 de 430 à 590.
2. `cadreDe` et `axeDuMoment` (usePointeur.ts) lisaient le cadre toutes les 250 ms ; chaque lecture forçait la mise en page de tout l'onglet (394 ms sur 2 s). Lus maintenant UNE fois par geste (cache lié à l'objet du geste, remis à zéro au `pointerdown`).
3. Pastille du creux (EnTete.tsx `juger`) : trois `offsetWidth` puis `flushSync` (rendu synchrone de tout l'onglet) à chaque image : 311 ms sur 2 s. Elle passe par `creerPlanificateur(250)` (première demande à l'image suivante, dernière toujours servie).
4. Bulle « lâcher ici » (Rangee.tsx) : espacement 120 → 300 ms ; `placerBulle` ne compare plus chaque position de côté à tous les murs et obstacles, mais seulement à ceux à la hauteur de la place (même résultat : `croise` et `surface` valent 0 sinon ; test de valeur). 129 → ~60 ms sur 2 s.
5. `courbeSans` (calendrierCaisse.ts) mémorisée par courbe (WeakMap) : la courbe sans la chose tenue est la même à chaque image du glisser.
6. Graduations de l'axe (Frise.tsx) : clé de rang au lieu de la position : 40 démontages et remontages en 2 s au bord.
Aucun changement visible : captures du geste ouvertes (390 avant et après, 1280 ×1) et de l'état après relâcher (390 avant et après, identiques, bandeau « Annuler » compris). À ×6 les deux builds montrent en plein geste des textes qui se chevauchent un instant (pastille « +3 580 estimé » sur « Jhhh · coût à venir » avant ; « La Cigogne » sous « Fruty » après) : retard de placement des noms de 250 ms déjà présent avant (cal-74), pas une régression de cette voie.

## Reste (la voie ne tient pas ses cibles)
- Le rendu React de tout l'onglet par image : 610 ms de rendu sur 2 s au bord (Rangee 135, Courbe 84 dont `placerNoms` 75, Barre 49, CalendrierTab 39, Frise 31, useDonneesCalendrier 25), 518 ms de commit ; 1,2 à 1,5 mises à jour du DOM par image (mesure ajoutée au script). Pistes, par gain attendu : (a) mémoïser `Rangee` et `Barre` par rangée avec une fenêtre en refs et non en props ; (b) `placerNoms` hors du rendu de la courbe, réutilisé 100 ms pendant le tirage ; (c) un seul rendu par image pour « défilement + `onGlisse` » ; (d) `mesurerTraits` (Frise, `getBoundingClientRect` des fils après chaque image) espacé comme la pastille : 59 ms sur 2 s, non fait pour ne pas laisser un fil mal placé pendant le geste. Aucune n'est un changement de quelques lignes : à confier à une voie dédiée avec son budget.
- Relâcher : `placerMessage` (bandeau Annuler, 160 à 190 ms au profil) se refait à 0, 150, 500 et 1000 ms ; non touché (Message.tsx, rendu visible).
- Option écartée sans mesure favorable : retirer les règles CSS `:has()` (mesuré : aucun effet sur les images), `container-type` des barres (aucun effet).

## Outils ajoutés à scripts/mesure-calendrier.mjs (sans toucher au dépôt)
`--trace` (durées Layout/UpdateLayoutTree/Paint, éléments recalculés par recalcul, invalidations), `--css "<règles>"` et `--sans "<regex>"` (ajouter ou retirer des règles CSS pour mesurer leur coût), `--vue 1280x800`, comptage des mises à jour du DOM pendant le bord ; repart d'une fixture neuve à chaque essai (avant, le deuxième essai ne retrouvait pas « Hefe » déplacée).

## Fichiers écrits
Code : `src/ui/calendrier/frise/{Rangee,Frise,usePointeur}.ts(x)`, `src/ui/calendrier/entete/EnTete.tsx`, `src/domain/calendrierCaisse.ts`. Test : `tests/unit/cal74Regles.test.tsx` (24 tests ; garde du cadre mise à jour, 5 tests neufs : `--cw`, graduations, pastille, `courbeSans`, bulle). Outil : `scripts/mesure-calendrier.mjs`. Commit `ebdb57c0f`, par chemins ; pas de déploiement.

## Critères
- `npx tsc --noEmit` : 2 erreurs connues seulement (`seedData.ts` GanttTask, `virtual:pwa-register`).
- Tests : 34 fichiers, 456 verts (cal74Regles, k57PoigneeFenetre, virgule-transversale, tests/unit/calendrier*, calFrisePrixNoms, calCourbeV10, bugsWorkflowsCalendrier, ct4Calendrier*, defileBordCalendrier, ecr3/ecr4*, courbeEtiquettes, enTeteOgHorsBornes, todoTimelineFrise).
- Essais : sept builds de mesure, une douzaine de profils et traces ; aucune donnée réelle, aucun appel IA.

## Doutes et limites
- Le poste est bruité (autres agents) : écart entre deux séries identiques jusqu'à 10 % ; lire les gains en tendance, pas à la milliseconde.
- Retard de 250 ms (rentrée de toucher, noms tus sous poignée), 250 ms (pastille du creux), 300 ms (bulle entière) : voulu, la dernière valeur est toujours posée.
- Le cadre de la frise n'est plus relu pendant un geste : une rotation de l'écran en plein geste n'est pas prise en compte jusqu'au geste suivant.

DÉCISION À PRENDRE : lancer une voie « rendu par image » (mémoïser Rangee/Barre, placerNoms, un rendu par image) pour les cibles 33 ms / 60 % ; je la recommande, avec un budget propre, avant de juger la lenteur au bord en ligne.
CONNAISSANCE : une variable CSS custom posée sur un conteneur et changée à chaque image refait le style de tout son sous-arbre (64 ms pour une variable sur l'onglet à ×6) ; une propriété posée sur la feuille (barre) ne coûte rien. Sonde reproductible : mutations isolées, mesurées par `document.body.offsetWidth`.
LEÇON PROPOSÉE : avant de corriger une lenteur, séparer par une trace (`--trace`) le JavaScript, le recalcul des styles et la mise en page, et chercher dans la trace le nombre d'éléments recalculés par recalcul : un recalcul qui touche presque tout le document dit une variable custom ou un attribut posé trop haut, que le profil JavaScript ne montre pas.
