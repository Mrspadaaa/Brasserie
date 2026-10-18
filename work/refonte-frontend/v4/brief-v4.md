# Brief v4 — outil houblons « lu au style »

Écrit le 18.10.2026 par le pilote, selon `docs/qualite/methode-conception-frontend.md`
(E2, skill impeccable `shape`). Le brasseur a dit : « Construis direct une fois un plan
sain avec les bon outil, skill et que l'ux UI soit au top niveau qualité ». Il n'y a
donc pas de tour de questions : les réponses viennent de ses messages, de l'archive et
de D17 à D19. Les hypothèses sont marquées **[H]**.

## 1. Tâche et public

- **Qui** : Gaëtan, brasseur seul, au bureau (téléphone ou portable) pendant qu'il conçoit
  une recette, parfois en cuverie. Mode impeccable : **Operate**.
- **Besoin, dans ses mots** :
  - « ma stout est trop résineuses, je la veux plus floral. La moteur nous propose
    plusieurs houblons et on peut ensuite comparé » ;
  - « Avoir une vue d'ensemble des houblons pour le style … Les échelles doivent être
    revu en fonction du style. Un écart faible pour une ipa peut être très grand pour
    un autre style » ;
  - « Si je fais une stout, je veux voir tous mes houblons qui correspondent du + au −
    à ma stout et pouvoir en comparer 2, 3, 4 facilement avec des infos ou des
    simulations » (prompt de mission) ;
  - « sur mobile en un click, sans scroll ».
- **Références qu'il a lui-même choisies** :
  - la carte Territoire (`checkpoint-05/concept-2`, « une sacrée dinguerie », captures
    dans `v4/reference/concept-2-territoire/`) ;
  - l'Explorer V5.5 (« Dans ma bière », moment, dose, levure, lentilles Arôme / Levure /
    Amertume) ;
  - la bascule Barres / Radar (« exigence acquise », 01.10) ;
  - pour la grammaire des barres de plage seulement, ses captures Beer Maverick
    (`v3/reference/beer-maverick/telephone/`).

## 2. Résultat et preuve

**Scénarios de réussite.** Le brasseur les joue à la porte B, en 5 minutes ; Playwright
les joue avant lui.

- **S1. Stout export trop résineuse.** Nugget est à 60′ ; il veut « plus floral, moins
  résineux ».
  - Il voit où sa bière se situe face au style, famille par famille.
  - Il demande la direction en 1 ou 2 gestes.
  - Il obtient au moins 2 voies tirées de son stock (houblon, moment, dose, effet prévu
    sur chaque famille, IBU, stock suffisant ou manque).
  - Il en compare 2 ou 3, puis pose la voie choisie dans la recette.
- **S2. Lager tchèque.** Laquelle de 3 houblons floraux (Saaz, Styrian, Hallertau) est la
  plus florale, et l'écart compte-t-il ? L'écart doit se lire sur l'échelle du style.
  Une petite différence absolue y prend de la place ; la même dans une IPA n'en prend
  presque pas.
- **S3. IPA, vue d'ensemble.** Tous ses houblons pour une IPA, du + au −, avec la carte et
  la liste. Il passe de l'une à l'autre sans perdre sa sélection.
- **Non-régression.** Les 30 questions de la banque gardent au moins 26 réponses
  calculées (v3 : 26 sur 30).

**Vérité propre au produit.** L'app refuse d'inventer un chiffre (PRODUCT.md). Toute
prédiction est une plage, avec sa confiance et sa source. Une échelle de style non
documentée le dit, et l'écran revient à l'échelle absolue en l'annonçant.

## 3. Direction choisie

Monde visuel : celui de DESIGN.md, inchangé (charbon chaud « cave », Source Sans 3 pour
ce qui se dit, IBM Plex Mono tabulaire pour ce qui se mesure, densité forte).

Structures envisagées, par ordre de résonance :

1. Carte Territoire revisitée.
2. Table de mixage d'arômes.
3. Bandes par famille (petits multiples).
4. Avant / après par voie.
5. Programme de houblonnage sur une ligne de temps.
6. **Feuille de dégustation au style.**
7. Liste classée avec lentille de style.

Tirage impeccable (`concept-seed --scope surface --mode operate`, clé `36178972`) : 6, 1,
7, le 6 en tête. Le brasseur a demandé de construire sans tour de choix, donc la tête du
tirage est retenue. Elle tient la vérité du produit : juger « au style » est le geste du
juge BJCP, et c'est exactement sa demande d'échelles relatives.

**Fusion** :

- la carte Territoire (n° 1) devient la lentille « Carte », pour la vue d'ensemble ;
- la liste classée (n° 7) devient la lentille « Liste », celle du stock ;
- la grammaire du défi tiré (spécimen de police variable : on tire un axe et toute la
  grille se transforme en direct) devient l'interaction signature.

### Contrat de direction

- **THÈSE** : « Ta bière, lue au style. » Chaque intensité se lit contre ce que le style
  attend. La feuille devient une table de réglage : on pousse une famille, le moteur
  répond avec des voies tirées du stock. L'écran refuse le défaut du genre : un
  catalogue avec un radar absolu, ou un déballage de fiches.
- **MONDE** :
  - Charbon cave. Chaque famille a sa piste : bande attendue du style en champ
    `cave-800`, zones hors style hachurées.
  - « Ma bière » est un repère à la couleur EBC de la recette (la loi 2 de DESIGN.md :
    l'EBC appartient à la bière).
  - La cible est un trait creux. Les houblons comparés portent 4 couleurs vérifiées en
    daltonisme et 4 formes (reprises de la v3).
  - Les chiffres sont en Plex Mono tabulaire.
- **HISTOIRE** :
  1. Il ouvre sa stout et voit d'un coup d'œil où elle se tient, famille par famille.
  2. Il pousse « floral » vers le haut et « résine » vers le bas.
  3. La liste se recompose en voies, avec doses et stock. Chaque voie montre en fantôme
     sur la feuille ce qu'elle change.
  4. Il en compare deux, il pose la meilleure dans la recette, il peut revenir en arrière.
- **PREMIER ÉCRAN (390 × 844)** :
  - **Barre de 40 px** : recette, style, litres, DI, et jauge IBU avec la bande du style.
  - **Feuille « Au style »** : 8 à 10 rangées de 24 px environ. Chaque rangée porte :
    - le nom de la famille (12 px) ;
    - une piste pleine largeur, zoomée sur la bande du style ;
    - le repère « ma bière », qui est une plage ;
    - un mot de verdict (« au style », « peu », « trop », « hors style ») ;
    - une poignée de direction.

    Les familles attendues par le style viennent d'abord, puis les familles indésirables
    présentes, puis l'amertume.
  - **Dessous, « Mes houblons »** : au moins 5 rangées visibles, avec la quantité en
    stock, un mini-profil à l'échelle du style et un « + ». Cette liste devient
    « Voies » dès qu'une direction est posée.
  - **Lentilles** : « Liste » et « Carte ».
  - **Action principale** : la poignée de direction.
- **FORME** : la feuille de dégustation au style, n° 6 de ma liste ordonnée, tête du
  tirage, clé `36178972`. Elle est fusionnée avec les n° 1 et 7, et avec la grammaire
  « axe qu'on tire, grille qui se transforme ».
- **FINISH** : « unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, DESIGN.md, and every shipping raster carrying its
  provenance ».

**Interaction signature.** Tirer (ou toucher ↑ / ↓) la cible d'une rangée. La liste se
reclasse en direct en voies. Chaque voie dessine son après sur la feuille, en fantôme. On
relâche, la cible reste.

## 4. Périmètre et limites

Révisé le 18.10 sur demande du brasseur : « c'est pour le moment juste des maquettes »,
puis « me faire 3 version à la fin plutôt qu'une ».

- **Livrable** : **trois maquettes HTML** autonomes et cliquables
  (`prototypes/houblons-v4/maquettes/version-a`, `-b`, `-c`), publiées en Artifact
  privé. Elles sont issues des tournois de mini-maquettes
  (`work/refonte-frontend/v4/tournoi/`).
  - Elles fonctionnent sur le jeu de données réel commun. Une partie non branchée est
    acceptable si elle est annoncée comme telle.
  - Les chiffres viennent du moteur V5.5, **importé** par un script Node du dossier
    `prototypes/houblons-v4/` (son propre `package.json`), sans le recopier ni modifier
    un fichier de l'app.
  - Pas de Storybook, de Playwright ni d'axe-core dans cette phase : ils sont reportés à
    l'intégration.
- **Intouchable avant la porte B** :
  - `src/`, `functions/`, `public/`, le `package.json` et la config de l'app ;
  - `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json` ;
  - les données réelles (lecture du fixture de production seulement).
- **Anti-objectifs** :
  - juger contre Beer Maverick ;
  - grossir le texte au-delà de l'échelle de DESIGN.md ;
  - un rang chiffré non crédible ;
  - un assemblage présenté comme mesuré ;
  - Gemini dans le prototype.

## 5. États et plages de données

- **Stock** : 0 à 12 houblons (fixture de production du 17.10 : 9 houblons en stock).
- **Catalogue** : 318 variétés.
- **Styles** : 123 styles BJCP.
- **Familles d'arôme** : les 12 axes V5.5, 0 à 100 (citrus, tropical, stoneFruit,
  pomeFruit, berries, melon, floral, herbal, resin, spice, green, earthy).
- **États à dessiner** :
  - aucune direction posée ;
  - direction posée, voies trouvées dans le stock ;
  - aucune voie dans le stock (voies « à acheter ») ;
  - style sans bandes documentées (échelle absolue annoncée) ;
  - prédiction incalculable (alpha manquant) ;
  - houblon sans descripteur ;
  - voie posée, avec « Annuler ».

## 6. Modèle (E3)

- **Échelle au style [H]** : pour chaque style et chaque famille, une bande attendue
  [bas, haut] sur 0–100 et un statut (attendue, neutre, indésirable).
  - Source : les mots d'intensité du guide BJCP 2021 (« low to moderate », « prominent »,
    etc.) et les familles qu'il nomme, convertis par une table publique et versionnée.
  - Documenté d'abord pour les styles des scénarios et les 12 styles déjà fixés en v3 ;
    les autres reviennent à l'échelle absolue, annoncée.
  - Chaque piste est zoomée sur la bande du style, avec une marge.
  - Seuil d'écart sensible [H] : une fraction de la largeur de bande. En dessous, la
    feuille écrit « ≈ ». La fraction et la table sont à faire valider par le brasseur,
    et l'écran le dit.
- **Moteur** : la prédiction V5.5 (`hopPredictionCore`, `hopExtrapolationCore`,
  `hopRecipePrediction`, `solver`) donne des plages par famille, pour un ajout et pour la
  recette. Le prototype ajoute quatre choses, dans son propre code :
  1. une direction relative à la recette courante (« plus floral » = monter d'un cran
     de bande), au lieu de la seule exclusion ;
  2. le stock d'abord (stock libre), puis « à acheter » ;
  3. les voies : ajouter, augmenter ou diminuer, remplacer à IBU égal (amertume) ou à
     masse égale (arôme), assemblage de 2 houblons. L'assemblage est marqué « estimé » ;
  4. un classement lexicographique comme V5.5 : conflits, puis distance à la cible à
     l'échelle du style, puis stock, puis dérive d'IBU.
- **Amertume** : formules de `BrewingMath` (reprises de la v3).
- **Réponses aux 30 questions** : portées depuis la v3.

## 7. Interaction et mise en page

- **Hiérarchie** : la feuille au style, puis la liste ou les voies, puis la comparaison.
  La carte est une lentille, pas un écran à part.
- **Comparer** : cocher 2 à 4 houblons ou voies. Bascule Barres / Radar, les deux à
  l'échelle du style, mêmes couleurs, mêmes formes. Explications à la demande (densité).
- **Bureau, 1280** : feuille à gauche, liste ou voies au centre, comparaison à droite.
  Rien n'est caché derrière un mode.
- **Retour d'action** : une voie posée affiche « Annuler » en ligne, sans rien couvrir.
  Le mouvement ne répond qu'à une action (150 à 250 ms), avec `prefers-reduced-motion`
  respecté.

## 8. Contraintes et décisions que le constructeur ne doit pas inventer

- La table bande ↔ mots BJCP et le seuil d'écart : proposés, versionnés et sourcés, puis
  marqués « à valider ».
- Le comptage des touchers du brief : stout en un toucher sans défiler, avec 5 houblons et
  leur quantité visibles ; comparer en 3 touchers au plus (D10, D15).
- Langue française, tutoiement, virgule décimale, pas de « (s) » (DESIGN.md).
- Exigences de l'inventaire `v4/exigences-retrouvees.md`, une fois vérifié : chaque
  exigence absente est traitée, ou écartée avec sa raison.

## 9. Exigences retrouvées, vérifiées le 18.10 (60 citations sur 61 mot pour mot)

Script de vérification : `v4/outils/check-citations.mjs`. Son témoin négatif fait
échouer les 61. R56 ne diffère que d'une espace collée dans la source.

| Exigence | Traitement en v4 |
|---|---|
| R40 Carte concept-2 appréciée, outil complémentaire | Lentille « Carte » : vue d'ensemble du style, sélection partagée avec la liste |
| R41 Le style et la bière réelle changent la lecture des écarts ; pas de « lager = ×3 / stout = ×0,2 » | Bandes par style **et** par famille ; masquage du contexte de recette via le facteur de matrice V5.5, marqué hypothèse |
| R42 et R56 Granularité fine en IPA, sans zoom qui invente | Verdict d'écart fondé sur les plages de prédiction : « ≈ » quand elles se recouvrent, quel que soit le zoom |
| R43 et R44 Double impact de la levure, y compris dans les réponses usuelles | Expression levure du modèle V5.5 quand la souche est caractérisée, sinon « inconnue » ; dry hop en fermentation active, « estimé » |
| R45, R46, R47 et R49 Barres / Radar | Bascule dans la comparaison, mêmes données et réglages, échelles communes, ordre stable, pas de fusion d'unités ; lisible à 390 et à 1280 ; scénario Playwright aller-retour |
| R48 Plages honnêtes, inconnue non nulle | « inconnu » affiché, jamais 0 ; pas de « 95 % » |
| R08 et R10 L'IBU ne domine pas ; unités | Jauge IBU compacte dans la barre ; doses en g et g/L ; IBU total |
| R03 Sauvegarder et retrouver | État de la recette conservé dans le navigateur (commodité par visiteur) |
| R06, R09 et R37 Boosters, mobile d'abord, ne pas se brider sur l'app actuelle | Feuille au style, voies en fantôme, carte : représentations propres à la tâche |
| R60 Ne pas cloner un site concurrent | Beer Maverick ne sert que de grammaire de barre de plage |
| R50 et R53 Gemini crée et enrichit des données, outils métier exécutables | **Écartées pour la v4** : le prototype est hors ligne et sans Gemini (règle de test). L'API du moteur reste pure et typée, pour devenir un outil métier à l'intégration |
| R02, R04, R05, R07, R11, R12, R26, R27, R61 (méthode et concepts) | Portées par la méthode (`docs/qualite/methode-conception-frontend.md`) et par le tirage de structures |
