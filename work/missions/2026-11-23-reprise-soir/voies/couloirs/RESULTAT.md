OK — PRÊT À METTRE EN LIGNE dffddf028 : calendrier bord à bord, traits continus à travers les rangées vides ou cachées

## Contrat réécrit (bords et lignes, pas de couloirs)
Une première lecture (pose en couloirs) avait été codée avant le message du pilote. Elle est retirée en entier et jamais commitée : `Rangee.tsx` remis par `git apply -R` de mon seul diff, `couloirs.ts` et son test supprimés. `git status` ne montre plus que `frise.css` (modifié) et le test neuf.

## Causes (captures 2332 ouvertes)
1. Marges ≈ 28 px de chaque côté (12 px CSS) : `<main>` de `App.tsx` met `px-2 xs:px-3` ; `.cal-tab` (courbe, bande, frise) vit dedans. Le vide du bas : la réserve de 12 px de `[data-floating-actions-gap='nav']` + le `.cal-tab-fin` de 8 px + 8 px de `cal-pile` avant lui.
2. Bande blanche « Activités · vide » : `.cal-vides` (groupe des rangées vides ou cachées, CAL-SECTIONS-VIDES-COMPACTES du 23.11) avait `background: cave-950` et `z-index: 1` : il peignait par-dessus l'axe (`.cal-axe` : traits des graduations, zone hors cadre, colonne d'aujourd'hui). Les traits s'arrêtaient sous Travaux et reprenaient à Papiers.

## Fait (un seul fichier de style, `src/ui/calendrier/frise/frise.css`)
- `.cal-vides` : fond retiré. Les traits traversent toutes les rangées, vides ou cachées comprises.
- Hors paysage, sous 1024 px : `.cal-tab` prend `margin-inline: -gouttière` (8 px, 12 px dès 375 px, la même que `<main>`) et `margin-bottom: -0.75rem` ; `.cal-tab-fin` masqué. Courbe, bande et frise s'élargissent ensemble : un seul axe, graduations toujours alignées.
- Retrait interne égal à la gouttière : `.cal-rh` (+, nom, œil) ; `.ent-t` (chiffre du creux, boutons) à gouttière + 4 px, ce que le portrait lui donnait déjà (texte à la même place qu'avant, soit 16 px).
- Test `tests/unit/calendrierBords.test.ts` : 3 gardes de style (pas de fond sur `.cal-vides`, gouttière égale à celle de `<main>`, retraits). Pas de règle de calcul : la preuve de rendu reste en ligne.

## Critères
- `npx tsc --noEmit -p .` : 2 erreurs, les 2 connues (`GanttTask`, `virtual:pwa-register`).
- `npx vitest run` 23 fichiers calendrier (calendrier*, ct4*, bugsWorkflowsCalendrier, calFrisePrixNoms, calendrierBords) : 336 verts (journal `tests.log`). Le test des vides est rouge sur HEAD (le fond y est), les deux autres aussi (le bloc n'y est pas).
- Commit dffddf028 par chemins (`frise.css`, `calendrierBords.test.ts`).
- Aucune capture locale (consigne de la voie) : rendu NON vérifié à l'œil.

## À regarder en ligne (390, vue 20 mois)
1. Frise, courbe et bande touchent les deux bords ; le fond rayé descend jusqu'à la barre du bas ; les poignées de la courbe et « 2026 » / « 2028 » à x = 0 ne sont pas gênants.
2. Rangée « Activités · vide » : traits continus ; le texte « Activités · vide » reste lisible sur les traits.
3. En-tête du haut (chiffre du creux, ±, 20 mois, horloge, règle, œil, plein écran) : même place qu'avant, pas de retour à la ligne neuf.
4. Fin de défilement : la dernière rangée touche la barre ; le + volant passe par-dessus comme avant.

## Doutes et limites
- Paysage et ≥ 1024 px non touchés (le rail de navigation y décale `<main>` ; non demandé).
- Hors axe partagé (`axeVu` absent), le quadrillage vit dans chaque piste (`.cal-lane`) : une rangée vide n'a pas de piste, donc pas de traits. Le cas du téléphone en 20 mois est sur l'axe ; non vérifié ailleurs.
- `CalendrierTab.tsx` (hors de mon périmètre) n'est pas modifié : le `.cal-tab-fin` est masqué par la feuille de style.
- Une première analyse de la pose (avant le contrat réécrit) a montré que le premier jet de pose est déjà proche de l'optimum : les 8 achats de la capture se recouvrent tous au même x (marque 28 px + étiquette) ; huit lignes y sont le minimum. Hors contrat, rien codé.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `.cal-vides` portait un fond opaque qui masquait l'axe ; le calendrier est contenu par `px-2 xs:px-3` de `<main>`, la gouttière se reprend par marge négative sur `.cal-tab`.
LEÇON PROPOSÉE : lire le dernier message du brasseur avant de choisir entre deux lectures d'une plainte ; la lecture « pose » a coûté une demi-voie, la capture des bords la contredisait (L01).
