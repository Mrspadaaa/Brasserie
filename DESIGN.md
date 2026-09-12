---
name: L'Affinée
description: Instrument de brasserie compact — un maximum de données utiles sur téléphone, des gestes courts et une lecture claire.
colors:
  cave-950: "#12100E"
  cave-900: "#1A1613"
  cave-850: "#221D19"
  cave-800: "#2C2521"
  cave-700: "#3D342E"
  cave-600: "#574A42"
  cave-400: "#9A8A7E"
  cave-200: "#D8CEC5"
  cave-50: "#F5F0EA"
  ebc-straw: "#F2C14E"
  ebc-gold: "#E0A02E"
  ebc-amber: "#C87A2C"
  ebc-copper: "#A0522D"
  ebc-brown: "#6B3A1E"
  ebc-stout: "#3B1F14"
  area-production: "#E7A070"
  area-finances: "#86B9E6"
  area-stocks: "#A3C97A"
  area-agenda: "#BCA5E8"
  attention: "#E3B55D"
  alert-strong: "#F29289"
  alert: "#D6453D"
  hop: "#6E9B5B"
  water: "#5B8AA6"
typography:
  display:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.375rem"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.125rem"
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
  reading:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.25rem"
    letterSpacing: "-0.01em"
rounded:
  control: "0.625rem"
  panel: "1rem"
  sheet: "1.5rem"
spacing:
  touch-sm: "1.5rem"
  touch: "1.75rem"
  touch-lg: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.ebc-straw}"
    textColor: "{colors.cave-950}"
    rounded: "{rounded.control}"
    height: "{spacing.touch-lg}"
    padding: "0 0.5rem"
  button-secondary:
    backgroundColor: "{colors.cave-850}"
    textColor: "{colors.cave-200}"
    rounded: "{rounded.control}"
    height: "{spacing.touch}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.alert}"
    rounded: "{rounded.control}"
    height: "{spacing.touch}"
  panel:
    backgroundColor: "{colors.cave-900}"
    rounded: "{rounded.panel}"
    padding: "0.5rem"
  reading-value:
    textColor: "{colors.cave-50}"
    typography: "{typography.reading}"
---

## Overview

**Instrument de brasserie compact.** La priorité est de maximiser l'espace utile
sur téléphone et de compacter les données sans perdre leur sens. Les commandes
et les barres servent le contenu. La cuverie demande des alertes repérables et
des gestes fiables ; elle ne justifie pas des contrôles surdimensionnés partout.

**Décision utilisateur du 12.09.2026.** Cette échelle remplace les anciennes
obligations de 36 px dessinés avec 44 px de zone tactile, les minima généraux de
44/48 px et le plancher général de texte à 14 px. Elle s'applique aussi aux
champs, en-têtes, pieds, titres, listes et espacements. Les valeurs du frontmatter
et les tableaux ci-dessous sont la norme à appliquer, pas une mesure du rendu
actuel : modifier ce document ne migre pas automatiquement les styles existants.

Lire aussi [le guide des outils UI](docs/ui-compacte.md) avant de choisir une
interaction ou une représentation. Cette consigne accompagne toute délégation.

Le fond est un charbon **chaud**, dérivé du malt torréfié, jamais le bleu-noir
des tableaux de bord. Une cave n'est pas bleue.

Cinq lois portent le système :

1. **Trois tons neutres pour la lecture** — `cave-50`, `cave-200`, `cave-400`.
   Les accents de rubrique et d'état sont autorisés avec un contraste suffisant.
   Les tons `cave` plus sombres restent de la structure, jamais du texte.
2. **L'échelle EBC appartient à la bière** — `ebc-*` décrit un moût, un malt, un
   brassin. Seul `ebc-straw` sert aussi à l'action principale ; les rubriques
   et les états d'interface utilisent leurs propres jetons.
3. **Un instrument ne ment pas sur sa position** — un curseur, une jauge ou une
   barre place ses repères à leur valeur réelle, ou ne les place pas.
4. **La densité utile commande les tailles** — petites dimensions communes,
   contenu prioritaire visible, détails à la demande. Un agrandissement répond
   à un besoin précis et vérifié, pas à une préférence générique de skill.
5. **Des couleurs stables pour se repérer** — une rubrique garde son identité
   sur téléphone et ordinateur, même quand tout va bien. La couleur accompagne
   toujours un libellé ; les alertes restent distinctes de ces repères.

## Colors

### Les trois tons neutres de texte

Mesuré sur `cave-900`, la surface la plus courante :

| Jeton | Emploi | Contraste |
|---|---|---|
| `cave-50` | Valeur relevée, titre d'écran, chiffre qu'on lit de loin | 15.87:1 |
| `cave-200` | Texte courant | 11.60:1 |
| `cave-400` | Texte secondaire, intitulé, unité, aide | 5.40:1 |

**`cave-600` et plus sombre ne portent jamais de texte.** Mesuré à 2.11:1 sur
`cave-900` — sous le minimum AA de 4.5:1, et illisible dans la pénombre. C'est
une couleur de **bordure et de séparateur**, y compris pour les textes
d'intention faible comme les marques de curseur ou les placeholders : un
placeholder est du texte et doit tenir 4.5:1, donc `cave-400`.

**Les degrés 100, 300, 500 et 750 n'existent pas** et ne doivent pas être
réintroduits. Ces trois tons constituent l'échelle neutre de lecture. Les
couleurs de rubrique, de statut et de style décrites ci-dessous complètent
cette échelle pour aider au repérage. Les jetons ajoutés au thème doivent être
déclarés dans la palette et pris en compte par ses contrôles
(`tests/unit/designTokens.test.ts`).

### Les surfaces

`cave-950` fond de page · `cave-900` panneau · `cave-850` surface surélevée
(feuille, champ, ligne active) · `cave-800` bordure · `cave-700` bordure marquée.

Un panneau ne se pose jamais sur un panneau. Si un bloc a besoin d'un bloc à
l'intérieur, c'est un séparateur qu'il lui faut, pas une carte.

### L'échelle EBC — réservée

`ebc-straw` → `ebc-stout` est l'échelle normalisée que les brasseurs emploient
pour décrire la couleur d'un moût. Elle sert à dire **ce qu'est la bière** :
couleur prévue d'une recette, classe d'un malt, état d'un brassin.

Une exception, une seule : **`ebc-straw` est aussi la couleur de l'action
principale** — le seul aplat clair de l'interface, impossible à rater dans la
pénombre. Cette exception est bornée par la règle suivante.

> **Une seule action principale par écran.**
> Si deux aplats `ebc-straw` sont visibles en même temps, l'un des deux est en
> trop. Un lien n'est pas une action principale : il s'écrit en `cave-50`
> souligné, pas en paille.

### La sémantique — hors de l'échelle bière

| Jeton | Sens | Jamais |
|---|---|---|
| `alert` `#D6453D` | Rupture, erreur, perte | Un accent décoratif |
| `hop` `#6E9B5B` | Disponible, validé, dans la fourchette | Un panneau d'aide, un assistant |
| `water` `#5B8AA6` | Eau, chimie, information | Une action |

Ces trois-là sont volontairement **hors** de l'échelle bière : une alerte ne doit
jamais pouvoir se confondre avec une couleur de bière.

**La couleur sert aussi à se repérer.** Les rubriques et les étapes métier
gardent des repères colorés visibles dans leur état courant. On doit pouvoir
retrouver les cuves, les stocks, les finances et l'agenda sans relire tous les
intitulés. La répétition d'un repère stable est utile ; elle ne justifie pas de
le supprimer au nom de la sobriété.

### Les repères permanents de rubrique

| Rubrique | Repère de couleur |
|---|---|
| Brassins / production | Cuivre |
| Finances | Bleu |
| Stocks | Vert |
| Agenda et démarches | Violet |

Cette correspondance s'applique aux mêmes rubriques dans toute l'application,
sur téléphone comme sur ordinateur. Elle s'exprime par les **icônes, les titres,
les marqueurs de navigation et les fonds légèrement teintés**. Un panneau fermé
conserve son repère ; le passage au mobile ne doit pas effacer les couleurs.
Le libellé et la forme distinguent toujours une destination active des autres.

Les surfaces charbon restent majoritaires. Les textes courants et les grandes
valeurs gardent les tons neutres de lecture ; un titre de rubrique peut prendre
son accent si son contraste est suffisant. Une couleur de rubrique ne transforme
pas toutes ses commandes en actions principales : l'aplat paille reste réservé
à l'action principale de l'écran.

À l'implémentation, déclarer des **jetons de rubrique dédiés** dans le thème et
reporter leurs valeurs vérifiées dans le frontmatter de ce document. Le cuivre
de Production n'est pas une mesure EBC ; le bleu de Finances n'est pas le jeton
`water` ; le vert de Stocks n'est pas un indicateur de disponibilité. Ne pas
détourner les jetons de bière, d'état ou de style pour ces usages.

### Les états et les alertes restent distincts

Les badges de statut associent une couleur à un libellé explicite : fermentation,
garde froide, planifié, conditionné. Un même statut conserve le même sens et la
même teinte sur les deux formats, d'après l'état enregistré du brassin.

**L'alerte, elle, signale une exception.** Un besoin de réapprovisionnement
s'affiche en ambre avec « À commander » ; une rupture ou une erreur s'affiche en
rouge avec un libellé précis. L'ambre d'attention utilise un jeton d'état dédié,
distinct de l'échelle EBC et de la couleur paille de l'action principale.

Le repère vert de la rubrique Stocks identifie l'inventaire ; il ne signifie pas
« stock suffisant ». Si une alerte existe, son badge et son résumé restent
visibles quand le panneau est fermé et prennent la priorité visuelle. Un état
normal peut conserver une pastille discrète ; réserver les accents les plus
forts aux situations qui demandent une action.

**Une couleur ne porte jamais seule l'information.** Associer les états à du
texte et, lorsque c'est utile, à une icône. Vérifier au moins 4.5:1 pour les
textes colorés sur leur fond réellement composé, y compris les badges et les
panneaux teintés. Un jeton d'accent n'est pas automatiquement une couleur de
texte accessible : éclaircir le texte ou garder `cave-50` / `cave-200` et porter
la couleur sur l'icône ou le fond. Appliquer les rôles typographiques et les
dimensions compactes définis dans les sections Typography et Layout.

### La palette des styles de bière — réservée aux pastilles

La palette qui distingue les familles de styles reste réservée à
**la pastille de style d'une bière** (`src/ui/BeerStyleTag.tsx`).

Elle ne sert pas à dire de quelle couleur est la bière — c'est le travail de
l'échelle EBC — mais à **distinguer onze familles de styles** dans une liste,
d'un coup d'œil. L'échelle EBC en est incapable ici : une NEIPA et une saison
tomberaient toutes deux dans « or », et la pastille cesserait de distinguer quoi
que ce soit.

> **Ces teintes ne sortent jamais de cette pastille.**
> Aucune autre partie de l'interface n'utilise la palette par défaut de
> Tailwind. Les repères de rubrique utilisent leurs jetons dédiés. Les états
> et les alertes passent par les jetons sémantiques, dont `alert`, `hop`,
> `water` et l'ambre d'attention ; `ebc-straw` reste l'action principale.

Le jeu n'est pas choisi à l'œil. Pour chaque nombre de paliers, un glouton a
cherché celui qui **maximise le plus petit écart perceptuel** (ΔE, CIE-Lab)
entre pastilles réellement rendues sur `cave-900` :

| Paliers | Aplat | ΔE minimum | Verdict |
|---|---|---|---|
| 8 (ancien) | 15 % | 5.0 | quasi identiques |
| 11 (retenu) | 40 % | **12.3** | net |
| 13 | 40 % | 8.7 | confusables |

En dessous de ΔE 10, deux pastilles ne se distinguent pas d'un coup d'œil ; en
dessous de 5, pas du tout. Au-delà de douze paliers la roue sature.

Recette d'une pastille : fond `bg-<teinte>-400/40`, texte `text-<teinte>-200`,
bord `border-<teinte>-300/40`. Le pire contraste du jeu vaut 5.29:1 — tous AA.

Le style non reconnu prend `cave-700`, le neutre **chaud** du système. Surtout
pas `slate`, qui est un gris BLEU : à 215° il se confondait avec la blanche
(198°), mesuré à ΔE 8.2. Un style qu'on ne reconnaît pas ne reçoit pas une
teinte au hasard.

⚠️ Ces classes s'écrivent **en toutes lettres**, jamais assemblées à la volée
depuis le nom de la teinte. Tailwind ne génère que les classes qu'il trouve dans
les sources : une classe construite par interpolation serait muette, et la
pastille prendrait la couleur de son parent — le piège des 380 classes mortes.

## Typography

Deux familles, une frontière nette :

- **Source Sans 3** — tout ce qui se **dit** : intitulés, phrases, boutons.
- **IBM Plex Mono** — tout ce qui se **mesure** : densités, volumes, montants,
  températures. Chiffres tabulaires forcés (`tnum`), sans quoi une colonne de
  montants danse d'une ligne à l'autre et deux nombres ne se comparent plus.

Le mono n'est **pas** un costume « technique ». Un mot en mono qui n'est pas une
mesure est une faute.

### L'échelle

Échelle resserrée. La racine reste à 16 px pour les unités `rem` et le zoom ;
ce n'est pas la taille de tous les textes. Les valeurs suivantes sont les
cibles à taille de texte normale, à laisser grandir avec les préférences utilisateur.

| Rôle | Taille mobile | Emploi |
|---|---|---|
| Grande lecture dédiée (`display`) | 28 px | Une minuterie ou une mesure prioritaire, pas chaque chiffre |
| Titre d'écran (`title`) | 18 px | Une ligne dans un en-tête compact |
| Titre de section | 14–16 px | Hiérarchie par graisse et position |
| Texte courant (`body`) | 14 px | Explication utile, message, contenu à lire |
| Données en liste ou tableau | 13–14 px | Valeurs, noms, unités, comparaisons alignées |
| Lecture mise en avant (`reading`) | 16 px | Nombre et unité sur une même ligne |
| Libellé compact (`label`) | 12 px | Métadonnée, légende, badge ; 13 px si plus lisible |
| Commande | 12–13 px | Mot d'action court et explicite |
| Texte saisi | 16 px | Conserver la protection de saisie mobile de `index.css` |

Le 12/13 px n'est plus réservé au « chrome expérimental » ou aux mentions
légales. L'utiliser selon le rôle ci-dessus, avec contraste et zoom conservés.
Les mesures à surveiller restent plus visibles que leurs métadonnées. Éviter
les titres géants, les unités sur une ligne séparée et les hauteurs de ligne
qui doublent artificiellement chaque rangée.

Un champ peut garder du texte à 16 px dans une hauteur de 32 px : réduire son
rembourrage, pas le zoom utilisateur. Ne pas écraser la protection de saisie
mobile avec `text-2xs`, `text-xs` ou `text-sm`. La hiérarchie des titres reste
cohérente ; le bureau conserve une densité utile sans grossissement automatique.


## Layout

Vérifier tout rendu à **320 / 375 / 430 / 1280 px**. Rien ne doit dépasser
`innerWidth`, sauf à l'intérieur d'un conteneur `overflow-x-auto` assumé.

- **`min-w-0` sur tout élément flex qui doit rétrécir.** Par défaut
  `min-width: auto` l'empêche de descendre sous la largeur de son contenu, et
  les `truncate` posés à l'intérieur ne servent alors à rien.
- **L'échelle d'espacement s'arrête aux demis à 3.5.** `h-5.5`, `py-0.2` ne
  produisent aucune règle : la classe est muette et l'élément prend zéro.
- **Le clavier virtuel ne réduit ni `vh`, ni `dvh`, ni `innerHeight`.** Seul
  `visualViewport` bouge avec lui : tout conteneur ancré en bas doit retrancher
  `useKeyboardInset()`, sinon son bouton d'enregistrement passe dessous.
- **Densité compacte dès l'ouverture.** Les modes existants de `useDensity`
  (`comfortable` / `compact` / `tight`) sont des détails d'implémentation,
  pas une permission d'agrandir l'écran quand le clavier est fermé. En `tight`,
  réduire encore les marges et les explications secondaires. Garder le champ
  actif, sa valeur, son erreur et l'action nécessaire accessibles.

### Le budget vertical

Compter ce qui reste pour les données après les barres fixes. Regrouper titre,
état et commandes sur une ligne dès que cela reste clair. Éviter d'empiler
en-tête global, en-tête de page, sous-titre et barre d'outils sur téléphone.
Un pied fixe n'existe que si l'action doit réellement rester à portée ; réserver
son espace dans le défilement et compter la zone de sécurité une seule fois.

Une grandeur rarement modifiée peut se lire en ligne et s'éditer sur place.
Un curseur convient à l'exploration d'une plage ; il ne doit pas remplacer une
valeur stable si sa piste et ses légendes consomment davantage de hauteur.

### Dimensions compactes

| Jeton | Taille | Emploi |
|---|---|---|
| `touch-sm` | 24 px | Commande répétée sur une ligne, petite action avec cible vérifiée |
| `touch` | 28 px | Bouton courant, icône interactive, pastille, segment |
| `touch-lg` | 32 px | Action principale, champ simple, stepper |

| Élément | Cible mobile au repos | Règle de composition |
|---|---|---|
| Champ simple, select, combobox | 32 px | Libellé proche, unité accolée, largeur selon la donnée |
| En-tête de page ou de feuille | 36 px | Titre et actions sur une rangée |
| Pied d'actions | 36 px | Commandes de 28/32 px ; marge basse de sécurité en plus si nécessaire |
| Navigation principale basse | 40 px | Icône et libellé compacts ; zone de sécurité en plus |
| Onglets, filtres, barre d'outils | 28–32 px | Une rangée si les choix restent lisibles |
| Ligne de données | 28–32 px pour une ligne ; 40–48 px pour deux | Hauteur selon le contenu, pas une grande carte par valeur |
| Icône dessinée | 14–16 px | Sa cible interactive suit les jetons ci-dessus |
| Espaces entre éléments liés | 4–6 px | Éviter les marges empilées |
| Espaces entre groupes | 8–12 px | Regroupement clair sans grands vides |
| Marge latérale de page | 8–12 px | Préserver la largeur des données à 320 px |
| Rembourrage de panneau | 8 px | Séparateurs et lignes avant cartes imbriquées |

Ce sont des dimensions normales, pas des plafonds qui coupent le texte. Employer
une hauteur minimale et laisser grandir pour le zoom, un libellé long, une erreur
ou une saisie multiligne. Une commande critique réellement manipulée en action
peut recevoir 36–40 px après vérification du besoin ; ce cas ne devient pas le
défaut d'une page entière. La pleine largeur est un choix local, jamais le
défaut des boutons ou de tous les champs ; même l'action principale peut rester
à la largeur de son libellé, avec 6–8 px de marge horizontale.

### Cibles et accessibilité web

Le [critère WCAG 2.2 AA 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
prévoit 24 × 24 px CSS ou ses exceptions, notamment un espacement suffisant.
Le [critère renforcé 2.5.5, niveau AAA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
vise 44 × 44 px. **44 px n'est pas une obligation générale de cette application.**
Les minima natifs en points iOS ou en dp Android ne fixent pas ses tailles web.

Vérifier la surface réellement activable et sa forme, pas seulement l'icône ou
sa boîte englobante. Préférer une cible qui contient un carré de 24 px ; sinon
vérifier une exception applicable. Un dessin plus petit peut avoir une cible
plus grande dans l'espace libre, mais jamais au-dessus d'une commande voisine.
Les `::before` débordants et marges négatives ne sont pas un agrandissement
« gratuit » à généraliser. Garder focus visible, noms accessibles et contraste ;
ne pas annoncer une conformité globale sur la seule base de la taille.

## Elevation & Depth

Trois niveaux, pas davantage. La profondeur vient du **fond**, pas de l'ombre.

| Jeton | Emploi |
|---|---|
| `shadow-panel` | Liseré intérieur clair, 4 % — décolle un panneau de la page |
| `shadow-lift` | `0 8px 24px -12px` — ce qui flotte au-dessus du contenu |
| `shadow-sheet` | `0 -12px 40px -16px` — feuille montant du bas |

Aucune ombre colorée, aucun halo sans décalage. Un `box-shadow` à décalage nul
est une décoration, pas de la profondeur.

## Shapes

Trois rayons, chacun porteur d'un niveau :

`rounded-control` 10 px — champs, boutons, pastilles ·
`rounded-panel` 16 px — blocs de contenu ·
`rounded-sheet` 24 px — feuilles et modales.

Une bordure fait 1 px. Une bordure latérale colorée épaisse est interdite.

### Les surfaces du navigateur

Ce qu'on n'a pas dessiné porte quand même le système : sélection de texte,
curseur de saisie, barre de défilement, anneau de focus, marqueur `<details>`,
sélecteur de date natif. Tous doivent être habillés depuis la palette. Un
marqueur `▶` par défaut au milieu de chevrons dessinés est une faute.

**Un seul signifiant par geste.** Un bloc qui se déplie porte un chevron `⌄`,
toujours le même, partout.

## Components

- **`Button`** — trois intentions : `primary` (une par écran), `secondary`,
  `danger`. Utiliser l'échelle compacte ci-dessus. Le libellé dit ce qui va se
  passer (« Enregistrer l'achat »), jamais une catégorie abstraite (« Valider »).
- **`Reading`** — nombre en mono et unité à côté. Réserver la grande variante
  à une lecture prioritaire ; les valeurs répétées restent compactes.
- **`QuantityStepper`** — variante compacte, champ et ajustements sur une ligne,
  paliers dans les deux sens. Pour une quantité souvent ajustée ; les raccourcis
  supplémentaires ne doivent pas ajouter plusieurs rangées à chaque ingrédient.
- **`SliderField`** — pour explorer une grandeur bornée, avec accès à une valeur
  exacte. Ses repères se placent à leur valeur réelle ; une piste n'est pas une
  obligation pour tout nombre borné.
- **`CycleTag`** — pastille qui change de valeur à l'appui. Cinq valeurs maximum,
  familières et réversibles. Pour un choix important dont les options doivent
  être comparées, préférer les segments ou une liste explicite.
- **`PresetChips`** — un préréglage est une action. La puce reconnaît le programme
  en place en comparant les paliers saisis, plutôt que de retenir le dernier chargé.
- **`NumberInput` / `NumericField`** — conserver les composants de saisie décimale
  française ; ne pas réintroduire `<input type="number">` ni transformer une
  entrée invalide ou absente en zéro. Toute borne métier reste explicite.

Cette liste n'épuise pas les outils disponibles : [le guide commun](docs/ui-compacte.md)
recense les sélections, contrôles natifs, interactions sur place et représentations
visuelles avec leurs usages métier. Consulter ce guide avant d'ajouter un champ
texte, une rangée de boutons ou un bloc d'explication.

## Do's and Don'ts

### Écriture

- **Phrase française, pas Title Case.** « Opérations en cours », jamais
  « Opérations en Cours ». Seuls le premier mot et les noms propres prennent la
  majuscule.
- **Jamais `(s)`.** « 8 articles sous le seuil », « 1 tâche à faire » — accorder
  pour de vrai. `1 tâche(s)` est faux, et `(s)` est la signature d'un texte que
  personne n'a écrit.
- **Une virgule décimale partout**, en français : `SG 1,032` et `5 633,39 CHF`.
  Jamais les deux conventions sur un même écran.
- **Une erreur nomme le problème et la sortie**, pas l'échec technique.
- **Le nom du fournisseur du modèle ne s'affiche pas.** « Compagnon brasseur »,
  pas « Gemini ».

### Interface

- **Une grandeur, un éditeur cohérent.** Une valeur exacte peut compléter un
  curseur ou un stepper dans le même éditeur. Éviter deux contrôles séparés qui
  dupliquent la saisie et occupent deux blocs.
- **Deux vues d'une même donnée ne sont un doublon que si elles servent la même
  lecture.** Une forme (toile ionique) et des nombres (écart départ → corrigé)
  sont deux lectures : garder les deux.
- **Une alerte qui se lève pour rien apprend à ne plus la lire.** Seuils réglés
  sur ce qui change une décision, pas sur ce qui est différent.
- **Pas d'emoji en guise d'icône.** Les icônes sont dessinées, d'une seule
  bibliothèque, d'un seul poids de trait.
- **Une petite commande reste compréhensible et activable.** La taille du dessin,
  celle de la cible et l'espace entre commandes se vérifient ensemble, selon
  la section « Cibles et accessibilité web ».
- **Une liste ne se sélectionne jamais au `pointerdown`** — un défilement
  commence par un `pointerdown` sur une option. Valider au `pointerup`, si le
  doigt a bougé de moins de 12 px.
- **Pas de survol sur ce qui ne survole pas.** `hoverOnlyWhenSupported` est
  activé : sur un téléphone, `:hover` reste collé après l'appui.
- **Le mouvement répond à une action, jamais à l'ouverture d'un écran.** Et
  `prefers-reduced-motion` est respecté sans exception.

### Vérification

Lire le code ne suffit pas. Les doublons de premier plan se voient dans un
fichier ; les doublons **structurels** ne se voient qu'à l'écran, parce qu'ils
sont répartis sur plusieurs composants qu'on ne lit jamais ensemble. Capturer
l'écran entier, par tranches, et le lire comme un brasseur.

Mesurer avant et après : hauteur cumulée des barres, nombre de lignes et de
données utiles visibles, défilement pour finir l'action, taille réelle des cibles
et chevauchements, contraste composé et position des repères. Inspecter les
captures téléphone puis bureau et jouer le parcours, clavier ouvert compris.
Les erreurs doivent ouvrir les détails qui les contiennent. Un gain de place
n'est réussi que si la lecture et l'action restent simples.
