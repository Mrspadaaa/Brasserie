# b4, passe 2 : le podium des moments (série B « la réponse d'abord », lot 23 Dryhopper)

Voie r7b2-passe2, 23.10. Page : `b4/etat.html`. Générateur : `generer.mjs` (la partie données vient de `../generer.mjs`
de la v0 ; la vue est réécrite). Captures et geste joué : `captures.mjs`. La v0 (`../b4/`) n'a pas été touchée.
Chaleur : tiède. Levure : en pont, comme dans la v0.

## Passe 2

En haut, la réponse : « Face à ta stout · Dry hop actif, 2 j ». Dessous, le podium des cinq étapes calculées,
rangées par le solde : ★ actif, après, whirlpool, 10′, 60′. Pour chacune, on lit le ruban des familles gagnées,
le floral, le résineux, la jauge d'IBU et la valeur mesurée. Plus bas, le pont Levure, et le dock du moment avec
ses jours de contact au bout.

Retouches demandées par le critique (`tri/SYNTHESE.md`, candidate b4) :
1. **α du lot puis plage des fiches** (D87) : la ligne de contexte dit « α 12,7 % 9,5–14,9 ».
2. **Les 24 moments atteignables depuis le podium** : la ligne du doigt est permanente. Elle se range dans le
   podium à la place de son solde : 35′ ≈ vient entre 10′ et 60′, dans un cadre pointillé, avec un rond noir comme
   le pouce. Si le doigt est sur une étape du podium, cette ligne est cerclée. Les lignes de dry hop suivent les
   jours choisis.
3. **La convention du solde derrière le « ? »**, avec l'interpolation, la queue pâle et les sources. Rien de tout
   cela au premier plan.

Greffes reçues :
- **greffe d8**, le mini-ruban par ligne : une colonne aux couleurs des familles gagnées. Sa largeur dit la
  quantité, ses couleurs ce qui arrive (fruité en actif et après, presque rien à 60′).
- **greffe c7, avec c5**, la mesure du moment sur la ligne : 60′ « cuit » (E07, Simcoe) ; actif « 38 µg/L »
  (E03, linalol d'Idaho 7 mis à la levure, à vérifier) ; après « 8,1/15 » (E04, jury, Cascade à 3,86 g/L, 24 h).
  Whirlpool et 10′ : « ? » hachuré, jamais mesuré à ce moment. Le détail est dans l'aria-label et la légende.
- **greffe e1/a1**, le dock-profil avec loupe : la frise sous le pouce porte, pour chaque position, la hauteur du
  floral. Un trait orangé marque ce qui est trop amer ; l'interpolé est plus pâle. La loupe ×8,1 suit le doigt
  (64 px par pas contre 7,9 px sur le rail, `captures/travail/geste-b4.json`).
- **greffe d2**, la part emportée sur les barres : une queue pâle de la couleur de la famille, jusqu'à la valeur
  d'après fermentation (ce que la chaleur ou le CO₂ emporte, ~). Écart : pâle, pas hachurée, voir la Baseline.
- **greffe e2**, « sans gain » sur le bloc de jours : 3, 5 et 7 j ont un bord pointillé (calculé : le floral ne
  bouge pas de 0,05). Les toucher affiche « en actif, 3 j contre ★ : sans gain ~ ».
- **greffe g1**, « à cru, IBU ? » : en dry hop, la jauge porte Nugget 60 et une queue hachurée, « 60+? ».
- **Pont qui suit le moment** (greffes g1/g4) : en actif « Pomona : agrumes ~+13 » ; après « après
  fermentation, la levure ne change rien » ; à chaud « à chaud, la levure ne change rien ». Écart Pomona calculé
  sur la grille avant le dessin (M07) : l'après bouge de moins de 0,05, sinon le générateur s'arrête.
- **greffe d5**, la teneur du lot publié dans la fiche (appui long) : huile 2,5 mL/100 g, linalol 0,4 %, myrcène
  45,4 % (CoA ID7-2573, YCH 2025). Elle est donnée comme lot publié, pas comme le lot du brasseur.
- **Picto « épicé »** : cannelle et clou croisés, `p-spice` repris tel quel de la planche standard
  (`fils17-standard/v3/planche.html`). Le générateur échoue si le symbole n'est pas celui-là.

Retouches communes appliquées :
- une seule unité, les points ;
- 80 mots ;
- loupe ;
- le meilleur et le piège : l'IBU à chaud en orangé, 75, 97 et 162 ;
- pont de levure qui suit le moment ;
- conventions derrière le « ? » ;
- le vide réduit (lignes de 60 px, dock juste sous le contenu).

Greffes non prises :
- les points 16D (f4) : manque de place sur une ligne de 370 px ;
- les quatre pastilles d'étape (a4) : le podium est déjà ces étapes ;
- le départ sur le piège (g4) : proposé en variante, voir la décision à prendre.

## Baseline

Repris :
- y1b : le moment glissé par 5′ au doigt, de 60′ à 0′ puis WP, actif et après, d'un seul geste ; la loupe ;
  le dock sous le pouce ; « face à ta stout » ; la jauge d'amertume de toute la stout, par ligne ;
- x3b réduit en fin de frise : les jours de contact 1, 2, 3, 5 et 7 j au bout du dock ;
- les acquis : code couleur, pictos au trait, au style par défaut avec la zone 16D, absolu à un toucher, « ? »,
  appui long vers la fiche g1, α du lot puis des fiches, rôle « mixte » en mot, stock en icône ;
- l'honnêteté : « ~ » pour le simulé, « ≈ » pour l'interpolé, hachuré pour l'inconnu ou le jamais mesuré, orangé
  seulement pour ce qui sort du style.

Écarts, un acquis à la fois :
- Pas de barres l5b des 12 familles. Le podium compare des moments sur les deux familles de ta demande (floral,
  résineux) ; le ruban montre les autres familles en couleur, et la fiche les détaille.
- La queue « emportée » est pâle et non hachurée : le hachuré veut déjà dire « inconnu », et cette part est
  simulée, donc connue (~).
- « sans gain » en pointillé, pas en hachuré, pour la même raison.
- Les jours sont un groupe à part au bout du dock. Ils font partie du même facteur, le moment, dans le même
  `data-libre="moment"`. Ce n'est pas la case « puis » de y1b : un seul houblon ici.

## Contrôles (rejoués depuis la racine)

- commun `--sans=mots` : COMMUN OK. Premier passage : STANDARD ECHEC, deux épaisseurs de trait d'icône ; le
  chevron de retour est passé à 1,5 px.
- MOTS `--max=80` : `b4 80 mots`, MOTS OK. Premier passage à 97 : lignes « actif » et « après » sans les jours
  (ils sont au bout du dock), rang numéroté retiré (★ seul), pont et réponse raccourcis, chevron dessiné.
- **D98** `--edition` : UNE-QUESTION OK (1 groupe libre : moment). 6 contrôles : le rail et les cinq jours ;
  contexte : houblon, dose, levure, base.
- **D99** `--outil=dryhopper` : ACQUIS OK (4/4 : geste, frise, valeurs, levure), tous au repos.
- verifier-page : PAGE OK (390 px, sans erreur).
- D100 au seuil 0,25 : SANS-FAMILLE OK (0 mot hors familles pour Idaho 7).
- Geste joué au doigt (CDP touch) : de « actif · 2 j » à « 35′ ». Ligne 35′ insérée au rang, « à 35′ contre ★ :
  floral ≈−14 · résineux ≈−9 · trop amer », pont « à chaud, la levure ne change rien ». La fiche s'ouvre à l'appui
  long. Console vide.
