# sba1 · chaleur : froide

Série a (le geste d’abord), lot D125 Substituer. Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant ;
moment (60′), dose au même IBU et Stout 16D en contexte. Cas : Nugget 46 g à 60′, épuisé dans le stock de la fixture.

- **Chaleur** : froide (u4, son choix, affiné, rien d’autre).
- **Idée** : u4 affinée : le classement des remplaçants, rangé par le pire cas (point = score sûr, hachures = composante inconnue). Toucher une ligne l’ouvre en place : dose au même IBU, α du lot ou plage, usage, stock, jauge d’IBU de la stout (bande 50–70), et les 12 familles au style face à la zone 16D. Le pied réécrit la ligne de recette.
- **Geste** : toucher une ligne (états capturés : Nelson Sauvin par défaut, Magnat).
- **Ce qui tient** : Le plancher u4 reconnaissable (échelle 50–100, plages, stock en icône) ; la réponse change avec le moment : à 60′ Magnat et Yeoman, au whirlpool Falconer’s Flight et Target (capture sba1-whirlpool). Plus d’« arôme 100 » : à 60′ la ligne dit « l’arôme part : ce qui reste », et les barres montrent ~0.
- **Ce qui casse** : La liste reste une liste (il la connaît) ; la ligne ouverte pousse le bas du classement sous le pli ; « Magnat et Yeoman, sans inconnue » est la phrase de u4, pas une décision.

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
- `mots-premier-ecran --max=80` (indicatif) : sba1 125 mots (> 80) ; `--sans-donnees` : sba1 51 mots (hors données)
- `controle-une-question` (indicatif) : sba1 · titre « Lequel à la place de Nugget ? » · libres : moment, houblon · 11 contrôle(s) · contexte : houblon, moment, dose, base · 2 faute(s) | sba1 etat.html : 2 facteurs libres : moment (Magnat 99, Yeoman 99, Helios 98) ; houblon (Sabro 93, Idaho 7 92, Nelson Sauvin 86) | sba1 etat.html : balisage discordant : Magnat 99 : balisé houblon, porte moment ; Yeoman 99 : balisé houblon, porte moment ; Helios 98 : balisé houblon, porte moment — le détecteur lit les scores (« 99 ») et les grammes comme des moments, et ne voit pas les gestes au pointeur.
- `controle-sans-famille` (indicatif) : sba1 · 6 houblon(s) repéré(s) · 2 au-dessus de 50 % (Hallertau Blanc 67 % ✗, Nelson Sauvin 83 % ✗) | sba1 etat.html : « Hallertau Blanc » (67 % sans famille, 10 mots sur 15) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien | sba1 etat.html : « Nelson Sauvin » (83 % sans famille, 10 mots sur 12) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien — les mots hors familles de Nelson Sauvin ne sont que dans sa fiche ; une part « autres » visible est à faire en passe 2.

Captures : `captures/sba1-fiche.png`, `captures/sba1-geste.png`, `captures/sba1-page.png`, `captures/sba1-premier-ecran.png`, `captures/sba1-whirlpool.png`.
Régénérer, depuis `fils24-substituer` : `node sba1/generer.mjs sba1 --captures`.
