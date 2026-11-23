# Réponses anonymes du conseil

Question : question.md (même dossier).

## Réponse A

Les trois options dessinent un organigramme alors que le brasseur veut un geste. Les captures montrent que la confusion est aussi *dans* chaque écran. Dans `y1b-390.png`, le titre « Quand ? » couvre aussi dose, levure, douze barres, IBU et « Défi ». Dans `w2-390.png`, « Trois plans » mêle suggestions, curseurs et détail. Une carte de six outils ne règle pas cela (L10).

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

**Lot 22** : « Lequel ? » seul, sur la stout 16 °P (Cascade, Idaho 7, Galaxy), environ 12 variantes en fil de fer, pas 40. Il répond à ses trois plaintes globales : « pas de comparaison de houbon 1:1 », « Manque aussi la partie chimie », « pas de radar grpah ? ». Le coût de calcul reste à mesurer. Son repli (« seulement si c'est trop lourd ») ne vise que « Et si ? ».

**Au brasseur de trancher**
- A, B ou C.
- Faut-il « Et si ? » maintenant ? Le 18.10 il disait « pas pour tout de suite », et le 20.10 a2b était « vraiment interessant ».
- Non négociables : simulé marqué, inconnu ≠ 0.

**Premier geste** : une planche grise des trois cartes, sur la même stout.

Position : autre voie : trois portes (« Lequel ? », « Quand ? », « Et si ? ») sur un seul canevas de comparaison ; lot 22 = « Lequel ? » seul.

LEÇON PROPOSÉE : à ajouter à L10. Un titre-question ne suffit pas : avant de dessiner une carte, lister les questions que chaque écran traite réellement (y1b en mêle quatre) et n'en garder qu'une par écran. Contrôle à écrire.

## Réponse B

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

## Réponse C

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

## Réponse D

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

## Réponse E

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

## Réponse F

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

