# Entrées du lot 22 (Comparer, stout 16D) — vérifiées avant l'éventail

Voie r6e-entrees, mission 2026-10-22-reprise-lot21 (leçon L08). Sortie : `comparer-stout.json` (version comparer-stout-v1), produite par `extraire-comparer.mjs`.

## Vérifié
- Moteur : `npm run check:engine` dans prototypes/houblons-v4 → ENGINE-V4 OK (113 tests).
- Ancre à 4,75 % vol. (profils-simules.json, ancre.abv = 4,75).
- Grille : les sept clés lues (ancre, biere, style, echelle, familles, formatGrille, grille) sont identiques à une régénération fraîche (`profil-simule-cas.ts`).
- Rien écrit dans prototypes/houblons-v4 (git status vide sur ce dossier).
- Contrôle D102 : effet égal, IBU égal, option A et grille recalculés à l'identique. Le contrôle échoue seulement sur la part sans famille (voir « Douteux »).

## Par houblon
Huile totale : mL/100 g, source Beer Maverick (et Hopsteiner si cité). Composés chiffrés : sur 9 composés listés.

| Houblon | α retenu (% masse) | Rôle | Huile totale | Composés chiffrés | Part sans famille (mots) | Études de panel |
|---|---|---|---|---|---|---|
| Cascade | 6,5 (fiche de stock) | aromatique | 0,7–2,5 (BM), 0,8–1,5 (Hopsteiner) | 9 | 0,10 | E04, E05, E09, E10 |
| Idaho 7 | 12,7 (lu sur l'article) | double | 1–2 (BM) | 7 | 0,00 | E03 |
| Galaxy | 17,2 (fiche de stock) | double | 1,8–5 (BM) | 7 | 0,29 | E09 |
| Nelson Sauvin | 9,6 (lu sur l'article) | double | 0,8–1,5 (BM), 1,1–1,5 (Hopsteiner) | 4 | 0,83 | E06, E09 |

Rôles : « double » vient de la règle rôle-α v1 (prototype, à valider), sauf Cascade (fournisseur).

## Doses d'effet égal (dryPost, 3 j, US-05)
- Agrumes (citrus), référence Cascade 4 g/L, cible 21,49 : Cascade 4,0 ; Idaho 7 7,5 ; Galaxy 2,5 ; Nelson Sauvin 7,4 g/L.
- Fruits tropicaux (tropical), référence Galaxy 4 g/L, cible 38,96 : Galaxy 4,0 g/L. Cascade, Idaho 7 et Nelson Sauvin n'atteignent pas la cible à 8 g/L : « hors grille » (dose inconnue, jamais 0).

## Doses d'IBU égal (20 L)
- 10 IBU au moment b10 : Cascade 2,08 ; Idaho 7 1,09 ; Galaxy 0,81 ; Nelson Sauvin 1,43 g/L.
- 5 IBU au moment wp : Cascade 2,50 ; Idaho 7 1,32 ; Galaxy 0,96 ; Nelson Sauvin 1,67 g/L.

## Option B (parts, à corriger par le brasseur)
Seuil 0,25, plafond 0,33, génériques exclus (fruité, fruity, noble, doux, mild, sucré, sweet).
- Cascade : 0 concept, part 0, non visible.
- Idaho 7 : 0 concept, part 0, non visible.
- Galaxy : 2 concepts, part 0,29, visible, dessinée 0,29.
- Nelson Sauvin : 7 concepts, part 0,78, visible, dessinée 0,33 (plafond).

Option A : la groseille à maquereau et gooseberry de Nelson Sauvin sont déplacées vers Petits fruits ; sa part sans famille passe à 0,67.

## Inconnu (à écrire « inconnu », jamais 0)
- Dose d'effet égal tropical pour Cascade, Idaho 7 et Nelson Sauvin (hors grille à 8 g/L).
- Composés sans borne chiffrée : listés dans composes[].valeurs ; ceux sans plage restent « inconnu ».

## Douteux (à trancher par le pilote)
1. Compte des mots de `aromes[].mots`. La sortie suit le contrat (mots = mots dans les sources, `aromes[].mots[].mots`). Le contrôle D102 compte les groupes de source (`a.mots.length`). Écarts : Cascade 0,10 contre 0,13 ; Galaxy 0,29 contre 0,40 ; B Galaxy 0,29 contre 0,40 (la visibilité ne change pas).
2. α retenu hors des sources : Galaxy 17,2 contre 11–16 (Beer Maverick) ; Nelson Sauvin 9,6 contre 10–13 et 12–14 (Hopsteiner).
3. Rôle « double » des règles v1 (prototype) pour Galaxy, Idaho 7 et Nelson Sauvin.
