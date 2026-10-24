# sba5 · chaleur : tiède

Série a (le geste d’abord), lot D125 Substituer. Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant ;
moment (60′), dose au même IBU et Stout 16D en contexte. Cas : Nugget 46 g à 60′, épuisé dans le stock de la fixture.

- **Chaleur** : tiède (forme imposée par l’approche : un geste qui choisit, la recette qui répond).
- **Idée** : Une pile de cartes, une par remplaçant (stock suffisant d’abord) : à droite je la garde (elle entre dans la recette et dans « gardés »), à gauche la suivante. La carte porte le nom, l’usage, le stock, α et plage, palier, dose, IBU, score, pourquoi ce score (amertume, huiles ; à 60′ l’arôme ne pèse que 0,2), les 12 familles au style, perd et gagne.
- **Geste** : balayer la carte, ou ‹ suivant / garder › (état capturé : Sabro gardé après Nelson Sauvin).
- **Ce qui tient** : Une carte = une décision : on lit tout sur un seul houblon à la fois ; « gardés » fait une courte liste sans tableau.
- **Ce qui casse** : On ne voit pas d’un coup d’œil qui est le meilleur ; balayer à gauche n’écarte rien pour de vrai (la pile tourne).

## Données (rien d’inventé)
Remplaçants, scores, composantes, dose au même IBU, stock et raison : moteur v4 (`substitutes()` de `prototypes/houblons-v4/src/engine/substitution.ts`,
recette S1, 46 g), joué à 60′, au whirlpool et à froid (`sba1/donnees/calc.ts`, `calc2.ts`, `preparer.mjs` → `sba1/donnees/donnees.json`).
Score en plage : composante inconnue de 0 à 100 avec les poids du moteur (u4). IBU en plage quand l’α n’est pas celui d’un lot.
Familles de ta stout : ma bière et zone 16D de l’écran Dryhopper ; « ~ » : grille simulée du lot 21 à 2 g/L (US-05) pour Nelson Sauvin,
Galaxy, Idaho 7, Cascade ; les autres sont hachurés « ? » (non simulés, pas zéro). Le départ de Nugget n’est pas simulé (écrit dans la légende).

## Baseline (obligatoire, aucun écart)
Pictos de famille au trait de la planche fils17-standard/v3 (épicé : cannelle et clou croisés), couleurs des familles, α du lot puis plage,
usage en mot, au style par défaut (Absolu à un toucher), stock en petit badge, thème blanc, croix pour sortir (44 px, en haut à gauche),
légende derrière « ? », fiche à l’appui long ou au survol long (α, familles N/M, mots hors familles, silhouette hachurée, goût),
Annuler et Remplacer › (D120).

## Sorties des contrôles (jouées une fois)
- `controle-commun --sans=mots` (les huit) : mots sauté (--sans) ; couleurs OK ; au-style OK ; survol OK ; blocs OK ; contraste OK ; fiche OK ; standard OK ; trait OK ; legende OK ; parlant OK ; brutes OK ; COMMUN OK
- `controle-panel` (les huit premiers écrans) : 8 captures · remplissage médian 0,63, 0 sous 0,50 · ressemblance moyenne 0,82 · paires presque identiques 0/28 (0 %) PANEL OK
- `mots-premier-ecran --max=80` (indicatif) : sba5 117 mots (> 80) ; `--sans-donnees` : sba5 63 mots (hors données)
- `controle-une-question` (indicatif) : sba5 · titre « Lequel à la place de Nugget ? » · libres : aucun · 0 contrôle(s) · contexte : houblon, moment, dose, base · 1 faute(s) | sba5 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur — le détecteur lit les scores (« 99 ») et les grammes comme des moments, et ne voit pas les gestes au pointeur.
- `controle-sans-famille` (indicatif) : sba5 · 2 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✗) | sba5 etat.html : « Nelson Sauvin » (83 % sans famille, 10 mots sur 12) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien — les mots hors familles de Nelson Sauvin ne sont que dans sa fiche ; une part « autres » visible est à faire en passe 2.

Captures : `captures/sba5-geste.png`, `captures/sba5-legende.png`, `captures/sba5-page.png`, `captures/sba5-premier-ecran.png`, `captures/sba5-whirlpool.png`.
Régénérer, depuis `fils24-substituer` : `node sba1/generer.mjs sba5 --captures`.
