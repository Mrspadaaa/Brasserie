# sbb5 · Substituer, série b (la réponse d'abord)

Chaleur : tiède. Question : « Lequel à la place de Nugget ? » ; facteur libre : le remplaçant ; fixés : la stout 16D, Nugget 46 g à 60′, la règle « même IBU » (59,7).

- **Idée** : Trois réponses, trois raisons : « Sans rien acheter » (Nelson Sauvin), « Le moins de matière » (Galaxy, α 17,2), « Le plus proche » (Magnat, à acheter, tout connu) ; trois cartes qui se choisissent.
- **Ce qui tient** : La réponse dépend de la contrainte du brasseur, et l’écran le dit sans question ; chaque carte : α, usage, stock, arômes, score et ses trois composantes, ce qu’il restera ; écran plein.
- **Ce qui casse** : Trois cartes de même gabarit : répétitif ; les critères « moins de matière » et « le plus proche » sont des tris de cette page sur les données du moteur ; Idaho 7 et Sabro (93, stock court) n’y figurent pas.

Baseline suivie, aucun écart : pictos de famille au trait (planche fils17-standard/v3, épicé = cannelle et clou croisés `p-spice`), couleurs des familles, α du lot puis plage des fiches (« ≠ » quand le lot en sort), usage en mot, stock en petit badge (boîte, boîte « − » pour un stock court, chariot pour l'achat), lentille Au style / Absolu (au style par défaut) et barres l5b face à la zone de la 16D, thème blanc, croix pour sortir, légende derrière « ? », fiche g1 courte à l'appui long. Pas de bouton Annuler (D120) : seul « Remplacer › ».
Honnêteté : « ~ » sur tout le simulé ; inconnu en « ? » ou hachures (Noyau, Pépins, Baies, Melon de ma bière ; huiles d'Altus et Trident ; cohumulone) ; la part « autres » de Nelson Sauvin (83 %) dessinée ; « arôme 100 » de la porte renommé « rien d'étranger » (à 60′ le moteur ne compte que l'arôme que le remplaçant ajoute) ; à 60′, aucun « perd floral » : ma bière ne bouge que de ~±1 et c'est dit.

Plancher : u4 (`fils11-substitution/u4/vue.html`, capture `u4-vue-390.png`) et la porte de la maquette (`choix/commentaires/captures/p22-substituer-repos.png`), enrichis.
Données : moteur du parcours en direct (`sbb1/moteur-sbb.ts` → `sbb1/donnees-sbb.json`) : `remplacants` (style 16D, en stock d'abord), `lireBiere` après `remplacer` (dose à IBU égal), `houblon` (α du lot, plage des fiches, rôle, mots sans famille). Rien de recopié à la main.
Générateur : `sbb1/generer-sbb.mjs` (socle `socle-sbb.mjs`, briques `briques-sbb.mjs`, concepts `concepts-sbb*.mjs`) ; captures : `sbb1/capturer-sbb.mjs`.

## Captures
`captures/sbb5-premier-ecran.png`, `captures/sbb5-page.png`, `captures/sbb5-geste.png` (un toucher sur Galaxy, ou Idaho 7 pour sbb7 : réponse, ma bière et pied changent), `captures/sbb5-fiche.png` (appui long).

## Contrôles (joués une fois)
- Baseline (`controle-commun --sans=mots`, sur la série) : mots       sauté (--sans) · couleurs   OK · au-style   OK · survol     OK · blocs      OK · contraste  OK · fiche      OK · standard   OK · trait      OK · legende    OK · parlant    OK · brutes     OK · COMMUN OK
- Une question (D98) : sbb5 · titre « Lequel à la place de Nugget ? » · libres : houblon · 3 contrôle(s) · contexte : base, moment, dose → UNE-QUESTION OK (1 groupe libre : houblon)
- Sans famille (D100) : sbb5 · 3 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) → SANS-FAMILLE OK (8 houblon(s) au-dessus de 50 %, part « autres » visible)
- Mots au premier écran, hors données : sbb5 93 mots (hors données) (> 80) ; tous les mots : sbb5 180 mots (> 80) (80 au plus, indicatif)
- Panel de la série (`controle-panel`) : 8 captures · remplissage médian 0,58, 0 sous 0,50 · ressemblance moyenne 0,87 · paires presque identiques 0/28 (0 %) · PANEL OK
