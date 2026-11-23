# Reprise du lot Calendrier (23.11, 3e agent), arrêté vers 355 k

Worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/lot-cal`, branche `claude/lot-cal`. origin/main est fusionné jusqu'à 647903ea3 (D442).
Contrat : VOIE-LOT-CAL.md, ajouts de 9:50, 9:53, 9:55 et 10:05 compris.

## Fait et prouvé en ligne
- **Trait d'aujourd'hui, tour 18** (index-Do-2h6kK.js) : `e2e/en-ligne/aujourdhui-courbe.spec.ts`, vert à 1, 6, 40 et 51 sem. Remplacé ensuite par D442.
- **Tour 19** (9fcdbd4d4, index-BiLG6tov.js) : D441 CAL-UN-SEUL-AXE, CAL-GRILLE-SUR-GRADUATIONS, D442 (colonne bleue, maquette B), point bleu
  retiré (bd809ce4c).
  - Preuve : `PAQUET=index-BiLG6tov.js npx playwright test -c playwright.en-ligne.config.ts un-seul-axe`, vert, 0 faute à 10 et 3 sem. et
    pendant le tirage.
  - Colonne d'aujourd'hui identique sur courbe, bande et rangées : [64, 90] à 10 sem., [70, 82] à 3 sem.
  - Captures entières regardées : `en-ligne/axe-10sem.png`, `axe-3sem.png`, `*-pendant.png`.
- Conception : la vue de la courbe se pose sur des unités entières (jours sous 5 sem. de vue, semaines au-delà : `vueDeFenetre`, `vueEnUnites`,
  `uniteDeVue` dans Fenetre.tsx). L'en-tête envoie `onAxe` (AxeCourbe) à CalendrierTab. La frise prend ces colonnes, marges comprises
  (`colonnesFenetre` = le cadre, pour les pastilles), et pose chaque chose au jour près (Rangee `lineaire`).
  - Grille : les lignes sont les graduations de la bande (`graduationsBande`). Hors du cadre : grisé `.cal-hors-cadre`.
  - En portrait, le glisser d'une barre garde l'axe : `alignement` sert au seul paysage, le zoom est tracé sur echelleR4.
  - L'An portrait prend aussi la bande sur la courbe (plus BandeAnnee).

## Commité, NON mis en ligne
- 3784dc924 : tests seulement (`e2e/outils/axe.ts` partagé, spec en ligne).
- **206fd96ac CAL-PLUS-QU-UN-AN** : le patch gardé est appliqué sur la nouvelle géométrie (horizon de 5 ans, An = max(52, fenêtre), « 2 ans »,
  grain « an »), plus T9-2 dans frise.spec borné à l'horizon.
  - Verts à 390 : plus-qu-un-an, lacher-ou-dessine (le blocage du 21 déc. a disparu avec D441), un-seul-axe, echelle-suit-cadre,
    aujourdhui-courbe, frise.spec (T9-2 et CAL-*).
  - **Rouge** : une propriété vitest de `tests/unit/proprietes` (contre-exemple `periode annee 2026`) dit encore FC-1/L-44 « ≤ 52 semaines »,
    renversé par la plainte. À changer en « ≤ horizon », comme T9-2, puis PRÊT.
  - À juger à l'œil : une fenêtre de 2 ans (grain an, libellé).

## Reste du contrat (ordre de 9:55)
- Point 3 (D436, CAL-SANS-LECTURE) : voir REPRISE-LOT-CAL-2 (test `e2e/calendrier/sans-lecture.spec.ts`).
- « −1 663 » pousse « CHF à dépenser » sous ± (revu à 10 sem. sur axe-10sem.png).
- Bouton de durée qui garde l'ancienne durée pendant le tirage.
- Lenteur mesurée en ligne (`ouvrirEnLigne({ cpu: 4 })`), avant et après D441 : la frise suit maintenant la vue pendant le tirage, à mesurer.
- Bandeau « Enregistrement… ».

## Notes
- `npm run build` échoue dans ce worktree : `src/data/seedData` manque (pas ce diff). Le build parcours de `e2e/outils/preparer.mjs` passe.
- Locaux non commités : `playwright.lotcal.config.ts`, `e2e/calendrier/zz-*.spec.ts`, `e2e/en-ligne/zz-explore.spec.ts` (sondes).
- Le point bleu du creux reste retiré (CAL-POINT-BLEU-MUET), bien que la maquette B le dessine.
