ECHEC — rejeté : le test par modèle (200 suites demandées) est ROUGE sur HEAD fd27f22e5 dès la 5e suite ; l'écart tient au libellé T29-12 non aligné avec le test, mais « robuste, sans bug » n'est pas prouvé

## Réponse à la question du brasseur (courte)
- Librairie : oui, d3-scale `scaleUtc` + d3-time `utcMonday/utcDay` (temps.ts:1-80, `echelleDeVue`, `axeDeLEchelle`) ; le réducteur de l'état (etat.ts) est écrit à la main, pur, testé par modèle (calendrierCadre.test.ts : 26 tests unitaires verts rejoués) et par fast-check côté e2e.
- Même écran, mêmes fonctions : les 26 fonctions d'état de l'inventaire sont présentes, 0 PERDUE (table ci-dessous). Les 14 lectures (B) : fichiers non touchés par D444 ou changés seulement par fix29 (voir B).
- Robuste, sans bug : non prouvé (risques ci-dessous), mais aucun des 12 constats T29 n'est une régression du nouveau cœur.

## 1. Test par modèle (lot-cal, HEAD fd27f22e5, build neuf des 38 s, android-390, ETAT_RUNS=200)
Sortie : modele.log. ROUGE à la 5e suite (fast-check s'arrête au premier échec).
- Graine : seed -2119159308, path "4" (ETAT_SEED=-2119159308).
- Suite : `cadre -57` → `poignée fin tenue au bord 5358 ms` → `cadre -23` → `recharger`.
- Invariant violé : I1 « durée « 5 ans » ≠ cadre 269.6 sem. », étiquette « mai 2026 – juin 2031 », app « Nov. ».
- Cause : `libelleDuree` (Fenetre.tsx:28-32, ajouté par fix29 pour T29-12) dit « 5 ans » de 4,78 à 5,28 ans (±13 sem.) ; le test tolère ≈ 9 sem. sur une étiquette en mois. Et `lireDuree`/I0 du test (etat-coherent.spec.ts:41-48, :84) ne connaissent pas « 2 ans ½ » : un cadre de 2,5 ans lit 104 sem. au lieu de 130. Le test n'a pas été rejoué après fix29. DÉFAUT du livrable : un banc rouge sur HEAD.
- Rejeux avec lecteur/tolérance alignés (copie zz-relecture-modele.spec.ts, retirée à la fin) : modele-tolerance-1/2-*.log = deux faux rouges de mon propre patch (lecteur sans « ½ », puis regex mal échappée) ; modele-tolerance.log = dernier essai : voir « Rejeu final » plus bas.

## 2. T29-1 à T29-12 : régression du nouveau cœur ou défaut ancien ? (lecture de 06c430228)
| T29 | verdict | preuve sur 06c430228 |
|---|---|---|
| 1, 2 | défaut ancien | `fenetreDePeriode` ancien (Fenetre.tsx:32-54) identique ; horizon `semainesPassees()` fixe (useDonneesCalendrier.ts:88, `HORIZON_SEMAINES + passe`), plage avant l'horizon posée à son début (CHV-4). Fix29 : horizon étendu à la période (semainesPassees/Avenir, SEMAINES_MAX 520) |
| 3, 5 | défaut ancien | `onSixSemaines` à l'appui long d'une marque (Rangee.tsx:1039 ancien) |
| 4 | défaut ancien (Bord) | hors frise |
| 6 | défaut ancien | usePointeur.ts:385 ancien : vitesse non plafonnée ; fix29 `COLONNES_MAX_PAR_S = 3` |
| 7, 8, 10 | défaut ancien | années sur la bande et sur les pastilles absentes de BandeSemaines/Rangee anciens |
| 9 | défaut ancien | `vide = dedans.length === 0` (Rangee ancien) ; fix29 `rangeeVide` |
| 11 | défaut ancien | « ‹ auj. » était un `<span>` (EnTete.tsx:847 ancien) ; fix29 : bouton + action `aujourdhui` (etat.ts:148-151) |
| 12 | défaut ancien | `libelleDuree` ancien : « N mois » (ancien :62) ; fix29 : années au demi-an, mais voir test rouge |
Aucune régression du cœur parmi les 12. Aucun n'est prouvé corrigé en ligne (critique au tour 32).

## 3. Table d'inventaire — ancien | nouveau | verdict (les 26 de la partie A)
| # | ancien | nouveau (fichier:ligne) | verdict |
|---|---|---|---|
| A1 | effets CalendrierTab (periodeLocale) + EnTete (fenetre) | etat.ts:137-145 `app` ; useCadre.ts:49-56 | gardée |
| A2 | `fenetreDePeriode` → null | etat.ts:141 | gardée |
| A3 | CHV-4 EnTete effet | temps.ts `fenetreDePeriode` (même formule que Fenetre.tsx ancien :43) + etat.ts:143 | gardée |
| A4 | MOIS_MIN_SEMAINES | temps.ts (min 4 si genre mois) | gardée |
| A5 | lire/ecrireFenetreLocale, même clé | useCadre.ts:14-22, 62-66 (clé et forme identiques) | gardée |
| A6 | CHN-6 | etat.ts:152-153 `centrer` (éphémère) ; useCadre.ts:66 ne l'écrit pas | gardée |
| A7 | choisirDuree | etat.ts:154-158 | gardée |
| A8 | `vue='annee'` + fenAvantAnnee | etat.ts:159-164 ; L-10 dérivé seulement à l'initial (etat.ts:203) | changée (risque 1) |
| A9 | quitterAnnee | etat.ts:165-166 | gardée |
| A10 | fenAvantAnnee à la durée | etat.ts:156 | gardée |
| A11 | changerCadre → ecrire | EnTete.tsx:487-489 → `poser` etat.ts:146-147 | gardée |
| A12 | onVue('semaines') si < 52 | etat.ts:107-109, 122-125 | gardée |
| A13 | tenue au bord, Échap (Cadre local) | Fenetre.tsx inchangé ; lâcher → `poser` | gardée |
| A14 | clavier ←/→, Entrée | EnTete.tsx:802 (onAnnee/onRevient) | gardée |
| A15 | avantPaysage, 13 sem. | etat.ts:72-79, 177-180 | changée (risques 2, 3) |
| A16 | échelle menu + Annuler | CalendrierTab.tsx:510-537 → etat.ts:169-170, 175-176 | gardée |
| A17 | pincer | CalendrierTab.tsx surPincer → changerEchelle | gardée |
| A18 | effet echelleVoulue := brute | etat.ts:119-129 `normaliser` ; useCadre.ts:67 (clé calendrier_echelle) | gardée |
| A19 | fenetreAvant, CHG-5 | etat.ts:171-174 ; CalendrierTab.tsx:422, 931 | gardée |
| A20 | appui long → 6 sem. | CalendrierTab.tsx:~500-507 `poser` | gardée |
| A21 | voirEtendue | CalendrierTab.tsx:~545-574 `poser` | gardée |
| A22 | renvoi E32 | CalendrierTab.tsx:~956-962 `poser` | gardée |
| A23 | vues | etat.ts:167-168 ; CalendrierTab.tsx:874 | gardée |
| A24 | anneeListe | EnTete.tsx:194-195 inchangé | gardée |
| A25 | libellePeriode(periodeEnTete) | EnTete.tsx:518 avec `cadre.periode` (CalendrierTab.tsx:994) | gardée |
| A26 | étiquette du cadre | Fenetre.tsx (grain, années : fix29) | gardée |
B1-B14 (lectures) : Courbe.tsx, Barre.tsx, Frise.tsx, Retards.tsx, VueListe.tsx : aucun écart `git diff 06c430228 HEAD` ; BandeSemaines (+52 : grain, `onCadrer`, années), Rangee (T29-3/9/10), usePointeur (T29-6), useDonneesCalendrier (horizon T29-1), EnTete (axe : data-axe-*, `cadrer`, bouton « ‹ auj. ») : changés, sans retrait de fonction vu dans le diff. B4 « ‹ auj. » passe de span à bouton (gardée+). B10/B13 : diffs lus, rien de retiré. Non rejoué en e2e par moi : B3, B6-B9, B11-B14 (la suite e2e/calendrier entière n'est pas dans mon périmètre).

## 4. Risques restants, par gravité
1. (moyen) Même fenêtre, deux lectures : un changement de période de l'app vers une année (53 sem.) en session reste en vue « semaines » (échelle Mois, libellé « 2027 ») ; recharger la donne « An ». Sonde : etat.ts action `app` ne met jamais `vue='annee'` (seul `etatInitial`, :203). C'est le défaut L-10 que l'inventaire (A8) dit « dérivé ». Correction : dériver `annee` de `semaines >= 52` dans `lire`, ou poser la vue dans `app`.
2. (moyen) Rotation : une période de l'app changée en paysage est perdue au retour en portrait (`avantPaysage` périmé, etat.ts:177-180) ; sonde : app fév. 2027 en paysage → retour sur oct.-déc. 2026. Et les gestes faits en paysage sont perdus au retour (useCadre.ts:66 ne les garde pas ; ancien : fenêtre aussi rendue mais période locale gardée). Correction : l'action `app` met à jour `avantPaysage`.
3. (mineur) En paysage, durée « 6 sem. » écrit 6 sem. mais montre 13 : libellé ≠ cadre (sonde). 
4. (moyen, qualité) Test par modèle rouge sur HEAD (§1) : le banc qui garde l'invariant n'est plus fiable tant que `lireDuree`/I0 ne lisent pas « ans ½ » et que la tolérance n'est pas alignée avec l'arrondi (±13 sem.). L'arrondi lui-même : « 5 ans » pour 5 ans 2 mois, à décider par le brasseur (goût).
5. (inconnu) T29-1 à 12 non prouvés en ligne ; le test officiel s arrête à la 5e suite ; 60 suites tolérantes vertes (I1 non évalué sur les années), 200 non faites.
6. (mineur) Aucune suite e2e complète rejouée par moi ; e2e/calendrier/* reste à jouer sur le build neuf.

## Pour « robuste, fonctionnel, sans bug » il manque
Banc aligné et vert sur 200 suites (en tâche de fond, ≈ 2 h) ; risques 1 et 2 corrigés avec un test unitaire de l'état (réducteur : action `app` → An, rotation) ; suite e2e/calendrier entière sur un build neuf ; rejeu en ligne T29-1..12 par le critique.

## Rejeu final (modele-tolerance.log)
60 suites (pas 200 : 11,1 min) VERTES sur le même build, avec la copie zz du test : I0 accepte « ans ½ », I1 tolérance 15 sem. au-delà de 2 ans, MAIS la regex de lecture des années s'est mal échappée (sed) : I1 n'a donc PAS été évalué pour les libellés « N ans » / « N ans ½ » (il l'est pour sem., mois, An). I2 à I5 (aujourd'hui, Brassins, axe ⊇ cadre, étiquette = cadre) évalués sur les 60 suites : aucun échec. Le seul rouge connu est donc I1 sur les années. 200 suites avec I1 aligné : non faites. La copie zz a été supprimée de lot-cal ; écritures : seulement ce dossier (log, copies de log, RESULTAT) et lot-cal (build dans %TEMP%, résultats Playwright).

LEÇON PROPOSÉE : un correctif d'étiquette (fix29 T29-12) change le contrat du test par modèle ; rejouer etat-coherent.spec.ts dans la même voie que tout changement de libellé de durée (L11 : banc non rejoué = vert non prouvé).
