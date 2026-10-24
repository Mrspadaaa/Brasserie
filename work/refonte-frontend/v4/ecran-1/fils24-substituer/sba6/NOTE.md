# sba6 · chaleur : chaude

Série a (le geste d’abord), lot D125 Substituer. Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant ;
moment (60′), dose au même IBU et Stout 16D en contexte. Cas : Nugget 46 g à 60′, épuisé dans le stock de la fixture.

- **Chaleur** : chaude (forme libre).
- **Idée** : Un plan : en largeur l’α (point = lot ; trait = plage des fiches), en hauteur la ressemblance à Nugget (hachures = plage quand une composante manque). Nugget est la croix ; à sa gauche il en faut plus, à sa droite moins. On promène un anneau, le plus proche s’allume et la stout répond dessous.
- **Geste** : promener l’anneau (état capturé : Altus).
- **Ce qui tient** : L’α et l’incertitude se voient avant tout chiffre : Altus et Trident ont une barre de doute, Nelson Sauvin est un point sûr mais à gauche (62 g) ; plein = stock, vide = à acheter.
- **Ce qui casse** : Les étiquettes se chevauchent dans le groupe 97–99 (certaines sont masquées) ; un plan demande une seconde de lecture de plus qu’une liste.

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
- `mots-premier-ecran --max=80` (indicatif) : sba6 136 mots (> 80) ; `--sans-donnees` : sba6 65 mots (hors données)
- `controle-une-question` (indicatif) : sba6 · titre « Lequel à la place de Nugget ? » · libres : aucun · 0 contrôle(s) · contexte : houblon, moment, dose, base · 2 faute(s) | sba6 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur | sba6 etat.html : groupe libre « houblon » : 0 option (deux au moins) — le détecteur lit les scores (« 99 ») et les grammes comme des moments, et ne voit pas les gestes au pointeur.
- `controle-sans-famille` (indicatif) : sba6 · 5 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✗) | sba6 etat.html : « Nelson Sauvin » (83 % sans famille, 10 mots sur 12) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien — les mots hors familles de Nelson Sauvin ne sont que dans sa fiche ; une part « autres » visible est à faire en passe 2.

Captures : `captures/sba6-fiche.png`, `captures/sba6-geste.png`, `captures/sba6-page.png`, `captures/sba6-premier-ecran.png`, `captures/sba6-whirlpool.png`.
Régénérer, depuis `fils24-substituer` : `node sba1/generer.mjs sba6 --captures`.
