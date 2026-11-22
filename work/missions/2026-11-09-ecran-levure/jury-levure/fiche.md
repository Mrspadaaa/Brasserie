# Cadrage de l'étape « Levure 4/7 » : fiche du jury (09.11, niveau rapide)

## Hypothèse
- **Avant** (65 %) : la levure, ce qu'elle change, sa dose calculée ; changer en un toucher ; achat et conduite repliés.
- **Après** (80 %) : la levure et **sa dose** d'abord, dans la langue de p6-b2 (une ligne, le champ toujours prêt). Ses repères viennent en
  représentation, avec des plages honnêtes. « Ce que la levure change » est un **axe**, pas le cœur imposé : son mot du 18.10 visait a2b,
  pas cette étape (L01). L'achat et la conduite sont repliés, la conduite résumée en une ligne vers Paliers.

## Tranché
| n° | Question | Réponse | Source |
|---|---|---|---|
| J2 | Le geste | Voir la levure et sa dose ; changer en un toucher ; comparer à un toucher, jamais au repos. | SPEC l. 668 « choisir une levure remplis aussi sa dose (gram, sachet) » ; 18.10 « Ensuite seulement je peux ouvrir mon panel de comparatif » |
| J3 | Pourquoi | L'écran est un dossier d'achat. « Brouillon non enregistré », la ligne Paliers, les offres et les prix passent avant la levure, et la dose ne se voit pas. Le code **efface** la dose au choix d'une levure (`BrewWizard.tsx:2962`) : #132 n'est pas tenu. | captures inventaire ; Contradicteur |
| J4 | Réussite | À 390 px, au premier écran, on voit : la levure, sa dose en sachets (plage), trois repères en représentation, le changement à un toucher. 80 mots au plus, aucun prix ni « Brouillon » au repos, rien d'inventé. | Brasseur ; Contradicteur |
| J5 | Acquis | Garder : le catalogue de 1 734 références, la saisie hors catalogue, la fiche corrigeable, Comparer, le produit exact (il fonde la dose), les deux données de conduite (rien n'est supprimé). | Contradicteur (`yeastPitching.ts:99`) |
| J7 | Honnêteté | Une sèche se dose par le repère du fabricant (g/hL) × le volume, en plage de sachets arrondie au sachet supérieur à chaque bout, **sans OG** (`yeastPitching.ts:116-119`). « Aucun taux universel n'est présumé » (`:126`). FG et alcool **en plage** seulement. Une floculation inconnue s'écrit « à renseigner ». Les mots anglais (« Low », « Medium », « esters ») se traduisent (D97). Une biotransformation non documentée se dit « non documentée ». | Contradicteur ; DEFAUTS D97 |
| J9 | Code et récit | La conduite a trois écrivains : Levure (`:2978`), Paliers (`:3138-3152`) et Identité (`:2507`). Dose d'une liquide : en milliards de cellules (`yeastPitching.ts:131`). Deux levures existent déjà en données (`cultureRoles`, `YeastRecipeChoice.tsx:224`). | Contradicteur |
| J10 | Premier plan | La ligne ou la carte de la levure, la dose et trois repères (atténuation, température, floculation). Repliés : produit exact et offres, sources, fiche complète, programme détaillé. La conduite en une ligne résumée qui mène à Paliers. | Brasseur ; pilote |
| J11 | Cas limites | Pas de levure ; levure hors catalogue ; levure liquide (paquet, cellules) ; deux levures (relais kveik puis Brett) ; dose sans produit lié (« choisis le sachet pour la dose ») ; atténuation en plage ; floculation inconnue ; hors ligne. | Brasseur ; Contradicteur |
| J13 | Approches | (a) une ligne (langue p6-b2) est la base, (b) une carte portrait avec jauges. Leur choix est un **goût**. (c), l'effet sur la bière d'abord, est un axe, montré avec des plages. | Brasseur (SOURCE p6-b2) ; Contradicteur |
| J15 | Le vouloir | « voir ce que la levure change » : un axe montré (A4), à juger par lui. | les deux regards |
| J16 | Irréversible | Rien dans le lot. Au port : aucune écriture de stock, aucune IA (`RecipeAutoComplete … yeastEnrichment` monté à l'étape : à mesurer). | les deux regards |

## Hypothèses du pilote (réversibles, à recopier dans chaque brief)
1. Dans les maquettes, la conduite s'écrit en une ligne résumée (« 18–20 °C · 2 paliers · fin J15 › Paliers »). Le propriétaire de la
   conduite dans le code est une décision du **port**, pas de ce lot.
2. La recette de démonstration : 30 L, OG 1,066. La levure est la SafAle US-05 (Fermentis, sèche), avec les vraies données de
   `src/data/yeastCatalogueBootstrap.json` (`fermentis-us05`) :
   - dose du fabricant 50–80 g/hL, sachet de 11,5 g, soit **2–3 sachets (15–24 g)** ;
   - atténuation 78–82 %, soit une FG de 1,012–1,015 et un alcool d'environ 6,8–7,1 % vol (en plage, calculs à porter) ;
   - température 18–26 °C ; tolérance à l'alcool 9–11 % vol ;
   - esters « faibles » ; floculation **à renseigner** ; β-lyase **non documentée**.
3. Un second état montre le produit exact non choisi : la dose dit « choisis le sachet pour la dose », jamais un chiffre.
4. Le changement de levure suit la langue de p6-b2 et s1 : un champ toujours prêt, avec sous lui des puces (stock d'abord, puis habituelles).

## Axes de variantes (les axes des séries v0)
| Axe | Options, la baseline d'abord | Ses mots |
|---|---|---|
| A1. La forme | la carte actuelle compactée · une ligne (p6-b2) · une carte portrait avec jauges | p6-b2, sa langue |
| A2. La dose | un texte sous la levure · des sachets entiers en pastilles (2–3) avec leur plage en g · une jauge de la plage du fabricant avec la dose choisie | « gram, sachet » (l. 668) |
| A3. Le choix | la liste à ouvrir · un champ toujours prêt avec des puces · un duel de deux levures à un toucher | 18.10 « panel de comparatif » ensuite |
| A4. Ce que la levure change | rien au repos · FG et alcool en plage sur le bandeau · un profil en mots français (esters, phénols) avec la biotransformation, ou « non documentée » | l. 328 ; l. 675 « Ça a été oublié ? » |

## Accords groupés
- Au port : aucune écriture de stock, aucun appel IA ; le propriétaire de la conduite tranché alors (conseil si besoin).

## À mesurer
- Au port : la dose rétablie au choix d'une levure (#132, `BrewWizard.tsx:2962`) ; la FG en plage ; aucun appel IA au repos.

## Désaccords du jury
- Le cœur de l'étape : pour le Brasseur, la dose et l'effet ; pour le Contradicteur, la dose seule, l'effet n'étant qu'une lecture large. Retenu :
  la dose est le cœur, l'effet est l'axe A4.
- La conduite : le Contradicteur voulait un conseil avant les maquettes. Retenu : une ligne résumée dans les maquettes, la décision au port.

## Coût
Deux appels : Brasseur (Fable, 37 k jetons), Contradicteur (Opus, 63 k jetons).
