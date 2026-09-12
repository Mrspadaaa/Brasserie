---
name: L'Affinée
description: Instrument de cave — une app de brasserie qui se lit à bout de bras, dans la pénombre, avec des gants.
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
  alert: "#D6453D"
  hop: "#6E9B5B"
  water: "#5B8AA6"
typography:
  display:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "2.441rem"
    fontWeight: 600
    lineHeight: "2.6rem"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1.5625rem"
    fontWeight: 600
    lineHeight: "1.9rem"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  reading:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "1.953rem"
    fontWeight: 600
    lineHeight: "2.2rem"
    letterSpacing: "-0.01em"
rounded:
  control: "0.625rem"
  panel: "1rem"
  sheet: "1.5rem"
spacing:
  touch-sm: "2rem"
  touch: "2.25rem"
  touch-lg: "2.75rem"
components:
  button-primary:
    backgroundColor: "{colors.ebc-straw}"
    textColor: "{colors.cave-950}"
    rounded: "{rounded.control}"
    height: "{spacing.touch}"
    padding: "0 1rem"
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
    padding: "1rem"
  reading-value:
    textColor: "{colors.cave-50}"
    typography: "{typography.reading}"
---

## Overview

**Instrument de cave.** L'application se manipule dans une cuverie : pénombre,
gants mouillés, une seule main libre, une minuterie qui tourne. Tout ce qui suit
découle de cette scène — pas d'un goût.

Le fond est un charbon **chaud**, dérivé du malt torréfié, jamais le bleu-noir
des tableaux de bord. Une cave n'est pas bleue.

Quatre lois portent le système. Elles se vérifient, elles ne se discutent pas :

1. **Trois tons de texte, pas un de plus** — `cave-50`, `cave-200`, `cave-400`.
   Tout ce qui est plus sombre est de la structure, jamais du texte.
2. **L'échelle EBC appartient à la bière** — `ebc-*` décrit un moût, un malt, un
   brassin. Elle ne décrit jamais une action, un lien ni un état d'interface.
3. **Un instrument ne ment pas sur sa position** — un curseur, une jauge ou une
   barre place ses repères à leur valeur réelle, ou ne les place pas.
4. **14 px plancher, 36 px dessinés, 44 px au doigt** — rien en dessous, jamais, sur aucun écran.

## Colors

### Les trois tons de texte

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
réintroduits. Trois tons suffisent à la hiérarchie ; un quatrième se paie en
contraste et ne se distingue pas à bout de bras. Un test refuse toute classe de
couleur hors palette (`tests/unit/designTokens.test.ts`).

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

**On colorie l'exception, pas le cas courant.** Si neuf lignes sur dix portent la
même pastille colorée, la couleur ne distingue plus rien — repasser le cas
courant en neutre et n'allumer que ce qui sort de l'ordinaire.

### La palette catégorielle — familles de styles UNIQUEMENT

Une quatrième famille de couleurs existe, et son usage est strictement borné :
**la pastille de style d'une bière** (`src/ui/BeerStyleTag.tsx`).

Elle ne sert pas à dire de quelle couleur est la bière — c'est le travail de
l'échelle EBC — mais à **distinguer onze familles de styles** dans une liste,
d'un coup d'œil. L'échelle EBC en est incapable ici : une NEIPA et une saison
tomberaient toutes deux dans « or », et la pastille cesserait de distinguer quoi
que ce soit.

> **Ces teintes ne sortent jamais de cette pastille.**
> Aucune autre partie de l'interface n'utilise la palette par défaut de
> Tailwind. Un état, une action ou une alerte passent par `alert`, `hop`,
> `water` ou `ebc-straw`.

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

Base 16, ratio ~1.25. **14 px est le plancher** : en dessous, illisible à bout de
bras dans une cave.

| Classe | px | Emploi |
|---|---|---|
| `text-3xl` | 39 | La grande lecture — une valeur, seule, qu'on relève de loin |
| `text-xl` | 25 | Titre d'écran |
| `text-lg` | 20 | Titre de panneau |
| `text-base` | 16 | Texte courant · **tout champ de saisie** |
| `text-sm` | 14 | Intitulé, unité, aide — **plancher** |
| `text-2xs` | 13 | Chrome de saisie mobile uniquement, jamais une valeur |
| `text-footnote` | 12 | Mentions légales uniquement |

> **La hiérarchie ne s'inverse jamais.**
> Un titre de section ne peut pas être plus gros que le titre de l'écran qui le
> contient. Une paire responsive ne rétrécit jamais quand l'écran s'élargit :
> `text-2xs sm:text-xs` est interdit (13 px → 12 px). Gardé par
> `tests/unit/classesTailwind.test.ts`.

> **Jamais `text-2xs` sur un `<input>`, `<select>` ou `<textarea>`.**
> Ils sont protégés à 16 px dans `index.css` contre le zoom automatique de
> Safari, et l'utilitaire l'emporterait sur cette protection.


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
- **Densité pilotée par le clavier** (`useDensity`) : `comfortable` / `compact` /
  `tight`. En `tight`, les sous-titres et les rembourrages cèdent. **Ce qui ne
  cède jamais : le plancher à 14 px et la ZONE D’ATTRAPE à 44 px.**

### Le budget vertical

Un écran de téléphone fait ~700 px utiles. Une grandeur qui ne change presque
jamais n'a pas droit à plus de place qu'une qui change à chaque brassin.

> Constaté sur l'étape « Identité » : le volume (fixé par l'installation) et la
> durée d'ébullition (60 min neuf fois sur dix) occupaient **322 px** à eux deux,
> contre 61 px chacun pour le nom et le style — les deux seuls champs qu'on
> remplit vraiment. Un curseur coûte cher : le réserver aux grandeurs qu'on
> explore, pas à celles qu'on confirme.

### Les cibles tactiles

| Jeton | Taille | Emploi |
|---|---|---|
| `touch-lg` | 44 px | Steppers manipulés avec des gants ou les mains mouillées |
| `touch` | 36 px | Le dessin de toute commande : boutons, champs, lignes de liste |
| `touch-sm` | 32 px | Contrôles **répétés** seulement. Jamais une validation finale |

> **Échelle révisée deux fois le 12.09.2026 — 48 px, puis 44, puis 36.**
> Demandé trois fois, en ces termes : « les boutons sont toujours beaucoup trop
> grands, larges et imposants », « maximise la place », « réajuste les règles
> pour mobile ».
>
> **La règle a changé de nature, pas seulement de valeur.** Elle ne dit plus
> « une commande mesure 44 px » mais :
>
> > **Le DESSIN fait 36 px. La ZONE D'ATTRAPE fait 44 px.**
>
> Les deux ne sont plus le même nombre. Un bouton occupe 36 px dans la mise en
> page et se vise sur 44 grâce à un `::before` en `-inset-*` ou à `p-2 -m-2`,
> qui ne coûtent aucune place. C'est ce qui permet de compacter l'écran sans
> rendre l'application imprécise en cuverie.
>
> WCAG 2.2 AA (2.5.8) exige 24 px : même le dessin seul reste au-dessus.
>
> Ce qui ne change PAS : le plancher typographique de 14 px.

> **Gain mesuré sur l'assistant de recette, à 375 px.**
> En-tête **73 → 45 px**, pied **61 → 45 px**, boutons courants **48 → 36 px**.
> La part de l'écran prise par le chrome passe de **9 % à 6 %**, et le contenu
> utile de 739 à 767 px.

> **Un bouton fait la largeur de son mot.**
> La pleine largeur est réservée à l'action principale de l'écran — une seule.
> Un bouton secondaire étiré sur toute la largeur pèse autant qu'elle à l'œil et
> brouille la hiérarchie qu'il était censé servir.

> **Séparer le dessin de la zone d'attrape.**
> Un contrôle peut rester fin à l'œil et faire 44 px au doigt : `p-2 -m-2` sur un
> bouton, ou un `::before` en `-inset-*` qui ne prend aucune place dans la mise
> en page. C'est ce qui permet de rétrécir sans rendre l'application imprécise.

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
  `danger`. 36 px dessinés, libellé à 14 px. Un bouton fait la largeur de son
  mot, pas celle de la place disponible. Le libellé dit ce qui va se passer
  (« Enregistrer l'achat »), jamais une catégorie abstraite (« Valider »), et le
  même mot est repris dans la confirmation qui suit.
- **`Reading`** — la lecture d'instrument : un grand nombre en mono, son unité en
  sans à côté, jamais en dessous.
- **`QuantityStepper`** — 44 px, appui long accélérant, paliers dans les deux
  sens. Pour une quantité **sans plafond naturel**.
- **`SliderField`** — pour une grandeur **bornée** (température, pH, dilution).
  Zone d'attrape 44 px, piste dessinée à 8 px. Ses repères se placent à leur
  valeur réelle sur la piste.
- **`CycleTag`** — pastille qui change de valeur à l'appui. **Cinq valeurs
  maximum**, et **jamais** pour un choix dont l'erreur se paie (la famille d'un
  malt, non ; le moment d'un houblon, oui).
- **`PresetChips`** — un préréglage est une **action**, pas une valeur. La puce
  reconnaît le programme en place en comparant les paliers saisis, plutôt que de
  retenir le dernier chargé.
- **`NumberInput` / `NumericField`** — **jamais `<input type="number">`** : il
  refuse la virgule du clavier français en renvoyant une chaîne vide, que les
  `parseFloat(v) || 0` transforment en zéro. Tout champ numérique porte sa borne.

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

- **Une grandeur, une commande.** Deux commandes pour le même nombre, il faut en
  supprimer une.
- **Deux vues d'une même donnée ne sont un doublon que si elles servent la même
  lecture.** Une forme (toile ionique) et des nombres (écart départ → corrigé)
  sont deux lectures : garder les deux.
- **Une alerte qui se lève pour rien apprend à ne plus la lire.** Seuils réglés
  sur ce qui change une décision, pas sur ce qui est différent.
- **Pas d'emoji en guise d'icône.** Les icônes sont dessinées, d'une seule
  bibliothèque, d'un seul poids de trait.
- **Séparer le dessin de la zone d'attrape.** Un interrupteur peut rester fin à
  l'œil et faire 44 px au doigt : `p-2 -m-2`, ou `h-11` + fond transparent.
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

Mesurer avant de juger : contraste composé (empiler les `rgba` jusqu'à
l'opacité 1), taille réelle des cibles, position réelle d'un curseur.
