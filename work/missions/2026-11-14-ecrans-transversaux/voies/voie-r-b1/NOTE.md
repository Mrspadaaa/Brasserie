# voie-r-b1 — b1r : le + de b1, dynamique selon l'écran

b1r · Le + selon l'écran · froide · ce qui change de b1 : seul le contenu de la feuille du + ; « Sur cet écran » porte l'action de l'écran (pleine, couleur de sa rubrique) et, s'il en a, ses autres actions (demi-largeur) ; « Partout » (six tuiles à ordre figé) devient « Depuis ici » : 0 à 3 tuiles choisies pour cet écran, avec une précision quand elle informe (B-033, froment, F-07) ; le Compagnon passe en pied de feuille (« hors connexion »), présent partout ; la hauteur de la feuille suit son contenu (210 à 343 px du bas). Gardés de b1 : place et forme de la feuille, barre et + de 390 (64 × 36 à droite), toast rangé au-dessus de la barre, rail de 88 px au 1280 avec le + en tête, menu en liste à lettres, Compagnon hors connexion au pied du rail. Défauts réglés n° 10, 11, 12, 13 (comme b1) ; BX-4.

## Corrections du critique sur b1
1. « sera B-032 » faux : B-032 est planifié, le prochain est « sera B-033 » (390 et 1280).
2. Brassin deux fois : « Lancer un brassin » disparaît là où « Nouveau brassin » est l'action de l'écran ; une seule entrée Brassin par menu.
3. Libellés coupés : tuiles à un mot (Recette, Idée, Courses…), précision sur une seconde ligne de 12 px ; aucune coupure, aucun débordement (mesure au rendu : 0).
4. « Au repos la barre est celle d'aujourd'hui » : gardé tel quel, c'est sa base (règle n° 1) ; le changement est dans la feuille.

## Menu par écran (pour le port) — ici = action de l'écran (`fabActions.ts`), puis ses autres actions ; depuis ici = tuiles
- Bord : Nouvelle écriture (facture ou à la main) ; Facture, Vente · depuis ici : Brassin (B-033), Courses (pour B-032), Recette
- Finances : Nouvelle écriture ; Facture (photo ou PDF), Vente · depuis ici : rien
- Brassins : Nouveau brassin (sera B-033) ; Densité B-031 (proposé) · depuis ici : Recette, Idée, Courses (froment)
- Recettes : Nouvelle recette · depuis ici : Brassin (B-033), Idée, Houblon
- Atelier : Nouvelle idée · depuis ici : Recette, Brassin (essai 5 L) — un seul + : celui de la barre, le + propre à l'Atelier disparaît
- Volumes : rien à créer (BX-4) · depuis ici : Brassin (IPA Nelson 25 L, proposé), Recette, Courses (pour 25 L, proposé)
- Stock (Articles) : Nouvel article · depuis ici : Facture (achat reçu), Courses (1 à commander), Houblon
- Courses : Copier la liste (3 articles) · depuis ici : Article, Facture (achat reçu)
- Fûts : Nouveau fût (sera F-07) · depuis ici : Vente (fût vendu), Client, Matériel
- Matériel : Nouveau matériel · depuis ici : Fût, Écriture (achat)
- Houblons : Nouvelle variété · depuis ici : Article (en stock), Recette, Courses
- Clients : Nouveau client · depuis ici : Vente, Tarif, Fût (en prêt)
- Non dessinés : Impôt bière comme Volumes (rien à créer ; depuis ici : Vente) ; Prix et marges : Nouveau tarif · depuis ici : Client, Vente.
- Partout, en pied : Compagnon (état hors connexion dessiné).
- 1280 : même menu en liste ; N = action de l'écran ; lettres fixes E, F, V, B, R, I, M, L, C. Une lettre reste active même si son entrée n'est pas montrée sur cet écran (proposé).

## (proposé) — n'existe pas dans l'app aujourd'hui
- « Densité » (saisir une mesure du brassin en cuve) depuis le + ; Brassin pré-rempli depuis Volumes (recette mise à l'échelle) ; Courses « pour 25 L ».
- Toute action d'un écran placée sur un autre (ex. Houblon depuis Recettes, Fût depuis Clients, Client depuis Fûts) ; numéros « sera B-033 / F-07 » ; lettres I, M, L.

## Rien de perdu
- Les six lignes du + d'aujourd'hui restent atteignables : Écriture, Facture, Vente sur Bord et Finances (et Vente sur Fûts et Clients) ; Recette et Brassin sur Bord et toute la rubrique Brassins ; Compagnon partout. Ce qui sort d'un menu (ex. Vente sur Brassins) est à deux touchers (onglet, puis +) et toujours à une lettre au clavier.
- Onglets Bord · Finances · Brassins · Stocks · Clients, pastille Stocks « 1 » gardés.

## Boosters (boosters-ux)
- `creer` : déclencher ; feuille à zones, l'action de l'écran pleine (captures a puis b) ; B2 une seule action pleine par écran, aucune sur Volumes, voulu ; B3 aucune légende ajoutée ; B13 cibles 44 à 64 px de haut, aucun chevauchement.

## Jugement
- Le geste et la place de b1 ne bougent pas ; ce qu'il trouve dans la feuille change avec l'écran, et la taille de la feuille le montre.
- Risque : un menu court (Finances, Atelier) peut surprendre qui cherchait « Vente » ailleurs ; la lettre au clavier et le Bord complet le rattrapent.
- Les précisions (B-033, froment, F-07) sont la partie la plus « vivante » ; à confirmer au port qu'elles se calculent sans coût.

Contrôle : voir controle.txt (SERIE OK).
