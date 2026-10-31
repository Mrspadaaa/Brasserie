# u1 — la ligne suivante est déjà là (v0, série u, 31.10)

- **Chaleur** : froide. Elle affine la baseline : même liste, mêmes données, l'ajout devient la dernière ligne du registre.
- **Axes** : A1 la liste actuelle compactée ; A2 la masse tapée sur place (↑ ↓ au pas de l'hypothèse 3) ; A3 un champ toujours ouvert,
  nom, Entrée, masse, et des puces d'habituels dessous ; A4 une pastille de teinte, « ? » si inconnue.
- **L'idée** : la liste est un registre dont la ligne vide du bas attend le malt suivant ; on écrit dedans comme sur la ligne d'avant.

## Ce qui se voit et se touche
- Une ligne : pastille de teinte (ou « ? » tiretée), nom, moment en pastille, marque, part, masse en grand chiffre tapable.
- Dernière ligne, même grille : « + », le champ « Malt ou sucre, puis Entrée », la famille du prochain ajout (Grain ⇄, 5 familles).
  Dessous, les habituels du stock (icône verte, 0 mot de stock) : un toucher ajoute à 0 kg et place le curseur sur la masse.
- Taper ouvre les propositions **dans la liste** (elles poussent, ne recouvrent rien), puis « Créer « X » » dès 2 lettres.
- La marque « 3 couleurs à renseigner » au-dessus de la liste, tant que l'EBC vaut « — ». Un toucher ouvre la couleur du premier
  malt ; Entrée passe au suivant. Toucher le nom ouvre le détail : couleur, moment (segment), J+ si fermentation, famille figée, Retirer.

## Baseline (plancher à enrichir)
- [x] En-tête « ‹ Fermentescibles 2/7 », import, thème ; fil des 7 étapes, Malts/sucres courant ; bandeau Grain · OG · IBU · EBC ;
  pied « Retour · Suivant — Houblons » ; + flottant. Bandeau absent sur la recette vide (comme `hasMetrics`).
- [x] La ligne : nom, moment, part, masse. [x] Les 5 familles. [x] Famille figée sur la ligne (affichée, jamais un bouton).
- [x] Masse à zéro à l'ajout. [x] Jour d'ajout en fermentation (J+3 par défaut). [x] Lactose : « ne fermente pas, il remonte la
  densité finale » ; densité : carte d'annexe (OG « — » dans sa recette, rien à avertir). [x] Clavier : nom, Entrée → masse, Entrée → nom.
- [x] Doublon refusé : le même malt renvoie à sa masse.

## Honnêteté
- Couleur inconnue : « ? » tireté, jamais 0 ; EBC « — » tant qu'un grain manque ; Morey de l'app (`beerColor.ts`) → 7,3 avec ses
  trois couleurs. Le rendement 75 % n'apparaît pas (replié, J10). Stock de démonstration dit fictif dans l'annexe.
- Part d'un sucre : rapportée au grain, comme le code (« % du grain ») ; « % ferm. » replié. À confirmer au port.

## Boosters UX (boosters-ux)
- teinte (pastille) — lire/régler : « ? » tiretée → couleur du malt ; effet vu, `cap-couleur-pendant` / `cap-couleur-apres`.
- masse — ajuster : chiffre tapable, ↑ ↓ ; parts et bandeau suivent à la frappe (`cap-clavier-apres` : 8,5 kg, 59 %).
- ajout-clavier, famille-ajout, puces-habituelles — déclencher : un toucher ou Entrée ajoute (`cap-clavier-pendant`, `-apres`).
- a-renseigner — suivre : la marque compte les couleurs manquantes et ouvre la première.
- B1 OK (6 boosters marqués) · B2 OK (la liste domine, un seul primaire) · B3 OK (58 mots, détail à un toucher) · B4 OK (une carte,
  l'ajout dans la même grille) · B5 OK (4/8/10 px) · B6 OK (12/14/16 + champs) · B7 OK (CONTRASTE OK, pire 5,27:1) · B8 OK (vide,
  inconnu, 8 grains, lactose, fermentation : boutons de l'annexe ; hors ligne non dessiné) · B9 partiel (retour au focus, sans
  mesure de délai) · B10 OK (`inputmode`, aucun `type="number"`) · B11 « trois malts, leurs kilos ; il manque les couleurs » ·
  B12 OK (STANDARD OK) · B13 OK à l'œil (cibles de 24 px au moins).

## Contrôles (31.10)
- `controle-commun --profil=sans-houblons` : COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes).
- `mots-premier-ecran --max=80` : 58 mots, MOTS OK. `controle-contraste` : CONTRASTE OK, pire 5,27:1.
- `verifier-page` : PAGE OK. Hauteur (pied) : 0,59 écran ; 8 grains : 0,86 écran.

## Ce qui tient, ce qui casse
- Tient : c'est son écran, sans les phrases et sans les gestes en trop ; au PC, nom, Entrée, masse, Entrée, à la chaîne.
- Casse : peu de surprise ; avec 3 malts, la moitié basse reste blanche. La part d'un sucre (5 %) se lit mal à côté de celles du grain.

Captures : `cap-recette.png`, `cap-couleurs.png`, `cap-sucre.png`, `cap-lactose.png`, `cap-huit.png`, `cap-vide.png`, `cap-page.png`,
`cap-clavier-pendant.png`, `cap-clavier-apres.png`, `cap-couleur-pendant.png`, `cap-couleur-apres.png`, `cap-1280.png`, `verif-haut.png`.
