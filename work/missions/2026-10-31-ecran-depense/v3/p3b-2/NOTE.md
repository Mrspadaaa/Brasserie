# p3b-2 — les tiroirs (passe 3, 01.11)

- **Chaleur** : chaude (forme libre, même base).
- **Axes** : en-tête de groupe = **tiroir repliable avec ses chiffres** (lignes, quantité par unité, montant, jauge de sa part des
  86,50) ; densité = les lignes en **tuiles, deux par rangée** (trois à 1280) ; renvoi = **pliage des autres groupes** (« 2 bis » :
  seul Houblons reste ouvert, ses deux bis cerclées, « Tout déplier ») ; sous la barre des 23 lignes, la **barre des quatre
  tiroirs** (un toucher ouvre le sien) ; mouture **dans son groupe Services** (« → Maris », rattachement sur l'en-tête) ; tiroirs
  dans l'ordre de l'argent (Malts 35,35 · Levures 29,60 · Houblons 20,05 · Services 1,50) ; bascule « Tiroirs | Papier » ;
  échec Drive = **pastille rouge persistante sur la dépense du journal + toast** qui ne part pas seul (✕ le masque, la pastille
  reste) ; réussi = rien.
- **L'idée** : ses achats rangés en tiroirs qui disent, fermés, combien il en a pris ; ouverts, chaque ligne est une tuile.

## Base et pastilles de r1
Mêmes coches que p3b-1 (bandeau, preuve ouverte d'office, comptes en pastilles r1 qui renvoient, six points sur leur ligne :
4, 5, 6 dans la tuile, 3 sur l'en-tête Services, 1 et 2 en tuiles). Pastilles de ligne : picto du lien, « = 2 sachets »,
« 30 ? » en ambre, α. Écart : la mouture quitte son malt (axe Services) ; son malt reste nommé dans la tuile et le plateau.

## Baseline — cochée
Comme p3b-1 (justificatif, Total, Pour quoi ?, Achat du, règlement, échéance, fournisseur, lier, plateau de ligne complet,
ajouter, regrouper, Détail X / Y, Référence et TVA, Confirmer jamais bloqué, ×) ; [~] fiche matériel. Drive : rien avant Confirmer.

## Boosters UX
- Boosters : `barre`, `tiroirs-barre`, `tiroir`, `renvoi`, `preuve`, `compte-liens`, `ordre`, `ligne`, `plateau`, `bis`, `unite`,
  `mouture`, `tva`, `paye`, `reglement`, `achat-du`, `justificatif`, `confirmer`, `pastille-drive`, `echec-drive`, `lecture`, `hors-ligne`.
- B1 OK (plier, ouvrir, cercler) · B2 OK · B3 OK (42 mots hors lignes) · B4 OK (tiroirs) · B5 OK · B6 OK · B7 OK (5,24:1) ·
  **B8 OK** (12 états) · B9 OK (chevron 180 ms, réduit sans mouvement) · B10 OK · **B11 OK** (« quatre tiroirs, Malts 18 Kg
  35,35 en tête ») · B12 OK · B13 OK (tuiles 40 px, boutons 24 px).

## Lignes
`LIGNES a=9 b=20` ; base, l'app servie : `LIGNES a=7 b=12` → LIGNES OK.

## Ce qui tient, ce qui casse
- Tient : fermé, un tiroir répond « combien de houblon » sans rien ouvrir ; le pliage montre la cible sans la perdre de vue.
- Casse : les tuiles se lisent en Z, pas en colonne comme le papier ; une tuile longue (« LALLEMAND Windsor ») se coupe.

## Corrections du critique 3c (01.11)
Voir `../p3b-RESULTAT.md`, section « Corrections du critique ».
- Pendant la lecture, Déjà payé et À payer sont gris.
- La navigation est celle de l'app.
- LALLEMAND Windsor est en entier à 390.
