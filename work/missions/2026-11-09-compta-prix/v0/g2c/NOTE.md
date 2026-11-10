# g2c — Annuel, chaude : l'année en douze cases, la treizième fait le compte

**Chaleur** : chaude. **Idée** : un calendrier de 12 cases teintées par le résultat de chaque mois (rouge pâle à foncé selon la perte, vert si gagné, blanc « 0 » si rien noté, hachuré à venir) ; la treizième case, noire, porte l'année : −477,80 CHF provisoire. Dessous, la clôture en anneau 2/7 et sa prochaine étape.
**Où vit l'écran** : Finances › Annuel ; l'année se change dans la 13e case (‹ 2026).

## Chiffres (fixture, dérivés)
Mois (ventes − charges, matériel à part) : janv.–avr. 0 ; mai −43,00 ; juin −40,00 ; juil. −37,00 ; août −34,00 ; sept. −31,00 ; oct. −28,00 ; nov. +23,20 ; déc. à venir (loyer 400,00 prévu). Somme −189,80 ; amorti −288,00 → −477,80 ; stock au 31 déc. « ? ». IA « ✦ Préparer la clôture » (au toucher) : « exemple · compter le malt (3 kg de Pilsner en stock) et la bière en cuve, vérifier les 2 factures encore ouvertes », source stock et opérations.

## Problèmes résolus
7 et 29 (l'année se lit avant la clôture ; un nom), 2, BE-60 (pas de champ année).

## Baseline
Clôture : l'anneau ouvre les 7 étapes ; Impôts Fribourg (montants à reporter) ; Dossier et archives ; un toucher sur un mois l'écrit dessous, le second ouvre Opérations filtrée.

## Boosters UX
`annee-en-cases` (capture `g2c-apres.png` : mai touché), `treizieme-case`, `anneau-cloture`, `ia-cloture`.
B1 OK · B2 OK (13e case noire, 28 px) · B3 OK (59 mots) · B6 OK · B8 OK (0 vrai ≠ inconnu : case blanche « 0 » contre hachure « à venir » ; stock « ? ») · B11 « Une année en rouge, novembre en vert ; −478 provisoire » · B13 cases 74 px.

## Contrôles
PAGE OK · 59 mots · PANEL OK (0,63). Captures : `g2c-haut.png`, `g2c-page.png`, `g2c-1280.png`, `g2c-apres.png`.

## Tient / casse
Tient : la saison se voit (rénovation, puis la première vente). Casse : les cases ne montrent que le résultat, pas les ventes ; la teinte demande une échelle fixe (seuils à définir).
