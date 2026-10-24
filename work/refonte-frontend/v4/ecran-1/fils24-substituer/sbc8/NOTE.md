# sbc8 · Substituer · série c (les vraies valeurs d’abord) · v0

Chaleur : chaude.
Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant. En contexte, sans contrôle : Nugget 46 g à
60′, même IBU (~59,7), Stout 16D, US-05.

## Idée
le ticket du calcul : un ticket imprimé, ligne à ligne, des vraies valeurs au score. Nugget 46 g fait ~59,7 IBU ; le remplaçant, à son α, en demande tant ; puis les trois composantes avec leur poids à 60′ et ce qui les porte (α et β, milieux des fiches ; quatre composés ✓ ✗ ? ; les familles étrangères, ses mots de fiche), le total et le stock.

## Ce qui tient
remplace l’« arôme 100 » de la porte par ce qu’il veut dire : « rien d’étranger » ; on voit pourquoi Nelson Sauvin a 72 en huiles (myrcène, humulène et linalol hors de Nugget).

## Ce qui casse
beaucoup de chiffres de méthode (la « chimie nue » refusée au lot 20) ; α et β y sont des milieux de fiches, alors que la dose suit le lot : deux α pour un houblon ; 95 mots hors données (> 80).

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
`sbc8/concept.mjs` (composition propre) → `sbc8/etat.html` par `sbc1/commun/generer.mjs` ; vocabulaire commun
`sbc1/commun/socle-sbc.mjs` ; captures `captures/sbc8-premier-ecran.png`, `-page.png`, `-choix-*.png`, `-fiche.png`
(`sbc1/commun/captures.mjs`).

## Contrôles (joués une fois, sorties recopiées)
- controle-commun --sans=mots (série) : COMMUN OK
- controle-une-question : sbc8 · titre « Lequel à la place de Nugget ? » · libres : aucun · 0 contrôle(s) · contexte : aucun · 3 faute(s) | sbc8 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur | sbc8 etat.html : groupe libre « houblon » : 0 option (deux au moins) | sbc8 etat.html : pas de ligne de contexte visible [data-role="contexte"] → UNE-QUESTION ECHEC 24 problème(s)
- controle-sans-famille : sbc8 · 4 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✗) | sbc8 etat.html : « Nelson Sauvin » (83 % sans famille, 10 mots sur 12) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien → SANS-FAMILLE ECHEC 8 problème(s)
- mots-premier-ecran --max=80 --sans-donnees : sbc8 95 mots (hors données) (> 80) → MOTS ECHEC 2/8 au-dessus de 80
- controle-panel (série, 8 premiers écrans) : 8 captures · remplissage médian 0,63, 1 sous 0,50 · ressemblance moyenne 0,84 · paires presque identiques 0/28 (0 %) ; PANEL OK
