# g2a — Annuel, froide : le résultat de l'année d'abord, la clôture en une piste

**Chaleur** : froide. **Idée** : l'écran d'aujourd'hui retourné : le résultat 2026 en tête (bloc bleu), les douze mois en barres ventes / charges, puis la clôture en piste de 7 cases et seulement les deux étapes suivantes ; impôts Fribourg et archives au second plan.
**Où vit l'écran** : Finances › Annuel. L'année se choisit en segment (2025 | 2026), plus de champ tapé (BE-60).

## Chiffres (fixture, au 9 nov. 2026, tous dérivés)
Ventes 720,00 · charges 909,80 (novembre 696,80 + petits achats mai–oct. 43+40+37+34+31+28 = 213,00) · amorti 288,00 (cuve : 20 % de 1 440,00, dégressif) · stock « ? » (inventaire à compléter) → **−477,80 CHF provisoire**. Mois : janv.–avr. 0 (historique complet depuis le 1er janv.), décembre hachuré « à venir · loyer 400,00 prévu ». Clôture 2/7 (solde d'ouverture et matériel prêts).

## Problèmes résolus
2 (le même résultat que la Synthèse, amorti en plus), 7 (résultat avant la clôture), 29 (un nom, pas d'étapes Préparer/Reporter/Dossier au premier plan), 8 (rubriques non vérifiées : au second plan, dans Impôts Fribourg), BE-60.

## Baseline
Les 7 lignes de clôture : la piste (toucher = la liste), les deux suivantes visibles. Reporter / Dossier / archives : lignes « Impôts Fribourg » et « Archives ». Compagnon : « ✦ Ce qui manque » (au toucher, « exemple », source registre de clôture). Termes FriTax, annexes, immobilisation : au second plan seulement.

## Boosters UX
`annee-segment`, `resultat-annee`, `mois-barres` (toucher un mois → ventes − charges du mois), `piste-cloture`, `etape-suivante`, `ia-cloture`.
B1 OK · B2 OK · B3 OK (59 mots) · B6 OK · B8 OK (stock « ? » hachuré, décembre hachuré, « provisoire ») · B11 « Je suis à −478 cette année, sans compter le stock ; il me reste l'inventaire » · B13 barres de mois 26 px de large.

## Contrôles
PAGE OK · 59 mots · PANEL OK (0,52). Captures : `g2a-haut.png`, `g2a-page.png`, `g2a-1280.png`, `g2a-apres.png`.

## Tient / casse
Tient : la réponse d'abord, la clôture lisible. Casse : sur une année presque vide, les barres de mai à octobre sont des traits.
