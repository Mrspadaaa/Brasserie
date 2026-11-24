OK — K57-1 (défilement du cadre plafonné à 8 col./s) et K57-2 (fin de barre suit le déplacement du doigt) corrigés ; PRÊT À METTRE EN LIGNE 17699c407

## État de l'art (L29)
Aucun algorithme neuf : un plafond de vitesse (le même que les barres) et une correction de prise (décalage constant doigt → bout, méthode standard du glisser : « offset de saisie », R2 du module geste). Pas de bibliothèque utile.

## Plan (cause, fichier:ligne, correctif)

- K57-1, règle : tout défilement au bord du Calendrier a la même vitesse plafonnée (8 colonnes/s), une borne, et rien après le lâcher.
  - Cause : `Fenetre.tsx` `bord` du cadre faisait grandir la vue par `span × (1 + vitesse × 0,6 × dt)` : croissance EXPONENTIELLE (vitesse ×2,5 depuis Q4-1 : ×7 par seconde à 4 px) ; seul le plafond de la courbe (1,3 × total) l'arrêtait. Le corps (`s.pan += vitesse × span × dt`) et `DureeFenetre.tsx` (`pas = vitesse × span × dt`, durée de la fiche) n'avaient aucun plafond ; seules les barres (`usePointeur.ts` `colonnesParImage`) en avaient un.
  - Correctif : `frise/defileBord.ts` : `COLONNES_MAX_PAR_S = 8` (déménagé, usePointeur le réexporte), `plafondFenetre(span0, dt)` = 8 × max(1, span0/6) × dt (une colonne = le sixième de l'échelle prise au début du geste, comme les 6 colonnes de la frise). Appliqué aux 3 endroits : cadre (grandir ET corps, `Fenetre.tsx`), durée (`DureeFenetre.tsx`). Croissance linéaire ; la borne de la plage de l'app (`poserPlage`, `total`) est gardée.
- K57-2, règle : saisir une poignée ne change rien ; le bord suit le DÉPLACEMENT du doigt depuis le point de prise.
  - Cause : `usePointeur.ts` `joursDe` : `joursJusquAuDoigt(axe, xPrec + corr, bout)` : le bout allait au jour sous la position ABSOLUE du doigt ; `corr` (POI-1) ne rattrapait que l'écart à la zone d'avant (22 px), pas l'écart au bout : doigt à 15 px → saut de 2 jours, à 30 et 60 px → 3.
  - Correctif : `entete/alignement.ts` `correctionAuBout(axe, x0, bout)` = x du milieu du jour du bout − x de la prise ; posé comme `corr` à la prise (fin, début, jalon) dans `onPointerDown`. Le drapeau du toucher bref de la part rentrée est séparé (`rentree`).
- Endroits semblables (grep) : `joursJusquAuDoigt` (un seul appelant), `vitesseCalendrier` (3 appelants, tous plafonnés), poignées de `src/ui/geste` (partagé, non touché : le cadre et la durée y passent par `bord`, plafonné chez eux).

## Fichiers écrits
- src/ui/calendrier/frise/defileBord.ts, usePointeur.ts, DureeFenetre.tsx ; src/ui/calendrier/entete/Fenetre.tsx, alignement.ts
- tests/unit/k57PoigneeFenetre.test.tsx (42 tests) ; lignes K57-1 et K57-2 de work/missions/BUGS.md (« corrigé en local 17699c407 », commit du registre à part)
- journaux : tests-rouge.log, tests.log, tests-large.log, proprietes.log, tsc.log

## Preuves
- Tests AVANT le correctif, lancés rouges : 18 échecs sur 42 (tests-rouge.log) : k = 2 puis 3 jours de saut aux prises 15, 30 et 60 px (bord droit et gauche), « 261 semaines, plafond 42 », « 1 s : +54, 2 s : +253 » (exponentiel), `plafondFenetre` absent. Les 24 verts sont des gardes (prise à 4 px, borne de l'app, toucher bref).
- Après : `k57PoigneeFenetre` 42/42 ; les 33 fichiers calendrier/frise/en-tête/ChoixDate : 546 verts, 1 ignoré (tests-large.log) ; `tests/unit/proprietes` 8 fichiers, 76 verts ; tsc : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register) ; `controle-bugs.mjs` : BUGS OK (2256 bugs).
- Essais : 2 passes de tests (un plafond de test trop juste : 43 > 42, marge portée à +4 pour le premier déplacement et l'arrondi à la semaine). Un correctif par règle.

## Doutes et limites
- Rien vu en vrai rendu (consigne : pas de capture locale) : le test d'écran en ligne reste à faire par le pilote et le critique. À sentir : poignée de fin du cadre tenue à 4 px du bord droit 2 s (attendu : ~+30 semaines, pas 144) puis lâchée ; barre ZZ finissant au bord droit, doigt à 15, 30, 60 px du bout, 6 à 8 px de mouvement (attendu : au plus un jour) ; bord gauche pareil.
- Vitesse : à 4 px, le cadre part de 8 sem. et ajoute ~16 sem./s (colonne = sixième de l'échelle de départ, ~12 sem.) ; l'ancien (avant Q4-1) à 30 px de profondeur montait de 9 à 27 en 2,1 s : même ordre. Si le brasseur la trouve encore trop rapide ou lente, un seul réglage : `COLONNES_MAX_PAR_S` / `COLONNES_PAR_ECRAN` (defileBord.ts).
- Le corps du cadre (défilement de la fenêtre entière) est plafonné à 1,33 échelle par seconde (8 colonnes d'un sixième) : au plus l'ancien maximum (1,35), sous le nouveau ×2,5 (3,4) : ce déplacement à fond est un peu moins rapide que depuis Q4-1 ; la montée progressive reste.
- Le bout est lu au milieu de son jour : 4,6 px de mouvement à 6 sem. (65 px par colonne) changent la fin d'un jour (arrondi au jour le plus proche du déplacement) ; en 6 mois (2 px par jour), le premier jour de mouvement est atteint après 1 px, mais le seuil de 6 px (R1) de départ du geste reste.
- Une barre dont le bout est coupé par la fenêtre (le vrai bout hors écran) : `corr` du bout absent = repli sur l'ancien (rien tiré).

## DÉCISION À PRENDRE
aucune (le plafond du cadre est un réglage, reste à le juger en ligne).

CONNAISSANCE : le défilement au bord du Calendrier a un seul plafond, `plafondFenetre` / `COLONNES_MAX_PAR_S` (frise/defileBord.ts) : 8 colonnes/s, une colonne = le sixième de l'échelle prise au début du geste ; la prise d'un bord de barre se corrige par `correctionAuBout` (le bout part de son jour, le bord suit le déplacement).
LEÇON PROPOSÉE : un pourcentage appliqué à chaque image (`échelle × (1 + v × dt)`) est une croissance exponentielle : un plafond de vitesse se pose en unités par seconde, pas en pourcentage ; le ×2,5 de Q4-1 a révélé ce défaut dans le cadre faute de plafond de même nature (test : tenir 2 s, vérifier que la 2e seconde ajoute autant que la 1re).
