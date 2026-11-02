# pz3 — le ticket tamponné (chaude)

**Chaleur** : chaude, forme libre.

**L'idée en une phrase** : la rangée s'ouvre sur **la ligne telle qu'elle est imprimée**, en quatre colonnes comme sur la facture (désignation,
quantité, prix, montant), et sous chaque mot imprimé l'app pose son **tampon** : ce qu'elle en a fait. Article (noir = relié, jaune pointillé =
proposé, gris = hors stock), quantité-unité (rouge « 1 unité ? », bleu « 2̶ 3 Stk »), « ✓ centime » sous le montant ; la nature est un vrai
tampon en biais (INGRÉDIENT, MATÉRIEL · Nettoyage). Le papier est l'extrait : « voir l'extrait » n'est plus une question, c'est le plateau.

## Baseline cochée (p3c-3)
- [x] « imprimé « … » » : c'est le papier lui-même ; la référence et le lien dans la ligne du bas (« relié au stock · MA0221 »)
- [x] quantité, unité, × prix = montant sur une ligne : la ligne imprimée, puis le tampon de quantité
- [x] « ✓ au centime » : tampon vert « ✓ centime » sous le montant
- [x] le segment Ingrédient · Service · Matériel : à côté du tampon de nature
- [x] la ligne article : le tampon sous la désignation, puis ⇄ Autre article · Retirer ; pour (b) Relier · Citra bis · Nouvel article · ⇄
- [ ] la mouture « Rattacher » : hors des six cas
- [x] la liste groupée, le plateau dans la rangée, le pied inchangé
- [x] B du nom (le français sur la rangée, l'imprimé sur le papier), d-lue, D277 sur le tampon du champ

## Les six cas
a Maris Otter : tampons noirs, « relié au stock » · b Citra : tampon jaune, la raison en 12 px, trois sorties · c Détartrant : « hors stock »,
MATÉRIEL · Nettoyage, Mettre au stock · d Lactose : « 1 ▒ » marqué sur le papier, tampon rouge en focus, choix d'unité en cadre rouge ·
e Safale : tampon bleu « 2̶ 3 Stk », Garder 3 / Reprendre 2 · f Détartrant : type fin et extrait de la page sous le ticket, corbeille sur le ticket.

## Honnêteté
Le papier montre les mots imprimés sans les traduire ; la proposition est dite « proposé par l'IA » avec sa raison. Prix de Safale : voir pz1.

## Contrôles (joués une fois, 02.11 ; mêmes commandes que pz1)
- PANEL OK · COMMUN OK (sans-houblons, --sans-lignes) · mots sans --sans-lignes : **158**
- CONTRASTE OK en clair (pire « 1 ? » 5,04:1) après deux retouches : le tampon de nature prend les couleurs texte des jetons (`--hop-texte`,
  `--ebc-gold-texte`, `--water-texte`, `--ebc-amber-texte`, `--area-stocks-texte`) au lieu de la couleur de bande (3,38:1) ; la colonne du
  montant élargie (le « ✓ centime » était rogné, lu 1:1). Cave : capture ouverte (`pz3-b-cave.png`)
- STANDARD OK (rayons 10 ; une seule épaisseur de trait d'icône) · PAGE OK

## Boosters UX
- `ticket` — lire : la vérité imprimée et la lecture de l'app dans la même colonne ; `tampon-article`, `tampon-unite`, `tampon-quantite` —
  choisir ; `nature` — le tampon en biais, le segment à côté ; `sortie-article`, `unite-choix`, `correction`.
- B2 : un `primary` par cas ; B3 : ticket 110 px + une rangée de geste + la nature = 190 px ; B13 : tampons 28 px, boutons 28 px.
