QR-P2-Z OK — z2 et z4 refaites sur l'écran en ligne, défauts et greffes de la SYNTHESE appliqués, six états, contrôles verts.

## Fichiers écrits
- `work/missions/2026-10-31-ecran-depense/qr/v1/z2/etat.html`, `NOTE.md`, `capturer-p2.mjs` (six états à 390, sept gestes, 1280 confirme
  et contredit, pour z2 et z4), 14 captures `z2-*.png`.
- `qr/v1/z4/etat.html`, `NOTE.md`, 15 captures `z4-*.png`. Ce fichier. Les v0 sont intactes (`qr/v0/`).

## Retouche n° 1 : la base, refaite avant le QR
Listée élément par élément dans chaque NOTE (« repris tel quel » ou ce qui change et pourquoi). En résumé, retrouvés depuis les captures
`e-port/souris390-01-repos`, `-02-preuve`, `b1-bande/tactile390-5`, `dp-doublon/390-1` : les pastilles de stock « +25 kg » sur chaque
ligne, le cube avec sa pastille de lien, la mouture en sous-ligne « Rattacher » ; la tuile ① « Règlement · Payé le 12.10.2026 · supposée »
fermée au repos, sa carte au toucher (deux boîtes, phrase, Déjà payé / À payer, Moyen, C'est la date / Autre date) ; la preuve derrière
« 7 lignes » ; Détail et les plis sous les lignes ; la date en haut à droite du bandeau ; le récap cliquable avec ses renvois (chip →
point, tuile → carte, « 7 lignes » → preuve). Non repris, dit : « Achat du » (D233, une seule date), « Lier à une dépense prévue » (hors
sujet), la bande collante (n'apparaît qu'au défilement).

## Par variante
- **z2** : sceau à droite du total sur les seules lignes total + barre (fournisseur et date gardent la ligne du haut) ; cercle vide « sans
  QR » ; feuille avec IBAN et référence sur deux lignes, « ✓ copié » ; contredit dit deux fois (sceau ambre « 110,40 », tuiles « lu sur la
  page 110,04 | QR-facture 110,40 » avec « 04 » / « 40 » en pointillé, témoin « Somme des lignes 110,40 · deux contre un »), chip ① « Total »
  sans valeur qui saute aux tuiles ; « Photographier le QR » en illisible ; « pas dans le QR » en partiel.
- **z4** : section paiement repliée au repos sous les points (titre, proposition, Compte + Copier, Référence + Copier), le QR, Payable à,
  Conditions, Montant et les coches au dépli ; « À payer · 30 jours » proposé en pointillé ambre, jamais basculé seul ; à l'adoption la tuile
  porte « À payer · 11.11.2026 » et la jauge des 30 jours, le n° passe au vert ; désaccord près du chiffre (total en pointillé, pastille
  « ≠ QR », duel, témoin) repris en ligne Montant de la section ; pastille « ✓ QR » sur le total en confirme ; cercle « sans QR » ;
  Photographier en illisible ; réserve de pied.

## Sorties des contrôles (racine, `<dir>` = work/missions/2026-10-31-ecran-depense/qr/v1)
| | z2 | z4 |
|---|---|---|
| controle-choix `--ecran=depense` | CHOIX OK (0 écran conforme, 0 ouvert : dépense sans entrée) | idem |
| controle-commun `--page=etat.html --profil=sans-houblons --sans-lignes` | COMMUN OK | COMMUN OK (après S3 : rayon 9 → 10 px sur la pastille) |
| mots-premier-ecran `--max=100 --profil=sans-houblons --sans-lignes` | 28, MOTS OK | 59, MOTS OK |
| controle-contraste `--profil=sans-houblons` | OK, pire « CHF » 5,27:1 (55 textes) | OK, 5,27:1 (65 textes) |
| verifier-page `--min-images 0` | PAGE OK | PAGE OK |

## Captures ouvertes et jugées en plein format
z2 : confirme, contredit, partiel, illisible, sans, lecture, contredit-apres, confirme-ouvert, confirme-tuile, confirme-preuve,
illisible-ouvert, partiel-ouvert, confirme-1280, contredit-1280. z4 : les mêmes plus confirme-adopte.
Corrigé après les avoir vues : le pied Confirmer sortait de l'écran à 1280 quand la feuille est longue (colonne gauche à défilement, pied
collant) ; z4 en désaccord répétait le chiffre une troisième fois dans la pastille (→ « ≠ QR ») et, après adoption, écrivait l'échéance deux
fois (→ « 30 jours » dans le bouton, la date dans la tuile).

## Ce qui tient, ce qui casse
- z2 : la base est la sienne et le sceau se lit en une seconde ; en contredit le bandeau fait 150 px à 390.
- z4 : rien ne bascule sans lui et l'écart est à côté du chiffre ; la section prend 150 px au repos (90 sans proposition).

## Retouche R1 après VERDICTS-v1 (z2 retenue, z4 retouchée)
- z4 : l'IBAN se coupe après « 6238 » (« CH93 0076 2011 6238 / 5295 7 »), forcée par deux groupes insécables et un saut, à 390 comme à
  1280 ; en lecture, la sous-ligne mouture passe en squelette (facultatif, fait).
- z2 : seul changement permis, la même coupe dans la feuille « Ce que dit le QR » (chaîne `\n` et `white-space: pre-line`), à 390 et 1280.
- Contrôles rejoués : z2 CHOIX OK · COMMUN OK · MOTS OK 28 · CONTRASTE OK (55 textes, 5,27:1) · PAGE OK ; z4 CHOIX OK · COMMUN OK · MOTS OK
  59 · CONTRASTE OK (66 textes, 5,27:1) · PAGE OK. Captures refaites sous les mêmes noms (14 pour z2, 15 pour z4) ; ouvertes : z4 confirme
  390 et 1280, contredit, lecture ; z2 confirme, confirme-ouvert, confirme-1280. Un premier essai par `sed` avait glissé un vrai saut de
  ligne dans la chaîne JS de z2 (page cassée) : repris par l'outil Edit, PAGE OK ensuite.

## Prédiction de sa réaction
« Là je retrouve mon écran, mes pastilles sont là. z2 le sceau c'est clair ; z4 c'est mon bulletin et je choisis moi-même À payer, très
bien. Mais z4 prend de la place. » Il gardera z2 au bandeau et demandera la section de z4 repliée dessous.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune (celle du critique, la liste des éléments nommés de la base dans le brief d'une série créative, suffit).
