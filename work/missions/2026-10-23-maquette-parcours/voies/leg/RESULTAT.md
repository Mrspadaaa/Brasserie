OK — v2a telle quelle, mots compris ; LEGENDE-V2A OK (V5 : témoin ECHEC 4), BATTERIE 46/46, ETATS 141/141

## Mots de v2a (25.10)
- V5 ajouté à `controle-legende-v2a.mjs` : les lignes des mots, du ◇ et des fiches (avec les huiles) de Nugget et de Motueka sont comparées à `leg3/v2a.html`, aux espaces près.
- Témoin, la construction précédente : LEGENDE-V2A ECHEC 4 (Pineapple ; Hopsteiner (boutique US) ; citron · Fresh lime · lemon zest ; thiols moyenne).
- Correction : la table de v2a dans `legende-bande.tsx` (EQUIVALENTS, SOURCES, THIOLS, mot contenu dans un autre).
- Résultats : LEGENDE-V2A OK ; BATTERIE OK 46/46 ; ETATS OK (141/141 ; 13 voulus non rejoués).
- Captures reprises et ouvertes : `leg3-v2a-maquette-carte-ouverte.png`, `leg3-v2a-maquette-motueka-ouverte.png`.


## Reprise D140 (25.10, nuit) : v2a telle quelle, barre de v2e
- Contrôle neuf : `work/refonte-frontend/v4/tournoi/outils/controle-legende-v2a.mjs` (V1 à V4, sans arrêt au premier échec). Témoin, la construction v2f de HEAD 3d54871f (`maquettes/parcours-legende`) : LEGENDE-V2A ECHEC 15 (mots, ◇, fiches, clé, « si ajouté » absents ; pastille repliée ; rangée « ? » incomplète).
- Code : `legende-bande.tsx` (BandeOuverte, LignesV2a, TonsV2a, effetSiAjoute), `Carte.tsx`, `Ajouter.tsx`, `ma-biere.css` ; la ligne `controle-legende-v2a` ajoutée à `batterie.mjs`.
- Comportement de v2a.html :
  - toucher court sur la bande : bande, lignes de v2a, rangée des tons avec « ? » et « Sans X › » ;
  - le « ? » : la même chose, plus la ligne des autres icônes ;
  - toucher la bande ouverte la referme.
- Régression corrigée en passant : sur la construction v2f, le toucher sur la bande bloquait l'appui long vers la fiche. L'état etat-fiche-appui-long-citra était en ECHEC (0/4) sur HEAD. Désormais, seul un toucher de moins de 450 ms ouvre la bande.
- Sur `maquettes/parcours` :
  - TYPES OK ; LEGENDE-V2A OK ;
  - BATTERIE OK 46/46 (le premier passage faisait 45/46 : CHOIX, via l'état Citra ci-dessus, corrigé) ;
  - ETATS OK (141/141 ; 13 voulus non rejoués).
- Captures, ouvertes à côté de `leg3-v2a.png` : `captures/leg3-v2a-maquette-repos.png`, `-carte-ouverte.png`, `-motueka-ouverte.png`, `-aide.png`.
- Écarts dus aux données (les mots des fiches, sans traduction) :
  - « … · Pineapple » chez Nugget ; « citron · Fresh lime · lemon zest » chez Motueka ;
  - « Hopsteiner (boutique US) » ; thiols « moyenne » ;
  - « woody » passe à la ligne.
- Aucun contrôle refusé pour la longueur.


## v2f et intégration (24.10, soir)
- Le choix : « Tu peux intégrer légende type leg3-v2a · Les barres n/N mais barre leg3-v2e · Les spéciaux repliés ». Puis : « Légende vraiment bien, avec icône sans full text, bonne infos ciblé mais barre comme leg3-v2e ».
- La v2f : `leg3/v2f.html`, capture `captures/leg3-v2f.png`. La v2g est faite (`leg3/v2g.html`, `captures/leg3-v2g.png`) et laissée telle quelle.
- L'intégration :
  - nouveau fichier `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/legende-bande.tsx` ;
  - modifiés : `Carte.tsx`, `Ajouter.tsx` (la ligne s'ouvre avec ses spéciaux ; le ◇ en treizième case reste au repos) et `ma-biere.css` (classes `pq-mb-lg-`) ;
  - données du moteur : `describeFamilies` (n/N, en tête), `familyWords` (mots précis sans les mots génériques, ◇ avec sources), catalogue Hopsteiner (linalol, thiols, huiles) ; géraniol « ? ».
- Sorties :
  - construit : `CONSTRUIT OK (9 pages)` dans `prototypes/houblons-v4/maquettes/parcours-legende` ;
  - captures ouvertes : `work/refonte-frontend/v4/ecran-1/fils24-legendes/captures/leg3-v2f-maquette-repos.png` (identique au repos d'avant, sauf le ◇ déjà présent), `leg3-v2f-maquette-carte-ouverte.png`, `leg3-v2f-maquette-motueka-ouverte.png`.
- Contrôles demandés :
  - `verifier-types` → TYPES OK ;
  - `controle-legende --etape` → LEGENDE OK (carte : 95 mots, 12/12 icônes nommées ; ajouts : 70 mots, 15/15) ;
  - `controle-commun ma-biere --sans=mots` → COMMUN OK ;
  - `mots-premier-ecran --max=30` → 29 mots, MOTS OK ;
  - `controle-hauteur --max=1.10` → HAUTEUR OK (1,09 écran) ;
  - `controle-etats --ecran=etape` → ETATS OK (15/15 ; 2 voulus non rejoués) ;
  - `controle-geste-etape` → GESTE-ETAPE OK.
- Aucun refus lié à la longueur de la légende.
- Un fait sur les données : les mots précis viennent tels que les fiches les écrivent, parfois en anglais (« Fresh lime », « lemon zest », « Pineapple »).


## Passe 2 (24.10, soir)
Deux retours du brasseur. Le premier : « Ça à l'air top, poussé même le concept un peu plus loing avec taux d'intensité et + d'info sur les caractéristiques spéciales ». Le second : « Fait moi 5 version un peu modifié améliorer de cette version ».
- Ce que chaque version ajoute, données réelles seulement :
  - l'intensité par famille : n/N fiches (`describeFamilies`), le niveau, et « en tête d'une fiche » (le premier mot d'une fiche) ;
  - les mots précis : ananas · litchi · noix de coco, géranium, woody ; pour Motueka, citron vert · zeste de citron ;
  - le ◇ avec ses sources : gingembre (Beer Maverick), resiny (Hopsteiner US) ; mojito (Beer Maverick, Hopsteiner), fruité (Hopsteiner) ;
  - les fiches Hopsteiner 2025 : linalol 0,8–1 % (Nugget) et 0,5–1 % (Motueka), thiols faible et moyens, huiles 1,5–3 et 1–1,8 mL/100 g, géraniol « ? » (non publié) ;
  - pour Motueka, « à 10′ : floral +1 cran » : l'effet calculé par le moteur dans la maquette.
- Point de profil du moteur : seul l'effet de l'ajout existe (Résineux +4 crans, hors style). Il est montré ; rien n'est inventé au-delà.
- Fichiers (OWNS) :
  - `leg1/etat-v2.html`, `leg2/etat-v2.html`, `leg4/etat-v2.html` ;
  - `leg3/v2a.html` à `leg3/v2e.html` ;
  - les captures `captures/leg1-v2.png`, `leg1-v2-motueka.png`, `leg2-v2.png`, `leg2-v2-motueka.png`, `leg4-v2.png`, `leg3-v2a.png` à `leg3-v2e.png` ;
  - les lignes « Passe 2 » dans les quatre NOTE (cinq lignes pour leg3).
- Les cinq retouches de leg3 :
  - v2a : barres ;
  - v2b : nombre « 2/4 », mots précis en renvoi sous leur case ;
  - v2c : points, mots précis au toucher de la case, ◇ fermé ;
  - v2d : la case grandit (histogramme) ;
  - v2e : trait souligné, spéciaux repliés en une pastille.
- Contrôles rejoués :
  - G1 → `LEGENDES-BIEN-4` ; G2 (etat.html) → `TRAIT OK` ;
  - `controle-pictos-trait` sur `etat-v2.html` (leg1, leg2, leg4) et sur `v2a` à `v2e` (leg3) → `TRAIT OK` partout ;
  - `controle-commun --sans=mots,fiche,legende` sur toutes les v2 → `COMMUN OK`. v2b était en ECHEC de contraste (« 0/4 » à 2,46:1) ; le gris des nombres passe à #6b6b6b ;
  - toutes les captures ont été ouvertes.
- Limite : sur leg1 v2 et leg2 v2, les deux légendes ouvertes ne tiennent plus ensemble à l'écran. Une capture montre Nugget, une seconde Motueka.
- Prédiction : il ira vers leg3 v2a ou v2c (intensité lisible case à case, mots au doigt) ; leg1 et leg2 v2 lui paraîtront chargées.

## Passe 1 (v0)
OK — quatre légendes en pictos sous les pastilles (leg1 à leg4), Nugget et Motueka, sur la maquette du soir

## Fichiers écrits (OWNS seulement)
- `work/refonte-frontend/v4/ecran-1/fils24-legendes/leg{1,2,3,4}/` : `etat.html` (les légendes ouvertes, le doigt sur ce qui les ouvre), `repos.html` (même page au repos), `socle.css` (copie des assets de la maquette du soir), `NOTE.md` (chaleur, idée, ce qui tient, ce qui casse, contrôles et leurs raisons).
- `work/refonte-frontend/v4/ecran-1/fils24-legendes/captures/` : `leg1.png` à `leg4.png` (390 × 844, densité 2), `leg1-repos.png` à `leg4-repos.png`, `leg4-glisser.png` (geste joué de Floral à Tropicaux).
- Générateur et scripts de jeu dans `os.tmpdir()/leg/`. Rien à la racine (`pistes-l5f.png` existait déjà).

## Méthode
Chaque page est le DOM du vrai rendu de `parcours-sortie/ma-biere/etat.html`, figé par Chrome : la carte de Nugget à 60′, le rail, les ajouts proposés, le profil. Les deux panneaux de légende d'aujourd'hui sont retirés, puis la légende de la variante est posée. Données du moteur (`describeFamilies`, `familyWords` de `src/engine`) : Nugget a cinq familles marquées et deux citées ; Motueka une marquée, deux citées, « ◇ mojito · fruité » ; l'effet de Résineux, +4 crans hors style, vient du rendu. Pictos : symboles `p-<famille>` de la planche, déjà dans la page. Les familles absentes ont une copie grise du même dessin : aucun symbole neuf.

- **leg1 (froide)** : le panneau d'aujourd'hui s'ouvre collé sous la bande, une flèche pointée sur elle. Les noms sont remplacés par des paires carré + picto (6 × 2, dans l'ordre de la bande), puis les trois états montrés et le reste des icônes. 27 et 20 mots, contre 70 et 45 aujourd'hui.
- **leg2 (froide)** : la légende lit ce houblon. Sous un crochet tiré sous la bande, trois rangs (marquée, citée, non décrite) portent ses familles en carré + picto, plus le rang « dans ma bière » (Résineux +4 crans, hors style). Dans la ligne de Motueka, les pictos sont calés sous ses pastilles.
- **leg3 (tiède, case à case)** : toucher la bande l'ouvre en place, en 12 colonnes de 24 px, chaque picto sous son carré ; « ◇ mojito · fruité » au bout. Ouverte, elle ajoute une ligne (60 px).
- **leg4 (tiède, bulle)** : le doigt glisse sur la bande et une bulle-loupe façon Dock suit, picto tenu à 30 px, voisins à 19 et 14, les autres à 10. Elle montre la famille tenue, ses fiches et ses mots (« woody », « ananas, litchi, noix de coco »). Le ◇ est au bout de la bande de Motueka. Rien n'est poussé au repos.

## Critères (rejoués depuis la racine)
- G1 `node work/refonte-frontend/v4/ecran-1/fils24-legendes/outils/legendes.mjs leg1 leg2 leg3 leg4` → `LEGENDES-BIEN-4`
- G2 `node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-legendes leg1 leg2 leg3 leg4 --page=etat.html` → 36, 37, 36 et 36 pictos, 0 faute ; `TRAIT OK`

## Autres contrôles (hors GATES)
- `controle-commun.mjs … --page=etat.html --sans=mots,fiche,legende` → `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, standard, trait, parlant, brutes). Raisons écrites dans chaque NOTE :
  - `fiche` : page figée, sans le code de l'app ;
  - `legende` : `etat.html` montre la légende ouverte par construction (D49).
- `controle-legende.mjs … --page=repos.html` → `LEGENDE OK` (bouton de 28 px, aria-expanded false au repos, 29, 19, 13 et 17 mots ouverts ; Échap referme).
- Gestes joués dans Chrome, sans erreur de page :
  - leg1 et leg2 : le « ? » ouvre et ferme ;
  - leg3 : la bande ouverte se replie au toucher et se rouvre ;
  - leg4 : glisser de Floral à Tropicaux change la bulle, qui part 1,9 s après le lever.
- `controle-panel.mjs` (4 captures) → **PANEL ECHEC**, DIVERSITÉ : remplissage médian 0,56, ressemblance moyenne 0,92 (seuil 0,90), 0 paire presque identique. La cause est le brief : même page, seule la légende change. Pour mémoire, la série legz fait aussi ECHEC (17 % de paires presque identiques).
- `controle-choix.mjs --ecran=etape-houblons` (la page posée en `ma-biere/etat.html` dans un dossier temporaire) → **CHOIX ECHEC** sur les quatre. Ce contrôle joue l'app vivante (rail, appui long vers la fiche, profil vers #/biere, états) : une page figée ne peut pas le passer. Comparaison faite à la main : au repos, `leg1-repos`, `leg2-repos` et `leg3-repos` sont identiques à la capture de la maquette du soir ; `leg4-repos` n'ajoute que le ◇ au bout de la bande de Motueka.

## Captures (toutes ouvertes)
`work/refonte-frontend/v4/ecran-1/fils24-legendes/captures/leg1.png`, `leg2.png`, `leg3.png`, `leg4.png`, `leg4-glisser.png`, `leg1-repos.png` à `leg4-repos.png`.

## Prédiction
Il prendra leg3 (« la bande s'ouvre, je vois tout de suite ») ou leg4 pour les mots des fiches. Il dira de leg1 que c'est encore un pavé, et de leg2 « pas mal ».

DÉCISION À PRENDRE : leg2 et legz4 (groupes par ton), comme leg4 et legz1 (lecture au doigt), sont parents. Les montrer côte à côte, ou n'en garder qu'un de chaque paire au tri.

CONNAISSANCE : pour une mini maquette fidèle, figer le DOM du rendu de la construction (scripts retirés, CSS copiée) puis greffer la variante. La page est identique au repos, mais `controle-choix`, `controle-fiche` et le rail ne peuvent plus passer, car ils jouent l'app vivante. Le contrôle D89 (`controle-legende`) lit la première `[data-role="legende"]` du document : une légende faite d'icônes seules (moins de 8 mots) y échoue, quoi qu'en dise le brief « plus d'icônes que de mots ».

LEÇON PROPOSÉE : un lot dont toutes les variantes reprennent le même écran (seul un élément change) doit le dire à `controle-panel`, par exemple par une mesure restreinte à la zone de la variante ou un seuil de ressemblance propre au lot. Sinon, le contrôle de diversité échoue par construction et le signal se perd.
