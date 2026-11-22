# pz2 — le bandeau au pouce : trois prises en bas, la ligne reste en haut (tiède)

**Chaleur** : tiède (la forme de l'approche pz : une forme qu'on n'attend pas, avec la baseline et les six cas).

**L'idée en une phrase** : la rangée ouverte reste à sa place et ne porte qu'une ligne de preuve (l'imprimé, ✓ au centime) ; tout le geste
descend sous le pouce, dans un bandeau qui remplace le pied tant qu'une ligne est ouverte : trois **prises** (article · quantité/unité ·
nature), et la prise à régler s'ouvre au-dessus d'elles. Le rouge, le jaune, le bleu sont sur la prise : « j'ai un champ à remplir, je sais
même pas lequel » n'arrive plus, le bandeau est la liste de ce qui reste à faire.

## Baseline cochée (p3c-3)
- [x] la ligne « imprimé « … » · référence » : sous la rangée, seule ligne du plateau
- [x] quantité, unité, × prix = montant : sur la première rangée du bandeau (« Citra 100 g × 0,098 = 9,80 »), la quantité dans sa prise
- [x] « ✓ au centime » : sur la ligne de preuve
- [x] le segment Ingrédient · Service · Matériel : dans la prise « nature » (ouverte pour c), le type fin dessous
- [x] la ligne article : la prise « article » ; pour (b) la carte du stock « Citra · récolte 2024 · α 13,1 », « proposé par l'IA », la raison, Relier · bis · Nouvel article · ⇄
- [ ] la mouture « Rattacher » : hors des six cas
- [x] la liste groupée (bande, filet), le plateau dans la rangée, sous elle
- [~] **écart voulu** : le pied « Catégorie | Papier + Confirmer » est remplacé par le bandeau tant qu'une ligne est ouverte ; « OK » le referme et
  rend le pied. Raison : au téléphone, le pouce est en bas ; le pied ne sert à rien pendant qu'on règle une ligne.
- [x] B du nom, d-lue (prise quantité bleue « 2̶ 3 Stk », « à la 3e lecture »), D277 sur la prise même

## Les six cas
a bandeau sans tiroir (tout est sûr) · b tiroir article : carte du stock + raison + trois sorties · c tiroir nature : segment + type fin ·
d prise unité rouge « ? » + tiroir g kg Stk L sachet · e tiroir correction : Garder 3 · Reprendre 2 · voir la ligne · f « ⋯ » : extrait,
page entière, type, Supprimer.

## Honnêteté
Aucun chiffre hors du brief, sauf le prix de Safale (4,50, ligne Windsor de sa facture). La proposition dit « proposé par l'IA » et sa raison.

## Contrôles (joués une fois, 02.11 ; mêmes commandes que pz1)
- PANEL OK (4 captures) · COMMUN OK (profil sans-houblons, --sans-lignes) · mots sans --sans-lignes : **173**
- CONTRASTE OK en clair (pire « α 12,5 » 4,66:1 ; le « ✓ au centime » sur la bande a été remis sur fond de page, 4,44 → OK) ; cave : capture ouverte
- PAGE OK

## Boosters UX
- `bandeau-pouce` (role dialog) — agir au pouce ; `prise-article`, `prise-unite`, `prise-nature` — choisir ; la couleur de la prise dit l'état ;
  `sortie-article`, `unite-choix`, `nature-choix`, `correction`, `rares` — les tiroirs.
- B2 : un `primary` (Relier / Garder 3 / OK selon le cas, jamais deux ensemble… sauf b et e où « OK » et le choix cohabitent : à juger) ; B3 : le
  bandeau fait 92 px fermé, 180 à 230 px ouvert ; B13 : prises de 48 px.
