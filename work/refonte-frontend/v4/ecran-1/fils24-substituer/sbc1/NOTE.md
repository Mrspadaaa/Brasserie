# sbc1 · Substituer · série c (les vraies valeurs d’abord) · v0

Chaleur : froide.
Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant. En contexte, sans contrôle : Nugget 46 g à
60′, même IBU (~59,7), Stout 16D, US-05.

## Idée
u4 affiné : la liste classée à plages (un « 99 » à huiles inconnues vaut 79 à 99), avec en ligne les vraies valeurs qui décident à 60′ (α du lot ou des fiches, dose au même IBU, stock en badge), puis le face-à-face Nugget / le choisi (α par fiche, familles perdues ou gagnées dans les fiches, ma stout après).

## Ce qui tient
la structure de u4 (son choix) et ses plages de score ; Nelson Sauvin, Galaxy et Sabro sous « dans ton stock » ; plus d’« arôme 100 » ; à 60′ on montre ma stout simulée (± 1 sur 110), pas les arômes que l’ébullition emporte ; une ligne dit que la réponse change au whirlpool (Target 86, Falconer’s Flight 83 ; Nelson Sauvin 42).

## Ce qui casse
la plage de score est un calcul de la page (repris de u4), pas du moteur ; 96 mots hors données au premier écran (> 80) ; le face-à-face commence sous le pli.

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
`sbc1/concept.mjs` (composition propre) → `sbc1/etat.html` par `sbc1/commun/generer.mjs` ; vocabulaire commun
`sbc1/commun/socle-sbc.mjs` ; captures `captures/sbc1-premier-ecran.png`, `-page.png`, `-choix-*.png`, `-fiche.png`
(`sbc1/commun/captures.mjs`).

## Contrôles (joués une fois, sorties recopiées)
- controle-commun --sans=mots (série) : COMMUN OK
- controle-une-question : sbc1 · titre « Lequel à la place de Nugget ? » · libres : aucun · 0 contrôle(s) · contexte : aucun · 3 faute(s) | sbc1 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur | sbc1 etat.html : groupe libre « houblon » : 0 option (deux au moins) | sbc1 etat.html : contexte : 0 facteur fixé déclaré (deux au moins, [data-contexte]) → UNE-QUESTION ECHEC 24 problème(s)
- controle-sans-famille : sbc1 · 5 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✗) | sbc1 etat.html : « Nelson Sauvin » (83 % sans famille, 10 mots sur 12) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien → SANS-FAMILLE ECHEC 8 problème(s)
- mots-premier-ecran --max=80 --sans-donnees : sbc1 96 mots (hors données) (> 80) → MOTS ECHEC 2/8 au-dessus de 80
- controle-panel (série, 8 premiers écrans) : 8 captures · remplissage médian 0,63, 1 sous 0,50 · ressemblance moyenne 0,84 · paires presque identiques 0/28 (0 %) ; PANEL OK
