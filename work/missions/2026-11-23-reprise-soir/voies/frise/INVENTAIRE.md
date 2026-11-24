# Inventaire de la frise et de son en-tête (D444, 23.11 soir)

Source : `src/components/tabs/CalendrierTab.tsx`, `src/ui/calendrier/**`, `src/domain/calendrier*.ts` (lot-cal, main 06c430228).
Chaque fonction ou geste : où il vit, ce qu'il fait à l'état (période · vue · cadre), le test qui le tient. « Cœur » : passe désormais par
`ui/calendrier/cadre/etat.ts` (une action). Tests : e2e `e2e/calendrier/*.spec.ts` (390) et unitaires `tests/unit/*alendrier*.test.ts`.

## A. L'état de la fenêtre (ce que le cœur unifie)

| # | Fonction / geste | Avant (état touché) | Après (action du cœur) | Test |
|---|---|---|---|---|
| A1 | Période de l'app (barre ‹ ›, « Tout », plage, Finances) → la fenêtre la suit (ET-PER) | effet CalendrierTab → `periodeLocale` ; effet EnTete → `fenetre` | `app` (gardée pour cette période, sinon elle) | etat-coherent (app plage, app Tout, ‹ ›), calendrierCadre |
| A2 | « Tout » / période hors horizon : la fenêtre reste la sienne | `fenetreDePeriode` → null | `app` : cadre inchangé, écrit en dates | calendrierCadre (Tout ne change pas le cadre) |
| A3 | CHV-4 : plage avant l'horizon posée à son début, durée gardée | EnTete effet + `onPeriode` | `fenetreDePeriode` (temps.ts) + `app` | calendrierCadre, calendrierPeriodeV8 |
| A4 | Un mois montre au moins 4 semaines (décision (c)) | Fenetre.tsx | temps.ts `MOIS_MIN_SEMAINES` | calendrierCadre, calendrierPeriodeV8 |
| A5 | Fenêtre locale gardée par appareil avec la période de l'app (CAL-PERIODE-APP-FIXE), même clé | CalendrierTab `lire/ecrireFenetreLocale` | `useCadre` (même clé, même forme) | etat-coherent (recharger), plus-qu-un-an |
| A6 | CHN-6 : saut vers une chose (`centrerSur`, loupe) : fenêtre posée dessus, non gardée | `setFenetre` + `periodeLocale` undefined | `centrer` (éphémère) | calendrierCadre (CHN-6) |
| A7 | Menu de période : 6 sem., 3 mois, 6 mois, An | EnTete `choisirDuree` → `ecrire` + `onVue` | `duree` | etat-coherent, echelle-suit-cadre |
| A8 | An : 52 semaines dès le début de la fenêtre, calé dans l'horizon ; « nov. – oct. » ; bande en mois | `vue='annee'` + `fenAvantAnnee` | `annee` ; l'An = cadre ≥ 52 sem. dans le calendrier (dérivé, L-10) | calendrierCadre, etat-coherent (durée An) |
| A9 | Quitter l'An (poignée de fin touchée dans l'An, Entrée) → fenêtre d'avant | EnTete `quitterAnnee` | `quitterAnnee` | calendrierCadre |
| A10 | Durée choisie depuis l'An : part du début de la fenêtre d'avant l'An | `fenAvantAnnee` | `duree` lit `avantAnnee` | calendrierCadre (modèle) |
| A11 | Poignée de début / de fin tirée (R2, R6), corps glissé (R5), doigt hors du cadre → défile (D436) | Cadre → `changerCadre` → `ecrire` | `poser` | sans-lecture, echelle-suit-cadre, etat-coherent |
| A12 | Dans l'An, un cadre tiré sous 52 sem. quitte l'An (CAL-ECHELLE-FIGEE) | `onVue('semaines')` | dérivé (durée < 52) | calendrierCadre |
| A13 | Poignée tenue au bord : la vue se resserre (R7), recalage 200 ms (R10), Échap/pointercancel annule | Cadre (local au geste) | inchangé (Cadre) ; le lâcher → `poser` | etat-coherent (tenue 0,5 à 9 s), plus-qu-un-an |
| A14 | Clavier : poignée de début ←/→ ; poignée de fin Entrée → An / retour | Cadre | `poser`, `annee`, `quitterAnnee` | frise.spec |
| A15 | Rotation : 13 semaines au moins en paysage, la fenêtre d'avant au retour (E10), sans écrire de période | EnTete `avantPaysage` | `orientation` (fenêtre dérivée ≥ 13 en paysage) | calendrierCadre ; paysage-844 |
| A16 | Échelle Jour / Semaine / Mois (menu, D385) : période de l'échelle ; message « Échelle … » + Annuler | `setEchelleVoulue` + `setFenetre` + `onPeriode` | `echelle` ; Annuler = `restaurer` | calendrierEchelle, lot-9 |
| A17 | Pincer / écarter (variante B) : un cran d'échelle autour du jour visé | `changerEchelle` | `echelle` | calendrierEchelle (sens, seuils) |
| A18 | L'échelle voulue suit celle que la durée permet (paquet F n° 3), jamais en paysage ni dans l'An ; gardée par appareil | effet `echelleVoulue := echelleBrute` | réducteur (`suivreEchelle`), `calendrier_echelle` gardée | calendrierCadre (modèle), calendrierEchelle |
| A19 | Barre tenue au bord de la frise : la fenêtre grandit d'une semaine jusqu'à 6 mois, puis défile (CAL-BARRE-BORD, L-1, L-8) ; geste annulé → fenêtre d'avant (CHG-5) | `setFenetre` seul + `fenetreAvant` | `debutGeste`, `poser`, `finGeste` | barre-bord.spec, calendrierCadre |
| A20 | Appui long sur une marque (3 mois et plus) → 6 semaines centrées, chose choisie (D-199) | `setVueEtat` + `setFenetre` + `onPeriode` | `poser` (vue calendrier) | frise-suite |
| A21 | « Voir S20 › » : plus petite durée du menu qui contient la chose (CRITIQUE-10 n° 2, CHE-1, D404) | idem | `poser` | feuilles.spec |
| A22 | Renvoi « Livraison · S1 › » (E32) | `setFenetre` + `setVueEtat` | `poser` | frise-suite |
| A23 | Vues : Liste (En cours, En retard, Sans date), Calendrier, courbe en grand (appui long), fermer (×, toucher dehors) | `setVueEtat` | `vue` (la vue ne change pas le cadre) | frise.spec, lot-9 |
| A24 | Liste sur une fenêtre ≥ 52 sem. : l'en-tête lit l'An (anneeListe) | EnTete | inchangé (EnTete) | frise.spec |
| A25 | Libellé du bouton : « Nov. », « T4 », « 2026 » quand le cadre est la période de l'app ; sinon 6 sem. … An, « 2 ans », « 18 mois » | `libellePeriode(periodeEnTete…)` | `libellePeriode(cadre.periode…)` | etat-coherent I0/I1, plus-qu-un-an |
| A26 | Étiquette du cadre : dates (D434), une semaine en jours, An en mois, bulle de tirage | Fenetre.tsx | inchangé | etat-coherent I1/I5, echelle-suit-cadre |

## B. Ce qui lit l'état sans l'écrire (inchangé, rejoué)

| # | Fonction / geste | Où | Test |
|---|---|---|---|
| B1 | Courbe : vue R4 (deux bouts à 56 px), marges en unités entières (D441) | EnTete, Fenetre `vueDeFenetre` | un-seul-axe |
| B2 | Un seul axe : rangées sur l'axe de la courbe, lignes sur les graduations (D441, CAL-GRILLE-SUR-GRADUATIONS) | EnTete `onAxe` → CalendrierTab | un-seul-axe |
| B3 | Bande des semaines : grain jour / semaine / mois / an ; noms entre les traits ; jamais vide | BandeSemaines | bande-jamais-vide, semaine-entre-traits |
| B4 | Aujourd'hui : colonne bleue (D442), « ‹ auj. » hors vue | EnTete, Courbe | aujourdhui-courbe, etat-coherent I2 |
| B5 | « CHF à dépenser » : creux du cadre (D433) → détail | EnTete, DetailCreux | echelle-suit-cadre |
| B6 | ± mouvements et icônes (idées, retards) ; toucher une semaine → sa date, second toucher l'efface | BandeSemaines | frise.spec |
| B7 | Déplier une semaine en sept jours (C) | BandeColonnes, CalendrierTab `deplie` | frise.spec |
| B8 | Aligner la courbe (D387), cacher la courbe (D389), plein écran (E09) + invitation | EnTete | frise.spec |
| B9 | Retards (liste par date) | Retards | frise.spec |
| B10 | Barres : glisser (jour / semaine / mois), bords, lâcher ou dessiner, jour exact | Barre, usePointeur | lacher-ou-dessine, jour-exact, barre-bord |
| B11 | Toucher une chose → détail ; vente → fiche (CAL-VENTE-FICHE) ; facture → pièce ; proposition → acceptée | CalendrierTab `surToucher` | vente-fiche |
| B12 | Appui long → menu (Lier…), feuille d'ajout (+ de rangée, + volant), Modifier | MenuAppuiLong, FeuilleAjout | feuilles |
| B13 | Masquer, épingler, étoiler, filtrer, trier les rangées ; sections vides compactes | CalendrierTab, Rangee | sections-vides, frise.spec |
| B14 | Un canal de message (E33), Annuler | Message | frise-suite |

## Rejeu
Unitaires : 18 fichiers calendrier, avant et après (voir RESULTAT.md). E2E : etat-coherent (modèle) sur l'ancien (rouge) et le nouveau (vert) ;
la suite e2e/calendrier entière et `scripts/parcours/calendrier.mjs` sur le nouveau.
