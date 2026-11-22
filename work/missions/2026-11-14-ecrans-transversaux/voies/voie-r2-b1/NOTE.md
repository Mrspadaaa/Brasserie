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

## Passe 2 de son choix (15.11 : « Ça j'aime énormément, à améliorer et implémenter »)
b1s-b2 · La pile au pouce, passe 2 · tiède · ce qui change de b1s-b : rien de sa forme (+ flottant 56 px, pilules alignées à droite qui montent du +, action de l'écran pleine contre le +, ses autres actions juste au-dessus, « Partout » plus haut, ordre figé) ; corrigé : (1) voile propre derrière la pile (fond de page à 80 % + flou 6 px, fondu sur 110 px vers le haut) : plus aucun texte de la liste entre les pilules, ni sous « Partout » ; (2) le commun passe en deux colonnes de pilules de 44 px (même ordre E F V R B C, l'impaire seule en haut à droite) : la pile monte à 498 px du bas au pire (Brassins, Clients) contre 594, le haut de l'écran reste lisible ; (3) en-têtes « Partout » et « Sur <écran> » en texte (nom de l'écran à sa couleur), plus de pastilles qui mordent la liste ; (4) à l'ouverture le × devient neutre (surface, bord) : un seul accent, l'action de l'écran (cave : plus de jaune + pêche) ; (5) repos : 80 px d'air en fin de liste, la dernière ligne (B-022 · 19.09) finit au-dessus du + ; (6) Triple 1,078 → 1,014 (8,4 % comme la recette v2 ; 1,010 donnait 8,9 %) ; 1280 : + flottant en bas à droite, pile de 460 px, libellés entiers et lettres.

### Menu par écran pour le port (b1s-b2) — de bas en haut : action pleine contre le + · ses autres actions · Partout (communes restantes, ordre figé)
- Bord : Nouvelle écriture (facture ou à la main) · Ajouter aux courses (pour B-032) · Facture, Vente, Recette, Brassin, Compagnon
- Finances : Nouvelle écriture · Entrer une facture (photo ou PDF), Encaisser une vente (Marché, bar) · Recette, Brassin, Compagnon
- Brassins : Nouveau brassin (sera B-033) · Saisir une densité (B-031 · J+4), Ajouter aux courses (froment) · Écriture, Facture, Vente, Recette, Compagnon
- Recettes : Nouvelle recette · Lancer un brassin (B-033 · recette) · Écriture, Facture, Vente, Compagnon
- Atelier : Nouvelle idée · Lancer un brassin (essai 5 L) · Écriture, Facture, Vente, Recette, Compagnon (un seul + : celui de l'Atelier disparaît)
- Volumes : rien à créer · Lancer un brassin (IPA Nelson 25 L), Ajouter aux courses (pour 25 L) · Écriture, Facture, Vente, Recette, Compagnon
- Articles : Nouvel article · Ajouter aux courses (Citra T90 · 2 kg) · les six
- Courses : Copier la liste (3 articles) · Nouvel article · les six
- Fûts : Nouveau fût (sera F-07) · Encaisser une vente (fût vendu) · Écriture, Facture, Recette, Brassin, Compagnon
- Matériel : Nouveau matériel · — · les six
- Houblons : Nouvelle variété · Ajouter aux courses (Citra T90 · 2 kg) · les six
- Clients : Nouveau client · Encaisser une vente, Nouveau tarif · Écriture, Facture, Recette, Brassin, Compagnon
- Impôt bière : rien à créer · — · les six (« Copier cette estimation » reste dans l'écran)
- Prix et marges : Nouveau tarif · Nouveau client · les six
- Port : libellés courts au 390 (Écriture, Facture, Vente, Recette, Brassin, Compagnon), entiers au 1280 ; × neutre ; voile = surface à 80 % + backdrop-filter ; marge basse de liste 80 px sur chaque écran ; le reste comme b1s-b (`fabActions.ts`).
