# sbb4 · Substituer, série b (la réponse d'abord)

Chaleur : tiède. Question : « Lequel à la place de Nugget ? » ; facteur libre : le remplaçant ; fixés : la stout 16D, Nugget 46 g à 60′, la règle « même IBU » (59,7).

- **Idée** : Ma bière dit la réponse : les douze familles avant (rond) et après, l’IBU dans la zone 50–70 et les grammes face au stock ; la phrase dit « ma bière ne bouge presque pas ».
- **Ce qui tient** : La leçon de brasseur visible sans la lire : à 60′ le choix ne change pas l’arôme, et le résineux reste hors du style quel que soit le remplaçant (écrit en bas) ; les onglets en tête font le seul facteur libre.
- **Ce qui casse** : Douze rangées presque vides à 60′ : le dessin montre surtout l’absence d’effet ; les quatre familles inconnues prennent de la place ; le nom de la réponse n’est pas plus grand que le reste.

Baseline suivie, aucun écart : pictos de famille au trait (planche fils17-standard/v3, épicé = cannelle et clou croisés `p-spice`), couleurs des familles, α du lot puis plage des fiches (« ≠ » quand le lot en sort), usage en mot, stock en petit badge (boîte, boîte « − » pour un stock court, chariot pour l'achat), lentille Au style / Absolu (au style par défaut) et barres l5b face à la zone de la 16D, thème blanc, croix pour sortir, légende derrière « ? », fiche g1 courte à l'appui long. Pas de bouton Annuler (D120) : seul « Remplacer › ».
Honnêteté : « ~ » sur tout le simulé ; inconnu en « ? » ou hachures (Noyau, Pépins, Baies, Melon de ma bière ; huiles d'Altus et Trident ; cohumulone) ; la part « autres » de Nelson Sauvin (83 %) dessinée ; « arôme 100 » de la porte renommé « rien d'étranger » (à 60′ le moteur ne compte que l'arôme que le remplaçant ajoute) ; à 60′, aucun « perd floral » : ma bière ne bouge que de ~±1 et c'est dit.

Plancher : u4 (`fils11-substitution/u4/vue.html`, capture `u4-vue-390.png`) et la porte de la maquette (`choix/commentaires/captures/p22-substituer-repos.png`), enrichis.
Données : moteur du parcours en direct (`sbb1/moteur-sbb.ts` → `sbb1/donnees-sbb.json`) : `remplacants` (style 16D, en stock d'abord), `lireBiere` après `remplacer` (dose à IBU égal), `houblon` (α du lot, plage des fiches, rôle, mots sans famille). Rien de recopié à la main.
Générateur : `sbb1/generer-sbb.mjs` (socle `socle-sbb.mjs`, briques `briques-sbb.mjs`, concepts `concepts-sbb*.mjs`) ; captures : `sbb1/capturer-sbb.mjs`.

## Captures
`captures/sbb4-premier-ecran.png`, `captures/sbb4-page.png`, `captures/sbb4-geste.png` (un toucher sur Galaxy, ou Idaho 7 pour sbb7 : réponse, ma bière et pied changent), `captures/sbb4-fiche.png` (appui long).

## Contrôles (joués une fois)
- Baseline (`controle-commun --sans=mots`, sur la série) : mots       sauté (--sans) · couleurs   OK · au-style   OK · survol     OK · blocs      OK · contraste  OK · fiche      OK · standard   OK · trait      OK · legende    OK · parlant    OK · brutes     OK · COMMUN OK
- Une question (D98) : sbb4 · titre « Lequel à la place de Nugget ? » · libres : houblon · 5 contrôle(s) · contexte : base, moment, dose → UNE-QUESTION OK (1 groupe libre : houblon)
- Sans famille (D100) : sbb4 · 4 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) → SANS-FAMILLE OK (8 houblon(s) au-dessus de 50 %, part « autres » visible)
- Mots au premier écran, hors données : sbb4 82 mots (hors données) (> 80) ; tous les mots : sbb4 150 mots (> 80) (80 au plus, indicatif)
- Panel de la série (`controle-panel`) : 8 captures · remplissage médian 0,58, 0 sous 0,50 · ressemblance moyenne 0,87 · paires presque identiques 0/28 (0 %) · PANEL OK
