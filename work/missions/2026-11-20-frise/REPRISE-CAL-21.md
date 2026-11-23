# Reprise — voie cal-21 (D406 et D408, VUE-SAUTE du Calendrier), 21.11

Agent arrêté à 200 k. Rien n'est commité. Scratchpad de la session :
`C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/cal-21/`
(`build/` build de test de l'arbre, `p0/` principes AVANT, `p5/` principes APRÈS, `diag.mjs` détail des layout-shift par action,
`cote.mjs` composeur côte à côte, `repos-avant-apres.png`).

## Fait (arbre de travail, non commité)
- `src/ui/calendrier/frise/posee.ts` (neuf) : `posee(x, y?)`, `poseeADroite(droite, y, maxWidth)`, `lirePosee(style)` pour les tests.
- Positions en `transform` : Barre (barre, nom, phrase du dessous, coin « lié à »), Marque (marque, nom), Frise (`cal-col-now`),
  GrilleJours (traits, week-end, cadre déplié, auj.), Rangee (caddies et leur nom, renvois).
- `frise.css` : `.cal-barre` et `.cal-piste` en `container-type: inline-size` ; `.cal-ph` et `.cal-jalon` posés par `translate`
  (cqw). `posPiste` (Barre.tsx) et `--x` des jalons rendent des `cqw`.
- Pistes à hauteur fixe : Frise retient le plus grand nombre de lignes par rangée à une même échelle (`semaine-depliee` compte comme
  l'échelle d'où on l'a dépliée) ; Rangee prend `lignesMin` et rend `onLignes`. Une rangée qui a montré quelque chose ne passe plus aux vides.
- `entete/BandeColonnes.tsx` : clés par rang (pas par date) : une autre période change le texte des cases, pas leur place.
- `scripts/parcours/principes.mjs` : exceptions du Calendrier `Cacher la courbe` (CAL_COURBE) et `Fermer` après la fiche (CAL_FICHE,
  pendant de l'ouverture : DÉCISION à confirmer par le pilote) ; « ZZ TEST Commande de malt » marqué `ajoute`. Mesure D407 précisée :
  le contenu ajouté commence au bas de l'élément qui le précède (marge fondue de `.cal-det` 6 px) ; une source est « sous » par son milieu
  (le + d'une rangée, 44 px, déborde de 10 px au-dessus).
- Tests mis à jour (lecture par `lirePosee`, `cqw`) : calendrierFrise, BordRang, EnLigne1, Gestes, PaquetG-frise, PaysageV1.

## Preuves
- AVANT (`p0`) : PRINCIPES ECHEC (9), session CLS 0,501. APRÈS (`p5`, build avant le correctif ci-dessous) : **PRINCIPES OK**,
  session CLS 0,019 (marge faible sous 0,02 : restent les enfants des noms qui se réorganisent, cal-lbl-t/l1/l2).
- Vitest `tests/integration/calendrier tests/unit/calendrier` : 41 fichiers, 769/769 verts.
- `tsc --noEmit` : aucune erreur.

## DÉFAUT OUVERT (à corriger d'abord)
`repos-avant-apres.png` (ouverte) : au repos, APRÈS, Travaux a une ligne vide de trop (30 px) que AVANT n'a pas. Cause probable : un
premier rendu à la largeur de repli (`largeurRepli`, avant mesure) pose 2 lignes et la mémoire les garde. Correctif prévu dans Frise.tsx :
`noterLignes` n'enregistre rien tant que la largeur n'est pas mesurée (`mesuree` nul), et la mémoire se vide quand `mesuree` change
vraiment (> 1 px, rotation), jamais quand elle repasse à 0. Puis rebuild, principes `--seul calendrier`, nouvelle capture côte à côte
(`node cote.mjs <sortie> "avant=p0/vue-calendrier-0.png" "apres=<nouveau>/vue-calendrier-0.png"`), l'ouvrir : aucune différence attendue.

## Reste
1. Le correctif ci-dessus ; rejouer principes (viser une marge sous 0,02) ; `calendrier.mjs` et `geste.mjs` lancés en arrière-plan sur
   `build/` AVANT ce correctif (journaux `cal.log`, `geste.log`, finissent par « exit N ») : les relancer après le correctif.
2. Commit par index temporaire (GIT_INDEX_FILE, read-tree HEAD, add des chemins ci-dessus, commit-tree, update-ref), puis
   `git reset -q -- <chemins>` sur l'index partagé. Jamais `git add -A`, ni `source4-…json`. Message terminé par
   « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».
3. Restes Calendrier (Brasserie `work/missions/2026-11-21-workflows-app/TRANSVERSE-RESTE.md`) : `LienSection.tsx:35` `text-cave-100` vers
   `text-cave-200`, `:36` `text-cave-300` vers `text-cave-400` (contrôle `tests/unit/designTokens.test.ts`, rouge sur tour7). CRN-11 et
   CRN-20 ne sont PAS dans ce fichier (seulement dans BUGS.md et REPRISE-CARNET.md « fichiers du Calendrier interdits → DÉCISION ») :
   CRN-11 période du Calendrier dans l'en-tête du Carnet, CRN-20 « — » en clair contre « → » en cave.
4. Fin : tests du Calendrier, vision 390 et 1280 deux thèmes (captures de geste.mjs), build `VITE_HOP_V4=on VITE_CARNET_IA=production`.
