EN COURS — relecture-frise (brouillon tenu au fil ; verdict final plus bas quand il est écrit)

## Test par modèle (HEAD fd27f22e5, build neuf de lot-cal, android-390, ETAT_RUNS=200)
Sortie : voies/relecture-frise/modele.log. ROUGE à la 5e suite (fast-check s'arrête au premier échec).
- Graine : seed -2119159308, path "4" (rejouable : ETAT_SEED=-2119159308).
- Suite de gestes : `cadre -57` → `poignée fin tenue au bord 5358 ms` → `cadre -23` → `recharger`.
- Invariant violé : I1 (durée du bouton = durée du cadre). Bouton « 5 ans », étiquette « mai 2026 – juin 2031 » = cadre 269,6 sem. (≈ 5,17 ans) ; écart 9,6 sem. > jeu 9 sem. du test. App « Nov. ».
- Lecture : ce n'est pas une incohérence d'état. L'arrondi de T29-12 (`libelleDuree`, Fenetre.tsx:28-32 : `demis = ceil(ans*2 - 0.55)`) donne « 5 ans » pour 4,78 à 5,28 ans (±13 sem.), plus large que la tolérance du test (≈9 sem. en étiquette de mois). Le test par modèle n'a pas été rejoué après fix29 : il est rouge sur HEAD.
- Rejeu avec tolérance alignée (copie zz-relecture-modele.spec.ts dans lot-cal, jeu 15 sem. au-delà de 2 ans, « ans ½ » lu) : modele-tolerance.log (en cours au moment de cette note).

## Table d'inventaire (premières lignes, lues dans etat.ts) — suite à compléter
| # | ancien | nouveau | verdict |
|---|---|---|---|
| A1 | effets CalendrierTab + EnTete | etat.ts:137-145 (`app`) | gardée |
| A2 | `fenetreDePeriode` null | etat.ts:141 | gardée |
| A3 | CHV-4 | temps.ts fenetreDePeriode + etat.ts:143 | gardée (même formule que Fenetre.tsx ancien :43) |
| A4 | MOIS_MIN_SEMAINES | temps.ts:~63 | gardée |
| A6 | CHN-6 | etat.ts:152-153 (`centrer`, éphémère) | gardée |
| A7 | choisirDuree | etat.ts:154-158 | gardée |
| A8 | An + fenAvantAnnee | etat.ts:159-164 | changée : « An dérivé de la fenêtre ≥ 52 sem. » n'est vrai qu'à l'état initial (etat.ts:203) ; voir risque 1 |
| A9/A10 | quitterAnnee, fenAvantAnnee | etat.ts:165-166, 156 | gardée |
| A12 | onVue('semaines') | etat.ts:122-125 + 107-109 | gardée |
| A13/A19 | fenetreAvant | etat.ts:171-174 | gardée |
| A15 | avantPaysage | etat.ts:177-180, 72-79 | changée : voir risques 2 et 3 |
| A16/A17 | changerEchelle | etat.ts:169-170, CalendrierTab.tsx:~510-537 | gardée |
| A18 | effet echelleVoulue | etat.ts:119-129 | gardée |
| A20-A22 | setFenetre+setVueEtat | `poser` etat.ts:146-147 | gardée |
| A23 | setVueEtat | etat.ts:167-168 | gardée |
