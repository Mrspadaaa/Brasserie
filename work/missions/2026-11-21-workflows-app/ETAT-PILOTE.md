# État du pilote — 21.11, 12:45

Objectif : porter dans port-carnet (`claude/port-carnet-1711`) les workflows choisis (D393 A2 B1 C1 D2 ; D396 E2 F2 G3) et les 11 gains tranchés (PORT.md), puis CAL-ENTETE, CAL-LENT et les bugs des chaînes. La mise en ligne se fait par `scratchpad/deploy-tour4.sh` (tag tour8), seulement avec PARCOURS CALENDRIER OK.

## Décisions de cette journée
D392 à D402 dans `work/refonte-frontend/decisions.md`.

## Voies
- Faites et commitées : CAL-ENTETE 5/5 ; geste frise 30/42 ; bugs B1 à B11 sauf restes ; W0a ; W0b ; F-ENTREE (4/4) ; F-HORIZON ; F-NOM (materiel-pose ajusté, D399) ; F-APPUI (33 et 75 cl, tuile d'origine).
- En cours (agents) : V-RECETTE (reprise 2 : 4 tests rouges, G1, N1, levure, N3, C1 récap) ; Calendrier session 13 (W0c, V-CAL depuis le worktree temporaire `%TEMP%/vc`) ; V-JOUR ; V-FUTS ; voie transverse (fix114, designTokens, virgule, invoiceScanCache).
- À lancer : V-LOT, V-COUT, V-STOCK (vérifier qui tient StocksTab.tsx) ; CAL-LENT mesuré quand la machine est calme (ab.mjs, 7 tours) ; geste restant (INVENTAIRE.md).
- Choix ouvert : date au 1er écran de la recette (r4-a), « à dessiner », à montrer en mini maquette.

## Reprises
REPRISE-*.md dans ce dossier ; dans port-carnet, `work/missions/2026-11-20-frise/REPRISE.md` (Calendrier).

## Pages
- Choix 1 : https://claude.ai/artifact/5hDwK9FYvFXbVh8AWqfUii
- Choix 2 (base `choix/`) : https://claude.ai/artifact/44Sg2rBcG5WLDqKYmfXnLJ
- Frise B : https://claude.ai/artifact/CYworN1pL87XZtdvH7CaEC

## Risques
- Machine chargée : vitest entier au-delà de 25 min, mesures de lenteur bruitées.
- 27 KO VUE-SAUTE et NOM-OBLIGE à suivre dans principes.mjs.

## Mise à jour 21.11, fin d'après-midi (limite d'usage atteinte)
- Faites : V-FUTS (K7, N4), V-JOUR (N2), V-LOT (B1, E2, PI-4, VUE-SAUTE), voie transverse, F-APPUI 33/75 cl ; Calendrier : D397, D398, WFV-14, toucher fantôme, W0c, G3, RENOMMER-EVT, C1 (D404), 22 tests réécrits.
- En cours au moment de la coupure : V-RECETTE reprise 4 (levure vision, Ma levure 5-6, Suivant fixe, N3, C1, WFR-4) ; Calendrier session 16 (K3-SUITES, VUE-SAUTE, précision, parcours complet) ; V-COUT reprise (commits K3/K4/N6, D405 une seule caisse). Lire leurs REPRISE-*.md et Session 16 avant de relancer.
- Reste : V-STOCK (F2), CAL-LENT (ab.mjs, machine calme), défauts du graphe de la fiche (REPRISE-V-LOT), geste restant, puis vision complète et mise en ligne tour8 (deploy-tour4.sh, PARCOURS CALENDRIER OK).
- Décisions D392 à D405.
- V-COUT fini (une seule caisse : −533 au Bord, en Finances et au Calendrier). À faire par la voie Calendrier : rebrancher la barre et « budget repris de sa recette » sur item.repriseRecette, retirer « pas encore dans Finances ». À verser : « seuil NaN kg » au Bord (fixture manques) ; 2 erreurs de console à 1280.
