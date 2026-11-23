# sba3 · chaleur : tiède

Série a (le geste d’abord), lot D125 Substituer. Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant ;
moment (60′), dose au même IBU et Stout 16D en contexte. Cas : Nugget 46 g à 60′, épuisé dans le stock de la fixture.

- **Chaleur** : tiède (forme imposée par l’approche : un geste qui choisit, la recette qui répond).
- **Idée** : La fiche de brassage d’abord : la ligne « 60′ » de la stout est vide, Nugget barré (épuisé). On glisse un jeton de houblon (stock d’abord, puis à acheter) sur la ligne pointillée, ou on le touche : la fiche se réécrit (dose au même IBU, IBU et reste du stock, 12 familles au style, perd et gagne).
- **Geste** : glisser ou toucher un jeton (état capturé : Galaxy).
- **Ce qui tient** : Le geste dit exactement l’action (« remplacer dans ma recette ») ; le bandeau couleur stout rend la fiche reconnaissable ; Annuler et Remplacer › dans la fiche (D120).
- **Ce qui casse** : Au repos, rien n’est choisi : il faut un geste pour voir une réponse ; les jetons ne disent pas pourquoi l’un vaut mieux que l’autre (score seul).

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
- `mots-premier-ecran --max=80` (indicatif) : sba3 102 mots (> 80) ; `--sans-donnees` : sba3 54 mots (hors données)
- `controle-une-question` (indicatif) : sba3 · titre « Lequel à la place de Nugget ? » · libres : moment, houblon · 11 contrôle(s) · contexte : base, dose, moment, houblon · 3 faute(s) | sba3 etat.html : 2 facteurs libres : moment (Nelson Sauvin 86, Galaxy 85, Sabro 93) ; houblon (Nelson Sauvin 86, Galaxy 85, Sabro 93) | sba3 etat.html : balisage discordant : Nelson Sauvin 86 : balisé houblon, porte moment+houblon ; Galaxy 85 : balisé houblon, porte moment+houblon ; Sabro 93 : balisé houblon, porte moment+houblon | sba3 etat.html : la ligne de contexte contient 5 contrôle(s) : le contexte est fixé, il ne se règle pas — le détecteur lit les scores (« 99 ») et les grammes comme des moments, et ne voit pas les gestes au pointeur.
- `controle-sans-famille` (indicatif) : sba3 · 6 houblon(s) repéré(s) · 2 au-dessus de 50 % (Hallertau Blanc 67 % ✗, Nelson Sauvin 83 % ✗) | sba3 etat.html : « Hallertau Blanc » (67 % sans famille, 10 mots sur 15) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien | sba3 etat.html : « Nelson Sauvin » (83 % sans famille, 10 mots sur 12) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien — les mots hors familles de Nelson Sauvin ne sont que dans sa fiche ; une part « autres » visible est à faire en passe 2.

Captures : `captures/sba3-fiche.png`, `captures/sba3-geste.png`, `captures/sba3-page.png`, `captures/sba3-premier-ecran.png`, `captures/sba3-whirlpool.png`.
Régénérer, depuis `fils24-substituer` : `node sba1/generer.mjs sba3 --captures`.
