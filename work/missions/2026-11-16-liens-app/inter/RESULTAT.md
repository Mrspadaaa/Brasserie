OK — L9 en 3 versions (3 gestes et la table) et L4 en 2 versions, 60 captures

## Fichiers (tout dans inter/)
- Sources : `src/commun.css`, `src/commun.js`, `src/l9.js`, `src/l4a.js`, `src/l4b.js`, `sprite.svg.txt` (pictos du proto des liens).
- Pages : `l9-a/`, `l9-b/`, `l9-c/`, `l4-a/`, `l4-b/` (`index.html?s=<état>&theme=cave`), produites par `node build.mjs`.
- Captures : `node cap.mjs`, au format 390 × 844, DPR 2, en clair et en cave → `cap/<v>-<état>[-cave].png` et `cap/planche-<v>[-cave].png`.

## Sortie décisive
`cap.mjs` donne `CAP OK 60` ; détail dans `cap/mesures.txt`.
- Aucun texte sous 14 px, aucun texte coupé, aucun débordement.
- Le + est à 14 px au-dessus des onglets et à 12 px du bord droit (base Stocks « C »). Dans l4-a, c'est le + de g-d1, inchangé.
- Aucune erreur de page. Ni « entretien » ni « Toucher pour poser » n'apparaissent.

J'ai ouvert les planches : l9-a, l9-b (en clair et en cave), l9-c, l4-a (en clair et en cave) et l4-b.

## Versions
Pour L9, les mêmes chiffres servent partout. Ce sont des exemples ; leur chaîne commence le 16.11 :
- soude : 1,20 → 1,15 → 1,05 → 0,85 L. Sous le seuil de 1 L, elle part aux Courses et la pastille Stocks passe à 1 ;
- Star San : 950 → 945 → 930 → 920 ml ;
- Pilsner : 42 → 30 kg ; Saaz : 400 → 250 g ; eau : 40 L par cuve.

Le bandeau pe1 (lignes avant → après, avec Annuler et OK) et la trace pe3 suivent ses choix, dans toutes les versions. Le bandeau dit aussi la quantité décomptée (−0,05 L).
- **l9-a, sur l'article** : la liste des articles porte la trace « −0,20 L · Cuve 1 nettoyée ↺ ». La fiche Soude montre ce que « Chaque geste en use » (un réglage − / + par geste), puis les derniers mouvements, chacun avec ↺.
- **l9-b, au geste, une fois** : le bandeau ajoute « Régler ». À la cuve, l'eau n'a pas encore de dose : la question pe4 apparaît dans le bandeau. La feuille « Laver un fût, à chaque fois » règle les doses au curseur et propose les articles de nettoyage. L'appui long sur « Lavé » ouvre la même feuille.
- **l9-c, une page pour tous les gestes** : une entrée en tête de Stocks › Articles mène à « Ce que chaque geste use ». La page couvre 5 gestes et leurs doses en pastilles ; « Star San · à donner » (embouteiller) attend sa première dose.
- **l4-a, sur la frise** : la base est g-d1, reprise telle quelle et injectée sans toucher au fichier.
  - Avant : g-d1 sans le Porter d'hiver ; en-tête 289 CHF, S51 5 240, S52 5 726.
  - Geste : appui long sur S51 dans la rangée Brassins.
  - Après : exactement g-d1, avec 113 CHF et le panier relié en pointillé, plus le toast « Porter d'hiver · 14.12 / 2 à commander avant 7.12 · Annuler ».
  - Jalon : toucher le panier ouvre une bulle (Munich 4 kg, Fuggles 200 g, Brewshop, 7 j de délai, Courses ›).
- **l4-b, dans la fiche** : sur la fiche Porter d'hiver, on touche la semaine S51 (14.12, Cuve 1 libre).
  - Le premier jalon naît : « Commander · avant 7.12 », en pointillé. Les jalons suivants sont provisoires (14.12, 21.12, 28.12, 11.1).
  - Stocks reprend la base « C » : 3 à commander avant S50 · Porter d'hiver, et la soude venue de L9.

## Écarts, signalés
- Les manques du Porter viennent de g-d1 (aria du panier : Munich 4 kg, Fuggles 200 g). Ils remplacent les quatre articles de la base « C » (Citra…), dont l'échéance passe de S49 à S50. La pastille de g-d1 passe de 24 à 1 puis 3 (règle « C »).
- Dans l4-a, le toast de g-d1 descend à 62 px et se rétrécit (right 98) pour ne chevaucher ni −312 ni le +.
- Les cases de pose refusées (R2) restent invisibles dans g-d1 ; leur aria-label est retiré.
- Un bandeau ouvert recouvre la page. Dans brassin-apres et cuve-apres, le haut d'une ligne dépasse au-dessus (« Malt Pilsner », sous-titre du Brasseur) : c'est une superposition, pas une coupe. Le + reste à sa place, sous le bandeau, qui se pose au-dessus de lui.
- Le doigt est posé en bas à droite de la cible pour laisser le libellé lisible. Dans l4-a, c'est un cercle d'appui long.

## Prédiction
« L9 b, c'est ce que je veux : je règle là où je le fais, une fois. L4 a, je le vois sur mon calendrier sans rien taper. »

DÉCISION À PRENDRE : où vit la table de L9 (a : sur l'article, b : au geste, c : une page). C'est son choix, à montrer côte à côte sur la page.
CONNAISSANCE : g-d1 porte déjà le jalon L4 (panier relié au Porter, aria « avant 7 déc. ») ; la version a ne fait que le faire naître.
LEÇON PROPOSÉE : aucune
