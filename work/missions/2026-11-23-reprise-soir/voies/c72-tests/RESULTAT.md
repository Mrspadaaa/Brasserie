TESTS ROUGES 34 rouges / 57 total (R87 : 22 / 40 ; R88 : 12 / 17) — hash : commit « c72-tests » (git log)

# RESULTAT c72-tests

## Fichiers écrits
- `tests/unit/c72Regles.test.tsx` (nouveau, 57 tests).
- `work/missions/2026-11-23-reprise-soir/voies/c72-tests/tests-rouge.log`, `RESULTAT.md`.
- Aucun fichier de `src/` ni `functions/` modifié par cette voie (`UpgradeWorkspace.tsx`, `src/asset`, `src/data/hopSources/*` du `git status` viennent d'autres sessions). Aucun `.skip` ajouté, `c48Regles.test.tsx` non touché.

## Sortie décisive
`npx vitest run tests/unit/c72Regles* --reporter=dot > voies/c72-tests/tests-rouge.log` : `Tests 34 failed | 23 passed (57)`. `tsc --noEmit` : 0 erreur dans le fichier.

## R87 (C72-1, B) — le coût en tête
- FONCTION (`resumeJetons`) : 3 formes de jetons × 7 cas (2 pistes, ventilateur écarté, condenseur écarté, condenseur retenu, ventilateur retenu, 3 pistes dont une écartée, piste sans prix) + une seule piste. Oracle : ce que dit l'écran (retenue, sinon fourchette, sinon total).
  - `propre` (chaque coût vise sa piste) : rouge seulement sur « une option écartée » (aucun coût en tête : le prix seul de la piste restante manque) ; le reste est déjà juste (180 à 450, retenue).
  - `sansOption` (repli local, deux montants sans option) : « ≈ 630 » partout (somme).
  - `melange` (piste fantôme à 630 + jetons de l'IA) : reproduit exactement 180 à 630, 450 à 630, retenu 450 juste (cap/B1, C4, C5).
- COMPOSANT (`.cnp-total`) : Je cherche (melange, sansOption), écartée (3 formes), une seule piste, 3 pistes, piste sans prix, Décidé, Résolu. Rouges : melange « 180 à 630 », sansOption « ≈ 630 », écartée « 450 à 630 » / « ≈ 630 » / vide, une seule piste vide.
- SURFACES (une par test) : jetons de la bulle, tuiles d'option, ligne de la liste (écran et `valeurUtile`), rubrique Quand : tous VERTS (déjà justes sur ces données ; gardes pour le correctif). En-tête, Décidé, Résolu : couverts par les tests du composant. La somme d'À faire par groupe (`coutDe`, taches.ts) n'est affichée nulle part (aucun `.cout` rendu dans AFaire.tsx) : pas de test d'écran.
- GESTE (la phrase à deux pistes tapée dans le problème, sur le vrai code) : ROUGE dans les deux cas, « ≈ 630 CHF ».
  - Repli local : une seule option (« ZZ TEST c72 : deux pistes ») porte les deux coûts (`45000:FACON-x`, `18000:FACON-x`).
  - IA simulée (une ligne par piste) : aucune option créée (options : []), jetons de coût sur un `FACON-…` que le carnet ne porte pas : cette piste fantôme donne 630.
  - CAUSE PROBABLE pour le correcteur : `etiquettesDuRepli` (rangementCarnets.ts:38 et :224) pose les montants sur une option qui n'est pas celle de chaque piste ; `resumeJetons` (filRegles.ts) additionne ensuite les coûts d'une même option, même fantôme.

## R88 (m) — chacun par le composant
- C72-2 : 2 rouges (la carte « veille demandée · Ventilateur · pas encore relevée » reste après l'écart) + 1 garde verte.
- C72-3 : 2 rouges (sous « Un jour » : Frigo + congel 1 mai 2027, Extincteur 31 déc., sem. du 7 déc., avril 2027 ; attendu l'ordre des dates).
- C72-4 : 1 rouge (« Alpha 10 - 15 % · Origine États-Unis · 50 g ≈40 CHF … 1 kg » sur la même carte).
- C72-5 : 4 rouges (« Comparer sur l'acides alpha (%) » ; `avecArticle('acides alpha')` rend « l'acides alpha ») + gardes verts (Taux d'acides alpha, Alpha, oxygène, débit).
- C72-6 : 3 rouges (problème, étiqueteuse, mémo : la ligne « votre phrase : « … » » redit la première bulle) + 1 garde.

## Essais, doutes, limites
- 3 passes de test (34 rouges aux deux dernières). Premier jet : 40 rouges dont 6 pour de mauvaises raisons (forme `melange` supposant deux montants sur la piste condenseur, contredite par la retenue à 450 et les tuiles ; un compte de « 450 » qui lisait aussi la phrase ; Quand ne montre pas de prix sans plan). Corrigés avant le commit.
- `melange` reste une reconstitution (aucun jeton brut relevé), mais le geste la confirme sur le vrai code.
- Doute : le DOSSIER dit « une seule piste → son prix seul » ; un carnet à une seule piste chiffrée n'a aujourd'hui AUCUN coût en tête (rouge). Si le brasseur ne veut pas de « 450 CHF » pour une piste unique, retirer ces 2 tests (« une seule piste », fonction et composant).
- Jsdom ne mesure aucune boîte ; aucun écran changé, aucune capture.

CONNAISSANCE : le « ≈ 630 » naît du repli local (une seule option pour les deux montants d'une phrase à deux pistes) ; « 180 à 630 » vient d'une piste fantôme que le carnet ne porte plus.
LEÇON PROPOSÉE : aucune
