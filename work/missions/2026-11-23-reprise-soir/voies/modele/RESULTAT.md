OK — banc par modèle 200 suites × 3 graines vert ; T29-8, paysage, T32-1 (re-choix) corrigés ; T29-6, T29-2 reste, T32-1 (en-tête) en décision

## Fait (commit 38ea8418f, par chemins)
- e2e/calendrier/etat-coherent.spec.ts : I0 accepte « N ans ½ » (2 à 10 ans) ; `lireDuree` lit « 2 ans ½ » (2,5 × 52,18 sem.) ; I1 en années : ¼ d'an (14,5 sem.) d'écart permis, mesuré sur le cadre exact (`data-cadre-du/au`) quand l'en-tête l'expose.
  Cause du rouge de la graine -2119159308 : `libelleDuree` (T29-12, voulu par le brasseur : « 2 ans ½ », « 5 ans ») arrondit au demi-an, le quart vers le bas, donc 5 ans pour 4,78 à 5,28 ans ; le banc tolérait 9 sem. et ne lisait pas « ½ ». Ce n'était pas un défaut du réducteur : le contrat banc ↔ libellé n'avait pas été rejoué après fix29. L'arrondi lui-même n'est pas changé (le brasseur l'a demandé).
- src/ui/calendrier/cadre/etat.ts : action `app` en paysage met `avantPaysage` à la période choisie (le retour en portrait rendait l'ancienne : risque 2 de la relecture).
- src/ui/calendrier/cadre/useCadre.ts : T32-1 (partie « régler à nouveau cette même période ne recadre pas la frise ») : le cadre se pose sur la période de l'app à chaque choix (nouvelle valeur de l'App, même identique) ; changée, la fenêtre gardée pour elle revient comme avant.
- src/ui/calendrier/entete/BandeSemaines.tsx : T29-8 : à l'An (390 px, un mois ≈ 30 px, « 2027 » ne tient pas), janvier dit « ’27 » ; « 2027 » entier quand il tient. Le test existant de T29-8 (7,5 px la semaine, étiquette 14 px) ne mesurait pas la vraie largeur (étiquette « S53 » = 28 px).
- tests/unit/calendrierModele.test.tsx (7 tests) : contrat libellé ↔ cadre (fast-check 105 à 520 sem.), T29-8, paysage, T32-1.

## Preuves
- Rouge avant, vert après (correctifs retirés par `git apply -R`, puis remis) : tests-rouge.log = 3 échecs (T29-8 « N D J F M A M J J A S O » sans ’27 ; paysage « 2026-11-23 » au lieu de « 2027-02-01 » ; T32-1 « 2027-03-01 » au lieu de « 2026-12-14 ») ; tests.log = 7 passés.
- Tests calendrier (20 fichiers) : tests-calendrier.log = 305 passés.
- tsc (tsc.log) : 2 erreurs, toutes deux déjà là et hors de ma voie (seedData.ts GanttTask ; enregistrerPwa.ts virtual:pwa-register). Aucune neuve.
- Graine -2119159308, 5 suites (la 5e était la rouge), build neuf de lot-cal à 38ea8418f : `1 passed (58.8s)` (graine-rejeu.log).
- 200 suites × 3 graines : voir « Verdict du banc » plus bas.

## Non fait, hors de mon périmètre (OWNS)
- T29-6 (barre tenue au bord, posée hors du cadre / hors de l'écran) : la logique est dans CalendrierTab.tsx (`defilerFenetre`) et Barre/usePointeur, pas dans cadre/** ni entete/**. De plus « la fenêtre grandit d'une semaine à chaque pas, jusqu'à 6 mois » est la règle choisie CAL-BARRE-BORD (« une barre tirée hors du cadre agrandit l'échelle »). Les e2e L-1 et L-8 (barre-bord.spec.ts) gardent « posée où c'était annoncé ». Voir la décision.
- Reste de T29-2 / T32-3 (› puis ‹ sur une plage de 4 ans : 24.11.27–23.11.31, ‹ ne revient pas au 01.01.24) : l'app a déjà ramené la plage 01.01.24 à 24.11.23 (début de l'horizon) avant que › ne glisse ; `pas` et `ChoixPlage` sont dans src/components/periode/ (hors OWNS).
- T32-1, partie « l'en-tête de l'app dit toujours 14.12–27.12 alors que la frise est ailleurs » : voir la décision.

DÉCISION À PRENDRE : T32-1 demande « un seul état : l'en-tête dit le cadre de la frise ». Le brasseur a dit le 22.11 (CAL-PERIODE-APP-FIXE) : « Cette période là reste fixe, le reste peut être mobile » : les gestes de la frise ne changent pas la période de l'app. Options : (A) garder la période de l'app fixe, comme il l'a dit, et ne corriger que ce qui est un vrai défaut (re-choix recadre : fait) ; (B) la pastille de l'app suit la frise (contredit sa phrase). Recommandation : A, et lui montrer le cas en mini maquettes si T32-1 est maintenu.
DÉCISION À PRENDRE (T29-6) : confier à la voie qui possède CalendrierTab.tsx / Barre un plafond de défilement (« mesuré ») au bord, et la pose dans le cadre visible ; cela touche CAL-BARRE-BORD (son choix) : à lui montrer avant.
CONNAISSANCE : `libelleDuree` en années arrondit au demi-an le quart vers le bas : le libellé s'écarte jusqu'à ¼ d'an (14,4 sem.) du cadre ; tout banc qui compare libellé et cadre l'accepte.
LEÇON PROPOSÉE : (relecture-frise l'a déjà dite) rejouer etat-coherent.spec.ts dans la même voie que tout changement de libellé de durée ; et un test de largeur d'étiquette se fait avec la vraie mesure (« S53 » = 28 px), pas avec une maquette à 14 px.


## Verdict du banc (build neuf lot-cal à 38ea8418f, spec à 865efdb5b, android-390, ETAT_RUNS=200, ETAT_SHRINK=1)
- graines -2119159308, 4444, 7 : chacune `1 passed (33.0m)` (modele-200-graine1.log, 2.log, 3.log).
- Premier essai (essai1/) : graine 1 verte ; graines 4444 et 7 rouges sur I1 « 22 mois » / « 13 mois » : l'étiquette en mois entiers ajoutait un mois à chaque bout (cadre lu 104,3 et 65,3 sem. au lieu de 95,6 et 56,4). Cause dans le banc ; I1 des « N mois » mesuré sur le cadre exact (commit 865efdb5b) ; trois séries rejouées en entier : vertes. Essais : 2 sur ce critère.

PRÊT À METTRE EN LIGNE 865efdb5b