# p3a-3 — bandes teintées, deux rangées à la r1, filtre du récap (passe 3, seconde passe de dessin, 01.11)

- **Chaleur** : tiède. Même base que p3a-1 : r2b de l'app en plein écran, le récap qu'il a entouré ouvert d'office, les pastilles de r1.
  Seuls les axes changent (objet `CFG`).
- **Axes** :
  - en-tête de groupe : une bande pleine teintée par catégorie, et un liseré de cette couleur sur chaque ligne ;
  - densité : deux rangées compactes, à la r1 (nom et montant ; « 6 Kg × 2,30 » dessous, en 12 px) ;
  - renvoi : un filtre temporaire, sous un bandeau noir « bis 2 · ✕ Toutes les lignes » ;
  - la mouture sous son malt ;
  - l'échec Drive : une pastille rouge « Drive ✕ » qui reste sur la dépense du journal, et un toast qui ne part pas seul (Renvoyer le
    justificatif · Reconnecter Drive). Une fois le toast fermé, la pastille reste, et elle rouvre la dépense ;
  - le réussi : rien.
- **L'idée** : la couleur de la catégorie tient le regroupement, et chaque compte du récap filtre la liste sur ses lignes.

## Comptes de lignes
- Base : a=7 b=10.
- p3a-3 : **a=12 b=17**, LIGNES OK. La rangée de 24 px et le détail de 16 px font environ 40 px par ligne ; la mouture tient en une rangée.

## Mots (D238)
`data-mots="lignes"` sur le seul conteneur des lignes. Avec `--sans-lignes` : **51 mots**, MOTS OK.

## Baseline, pastilles de r1, états, boosters
- Comme dans p3a-1 : même code, autre `CFG`.
- En plus : `filtre`, `pastille-drive` et `echec-drive` (le toast).
- B8 : le filtre se lève d'un toucher, et tout geste sur la bascule de l'ordre le lève aussi.

## Contrôles (01.11, depuis la racine)
- `controle-commun … --profil=sans-houblons --sans=mots` : COMMUN OK. `mots` est sauté (D238) et joué à part.
- `mots-premier-ecran … --max=100 --sans-lignes` : 51 mots, MOTS OK.
- CONTRASTE OK : 156 textes, le pire est 5,24:1.
- PAGE OK. LIGNES OK.

## Captures ouvertes
- `p3a-3-repos.png` : les bandes Malts et Houblons.
- `p3a-3-renvoi.png` : le filtre « bis 2 » ; seules Target et Hallertauer restent, chacune avec son règlement.
- `p3a-3-echec.png` : la pastille et le toast.
- `p3a-3-defile.png`.

## Ce qui tient, ce qui casse
- **Tient** : le calcul « 40 g × 0,040 » est lisible sur chaque ligne, comme sur r1. Le filtre montre seulement ce que le compte annonce.
- **Casse** : b=17 seulement, à cause de la seconde rangée. Sous le filtre, le sous-total affiché reste celui de tout le groupe Houblons.
  C'est voulu, mais ça peut surprendre.
