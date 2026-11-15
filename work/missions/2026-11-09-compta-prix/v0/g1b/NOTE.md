# g1b — Synthèse, tiède : deux colonnes côte à côte, entré contre consommé, et la caisse libre

**Chaleur** : tiède (représentation neuve). **Idée** : deux colonnes à la même échelle (sa langue s5a, « colonnes côte à côte ») : la verte (720,00 entrés), la violette empilée par catégorie (696,80 consommés) ; l'écart est le gain, écrit en grand dans la colonne verte. Dessous, la trésorerie en barre : la part déjà promise (460,00) hachurée en rouge, le reste « libre ».
**Où vit l'écran** : Finances › Synthèse, page unique ; mois en jetons (sept., oct., nov.).

## Chiffres (fixture)
720,00 · 696,80 (charges fixes 468,00, brassage 186,80, nettoyage 42,00) · gain +23,20 · matériel 28,60 à part (colonne hachurée) · trésorerie 4 181,60 − à payer 460,00 = libre 3 721,60 (calcul, pas une donnée neuve).

## Problèmes résolus
1, 2, 22 ; en plus, « à payer » relié à la trésorerie (ce qui reste vraiment).

## Baseline
Trésorerie, Payer (jetons), coût d'un litre (ligne 7,51 CHF/L estimé), fournisseurs et matériel (repli), Compagnon (ligne). Le « Tout l'historique » part dans les jetons de mois (un jeton « tout » à ajouter en passe 2). L'avertissement TVA : absent sous 80 %.

## Boosters UX
- `deux-colonnes` — comparer ; colonnes à la même échelle ; un toucher sur une couleur estompe les autres et montre la ligne (capture `g1b-apres.png` : Brassage → Malt et houblons · Pale Ale 186,80, Comptoir du brasseur).
- `caisse-libre` — lire ; barre trésorerie, part promise hachurée.
- `periode-jetons` — suivre.
- B1 OK · B2 OK (+23,20 en 28 px) · B3 OK (59 mots) · B4 OK · B6 OK · B7 non mesuré · B8 annexe (mois sans vente : colonne vide en pointillé, « 0,00 » écrit) · B11 « J'ai fait entrer 720, la bière en a consommé 697, je garde 23 » · B13 jetons 28 px.

## Contrôles
PAGE OK · 59 mots hors données · PANEL OK (remplissage 0,67). Captures : `g1b-haut.png`, `g1b-page.png`, `g1b-1280.png`, `g1b-apres.png`.

## Tient / casse
Tient : la comparaison se voit sans lire. Casse : « Nettoyage 42 » serré (17 px de haut) ; la colonne verte unique d'une vente est vide de détail.
