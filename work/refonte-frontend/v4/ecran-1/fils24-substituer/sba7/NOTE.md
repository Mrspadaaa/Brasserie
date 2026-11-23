# sba7 · chaleur : chaude

Série a (le geste d’abord), lot D125 Substituer. Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant ;
moment (60′), dose au même IBU et Stout 16D en contexte. Cas : Nugget 46 g à 60′, épuisé dans le stock de la fixture.

- **Chaleur** : chaude (forme libre).
- **Idée** : La balance des IBU : Nugget 46 g à gauche ; je pose un remplaçant à droite (toucher ou glisser son jeton). Le tas montre les grammes (plein : stock ; pointillé : ce qui manque ou s’achète) ; le fléau reste droit au même IBU, et tremble quand l’α n’est pas celui d’un lot (Magnat : ~49–71 IBU).
- **Geste** : toucher ou glisser un jeton sur le plateau (état capturé : Magnat).
- **Ce qui tient** : La règle « même IBU » se voit sans un mot ; l’incertitude d’un houblon sans lot devient un mouvement ; au repos, la balance penche du côté de Nugget : il manque quelque chose.
- **Ce qui casse** : La capture fixe ne montre pas le tremblement ; les jetons ne donnent ni score ni usage ; la balance prend de la place pour une seule idée.

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
- `mots-premier-ecran --max=80` (indicatif) : sba7 95 mots (> 80) ; `--sans-donnees` : sba7 43 mots (hors données)
- `controle-une-question` (indicatif) : sba7 · titre « Lequel à la place de Nugget ? » · libres : moment, houblon · 9 contrôle(s) · contexte : houblon, moment, dose, base · 2 faute(s) | sba7 etat.html : 2 facteurs libres : moment (Sabro 44,6 g, Idaho 7 47,1 g, Nelson Sauvin 62,3 g) ; houblon (Sabro 44,6 g, Idaho 7 47,1 g, Nelson Sauvin 62,3 g) | sba7 etat.html : balisage discordant : Sabro 44,6 g : balisé houblon, porte moment+houblon ; Idaho 7 47,1 g : balisé houblon, porte moment+houblon ; Nelson Sauvin 62,3 g : balisé houblon, porte moment+houblon — le détecteur lit les scores (« 99 ») et les grammes comme des moments, et ne voit pas les gestes au pointeur.
- `controle-sans-famille` (indicatif) : sba7 · 6 houblon(s) repéré(s) · 2 au-dessus de 50 % (Hallertau Blanc 67 % ✗, Nelson Sauvin 83 % ✗) | sba7 etat.html : « Hallertau Blanc » (67 % sans famille, 10 mots sur 15) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien | sba7 etat.html : « Nelson Sauvin » (83 % sans famille, 10 mots sur 12) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien — les mots hors familles de Nelson Sauvin ne sont que dans sa fiche ; une part « autres » visible est à faire en passe 2.

Captures : `captures/sba7-geste.png`, `captures/sba7-page.png`, `captures/sba7-premier-ecran.png`, `captures/sba7-whirlpool.png`.
Régénérer, depuis `fils24-substituer` : `node sba1/generer.mjs sba7 --captures`.
