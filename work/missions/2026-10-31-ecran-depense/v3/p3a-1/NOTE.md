# p3a-1 — r2b de l'app en plein écran, groupée, sous-totaux collants (passe 3, 01.11)

- **Chaleur** : froide (affine r2b de l'app au plus près).
- **Axes** : en-tête de groupe = ligne de sous-total collante ; densité = une rangée (nom · α · pastilles · quantité · montant) ;
  renvoi = défilement + éclair ; mouture = sous son malt ; échec Drive = bandeau plein en haut de l'app ; réussi = rien.
- **L'idée** : l'écran de l'app, tel quel, prend toute la place ; sous le récap qu'il a entouré, les 23 lignes se lisent par
  catégorie, chaque groupe porte en collant son nombre, sa quantité par unité et son montant.

## Comptes de lignes (`compter-lignes.mjs`, 390 × 844, tactile)
- Base (l'app servie, `?dev-local&depense=3`, `[data-purchase-line]`, mesurée le 01.11 à 08:11) : **a=7 b=10**.
- p3a-1 : **a=12 b=18** → `LIGNES OK` (après D238 : rangées de 32 px au lieu de 36 ; avant, a=11 b=17).
- Mots (D238) : `data-mots="lignes"` sur le seul conteneur des lignes ; `--sans-lignes` → **51 mots**, MOTS OK (97 avant D238, lignes comprises).

## La base, reprise (r2b de l'app) et ce qui change
- [x] En-tête en une ligne de 40 px (× · Nouvelle dépense · justificatif) ; plein écran, rien de l'app derrière.
- [x] Bandeau : fournisseur, date (se tape = Achat du), 86,50 CHF (se tape), « ✓ 23 lignes », barre colorée des 23 lignes (un toucher = sa ligne).
- [x] Preuve ouverte d'office : Somme = imprimé 86,50 · Qté × prix 23/23 · Lectures 2/2 · Page 2 coupée ; compte des liens en pictos.
- [x] Tuiles 1 TVA (2,80 · 4,15 côte à côte) et 2 Payé (supposée).
- **Écart voulu** : les chips 3 à 6 de r2b sont fondues dans le compte des liens qu'il a entouré : « ④⑥ 2 bis », « ⑤ 1 unité ? »,
  « ③ 5 moutures +1,50 » (mêmes numéros par risque, mêmes sauts, barrées en vert une fois réglées). Raison : les deux rangées disaient
  la même chose, et la place rendue va aux lignes (138 → 97 mots, sinon MOTS ECHEC). Le nom de la ligne (Target, Sabro, Hallertauer) se
  lit sur la ligne visée.
- **Une seule date** (D233) : la date est au bandeau ; « Payé · même jour · supposée » ne la répète pas ; l'échéance n'apparaît qu'« À payer ».
- **Drive invisible** : rien sur Drive avant Confirmer (ni « Drive prêt », ni phrase).

## Les pastilles de r1, reprises sur chaque ligne (L03)
- [x] Picto du lien au stock : relié, nouveau (Goldings East Kent, Verdant IPA), bis (Target, Hallertauer Blanc CH), unité ? (Sabro), mouture.
- [x] Pastille d'équivalence « = 2 sachets » (levures en Stk).
- [x] Pastille de doute « unité ? » (Sabro) ; « supposée » (Payé).
- [x] La rangée « Articles et stock 23 » et ses comptes en pastilles → devenue le compte des liens du récap, chaque compte un bouton.
- [x] Le règlement sur la ligne : Target bis / ⇄ ; Créer CH / ⇄ ; g · kg · Stk ; mouture et « Rattacher les 5 ».

## Baseline (BRIEF-ECRAN § Obligatoire 1)
- [x] Justificatif (icône d'en-tête) · [x] Total TTC · [x] Pour quoi ? · [x] date de l'achat (bandeau) · [x] Déjà payé / À payer, payé le, moyen,
  échéance (Règlement) · [x] fournisseur et catégorie · [x] lier à une dépense prévue · [x] lignes : type (Ingrédient / Service / Matériel),
  article ⇄, quantité, unité, prix, montant (plateau au toucher) · [x] ajouter, retirer, regrouper · [x] Détail 86,50 / 86,50 ·
  [x] référence et TVA (n°, pro-forma, commande, TVA, taux, HT « — non imprimé ») · [x] Confirmer (jamais bloqué) · [x] ×.
- [x] L'ordre du papier : bascule « Catégorie | Papier » dans le pied (n° de ligne en papier).

## États (`?etat=`)
repos, defile, renvoi (« 2 bis » joué), regle (4 Target bis), tous, papier, envoi (écran fermé, Finances, picto discret), recu (rien),
echec (bandeau rouge sur Finances, qui ne part pas seul : Renvoyer le justificatif · Reconnecter Drive ; la dépense est enregistrée),
rouvert (la dépense rouverte sur le justificatif, « Pas dans le Drive », Renvoyer · Reconnecter Drive · Changer), lecture (trois étapes ;
Règlement et Pour quoi utilisables), horsligne, annexe.

## Boosters UX (boosters-ux)
- Boosters : `recap`, `date`, `total`, `preuve`, `barre`, `preuve-ouverte`, `compte-liens` (renvoi), `tva`/`tva-choix`, `paye`, `liste`,
  `sous-total`, `ligne` (plateau), `bis`, `unite`, `mouture`/`mouture-tous`, `rubriques`, `reglement`, `ordre`, `confirmer`, `journal`,
  `echec-drive`, `justificatif-rouvert`, `etapes`, `hors-ligne`.
- B1 OK — chaque compte du récap saute à ses lignes et les éclaire ; chaque point se règle sur sa ligne et sa pastille passe au vert.
- B2 OK — 86,50 en 32 px ; une seule action noire (Confirmer).
- B3 OK — 97 mots au premier écran, aucune phrase d'aide.
- B4 OK — récap, puis groupes nommés avec leur sous-total.
- B5 OK — 6 px dans un bloc, 8 entre blocs.
- B6 ~ — 12 / 14 / 16 / 32 px (quatre, comme r2b) ; chiffres en Plex Mono tabulaires, colonne de montants alignée à droite (54 px).
- B7 OK — CONTRASTE OK, pire « TVA » 5,24:1.
- B8 OK — 13 états ; Sabro : « 30 ? » en sous-total, jamais additionné en silence (« 270 g + 30 ? »).
- B9 OK — éclair 1,6 s, coupé en mouvement réduit.
- B10 OK — aucun `type="number"`, `inputmode="decimal"`.
- B11 OK — sa facture, 23 lignes, 86,50, et ce qui reste à régler, en une capture.
- B12 OK — pictos de lien de l'app (Pictos.tsx), rayons 10/16/24.
- B13 OK — rangées de 36 px, cibles de 24 px au moins.

## Contrôles (01.11, depuis la racine)
- Après D238 : `controle-commun … --profil=sans-houblons --sans=mots` → COMMUN OK (mots sauté : il compte sans `--sans-lignes` ; joué à
  part : `mots-premier-ecran --max=100 --sans-lignes` → 51 mots, MOTS OK) ; CONTRASTE OK ; PAGE OK ; LIGNES a=12 b=18.
- Avant D238 : `controle-commun … p3a-1 --page=etat.html --profil=sans-houblons` : mots OK, couleurs OK, survol OK, blocs OK, contraste OK,
  standard OK (après correction des traits d'icône et d'un rayon de 3 px), parlant OK, brutes OK.
- `mots-premier-ecran --max=100` : 97 mots, MOTS OK. `controle-contraste` : CONTRASTE OK (156 textes). `verifier-page` : PAGE OK.
- `compter-lignes.mjs` : LIGNES a=11 b=17, LIGNES OK.

## Simulé (dit dans l'annexe)
L'unité illisible de Sabro (sa facture imprime « g ») ; le stock Target α 11,8 et Hallertauer Blanc DE ; la cause « accès Drive expiré ».

## Ce qui tient, ce qui casse
- Tient : le récap qu'il a entouré reste en haut, ouvert ; 11 lignes au premier écran, 17 défilées (base 7 et 10) ; les sous-totaux par unité.
- Casse : 97 mots, au plafond ; b=17 seulement à 36 px de rangée (28 px donnerait ~22, mais le premier écran passerait 98 mots).
