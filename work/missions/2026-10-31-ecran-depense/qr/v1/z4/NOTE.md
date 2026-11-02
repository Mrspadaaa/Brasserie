# z4 v1 — la Section paiement du QR dans le règlement (passe 2, série z, 01.11)

**Chaleur : chaude.** Même idée qu'en v0 : la Section paiement du bulletin, mot pour mot, dans l'écran, prête à payer. Refaite sur
l'écran en ligne (retouche n° 1) ; **rien ne bascule sans lui** : « À payer · 30 jours » est proposé en pointillé ambre, il touche pour
l'adopter.

## La base, élément par élément
| Élément de l'écran en ligne | Ici |
|---|---|
| En-tête, « Voir le justificatif », pied « Drive prêt · ✓ Confirmer » (jamais bloqué) | repris tels quels ; réserve de 72 px en bas (le pied ne recouvre plus Détail) |
| Bandeau : fournisseur, **date en haut à droite**, total 28 px tapable, CHF, chip « 7 lignes », barre | repris tels quels ; **ce qui change** : une pastille « ✓ QR » (greffe r2 / u2) à côté de CHF, qui dit « ≠ QR », « QR partiel », « QR » barré, « QR lu » selon l'état ; cercle « sans QR » à droite quand il n'y en a pas |
| Tuile ① « Règlement · Payé le 12.10.2026 · supposée », fermée au repos ; chip ② mouture | reprises telles quelles ; **ce qui change** : à l'adoption de « À payer », la tuile porte « À payer · 11.11.2026 » et la jauge des 30 jours (greffe r4), le n° passe au vert |
| Carte Règlement ouverte par la tuile (payé le · supposée / facture, phrase, Déjà payé / À payer, Moyen, C'est la date / Autre date) | reprise telle quelle ; « À payer » y adopte la proposition (même geste que le bouton de la section) |
| Preuve derrière « 7 lignes » | reprise telle quelle ; en contredit, « 110,40 ≠ 110,04 » |
| Lignes avec cube, pastille de lien, **pastille de stock « +25 kg »**, quantité, montant ; mouture en sous-ligne « Rattacher » | reprises telles quelles |
| Détail, plis Pour quoi ? / Fournisseur et catégorie / Référence et TVA du document, note Drive | repris tels quels sous les lignes (« Achat du » non repris : D233 ; « Lier à une dépense prévue » non repris, hors sujet) |
| Récap cliquable avec renvois | repris : chip ① « Total » saute au duel du bandeau et le surligne ; tuile → carte ; « 7 lignes » → preuve |
| Bande collante au défilement | non dessinée (repos) |
| **Ajouté** : la Section paiement, entre les points et les lignes | repliée au repos (titre « Section paiement · QR-facture », proposition, Compte + Copier, Référence + Copier : 150 px avec la proposition, 90 sans) ; au dépli : le QR dessiné, Payable à, Conditions, la ligne Montant en désaccord, et « ✓ Montant · ✓ Facture · ✓ Date » |

## Défauts corrigés (SYNTHESE, z4)
1. Base : ci-dessus. 2. Rien ne bascule seul : la tuile garde « Payé le 12.10.2026 · supposée » ; « À payer · 30 jours · proposé par le QR ·
toucher pour l'adopter » est un bouton en pointillé ambre (capture confirme, puis confirme-adopte). 3. Le désaccord près du chiffre : total
110,04 en pointillé d'attention, pastille « ≠ QR », tuiles « lu sur la page 110,04 | QR-facture 110,40 » dessous, témoin des lignes ;
la ligne Montant de la section reprend le même duel (synchronisé) ; chip ① saute au bandeau. 4. Hauteur : section repliée au repos ;
QR et « Payable à » au dépli (capture confirme-ouvert). 5. Pied : réserve de 72 px, Détail visible (capture sans).

## Greffes (SYNTHESE, z4)
- r4 : colonne fautive en pointillé dans le duel ; échéance datée « 11.11.2026 » avec jauge des 30 jours dans la tuile, à l'adoption
  seulement (D233 l'admet pour À payer ; avant, « 30 jours ») ; u4 : cercle vide « sans QR » ; u1 : « Photographier le QR » en illisible ;
  r2 / u2 : pastille « ✓ QR » sur le total en confirme, le verdict se voit sans descendre.

## Honnêteté
Partiel (bulletin ouvert) : « À payer » proposé sans « 30 jours » (le QR ne porte pas les conditions : « pas dans le QR » en pointillé),
Montant « pas dans le QR · lu 110,40 ». Illisible : section pâle « QR vu, illisible », Compte « à saisir, le QR est barré », pas de
proposition, Photographier. Sans : rien de la section, la base seule, cercle « sans QR » (distinct de « pas vérifié »). Le champ total ne
change qu'au toucher d'une tuile.

## Boosters UX (boosters-ux)
- `section-paiement` (ouvrir), `proposer-a-payer` (adopter : tuile, segment, échéance, jauge), `duel` + ligne Montant (choisir), `chip-qr`,
  `pastille-qr`, `copier` (✓ copié), `photographier`, `tuile-reglement`, `cest-la-date`, `bascule-reglement`, `ouvrir-preuve`,
  `total-tapable`, `barre-lignes`, `rattacher`, `action-unique`.
- B1 OK (16) · B2 OK · B3 OK (59 mots sans lignes : la section porte IBAN et référence) · B4 OK · B5 OK · B6 OK (12 / 14 / 16 / 28 + 18) ·
  B7 OK (pire 5,27:1) · B8 OK · B9 OK · B10 s.o. · B11 : « 110,40 CHF, QR d'accord, et voilà de quoi payer ; à payer si je veux » · B12 OK ·
  B13 OK (Copier 24 px, proposition 28 px, tuiles 40 px).
- Écart voulu : la section ajoute ≈ 150 px au repos (90 sans la proposition) ; c'est l'idée.

## Contrôles (sorties, `<dir>` = qr/v1)
CHOIX OK (0 écran) · COMMUN OK (--profil=sans-houblons --sans-lignes ; S3 a demandé un rayon de 10 px sur la pastille) · MOTS OK 59 ·
CONTRASTE OK (65 textes, pire 5,27:1) · PAGE OK. Captures : six états à 390 ; gestes contredit-apres, confirme-ouvert, confirme-tuile,
confirme-adopte, confirme-preuve, illisible-ouvert, partiel-ouvert ; 1280 confirme et contredit.

## Ce qui tient, ce qui casse
Tient : la section est son bulletin, le règlement ne ment plus (proposé, pas basculé), l'écart est à côté du chiffre. Casse : 150 px au
repos.

## Retouche R1 (verdict du critique neuf, VERDICTS-v1)
L'IBAN se coupe après « 6238 » (« CH93 0076 2011 6238 / 5295 7 »), forcée à 390 et à 1280, comme la feuille de z2 ; en lecture, la
sous-ligne mouture est en squelette. Contrôles rejoués : CHOIX OK · COMMUN OK · MOTS OK 59 · CONTRASTE OK (66 textes, pire 5,27:1) ·
PAGE OK. Captures refaites sous les mêmes noms et ouvertes : confirme (390, 1280), contredit, lecture.
