# pa1b — passe 2 de pa1 (froide) : p3c-3 affinée, la proposition sur le champ, dite une fois

**L'idée (inchangée).** C'est le plateau de p3c-3. Chaque valeur proposée porte son état sur le champ même (D277).

Base : `plateau/v0/pa1/`, non touchée. Les sources sont dans `src/`. `construire.mjs` écrit `etat.html` (préfixe `pa1b-`, assemblé
par split/join). `captures.mjs` écrit les captures.

États : `etat.html#a` à `#f` et `#repos`, avec `-cave` pour le thème sombre. Sans dièse, la page ouvre le cas b.

Captures :
- `pa1b-{repos,a,b,c,d,e,f}.png` (390 × 844, clair) ;
- `pa1b-b-sombre.png`, `pa1b-d-sombre.png` ;
- `pa1b-1280-b.png`, `pa1b-1280-repos.png`.

Ouvertes : a, b, d, e, f, b-sombre, 1280-b.

## Les trois retouches du critique
1. **(d) Un seul contrôle d'unité.**
   - Le champ rouge « unité ? » est lui-même la rangée de cinq cases de 44 px : Kg, g, pièce, sachet, L.
   - Le prix par unité est écrit sous chaque case (« 6,20/g » : l'absurde se voit). Le focus va sur la première case.
   - Une unité lue reste un menu « Kg ⌄ ».
   - Tant que l'unité manque, le contrôle du montant affiche « au centime : après l'unité », en gris tireté.
2. **(b) La proposition dite une fois.**
   - La ligne article porte « « Citra bis » α 12,5 » en jaune et le mot « proposé ». Dessous, ses concordances : « ✓ variété ·
     ✓ α 12,5 · fiche à part, créée à Confirmer ».
   - Restent deux boutons seulement, chacun avec ses concordances : « Relier à Citra 2024 · ✓ variété · ≠ α 13,1 · ? récolte » et
     « Nouvel article · ≠ doublon de Citra », en rouge tireté.
   - Le bloc radio est retiré.
3. **(f) Type fin et gestes rares.**
   - Le type fin passe en menu « type Nettoyage ⌄ » à côté du segment, quand la nature est Matériel ou Service. Les 7 pastilles sont
     retirées. Le menu a un bord fin et un libellé « type », pour ne pas passer pour un 4e segment.
   - Les gestes rares sont sur une rangée discrète au pied du plateau : « extrait · Supprimer ». Supprimer est en gris, rouge au
     toucher. Le « ⋯ » est retiré.
   - En (f), l'extrait est ouvert : la ligne DURGOL est surlignée entre la ligne Lactose et l'EAN.

## Greffes reçues
- Concordances par sortie (pa4).
- Prix par unité sous chaque case (pu2).
- « Kg proposé : le lactose est compté en Kg au stock (0,5 Kg) », avec la case Kg en jaune tireté (pu4). La case est proposée, pas
  cochée : la ligne reste rouge.
- « 1 sur 3 · Suivante : Citra › », au pied du plateau, à droite, au pouce (pg3, pu2). Une ligne hors file affiche « 3 à régler ·
  Suivante : … ».
- Quantité relue en « − 3 + », en bleu, avec « 1re lecture 2 · 3e lecture 3 : 3 × 4,90 = 14,70 imprimé » et « Revenir à 2 » (pu3).
- Type fin en menu (pz1).
- Rangée discrète « extrait · Supprimer » (pz1).

## Partout
- **Un seul contrôle d'unité**, en cases de 44 px quand l'unité manque (voir la retouche 1).
- **Sûr = rien.** Aucune question sur une ligne sûre : a, c et e n'ont que leurs champs. Le signal vient seulement du jaune
  (Citra bis, mouture), du rouge (unité) et du bleu (3e lecture).
- **La mouture dite une fois.** La rangée « ↳ Mouture » est retirée de la liste. Restent la pastille « ↳ 0,60 » sur la rangée Maris
  Otter, signal de p3c-3, et la ligne de plateau « ↳ mouture, ligne 2 · 6 Kg × 0,10 = 0,60 [Rattacher] ». L'en-tête dit « 2 +1 ↳ ».
- **Le bis par défaut (D215)** quand l'α diffère. « Relier » n'est jamais proposé.
- **« pièce », « sachets »**, jamais « Stk ».

## Baseline (p3c-3 et ses voisins)
- [x] « imprimé « … » · référence »
- [x] quantité, unité, × prix = montant sur une ligne. En (d), l'unité large fait passer « × 6,20 = 6,20 » à la ligne suivante.
- [x] « ✓ au centime »
- [x] segment Ingrédient · Service · Matériel
- [x] « article « … » · relié ⇄ Retirer », et « Suivre au stock » pour le hors stock (c)
- [x] mouture « Rattacher »
- [x] plateau dans la rangée, bande teintée, filet de famille, pied « Catégorie | Papier » + « Confirmer »
- [x] B du nom · [x] d-lue · [x] D277

## Ce que je n'ai pas tranché
- Les ✓ de « ✓ au centime » et de « ✓ 8 lignes », et la boîte cochée des rangées reliées, viennent de p3c-3, son choix (règle n° 1).
  Je les garde, contre la consigne « aucun ✓ sur une valeur sûre » ; c'est au pilote de trancher.
- À 1280, le cas b monte la rangée Citra : le récap reste à gauche, la liste à droite.

## Contrôles (02.11)
- `controle-commun --profil=sans-houblons --sans-lignes` : **COMMUN OK**. mots, couleurs, survol, blocs, contraste, standard,
  parlant et brutes sont OK.
- `controle-contraste --profil=sans-houblons` : **CONTRASTE OK**, pire valeur 5,24:1.
- `verifier-page --min-images 0` : **PAGE OK** (390 px, sans erreur).
- `captures.mjs` : **CAPTURES OK**.
  - Dans les six cas, le plateau tient entre la rangée et le pied.
  - Aucun texte sous 12 px, aucune cible sous 24 px, pas de défilement horizontal.
  - Aucun `type="number"`, aucune requête réseau.
