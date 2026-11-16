# En-têtes portrait r1 à r6 sur q5-tout (16.11 soir)

Ses mots : « Plus de place au graph et plus d'info sur ces mouvements, moins d'info sur le reste ». Puis « Mais on peut faire bien mieux ». Et sur la bande des semaines : « Graph trop petit donné date trop présente », « Mais l'idée est bonne ».

Base : `en/q5-tout.html`, choisie par lui. Seuls deux morceaux changent : l'en-tête q5 dans `#lhead`, et le contenu de la bande des semaines `#fh`, gardée avec `data-bande-semaines`. Le reste est identique : frise, rangées, + alignés, Porter-chariot, + S47 et onglets.

Outils :
- `en2/build-r.mjs` écrit r1 à r6. Les étiquettes sont posées dans le ciel (au-dessus de la caisse) ou sous le libre, jamais sur un trait ni sur une hachure. Les largeurs sont mesurées dans la police de la page, puis 500 ordres sont essayés et le meilleur est gardé.
- `en2/cap-r.mjs` fait les captures et les contrôles.

Données : `en/q-data.json`, avec les mêmes chiffres que q5 :
- 113 en S24 ;
- frigo 1 140 de côté ;
- mouvements au montant de l'événement ;
- bande : libre de fin de semaine et mouvement, comme dans q5-tout.

Hauteur d'en-tête = haut de la frise, bande des semaines comprise. Repère q5-tout : en-tête 190 px, courbe 50 px, bande 55 px sur trois lignes.

| v | idée | en-tête | courbe | bande |
|---|---|---|---|---|
| r1 | **Les noms dans les vides.** Chaque grand mouvement est nommé en entier dans le blanc de la courbe : ciel pour les entrées, sous le libre pour les sorties. Un fil pointillé le relie à son saut. La légende « ▧ frigo 1 140 » est posée près du creux. | 190 px | 96 px | deux chiffres sans date, 35 px |
| r2 | **La rive basse.** Les sorties du creux sont nommées sous la ligne du zéro, en escalier sur deux rangs : Hotte −900, Six fûts inox −1 080, ▧ frigo 1 140, Embouteilleuse −2 800. Les entrées (Festival +2 450, +2 140, +910) et Frigo −1 800 sont dans le ciel. Les mois passent dans le haut du tracé. | 190 px | 92 px | une ligne, 24 px : le libre, avec le mouvement en jauge colorée ; au toucher, « S50 · +988 · libre 5 120 · manque 2 j » |
| r3 | **Tout au doigt.** La plus grande courbe sous une ligne de titre, avec les montants seuls. Toucher le creux ouvre la carte de ses causes, en entier : semaine, nom, montant, frigo mis de côté. Un éventail relie la fenêtre aux six colonnes de la bande. | 190 px | 104 px | deux chiffres sans date, 35 px, accrochés à l'éventail |
| r4 | **Le genre se voit.** Une pastille de genre, aux couleurs des rangées (chariot, calendrier de fête, clé, bouteille), est posée sur chaque saut de 900 ou plus. Les noms sont posés comme dans r1. | 190 px | 96 px | mouvement d'abord (gras, en couleur), libre dessous en gris, 35 px |
| r5 | **La loupe sur le creux.** S11 à S26 sont élargis ×2,4 sur fond teinté, avec une accolade et des graduations fines sous l'axe. Les trois causes sont nommées en entier sur leur saut, avec Festival +2 450 et ▧ frigo 1 140. | 190 px | 107 px | une ligne, 23 px : le mouvement seul ; libre au toucher |
| r6 | **Bord à bord, l'en-tête dans le ciel (forme chaude).** Il n'y a plus de ligne de titre : 113 et les boutons flottent dans le ciel de la courbe, sur 390 px. Les trois causes sont nommées en entier, avec Frigo −1 800, +2 140 et ▧ frigo 1 140. | 190 px | 101 px | deux chiffres sans date, 35 px |

Gardé partout :
- 113 CHF à dépenser · S24 et son point ;
- le creux S13 → S24 teinté ;
- 6 sem. ⌄, ⏲ 2 et plein écran ;
- la fenêtre des semaines sur la courbe, avec ses poignées ;
- les mois : déc., mars, juin, sept. ;
- les sauts de 900 ou plus, marqués en couleur.

Dans la bande, il n'y a plus de S47 à S52, plus de mois ni de dates. Le libre et le mouvement restent, avec 👤 « manque 2 j » et l'idée du carnet sur S50.

## Écarts à signaler

- Mouvements non nommés faute de place, gardés en marque ou en montant :
  - r1 : Six fûts inox (montant), Fête de village (montant), Mariage (montant), Marché de printemps (marque), Frigo (marque).
  - r4 : Six fûts inox (montant) ; Mariage, Marché, Frigo et Fête (pastille seule).
  - r6 : Festival, Mariage et Marché (marque).
  - r2 : Mariage (marque).
  - r3 : les noms viennent au toucher seulement.
- Le creux est profond et étroit : les trois causes en entier, sur une courbe de 90 px ou plus, ne tiennent que dans r2 (rive), r5 (loupe), r6 (bord à bord) et dans la carte au toucher de r3.
- r5 : l'axe du temps n'est pas linéaire dans la loupe. L'écart est signalé par le fond teinté, l'accolade et les graduations.
- r5 : le libre de chaque semaine n'est plus visible au repos, il vient au toucher.
- r2 : le chiffre du mouvement vient au toucher ; au repos, la jauge en donne le sens et l'ordre de grandeur.
- r3 : la carte au toucher n'a pas de semaine pour le frigo, car aucune date de mise de côté n'est dans les données.

## Contrôles (sorties recopiées)

```
node scripts/agents/controle-entete-cal.mjs en2/r1…r6.html
ok r1.html : courbe 96 px (min 80), bande des semaines 35 px (max 40, présente), en-tête 190 px
ok r2.html : courbe 92 px (min 80), bande des semaines 24 px (max 40, présente), en-tête 190 px
ok r3.html : courbe 104 px (min 80), bande des semaines 35 px (max 40, présente), en-tête 190 px
ok r4.html : courbe 96 px (min 80), bande des semaines 35 px (max 40, présente), en-tête 190 px
ok r5.html : courbe 107 px (min 80), bande des semaines 23 px (max 40, présente), en-tête 190 px
ok r6.html : courbe 101 px (min 80), bande des semaines 35 px (max 40, présente), en-tête 190 px
ENTETE OK
node scripts/agents/controle-plus-rangees.mjs en2/r1…r6.html → 7 rangées, écart 0 px, PLUS OK (les six)
node en2/cap-r.mjs → r1…r6 : petits 0 · hors 0 · chevauchés 0 · sur trait 0 (points du texte testés contre chaque tracé, hachure comprise) · dans la fenêtre 0
```

## Captures (`en2/cap/`)

- Pour chaque version, en clair et en cave : `rN.png` et `rN-cave.png`.
- Au toucher :
  - `r2-toucher.png` et `r5-toucher.png` : bande, S50 ;
  - `r3-toucher.png` : la carte du creux.
  - Chacune existe aussi en `-cave`.
- Planches des en-têtes : `planche-clair.png`, `planche-cave.png` et `planche-toucher.png`.

Prédiction : r2 et r6 ont le plus de chances de lui plaire : la courbe double, et les causes du creux sont lues en entier sans rien toucher. r4 risque « trop chargé ».
