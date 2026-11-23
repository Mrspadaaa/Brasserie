OK — Comparer r6i : Nelson épinglé, doses d'effet égal en escalier, radars r3, option A

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/generer.mjs` : produit etat.html depuis
  `donnees/comparer-stout.json`. Il reprend le runtime de la fiche g1, les pictos au trait et
  l'habillage de l8g.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/etat.html`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/NOTE.md` : section « Choix portés », angle,
  ce qui tient, ce qui casse, pire contraste.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/captures.mjs` : capture les quatre vues.
  La fiche s'ouvre par un vrai appui long tactile de 750 ms sur le nom de Nelson Sauvin.
- Captures dans `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/` : `r6i-390.png`,
  `r6i-premier-ecran.png`, `r6i-fiche-390.png`, `r6i-toucher-390.png`.

## Critères (rejoués depuis la racine, dernier passage)
- G1 : `COMMUN OK`. Couleurs, au style, survol, blocs, contraste, fiche, standard, trait, légende,
  parlant et valeurs brutes sont OK.
- G2 : `r6i 78 mots` puis `MOTS OK`.
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`.
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`. Radar r3 et OSU au repos ; chimie et
  valeurs à un toucher.
- G5 : `ALPHA OK` (4 voies sur 4).
- G6 : `EXISTENT OK 7`.
- G7 : `NOTE OK`.
- G8 : `NOTE OK`. La recherche `grep -P "[\x00-\x08]"` ne trouve un caractère de contrôle que dans
  `controle-une-question.mjs`, sur une ligne.

Essais utilisés :
- G2 : 4 (119, puis 88, 85, 78 mots). Les trois premiers passages ont servi à mesurer puis à couper.
- G3 : 2. Le premier a échoué, voir le doute 1.
- Les autres critères : 1 chacun.

## Captures ouvertes et jugées
- `r6i-premier-ecran.png` : en trois secondes, Nelson 4 g/L, puis Cascade ~2,2, Idaho 7 ~4,1 et
  Galaxy ~1,3 g/L, avec les grammes. Les pistes de dose forment un escalier lisible. Viennent ensuite
  les quatre radars, chaque candidat sous la silhouette noire de Nelson.
- `r6i-390.png` (page entière), dans l'ordre :
  - les barres de Cascade contre Nelson, avec « Nelson ? » sur les Petits fruits ;
  - le taux d'échange ;
  - « Ce qu'aucun ne remplace » ;
  - l'OSU, avec la dose de Cascade marquée ;
  - les deux boutons des acquis.
- `r6i-fiche-390.png` : la fiche g1 de Nelson Sauvin, ouverte par appui long. On y voit l'option A
  (Baies 2/2 : groseille à maquereau, gooseberry) et « sans famille : vin blanc, fruité, raisin +4 ».
- `r6i-toucher-390.png` : Galaxy mis en avant (+2 tropicaux, −1 épicé, « Nelson ? » sur Noyau et
  Baies), puis la chimie ouverte d'un toucher. Les plages s'affichent par houblon ; les thiols de
  Nelson sont « inconnu » et le 3MH de Galaxy « non détecté ».

Ma prédiction de sa réaction : « l'escalier des doses avec Nelson en cible c'est vachement bien,
mais les quatre radars se ressemblent à cause du résineux. Et on voit enfin que Nelson c'est autre
chose que des agrumes. »

## Doutes et limites
1. **Défaut dans `controle-une-question.mjs` (D98), hors de mon périmètre.** La table `NOMME`
   (ligne 66) contient un caractère retour arrière littéral (0x08) là où un `\b` était voulu, dans
   `/^(moment|jours?|dur[ée]e)\x08/i` et dans `/^(houblons?|vari[ée]t[ée]s?)\x08/i`. Une étiquette
   comme « Houblon Cascade : ~2,2 g/L » n'est donc jamais reconnue comme portant seulement le
   houblon, et le « g/L » y est lu comme un second facteur.
   - Contournement : `aria-label="Mettre en avant <nom>"` sur les boutons, la dose étant portée par
     `aria-describedby`. Je n'ai pas modifié le contrôle.
   - À corriger par le pilote, avec un témoin.
2. **Référence de l'effet égal.** J'ai pris Nelson 4 g/L (la dose égale du lot) au lieu de la
   référence du fichier, Cascade 4 g/L (soit Nelson 7,4 g/L).
   - Même règle d'interpolation que `extraire-comparer.mjs` ; le taux d'échange est stable entre les
     deux références (0,56 contre 0,54 ; 1,02 et 1,02 ; 0,33 et 0,33).
   - Les doses diffèrent donc de celles du fichier (Cascade 2,2 au lieu de 4,0) ; la NOTE l'explique.
3. **Lien composé → familles.** Il est lu dans `prototypes/houblons-v4/data/composes-houblon.json`
   (`familles.liens`), et non dans comparer-stout.json, qui cite ce fichier comme source mais ne
   contient pas ce lien.
4. **α de Nelson.** La page affiche la plage des fiches (10–14 %, `data-source="fiches"`), pas le
   9,6 « lu sur l'article » : il est hors des sources et le houblon n'est pas en stock.
   - Idaho 7 garde son 12,7 en α du lot, comme le fait la base l8g.
   - Son stock reste sans icône, faute de donnée.
5. **Option A ne touche que la fiche.** Le moteur ne chiffre pas les Petits fruits de Nelson
   (« ? »). `controle-sans-famille` (D100, hors GATES) échoue sur Nelson à 83 %, ce qui est attendu
   sans la part « autres » de B.
6. **Le picto « épicé »** est l'ancien, déjà refusé : la planche r4 n'est pas tranchée.
7. **La marge des 80 mots est mince** (78). Un espace de 24 px garde le titre des barres sous le pli.
8. **Polices.** Source Sans 3 et IBM Plex Mono viennent de Google Fonts. Hors ligne, le navigateur se
   rabat sur les polices système ; les nombres sont donc en Source Sans avec chiffres tabulaires.
9. **Fichiers à la racine.** `git status` montre `loupe.html` et `loupe.png` non suivis à la racine.
   Ils ne viennent pas de cette voie.

DÉCISION À PRENDRE : la cible de l'effet égal pour la porte « Je n'ai pas X ». Deux options :
- (a) X à la dose égale du lot (4 g/L), comme r6i ;
- (b) la référence commune du fichier (Cascade 4 g/L, X à 7,4 g/L).

Je recommande (a) avec le taux d'échange affiché : c'est la question du brasseur (« combien de
grammes au lieu de mes grammes de Nelson »), et le taux ne dépend presque pas du choix. Décideur :
le pilote, au moment d'harmoniser les variantes.

CONNAISSANCE : Remplacer Nelson Sauvin à agrumes égaux (dry hop après fermentation, 3 j, US-05,
moteur profil-simule du 22.10) demande, pour 1 g de Nelson, 0,56 g de Cascade, 1,02 g d'Idaho 7 ou
0,33 g de Galaxy. Ce taux est stable entre 4 et 7,4 g/L de Nelson.
- Écart de profil simulé : Cascade est le plus proche de Nelson (~2,8 crans), devant Galaxy (~3,8)
  et Idaho 7 (~6,5).
- Ce que les candidats ajoutent : Galaxy du tropical (+2 crans), Idaho 7 du tropical, du floral et
  du résineux ; tous perdent l'épicé simulé de Nelson.
- Limite : la confiance du moteur sur Nelson est « faible », et 67 % de ses mots (vin blanc, raisin,
  sauvignon blanc) restent hors des familles même avec A. Note candidate : `metier/`, à côté de
  [[descripteurs-hors-familles]].

LEÇON PROPOSÉE : un contrôle écrit avec des regex dans une chaîne ou un gabarit peut perdre ses `\b`,
qui deviennent un caractère 0x08 littéral. D98 a ainsi une table `NOMME` morte depuis sa création, et
ses témoins ne l'ont pas vu parce qu'aucun n'utilise d'étiquette « Houblon … » ou « Moment … ».
- À faire : chercher les caractères de contrôle dans les contrôles
  (`grep -P "[\x00-\x08]" tournoi/outils/*.mjs`), et donner à chaque branche d'un contrôle un témoin
  qui l'exerce.
- Rôles : pilote, exécutant.
