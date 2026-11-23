# sbb7c · Substituer, passe 3 de sbb7 : la cible (chaude)

Chaleur : chaude (passe 3, depuis sbb7b, qui reste). Question : « Lequel à la place de Nugget ? » ; facteur libre : le remplaçant ; contexte : stout 16D, Nugget 46 g à 60′ ou au whirlpool (bouton `data-edite="moment"` et sa feuille), « même IBU ».

- **Idée** : Nugget au centre, chaque remplaçant à la distance de son score ; à gauche ton stock, à droite l’achat ; la réponse est le point cerclé ; la boîte touchée ouvre sa carte (α, dose, IBU à 46 g, reste, rang sur 318, composantes, ma bière).
- **Corrections du verdict (REJET de sbb7b, D10)** : quatre boîtes par côté (deux premiers du moteur, la réponse, Nelson Sauvin), hauteur 66 px dans un cadre de 330 px : chaque boîte entière dans le cadre et dans 390 px, mesuré au DOM dans les deux états (capturer-c.mjs : aucune boîte hors cadre, aucun texte qui déborde, aucun chevauchement point/boîte à 3 px près ; 16 éléments à 60′ et au whirlpool) ; la légende en mots (suffit · stock court · score ouvert · très proche (80), D90) ; Nelson Sauvin jamais « ~42 » sec : plus de la moitié de ses mots sans famille, sa composante d’arôme est ouverte, « ~29–89 » au whirlpool, « ~66–86 » à 60′, avec la raison sur sa carte (« autres 83 % sans famille : arôme du moteur 21 / 100 ») ; le cercle 50 retiré, les cercles 65 et 80 visibles entre les colonnes ; le mot de l’échelle sous le score de la carte (« très proche », « partiel ») ; radar et arômes de u4 à un toucher (« arômes › » ouvre la fiche) ; le rang du moteur sur la carte (« 76e sur 318 », style 16D).
- **Ce qui casse** : les lignes des boîtes sont serrées (texte à 1 px du bord, mesuré non tranché) ; Sabro sort du stock montré au whirlpool (la 5e boîte n’existe plus, Sabro reste dans la fiche et le classement du moteur) ; la carte du bas est longue.

Reste de sbb7b inchangé : « Annuler » à côté de « Remplacer » (D120) ; « ~ » et plages hachurées sur scores et doses ; α du lot ou plage des fiches ; stock et manque sur chaque boîte ; « Si tu achètes : … » ; poids de méthode derrière « ? » ; marqueurs `data-ibu46`, `data-dose`, `data-alpha` (D124). Baseline suivie, aucun écart.
Fichiers : `sbb7c/generer-c.mjs`, `socle-c.mjs`, `donnees-sbb.json` (copie de sbb7b, moteur du parcours en direct par `moteur-sbb.ts`), `capturer-c.mjs`, `notes-c.mjs`.

## Nombres recomptés sur le moteur (les huit boîtes de chaque état)
- à 60′ (Nugget 46 g = 59,73 IBU ; réponse : Nelson Sauvin ; si tu achètes : Magnat) :
  - Nelson Sauvin : ~66–86 (moteur 86) très proche · ~62 g · α 9,6 · 46 g = 44,1 IBU · 100 g, reste 38 · 76e
  - Galaxy : ~85 très proche · ~35 g · α 17,2 · 46 g = 79,0 IBU · 60 g, reste 25 · 82e
  - Idaho 7 : ~93 très proche · ~47 g · α 12,7 · 46 g = 58,4 IBU · 20 g −27 · 27e
  - Sabro : ~93 très proche · ~45 g · α 13,4 · 46 g = 61,6 IBU · 30 g −15 · 27e
  - Altus : ~79–99 (moteur 99) très proche · ~32–40 g · α 15–18,5 · 46 g = 68,9–85,0 IBU · à acheter · 1e
  - Magnat : ~99 très proche · ~37–54 g · α 11–16 · 46 g = 50,5–73,5 IBU · à acheter · 1e
  - Trident : ~79–99 (moteur 99) très proche · ~43–54 g · α 11–14 · 46 g = 50,5–64,3 IBU · à acheter · 1e
  - Yeoman : ~99 très proche · ~37–50 g · α 12–16 · 46 g = 55,1–73,5 IBU · à acheter · 1e
- au whirlpool (Nugget 46 g = 9,04 IBU ; réponse : Citra cryo ; si tu achètes : Falconer's Flight) :
  - Target : ~86 très proche · ~53 g · α 11,3 · 46 g = 7,9 IBU · 5 g −48 · 1e
  - Idaho 7 : ~82 très proche · ~47 g · α 12,7 · 46 g = 8,8 IBU · 20 g −27 · 3e
  - Citra cryo : ~63 partiel · ~24 g · α 24,8 · 46 g = 17,3 IBU · 65 g, reste 41 · 101e
  - Nelson Sauvin : ~29–89 (moteur 42) éloigné · ~62 g · α 9,6 · 46 g = 6,7 IBU · 100 g, reste 38 · 241e
  - Falconer's Flight : ~83 très proche · ~50–63 g · α 9,5–12 · 46 g = 6,6–8,3 IBU · à acheter · 2e
  - Sterling : ~82 très proche · ~70–109 g · α 5,5–8,5 · 46 g = 3,8–5,9 IBU · à acheter · 3e
  - Stirling : ~81 très proche · ~50–100 g · α 6–12 · 46 g = 4,2–8,3 IBU · à acheter · 5e
  - Talus : ~81 très proche · ~63–74 g · α 8,1–9,5 · 46 g = 5,6–6,6 IBU · à acheter · 5e

## Captures (ouvertes)
`captures/sbb7c-60.png`, `captures/sbb7c-whirlpool.png`, `captures/sbb7c-page.png`, `captures/sbb7c-whirlpool-page.png`, `captures/sbb7c-feuille-moment.png`, `captures/sbb7c-geste.png` (Galaxy touchée), `captures/sbb7c-fiche.png`.

## Contrôles
  - COMMUN OK
  - UNE-QUESTION OK (1 groupe libre : houblon)
  - sbb7c 73 mots (hors données)
  - MOTS OK
  - COHERENCE-IBU OK (9 lignes)
  - SANS-FAMILLE OK (1 houblon(s) au-dessus de 50 %, part « autres » visible)
