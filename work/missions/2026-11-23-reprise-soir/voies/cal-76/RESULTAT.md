OK partiel — bord au bord ×4 112→8 ms, ×6 124→8 ; relâcher ×6 353→158 ms (cible 150 frôlée)

Ligne : CAL images ×4 112→8 ms, ×6 124→8 ; relâcher 158 (×6, avant 353 ; ×4 avant 270) d61825680 (tests.log est ignoré par Git : reste dans le dossier, hors commit)

## Mesures (scripts/mesure-calendrier.mjs, build minifié de la fixture, 390×844 tactile, mon onglet du Chrome 9222)
| mesure (médiane des essais) | avant ×4 | après ×4 | avant ×6 | après ×6 |
|---|---|---|---|---|
| Bord, image médiane | 112,2 ms | 8,1 ms | 124,1 ms | 8,1 ms |
| Bord, images ≤ 17 ms | 7 % | 58 % | 8 % | 66 à 69 % |
| Bord, pire image | 247 ms | 141 ms | 306 ms | 216 ms |
| Bord, défilement | 7,3 sem./s | 9,8 sem./s | 6,6 sem./s | 8,2 sem./s |
| Relâcher (4 premières images) | 270 ms | 198 ms (avant le dernier correctif) | 353 ms | 158 ms (3 essais : 158, 155, 235) |
Avant = HEAD bd1bb3b25 (`--ref HEAD`, 4 essais) ; après ×4 = 4 essais ; après ×6 bord = 4 essais (série `apres6b`), relâcher ×6 = série finale de 3 essais après le dernier correctif (le lâcher garde la fenêtre montrée). L'écran de ce poste tourne à 120 Hz : une image libre fait 8 ms.
Une série ×6 a été écartée : l'onglet était recouvert (une image par seconde, 3 essais sur 4) ; le script met maintenant l'onglet au premier plan à chaque essai et le signale s'il est caché.

## État de l'art (L29)
Problème type : glisser avec défilement automatique dans une liste rendue par React, où chaque pas change la fenêtre et re-rend tout l'onglet. Méthodes standard examinées : (1) fenêtre tampon rendue une fois puis `transform` (méthode du DOSSIER) ; (2) contre-pression du rendu (le geste avance dans une référence, l'état ne se pose qu'au rythme où le rendu suit, comme `useDeferredValue` / les listes virtualisées qui regroupent les défilements) ; (3) regrouper les rendus en chaîne (effets de mise en page au lieu d'effets passifs). Décision : (2) + (3), sans bibliothèque. Pourquoi pas (1) : ici la fenêtre GRANDIT au bord (6 sem. → 6 mois, les colonnes rétrécissent), elle ne glisse pas ; un `transform` serait un `scaleX` qui écrase les textes entre deux rendus. Écart au DOSSIER, assumé et dit ici.

## Ce qui a été trouvé (outil `--pourquoi` : l'origine de chaque commit React) et corrigé
Avant, à chaque pas au bord : pose de la fenêtre (réducteur du cadre) → effet passif de l'en-tête (axe) → effet passif de la frise (largeur de colonne) et de la barre (pas relu, bulle, aperçu) → effet passif « rangées sous le + » : 4 à 5 rendus de tout l'onglet, répartis sur plusieurs images, et un `debutGeste` envoyé à chaque pas (un `useReducer` re-rend même sans changement).
1. `CalendrierTab.defilerFenetre` : la fenêtre du geste avance dans `poseGeste` (référence) ; `poserFenetreGeste` la pose au plus quand le temps libre depuis la dernière pose vaut un tiers du temps occupé (`posePermise`, defileBord.ts ; images > 34 ms comptées occupées, dette plafonnée à 400 ms). `debutGeste` une fois par geste.
2. Effets passés en `useLayoutEffect` : axe de l'en-tête (EnTete), mesure de la frise (Frise), pas relu (usePointeur) : la frise, la bulle et la courbe suivent la pose dans la même image (avant : une image décalée chacune).
3. Frise : la clé des « rangées sous le + » est figée pendant un geste (comme `cleFigee`) : plus de mesure ni de rendu ~120 ms après chaque pose.
4. Lâcher : la fin du geste (fantôme, bulle, aperçu, cadre) attend l'écriture et se rend avec son message (`finEnAttente`, appelée par `montrer`) : un rendu au lieu de trois ; la barre ne revient plus une image à sa place d'avant. La fenêtre qui reste est celle que le brasseur voyait en lâchant (vu à ×6 : les pas non montrés posés au lâcher faisaient passer la frise de 9 semaines à 3 mois sous le doigt levé). Commits au lâcher : 8 à 11 → 5.

## Captures ouvertes (390, scratchpad de la session)
- Au repos 6 sem., avant/après (`m-avant6/avant-glisser-0.png`, `m-apres6b/avant-glisser-0.png`) : identiques à l'œil (mêmes barres, noms, montants, en-tête). Comparaison au pixel non faite (pas de pngjs).
- Pendant le geste au bord (`bord-0.png` avant/après) : aucun texte qui se chevauche après ; bulle « S21 · 25 mai · lâcher ici » à côté de la barre.
- Pendant puis après le lâcher (`m-apres6b/pendant-relacher.png`, `m-fin6/apres-relacher.png`) : bulle S52 → écrit « Hefe : S45 → S52 » (série d'avant) ; série finale « S45 → S51 », fenêtre 8 sem. gardée, bandeau Annuler ; aucun chevauchement.
- 1280 : mesuré une fois (`--vue 1280x800`, ×1 : bord 8 ms, relâcher 15 ms), capture non ouverte faute de tours.

## Critères
- `npx tsc --noEmit -p .` : 2 erreurs, les connues (seedData GanttTask, virtual:pwa-register).
- Tests : 35 fichiers verts (cal74Regles 29 dont 5 neufs cal-76, k57PoigneeFenetre, virgule-transversale, calendrier*, calFrisePrixNoms, calCourbeV10, bugsWorkflowsCalendrier, ct4Calendrier*, defileBordCalendrier, ecr3/ecr4*, courbeEtiquettes, enTeteOgHorsBornes, todoTimelineFrise) ; journal `tests.log`.
- Cibles : bord ≤ 33 ms (×4) OUI (8,1) ; relâcher ≤ 150 ms (×6) NON de peu (158, un essai à 235) ; vitesse gardée OUI (plus rapide : la fenêtre suit sans images perdues) ; repos inchangé OUI à l'œil ; pas de chevauchement OUI sur les captures.

## Fichiers écrits
`src/components/tabs/CalendrierTab.tsx`, `src/ui/calendrier/frise/{defileBord.ts,usePointeur.ts,Frise.tsx}`, `src/ui/calendrier/entete/EnTete.tsx`, `tests/unit/cal74Regles.test.tsx`, `scripts/mesure-calendrier.mjs` (commits React comptés, `--pourquoi`, chronologie dans le JSON, onglet au premier plan), ce dossier.

## Doutes et limites
- Rythme visible : à ×6, une pose coûte ~180 ms (3 rendus en chaîne dans la même image) ; la frise change ~3 fois par seconde au bord (avant ~4,5 fois, mais chaque image prenait 110 à 300 ms). Les sauts sont donc plus grands (2 à 4 semaines par pose à ×6) ; à ×4 et en dessous, plus fins. Le fil reste libre (un doigt qui bouge est lu tout de suite).
- La pire image reste ~140 (×4) à 216 ms (×6) : c'est la pose elle-même (rendu de tout l'onglet).
- Une écriture qui ne rend jamais ni message ni fin laisserait le fantôme : `finally` le couvre (refus et erreurs passent par `montrer`).
- Poste bruité (autres agents) ; lire les chiffres en tendance.

DÉCISION À PRENDRE : pour descendre la pose elle-même (et le relâcher sous 150 ms à ×6 de façon sûre), calculer l'axe de la courbe dans l'onglet au lieu de le recevoir de l'en-tête par effet (un rendu de moins par pose), et mémoïser `Rangee` par rangée. Options : voie dédiée (recommandé, budget propre) ou s'en tenir là (cibles du bord tenues).
CONNAISSANCE : un `dispatch` de `useReducer` re-rend le composant même si le réducteur rend le même état (React 18+ n'a plus de sortie anticipée pour `useReducer`) : ne pas l'envoyer à chaque image. Un onglet Chrome recouvert tombe à une image par seconde : une mesure de fluidité doit mettre son onglet au premier plan.
LEÇON PROPOSÉE : avant d'optimiser un rendu, compter ses commits et leur origine (`--pourquoi` : l'état qui a changé dans chaque commit) ; ici 4 à 5 rendus en chaîne par pas, invisibles au profil de fonctions.
