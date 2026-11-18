OK — db : la meilleure base pour comparer et surveiller ; 17 problèmes, dont 4 bloquants (façons sans geste, critère non saisissable, critère texte inerte, marque Pareto fausse)

# Critique de db (axe B, tableau de comparaison vivant) — regard neuf, Opus

Lu : CADRE.md, NOTE.md, PORTRAIT.md, SPEC l. 1748 à 1793 (jusqu'à « ultra facile… workflow le plus simple »).
Captures ouvertes : les 25 en clair, et en cave carnet et veille. Prototype joué au script puppeteer (390 × 844, tactile) :
noter, coller un lien, puce, Tout, choisir, frise, carnet neuf. Aucune erreur de page.
Pas de capture à 1280 : prototype mobile seul (doute 4).

Phrase prédite du brasseur : « Là c'est vachement bien : je colle le lien, je vois l'objet, je touche oxygène et je vois qui
est devant. La veille, top. Mais les façons de faire, je les ajoute où ??? Et pour le frigo, le critère sert à rien. »

## Besoins

| Besoin | Couvert | Comment |
|---|---|---|
| B1 Partir d'une idée | oui | + volant › « Idée ou besoin », une ligne, « Ouvrir le carnet ». Statut *idée*, aucun champ obligatoire (`nouveau`, `idee`). |
| B2 Noter au fil de l'eau | oui | Un seul champ « Coller un lien, noter une idée… » : un texte devient une note datée (joué : 3 touchers). Mais le fil Notes est sous toutes les cartes (problème 12). |
| B3 Plusieurs façons | **partiel** | Pastilles retenue ✓ / écartée ✕ avec raison, bien lisibles. Mais ce sont des `span` sans geste : on ne peut ni ajouter une façon, ni la retenir ou l'écarter. Le carnet neuf (étiqueteuse) n'en a aucune et ne peut pas en avoir (problème 1). |
| B4 Critère qui oriente | **partiel** | « Ce qui tranche : minimiser l'oxygène », première puce, cartes classées dessus : excellent sur l'embouteillage. Mais la phrase ne se saisit nulle part, la ligne manque sur un carnet neuf, et un critère de type texte n'oriente rien (frigo) (problèmes 2 et 3). |
| B5 5 ou 6 produits, plusieurs lieux | oui | Cartes en deux colonnes : code pays, fournisseur, dispo en pastille, prix. Six articles de quatre pays. |
| B6 Comparer les caractéristiques | oui | Le point fort. Une puce = un tableau classé (barre, valeur, meilleur en vert, dernier en rouge, « ? » honnête), glisser d'une puce à l'autre, « Tout comparer » en matrice de rangs. « Tout » est hors écran (problème 6), une marque est fausse (problème 4). |
| B7 Dynamique et générique | oui | Propositions de l'IA par catégorie (étiquetage, évier, ventilation), ✓, ✕, « Tout garder », puce à soi (nom, sens, unité), « Retirer », puces retirées remises par ↺. Aucun gabarit d'embouteillage. |
| B8 Garder le pourquoi | **partiel** | Pour le produit et le fournisseur : bande « LE CHOIX » avec son pourquoi, frise « Pourquoi ces choix » (écartés barrés, raisons, « à revoir si », remplacée lisible), « Demander › Pourquoi ce fournisseur ? » avec sources et dates. C'est très bon. Pour la façon (« pourquoi j'ai pris un système iso super chère »), la décision n'existe que dans la fixture : aucun geste ne la crée (problème 1). |
| B9 Vue sans détails | oui | Liste : une ligne par carnet (titre, statut, choix et pourquoi, ou « où j'en suis », vignettes, œil de veille), sans caisse. Elle est enfouie à 3 touchers (problème 7), et un pourquoi y est tronqué (problème 16). |
| B10 L'IA au besoin | oui | « Demander » (4 questions et un champ libre), « Vérifier la disponibilité maintenant », « chercher » pour un « ? », « Redonner à l'IA », pourquoi pré-rempli. Tout est facultatif et marqué « exemple ». |
| B11 Un lien montre l'objet | oui | Lien collé, carte NOUVEAU en tête (dessin, nom, prix, fournisseur, pays, dispo), « ? » pour l'inconnu. Échec : carte « Lien seul » avec « Compléter » et « Redonner à l'IA ». |
| B12 Bascule de veille | oui | Bascule « Surveiller » sur chaque carte et dans la fiche. Elle dit « tous les 3 jours : en stock ici et chez d'autres, baisse de prix », puis montre une courbe, les relevés et les autres fournisseurs. L'alerte est discrète : prix barré, « −600 », ligne ambre, point sur l'œil. Défauts aux problèmes 8 à 11. |
| B13 Générique | **partiel** | Mêmes gestes sur 4 carnets et un 5ᵉ créé en direct. Mais le critère texte du frigo ne classe rien, et façons et critère ne sont jouables que sur fixture : hors embouteillage, B3 et B4 tombent. |

## Touchers (joués au script, depuis la liste des carnets)

| Tâche | Touchers | Détail |
|---|---|---|
| Noter une recherche | 3 + frappe | ouvrir le carnet, champ, envoyer |
| Ajouter une solution (coller un lien) | 4 | ouvrir, champ, Coller, envoyer ; carte NOUVEAU en ~1 s |
| Ajouter une façon de faire | impossible | aucun geste (problème 1) |
| Comparer sur le critère | 1 | ouvrir : les cartes sont déjà classées |
| Comparer une autre caractéristique | 2 | ouvrir, puce : tableau classé |
| Tout comparer (matrice) | 3 | ouvrir, puce, onglet « Tout » (la puce « Tout » de la rangée est à x ≈ 761 px, hors écran) |
| Choisir avec son pourquoi | 4 + 1 défilement | ouvrir, carte, « Choisir celui-ci », « Garder ce choix » ; pourquoi pré-rempli |
| Retrouver plus tard pourquoi | 0 / 2 / 3 | 0 : la ligne de la liste ; 2 : ouvrir, « 2 décisions » ; 3 : ouvrir, Demander, « Pourquoi ce fournisseur ? » |
| Activer la veille | 2 | ouvrir, bascule |
| Atteindre la liste depuis Bord | 3 | Brassins, Atelier, À venir |

## Notes /10

- **Besoin : 7.** B5, B6, B7, B10, B11 et B12 sont pleins. B3, B4 et B8 (façon) ne vivent que dans la fixture, et c'est le
  cœur de son récit (« plusieurs façons… je voudrais partir sur un système iso »).
- **Brasseur : 8.** Ça parle son langage : oxygène capté en ppb, cadence en bt/h, CO₂ par bouteille, l'inconnu en « ? »,
  le classement qui répond à « lequel ». Dense et utile, pas de caisse. Les ordres de grandeur sont plausibles :
  pré-évacuation ≈ 40 ppb, manuelle 220 ppb, 400 bt/h à 4 becs, prix de 190 à 21 500 CHF.
- **UX/UI : 8.** Net, moderne, cohérent en clair et en cave. Les dessins d'objet se lisent en trois secondes. Mais le carnet
  empile 6 étages avant la première carte (statut, choix, critère, façons, puces, champ).
- **Fluidité : 7.** Aucun geste ne dépasse 4 touchers et il n'y a aucun champ obligatoire. Mais le statut est tenu à la
  main, la liste est à 3 niveaux, « Tout » est caché, et la façon et le critère n'ont aucun geste.

## Problèmes (17, dont 4 bloquants)

1. **[bloquant, élément absent] Façons de faire sans geste.** Les pastilles Gravité et Isobarique sont des `span` inertes.
   Le carnet neuf « étiqueteuse » n'a aucune façon et n'a aucun moyen d'en créer. La décision « façon », n° 1 de la frise,
   n'existe que dans la fixture. Correction :
   - une pastille « + façon » au bout de la rangée des façons ;
   - toucher une façon ouvre une petite feuille : retenue, écartée ou ouverte, plus une raison en une ligne. Cela écrit une
     décision datée « façon » dans la frise ;
   - l'IA peut proposer des façons tirées des notes (« gravité, 4 becs, vu chez un collègue »), marquées « exemple ».
2. **[bloquant, élément absent] Le critère qui tranche ne s'écrit pas.** La phrase « minimiser l'oxygène » vient de la
   fixture. Sur un carnet neuf, la ligne « Ce qui tranche » n'existe pas. Seul « En faire ce qui tranche » (choisir une
   puce) existe. Correction : une ligne « Ce qui tranche : … » toujours présente, vide ou « écrire ce qui compte »,
   saisie en phrase libre. On la rattache ensuite à une puce, ou c'est l'IA qui la rattache.
3. **[bloquant, B4 et B13] Un critère texte n'oriente rien.** Frigo : « tenir 2 °C stable en été » porte sur « Plage de
   température · à lire, sans classement ». Les cartes ne sont pas classées et la puce brune ne sert à rien (limite 2 de la
   NOTE). Le carnet échoue donc hors embouteillage. Correction : quand le critère porte sur une puce texte, la classer en
   oui / non / ? contre le critère (« tient 2 °C ? » : 0 à 8 °C oui, 2 à 10 °C non), l'IA lisant la plage. À défaut,
   proposer de porter le critère sur une puce chiffrée (« température mini, °C, moins = mieux »).
4. **[bloquant, valeur fausse] La marque « moins bien partout sauf prix » est fausse.** La contre-pression manuelle est
   3ᵉ sur CO₂, devant les deux pré-évacuations (5ᵉ). On le voit dans `tout`, sur la même ligne. La marque vient de la
   fixture, pas du calcul. Correction : n'afficher que la dominance calculée. Ici, ce serait « moins bien partout sauf prix
   et CO₂ », ou plutôt rien, puisqu'elle n'est pas dominée.
5. **Le statut à 4 segments se règle à la main** (idée / recherche / compare / choisi), sur toute une rangée en tête de
   chaque carnet. Il se lit comme un parcours à étapes, ce que ky / kz ont fait refuser (« trop contraignant »), et
   « workflow le plus simple » l'exclut. Correction : un statut déduit (1ʳᵉ note → recherche, 2 articles → compare,
   « Garder ce choix » → choisi), affiché en petite pastille comme dans la liste. L'appui long permet de le forcer.
6. **« Tout comparer » est introuvable depuis le carnet.** La puce « Tout » est au bout de la rangée glissante (x ≈ 761 px
   à 390) : la comparaison complète ne se voit pas. Correction : « Tout » en 2ᵉ position, juste après la puce du critère,
   ou une icône tableau à droite de « Comparer sur ».
7. **Les carnets sont enfouis.** Il faut passer par Brassins › Atelier › À venir : 3 touchers depuis Bord, et dans
   l'onglet Brassins pour des achats de matériel. La vue sans détails n'est pas à portée. Correction : montrer
   l'emplacement en variantes (L24) : bloc « Carnets » sur Bord, onglet propre, ou entrée « Carnets » dans le + volant
   global. En attendant, le + volant porte « Carnets » partout.
8. **Deux « prochain passage » contradictoires dans la capture `veille`.** Le toast dit « prochain passage 19.11 » et le
   bloc « prochain passage 22.11 ». Correction : après le passage simulé, le toast dit ce qui a été relevé
   (« 19.11 : −320 CHF, dispo chez 1 autre ») et une seule date de prochain passage est montrée.
9. **L'alerte dans la liste ne dit pas quel article ni où.** La ligne « 👁 19.11 · −320 CHF » ne nomme pas l'article ;
   or 3 articles sont surveillés, et le stock chez un autre fournisseur est absent. Le CADRE voulait « Iso 4 becs
   pré-évac. : −600 CHF… ; en stock chez un 3ᵉ fournisseur (AT) ». Correction : « −320 CHF · Iso 4 becs semi-auto (IT) ·
   +1 dispo ailleurs », sur une ligne, en ambre.
10. **Les passages de veille encombrent le Calendrier.** Il y a 4 lignes « Veille · … » en S47, et des carnets sans date
    y sont posés dans la semaine en cours. C'est du bruit, contraire à « alerte discrète ». Correction : retirer les
    passages ; seule une alerte réelle (baisse, retour en stock) peut y paraître, et les carnets n'y vont que s'ils ont une
    échéance.
11. **La veille continue sur des écartés après le choix.** Frigo choisi le 10.10, et la « Vitrine pro 700 L · DE » est
    toujours surveillée le 16.11, alors que sa façon est écartée (« ne passe pas la porte de 80 cm »). C'est une recherche
    payante pour rien. Correction : à « Garder ce choix », une case « arrêter la veille des écartés », cochée par défaut ;
    la veille du choisi reste jusqu'à l'achat.
12. **Les notes sont sous toutes les cartes.** Sur Embouteillage, le fil Notes vient après 6 cartes (≈ 2 écrans) : ses
    recherches au fil de l'eau ne se relisent pas d'un coup d'œil. Correction : une ligne « Notes · n · dernière : … »
    sous le champ « Coller un lien, noter… » ; un toucher ouvre le fil.
13. **Le pourquoi pré-rempli ignore le critère qui tranche.** En choisissant le semi-auto (4ᵉ sur l'oxygène), « Choisir »
    pré-remplit « co₂ par bouteille le plus bas » sans signaler qu'il va contre « minimiser l'oxygène ». C'est
    exactement le retour en arrière qu'il veut éviter. Correction : une ligne ambre dans la feuille, « 4ᵉ sur ce qui
    tranche (oxygène) », et un pourquoi pré-rempli qui la mentionne.
14. **Le + volant couvre une bascule.** Dans `cartes`, il couvre « Surveiller » de la 4ᵉ carte, et la fin des cartes dans
    `repos`, `lien` et `frigo`. Correction : une marge basse sous la grille égale à la hauteur du + plus 16 px.
15. **Il y a du texte d'aide au repos** : « touche une puce », « idées et recherches », et le « ⓘ chiffre = rang » est
    répété. DEFAUTS : légende écrite au repos. Correction : retirer « touche une puce » et « idées et recherches ». La
    puce active et « classés par … » suffisent.
16. **Le pourquoi est tronqué dans la liste** (frigo : « …la vitrin… »). La ligne qui doit répondre « pourquoi » est
    coupée. Correction : n'afficher que la première clause du pourquoi (« 6 fûts, stable à 2 °C en été »), ou autoriser
    3 lignes.
17. **Petites erreurs de texte et de légende** : « L'IA propose pour « evier » » est sans accent ; la légende de la
    matrice oublie le gris (moitié basse). Correction : « évier » ; légende « meilleur · moitié haute · moitié basse ·
    dernier ».

## Doutes (non comptés)

1. Une chambre froide de 2 m³ pour seulement 6 fûts de 20 L paraît sous-évaluée. Ce n'est pas absurde avec les étagères
   et le passage, mais l'IA devrait l'expliquer.
2. Les deux « Isobarique 4 becs pré-évacuation » ont le même nom sur les cartes, et seul le fournisseur les distingue (et
   il est tronqué pour CH). Le code pays en tête du nom aiderait.
3. Les photos sont des dessins. Le dessin se lit mieux qu'une vraie photo `og:image` de catalogue : à vérifier avec de
   vraies images.
4. Aucune capture à 1280 et une partie des captures cave non ouvertes par l'auteur : en cave, je n'ai vérifié que carnet
   et veille.

## Greffes à prendre ailleurs

- La frise de décisions de l'axe C (dc) pour la décision « façon », avec son geste de création (problème 1).
- Le fil qui se range seul de l'axe A (da) pour tirer façons et critère des notes (problèmes 1 et 2).

LEÇON PROPOSÉE : un prototype se joue sur un carnet créé en direct, pas seulement sur la fixture. Ici, façons et critère
paraissaient couverts parce que la fixture les remplissait, alors qu'aucun geste ne les crée. Contrôle : pour chaque besoin,
un geste joué depuis un carnet neuf.
