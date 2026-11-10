# Inventaire pu4d → app (court, une ligne par élément). Sort : G gardé · P porté (neuf) · R retiré (pu4d ne l'a pas) · A ajouté (cas que pu4d ne montre pas)

Avant : `ExpenseSheet.tsx` (ancien `plateauEl`, `plusEl`, `calculEl`, `articleEl`). Après : `Plateau.tsx` (présentation), `calculPlateau.ts` (règles), `ExpenseSheet.tsx` (données).

## Tous les cas (repos, a à f)
- imprimé « nom · réf » : G (`Imprime`) ; + « · 1 Stk » quand l'unité imprimée est une pièce écrite autrement (D353) : P.
- ligne d'options « comprises / tel qu'imprimé » : R (`data-dp-options`).
- champs `[q] [unité] × [prix] = [montant]` : P (36 px, largeur du contenu, mono) ; D277 niveaux sur le champ : G.
- unité en segment 2-3 cases avec la pièce (Kg|g|pièce, g|Kg|pièce, sachets|g|pièce, pièce|L) : P ; ancien champ texte « Unité ligne » et segments g/kg/Stk : R.
- « ✓ au centime » : R (D351) ; « ≠ montant, écart à vérifier » : G.
- ancienne valeur barrée avant la quantité (e, avant acceptation) : P ; après acceptation rien (D354, déjà fait par g7) : G.
- nature Ingrédient | Service | Matériel : G (restylé) ; « Type d'achat » (menu) : R.
- « 18 → 24 Kg » à droite de la nature (a) : P, calculé (`apresReception`).
- ligne « article « X » · relié ⇄ Retirer » : G ; « proposé » + Garder : G ; « relié à X, nom déjà au stock » : G.
- mouture « ↳ mouture, ligne 2 · 6 Kg × 0,10 = 0,60 · Rattacher » : P ; rangée imbriquée de la mouture : R.
- rangée discrète « extrait · supprimer » : P (extrait montre `line.evidence`, surligné ; absent sans preuve) ; « Voir l'extrait », « Retirer la ligne » : R.
- ancien formulaire sous « plus » (libellé, type d'achat, fiche matériel, menu du stock) : R.

## b (bis, D215)
- duel FACTURE | STOCK + trait ≈ : P. Trois sorties (bis proposé, Relier à X, Nouvel article « doublon ») avec concordances : P, tirées de `ecartsEntre` et du voisin réel.
- « ≈ 1 ct » (IA) : R, aucune source dans l'app. « Garder le nouvel article » / barre du bis quand ouvert : fondus dans les sorties.
## c (hors stock) + greffe pa1d
- « article — · hors stock » + « + Suivre au stock » : P ; types Nettoyage | Entretien | Emballages | Outillage en pastilles d'un toucher : P.
## d (unité à remplir)
- boîte rouge tiretée `▒` ; cinq cases (Kg, g, sachet, pièce, L), prix par unité dessous, unité du stock proposée : P ; duel extrait | « compté en Kg » : P ; barre « g kg Stk » sous la rangée quand le plateau est ouvert : R.
## e (avant acceptation)
- duel 1re / 3e lecture | stock « 4 → 7 sachets » ; « Garder 3 » / « Remettre 2 » : P.
## f (extrait ouvert) : P.
## D364 (ajout)
- champ « Famille » (liste des bandes, la bande actuelle choisie) dans la rangée discrète : A.
