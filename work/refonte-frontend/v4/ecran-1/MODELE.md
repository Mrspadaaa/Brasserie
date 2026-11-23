# Écran houblons — les quatre objets (modèle du brasseur, 18.10.2026)

Le brasseur : « Je pense qu'il y a confusion entre, ce que j'ai actuellement dans ma bière,
son profil. Le style de la bière, un target. La comparaison manuel entre plusieurs houblons.
Et la comparaison par suggestions de l'outils ».

Les maquettes des lots 1 et 2 mélangeaient ces objets : la lecture au style montrait le
modèle et la dégustation sans dire lequel, le radar dessinait la bière au lieu des houblons,
et « Comparer » servait à la fois aux voies et aux houblons. Ce document fixe ce que chaque
vue montre. **Chaque vue nomme son objet**, et aucune n'en mélange deux sans le dire.

## Les quatre objets

| # | Objet | Question du brasseur | Données | Échelle |
|---|---|---|---|---|
| 1 | **Profil de ma bière** (actuel) | « Qu'est-ce que j'ai dans ma bière ? » | ses houblons de la recette (étape, plan 1) ; par famille : sa **dégustation** d'abord, sinon le **modèle V5.5** (repère central converti en niveau), sinon « non situé » ; la source est dite | intensité : faible, moyen, marqué (classes V5.5 0–33, 33–66, 66–100) |
| 2 | **Cible du style** | « Où le style veut-il que je sois ? » | les bandes du style, converties en niveaux (« jusqu'à moyen », « faible au plus », « absent ») ; attendue, neutre, indésirable ; hypothèse BJCP à valider | même échelle que 1 |
| 3 | **Comparaison manuelle de houblons** | « Comment ces houblons se distinguent-ils ? » | 2 à 4 houblons **choisis par le brasseur** (recette, stock, catalogue) ; par famille : ce que disent les fiches (non décrit, cité, marqué ; « N fiches sur M ») ; les familles que le style attend sont mises en évidence | citations : 0, 1, 2 (ce n'est **pas** une intensité dans la bière) |
| 4 | **Comparaison par suggestions de l'outil** | « Que me propose l'outil pour aller vers ma cible ? » | une direction (« + floral », « − résineux »), les voies classées par le moteur ; pour 2 ou 3 voies : le profil de ma bière **avant / après** face à la cible ; IBU, stock | même échelle que 1 |

**Échelle des objets 1, 2 et 4 : les crans du style** (décision du pilote, 18.10). Avec des
niveaux absolus (faible, moyen, marqué), une voie de +16 points ne change pas de niveau et
la vue des suggestions dirait « rien ne bouge ». En crans du style, chaque bande compte 3
crans (0 à 3), 4 marque « au-dessus » : Golding fait passer le floral de 0 à 1 cran, la
résine dégustée est à 4. C'est la demande constante du brasseur : « Les échelles doivent être
revu en fonction du style ». Champs du pack : `profilBiereCrans`, `cibleStyleCrans`
(avec `visee`), `profilApresCrans` et `deltaCrans` par voie. L'objet 3 reste en citations
(0 à 2).

## Où ils vivent

- **Étape Houblons** (plan 1, modèle Malts) : les houblons de la recette, l'ajout en un
  toucher, l'IBU par houblon, le type d'ajout et le moment. Une ligne résume l'objet 1 face
  à l'objet 2 et ouvre le panneau.
- **Panneau d'analyse**, trois parties nommées, chacune à un toucher :
  1. **Ma bière et la cible** (objets 1 et 2 ensemble) ;
  2. **Suggestions** (objet 4), ouvert par une direction ;
  3. **Comparer des houblons** (objet 3), ouvert en choisissant des houblons.
- **Barres / Radar** existe dans chaque partie, sur **les mêmes données de cette partie** :
  - partie 1 : ma bière contre la zone cible ;
  - partie 2 : avant et après de 2 ou 3 voies, contre la cible ;
  - partie 3 : 2 à 4 silhouettes de houblons, par citations.
  Le radar n'est jamais un mélange des parties.

## Autres confusions du même type, et leur résolution (pilote, 18.10, réversible)

| # | Confusion | Résolution |
|---|---|---|
| C-a | **Cible du style** et **ma cible** : le style donne une zone ; « je la veux plus florale » est une visée personnelle, qui peut rester dans le style ou en sortir | Deux marques distinctes : la **zone du style** (fond) et **ma visée** (trait creux posé par la direction). Une visée hors style est permise et signalée. **Confirmé : « Parfait ».** |
| C-b | **Recette** et **brassin** : la dégustation (« trop résineuse ») vient d'un brassin passé, la recette est un projet | Le profil de ma bière dit d'où vient chaque niveau : « dégusté (brassin du jj.mm) » ou « prévu (modèle) ». Une recette jamais brassée n'a que le prévu. **Confirmé**, avec un ajout : ses goûts viennent aussi d'autres bières (objet 5). |
| C-g | **Ma bière** et **mes goûts** : « je peux goûté d'autres bière que les miennes et pas aimer un houblon en particulier ou autre » | **Objet 5, mes goûts** : des houblons ou des familles que j'aime ou que je n'aime pas, notés n'importe quand (pas seulement sur mes brassins). Les suggestions et les ajouts proposés en tiennent compte : un houblon que je n'aime pas est écarté ou marqué « tu ne l'aimes pas ». Un geste le note là où le houblon apparaît (verrou : aimer, neutre, exclure). |
| C-h | **Stock** et **recette** : « je fais une recette puis ensuite j'achète les ingrédients, souvent pas présent » | Le stock **informe**, il ne limite pas. Les ajouts proposés et les voies incluent les houblons à acheter, sans les reléguer ; chaque ajout dit « en stock », « manque N g » ou « à acheter » ; l'étape tient une **liste d'achats** (ce qui manque, en g). |
| C-c | **Houblon** (la variété) et **ajout** (une dose à un moment) : Nugget peut être ajouté deux fois | L'étape liste des **ajouts** ; la comparaison manuelle compare des **variétés** (leurs fiches). Un ajout montre sa variété, son moment, sa dose, ses IBU. |
| C-d | **Amertume** et **arôme** : un ajout à 60′ apporte surtout des IBU, un ajout tardif surtout de l'arôme | Chaque ajout montre ses IBU ; l'effet arôme d'un ajout dépend de son moment (le moteur le dit) ; l'IBU n'est jamais sur l'échelle des familles. |
| C-e | **Stock**, **à acheter** et **catalogue** | Trois groupes nommés, jamais mêlés : « en stock », « à racheter » (épuisé), « à acheter ». |
| C-f | **Voie** et **ajout manuel** : une voie peut ajouter, remplacer, diminuer ou déplacer un ajout | Une voie dit son verbe (« Ajouter », « Remplacer », « Diminuer », « Déplacer ») ; l'ajout manuel ne fait qu'ajouter. |

## La levure : contexte, double impact, levier (18.10, oubli réparé)

Le brasseur : « Et tout ce qui est biotransformation avec levures, dry hopping et tout,
comment ça d'intégre ? Ça a été oublié ? » Exigences retrouvées : R43 (« la
biotransformation et le double impact des levures sont trop écartés, alors qu'ils sont
essentiels »), R44 (ces leviers « appartiennent aussi aux réponses usuelles », pas à un outil
expert), C060 (« Est-ce que la bio transformation peut m'aider là dedans »).

- **Contexte, sur l'étape** : la levure de la recette (de l'étape Levure) et son statut :
  « caractérisée » (le modèle connaît son profil) ou « inconnue » (plages élargies, jamais
  neutre).
- **Double impact, dans « Ma bière »** : (1) l'**arôme propre** de la levure (expression
  fermentaire), montré comme une source à part ; (2) sa **transformation des composés du
  houblon** (biotransformation), montrée sur l'ajout concerné.
- **Sur un ajout à froid** : le moment dit « en fermentation active » ou « après
  fermentation » et le jour. En fermentation active : signaux de biotransformation, sourcés
  et **sans chiffre** (géraniol → citronellol : le floral peut glisser vers les agrumes ;
  libération de thiols : tropical, cassis), et signal de **hop creep** (refermentation,
  atténuation, diacétyle). L'effet reste « estimé, non quantifié ».
- **Levier, dans « Suggestions »** : une voie peut être un levier levure (« Changer de
  levure », « Houblonner à froid en fermentation active »), quand le moteur sait l'évaluer.

## Conséquences

- La lecture de la bière ne dit plus seulement « au style » : elle montre **ce que j'ai** (et
  d'où vient chaque niveau : dégustation ou modèle) et **où est la cible**.
- Les fiches des houblons (citations) ne sont jamais présentées comme une intensité dans la
  bière.
- Une suggestion se juge sur l'effet dans **ma bière** ; un houblon se compare sur **ses
  fiches**. Les deux comparaisons restent séparées.
