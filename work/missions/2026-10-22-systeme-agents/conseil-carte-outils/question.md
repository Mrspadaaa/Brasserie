# Question cadrée — la carte des outils houblons

**Décision** : quelle carte des outils houblons proposer au brasseur, en fil de fer et avant tout
nouveau lot, pour mettre fin à la confusion du lot 21 ? Et dans quel ordre construire les outils ?

**Type de décision** : brasseur. Le conseil prépare la proposition à montrer, puis le brasseur choisit.

## Contexte
- L'Affinée est une app de micro-brasserie suisse (React/TS, hors ligne avec Dexie), utilisée au
  téléphone. L'outil houblons est en refonte sous forme de maquettes HTML statiques, par lots de
  variantes. Aucun code de l'app n'est écrit avant la « porte B », l'essai du brasseur.
- Le lot 21 (20.10) comptait 41 variantes v0, puis 5 améliorées (y1b, s3b, x3b, v1b, w3b) et 3
  relances. Retour du brasseur, mot pour mot :
  - « y1b est de mon point de vue semble meilleur. » (y1b : le brassin au doigt, la frise du brassin
    en dock sous le pouce, le moment glissé)
  - « Parcontre problème gloabal, pas de comparaison de houbon 1:1 donc ça nous aide pas à choisir si
    cascade, idaoh7, galaxy est mieux dans ntore cas. Manque aussi la partie chimie. »
  - « pas de radar grpah ? »
  - « aussi problème global, on a plusieur confusion entre timing, comparaison, houbons side by side,
    on aurais suggestions, comparer, substituer, dryhopper ect ect.. il faudrait voir ce que l'on
    peut faire. »
  - « regarde aussi ce que ça va coûter en compute, à quell point en backend une variante est plus
    problèmatique. on peut aussi se dire que on force la comparaison dry hopping biotransfo seulement
    si c'est trop lourd. »
  - y3 : « la panel osu j'aime assez » (« la molette prends trop de place ») ; w2 : « pas trop mal dans
    la manière de comparé » ; v1 : « une meilleur vu de comparaison sur des vrai valeur mais de manière
    un peu trop ostère » ; x3b : « interessant mais dur à lire », à utiliser pour « ma bière de base ->
    1 dry hop, 2 dry hop: levure » ; a2b : « peut être pas en main. voir ce que la levure change reset
    vraiment interessant » ; d1, tout ouvert : « trop bordélique ».
- Le cas qui sert de témoin : une stout à 16 °P, et le choix entre Cascade, Idaho 7 et Galaxy.
- Carte candidate du registre, à challenger :
  - Suggestions (s5, avec un « + » vers Comparer) ;
  - Comparer 1:1 (2 ou 3 houblons ; v1 + w2 + panel OSU + radar + chimie) ;
  - Substituer (u4) ;
  - Le moment, le « quand » (y1b) ;
  - Évolution de ma bière (x3b réduit) ;
  - Levure et biotransformation (a2b).
- Acquis validés à garder : code couleur des arômes ; moment glissé par 5′ ; barres de type l5b ;
  disposition l8 ; radars m4 et h4 sans légende ; Comparer variante 3 ; fiche g1 et fiche courte de type
  Citra cryo ; Suggestions s5 et « + » vers Comparer ; y1b ; panel OSU ; manière de w2 ; vraies valeurs
  de v1.
- Contraintes :
  - téléphone, usage au doigt ;
  - 70 à 80 mots au premier écran, peu de texte, pas de légende au premier plan ;
  - lecture « au style », avec l'absolu en option ;
  - honnêteté : simulé marqué, inconnu ≠ 0 ;
  - penser en brasseur : α, rôle, arômes, moment, avant l'IBU ;
  - rien de figé : moments par 5′, ébullition jusqu'à 120′.

## Options à départager
Elles ne sont pas exclusives, et une autre voie est permise.
- **A. Six outils séparés**, chacun nommé par sa question, reliés par des ponts. Exemple :
  Suggestions → Comparer par « + ».
- **B. Trois outils par moment de décision** :
  - Choisir : suggérer, comparer, substituer ;
  - Placer : moment, dry hop, évolution de ma bière ;
  - Fermenter : levure, biotransformation.
- **C. Ma bière au centre** : un seul écran de recette. Chaque question s'ouvre depuis l'élément
  concerné (houblon, ajout, levure), en panneau.

## Attendu
- La carte recommandée : les outils, la question de chacun dans son titre, et les ponts.
- L'ordre de construction : ce qui va au lot 22.
- Ce que le brasseur doit trancher.
- Le premier geste.

## Enjeu
Le lot 22 se construit sur cette carte. Une mauvaise carte coûte un lot entier (environ 40
variantes, plusieurs millions de jetons) et la confiance du brasseur (leçon L10 : « Poser
l'architecture avant de multiplier les variantes »).

## Sources
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`
- `work/refonte-frontend/registre.md` (lignes 137 à 188 : retour du lot 21)
- `cerveau/produit/outils-houblons.md`, `cerveau/produit/acquis-valides.md`, `cerveau/LECONS.md`
- `docs/besoins/banque-de-questions.md`, `docs/besoins/parcours-cles.md`, `docs/specs/houblons.md`
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
- Captures à 390 px dans `work/refonte-frontend/v4/ecran-1/fils21-choisir/captures/` : `y1b-390.png`,
  `w2-390.png`, `v1b-ensemble-390.png`, `x3b-390.png`, `y3-390.png`
