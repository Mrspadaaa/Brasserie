# z1 — la pastille QR sur chaque champ (v0 QR, série z, 01.11)

**Chaleur : froide.** L'idée qu'il a déjà aimée (« J'aime beaucoup les pastilles sur les items, ça rend la chose très clair », D235),
posée sur les champs : un picto QR de 16 px avec sa pastille d'angle (coche verte, ≠ ambre, × gris) sur le montant, la devise, le n°,
la date et le créancier, exactement comme le cube des lignes porte son lien au stock. Rien d'autre ne bouge dans l'écran en ligne.

**Axes** : où = pastille par champ ; le désaccord = côte à côte (« lu 110,04 » / « QR 110,40 », chacun se touche ; le champ reste à
110,04 tant qu'il n'a rien touché) et un point numéroté 1 « Total 110,04 ≠ 110,40 » devant les autres ; le signe = le picto QR dessiné
(trois carrés de repérage) ; enrichir = dans la preuve « Lecture vérifiée », une ligne « QR-facture = lecture : montant, devise, n°, date
4/4 », puis IBAN et référence avec « Copier », et « 30 jours ».

**Honnêteté** : la pastille n'est posée que sur un champ que le QR porte (`PORTE` par état) : partiel = devise et créancier seulement,
et la ligne « QR sans montant » ; illisible = une seule pastille × sur le montant et « QR vu, illisible · la lecture seule fait foi » ;
sans = rien ; lecture = pastilles grises qui pulsent et « QR lu en 0,5 s · lignes en lecture… » (le QR arrive avant les lignes).

## Ce qui vient de la base (r2b, b1, doublon)
En-tête, « Voir le justificatif », bandeau (fournisseur, date, total 28 px, « 7 lignes », barre par lien), chips numérotées en
pointillé ambre, preuve ouverte par « n lignes », carte Règlement (Payé le · supposée · Déjà payé / À payer), lignes avec cube et
pastille de lien, Détail, plis Pour quoi / Fournisseur / Référence et TVA, pied Drive prêt + Confirmer. Lignes `data-mots="lignes"`.

## Boosters UX (boosters-ux)
- Boosters : `pastille-qr` — lire ; pastille d'angle sur le champ ; ouvre la preuve au toucher. `deux-valeurs` — choisir ; deux tuiles
  lu / QR, celle touchée devient noire, le total suit, le point 1 se barre (captures contredit / contredit-apres). `chip-qr` — suivre ;
  point numéroté, saute aux deux valeurs. `ouvrir-preuve` — lire ; « 7 lignes » déplie la preuve (capture confirme-ouvert).
  `copier-iban` — déclencher ; « Copié » 1,2 s. `bascule-reglement`, `barre-lignes`, `action-unique` : la base.
- B1 OK (8 boosters marqués) · B2 OK (le 110,40 domine ; un seul primary) · B3 OK (34 mots sans lignes ; 93 avec) · B4 OK · B5 OK
  (4–8 px) · B6 OK (12 / 14 / 16 / 28 : quatre tailles, la base en a autant) · B7 OK (CONTRASTE OK, pire CHF 5,27:1) · B8 OK (six états)
  · B9 OK (scale .97) · B10 s.o. (aucun champ saisi ici) · B11 : « 110,40 CHF, F-1001, 12.10 : tout coché par le QR » · B12 OK
  (chevrons, rayons 10/16) · B13 : pastilles de 16 px, cible 16 px — sous 24 px (écart voulu : la pastille est une marque, la preuve
  s'ouvre aussi par « 7 lignes »).
- Écarts voulus : B13 (pastille de 16 px, comme le cube des lignes).

## Contrôles (sorties)
CHOIX OK (0 écran : dépense sans entrée dans ecrans.json) · COMMUN OK (--profil=sans-houblons --sans-lignes) · MOTS OK 34 (93 avec les
lignes) · CONTRASTE OK (54 textes, pire 5,27:1) · PAGE OK (390 px, sans erreur, sans débord). Captures : les six états à 390, le geste
« prendre QR », la preuve ouverte, 1280 confirme et contredit.

## Ce qui tient, ce qui casse
Tient : zéro mot ajouté au repos en confirme ; le désaccord se règle d'un toucher ; le partiel ne ment pas. Casse : cinq pastilles sur
une ligne de bandeau à 390, c'est serré (« Malterie Fictive SA ⌑ · F-1001 ⌑ 12.10.2026 ⌑ ») ; la preuve reste fermée au repos, donc
l'IBAN est à un toucher.
