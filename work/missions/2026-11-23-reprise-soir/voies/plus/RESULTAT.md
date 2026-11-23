OK — le voile du menu + n'est plus rogné : le défilement passe de la pile à un conteneur intérieur (preuve en ligne à faire)

## Cause
Capture 2340-plus.jpg ouverte : le panneau flouté commence au bord gauche des pilules (x≈82 px sur 390) au lieu de déborder de 78 px à gauche ; cartes de Bord lisibles à gauche du panneau, tronquées par son bord net.
`.plus-pile` porte `overflow-y: auto` (PLUS-MENU-COUPE, 22.11, pour que la pile défile). Un `overflow` rogne les pseudo-éléments positionnés de la pile : son voile propre `.plus-pile::before` (left -78 px, top -120 px, bottom -76 px) était rogné au cadre de la pile. Le fichier navigation.css est identique de tour30 à tour35 : aucune règle récente (frise.css, entete.css, DashboardTab) n'est en cause ; la frise ne touche `.plus-pile` que par la règle paysage `deux-blocs` (inchangée). Le « nouveau » vient de Bord : longue liste de texte derrière le panneau, que l'ancien écran masquait peu. Le commit exact ne se retrouve pas par git : l'historique est comprimé en un commit (875751dcb). Cause établie par lecture du CSS et de la capture, non rejouée en ligne (voie sans capture locale).

## Correction (à la source, portée CSS)
- `src/components/navigation/PlusSheet.tsx` : la pile (retour hors `deux-blocs`) est enveloppée dans `<div className="plus-pile-defile">`.
- `src/components/navigation/navigation.css` (le seul CSS fautif) : `overflow`, `max-height`, `overscroll`, scrollbar passent de `.plus-pile` à `.plus-pile-defile` (colonne inversée, gap 6, largeur 100 %) ; variantes `data-sens='bas'`, 1280 (max-height) et paysage (padding-right 2 px) déplacées sur le conteneur. Le `::before` n'est plus rogné.
- `deux-blocs` (paysage, calendrier) inchangé : la pile y est déjà `overflow-visible`, le conteneur n'y est pas rendu.

## Critères
- tsc : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register), aucune neuve.
- Tests plus-commun-identique, plus-ecran-pile, plus-libelle-unique : 3 fichiers, 12 verts (tests.log).
- Accolades et commentaires du CSS équilibrés (66/66, 27/27).
- Preuve en ligne : au pilote. À regarder : Bord à 390, menu ouvert : le flou déborde à gauche jusqu'au bord, plus de texte de carte entre les pilules ; Calendrier paysage ; 1280 ; défilement d'une pile longue (13 lignes) toujours possible, ligne contre le + visible.

## Fichiers écrits
src/components/navigation/PlusSheet.tsx, src/components/navigation/navigation.css, ce dossier.

Essais : 1. Doutes : le flou et son masque se jugent à l'œil ; 12 px d'ombre des pilules restent rognés à droite par le conteneur (comme avant, le padding de 2 px n'existait qu'en paysage).
CONNAISSANCE : un `overflow` sur un élément rogne ses pseudo-éléments absolus : le voile d'un menu défilant se pose hors du conteneur qui défile.
LEÇON PROPOSÉE : aucune
