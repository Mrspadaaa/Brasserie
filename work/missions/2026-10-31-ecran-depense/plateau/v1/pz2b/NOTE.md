# pz2b — le bandeau au pouce, passe 2 (tiède, série pz)

Base : `plateau/v0/pz2/` (non touchée). Entrées : `plateau/critique/SYNTHESE.md` § « pz2 » et les greffes qui la nomment, `plateau/critique/pz.md`,
`BRIEF-PLATEAU.md`. Message du pilote (D349, règle n° 1) : « sûr = rien » ne retire pas ce que p3c-3 porte : « ✓ au centime », « ✓ 9 lignes »,
« ✓ Somme = imprimé », la boîte cochée des rangées reliées sont gardés tels quels. Aucun ✓ ajouté hors de sa maquette.

**L'idée, inchangée** : la rangée ouverte reste à sa place avec une ligne de preuve ; trois prises (article · quantité · nature) sous le pouce,
la prise à régler s'ouvre au-dessus ; la couleur de la prise dit l'état (D277).

## Ce qui a changé (les trois retouches)
1. **Le pied reste** (« Catégorie | Papier · Confirmer ») ; « OK » est dans la ligne du bandeau, à droite. Bandeau mesuré à 390 × 844 :
   a 87 · b 202 · c 151 · d 186 · e 171 · f 174 px (plafond demandé 200 : b le dépasse de 2 px, la carte + trois sorties + trois prises).
   La carte article tient sur une ligne de titre (« Citra bis · α 12,5 · proposé par l'IA »), la raison en 12 px dessous (pa2), trois sorties.
   À 1280 : le bandeau est dans la colonne de la liste, collé sous elle (`position:sticky; bottom:0`), le pied visible.
2. **Le bis par défaut (D215)** : « ✓ Citra bis · ✓ variété · ✓ α 12,5 » en noir ; « Relier à Citra 2024 · ✓ variété · ≠ α 13,1 » et
   « Nouvel article · ≠ doublon de Citra » en rouge (pa1) à côté ; concordances par sortie (pa4). La prise article dit « article · proposé /
   Citra bis » en jaune ; le récap dit « 1 bis proposé ». ⇄ est sur la prise article de toutes les lignes ; « Retirer du stock » dans son tiroir.
3. **(d) Un seul contrôle d'unité** : cinq cases de 44 px (g · kg · pièce · L · sachet), le prix par unité sous chacune (pu2 : « 6,20 le g »),
   « kg · comme au stock » en jaune pointillé (pu4) ; l'extrait de la facture avec la case « ▒ » au-dessus (pg3, pz3). « Stk » → « pièce »,
   « sachets ». « au centime : après l'unité » en gris sous la rangée tant que l'unité manque (pu1).

## Appliqué partout (liste de la synthèse)
- un seul contrôle d'unité, cases de 44 px ✓ · sûr = rien : aucun ✓ ajouté, aucune question sur a et c ✓ (ceux de p3c-3 gardés, D349)
- la mouture dite une fois : pastille « ↳ 0,60 » sur la rangée de Maris Otter (p3c-3), rien dans le bandeau ✓ · le bis par défaut ✓ · « Stk » → pièce, sachets ✓

## Greffes reçues
« 1/2 à régler ‹ › » dans la ligne du bandeau (pg3, pu2 ; « à régler » écrit à 1280, chiffres seuls à 390) · stock après réception sous la prise
article (« 12 → 18 Kg », « 4 → 7 sachets », « 0 → 100 g · nouveau » : chiffres de fixture, pu4) · quantité relue « − 3 + » avec « 1re lecture 2 ·
3e lecture 3 » (pu3) · « + Ajouter une ligne » au pied de la liste (pa) · verbe en tête du tiroir : CHOISIR L'ARTICLE, REMPLIR L'UNITÉ,
CHOISIR LA NATURE, GARDER 3 ?, EXTRAIT · SUPPRIMER (pg2) · carte « proposé » avec la raison sous le titre (pa2).
Non reçu : l'extrait n'est pas « à côté » des cases mais au-dessus (la largeur de 390 ne porte pas les deux côte à côte).

## Les six cas
a Maris Otter : bandeau de 87 px, trois prises, rien à faire · b Citra : CHOISIR L'ARTICLE, bis par défaut · c Détartrant : CHOISIR LA NATURE,
Matériel · Nettoyage ⌄ · d Lactose : REMPLIR L'UNITÉ, cinq cases de 44 px, prise rouge « 1 ? » · e Safale : GARDER 3 ?, − 3 +, Garder 3 /
Reprendre 2, prise bleue « 2̶ 3 sachets » · f Détartrant, « ⋯ » : extrait, la page entière, Supprimer la ligne (rouge au trait).

## Honnêteté
Les « stock après réception » sont des chiffres de fixture (comme pu4), à relier au vrai stock au port. Prix de Safale : ligne Windsor de sa
facture (4,50). Rien n'est créé au stock sans son toucher : le bis est proposé, pas appliqué.

## Contrôles (02.11, une fois)
- `controle-commun.mjs plateau/v1 pz2b --page=etat.html --profil=sans-houblons --sans-lignes` → couleurs, survol, blocs, contraste, standard,
  parlant, brutes **OK** ; **mots ECHEC : 103** (> 98). Le bandeau est hors de `data-mots="lignes"` et compte : v0 pz2 comptait 173 sans
  l'option et « OK » avec, le plateau étant dans les lignes. Les 103 sont : le récap de p3c-3 visible (18), la ligne et les trois prises (22),
  le tiroir (26), les bandes et « Ajouter une ligne » ; à trancher par le pilote (D238 étendu au bandeau, ou 5 mots à couper).
- `controle-contraste.mjs … --profil=sans-houblons` → **CONTRASTE OK** (pire « α 12,5 » 4,66:1 ; 120 textes). Un faux échec corrigé avant :
  le défilement de la ligne ouverte se fait maintenant dans `rendre()` (le rendu sur `resize` l'avait perdu, et l'outil photographiait la page
  non défilée).
- `verifier-page.mjs plateau/v1/pz2b/etat.html --min-images 0` → **PAGE OK**. `type="number"` : 0.
- Captures ouvertes : les six cas à 390, `pz2b-b-cave.png`, `pz2b-b-1280.png` (L12).
