OK — CT4-B-1, 2, 3, 7, 8, 9, 10, 11 corrigés ; tour 2 (k4 n° 1, 2, 3, 9) corrigé, B-7 prouvé replié/déplié ; tests verts

# Voie ct4a

## Verdicts (format verdicts.mjs)
- CT4-B-1 | corrigé | a82d1b99a | tour 2 (k4 n° 1) : sans dose écrite, la tuile Ensemencement et la ligne « Sortir la levure » disent le besoin chiffré de l’étape Levure, calculé par la même fonction (`besoinDeLaLevure`) : « cible 18 °C · besoin 1,4 sachet · à écrire » ; avec fiche liée (`doseConseillee`) « 2–3 sachets · à écrire » (test sur US-05 hopIndexId) ; sans volume ni densité « dose à écrire ». Dose écrite inchangée (5934239b9). Captures : k4/captures/jourj-ensemencement-{390,844,1280}-{clair,cave}.png et jourj-sortir-… (ouvertes). Fiche liée non capturée : le banc BrewPreview (hors voie) n’a pas de hopIndexId, preuve par test.
- CT4-B-2 | corrigé | 93475dc93 | en-tête de la fiche : `volumeEnCuveLibelle` = volume brassé (29 L, comme la liste) sinon « visé 20 L ». Capture : captures/mesures-clair-1280.png (« LOT-041 · cuve · 29 L »), idem cave.
- CT4-B-3 | corrigé | fbdd7797b | EtapeRecap.tsx : à côté de la quantité, « 81 % du besoin » quand la dose écrite (sachet, pack ou g) couvre moins que `besoinDeLaLevure` (même calcul que la carte de dose de l'étape Levure) ; rien si ≥ 100 % ou si le besoin est inconnu (jamais 0 %) ; la coche « Enregistrable » reste. Test : bugs-ct4a-CT4-B-3-7 (1 sachet → « % du besoin » < 100 ; 5 sachets → aucune mention ; rouge avant le correctif). Captures : captures/recap-levure-{clair,cave}-{390,1280}.png (« SafAle US-05 1 sachet 81 % du besoin », ouvertes).
- CT4-B-7 | corrigé | fbdd7797b | YeastRecipePlan.tsx : « Vide = inconnu, distinct de 0 j. » retiré (le placeholder « inconnue » le dit) ; « Pas une fin de fermentation attestée » replié sous « Ce que « fin de consigne » veut dire » ; le décalage des jours suivants replié sous « Décalage des phases suivantes » ; l'alerte orange « Quantité de levure sèche à renseigner… » filtrée dans `yeastWarningsForReading` (la carte de dose dit « aucune dose écrite · Mettre 2 sachets »). Domaine non touché. `<p>` devenu `<div>` (un `<details>` ne se met pas dans un `<p>`). Tests : bugs-ct4a-CT4-B-3-7 (3 tests, rouges avant) et tests/ux-mobile/fermentation (`data-following-shift`, vert). Captures : captures/conduite-levure-{clair,cave}-{390,1280}.png (carte de dose sans alerte orange ; les plis eux-mêmes se voient dans la première prise, dépliés à la main : titres « Décalage des phases suivantes », « Ce que « fin de consigne » veut dire »).
- CT4-B-8 | corrigé | a82d1b99a | tour 2 (k4 n° 2, 3) : aucune valeur de densité ne chevauche un bord pointillé de la colonne « auj. » (place choisie : droite, au-dessus centrée, gauche ; 1,012 centré au-dessus à 1280, à droite hors colonne à 390) ; « consigne » ne se pose plus sur « Fermenter 19 °C » : quand les deux se touchent (390), le mot passe à la légende « °C cuve · tirets : consigne ». Tests : bugs-ct4a-t2 (8, rouges avant). Captures : k4/captures/mesures-{clair,cave}-{390,1280}, mesures-auj-…-{390,844,1280}, mesures-844-{clair,cave}, saisie-844-{clair,cave} (ouvertes).
- CT4-B-9 | corrigé | 731f62993 | FicheFermentation.tsx : `gridTemplateColumns` = `minmax(0,1fr)` quand il n'y a aucun houblon (plus de colonne de 23 rem vide). Captures : mesures-clair-1280.png, mesures-cave-1280.png (courbe sur toute la largeur). Tour 2 (k4 n° 9) : l’alcool s’écrit toujours avec une décimale, « 7,0 % » (la valeur est 6,96 % par la formule de la fiche `alcoholByVolume`, pas 6,8 % : le × 131 est une approximation ; seule la décimale « ,0 » se perdait par `nombreFr`).
- CT4-B-10 | corrigé | 731f62993 | `ChampTemp` : sans valeur, le pouce est masqué (`data-sans-valeur`), un toucher au départ pose la valeur du curseur. Captures : saisie-{clair,cave}-{390,1280}.png (« non relevée », pas de pouce).
- CT4-B-11 | corrigé | 731f62993 | modele.ts `plageFgDeLaLevure` (même calcul que RecipePage : `projectYeastRecipe` + `resolveFermentationYeast`), BatchDetailSheet.tsx passe `fgPlage` à `PanneauMesure` : « FG 1,012–1,014 · plage de la levure » + bande tracée. Captures : saisie-*.png.

## Fichiers écrits
Commités : src/pages/BrewDayPage.tsx, src/ui/BatchDetailSheet.tsx, src/ui/production/fermentation/{GrapheTemps,FicheFermentation}.tsx, modele.ts, src/ui/recap/EtapeRecap.tsx, src/ui/YeastRecipePlan.tsx, tests/unit/bugs-ct4a-CT4-B-{1,2,3-7,8-11}.test.ts(x), tests/integration/brewPageK4/K5/brewJourP3.test.tsx. Banc (non livré) : voies/ct4a/banc/ (banc-main, recap-main, recap.html, capturer.mjs, capturer-b37.mjs), captures/ (22 PNG), tests.txt.
`yeastRecipeDesign.ts` et `YeastRecipePlan.ts` : non touchés (inutile ; `YeastRecipePlan.ts` n'existe pas).

## Tests
tests.txt : 12 fichiers, 119 tests verts. Rejoués aussi : recapM2 + ux-mobile/fermentation (verts), YeastRecipeChoice*, FermentationWorkshop, YeastRecipePlanSafety (3 fichiers, 94 tests verts). `tsc --noEmit` : aucune erreur sur les fichiers touchés.

## Tour 2 (CORRECTIONS-ct4a, commit a82d1b99a)
- n° 1 : voir CT4-B-1. n° 2 et 3 : voir CT4-B-8. n° 9 : voir CT4-B-9 (décimale).
- Défaut de mon tour 1 trouvé et corrigé : BatchDetailSheet posait un `useMemo` (plage de FG, CT4-B-11) après son retour anticipé : « Rendered fewer hooks » à la fermeture de la feuille (dashboardNavigation rouge). Remplacé par un cache `WeakMap` sans hook ; test bugs-ct4a-t2-hooks (rouge avant).
- B-7 prouvé : conduite-{replie,deplie}-{390,1280}-{clair,cave} ; au repos aucun « Vide = inconnu », « Pas une fin de fermentation attestée » ni « Jours de début suivants vs brouillon » (innerText de la page : []) ; dépliée, les deux plis « Décalage des phases suivantes » et « Ce que « fin de consigne » veut dire » se lisent.
- Fiche brassin et saisie à 844×340 : captures/mesures-844-*, saisie-844-* (k4/captures). À 844×340 la feuille défile ; `DO 1,064` passe sous l’en-tête collant (défilement, pas un défaut de dessin).
- Échec voisin hors voie, présent aussi avant mon tour 1 (BrewDayPage à 5934239b9~1) : tests/integration/yeastPitchingExecution.test.tsx, 2 tests (« /^Levure ·/ » introuvable, culture sans dose, qty 0). À ouvrir par le pilote.

## Doutes
- Défaut voisin non compté : sur 1280 clair avec un relevé du jour, « 1,012 » touche le trait pointillé droit de la colonne « auj. » (lisible grâce au halo) ; sur 390 la colonne « consigne » touche « Fermenter 19 °C » (fixture). Hors ids.
- Dans l'éditeur du jour J, le choix prérempli « 1 sachet » du sélecteur de levure est un geste du brasseur, pas un affichage : non touché.
- Captures B-7 : la prise par défaut tombe en haut de l'étape (carte de dose) ; les plis repliés ne sont lisibles que dans la prise intermédiaire dépliée à la main. Preuve du pli = test sur le source + test ux-mobile.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un bloc heredoc Bash perd encore les `\d` et `\\?` (vu 2 fois dans cette voie) : écrire les scripts de remplacement avec Write.
