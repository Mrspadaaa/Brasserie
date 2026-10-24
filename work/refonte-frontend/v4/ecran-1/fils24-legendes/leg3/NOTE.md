# leg3 — « Case à case : la bande s'ouvre »

- Chaleur : **tiède** (forme imposée : la légende en ligne de pictos alignée case à case).
- Base : la maquette du soir, rendue par Chrome et figée (`socle.css` = copie de ses assets). Thème clair, 390 × 844.
  `etat.html` : les deux bandes ouvertes (doigt sur Résineux de Nugget, sur Agrumes de Motueka) ; `repos.html` : au repos.

## L'idée
Toucher la bande l'ouvre en place, sur toute la largeur : chaque carré s'élargit (24 px) et porte son picto juste
dessous, dans sa colonne ; sous Résineux, le trait orangé et « +4 ». Vive, pâle, grise se voient sur les carrés
eux-mêmes ; le picto d'une famille absente est gris. Trois carrés-mots (marquée, citée, non décrite) partagent la ligne
du « ? ». Dans la ligne de Motueka, la bande s'ouvre sous la ligne, « ◇ mojito · fruité » au bout. Le « ? » ouvre la
bande et une ligne pour les autres icônes. Toucher la bande ouverte la referme ; l'appui long reste la fiche.

## Ce qui tient
- Le lien bande ↔ légende est total : c'est la même bande, en grand. Une ligne de plus (60 px) sur la carte ; 4 mots
  pour les familles. Se lit en 3 s : « Nugget = fleur, feuille, ananas, sapin, épices ».

## Ce qui casse
- Le geste « toucher la bande » doit se découvrir (le « ? » l'ouvre aussi). 12 colonnes de 24 px à 390 px : rien de plus
  ne tient dessous (pas les mots des fiches).
- `data-role="legende"` est porté par la ligne du « ? » (D89 : la première légende s'ouvre au « ? » et dit 8 mots) ; la
  bande ouverte porte `data-role="legende-bande"`.

## Contrôles
- `controle-commun --page=etat.html --sans=mots,fiche,legende` : COMMUN OK (raisons de leg1). `controle-legende.mjs
  --page=repos.html` : LEGENDE OK (13 mots). Joué : toucher la bande ouverte la referme, la petite la rouvre.

## Passe 2 (« taux d'intensité et + d'info… » ; « Fait moi 5 version un peu modifié améliorer de cette version »)
Cinq retouches de la bande ouverte case à case, chacune avec l'intensité des fiches, les mots précis, le ◇ et ce que les fiches disent (linalol, thiols, géraniol « ? », huiles) ; une ligne-clé courte dit le codage. Données : describeFamilies et familyWords du moteur (n/N fiches, niveau, « en tête » = premier mot d'une fiche), catalogue Hopsteiner 2025 (linalol, thiols, huiles) ; géraniol non publié : « ? » ; Motueka « à 10′ : floral +1 cran » = l'effet du moteur de la maquette (D40, D53). TRAIT OK et COMMUN OK (--sans=mots,fiche,legende) sur les cinq.
- v2a (`v2a.html`, `captures/leg3-v2a.png`) : intensité en **barres** sous chaque picto (n/N segments, point « en tête ») ; mots précis, ◇ avec sources et fiches **ouverts** en trois lignes sous la bande.
- v2b (`v2b.html`, `captures/leg3-v2b.png`) : intensité en **nombre** « 2/4 » sous chaque picto (souligné : en tête) ; les mots précis **en renvoi sous leur case** (un filet à la couleur de la famille) ; ◇ sans sources.
- v2c (`v2c.html`, `captures/leg3-v2c.png`) : intensité en **points** ; les mots précis **au toucher d'une case** (Tropicaux de Nugget et Agrumes de Motueka sur la capture ; joué au doigt) ; ◇ **fermé** en pastille « ◇ 2 mots hors des 12 › » qui s'ouvre au toucher.
- v2d (`v2d.html`, `captures/leg3-v2d.png`) : la **case elle-même grandit** avec le nombre de fiches (histogramme, liseré noir : en tête), la bande devient un relief ; spéciaux ouverts comme v2a.
- v2e (`v2e.html`, `captures/leg3-v2e.png`) : intensité en **trait souligné** (part des fiches) sous le picto ; tous les spéciaux **repliés** en une pastille « ◇ 2 hors des 12 · 3 mots précis · huiles › » : la plus discrète (« Il faut pas que ça gêne ! »).
- v2f (`v2f.html`, `captures/leg3-v2f.png`) : la petite barre de v2e et les spéciaux repliés en « ◇ 2 hors des 12 · 3 mots précis · huiles › ». **Mal lue** : « Les barres n/N » et « Les spéciaux repliés » étaient les noms de deux vignettes, pas des consignes (D140). Intégrée un temps, puis remplacée ; la page reste comme trace.
- v2g (`v2g.html`, `captures/leg3-v2g.png`) : la barre de v2e et la case touchée dite en une ligne (v2c) ; écartée par son choix de v2f, laissée telle quelle.
- **Intégrée dans la maquette jouable : v2a telle quelle, avec la barre de v2e (D140).** Le brasseur, sur sa capture de la carte ouverte de Nugget dans v2a : « Je veux qqch comme ça moi ???? » ; puis, sur la rangée des barres à quatre segments : « Modifié juste ça par les vrai barre pas de stepper ». Seuls les quatre segments deviennent la piste de v2e, avec son remplissage n/N ; le point « en tête » reste, entre le picto et la barre. La clé prend la petite barre de v2e. Comme v2a.html : toucher la bande l'ouvre (bande, mots précis et leurs pictos, ◇ et sources, linalol, thiols, géraniol « ? », huiles et leur source, « si ajouté à 10′ : … » sur l'ajout proposé, clé, puis la rangée des tons avec « ? » et « Sans X › ») ; le « ? » l'ouvre aussi, avec en plus la ligne des autres icônes ; toucher la bande ouverte la referme.
  - Code : `parcours/src/ecrans/ma-biere/legende-bande.tsx` (BandeOuverte, LignesV2a, TonsV2a, effetSiAjoute), Carte.tsx, Ajouter.tsx, ma-biere.css.
  - Données du moteur : describeFamilies, familyWords, additionEffect, catalogue Hopsteiner.
  - Contrôle : `tournoi/outils/controle-legende-v2a.mjs` (V1 à V4), dans la batterie. Témoin, la construction v2f de HEAD 3d54871f : LEGENDE-V2A ECHEC 15.
  - Captures : `captures/leg3-v2a-maquette-repos.png`, `-carte-ouverte.png`, `-motueka-ouverte.png`, `-aide.png`.
  - Mots tels que v2a (25.10, « Fais ce que v2a fait ») : la table de v2a est dans `legende-bande.tsx`.
    - Un mot anglais dont l'équivalent français est affiché disparaît : Pineapple, Fresh lime.
    - lemon zest devient « zeste de citron » ; « citron » disparaît, contenu dans « citron vert ».
    - « Hopsteiner US » ; « thiols moyens » ; woody et resiny restent en anglais.
    - Contrôle V5 : ECHEC 4 sur la construction précédente, puis OK.
