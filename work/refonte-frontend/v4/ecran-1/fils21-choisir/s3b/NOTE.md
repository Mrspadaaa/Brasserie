s3b · La carte des possibles, seconde passe (critique/SYNTHESE.md §3 et §4, critique/s.md 13–17). s3 reste intacte pour comparer.

- **Ce qui tient** :
  - **La carte au premier plan.** Les réglages tiennent en une ligne : les pastilles « Citra ⌄ », « seul ⌄ » et « 3 j ⌄ », et la levure en deux boutons, US-05 et Pomona, les deux levures de la grille. « Verdant, Diamond : pas encore simulées seules » est écrit une fois.
  - **L'état de départ est K4** : dry hop actif avec US-05, Citra 4 g/L, 3 j. Au premier toucher, Pomona fait bouger la colonne « actif » (barres de la case 4 g/L : 12,7 · 14 · 7,9 · 11,5 px → 13,9 · 14,2 · 8,5 · 11,5 px), les jours font bouger les colonnes à sec, et « + Galaxy » change toute la carte.
  - **Les cases** :
    - plus de tour grise ;
    - quatre barres de 6 px, celles des familles qui bougent le plus pour ce houblon, les mêmes dans chaque case et nommées une fois en tête (picto + mot : Agrumes, Tropicaux, Noyau, Baies) ;
    - le plafond 16D en tirets et l'orangé au-delà ;
    - sous le mot « hors », les pictos des familles qui sortent du style, à la place du nombre ;
    - « mesuré » sur les cases qui ont une étude (Cascade, 1 j, après fermentation).
  - **Le geste, « appui court, puis glissé »** (troisième passe, critique/seconde-passe.md) :
    - un doigt qui part d'une case et file vers le haut ou le bas fait défiler la page ; rien n'est choisi et la loupe ne s'ouvre pas ;
    - un appui de 250 ms sans bouger ouvre la lecture : la case sous le doigt est cerclée et se lit en grand dans une loupe (« 10′ · 2 g/L, au style », ×3 la taille des étiquettes) ;
    - à la souris, on appuie et on glisse tout de suite. Le détail et la réponse suivent pendant le geste. Au relâché, l'écart s'écrit, par exemple « ~ dry hop actif 4 g/L → 60′ 4 g/L : Tropicaux −3 crans, Baies −3 crans, Agrumes −3 crans ». Un toucher simple choisit aussi la case.
  - **La vue « pente »** (greffe de a4 et de y3) : ce que rapporte le gramme suivant, sur les mêmes quatre familles, avec le plafond 16D.
    - Le curseur est continu, mais aimanté sur la grille : la bulle ×3 écrit « ≈ 2,8 → 2 g/L », et la ligne en dessous « entre deux doses de la grille : simulé à 2 g/L ».
    - La réponse : « ~ Tropicaux, de 2 à 4 g/L : 0,5 cran par g/L, contre 1,8 pour le premier ».
    - À côté, le mesuré : Lafontaine 2018 (E04), intensité 6,3 → 8,1 → 10,4 sur 15, « vérifié (K) ».
    - Avec un second houblon, le point 0 g/L est la bière avec ce second houblon seul : la saturation partagée se lit (« 0,7 pour le premier »).
  - **La réponse en une ligne** (≤ 25 mots), calculée : « ~ Citra, dry hop actif : au style jusqu'à 2 g/L ; à 60′, presque tout part. »
  - **Le détail** porte un titre avec tous les houblons (« Citra 4 g/L + Galaxy 2 g/L · dry hop actif · 3 j · Pomona »). Il montre :
    - 11 familles nommées, l'écart avec son unité, et « avant inconnu » écrit sous le nom quand c'est le cas (un seul sens pour « ~ ») ;
    - une seule marque de borne partielle (la bande pâle en fondu, sans capuchons) ;
    - le résineux une seule fois, hors de la figure : « déjà hors, ta dégustation ; ~ +0,8 cran » ;
    - la biotransformation, avec la phase juste : à chaud, « non comptée par le moteur », sans hop creep.
  - **Sous la carte** :
    - la **dose limite au style 16D** par houblon, au moment touché (Cascade et Idaho 7 jusqu'à 4 g/L, Citra et Galaxy jusqu'à 2 g/L en dry hop actif) : un classement par critère, pas un « meilleur » ;
    - le **classement mesuré** de E06 (linalol : Citra 144, Centennial 78,4, Nelson Sauvin 70,2, sans houblon 46,8 µg/L, dose inconnue).
  - **Trois blocs à un toucher** :
    - **ton défi** (x5) : plus floral « atteint, ~ +1,7 cran » ; moins résineux « hors houblon : le houblon en ajoute » ; amertume 50–70 IBU (60 IBU, calcul de l'app ; ajout à chaud au prorata de la dose des cas K1, marqué ≈) ; dans le style 16D ;
    - **tire une bière** (y5) : 1 ou 20 bières tirées dans la plage du moteur, en loi triangulaire autour de son centre (convention écrite). Le tirage dépend des réglages et ne change pas tant qu'ils ne changent pas. Puis « d'où vient l'écart » et « ce qui tranche en vrai » ;
    - **les preuves** (u5) : le mur houblon × composé (mesures en bière, « à vérifier » pour E03, cases « trou »), « la simulation tombe-t-elle juste ? » (3 sur 4 encadrées, le 3MH de Cascade sous la mesure, en orangé) et les six trous.
  - **Les acquis de la baseline** : lentille au style / absolu, α du lot puis des fiches (≠, pellets dans la fiche), usage en mot, stock en icône, « ? », appui long et « fiche › » vers la vraie fiche, pictos au trait.
  - **Les données régénérées** : `profils-simules.json` à 4,75 % vol. (Citra à 10′ 4 g/L reste au style en agrumes), et `comparatifs-dryhop.json` avec E04 relu.
- **Ce qui casse** :
  - La lecture demande un appui de 250 ms : un toucher simple choisit toujours la case, mais pour glisser d'une case à l'autre il faut d'abord tenir.
  - Les quatre familles des cases changent avec le houblon (Citra : Agrumes, Tropicaux, Noyau, Baies) : on compare les cases entre elles, pas deux houblons case à case.
  - Avec un second houblon, il est fixé à 2 g/L en dry hop, avec les mêmes jours ; en colonne chaude, il est posé après fermentation.
  - « + Galaxy » rend presque toute la carte « hors » : c'est le Galaxy 2 g/L lui-même qui sort en tropical.
  - Verdant et Diamond ne sont pas proposés seuls (pas dans la grille du moteur).
  - L'IBU d'un ajout à chaud n'existe que pour Citra et Cascade (cas K1, 4 g/L) ; pour les autres doses, il est mis au prorata (≈).
  - Le contrôle CUMUL compte « 0 ajout cumulé » au repos : le second houblon s'ouvre depuis la pastille « seul » (data-reglage="ajout-cumule").
- **Contrôles** (20.10, sur `etat.html`, rejoués après la troisième passe pour COMMUN et MOTS) :
  - `controle-commun.mjs D s3b --page=etat.html --sans=mots` → COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes) ;
  - `mots-premier-ecran.mjs D s3b --page=etat.html --sans-donnees --max=70` → « s3b 49 mots (hors données) », MOTS OK ; sans l'option : « s3b 107 mots », MOTS OK (110 au plus) ;
  - LISIBLE OK : « s3b · 38 pictos · 1 mesurées · 101 simulées · 0 faute(s) » ;
  - SIMULATION OK : « 2 simulation(s) · 25 réglage(s) · 9 mesurée(s) · le simulé bouge » ;
  - CUMUL OK : « 2 choix de levure · biotransformation visible · la levure fait bouger le simulé » ;
  - ALPHA OK (1 voie, 1 avec son α) ; FICHE-BASELINE OK (fiche de Citra, 12 familles nommées, 17 pictos, 0 faute).
- **Preuve du geste** (`jouer-s3b.mjs` → `geste-s3b.json`, joué au toucher par puppeteer-core, 390 × 844) :
  - **le défilement marche depuis la carte** : un doigt posé sur la case « whirlpool, 8 g/L » file vers le haut, sans appui ; la page défile de 442 px, la case choisie ne change pas et la loupe reste fermée (`s3b-defile.png`) ;
  - l'appui de 350 ms sur « actif, 4 g/L » ouvre la loupe « actif · 4 g/L — hors Agrumes, Fruits tropicaux, Petits fruits » (`s3b-appui.png`), puis le glissé :

  | état | titre du détail | Tropicaux | barre | Agrumes |
  |---|---|---|---|---|
  | avant | Citra 4 g/L · dry hop actif | +4 crans | 57 px | +3 crans |
  | pendant, doigt gardé sur 10′ 2 g/L (loupe « 10′ · 2 g/L, au style », ×3) | Citra 2 g/L · 10′ | +2 crans | 27 px | +2 crans |
  | après, relâché sur 60′ 4 g/L | Citra 4 g/L · 60′ | +0,6 cran | 9 px | +0,6 cran |

  - Écart écrit au relâché : « ~ dry hop actif 4 g/L → 60′ 4 g/L : Tropicaux −3 crans, Baies −3 crans, Agrumes −3 crans ».
  - Puis Pomona sur la case « actif » : Agrumes +4 crans. « + Galaxy » : tropical 65 px, titre « Citra 4 g/L + Galaxy 2 g/L ».
  - Pente : bulle « ≈ 2,8 → 2 g/L » (×3).
  - Aucune erreur de page.
- **Pire contraste** : 4,96:1, « Agrumes » (#856e0c sur blanc), sur 128 textes mesurés ; aucun sous 4,5:1.
- Captures (`../captures/`) :
  - geste : `s3b-defile.png`, `s3b-avant.png`, `s3b-appui.png`, `s3b-pendant.png`, `s3b-apres.png` ;
  - réglages : `s3b-pomona-actif.png`, `s3b-ensemble.png` ;
  - pente : `s3b-pente.png`, `s3b-pente-curseur.png` ;
  - page et blocs : `s3b-390.png` (page, 1688), `s3b-premier-ecran-390.png`, `s3b-bas.png`, `s3b-defi.png`, `s3b-tire.png`, `s3b-preuve.png` ;
  - états communs : `s3b-legende.png`, `s3b-absolu.png`, `s3b-fiche.png`.
- Fichiers et adresses :
  - généré par `generateur-s3b.mjs`, avec `socle-s3b.mjs` (copie retouchée du socle de s1, laissé intact), `sim-runtime.js` (copie, un seul sens pour « ~ ») et `page-s3b.js` ;
  - états par adresse : `?vue=pente`, `?bloc=defi`, `?bloc=tire`, `?bloc=preuve`, `?houblon=Cascade&jours=1&case=dryPost,4`, `?second=Galaxy`, `?levure=Pomona`, `?abs`, `?legende`, `?fiche=Citra`.
