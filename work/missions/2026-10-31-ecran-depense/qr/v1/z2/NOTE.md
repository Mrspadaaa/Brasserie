# z2 v1 — le sceau QR sur le bandeau (passe 2, série z, 01.11)

**Chaleur : tiède.** Même idée qu'en v0 : le QR de la facture dessiné (croix suisse), à droite du total, un bandeau de verdict dessous ;
il ouvre « Ce que dit le QR ». Refaite sur l'écran en ligne, élément par élément, avant le QR (retouche n° 1).

## La base, élément par élément (captures `e-port/souris390-01-repos`, `-02-preuve`, `b1-bande/tactile390-5`, `dp-doublon/390-1`)
| Élément de l'écran en ligne | Ici |
|---|---|
| En-tête « Nouvelle dépense », picto document, × | repris tel quel |
| « Voir le justificatif » ⌄ | repris tel quel |
| Bandeau : fournisseur en 16 px gras, **date en haut à droite** | repris tel quel (v0 avait mis la date sous le total : corrigé) |
| Total 28 px mono, souligné en pointillé (tapable), « CHF », chip « ✓ 7 lignes » / « ⓘ 7 lignes » | repris tel quel ; **ce qui change** : le sceau de 64 px à droite des lignes total + barre ; le fournisseur et la date gardent toute la largeur |
| Barre des lignes colorée par lien, 10 px | reprise telle quelle (mouture en gris sous Maris Otter, comme la base) |
| Tuile ② « Règlement · Payé le · supposée », **fermée au repos** ; chips numérotées pointillé ambre | reprises telles quelles (ici ① Règlement, ② mouture ×1 +3,75 ; en désaccord, chip ① « Total » devant, renumérotation) |
| Carte Règlement ouverte par la tuile : « payé le · supposée 12.10 \| facture 12.10 », phrase, Déjà payé / À payer, Moyen, « C'est la date » / « Autre date » | reprise telle quelle (capture confirme-tuile) ; « C'est la date » règle le point ① (vert, barré) |
| Preuve derrière la chip « 7 lignes » : titre, Somme des lignes = imprimé, Quantité × prix, Lectures d'accord, comptes de liens | reprise telle quelle, fermée au repos à 390, ouverte à 1280 (capture confirme-preuve) ; **ce qui change** : rien du QR n'y est ajouté (le sceau porte tout) ; en contredit la somme dit « 110,40 ≠ 110,04 » |
| « Lignes de la facture · 7 / 6 proposées par la lecture, à vérifier » ⌃ | repris tel quel |
| Lignes : cube avec pastille de lien (coche = relié, + vert = nouveau, vide = sans stock), nom 16 px, **pastille de stock « +25 kg »** grise, quantité mono dessous, montant à droite | reprises telles quelles (v0 les avait perdues : corrigé) ; mouture en sous-ligne grise « ↳ mouture · Rattacher · 3,75 » comme la base |
| Détail 110,40 / 110,40 ; plis Pour quoi ? (proposé), Fournisseur et catégorie, Référence et TVA du document (À vérifier) ; « Le justificatif sera rangé dans ton Drive privé… » | repris tels quels, **sous les lignes** (v0 les avait sous sept lignes à plat, sans Détail au bon endroit) ; « Achat du » non repris : D233, une seule date, le bandeau la porte ; « Lier à une dépense prévue » non repris (facultatif, hors sujet QR) |
| Récap en haut cliquable avec renvois : chip « 7 lignes » → preuve, chips → leur point, barre → ligne | repris : « 7 lignes » ouvre la preuve, la tuile ouvre la carte, chip ① saute au duel et le surligne |
| Bande collante « ①②… points revus » au défilement (b1) | non dessinée : maquette au repos, elle n'apparaît qu'en défilant |
| Pied « Drive prêt » + « ✓ Confirmer », jamais bloqué | repris tel quel ; réserve de 72 px en bas pour ne rien recouvrir |

## Défauts corrigés (SYNTHESE, z2)
1. Base : ci-dessus. 2. « sans » : cercle vide en pointillé « sans QR » à la place du sceau (capture sans), distinct d'un sceau absent.
3. IBAN et référence sur deux lignes en mono dans la feuille, rien de rogné à 390 (captures confirme-ouvert, partiel-ouvert) ; Copier 24 px.
4. Contredit : l'écart est dit deux fois, le sceau ambre « 110,40 » et les deux tuiles sous le total ; la chip ① « Total » n'a plus de valeur,
elle renvoie aux tuiles (et les surligne 0,8 s). 5. Bandeau de verdict à 12 px mesurés ; le sceau est un bouton de 64 × 62.

## Greffes (SYNTHESE, z2)
- r4 : la colonne fautive « 04 » / « 40 » en pointillé d'attention dans les deux tuiles ; r1 : « ✓ Somme des lignes 110,40 · deux contre un »
  sous les tuiles ; u2 : « lu sur la page » / « QR-facture » comme sources ; u1/u4 : « Photographier le QR » en illisible (dans le bandeau,
  et dans la feuille) ; r3 : « ✓ copié » après Copier ; u3 : « pas dans le QR » en pointillé sur Montant, Facture, Date en partiel, avec
  la valeur lue à côté.

## Honnêteté
Le champ reste 110,04 tant qu'il n'a pas touché une tuile ; la pastille de doute (pointillé ambre sous le total) disparaît au choix ; Détail
suit (« 110,40 / 110,04 » puis « 110,40 / 110,40 »). Partiel : rien coché que devise et créancier. Illisible : rien décodé, lecture seule,
un geste. Lecture : QR lu, lignes en squelette, Confirmer actif.

## Boosters UX (boosters-ux)
- `sceau-qr` (ouvrir), `duel` (choisir, colonne fautive), `chip-qr` (suivre, saute et surligne), `tuile-reglement` + `cest-la-date`
  (régler), `ouvrir-preuve`, `copier` (✓ copié), `photographier`, `total-tapable`, `bascule-reglement`, `barre-lignes`, `rattacher`,
  `action-unique`.
- B1 OK (13) · B2 OK (le total domine) · B3 OK (28 mots sans lignes) · B4 OK · B5 OK · B6 OK (12 / 14 / 16 / 28 + 18 pour les tuiles du
  duel) · B7 OK (pire 5,27:1) · B8 OK (six états + sans distinct) · B9 OK · B10 s.o. · B11 : « 110,40 CHF le 12.10, et le QR de la facture
  dit oui » · B12 OK · B13 OK (sceau 64 px, tuiles 40 px, Copier 24 px).

## Contrôles (sorties, `<dir>` = qr/v1)
CHOIX OK (0 écran, dépense sans entrée) · COMMUN OK (--profil=sans-houblons --sans-lignes) · MOTS OK 28 · CONTRASTE OK (55 textes, pire
5,27:1) · PAGE OK (390, sans erreur, sans débord). Captures : six états à 390 ; gestes contredit-apres, confirme-ouvert, confirme-tuile,
confirme-preuve, illisible-ouvert, partiel-ouvert ; 1280 confirme et contredit (pied visible, contenu à défilement).

## Ce qui tient, ce qui casse
Tient : la base est la sienne, le sceau se lit en une seconde, le duel dit la colonne fautive et le témoin des lignes. Casse : à 390 en
contredit, le bandeau fait 150 px (tuiles + témoin) ; la feuille reste un toucher pour l'IBAN.
