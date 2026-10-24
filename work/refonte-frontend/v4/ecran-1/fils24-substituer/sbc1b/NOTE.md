# sbc1b · Substituer · passe 2 de sbc1 (froide, le classement de u4)

Chaleur : froide. Question : « Lequel à la place de Nugget ? ». Facteur libre : le houblon remplaçant (cartes
`role=radio` dans `data-libre="houblon"`). En contexte (`data-role="contexte"`) : Nugget α 13 % · dose 46 g, le moment,
Stout 16D. La v0 `sbc1/` n'est pas touchée ; sbc1b importe son vocabulaire `sbc1/commun/socle-sbc.mjs` sans le modifier.

## Retouches du verdict (conseil-sb), faites
- 80 mots au plus : 78 hors données au premier écran à 60′ (MOTS OK aussi au whirlpool).
- Légende de u4 : « ● tout connu · ▨ plage, une composante inconnue » (plus « huiles de 0 à 100 »).
- « ~ » sur chaque score et chaque dose ; plages hachurées (Altus, Trident ~79–99, Zenia ~78–98) ; dose en plage quand l'α vient
  des fiches (Magnat ~37–54 g, Yeoman ~37–50 g), jamais « 44 g » sec ; une dose sèche seulement à l'α d'un lot (Nelson ~62 g).
- Stock et manque sur chaque ligne : « 30 g · −15 », « 0 g · −37–54 », « 100 g ».
- « Si tu achètes : Magnat ~99. Ton stock : Nelson Sauvin ~86. » ; au whirlpool « Target ~86, mais 5 g. Si tu achètes :
  Falconer's Flight ~83. »
- « autres 83 % » de Nelson Sauvin (forme grise `data-role="autres"`, `data-part="0.83"`) dans les deux états.
- Au whirlpool, Nelson Sauvin ~29–89 hachuré, jamais « 42 » : son arôme (poids 0,6, moteur 21) repose sur 2 mots de fiche sur
  12 ; la page l'ouvre de 0 à 100 (0,3 × 72 + 0,1 × 74 = 29 ; + 60 = 89), écrit dans sa carte.
- « Annuler » à côté de « Remplacer » (pied fixe, D120) ; aucun « ×0,6 » à l'écran.
- L'état whirlpool par la puce de contexte « à 60′ ⌄ » (décision du pilote, 24.10) : un vrai bouton `data-edite="moment"`
  (`aria-controls`, `aria-expanded`) dans `[data-contexte="moment"]`, qui ouvre une feuille fermée au repos (« Moment de
  Nugget » : à 60′ · au whirlpool, radios du seul moment) ; un choix pose l'état et ferme la feuille (`?moment=wp` pour les
  captures). Ma stout après se
  redessine au moment choisi ; Falconer's Flight n'a pas de profil simulé au whirlpool dans les données : barres hachurées
  « non simulé ici », pas zéro.
- Colonne « IBU si 46 g » (IBU de Nugget au moment × α / 13, linéaire en α) : les IBU d'une ligne sont cohérents (G5).

## Recompte sur le moteur (donnees-sbc.json : substitutes, recette S1, style 16D ; IBU de référence ~59,73 à 60′, ~9,04 au whirlpool)
| moment | houblon | score moteur | affiché | arôme / huiles / amertume | α | IBU si 46 g | dose (g) | stock | IBU46 × dose / 46 |
|---|---|---|---|---|---|---|---|---|---|
| 60′ | Magnat | 99 | 99 | 100 / 100 / 98 | 11–16 | 51–74 | 37.4–54.4 | 0 | 60.3 / 60.2 |
| 60′ | Yeoman | 99 | 99 | 100 / 97 / 99 | 12–16 | 55–74 | 37.4–49.8 | 0 | 59.5 / 60.2 |
| 60′ | Altus | 99 | 79–99 | 100 / ? / 99 | 15–18.5 | 69–85 | 32.3–39.9 | 0 | 59.9 / 59.7 |
| 60′ | Trident | 99 | 79–99 | 100 / ? / 99 | 11–14 | 51–64 | 42.7–54.4 | 0 | 60.3 / 59.4 |
| 60′ | Zenia | 98 | 78–98 | 100 / ? / 97 | 11–14 | 51–64 | 42.7–54.4 | 0 | 60.3 / 59.4 |
| 60′ | Nelson Sauvin | 86 | 86 | 100 / 72 / 86 | 9.6 | 44 | 62.3 | 100 | 59.6 |
| 60′ | Galaxy | 85 | 85 | 75 / 81 / 89 | 17.2 | 79 | 34.8 | 60 | 59.8 |
| 60′ | Sabro | 93 | 93 | 86 / 97 / 95 | 13.4 | 62 | 44.6 | 30 | 60.1 |
| WP | Target | 86 | 86 | 78 / 100 / 90 | 11.3 | 8 | 52.9 | 5 | 9.2 |
| WP | Falconer's Flight | 83 | 83 | 73 / 100 / 92 | 9.5–12 | 7–8 | 49.8–62.9 | 0 | 9.6 / 8.7 |
| WP | Idaho 7 | 82 | 82 | 71 / 100 / 97 | 12.7 | 9 | 47.1 | 20 | 9.2 |
| WP | Magnat | 77 | 77 | 64 / 100 / 82 | 11–16 | 8–11 | 37.4–54.4 | 0 | 9.5 / 8.9 |
| WP | Sabro | 73 | 73 | 59 / 97 / 89 | 13.4 | 9 | 44.6 | 30 | 8.7 |
| WP | Cascade | 65 | 65 | 53 / 90 / 63 | 6.5 | 5 | 92 | 60 | 10 |
| WP | Galaxy | 55 | 55 | 36 / 81 / 87 | 17.2 | 12 | 34.8 | 60 | 9.1 |
| WP | Nelson Sauvin | 42 | 29–89 | 21 / 72 / 74 | 9.6 | 7 | 62.3 | 100 | 9.5 |

Le score affiché est celui du moteur, ou sa plage quand une composante est ouverte (u4 ; Nelson au whirlpool). La dernière
colonne recompte la cible : ~60 à 60′, ~9 au whirlpool.

## Ce qui tient
La structure de u4, la paire 60′ / whirlpool d'un toucher : à 60′ Magnat et Yeoman ~99, au whirlpool Target ~86 (5 g) et
Falconer's Flight ~83 ; Nelson Sauvin passe de ~86 à ~29–89, sa part sans famille visible. Chaque ligne dit stock et manque.

## Ce qui casse
La plage de score reste un calcul de la page, pas du moteur ; changer de moment demande deux touchers (bouton, puis choix
dans la feuille). La liste reste longue (8 lignes) ; le face-à-face arrive
sous la liste ; au whirlpool les rangs de Cascade et Galaxy (65, 55) sont ceux du stock d'abord.

## Contrôles (sbc1b seule)
- G2 controle-commun --sans=mots : COMMUN OK
- G3 controle-une-question --edition : UNE-QUESTION OK (1 groupe libre : houblon), à 60′ et avec ?moment=wp ; le toucher
  réel sur le bouton de moment ouvre la feuille, qui ne règle que le moment. Témoin : sans --edition, la même page échoue
  (« la ligne de contexte contient 1 contrôle(s) »), comme attendu.
- G4 mots-premier-ecran --max=80 --sans-donnees : 78 mots, MOTS OK (whirlpool : MOTS OK)
- G5 controle-coherence-ibu : COHERENCE-IBU OK (8 lignes)
- controle-sans-famille : SANS-FAMILLE OK à 60′ et au whirlpool (Nelson Sauvin 83 % ✓)

## Captures (regardées)
`captures/sbc1b-60.png`, `-whirlpool.png` (toucher réel : bouton de moment, puis « au whirlpool »), `-moment.png` (la feuille ouverte), `-page.png`, `-whirlpool-page.png`,
`-60-nelson.png`, `-whirlpool-nelson.png`, `-fiche.png`. Générateur : `sbc1b/generer.mjs` (écrit aussi `recompte.json`).
