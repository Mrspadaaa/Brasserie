# sbc6 · Substituer · série c (les vraies valeurs d’abord) · v0

Chaleur : chaude.
Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant. En contexte, sans contrôle : Nugget 46 g à
60′, même IBU (~59,7), Stout 16D, US-05.

## Idée
les huiles en flacons : la hauteur, l’huile totale (mL/100 g, frange : la plage des fiches) ; les couches, chaque composé au milieu de sa plage publiée, à la couleur de la famille qu’il porte (myrcène résineux, humulène herbacé, caryophyllène épicé, linalol floral) ; le reste non publié en gris ; Nugget contre le choisi, l’étagère des autres dessous.

## Ce qui tient
Galaxy (humulène 1–2 %) et Altus (aucun composé publié, flacon hachuré) se distinguent sans lire ; le premier écran dit qu’à 60′ l’huile ne pèse que 0,2 du score.

## Ce qui casse
le lien composé → famille est une convention de lecture, pas une mesure ; les milieux de plage tassent l’incertitude ; à 60′ c’est la valeur la moins utile des quatre.

## Baseline (suivie, aucun écart)
Pictos de famille au trait (épicé : cannelle et clou croisés, `p-spice` de fils17-standard/v3), couleurs des familles,
α du lot puis des fiches, usage en mot, stock en petit badge, barres l5b de ma stout face à la zone de la 16D au style
par défaut (l’absolu à un toucher), légende derrière « ? », vraie fiche g1 à l’appui long, croix pour sortir (D109),
thème blanc (D106), pas de bouton Annuler (D120). Plancher : u4 (fils11-substitution) et la porte p22.

## Honnêteté
Tout vient du moteur v4 (`substitutes`, `hopSheet`) et du parcours (`lireBiere`), assemblé dans
`sbc1/commun/donnees-sbc.json` (scripts dans `sbc1/commun/extraction/`). Doses et profil de ma stout marqués « ~ » ;
l’inconnu hachuré ou « ? », jamais zéro ; chaque mot d’arôme vient d’une fiche.

## Fichiers
`sbc6/concept.mjs` (composition propre) → `sbc6/etat.html` par `sbc1/commun/generer.mjs` ; vocabulaire commun
`sbc1/commun/socle-sbc.mjs` ; captures `captures/sbc6-premier-ecran.png`, `-page.png`, `-choix-*.png`, `-fiche.png`
(`sbc1/commun/captures.mjs`).

## Contrôles (joués une fois, sorties recopiées)
- controle-commun --sans=mots (série) : COMMUN OK
- controle-une-question : sbc6 · titre « Lequel à la place de Nugget ? » · libres : aucun · 0 contrôle(s) · contexte : aucun · 3 faute(s) | sbc6 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur | sbc6 etat.html : groupe libre « houblon » : 0 option (deux au moins) | sbc6 etat.html : pas de ligne de contexte visible [data-role="contexte"] → UNE-QUESTION ECHEC 24 problème(s)
- controle-sans-famille : sbc6 · 5 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✗) | sbc6 etat.html : « Nelson Sauvin » (83 % sans famille, 10 mots sur 12) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien → SANS-FAMILLE ECHEC 8 problème(s)
- mots-premier-ecran --max=80 --sans-donnees : sbc6 57 mots (hors données) → MOTS ECHEC 2/8 au-dessus de 80
- controle-panel (série, 8 premiers écrans) : 8 captures · remplissage médian 0,63, 1 sous 0,50 · ressemblance moyenne 0,84 · paires presque identiques 0/28 (0 %) ; PANEL OK
