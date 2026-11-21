# Règles générales des workflows (21.11)

Tirées de ses mots du 20 et du 21.11 (`work/refonte-frontend/v4/SPEC-BRASSEUR.md`, l. 2340 à la fin) et de leurs
antécédents. Elles reprennent et complètent les sept règles de `work/missions/2026-11-20-workflows/CADRAGE.md` § 3
(numéros R1 à R7 identiques), puis ajoutent R8 à R10.

Ses mots sur la méthode, qui valent pour toutes :
- « J'ai donné des grandes lignes et des exemples très précis… pas prend ces exemples à la lettre, mais bien généralisé pour chaque cas » ;
- « Re contextualise, retravaille mes messages et tout pour pas avoir d'overfitting » ;
- « on doit bien être au clair que c'est des actions, workflow et autres que on modélise mais pas le "visuel" » ;
- « c'est pas du tout que le calendrier mais l'app dans sa totalité vu que tout est lié, tout est dynamique ensemble » ;
- « des vrais gain et pas juste des gimmick » (filtre : `GAIN.md`).

Chaque règle couvre au moins deux de ses exemples (colonne « ses cas »). Un constat cite la règle, jamais l'exemple.
« Hors de ses cas » nomme ce que la règle doit trouver seule : c'est le test de généralisation.

## R1 — Une action pose toutes ses suites sûres, sans geste de plus
- **Ses mots** : « En 1 bouton on a 3 action super précise » ; « on a une vente, ça l'ajout au calendrier
  automatiquement » ; « On commence notre brassin, on a tout qui de met à jour sans rien faire » ; « tout est lié, tout
  est dynamique ensemble » ; « Tout ce qui m'economise des gestes ou autre est bon à prendre ».
- **Ses cas** : projet → calendrier à la date du jour + prix ; vente → calendrier ; brassin → stock, calendrier, coûts.
- **Règle** : quand un objet naît ou change d'état (créé, daté, chiffré, lancé, fini, payé, vendu), tout ce qui en
  découle avec certitude se pose seul : date au calendrier, mouvement de stock, écriture de caisse, lien entre objets.
  Chaque suite est dite (L9 : geste → effets → Annuler), juste, réversible ; une suite incertaine se propose, ne
  s'impose pas.
- **Hors de ses cas** : achat reçu → stock + caisse + prix moyen ; fût rempli → stock de bière + calendrier de retour ;
  mesure de densité → date de fin estimée ; recette datée → jalon au calendrier.
- **N'est pas** : une vue « toute ta chaîne » (pe2, pe5 refusés). C'est le mécanisme, pas un écran qui le liste.

## R2 — La précision de la saisie suit celle de la connaissance
- **Ses mots** : « c'est souvent plus une vague idée donc pas besoin d'avoir un date Picker ultra précis, juste,
  aujourd'hui, dans 1 mois, dans 3 mois. Ou plus... Et plus reporté à dans 6m 1 ans » ; « on peut aussi lui donner ou
  estimer directement un prix » ; « l'ajout du malt suggère ajoute une quantité qui fait sens ».
- **Ses cas** : date d'une recette de Noël, date d'un projet, prix d'un projet, quantité d'un malt.
- **Règle** : une intention se saisit en ordres de grandeur (horizons de date, fourchette de prix, quantité par
  défaut sensée) et se reporte d'un geste. Le jour, le centime ou le gramme exacts ne sont demandés que là où ils
  comptent (brassage, échéance, mesure, facture). Une estimation est marquée comme telle.
- **Hors de ses cas** : échéance d'une idée de client, budget d'un événement, date prévue d'un brassin planifié loin,
  rappel d'entretien du matériel.

## R3 — Le geste sur la représentation passe avant le formulaire
- **Ses mots** : « des actions super pratique sûr mobile comme étirer les graph avec l'échelle qui suit » ; « d'autres
  action type date Picker ultra précis vraiment pas terribles. Ou des entrée de text pas pratique » ; « Clicker pour
  ouvrir le clavier et taper c'est déjà beaucoup d'action... » ; frise B : « Fait le partout !!! » ; « l'échelle doit
  changer pour toujours voir les 2 bouts ».
- **Ses cas** : frise du temps, graphe du calendrier, barre de brassin glissée, malt et « autres ».
- **Règle** : quand une valeur se voit déjà sur un graphe, une frise, une barre ou une jauge, elle se règle là, au
  doigt, avec l'échelle qui suit (règles R1 à R14 de `work/missions/2026-11-20-frise/frise-interactive.html`). Le
  clavier et le sélecteur de date ne viennent qu'en repli.
- **Hors de ses cas** : durée de fermentation, température d'un palier, volume visé, part d'un malt, dose de sucre
  d'embouteillage, période d'un filtre.

## R4 — Chaque réglage montre tout de suite ce qu'il change, et vite
- **Ses mots** : « modifier le houblon de temps dans l'ébullition change l'ibu, ça c'est du grand art. Mais il y a
  certaines actions qui pourrait avoir un feedback utilisateur direct de ce genre » ; « je suis en négatif et on le
  voit même pas sûr le graph de prix » ; « modifier, un évènement ne l'update pas à la bonne date » ; « Il y a beaucoup
  de lenteur sur les actions ».
- **Ses cas** : temps de houblon → IBU ; solde négatif absent du graphe ; événement modifié non reflété ; lenteur.
- **Règle** : tout réglage dont la conséquence se calcule (coût, caisse, stock restant, cuve, date de fin, densité,
  IBU, couleur, ABV) l'affiche au même endroit, pendant le geste, en moins d'un dixième de seconde perçu. Un état
  qui ne reflète pas la donnée (graphe sans le négatif, date non mise à jour) est un retour faux, donc un défaut.
- **Hors de ses cas** : quantité de vente → stock restant et total ; malt ajouté → OG, couleur, coût ; prix d'achat →
  coût au litre ; date de brassin → fin estimée et cuve occupée.

## R5 — Peu à la fois, dans l'ordre de la décision ; rien deux fois
- **Ses mots** : « certains écran ont juste trop d'informations ou trop de champs ou des champs visible de base ou pas
  dans le bonne ordre » ; « Il y a vraiment beaucoup de place inutile, et l'info ont l'a déjà sur le graph » ; « Il y a
  vraiment un immense header ??? » ; « création d'une idée projet, c'est assez long et facétieux ».
- **Ses cas** : en-tête du calendrier, rangée « −683 » en double du graphe, création d'un projet.
- **Règle** : au premier plan, seulement les champs qu'on remplit presque toujours, dans l'ordre où il décide ; le
  reste est replié, rien ne se perd. Une information déjà portée par une représentation ne se répète pas en texte.
- **Hors de ses cas** : formulaire d'achat, création de client, réglages, fiche de lot, quick-sale.

## R6 — Une vue spécialisée par action fréquente ; le texte en dernier recours
- **Ses mots** : « pas très fan du texte en dur comme sur certain écran même si c'est parfois nécessaire » ; « la vue
  sur le stock type épicerie, ça c'est du grand art » ; « Les vue ultra spécialisé pour une action spécifique, avec un
  visuel super, actionnable top, ultra compréhensible, ça c'est extraordinaire ».
- **Ses cas** : épicerie du stock (modèle) ; écrans « en texte dur » (non nommés).
- **Règle** : une action fréquente a sa vue, où l'objet se reconnaît d'un coup d'œil et s'actionne là où il se voit.
  Une liste de lignes de texte n'est acceptable que pour une action rare ou une donnée sans forme.
- **Hors de ses cas** : fûts chez les clients, cuves occupées, échéances à payer, mesures d'un lot, entretien.

## R7 — Pousser l'existant avant d'ajouter
- **Ses mots** : « si comme le graph de temps certains actionneurs "haut niveau" encore pas développé ou déja présente
  dans l'app aurait bénéficie à être plus poussée et améliorer ou fine tuné ou juste développée » ; « Très bien fait le
  portage du système, du mécanisme, pas du visuel... Fait le partout !!! ».
- **Ses cas** : frise du temps, graphe d'ébullition, épicerie.
- **Règle** : un actionneur de haut niveau qui marche quelque part se porte (son mécanisme, pas son visuel) aux
  autres écrans qui ont le même besoin, avant d'inventer un nouvel élément. Un actionneur qui marche mal se finit
  avant d'être copié.

## R8 — Suggérer selon le contexte, avec la bonne quantité, sans imposer
- **Ses mots** : « en un click tout de met ( exemple je choisis une ipa) suggestions des ingrédients correspond, et
  quand je clique dessus il y a déjà la bonne quantité bon endroit » ; « Non mais les avoir en suggestions comme le
  caramunch 2 » ; « Pareil pour les suggestions, en fonction du style et tout » ; « l'ajout du malt suggère ajoute une
  quantité qui fait sens » ; v08 : « C'est encore pire ??? ».
- **Ses cas** : ingrédients selon le style, Caramunich II, Pomona pour une IPA.
- **Règle** : là où le contexte (style, stock, historique, client, saison) rend un choix probable, l'app le propose,
  posé d'un toucher avec quantité, moment et place justes. Il reste une proposition : rien ne se remplit seul sans
  son geste.
- **Hors de ses cas** : client habituel et sa quantité à la vente ; fournisseur et prix du dernier achat ; recette
  rebrassée ; date du prochain brassin selon la cuve libre ; produit de nettoyage selon l'étape.

## R9 — L'écran tient en place
- **Ses mots** : « il faudrait des tailles fix car SI non ça fait bouger le calendrier » ; « Avec le point qui bouge
  toujours pas super fan... Ça fait bouger tout le calendrier » ; « Et il y a un point ?? Qui pose problème qui prend le
  dessus » ; « le bouton › couvre la fin ».
- **Ses cas** : panneau de semaine à hauteur variable, repère par-dessus la frise, bouton sur la plage.
- **Règle** : un geste ou une sélection ne déplace pas le reste de l'écran ; les zones qui changent de contenu ont une
  taille fixe ; rien ne se pose par-dessus ce qu'on est en train de régler.
- **Hors de ses cas** : listes qui sautent à l'ouverture d'une ligne, barre d'actions qui couvre la dernière ligne,
  clavier qui cache le champ.

## R10 — Un vrai gain, pas un gimmick
- **Ses mots** : « des vrais gain et pas juste des gimmick » ; « Tout ce qui m'economise des gestes ou autre est bon à
  prendre au c'est pas au détriment de la qualité » ; « je veux pas avoir le problème que on implement le visuel
  plutôt que le workflow ».
- **Règle** : une proposition n'est candidate que si elle passe `GAIN.md` : règle citée, chaîne jouée, fréquence au
  moins mensuelle, et au moins 30 % de gestes en moins, une ressaisie supprimée ou une erreur rendue impossible.
  Le reste va en annexe « gimmicks écartés ».

## Ce que ces règles ne ramènent pas
- Ses refus : pa3, pe2, pe5 (vue « toute ta chaîne »), pb4.
- Le gel du 20.11 : rien n'est codé avant le passage de l'écran, dans l'ordre Calendrier, Carnet, Recette, Brassins,
  Stocks, Finances. Ces règles servent à analyser et proposer.
- Sa maquette d'écran choisie reste la base (règle n° 1) : le workflow s'y greffe, il n'en change pas le dessin.
