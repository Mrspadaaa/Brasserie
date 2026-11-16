OK — 5 problèmes, 1 bloquant

Version : 5726c4c2 + diff de travail de la voie n2-ecran (PageShell, FloatingActions, BrewWizard, RecipePage, eau.css).
Test d'écran arrêté sur ordre du pilote : ne sont jugées que les captures ouvertes (liste « Non vu » en fin).

Sa question : combien et quels problèmes ? 5, dont 1 bloquant.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| voie `*-390-{identite,malts,houblons,levure,paliers}-{haut,bas}` | clair, cave | 390 | repos, haut et bas | 0 | 0 |
| voie `*-390-eau-haut` + banc `*-390-eau-0` | clair, cave | 390 | Eau, haut | 1 (n° 1) | 1 |
| banc `*-390-eau-30`, `*-390-eau-65` | clair, cave | 390 | Eau, défilé | 1 (n° 1) | 1 |
| banc `*-390-eau-90` | clair, cave | 390 | Eau, presque en bas | 1 (n° 2) | 0 |
| voie `*-390-eau-bas` | clair, cave | 390 | Eau, bas | 0 | 0 |
| voie `*-390-recap-{haut,bas}` | clair, cave | 390 | Récap | 1 (n° 3) | 0 |
| voie `*-1280-{identite,malts,levure,paliers,eau}-*` | clair, cave | 1280 | haut et bas | 0 | 0 |
| voie `*-1280-houblons-haut` | clair, cave | 1280 | haut | 1 (n° 5) | 0 |
| voie `*-1280-recap-{haut,bas}` | clair, cave | 1280 | Récap | 1 (n° 4) | 0 |

Captures de la voie : `work/missions/2026-11-16-nuit-recette/voies/n2-ecran/captures/`. Captures du banc critique (hors dépôt) :
`C:/Users/mrspa/AppData/Local/Temp/claude/3349b60d6511739d/58c6b16c-70d8-4954-bea0-0e2fb2601a66/scratchpad/c/` (journal.json : position du « + », éléments couverts).

## Problèmes

1. **BLOQUANT** — Eau, 390, clair et cave, en défilant (`eau-0`, `eau-30`, `eau-65`) : la rangée de fin de l'Eau n'est pas collante, donc le « + » flotte en pilule 64×40 par-dessus le contenu. Il masque l'onglet « Rinçage » en haut, puis « −33 » (alcalinité après l'acide), puis « 5,9 mL » (dose d'acide lactique). En brasseur : il cache la dose d'acide, il est encore « placé n'importe comment ». Correction : rendre la rangée de fin collante à l'Eau comme à Levure et Houblons (`endActionsCollant`), pour que le « + » reste dans la rangée à toute hauteur.
2. Mineur — Eau, 390, `eau-90` : la rangée arrive en bas de l'écran, mais le « + » n'y est pas encore posé. Il flotte juste au-dessus et empiète sur « Suivant — Récapitulatif » (journal : couvre le bouton). Puis il bascule de la pilule 64×40 au rond 48 quand la rangée entre entière. Correction : réglée par le n° 1 ; sinon, poser le « + » dès que la case est visible et garder une seule forme, le rond 48.
3. Mineur — Récap, 390, clair et cave : le pied tient sur deux lignes. Le « + » est à droite de « Enregistrer la recette » seulement, et « Enregistrer et préparer un brassin » est centré dessous. Le « + » est à x 326 au lieu de 334 aux autres étapes : il saute de 8 px en passant d'Eau à Récap. Correction : empiler les deux boutons à gauche, le « + » centré sur le bloc, au même bord droit (334) que les autres étapes.
4. Mineur — Récap, 1280, clair et cave : le groupe est centré, et le « + » (968 à 1016) dépasse de 4 px le bord droit de la colonne. Aux autres étapes, la rangée est calée à droite et le « + » s'arrête à 1012. Correction : caler le pied du Récap à droite (`justify-end`), même bord que la rangée des étapes.
5. Mineur, probablement préexistant (rangée collante déjà là au tag) — Houblons, 1280, haut, clair et cave : la rangée collante coupe « Ouvrir l'analyse de ma bière » à mi-hauteur, et le texte est tranché. Correction : réserver sous le dernier bloc la hauteur de la rangée (marge basse de la colonne).

## Doutes (non comptés)
- Avant ce changement, le « + » flottait déjà sur l'Eau mobile : le n° 1 n'est peut-être pas une régression. Il reste un défaut, sur sa plainte même.
- Houblons et Levure à 1280 : la colonne est plus large et le « + » est à x 1156, contre 964 ailleurs. Il saute de 192 px quand on change d'onglet, mais il reste fidèle à sa rangée.
- Écart « Suivant » ↔ « + » : 8 px, contre environ 19 px sur r2 et environ 10 px sur w1b. C'est proche de w1b, pas un écart.
- Titre de l'étape rogné en haut à 390 : visible aussi sur les captures des maquettes r2 et w1b, donc un artefact du banc.
- Hors voie : Malts 390, « Pilsner » deux fois (bandeau du haut et carte du bas).

## Non vu (capturé au banc, non ouvert, arrêt demandé)
- Page de la recette (« 19 L » grisé) : `c/{clair,cave}-390-apres-enreg.png`, `c/{clair,cave}-1280-apres-enreg.png`. Le DOM donne un `h1` « American IPA 30 L », avec le « + » posé dans la case `page-compact`, sans rien couvrir. Le rendu grisé n'est pas jugé.
- Menu du « + » ouvert : `c/clair-390-paliers-menu.png`, `c/cave-1280-paliers-menu.png`.
- Levure 390 à mi-défilement : `c/*-390-levure-45.png`. Mesure : « + » posé dans la rangée collante.
- Eau 390, onglet « 2. Sels » : `c/*-390-sels-{0,bas}.png`. Mesure : « + » flottant 40×40 en haut à droite (336, 72 à 80), à vérifier contre la barre « 1. Eau / 2. Sels ».
- Non capturés : clavier ouvert, fiche Récap à 1280 défilée à mi-page.
