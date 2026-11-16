OK — 45 problèmes, 9 bloquants

Critique k6 (Opus, Fable interdit), 15.11.2026. Question : « combien et quels problèmes il y a ? ».
Images ouvertes, toutes : g6a (5), g6b (4), g6c (4), e5na (6), e5nb (4), e5nc (4), e5nd (4) ; parents e6a-repos, e6c-repos,
e6c-geste ; refusées e5a à e5d au repos ; l'app : a1-banc fiche-fermentation-390-clair. Mesures en px CSS (captures en 2x).
Chiffres relus contre BRIEF-AUTEUR « Les chiffres » et DONNEES-COMMUNES (Stout : 30 × 33 cl + F-01 de 20 L rempli à 12 L).

## Commun aux 7
1. Cibles sous 44 px à 390 : puces de filtre 31 px (g6a, g6b), bouton d'action des cartes « Dry hop demain » 27 px (g6a à g6c,
   repris tel quel de e6a), « Seule » 32 px (g6c), puces de jour 36 px (e5na, e5nd), « Terminé » 27 px (e5nb). Correction : zone
   de toucher invisible de 44 px autour de chaque cible, sans changer le dessin (e6a reste reconnaissable).

## g6a — CORRIGER
1. [B] `g6a-repos-1280-clair`, colonne de gauche, champ de recherche : le texte d'aide est coupé en plein mot, « Nom, lot, houblon, ma ».
   Correction : « Nom, lot, houblon… » à 1280, ou un champ plus large.
2. `g6a-repos-1280-clair`, en-tête : « Tout l'historique » à côté de « Nov. + en cours », deux périodes contraires (déjà noté par k2,
   hors Possède de l'auteur). Correction : l'en-tête suit la période de la liste, ou le sélecteur disparaît de cette vue.
3. `g6a-repos-390-clair` : trois rangées de puces (avancement sur deux lignes, puis style) font descendre la première carte de 615 px
   (e6a) à 765 px, et l'écran montre 3,5 cartes au lieu de 4. Correction : l'avancement sur une seule rangée qui défile avec un fondu,
   comme e6a, et le style rangé derrière « Plus » (son compte reste sur le bouton).
4. `g6a-repos-390-clair`, rangée d'avancement : « ★ Favoris 1 » a une pastille orange et se range parmi les états, alors qu'il se
   combine (ET) avec eux (OU). Correction : l'étoile seule, sans pastille, en bout de rangée, après un trait.
5. `g6a-repos-1280-clair`, carte Stout : « 33 cl · F-01 » perd le « 30 × » que e6a montrait. Correction : « 30 × 33 cl · fût 12 L ».
6. `g6a-vide-390-clair` : « Le Stout est conditionné » ; la carte dit « Conditionnée » et g6c « La Stout ». Correction : un seul
   accord, celui de la carte (« La Stout est conditionnée »).
7. `g6a-repos-390-cave` : la pastille grise de « Terminés » est presque invisible sur le fond noir. Correction : un gris plus clair
   en cave.

## g6b — CORRIGER
1. [B] `g6b-repos-390-clair` : les 5 brassins sont dits trois fois avant la liste : 5 comptes soulignés, une bande de 5 cartes, puis les
   cartes. La première carte tombe à 800 px (615 dans e6a) ; c'est le premier plan chargé que « pas de cockpit » refuse, et la tête de
   e6a (deux lignes colorées) n'est plus reconnaissable. L'auteur l'a prédit lui-même : « trois lignes de mots, c'est lourd ».
   Correction : retirer la bande (les cartes s'éteignent déjà dans la liste) ; garder la phrase de e6a en grand sur deux lignes
   (« 2 en cuve », « 1 à brasser »), puis « 1 conditionnée · 1 écoulée · 1 ★ » sur une ligne plus petite, chaque compte touchable.
2. `g6b-repos-390-clair` : les filtres comptés de e6c (style, houblon, alcool) n'apparaissent dans aucune image ; ils sont derrière
   « Filtres », sans compte. Correction : « Filtres » porte le compte du filtre posé ; montrer la feuille dans une image du geste.
3. `g6b-repos-390-clair` et `g6b-geste-390-clair` : petites phrases grises d'aide, « touche un compte pour filtrer » et « touche un mot
   pour l'ôter » (cause c3 n° 7). Correction : les retirer, le soulignement et la croix suffisent.
4. `g6b-repos-390-clair`, puce de période : « Nov. » perd le « + en cours » de e6a. Correction : « Nov. + en cours ».
5. `g6b-vide-390-clair` : « Étoiler la Pale Ale » propose de changer une donnée pour satisfaire un filtre ; aucun brasseur n'étoile une
   bière pour faire sortir un résultat. Correction : retirer cette ligne et ne garder que les deux « Retirer ».
6. `g6b-geste-390-clair` et `g6b-vide-390-clair` : le bas de l'écran est blanc sur 230 et 200 px. Correction : y mettre la rangée
   pliée « 3 autres hors du filtre » de g6a, avec leurs états.

## g6c — MONTRER
1. `g6c-repos-390-clair`, menu « Favoris » : au repos, la valeur affichée est « ★ » là où Style et Houblon disent « Tous » ; on croit le
   filtre posé alors que la liste montre les 5. Correction : « Tous » comme les autres, l'étoile dans le titre (« ★ Favoris 1 »).
2. `g6c-repos-390-clair` : la phrase-réponse de e6a (« 2 en cuve / 1 à brasser ») disparaît ; les têtes de section la remplacent.
   Correction : garder la phrase de e6a en tête, au-dessus des menus.
3. `g6c-repos-390-clair`, têtes de section : le bouton « Seule » ne se comprend pas en trois secondes (seule quoi ?), et il est répété
   quatre fois. Correction : toucher la tête filtre la section ; ou « Que celles-ci ».
4. `g6c-repos-390-clair`, à droite de la recherche : le tri n'est plus qu'une icône ⇅ ; « À suivre d'abord » de e6a ne se lit plus.
   Correction : le libellé du tri à côté de « 5 brassins ».
5. `g6c-geste-390-clair` : « NEIPA hors du filtre » en petit gris, et 30 % de l'écran blanc en bas. Correction : la NEIPA en ligne
   pliée, avec son état, comme la rangée « hors du filtre » de g6a.
6. `g6c-repos-390-clair`, menu « Houblon » : le seul filtre sans compte, dans une proposition « filtres qui comptent ». Correction :
   « Houblon · 2 connus », ou le menu retiré tant que les houblons ne sont connus que pour la NEIPA.

## e5na — CORRIGER
1. [B] `e5na-repos-390-clair`, premier écran : sous la frise, c'est la forme de e5a refusée, dans le même ordre : titre « NEIPA, 24 L ·
   date à définir », tuiles de recette, curseur de volume hachuré à 30, puces « À définir / dim. 15 / lun. 16 / +7 j / autre », gros
   bouton noir en bas. La frise neuve ne commence qu'à 1100 px. Attente manquée : « rien de la forme des 4 refusées ». Correction :
   l'étape Planifier repliée en une ligne de réponses touchables, « NEIPA · 24 L ✎ · quand ? » (la recette proposée déjà remplie) ;
   la date se pose en touchant la date de l'étape Brassage ; toute la frise est visible au premier écran, comme au geste.
2. [B] `e5na-repos-1280-clair` : la frise reste dans la colonne de gauche, la moitié droite est vide (cause c3 n° 7), et le carrousel
   de recettes est coupé (« Sto… ») alors que la place ne manque pas. Correction : Planifier à gauche, la frise à droite (déjà prévu
   par l'auteur).
3. [B] `e5na-geste-390-clair`, étape Garde : « dès 30.11 », alors que le repos à 21 °C va de J+7 à J+9 (28.11 → 30.11) ; la garde
   commence à J+10, le 01.12. Chiffre faux. Correction : « dès 01.12 ».
4. `e5na-geste-390-clair`, étape Planifié : « stock déduit aux ajouts » a la forme d'une puce touchable mais n'est qu'un constat, et
   « Modifier » est un texte nu, sans cadre. Correction : le constat en petite ligne avec l'icône stock ; « Modifier » en bouton.
5. `e5na-repos-390-clair`, carrousel de recettes : coupé au bord (« Sto ») sans fondu. Correction : un fondu au bord, comme la
   rangée de e6a.
6. `e5na-repos-390-clair` et `e5na-geste-390-clair` : le « + » flottant reste affiché à côté de la barre « Planifier » ou
   « Commencer le brassage » : deux gros boutons d'action. Correction : masquer le + pendant la création.
7. `e5na-vide-390-clair` : un LOT-021 « Brouillon » existe alors qu'aucune recette n'existe (un numéro de lot pris pour rien), et la
   moitié basse est blanche. Correction : pas de numéro ni de frise sans recette ; l'écran vide dit « Il faut une recette » avec
   les deux boutons, centré.

## e5nb — CORRIGER
1. [B] `e5nb-repos-390-clair`, `e5nb-geste-390-clair` : la liste n'est pas celle qu'il a retenue le 15.11 (e6a, que g6 greffe) : ce
   sont les cartes de l'app actuelle (« LOT-019 · F1 », état à droite, « 24 L en cuve · Densité 1,018 · J+5 depuis brassage »,
   « Température du 14.11 à renseigner », « Voir les mesures »), sans phrase-réponse, barre d'état, chiffre clé ni action ; J+n y
   est compté depuis le brassage, et la Pale Ale porte « Pale Ale » au lieu de « American Pale Ale ». Règle n° 1, cause c3 n° 2.
   Correction : poser la carte fantôme dans la liste de e6a (g6a), sous la phrase-réponse, qui devient « 2 en cuve · 2 à brasser ».
2. `e5nb-repos-390-clair`, carte fantôme : les rangées « Bière » (« Pils ») et « Quand » (icône calendrier) sont coupées au bord,
   sans fondu. Correction : un fondu au bord.
3. `e5nb-repos-390-clair` et `e5nb-geste-390-clair` : le bandeau « LOT-021 ajouté en tête · Annuler » couvre la carte Pils au repos,
   et l'état de la Saison au geste (« …miné »). Correction : une marge basse sous la liste, à la hauteur du bandeau.
4. `e5nb-repos-390-clair`, bouton « Terminé » de la carte fantôme : c'est aussi le nom d'un état de brassin (la Saison « Terminé »
   au geste). Correction : « OK » ou « Fermer ».
5. `e5nb-vide-390-clair` : la carte Pale Ale disparaît de la liste (l'auteur l'a noté), et des brassins existent avec un carnet vide.
   Correction : la même liste que le repos, seule la carte fantôme change.

## e5nc — CORRIGER
1. [B] Les écrans 2 (Quand) et 3 (Volume et cuve) ne sont pas dessinés : le volume au curseur m2 et le choix de la cuve ne figurent
   dans aucune image ; on juge le premier écran et la fin. Fonction absente de la planche. Correction : dessiner les deux écrans,
   les jours en grandes cases, le curseur m2 avec la bande hachurée à 30 L, les cuves F1 à F3 avec F3 « après la Pils ».
2. [B] `e5nc-repos-390-clair`, verres : la couleur est le choix ici, et elle est fausse en brasseur. La Pils est plus foncée que la
   NEIPA (jeton gold contre une NEIPA éclaircie), alors qu'une Pils est la plus pâle des cinq ; la NEIPA n'est pas trouble, alors que
   la NOTE le promet. Correction : Pils en straw, NEIPA en gold avec un voile, puis le reste dans l'ordre réel de couleur.
3. [B] `e5nc-geste-390-clair`, « Dans la liste » : la carte montrée est celle de l'app actuelle, pas celle de e6a qu'il a retenue
   (règle n° 1). Correction : la carte de e6a (barre d'état « Planifié », chiffre clé « sam. 21.11 », action « Préparer »).
4. `e5nc-repos-390-clair` : sous chaque verre, « LOT-019 », « LOT-020 »… : on croit choisir un lot existant et non une recette.
   Correction : « dernier brassin 09.11 », ou rien.
5. `e5nc-geste-390-clair` : 35 % de l'écran est blanc en bas. Correction : les étapes à venir, datées (Brassage 21.11, dry hop 27.11,
   repos 28.11 → 30.11), comme la frise e4c.
6. `e5nc-repos-390-clair` : le « + » flottant reste visible pendant le parcours de création. Correction : le masquer.

## e5nd — MONTRER
1. `e5nd-geste-390-clair`, curseur : le pouce est à 26 L, mais le repère vert « 24 » et le « 66 » au-dessous restent allumés ; ni 26
   ni 72 n'apparaissent sur le curseur, qui se lit à 24. Correction : une bulle « 26 L · ≈72 » au-dessus du pouce, et 24 en gris,
   marqué « recette ».
2. `e5nd-geste-390-clair`, bas : le bouton « Préparer le brassage » est à moitié caché par la barre de navigation. Correction : une
   marge basse.
3. `e5nd-repos-390-clair`, capsules : mêmes jetons que e5nc, donc la Pils a le même or que la NEIPA, et la NEIPA n'est pas trouble.
   Correction : Pils en straw, NEIPA voilée.
4. `e5nd-repos-390-clair`, rangée de capsules : « Nouvelle » est coupée (« Nou ») sans fondu. Correction : un fondu au bord, ou six
   capsules de 52 px.
5. `e5nd-repos-390-clair`, moitié basse : le curseur hachuré à 30, les puces de jour, la barre noire « Planifier » et le bouton stock
   reprennent le bas de e5a refusée ; le haut, lui, est neuf. Correction : le jour se pose en touchant « date ? » sur l'étiquette ;
   la rangée de jours disparaît du premier plan.
6. `e5nd-repos-390-clair` : on voit ce que le brassin donnera, pas quand ni où (hypothèse n° 4 de e5n à moitié tenue). Correction :
   une ligne sous « Ce que tu tireras » : « F3 après la Pils · dry hop J+6 · tirage — ».
7. `e5nd-vide-390-clair` : 55 % de l'écran est blanc en bas. Correction : la bouteille pointillée et les deux boutons centrés.

## Doutes (non comptés)
- e5nd : la bouteille figure le remplissage de la cuve de 30 L ; une bouteille de 33 cl pleine aux 4/5 pour dire « cuve », c'est
  une métaphore mêlée. Et pas de fût : la Stout est sortie en 30 × 33 cl et un fût (F-02 est promis à la Pils, dit la NOTE).
- e5nb : un seul toucher sur le + crée un brassin « Planifié · date à définir » ; seul le bandeau « Annuler » protège d'une erreur.
- e5na-repos : F1 « NEIPA en garde » est affichée alors que la date est encore à définir.
- e5nc : Pale Ale en cuivre presque brun, plus foncée que la Saison ; il faut l'EBC des recettes pour trancher.

## Classement
Groupe « liste » (e6a greffée des filtres de e6c) :
1. g6a — e6a telle quelle, plus des puces qui comptent ; une ligne à reprendre. « Oui, c'est e6a avec des filtres qui comptent, enfin. »
2. g6c — les sections se comptent bien, mais la tête de e6a est perdue. « C'est clair, mais il est où mon "2 en cuve, 1 à brasser" ? »
3. g6b — maligne, mais trop lourde avant la liste. « Trois fois mes cinq bières avant de voir une carte, c'est trop. »

Groupe « Créer un brassin » (les 4) :
1. e5na — le geste est le meilleur (le brassin naît avec ses dates, comme e4c et e1a), mais son premier écran rejoue e5a. « Là je vois mon brassin avec ses dates. Mais le haut, c'est le même formulaire qu'avant. »
2. e5nd — le seul genre vraiment neuf, à montrer tel quel. « Les bouteilles, ça parle : je sais ce que je vais tirer. Par contre, la Pils de la même couleur que la NEIPA… »
3. e5nb — bonne idée (créer puis annuler, la liste sous les yeux), mais dans la liste qu'il n'a pas choisie. « Pourquoi c'est pas la liste que j'ai choisie ? »
4. e5nc — trop de touchers pour un geste fréquent, et la moitié du parcours n'est pas dessinée. « Trois écrans pour planifier une NEIPA ? Et le volume, je le règle où ? »
