# sbb5b · Substituer, passe 2 de sbb5 : trois raisons (tiède)

Chaleur : tiède (passe 2). Question : « Lequel à la place de Nugget ? » ; facteur libre : le remplaçant ; contexte : la stout 16D, Nugget 46 g à 60′ ou au whirlpool (la puce, un toucher), la règle « même IBU ».

- **Idée** : Trois cartes qui répondent chacune à une contrainte : « Sans rien acheter » (le premier du moteur dont le stock suffit), « Le moins de matière » (sinon « Le plus proche, stock court » quand c’est le même houblon), « Si tu achètes » (le plus proche, tout connu). Au whirlpool, Nelson Sauvin a sa ligne, avec « autres 83 % ».
- **Ce qui tient** : À 60′ : Nelson Sauvin ~62 g, Galaxy ~35 g, Magnat ~37–54 g (α 11–16). Au whirlpool la réponse change : Citra cryo ~24 g (~63 partiel) est à la fois sans achat et le moins de matière ; Target ~86 est le plus proche mais 5 g (−48) ; Falconer’s Flight ~50–63 g si tu achètes. Les houblons que le moteur range « cher pour amériser » à 60′ (Citra cryo, Target) ne sont pas proposés comme « moins de matière ».
- **Ce qui casse** : Trois cartes au même gabarit ; les deux tris (« moins de matière », « plus proche du stock ») sont faits par la page sur les données du moteur ; le composé du score (amertume, huiles, arôme) n’est plus à l’écran, seulement dans la fiche et la légende.

Retouches du conseil (conseil-sb/verdict.md) appliquées : la paire 60′ / whirlpool par la puce de contexte (bouton `data-edite="moment"` qui ouvre une feuille « à 60′ / au whirlpool », un toucher) ; « Annuler » à côté de « Remplacer » (D120), recette inchangée ; « ~ » sur chaque score et chaque dose, plage hachurée « ~79–99 » quand une composante manque (Altus, Trident ; calcul de la page comme u4, poids du moteur du moment) ; dose en plage pour un houblon sans lot (Magnat ~37–54 g), jamais « 44 g » sec ; α du lot, sinon la plage des fiches (Magnat α 11–16, pas « 13,5 % ») ; stock et manque sur chaque ligne (« 30 g · −15 ») ; « Si tu achètes : … » ; « autres 83 % » de Nelson Sauvin dans les deux états ; aucun poids (« ×0,6 ») à l'écran : la méthode est derrière « ? » ; à 60′ la composante d'arôme s'appelle « rien d'étranger », au whirlpool « arôme » (contexte du moteur). Chaque ligne porte `data-ibu46`, `data-dose`, `data-alpha` (D124).
Baseline suivie, aucun écart (pictos au trait, épicé p-spice, couleurs des familles, usage en mot, stock en badge, au style par défaut, croix, légende « ? », fiche à l'appui long, thème blanc).
Données : `sbb7b/moteur-sbb.ts` → `sbb7b/donnees-sbb.json` (moteur du parcours en direct : `remplacants` style 16D en stock d'abord, `substitutes` pour la fiabilité et le rangement « cher pour amériser », `lireBiere` après `remplacer`). Générateur `sbb7b/generer-b.mjs`, socle `sbb7b/socle-b.mjs`, captures `sbb7b/capturer-b.mjs`.

## Nombres recomptés sur le moteur (lignes montrées)
- à 60′ (Nugget 46 g = 59,73 IBU ; 318 candidats ; réponse « sans rien acheter » : Nelson Sauvin ; « si tu achètes » : Magnat) :
  - Nelson Sauvin : 86 très proche · dose 62 g · α 9,6 (lu sur l’article) · 46 g = 44,1 IBU · stock 100 g, reste 38 · IBU de l’ajout 59,5
  - Galaxy : 85 très proche · dose 35 g · α 17,2 (fiche de stock) · 46 g = 79,0 IBU · stock 60 g, reste 25 · IBU de l’ajout 60,1
  - Magnat : 99 très proche · dose 37–54 g · α 11–16 (plage des fiches) · 46 g = 50,5–73,5 IBU · stock à acheter · IBU de l’ajout 59,3
- au whirlpool (Nugget 46 g = 9,04 IBU ; 318 candidats ; réponse « sans rien acheter » : Citra cryo ; « si tu achètes » : Falconer's Flight) :
  - Citra cryo : 63 partiel · dose 24 g · α 24,8 (lu sur l’article) · 46 g = 17,3 IBU · stock 65 g, reste 41 · IBU de l’ajout 9,0
  - Target : 86 très proche · dose 53 g · α 11,3 (fiche de stock) · 46 g = 7,9 IBU · stock 5 g, manque 48 · IBU de l’ajout 9,1
  - Falconer's Flight : 83 très proche · dose 50–63 g · α 9,5–12 (plage des fiches) · 46 g = 6,6–8,3 IBU · stock à acheter · IBU de l’ajout 9,1
  - Nelson Sauvin : 42 éloigné · dose 62 g · α 9,6 (lu sur l’article) · 46 g = 6,7 IBU · stock 100 g, reste 38 · IBU de l’ajout 9,0

## Captures
`captures/sbb5b-60.png`, `captures/sbb5b-whirlpool.png` (toucher sur la puce, puis « au whirlpool »), `captures/sbb5b-feuille-moment.png`, `captures/sbb5b-page.png`, `captures/sbb5b-whirlpool-page.png`, `captures/sbb5b-geste.png` (toucher sur Galaxy : réponse, ma bière et pied changent), `captures/sbb5b-fiche.png`.

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
