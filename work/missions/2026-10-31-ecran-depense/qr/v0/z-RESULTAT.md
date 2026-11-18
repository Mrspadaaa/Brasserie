QR-Z OK — quatre mini maquettes jouables z1 à z4 (pastille, sceau, bande perforée, section paiement), six états, contrôles verts.

## Fichiers écrits
- `work/missions/2026-10-31-ecran-depense/qr/v0/z1/etat.html`, `NOTE.md`, `capturer-z.mjs` (les captures de la série : six états à
  390, geste « prendre QR », geste « ouvrir », 1280 confirme et contredit), 10 captures `z1-*.png`.
- `qr/v0/z2/etat.html`, `NOTE.md`, 10 captures ; `qr/v0/z3/…`, 10 captures ; `qr/v0/z4/…`, 9 captures (rien à ouvrir).
- Ce fichier. Rien hors de `qr/v0/z*`.

## Les quatre, en une phrase
- **z1 (froide)** — la pastille QR sur chaque champ qu'il confirme (montant, devise, n°, date, créancier), comme la pastille des items
  qu'il a aimée ; en désaccord, lu / QR côte à côte sous le total, et le point 1.
- **z2 (tiède)** — le sceau : le QR suisse dessiné à droite du bandeau, un bandeau de verdict dessous (✓, 110,40, partiel, illisible,
  lecture…), qui ouvre « Ce que dit le QR » (champs cochés, IBAN, référence, conditions, Copier).
- **z3 (chaude)** — la bande perforée « ✂ QR-facture … » cousue sous le bandeau, qui se déplie ; en désaccord, le champ propose : lue
  barrée petite, QR grand en pointillé ambre, rien appliqué sans lui (Détail « 110,40 / 110,04 »).
- **z4 (chaude)** — la Section paiement du bulletin, reproduite dans la carte Règlement, qui passe sur « À payer · 30 jours · QR » ;
  IBAN, référence, créancier à copier ; montant, n° et date cochés en bas ; le point « Payé supposée » disparaît.

## Sorties des contrôles (racine, `<dir>` = qr/v0)
| | z1 | z2 | z3 | z4 |
|---|---|---|---|---|
| controle-choix `--ecran=depense` | CHOIX OK (0 écran conforme, 0 ouvert : dépense sans entrée dans ecrans.json) | idem | idem | idem |
| controle-commun `--profil=sans-houblons --sans-lignes` | COMMUN OK | COMMUN OK | COMMUN OK | COMMUN OK |
| mots-premier-ecran `--max=100 --profil=sans-houblons --sans-lignes` | 34, MOTS OK | 35, MOTS OK | 41, MOTS OK | 64, MOTS OK |
| idem sans `--sans-lignes` (pour mémoire) | 93 | 94 | 92 | 108 (> 100) |
| controle-contraste `--profil=sans-houblons` | OK, pire « CHF » 5,27:1 | OK, 5,27:1 | OK, 5,27:1 | OK, 5,27:1 |
| verifier-page `--min-images 0` | PAGE OK | PAGE OK | PAGE OK | PAGE OK |

Adaptations d'arguments : `controle-commun` est lancé avec `--profil=sans-houblons` (écran sans houblon, D202) et `--sans-lignes`
(D238, consigne du pilote) ; `mots-premier-ecran` et `controle-contraste` reçoivent le même profil. Sans `--sans-lignes`, z4 est à 108.
S4 (deux épaisseurs de trait d'icône) a demandé d'unifier les traits rendus à 1,5 / 1,7 px sur les quatre pages (le contrôle chaîne les
épaisseurs à 0,3 près, et 1,8 − 1,5 dépasse 0,3 en flottant).

`controle-panel` sur une capture par concept (les quatre « contredit ») : remplissage médian 0,58, 0 sous 0,50 ; ressemblance 0,95,
2 paires sur 6 au-dessus de 0,95 → PANEL ECHEC sur la diversité. C'est structurel : le brief impose l'écran en ligne tel quel (règle
n° 1) et ne libère que le contrôle du QR, soit 60 à 180 px sur 844 ; la vignette 24 × 52 du contrôle voit surtout la base commune. Le
remplissage, lui, passe.

## Captures ouvertes et regardées (toutes, en plein format)
z1 : confirme, contredit, contredit-apres, partiel, illisible, sans, lecture, confirme-ouvert, confirme-1280, contredit-1280.
z2 : les mêmes dix. z3 : les mêmes dix. z4 : neuf (sans « ouvert »).
Ce que j'y ai corrigé après les avoir vues : la carte Règlement cassée sur deux lignes à 390 (z1, puis les quatre) ; une bande grise de
« lignes à venir » qui ressemblait à du vide (remplacée par les sept vraies lignes, Détail et les plis de la base) ; la ligne IBAN qui
se repliait mal à 1280 (z1) ; la bande de z3 rognée à 390 (passe sur deux lignes) ; z4 qui sautait le n° 2 des points et gardait
« À payer » avec un QR illisible (le règlement reprend celui de la lecture).

## Ce qui tient, ce qui casse (court ; détail dans chaque NOTE)
- z1 tient par sa sobriété (zéro mot ajouté en confirme) ; casse par la ligne du bandeau serrée (cinq pastilles) et l'IBAN à un toucher.
- z2 tient par la reconnaissance immédiate (c'est son bulletin) ; casse par IBAN et référence rognés à 390 et 72 px pris au bandeau.
- z3 tient par la forme (la découpe ✂) et un désaccord impossible à rater ; casse par la bande sur deux lignes à 390, et « la lue
  barrée » qui peut se lire comme déjà remplacée (le Détail 110,40 / 110,04 et le pointillé disent le contraire).
- z4 tient par la justesse métier (QR-facture = à payer, et tout pour payer) ; casse par 180 px pris dans la feuille et une facture
  déjà payée qu'il devra basculer lui-même.

## Prédiction de sa réaction
Il dira « z2 ou z4 » : z2 parce qu'il voit son QR et son verdict en une seconde (« très clair »), z4 parce que la section paiement
« c'est exactement ça » et qu'il paie depuis l'app ; il demandera de greffer les pastilles de z1 sur les champs de z2 ou z4, et trouvera
z3 « pas mal mais ça fait beaucoup » en désaccord.

DÉCISION À PRENDRE : `controle-panel` ne peut pas juger un lot dont la base est imposée (ressemblance 0,95 par construction) ; le
pilote tranche si le PANEL se joue ici sur la seule zone du QR (rognée) ou se note sans bloquer.

CONNAISSANCE : S4 de `controle-standard` chaîne les épaisseurs rendues à 0,3 près ; 1,5 et 1,8 ne se chaînent pas (0,30000000000000004) :
viser 1,5 / 1,7, et vérifier qu'une règle CSS de taille d'icône ne touche pas une coche imbriquée (le trait rendu change avec la boîte).

LEÇON PROPOSÉE : aucune.
