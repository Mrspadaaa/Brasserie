# p3b-1 — le registre (passe 3, 01.11)

- **Chaleur** : tiède (la forme de r2b, mise en colonnes).
- **Axes** : en-tête de groupe = bande pleine teintée par catégorie, collante ; densité = une rangée en colonnes alignées
  (picto · nom et pastilles · qté · CHF) ; renvoi = **filtre temporaire** (« 2 bis · 21 autres masquées · Tout voir ✕ ») ;
  échec Drive = **carte flottante au-dessus de la navigation** ; réussi = reçu discret qui s'efface (3 s) ; mouture **sous son
  malt** (sous-ligne de r2b et de l'app) ; bascule « Catégories | Papier ».
- **L'idée** : sa facture en registre plein écran, chaque catégorie une bande teintée qui porte lignes, quantité et montant.

## Base (règle n° 1) et pastilles de r1
- Base : r2b portée dans l'app (bandeau, preuve ouverte d'office, tuiles 1 TVA et 2 Payé, ticket, rubriques, pied), plancher.
- [x] bandeau (fournisseur, une seule date = Achat du, 86,50, « ✓ 23 lignes », barre des 23 lignes, un toucher → la ligne)
- [x] preuve : somme = imprimé 86,50 · qté × prix 23/23 · lectures 2/2 · page 2 coupée ; comptes des liens en pastilles r1
  (picto + nombre, en tirets ambre pour les doutes) ; chaque compte est un bouton qui renvoie
- [x] pastilles r1 sur la ligne : picto du lien (relié, nouveau, bis, unité ?, mouture), « = 2 sachets », « unité ? », « supposée »
- [x] les six points se règlent sur leur ligne : 1 TVA (2,80 · 4,15 · — proposé), 2 Payé (supposée), 3 « Tout rattacher » ou
  une à une, 4 Target bis, 5 g · kg · Stk, 6 Créer CH
- Passe 3b : les comptes du récap gardent leurs mots, comme r2b (« 13 reliés · 2 nouveaux · 2 bis · 1 unité ? · 5 moutures
  +1,50 »). « Rattacher les 5 » devient « Tout rattacher » (même geste). La bande Houblons tient sur une ligne (« 270 g · 30 ? »).
  Pendant la lecture, les rubriques disent « à lire » ou « à taper » ; aucun chiffre de la facture n'y figure avant qu'elle soit lue.

## Baseline (BRIEF § Obligatoire 1) — cochée
[x] justificatif (icône d'en-tête : voir, changer ; rouverte : renvoyer) · [x] Total TTC · [x] Pour quoi ? (proposé) ·
[x] Achat du (la date du bandeau) · [x] Déjà payé / À payer, payé le, E-Finance · [x] échéance (À payer) · [x] fournisseur et
catégorie · [x] lier à une dépense prévue · [x] lignes (plateau : imprimé, code, qté × prix = montant éditables, contrôle au
centime, Ingrédient / Service / Matériel, article ⇄, aucun mouvement, retirer) · [x] ajouter · [x] regrouper · [x] Détail X / Y ·
[x] Référence et TVA · [x] pied Confirmer, jamais bloqué · [x] × · [~] fiche matériel non dessinée (aucune ligne matériel).
Drive : rien avant « Confirmer ».

## Sous-totaux (vrais chiffres)
Malts 7 + ↳5 · 18 Kg · 36,85 (35,35 de malts + 1,50 de moutures ; les kg des moutures ne s'ajoutent pas) · Houblons 7 ·
270 g et 30 ? (deux sous-totaux tant que Sabro n'a pas d'unité ; 300 g une fois « g » choisi) · 20,05 · Levures 4 · 7 Stk · 29,60.

## Boosters UX
- Boosters : `barre`, `renvoi` (comptes, 23 lignes), `preuve`, `compte-liens`, `filtre`, `sous-total`, `ordre`, `ligne`, `plateau`,
  `bis`, `unite`, `mouture`, `tva`, `paye`, `reglement`, `achat-du`, `justificatif`, `confirmer`, `echec-drive`, `lecture`, `hors-ligne`.
- B1 OK (chaque geste change l'écran : filtre, pastille verte, tuile verte) · B2 OK (86,50 en 32 px, une action noire) ·
  B3 OK (42 mots hors lignes, D238) · B4 OK (groupes par bande) · B5 OK · B6 OK (12/13/14/16 + 32) · B7 OK (CONTRASTE 5,24:1) ·
  **B8 OK** (12 états : repos, défilé, renvoi, un réglé, tous, papier, envoi, reçu, échec, rouverte, lecture, hors ligne) · B9 OK
  (éclair 1,1 s, `prefers-reduced-motion`) · B10 OK (aucun `type="number"`, `inputmode`) · **B11 OK** (« 86,50 chez Brau- und
  Rauchshop, 23 lignes recoupées, six points en tirets ») · B12 OK (pictos r2b, trois rayons) · B13 OK (cibles 24 à 36 px).

## Lignes (compter-lignes.mjs, 390 × 844 tactile)
`LIGNES a=12 b=20` ; base, l'app servie : `LIGNES a=7 b=12` → LIGNES OK.

## Contrôles (01.11) — voir `../p3b-RESULTAT.md`
## Ce qui tient, ce qui casse
- Tient : 20 lignes d'un coup, colonnes alignées, le filtre dit ce qu'il cache ; la carte d'échec ne part pas seule.
- Casse : bande Houblons à deux lignes de chiffres (270 g / 30 ?) ; le filtre cache la liste complète (un toucher pour revenir).

## Corrections du critique 3c (01.11)
Voir `../p3b-RESULTAT.md`, section « Corrections du critique ».
- Pendant la lecture, Déjà payé et À payer sont gris.
- La navigation est celle de l'app.
- LALLEMAND Windsor est en entier à 390.
- Le mot « mouture » est sur chaque sous-ligne, avec « rattacher » en toutes lettres.
- Les numéros ④⑥⑤③ sont à côté de leur compte. MOTS : 53.
