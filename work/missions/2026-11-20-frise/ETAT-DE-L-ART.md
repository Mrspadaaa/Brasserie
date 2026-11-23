# Frise au doigt : état de l'art (20.11.2026)

Ses demandes, mot pour mot (SPEC-BRASSEUR, 20.11) : « je peux pas le reculer » ; « Toujours très compliqué de reculer
le graph » ; « Pareil pour l'agrandir vers le futur » ; « frise de période et le curseur d'un malt pourquoi 2 différents,
c'est pareil au final ?? » ; « pour le malt c'est que dans un sens (augmenter la quantité) alors que le temps c'est passé
et futur ». Maquette : `frise-interactive.html` (même dossier). Les règles numérotées du comportement à porter sont en
tête de ce fichier HTML.

## Problème d'école

Sélecteur de plage (range slider, brush) sur un axe plus long que l'écran, manipulé au doigt. Cas particulier : la plage
ancrée à 0 (curseur à une valeur, le malt).

## Examiné

| Référence | Ce qu'elle fait | Ce qu'on garde |
|---|---|---|
| Découpe vidéo d'iOS Photos | poignées épaisses hors de la pellicule ; tenir au bord fait avancer ; poignée qui garde son écart au doigt ; pas d'inertie | variante A : poignées sous l'échelle, entières à l'écran |
| Sélecteur de période des graphiques boursiers (Highcharts Navigator, TradingView) | corps = déplacer, bords = étirer, pince à deux doigts ; glisser hors de la fenêtre déplace la vue | variante B : on tient la plage elle-même |
| d3-brush en tactile | poignées fines à zone élargie (handleSize) ; corps « move » ; toucher le fond crée une nouvelle sélection | le découpage des rôles ; PAS la création au toucher (effet de bord) |
| Pointer Events (W3C) | un code pour doigt, souris, stylet ; `setPointerCapture` ; `touch-action: none` ; `pointercancel` | tout le moteur ; `touch-action` sur la frise seule |
| Cibles (WCAG 2.5.5, Apple HIG) | 44 × 44 px | 44 px de zone pour les poignées, dessin fin ; zones jamais superposées |
| Défilement au bord (glisser-déposer iOS, Excel) | bande au bord, vitesse selon la profondeur | bande de 40 px, 0,15 à 1,35 vue par seconde, armée seulement en allant vers le bord |

## Causes probables des plaintes (captures 3 et 5)

- Poignée gauche à moitié hors de l'écran (capture 5) : sa cible est coupée ; aucun défilement au bord.
- Saisie en position absolue : la valeur saute sous le doigt, et un toucher pose quelque chose (le « point » de la
  capture 3, rond pointillé sur la frise).

## Décision

- Un seul moteur (~300 lignes, Pointer Events, sans bibliothèque) avec deux réglages : temps (deux poignées, défile vers
  le passé et le futur) et malt (une poignée ancrée à 0, l'échelle s'étend vers le haut seulement, revient au palier
  utile après le lâcher).
- Inertie : non pour toute valeur. Aimant : non ; seul l'arrondi au pas du métier (semaine, 0,05 kg).
- Bibliothèques écartées : d3-brush (d3-selection, création au toucher à neutraliser, pas d'axe qui défile) ;
  noUiSlider (pas d'axe qui défile ni d'extension d'échelle).
- Deux variantes du même comportement pour son choix : A (poignées sous l'échelle) et B (on tient la plage, pince).

## Suite du 20.11 : B retenue

« B mais il y a plusieurs petits soucis, et surtout sur la frise du temps, l'échelle doit changer pour toujours voir les 2 bouts ». A retirée. Au réglage temps, l'échelle s'ajuste pour garder les deux bouts à 56 px des bords, au repos comme pendant le geste (le bord tiré vers l'extérieur resserre l'échelle, l'autre bout reste en place ; le corps fait défiler l'échelle sous la plage) ; plus de flèche ni de bouton sur un bout ; graduations à pas réguliers (mois, trimestre, semestre, année, ou semaines). Règles R1 à R14 dans le HTML.
