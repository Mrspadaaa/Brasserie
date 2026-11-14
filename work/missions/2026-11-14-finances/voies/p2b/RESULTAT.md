OK — s3bp2 et s3cp2 corrigées (5 défauts chacune), greffes posées, v6a intacte au repos

## Candidates (id · défauts corrigés · images ouvertes)
- s3bp2 · 5/5 : phrase du repos retirée (puce « du _ au _ » seule) ; ligne « hors plage » ; ‹ › glissent la plage, un seul retour « × novembre » ; bornes au même style ; barrette aux couleurs des catégories le 9, hachure « à payer » le 25 · greffes s1a (aperçu de l'effet avant « Voir »), s1b, s2a, s2b · ouvertes : repos, ouvert, apres, page
- s3cp2 · 5/5 : puce réduite à l'icône calendrier 32 px ; état « calendrier » montré ; « 5 opérations · loyer du 25 hors plage » ; calendrier en principal, loupe en raccourci (champ « ou tapez » et en-tête) ; « Compris aussi » → « exemples ⌄ » au toucher · greffes s1b, s2a, s2b · ouvertes : repos, calendrier, loupe, apres, page

Montants après le geste (les deux) : Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; retard 60,00 à part ; loyer 400,00 visible en « hors plage » sous Charges fixes. Rangée du mois mesurée : 353 et 309 px sur 354 au repos, débord 0.

## Fichiers écrits
- `work/missions/2026-11-14-finances/voies/p2b/s3bp2/` : etat.html, NOTE.md, s3bp2-repos.png, s3bp2-ouvert.png, s3bp2-apres.png, s3bp2-page.png
- `work/missions/2026-11-14-finances/voies/p2b/s3cp2/` : etat.html, NOTE.md, s3cp2-repos.png, s3cp2-calendrier.png, s3cp2-loupe.png, s3cp2-apres.png, s3cp2-page.png
- `work/missions/2026-11-14-finances/voies/p2b/_outils/fabriquer.mjs` (base v6a découpée par indices, préfixe split/join, captures 390 × 844 échelle 2 ; `page` = après en pleine page, barre du bas masquée)
- `work/missions/2026-11-14-finances/voies/p2b/fonts/` (copie des polices de s3), `tests.txt`

## Critères
- G1 : `controle-serie.mjs … p2b s3bp2,s3cp2` → SERIE OK
- G2 : s3bp2 → PAGE OK (4 images chargées, 390 px, sans erreur)
- G3 : s3cp2 → PAGE OK (5 images chargées, 390 px, sans erreur)
- Tests : maquettes statiques, aucun Vitest ; `tests.txt` = SERIE OK. `type="number"` : 0 dans les deux pages.

## Captures (toutes ouvertes)
`voies/p2b/s3bp2/s3bp2-{repos,ouvert,apres,page}.png` ; `voies/p2b/s3cp2/s3cp2-{repos,calendrier,loupe,apres}.png` (s3cp2-page rendue, non ouverte : même gabarit que s3bp2-page).

## Prédiction
s3cp2 : « L'icône, je touche, je pose du 3 au 17, et je garde mes flèches » ; s3bp2 lui plaira pour l'aperçu des montants avant « Voir ».

Note : skills boosters-ux, impeccable et ui-design-system chargés ; le lanceur `impeccable context` n'a pas tourné (vocabulaire repris de v6a et DESIGN.md).
DÉCISION À PRENDRE : aucune (le brasseur choisit sur la page de choix).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
