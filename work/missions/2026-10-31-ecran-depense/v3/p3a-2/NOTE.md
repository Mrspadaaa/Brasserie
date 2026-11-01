# p3a-2 — tableau, groupes repliables, Services à part (passe 3, seconde passe de dessin, 01.11)

- **Chaleur** : tiède. Même base que p3a-1 : r2b de l'app en plein écran, le récap qu'il a entouré ouvert d'office, les pastilles de r1. Seuls
  les axes changent ; un objet `CFG` les décrit.
- **Axes** :
  - en-tête de groupe repliable, avec ses chiffres (chevron SVG) ;
  - colonnes alignées en tableau (qté · prix · CHF), une seule rangée d'en-têtes au-dessus des groupes ;
  - renvoi : les autres groupes se plient ;
  - mouture dans son groupe Services (5 · 15 Kg · 1,50), son malt écrit sur la ligne ;
  - échec Drive : carte rouge flottante au-dessus de la navigation, qui ne part pas seule ;
  - réussi : reçu discret « ✓ Justificatif dans le Drive », qui s'efface en 4 s (`?etat=recu`).
- **L'idée** : il lit sa facture comme un tableau de comptable ; un compte du récap replie tout sauf ce qu'il vise.

## Comptes de lignes
- Base : a=7 b=10 (app servie, voir p3a-1).
- p3a-2 : **a=11 b=18**, LIGNES OK. Rangées de 28 px.

## Mots (D238)
Le conteneur des lignes porte `data-mots="lignes"`, et lui seul. L'en-tête des colonnes, le récap, les points et les boutons de fin restent
comptés. Résultat avec `--sans-lignes` : **54 mots**, MOTS OK.

## Baseline, pastilles de r1, états
- Comme dans p3a-1 (même code, autre `CFG`).
- La mouture n'est plus sous son malt : elle est rattachée d'un geste sur sa ligne de Services, et son malt y est nommé.

## Boosters UX
- Comme dans p3a-1, plus `sous-total` repliable (`aria-expanded`), `recu` et `echec-drive` (carte).
- B13 : rangées de 28 px, cibles de 24 px au moins. B6 : le prix en 12 px gris, la quantité et le montant en 14 px.

## Contrôles (01.11, depuis la racine)
- `controle-commun … --profil=sans-houblons --sans=mots` : COMMUN OK. `mots` est sauté parce qu'il compte sans `--sans-lignes` (D238) ; le
  compte des mots est joué à part.
- `mots-premier-ecran … --max=100 --sans-lignes` : 54 mots, MOTS OK.
- CONTRASTE OK : 196 textes, le pire est « TVA » à 5,24:1.
- PAGE OK. LIGNES OK.

## Captures ouvertes
- `p3a-2-repos.png` : le tableau, Malts ouvert, Houblons en dessous.
- `p3a-2-renvoi.png` : « 2 bis » joué ; Malts, Levures et Services pliés ; Target et Hallertauer éclairés.
- `p3a-2-echec.png` : la carte flottante sur Finances.
- `p3a-2-defile.png`.

## Ce qui tient, ce qui casse
- **Tient** : la colonne prix permet de vérifier quantité × prix d'un coup d'œil. Plier les groupes laisse le renvoi seul à l'écran.
- **Casse** : le prix à 4 décimales (0,0800, tel qu'imprimé) élargit la colonne. Services sépare la mouture de son malt : il faut lire le
  nom pour faire le lien.
