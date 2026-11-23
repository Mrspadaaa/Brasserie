r6k · Le panel d'abord : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? » (lot 22, Comparer).

## Choix portés
- Radar : r3
- Base : dose égale
- Porte : non
- Descripteurs : A

Descripteurs A ne se voit pas ici : seul Nelson Sauvin change (groseille à maquereau rangée dans Petits
fruits), et la porte est fermée, donc Nelson Sauvin n'est pas sur la page. Les fiches (appui long) de
Cascade, Idaho 7 et Galaxy sont les mêmes en A et sans A (`descripteurs.A.effets` : aucun mot déplacé).

## Ce que j'ai fait de l'angle
L'angle disait : ce que des panels ont goûté en bière en tête, puis le simulé à dose égale pour les trous.
Je l'ai gardé, et je l'ai poussé jusqu'à montrer **le trou lui-même**. Dans les données, le panel n'existe
vraiment chiffré que pour Cascade. La page le dit en trois lignes, une par houblon, au premier écran :
- **Cascade** : la courbe du panel OSU (Lafontaine 2018, E04/H22), agrumes et herbacé de 0 à 16 g/L,
  sans molette. La dose lue est marquée d'un trait (3,86 g/L, la plus proche de 4 g/L). La note est
  écrite : 5,8 et 5,7 sur 15 ;
- **Idaho 7** : deux cases cochées par un panel CATA (McCabe 2023, E03) : citronnelle et tropical, et
  « force ? » : c'est une présence, sans intensité ;
- **Galaxy** : « goûté, non relevé ? » en hachuré (Sharp 2018, E09). Il a été goûté à 4 g/L, 3 j, soit
  notre base, mais les positions ne sont publiées qu'en figure et n'ont pas été relevées.
- En titre : « en blonde ; en stout ? ». Tous ces panels ont goûté une bière blonde, et le seuil en bière
  noire n'est pas mesuré (`style.biereNoire`).

Ensuite, le simulé (« ~ ») comble les trous :
- **Silhouettes** : quatre radars r3, deux par rangée (Cascade, Idaho 7, Galaxy, et ta stout avant),
  avec les mêmes 12 axes et des pictos à la place des mots ;
  - le voile va du bas au haut, c'est l'intervalle ;
  - un axe inconnu est hachuré, et le trait s'y interrompt au lieu de tomber à zéro ;
  - au-delà de l'échelle, le trait est rogné et porte un point orangé (résineux, partout).
- **Les trous** : une ligne par famille et les trois houblons dessus, à la manière de w2, en barres
  de l5b (zone de la 16D pâle, orangé au-delà, trait noir pour ma stout, trait fin du bas au haut).
  - À droite, le meneur : sa lettre et son gain en crans.
  - Un petit picto « panel » signale les familles déjà goûtées : agrumes et herbacé pour Cascade,
    tropical et herbacé pour Idaho 7. Le simulé n'y est qu'un complément.
- **Pour ta stout** : la réponse, calculée à partir de sa demande (« ma stout est trop résineuses, je la
  veux plus floral », 18.10) et des trois familles attendues en 16D.
  - Floral : Idaho 7 ~+1,3, Cascade ~+0,9, Galaxy ~+0,9.
  - Résineux : « tous ~+1,9 au moins : aucun ne le baisse ».
  - Galaxy ~+3,9 en tropicaux, hors de la 16D.
  - Le plus floral : Idaho 7, en simulé, avec une confiance moyenne, et pas goûté en floral.
- Le pont `nav` mène à Dryhopper : « Dryhopper Idaho 7, le plus floral ». Il suit le houblon mis en avant.

Le seul facteur libre est le houblon. Un toucher sur une colonne la met en avant : les autres
s'effacent partout, et les valeurs de droite deviennent les siennes. Un second toucher la retire.
L'appui long ouvre la fiche g1. La chimie et les vraies valeurs sont sous un toucher.

## Ce qui tient
- Premier écran : 79 mots sur 80. On y voit la question, le contexte (ta 16D · dose égale, 4 g/L ·
  après fermentation, 3 j · US-05), les trois colonnes (α du lot, rôle en mot, stock en icône,
  pictos marqués), le panel entier et le haut des radars.
- Honnêteté :
  - chaque vraie valeur porte `data-nature="mesure"` et sa source (E04, H22, E03, E09, Beer Maverick,
    Hopsteiner, H11…) ;
  - le simulé est marqué « ~ » ;
  - l'inconnu est « ? », hachuré, ou « inconnu » ; il n'est jamais 0 ;
  - Galaxy 3MH est écrit « non détecté », pas 0 ;
  - Idaho 7 4MMP « ≤10 » porte « ? » (à confirmer) ;
  - Galaxy porte ≠ : son lot (17,2 %) sort de ses fiches (11–16 %).
- Code couleur des arômes, pictos au trait, légende derrière « ? », lentille au style / absolu (la
  zone disparaît en absolu, échelle 0–120).
- Tout se calcule depuis `donnees/comparer-stout.json`. Le générateur vérifie que l'α du socle est celui
  du JSON. Les noms des sources et les liens composé → famille viennent de `composes-houblon.json`,
  la source déclarée du JSON.

## Ce qui casse
- 79 mots sur 80 : il n'y a plus de marge. Un mot de plus au premier écran fait échouer MOTS.
- Les « haut » simulés sont énormes (souvent 55 à 120 points). Le voile des radars couvre presque tout,
  et beaucoup de traits fins touchent le bord de la piste (petites flèches). C'est honnête, mais chargé.
- Le résineux de ta stout (83, ta dégustation) domine chaque radar. Le point orangé le dit, mais la
  silhouette des houblons en est écrasée.
- La courbe OSU vient d'une blonde à 4,75 % vol., avec du Cascade en cône entier, 24 h : ce ne sont pas
  nos conditions (après fermentation, 3 j, T-90). La page dit « en blonde », mais pas le reste au
  premier écran (c'est dans la fiche du panel et la légende).
- Le rôle « mixte » d'Idaho 7 et de Galaxy vient de la règle α v1, un prototype à valider (ENTREES,
  douteux 3).
- E09 (12 variétés à 4 g/L) contient la réponse la plus utile, mais seulement en figure. Tant qu'on ne
  l'a pas relevée, Galaxy reste « non relevé ».

## Contrôles (joués le 22.10 sur `etat.html`)
- COMMUN OK (MOTS joué à part) : COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD,
  TRAIT, LEGENDE, PARLANT, BRUTES.
- MOTS OK (79 mots, au plus 80).
- UNE-QUESTION OK (1 groupe libre : houblon).
- ACQUIS OK (4/4) : radar r3 et osu au repos, chimie et valeurs à un toucher.
- ALPHA OK.
- Pire contraste : 4,69:1, la lettre « I » d'Idaho 7 (#e80030 sur blanc), sur 116 textes mesurés.

## Fichiers
- `generer.mjs` : écrit `etat.html` (socle de `fils21-choisir/v1/socle.mjs`, en lecture).
- `captures.mjs` : écrit les états par requête (`?fiche=Galaxy`, `?ouvert&avant=Galaxy`, `?abs`,
  `?legende`).
- Captures : `captures/r6k-390.png`, `r6k-premier-ecran.png`, `r6k-fiche-390.png`,
  `r6k-toucher-390.png`, `r6k-absolu-390.png`, `r6k-legende-390.png`.
