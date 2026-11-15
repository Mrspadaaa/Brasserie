# voie-r2-b1 — seconde reprise du + : toujours flottant, le commun toujours là, l'écran en avant

b1s-a · Deux étages · froide · ce qui change de b1r : le + quitte la barre et flotte (56 × 56, 12 px au-dessus de la barre, à droite ; au 1280 en bas à droite du contenu, plus dans le rail) ; la feuille de b1 revient à deux étages : « Sur cet écran » en tête (action pleine, puis ses autres actions en rangées de 44 px), « Partout » dessous = les six communes de b1 (Écriture, Facture, Vente, Recette, Brassin, Compagnon), ordre figé, moins celle déjà montée en tête (pas de doublon).
b1s-b · La pile au pouce · tiède · ce qui change de b1r : + flottant ; pas de feuille : les actions montent du + en pilules alignées à droite ; contre le +, l'action de l'écran (pleine, couleur de la rubrique, 56 px), puis ses autres actions (48 px, larges) ; au-dessus, « Partout », les communes en pilules étroites (44 px), ordre figé. L'écran est au pouce, le commun plus haut.
b1s-c · La couleur dit « ici » · chaude · ce qui change de b1r : + flottant, teint de la couleur de la rubrique (brun Brassins, bleu Finances, vert Stocks ; encre noire sur Bord et Clients) ; la feuille s'ouvre sur une bande de cette couleur (nom de l'écran, son état en une ligne, action pleine, autres actions) ; dessous, le dock « Partout » des six communes à cases fixes : une commune montée en tête garde sa case, en pointillé avec une flèche ↑ (position jamais déplacée, aucun doublon actif).

## Commun aux trois (gardé de b1 et b1r, ou corrigé)
- Gardés : en-tête, onglets Bord · Finances · Brassins · Stocks · Clients, pastille Stocks 1, rail de 88 px au 1280 avec Compagnon hors connexion au pied, toast (rangé à gauche du +), lettres au clavier (N = action de l'écran ; E F V R B C fixes).
- Changé par sa demande : la barre perd le + (5 onglets égaux) ; le + flotte aux deux largeurs ; les six communes reviennent dans chaque menu.
- Corrections du critique sur b1r : même libellé aux deux largeurs (« Ajouter aux courses · froment », action distincte de « Copier la liste » de Courses) ; Impôt bière et Prix et marges dessinés (planche de 14 écrans) ; IPA Nelson 5,6 % ; rinçage 18,8 L ; colonne de droite de b1 rendue au 1280 (Conditionnés · novembre ; octobre et septembre passent dans le tableau de gauche).
- Déclaré hors demande : fond de Brassins 390 = celui de b1r (données corrigées) ; 1280 : tableau de gauche complété (octobre, septembre) ; « 19,0 °C » en mono.
- Risque connu du + flottant : il couvre le coin bas droit de la liste au repos ; au port, marge basse de 72 px en fin de liste.

## Menu par écran (pour le port) — en tête : action de l'écran (`fabActions.ts`), puis ses autres actions ; Partout : les six communes moins celles montées
- Bord : Nouvelle écriture (facture ou à la main) ; Ajouter aux courses (pour B-032) · Partout : Facture, Vente, Recette, Brassin, Compagnon
- Finances : Nouvelle écriture ; Entrer une facture (photo ou PDF), Encaisser une vente · Partout : Recette, Brassin, Compagnon
- Brassins : Nouveau brassin (sera B-033) ; Saisir une densité (B-031 · J+4), Ajouter aux courses (froment) · Partout : Écriture, Facture, Vente, Recette, Compagnon
- Recettes : Nouvelle recette ; Lancer un brassin (B-033 · recette) · Partout : Écriture, Facture, Vente, Compagnon
- Atelier : Nouvelle idée ; Lancer un brassin (essai 5 L) · Partout : Écriture, Facture, Vente, Recette, Compagnon (un seul + : le + propre à l'Atelier disparaît)
- Volumes : rien à créer (BX-4) ; Lancer un brassin (IPA Nelson 25 L), Ajouter aux courses (pour 25 L) · Partout : Écriture, Facture, Vente, Recette, Compagnon
- Articles : Nouvel article ; Ajouter aux courses (Citra T90 · 2 kg) · Partout : les six
- Courses : Copier la liste (3 articles) ; Nouvel article · Partout : les six
- Fûts : Nouveau fût (sera F-07) ; Encaisser une vente (fût vendu) · Partout : Écriture, Facture, Recette, Brassin, Compagnon
- Matériel : Nouveau matériel · Partout : les six
- Houblons : Nouvelle variété ; Ajouter aux courses (Citra T90 · 2 kg) · Partout : les six
- Clients : Nouveau client ; Encaisser une vente, Nouveau tarif · Partout : Écriture, Facture, Recette, Brassin, Compagnon
- Impôt bière : rien à créer · Partout : les six (le bouton « Copier cette estimation » reste dans l'écran)
- Prix et marges : Nouveau tarif ; Nouveau client · Partout : les six
- (proposé) : Saisir une densité, Ajouter aux courses, Brassin pré-rempli depuis Volumes, toute action placée hors de son écran, « sera B-033 / F-07 », lettres I M L A U T H K P ; état d'écran en une ligne (b1s-c).

## Boosters (boosters-ux)
- `creer` (le + flottant) : déclencher ; repos puis ouvert (captures a puis b) ; B2 une seule action pleine par menu, aucune sur Volumes et Impôt bière, voulu ; B13 entrées de 44 à 64 px à 390 (mesure : 0 sous 40 px, 0 débordement, 0 chevauchement, le + ne touche ni menu, ni barre, ni toast) ; 34 px au 1280 (pointeur, comme b1).

## Jugement
- b1s-a est la plus fidèle à b1 : sa feuille, son « Partout », juste le + sorti de la barre ; préférée.
- b1s-b met l'écran sous le pouce mais couvre beaucoup d'écran ; b1s-c est la plus parlante (couleur = ici) et garde chaque commune à sa place, au prix d'un + coloré qui change d'un onglet à l'autre.
- Contrôle : controle.txt.
