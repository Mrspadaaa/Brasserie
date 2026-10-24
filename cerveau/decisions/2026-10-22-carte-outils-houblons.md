---
name: 2026-10-22-carte-outils-houblons
description: Conseil sur la carte des outils houblons après le lot 21. Verdict : un seul facteur libre par écran, quatre outils ouverts depuis Ma bière, Comparer seul au lot 22, quatre choix au brasseur
type: decisions
maj: 2026-10-22
sources: work/missions/2026-10-22-systeme-agents/conseil-carte-outils/ ; SPEC-BRASSEUR.md ; registre.md ; captures fils21-choisir
---

## Question cadrée

**Décision** : quelle carte des outils houblons proposer au brasseur, en fil de fer et avant tout
nouveau lot, pour mettre fin à la confusion du lot 21 ? Et dans quel ordre construire les outils ?

#### Contexte
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

#### Options à départager
Elles ne sont pas exclusives, et une autre voie est permise.
- **A. Six outils séparés**, chacun nommé par sa question, reliés par des ponts. Exemple :
  Suggestions → Comparer par « + ».
- **B. Trois outils par moment de décision** :
  - Choisir : suggérer, comparer, substituer ;
  - Placer : moment, dry hop, évolution de ma bière ;
  - Fermenter : levure, biotransformation.
- **C. Ma bière au centre** : un seul écran de recette. Chaque question s'ouvre depuis l'élément
  concerné (houblon, ajout, levure), en panneau.

#### Attendu
- La carte recommandée : les outils, la question de chacun dans son titre, et les ponts.
- L'ordre de construction : ce qui va au lot 22.
- Ce que le brasseur doit trancher.
- Le premier geste.

#### Enjeu
Le lot 22 se construit sur cette carte. Une mauvaise carte coûte un lot entier (environ 40
variantes, plusieurs millions de jetons) et la confiance du brasseur (leçon L10 : « Poser
l'architecture avant de multiplier les variantes »).

#### Sources
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`
- `work/refonte-frontend/registre.md` (lignes 137 à 188 : retour du lot 21)
- `cerveau/produit/outils-houblons.md`, `cerveau/produit/acquis-valides.md`, `cerveau/LECONS.md`
- `docs/besoins/banque-de-questions.md`, `docs/besoins/parcours-cles.md`, `docs/specs/houblons.md`
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
- Captures à 390 px dans `work/refonte-frontend/v4/ecran-1/fils21-choisir/captures/` : `y1b-390.png`,
  `w2-390.png`, `v1b-ensemble-390.png`, `x3b-390.png`, `y3-390.png`

## Type de décision

Brasseur : le conseil prépare la carte à montrer en fil de fer, le brasseur choisit. Conseil complet (six regards, trois revues anonymes, président Opus), 22.10.2026.

## Regards

### Brasseur (opus)

Le brasseur a déjà donné sa carte, dans sa plainte même : « on aurais suggestions, comparer, substituer, dryhopper » (`work/refonte-frontend/v4/SPEC-BRASSEUR.md`, retour du lot 21). Il nomme quatre verbes : ni six outils, ni trois catégories. Il range aussi la levure dans la même suite que le dry hop : x3b pour « ma bière de base -> 1 dry hop, 2 dry hop: levure ». Dans `cerveau/produit/outils-houblons.md`, le Moment, l'Évolution et la Levure ne font donc qu'un seul outil, « Dryhopper » (« Quand ? »). Il se bâtit sur y1b, avec x3b réduit replié dedans.

Les captures montrent la confusion (L10). y1b s'intitule « Quand ? » mais compare Idaho 7 et Citra (« Face à ta stout »). y3 s'intitule « Quelle dose ? » mais porte un sélecteur Cascade/Citra/Galaxy/Idaho 7 et « Même famille, pas la même force ». w2 mêle comparaison, hop creep et biotransfo. Chaque écran répond à deux questions.

**Accueil : l'option C, mais seulement comme accueil.** Il le dit : « Comme pour les Malts […] dès le premier coup d'œil, quel matière première j'ai […] Ensuite seulement je peux ouvrir mon panel de comparatif ». L'étape Houblons (disposition l8) couvre les 80 % des cas. C'est là que l'amérisant se choisit sur son α (L04). Les quatre outils s'ouvrent depuis cette étape, en plein écran : trois houblons côte à côte ne tiennent pas dans un panneau de 390 px.

**Ponts :**
- Suggestions → « + » → Comparer (D78) ;
- un houblon de la recette → Substituer, qui ouvre Comparer avec le houblon manquant épinglé ;
- un ajout de la recette → glissé dans y1b.

**Lot 22 : Comparer seul**, sur la stout à 16 °P, avec Cascade, Idaho 7 et Galaxy. α et rôle en tête, car Galaxy à 17,2 % change l'amertume. Puis le radar variante 3, la chimie rattachée aux familles, les vraies valeurs de v1, la manière de w2 et la courbe OSU. C'est son premier « problème global ». Dryhopper et la levure viennent en dernier : « pas pour tout de suite » (18.10), et il accepte le repli si le calcul est trop lourd.

**À trancher par le brasseur :**
- les noms : ses verbes ou les questions ;
- Substituer comme entrée propre, ou Comparer avec un houblon épinglé ;
- la levure dans Dryhopper.

**Premier geste :** une seule page en fil de fer qui trace le cas de la stout, de l'étape Houblons jusqu'à y1b, en passant par les ponts.

Position : autre voie : ses quatre verbes, Ma bière en accueil, Comparer au lot 22.

LEÇON PROPOSÉE : Lire une plainte du brasseur aussi comme une proposition. « on aurais suggestions, comparer, substituer, dryhopper » contenait déjà la carte, et la carte candidate l'a dépassée avec six outils.

### Contradicteur (sonnet)

**Défaut fatal : les trois options découpent par nombre d'outils, alors que la confusion vient du contenu de chaque écran.**

Dans les captures, des titres en question portent déjà plusieurs outils :
- « Quand ? » (`y1b-390.png`) contient un « second houblon », une dose et une levure.
- « Quelle dose ? » (`y3-390.png`) contient quatre houblons et un comparatif 4MMP/linalol.
- `w2-390.png` mêle suggestion, comparaison et dose.

Le titre ne suffit donc pas (L10).

- **A (six outils) :** Substituer est un Comparer qui part d'un houblon (Q06 et Q18, `banque-de-questions.md`). La levure est une puce dans y1b, w2, x3b et y3. x3b est le « quand » sur plusieurs jours. Six noms pour trois questions, soit « suggestions, comparer, substituer, dryhopper » reconstitués.
- **B :** « Choisir » regroupe exactement les trois mots dont il se plaint. Cette option rebaptise la confusion.
- **C :** le cadre est juste (D13, « Ensuite seulement je peux ouvrir mon panel de comparatif »). Des panneaux sans nom retombent dans d1, « trop bordélique ».

**Ce que toutes les options omettent (L06) :**
- Le Comparer 1:1 est déjà validé : « variante 3 », p06 avec le radar p02 et son intervalle de confiance (D57 à D59, D77).
- Le brasseur exige « pas moins bien » que Beer Maverick (D51).
- Le lot 21 l'a perdu. Il faut le réintégrer, pas relancer 40 variantes.
- Il doit comparer face à la stout (« résineux déjà hors style », y1b), pas dans l'abstrait.
- Le contrôle de L10 est encore « à écrire ». Sans lui, une carte dérive comme la précédente.

**Position : autre voie.** Prendre C comme cadre, avec trois outils à une question chacun :
- Suggérer (« + » vers Comparer).
- Comparer.
- Quand.

Substituer devient une entrée de Comparer. La levure et x3b deviennent des réglages du Quand. Écrire avant le lot 22 un contrôle « un écran = une question » qui liste les éléments admis par outil.

Revient au brasseur : faire disparaître Substituer comme outil, alors qu'il a choisi u4 (19.10).

LEÇON PROPOSÉE : amender L10. Un titre en question ne garantit pas une question par écran. Le « Faire » doit exiger la liste des éléments admis par outil, contrôlée au rendu.

### Audacieux (sonnet)

**Audacieux.** Les trois options dessinent un organigramme alors que le brasseur veut un geste. Les captures montrent que la confusion est aussi *dans* chaque écran. Dans `y1b-390.png`, le titre « Quand ? » couvre aussi dose, levure, douze barres, IBU et « Défi ». Dans `w2-390.png`, « Trois plans » mêle suggestions, curseurs et détail. Une carte de six outils ne règle pas cela (L10).

Idée plus grande : une seule grammaire, « ce que ça change », avec les mêmes barres l5b, le même radar m4/h4 et le même dock de y1b partout. Trois portes, nommées par leur question :

1. **« Lequel ? »** : un canevas de 2 à 3 colonnes.
   - Suggestions le préremplit. Sage/Franc/Osé de w2 est déjà une comparaison à trois.
   - Substituer verrouille la colonne 1 sur le houblon absent, à IBU égal (u4).
   - Le « + » (D78) ajoute une colonne.
   - Contenu : barres, radar avec intervalles, chimie, vraies valeurs de v1 sous un toucher.
   - Comparer n'est pas un outil parmi six, c'est le moteur des autres.
2. **« Quand ? »** : y1b, nettoyé. La levure y entre par le dock (« actif » et « après » y sont déjà) et par les puces US-05/Verdant de x3b.
3. **« Et si ? »** : x3b réduit, « ma bière → +1 → +2 dry hops → levure », lu comme un écart.

**Ponts**
- Le gagnant de « Lequel ? » s'ouvre dans « Quand ? ».
- Toute puce de houblon dans Ma bière ouvre « Lequel ? » avec ce houblon en colonne 1.

**Lot 22** : « Lequel ? » seul, sur la stout 16 °P (Cascade, Idaho 7, Galaxy), environ 12 variantes en fil de fer, pas 40. Il répond à ses trois plaintes globales : « pas de comparaison de houbon 1:1 », « Manque aussi la partie chimie », « pas de radar grpah ? ». Le coût de calcul reste à mesurer par le Bâtisseur. Son repli (« seulement si c'est trop lourd ») ne vise que « Et si ? ».

**Au brasseur de trancher**
- A, B ou C.
- Faut-il « Et si ? » maintenant ? Le 18.10 il disait « pas pour tout de suite », et le 20.10 a2b était « vraiment interessant ».
- Non négociables : simulé marqué, inconnu ≠ 0.

**Premier geste** : une planche grise des trois cartes, sur la même stout.

Position : autre voie : trois portes (« Lequel ? », « Quand ? », « Et si ? ») sur un seul canevas de comparaison ; lot 22 = « Lequel ? » seul.

LEÇON PROPOSÉE : à ajouter à L10. Un titre-question ne suffit pas : avant de dessiner une carte, lister les questions que chaque écran traite réellement (y1b en mêle quatre) et n'en garder qu'une par écran. Contrôle à écrire.

### Premiers principes (opus)

La question posée (A, B ou C, combien d'outils) n'est pas la bonne. Le défaut du lot 21 tient au nombre de variables libres par écran. Les captures le montrent :
- y3 s'intitule « Quelle dose ? » mais propose Cascade, Citra, Galaxy, Idaho 7, quatre levures et la biotransfo (`fils21-choisir/captures/y3-390.png`) ;
- y1b, « Quand ? », porte « + second houblon » et US-05/Pomona (`y1b-390.png`) ;
- w2 fait varier dose, jours, moment et levure (`w2-390.png`).

Six outils faits ainsi ramèneront « plusieur confusion entre timing, comparaison, houbons side by side ».

Physiquement, le résultat dépend de cinq facteurs : la variété, la dose, le moment (extraction), la levure (biotransformation) et la base (masquage). Règle : un outil fait varier un seul facteur. Les autres sont fixés et affichés sur une ligne de contexte : « 16D · 4 g/L · après 3 j · US-05 ».

D'où trois outils, pas six :
1. **Quel houblon ?** (on fait varier la variété). Suggestions (classées vers ma visée), Substituer (classées vers X) et le choix manuel ne sont que trois sources de candidats. Toutes mènent au même comparateur 1:1, qui sépare la chimie des fiches de l'effet dans ma bière (`ecran-1/MODELE.md` : « un houblon se compare sur ses fiches » ; « une suggestion se juge sur l'effet dans ma bière »).
2. **Quand et combien ?** (moment et dose) : y1b épuré, et x3b réduit pour « ma bière de base -> 1 dry hop, 2 dry hop ».
3. **Quelle levure ?** : a2b.

On y entre depuis Ma bière (C), comme il le demande : « Ensuite seulement je peux ouvrir mon panel de comparatif » (SPEC-BRASSEUR §1).

Le coût de calcul suit la même règle. Un seul facteur, c'est un balayage court : 3 houblons, ou une vingtaine de pas de 5′. C'est l'ouverture simultanée de tout, comme d1 (« trop bordélique »), qui fait exploser le calcul.

Lot 22 : le comparateur 1:1 sur le cas témoin, stout 16D avec Cascade, Idaho 7 et Galaxy. Il sert trois entrées et répond au problème n° 1 du registre (leçon L10).

Le brasseur doit trancher, car c'est son choix : comparer à dose égale, ou à effet égal ? y3 dit qu'il faut « ~10,7 g/L de Cascade » pour égaler les agrumes de Citra à 4 g/L.

Position : autre voie : les trois outils de B, chacun défini par le seul facteur qui varie, ouverts depuis Ma bière (C), avec Suggestions, Substituer et le choix manuel qui mènent au même comparateur 1:1.

LEÇON PROPOSÉE : définir chaque écran par le seul facteur qui y varie, et afficher les autres fixés en contexte. Erreur : lot 21, y3 « Quelle dose ? » et y1b « Quand ? » laissaient libres houblon, levure et moment. Contrôle à écrire : un seul groupe de sélecteurs libres par écran.

### Bâtisseur (sonnet)

**Bâtisseur**

**Compute : pas un frein, abandonner le repli.** Le moteur est pur : `prototypes/houblons-v4/src/engine/index.ts` annonce « pure, typée, sans réseau ni stockage ». Il n'y a pas de backend à craindre. Le « 1,8 Mo » est un fichier de maquette. Dans `donnees/profils-simules.json`, 41 cas pèsent environ 980 ko et la grille d'environ 520 ko ne couvre que 6 houblons. L'app calculera à la demande. Les données utiles du moteur font environ 0,5 Mo (`pack-fiches.json` 350 ko, `composes-houblon.json` 80 ko). `simulerCas` a un mode léger (`complet:false`) pour les listes et un mode complet (11 jours plus mesures) pour la comparaison ouverte. Le repli « dry hop seulement si trop lourd » ne se justifie pas. Je n'ai pas chronométré : c'est le premier geste.

**Carte : B comme navigation, trois écrans à construire.** Chaque question garde son entrée titrée (L10), mais `simulerCas` sert toutes les questions, seul l'axe qui varie change.
- **Suggérer** : liste classée, le « + » envoie vers Comparer (s5).
- **Comparer** : « Cascade, Idaho 7 ou Galaxy dans ma stout ? » Une brique A contre B contre C, avec radar, chimie et vraies valeurs de v1b, la manière de w2 et le panel OSU de y3. Substituer en est la même brique, préchargée avec le houblon manquant. Levure en est un interrupteur (« voir ce que la levure change », a2b).
- **Quand** : y1b. L'évolution de ma bière devient sa frise (+1, +2 dry hops).

Option C, un seul écran de recette, est le but de l'app. Elle est trop chère à explorer en fil de fer maintenant.

**Lot 22 : Comparer seul, environ 12 variantes.** C'est la première plainte du brasseur : « ça nous aide pas à choisir si cascade, idaoh7, galaxy est mieux ». Il ne faut pas relancer 40 variantes (L18 : 130 à 350 k jetons par auteur).

**Au brasseur de trancher :** Levure et Évolution restent-elles des portes à part ou des raccourcis ?

**Premier geste :** écrire les contrôles « à écrire » de L06 (radar, panel OSU, vraies valeurs présents) et de L10 (une question dans le titre). Puis chronométrer `simulerCas` léger sur tout le catalogue, dans un script qui n'écrit aucun fichier.

Position : autre voie : B en navigation (six entrées titrées), trois écrans réels, lot 22 = Comparer seul, sans repli de calcul.

LEÇON PROPOSÉE : Ne pas chiffrer le coût de calcul d'une app avec le poids des fichiers de maquette. Mesurer d'abord le moteur, puis décider d'un repli (registre 20.10 : « grille 1,8 Mo » lue comme un coût).

### Regard neuf (haiku)

**Ce que je comprends, écran par écran :**

- **y1b « Quand ? »** : un houblon placé dans le temps, barres d'arômes, frise de moments. Le titre est une question, c'est le plus lisible.
- **w2 « Trois plans »** : trois cartes Sage, Franc, Osé, puis un détail dose / jours / moment / levure. Je ne sais pas ce qu'est un « plan », ni ce que disent S, F, O.
- **v1b « ensemble »** : deux houblons en plages, bandes pleines ou hachurées. « Pareil », « non départagés » et « ×10 ×100 » restent obscurs.
- **x3b « Ma cuve »** : frise de fermentation sur un axe 0, 6, 12, curseur « tenir ». Clair au regard, dense à lire.

**Ce qui me perd :** aucun écran ne dit quelle question il répond. Un titre est une question, un autre un nom, un autre un lieu. Mots obscurs : cran, 16D, α, hop creep, biotransfo, cryo, IBU, seuil.

**Ce que je ferais :** la carte B, trois outils nommés par moment de décision, dans l'ordre de la recette : Choisir, Placer, Fermenter. Chaque titre pose sa question. Faiblesse : x3b mêle cuve et levure, il faut un pont visible entre Placer et Fermenter. Je rejette A (six vocabulaires, six titres : la confusion reste) et C (un écran dense, alors que le premier écran est limité à 70 à 80 mots selon la question cadrée).

**Limite :** je n'ai vu que quatre captures. Je juge la lisibilité, pas la carte complète : Suggestions, Substituer et Levure ne sont pas ouverts.

Position : autre voie : B, avec un titre-question par outil et le pont « + » de Suggestions vers Comparer.
LEÇON PROPOSÉE : juger une carte d'outils sur les écrans des variantes ne suffit pas ; ouvrir aussi ceux des outils qu'elle nomme.

## Revues

Trois relecteurs Sonnet, sur les réponses anonymes (ordre tiré au hasard).

### Revue 1
1. **F est la plus solide.** Elle remet en cause la question posée. La confusion vient des variables libres dans chaque écran, pas du nombre d'outils. J'ai vérifié sur `y1b-390.png`: l'écran « Quand ? » porte un second houblon, la dose, la levure et un comparatif Idaho 7 / Citra. F en tire une règle testable: un facteur qui varie par outil, les autres affichés en contexte. Elle relie cette règle au coût de calcul. Elle repère aussi une vraie décision pour le brasseur: comparer à dose égale ou à effet égal. C et D sont proches. D relit « suggestions, comparer, substituer, dryhopper » comme une proposition du brasseur.

2. **L'angle mort le plus grave est dans B.** B déclare le calcul réglé parce que le moteur est pur. C'est exact: l'en-tête de `engine/index.ts` dit « sans réseau ni stockage ». Mais B n'a rien chronométré. Elle ignore le coût sur le téléphone et le poids hors ligne. Elle abandonne le repli que le brasseur accepte. Elle garde enfin la carte B alors que la confusion est dans les écrans. Elle écarte C en le jugeant trop cher, alors que le brasseur veut partir de Ma bière.

3. **Toutes ont manqué un prérequis.** Le registre (problème 5) dit que Nelson Sauvin paraît ordinaire parce que ses mots tombent hors des 12 familles. Un comparateur Cascade / Idaho 7 / Galaxy trompera de la même façon tant que le rattachement des descripteurs n'est pas corrigé.

LEÇON PROPOSÉE : amender L10. Un titre en question ne garantit pas une question par écran. Il faut lister les éléments admis par outil, avec un contrôle sur le rendu (un seul groupe de sélecteurs libres par écran).

### Revue 3
1. **F est la plus solide.**
   - Elle donne une règle qui se teste : un seul facteur libre par écran, les autres affichés sur une ligne de contexte (« 16D · 4 g/L · après 3 j · US-05 »). Cela tient dans 70 à 80 mots au téléphone.
   - Elle part de Ma bière, comme le brasseur le demande : « Ensuite seulement je peux ouvrir mon panel de comparatif ».
   - Elle pose la vraie question qui revient au brasseur : comparer à dose égale ou à effet égal (y3, « ~10,7 g/L de Cascade »).
   - D vient juste derrière. Elle lit sa plainte comme une carte (« suggestions, comparer, substituer, dryhopper »).

2. **Le plus gros angle mort est dans B.**
   - Elle recommande d'abandonner le repli de calcul tout en reconnaissant « je n'ai pas chronométré ». Le brasseur a demandé ce repli (« seulement si c'est trop lourd »).
   - Elle compte sur le poids des fichiers, pas sur un téléphone hors ligne (Dexie).
   - Sa brique Comparer absorbe radar, chimie, vraies valeurs, panel OSU, Substituer et levure. C'est le « tout ouvert » de d1, « trop bordélique ».
   - E, qui a choisi la carte B de la question (Choisir, Placer, Fermenter), rebaptise la confusion.

3. **Toutes ont manqué le premier écran de chaque outil à 390 px.** Aucune ne l'a décrit ni compté en taps sur le cas stout 16 °P (Cascade, Idaho 7, Galaxy).
   - Aucune ne fixe non plus pour le lot 22 un critère mesurable : « pas moins bien » que Beer Maverick (D51), radar p02 avec intervalle.
   - D s'appuie sur « pas pour tout de suite » (18.10), qui date d'avant ses demandes des 19 et 20.10 sur la levure et a2b.

LEÇON PROPOSÉE : le conseil a cadré la question par nombre d'outils (A, B ou C), alors que quatre réponses sur six situent la cause dans le contenu de chaque écran. Cadrer d'abord sur la cause observée dans les captures, puis proposer les options.

### Revue 2
1. **Plus solide : C.** Elle s'appuie sur les captures et sur des citations que j'ai vérifiées. Le Comparer 1:1 est déjà validé (« variante 3 », p06 avec le radar de p02, registre #138), et Beer Maverick en est le plancher (D51). Le lot 21 l'a perdu, donc il faut le réintégrer, pas relancer 40 variantes. C signale aussi que retirer Substituer (u4) revient au brasseur. F est proche (un seul facteur par écran), mais « Quand et combien » en fait varier deux.

2. **Plus gros angle mort : B.** Elle écarte le repli que le brasseur a accepté (« abandonner le repli ») sans avoir chronométré, ce qu'elle admet elle-même. Le moteur est bien pur (en-tête de `index.ts`) et les fichiers de 350 ko et 80 ko sont exacts. Mais « pas de backend » ne tient pas lieu de mesure. Elle garde aussi six entrées nommées, ce qui n'efface pas la confusion que C relève. D s'appuie sur « pas pour tout de suite » du 18.10, qui portait sur le lot 5. Le retour du 20.10 le dépasse (a2b « vraiment interessant »).

3. **Manqué par toutes :**
   - Elles choisissent Comparer pour le lot 22 sans signaler que les données le faussent (registre point 5 : Nelson Sauvin « ordinaire », Motueka « ultra fruité »). Il faudrait corriger les fiches avant ce lot.
   - Aucune ne réutilise le mot du brasseur sur les « quatre objets » (profil actuel, style cible, comparaison manuelle, suggestions, 18.10). Il structure pourtant la carte.

LEÇON PROPOSÉE : amender L10. Un titre en question ne garantit pas une question par écran (A, C, F). Il faut un contrôle au rendu qui liste les éléments admis par outil. Un repli accepté par le brasseur ne s'écarte qu'après mesure (B).

## Correspondance

- Réponse A = Audacieux
- Réponse B = Bâtisseur
- Réponse C = Contradicteur
- Réponse D = Brasseur
- Réponse E = Regard neuf
- Réponse F = Premiers principes

## Verdict

### Où le conseil s'accorde
- La confusion vient du contenu de chaque écran, pas du nombre d'outils. A, C, D, F et les trois revues le disent. Vérifié sur `y1b-390.png` : l'écran « Quand ? » porte un sélecteur de houblon, « + second houblon », des doses de 1 à 8 g/L, les levures US-05 et Pomona, un comparatif Idaho 7 / Citra, l'IBU et « Défi ».
- Substituer, c'est Comparer avec le houblon absent déjà chargé.
- Suggestions → « + » → Comparer (D78).
- Lot 22 : Comparer seul, sur la stout à 16 °P, avec Cascade, Idaho 7 et Galaxy, environ 12 variantes.
- On entre depuis Ma bière (C, D, F).

### Où il se divise
- Les portes : trois (A, B, C, F), ses quatre verbes (D), ou Choisir / Placer / Fermenter (E). E est écarté : « Choisir » regroupe justement les trois mots de sa plainte.
- La levure : dans le Quand (A, C, D), interrupteur de Comparer (B), ou outil propre (F).
- Le calcul : B abandonne le repli sans avoir chronométré. Les revues ont raison contre lui. `simulerCas` est pur et a un mode léger (`profil-simule.ts`), mais aucun temps n'a été mesuré sur téléphone.
- Le « Quand et combien » de F fait varier deux facteurs, ce qui contredit sa propre règle.

### Angles morts
- Comparer existe déjà : p06 et le radar p02 sont intégrés dans la base v4.6 (DEFAUTS D33 bis, #138). Le lot 22 part de là (L06).
- Le radar de Comparer attend toujours son choix, r2 ou r3 (registre, lot 16). Aucun avis ne le relève, et ce choix bloque le lot 22.
- Données : L14 et son contrôle sont encore « à écrire », et la note [[descripteurs-hors-familles]] n'existait pas au moment du conseil. Le comparateur risque de tromper sur Galaxy comme il l'a fait sur Nelson Sauvin.
- « pas pour tout de suite » (18.10) visait le lot 5. D78 et a2b sont plus récents : la levure reste sur la carte.

### Recommandation
Le président donne raison à F et C, minoritaires sur ce point. Règle : un seul facteur libre par écran, les autres fixés sur une ligne de contexte. y1b a déjà cette ligne : « Citra · 4 g/L · dry hop actif · 3 j · US-05 ». Le bouton porte son verbe, le titre porte la question (choix réversible).

**La carte**
- **Point d'entrée** : Ma bière, étape Houblons (disposition l8, radars m4/h4). Chaque houblon, ajout ou levure ouvre son outil en plein écran, car trois colonnes ne tiennent pas dans un panneau de 390 px.
- **Suggérer** : « Quel houblon ajouter à ma bière ? » (s5).
  - Varie : les candidats.
  - Pont : « + » vers Comparer.
- **Comparer** : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »
  - Varie : la variété seule.
  - Contenu : α et rôle en tête, puis la base v4.9 (p06, radar avec intervalles), la chimie rattachée aux familles, les vraies valeurs de v1 sous un toucher, la manière de w2 et le panel OSU sans molette.
  - Entrée « Je n'ai pas X » (u4) : X épinglé en colonne 1.
  - Pont : le gagnant ouvre Dryhopper.
- **Dryhopper** : « Quand l'ajouter ? » C'est y1b sans sélecteur de houblon, sans second houblon et sans levure.
  - Varie : le moment, par 5′. La dose reste en contexte, réglable d'un toucher.
  - En fin de frise, x3b réduit : « ma bière → +1 → +2 dry hops ».
  - Pont : vers Levure.
- **Levure** : « Que change ma levure ? » (a2b).
  - Varie : la levure.

**Avant le lot 22**
1. Un contrôle L10 au rendu : la liste des éléments admis par outil, un seul groupe de sélecteurs libres. Témoins négatifs : y1b et y3 doivent échouer.
2. Un contrôle L06 : radar, chimie, panel OSU et vraies valeurs présents.
3. Les données L14 : corriger le rattachement des descripteurs, puis confronter Cascade, Idaho 7, Galaxy, Nelson Sauvin et Motueka à leur réputation.
4. Chronométrer `simulerCas`, léger et complet, sur tout le catalogue, sans écrire de fichier. Le repli tient jusqu'à cette mesure.

**Lot 22** : Comparer seul. Ensuite Dryhopper, puis Levure.

**Au brasseur de trancher**
1. Radar de Comparer : r2 ou r3 ?
2. Comparer à dose égale, à effet égal sur l'arôme visé, ou à IBU égal ?
3. Substituer : une porte qui ouvre Comparer avec X épinglé, ou un outil propre (u4 complet) ?
4. Levure : dernière étape de Dryhopper, ou outil propre ?

### Premier geste
Dessiner une seule page en fil de fer qui suit la stout de l'étape Houblons jusqu'à Dryhopper. Elle montre un écran par outil, marque la ligne de contexte et le facteur libre, et pose les quatre questions fermées en tête. C'est elle qu'on montre au brasseur.

**Leçons retenues par le président** :
1. Faire : définir chaque outil par le seul facteur qui y varie et par la liste de ses éléments admis, avec un contrôle au rendu ; un titre en forme de question ne suffit pas (cause : au lot 21, « Quand ? » et « Quelle dose ? » laissaient libres le houblon, la dose et la levure).
2. Faire : avant de cadrer une question, relire les acquis déjà intégrés et les choix en attente, et lire une plainte du brasseur aussi comme une proposition (cause : le cadrage A / B / C ignorait Comparer v4.6, le radar r2/r3 et sa liste « suggestions, comparer, substituer, dryhopper »).
3. Faire : chronométrer le moteur avant d'écarter un repli que le brasseur a accepté (cause : la « grille 1,8 Mo » a été lue comme un coût, puis le repli a été écarté sans mesure).

## Suite

Décision du brasseur : la page en fil de fer du premier geste lui sera montrée avec les quatre questions fermées. Les contrôles et données « avant le lot 22 » entrent dans la mission work/missions/2026-10-22-reprise-lot21/. Les trois leçons retenues sont versées dans cerveau/LECONS.md (L10 amendée, L19, L20).
