# sbb7b · Substituer, passe 2 de sbb7 : la cible (chaude, la réponse en figure)

Chaleur : chaude (passe 2). Question : « Lequel à la place de Nugget ? » ; facteur libre : le remplaçant ; contexte : la stout 16D, Nugget 46 g à 60′ ou au whirlpool (la puce, un toucher), la règle « même IBU ».

- **Idée** : Nugget au centre, chaque remplaçant à la distance de son score ; à gauche ton stock, à droite l’achat ; la réponse est le point cerclé. Les points sont des éléments du DOM ; les boîtes, en colonnes et reliées à leur point, sont les boutons ; chacune dit α, dose « ~ », score « ~ », stock et manque.
- **Ce qui tient** : Mesure au DOM (capturer-b.mjs) : 16 éléments à 60′ (8 points, 8 boîtes), 18 au whirlpool (9 et 9), aucun chevauchement ; Magnat, Trident et Yeoman ne se touchent plus (angles −60° à 60°, rayon plancher hors du disque de Nugget). Ton stock montré : les trois premiers du moteur, la réponse et Nelson Sauvin.
- **Ce qui casse** : L’échelle de distance se resserre sous 80 (l’ordre est gardé, les cercles 80, 65, 50 donnent l’échelle) ; les traits de liaison se croisent un peu au whirlpool ; bas de page vide sous « Si tu achètes ».

Retouches du conseil (conseil-sb/verdict.md) appliquées : la paire 60′ / whirlpool par la puce de contexte (bouton `data-edite="moment"` qui ouvre une feuille « à 60′ / au whirlpool », un toucher) ; « Annuler » à côté de « Remplacer » (D120), recette inchangée ; « ~ » sur chaque score et chaque dose, plage hachurée « ~79–99 » quand une composante manque (Altus, Trident ; calcul de la page comme u4, poids du moteur du moment) ; dose en plage pour un houblon sans lot (Magnat ~37–54 g), jamais « 44 g » sec ; α du lot, sinon la plage des fiches (Magnat α 11–16, pas « 13,5 % ») ; stock et manque sur chaque ligne (« 30 g · −15 ») ; « Si tu achètes : … » ; « autres 83 % » de Nelson Sauvin dans les deux états ; aucun poids (« ×0,6 ») à l'écran : la méthode est derrière « ? » ; à 60′ la composante d'arôme s'appelle « rien d'étranger », au whirlpool « arôme » (contexte du moteur). Chaque ligne porte `data-ibu46`, `data-dose`, `data-alpha` (D124).
Baseline suivie, aucun écart (pictos au trait, épicé p-spice, couleurs des familles, usage en mot, stock en badge, au style par défaut, croix, légende « ? », fiche à l'appui long, thème blanc).
Données : `sbb7b/moteur-sbb.ts` → `sbb7b/donnees-sbb.json` (moteur du parcours en direct : `remplacants` style 16D en stock d'abord, `substitutes` pour la fiabilité et le rangement « cher pour amériser », `lireBiere` après `remplacer`). Générateur `sbb7b/generer-b.mjs`, socle `sbb7b/socle-b.mjs`, captures `sbb7b/capturer-b.mjs`.

## Nombres recomptés sur le moteur (lignes montrées)
- à 60′ (Nugget 46 g = 59,73 IBU ; 318 candidats ; réponse « sans rien acheter » : Nelson Sauvin ; « si tu achètes » : Magnat) :
  - Nelson Sauvin : 86 très proche · dose 62 g · α 9,6 (lu sur l’article) · 46 g = 44,1 IBU · stock 100 g, reste 38 · IBU de l’ajout 59,5
  - Galaxy : 85 très proche · dose 35 g · α 17,2 (fiche de stock) · 46 g = 79,0 IBU · stock 60 g, reste 25 · IBU de l’ajout 60,1
  - Idaho 7 : 93 très proche · dose 47 g · α 12,7 (lu sur l’article) · 46 g = 58,4 IBU · stock 20 g, manque 27 · IBU de l’ajout 59,6
  - Sabro : 93 très proche · dose 45 g · α 13,4 (lu sur l’article) · 46 g = 61,6 IBU · stock 30 g, manque 15 · IBU de l’ajout 60,2
  - Altus : 99 (plage 79–99, huiles inconnues) très proche · dose 32–40 g · α 15–18,5 (plage des fiches) · 46 g = 68,9–85,0 IBU · stock à acheter · IBU de l’ajout 60,2
  - Magnat : 99 très proche · dose 37–54 g · α 11–16 (plage des fiches) · 46 g = 50,5–73,5 IBU · stock à acheter · IBU de l’ajout 59,3
  - Trident : 99 (plage 79–99, huiles inconnues) très proche · dose 43–54 g · α 11–14 (plage des fiches) · 46 g = 50,5–64,3 IBU · stock à acheter · IBU de l’ajout 59,9
  - Yeoman : 99 très proche · dose 37–50 g · α 12–16 (plage des fiches) · 46 g = 55,1–73,5 IBU · stock à acheter · IBU de l’ajout 60,1
- au whirlpool (Nugget 46 g = 9,04 IBU ; 318 candidats ; réponse « sans rien acheter » : Citra cryo ; « si tu achètes » : Falconer's Flight) :
  - Target : 86 très proche · dose 53 g · α 11,3 (fiche de stock) · 46 g = 7,9 IBU · stock 5 g, manque 48 · IBU de l’ajout 9,1
  - Idaho 7 : 82 très proche · dose 47 g · α 12,7 (lu sur l’article) · 46 g = 8,8 IBU · stock 20 g, manque 27 · IBU de l’ajout 9,0
  - Sabro : 73 proche · dose 45 g · α 13,4 (lu sur l’article) · 46 g = 9,3 IBU · stock 30 g, manque 15 · IBU de l’ajout 9,1
  - Citra cryo : 63 partiel · dose 24 g · α 24,8 (lu sur l’article) · 46 g = 17,3 IBU · stock 65 g, reste 41 · IBU de l’ajout 9,0
  - Nelson Sauvin : 42 éloigné · dose 62 g · α 9,6 (lu sur l’article) · 46 g = 6,7 IBU · stock 100 g, reste 38 · IBU de l’ajout 9,0
  - Falconer's Flight : 83 très proche · dose 50–63 g · α 9,5–12 (plage des fiches) · 46 g = 6,6–8,3 IBU · stock à acheter · IBU de l’ajout 9,1
  - Sterling : 82 très proche · dose 70–109 g · α 5,5–8,5 (plage des fiches) · 46 g = 3,8–5,9 IBU · stock à acheter · IBU de l’ajout 9,0
  - Stirling : 81 très proche · dose 50–100 g · α 6–12 (plage des fiches) · 46 g = 4,2–8,3 IBU · stock à acheter · IBU de l’ajout 9,0
  - Talus : 81 très proche · dose 63–74 g · α 8,1–9,5 (plage des fiches) · 46 g = 5,6–6,6 IBU · stock à acheter · IBU de l’ajout 9,0

## Captures
`captures/sbb7b-60.png`, `captures/sbb7b-whirlpool.png` (toucher sur la puce, puis « au whirlpool »), `captures/sbb7b-feuille-moment.png`, `captures/sbb7b-page.png`, `captures/sbb7b-whirlpool-page.png`, `captures/sbb7b-geste.png` (toucher sur Galaxy : réponse, ma bière et pied changent), `captures/sbb7b-fiche.png`.

## Contrôles (G2 à G5 de sb-passe2, plus D100)
  - COMMUN OK
  - sbb5b · titre « Lequel à la place de Nugget ? » · libres : houblon · 3 contrôle(s) · contexte : base, moment, dose
  - sbb7b · titre « Lequel à la place de Nugget ? » · libres : houblon · 8 contrôle(s) · contexte : base, moment, dose
  - UNE-QUESTION OK (1 groupe libre : houblon)
  - sbb5b 62 mots (hors données)
  - sbb7b 70 mots (hors données)
  - MOTS OK
  - COHERENCE-IBU OK (12 lignes)
  - sbb5b · 3 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓)
  - sbb7b · 5 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓)
  - SANS-FAMILLE OK (2 houblon(s) au-dessus de 50 %, part « autres » visible)
