OK — quatre mini maquettes r6a++ (rpz1 à rpz4), chacune une greffe nommée, captures 390 × 844

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/rpz1/etat.html`, `rpz1/NOTE.md` — tiède, greffe `hors-16d` : rangée « lui seul » sous les têtes (◇, façon flb5b) et le mot précis de la fiche à côté de la barre de sa famille (D130, D131 ter).
- `…/rpz2/etat.html`, `rpz2/NOTE.md` — chaude, greffe `ecart-galaxy-saaz` : règle mesurée de l'huile totale (mL/100 g), Saaz (étalon « fade ») → Galaxy, Cascade, Idaho 7 et ton Nugget dessus (D131).
- `…/rpz3/etat.html`, `rpz3/NOTE.md` — chaude, greffe `radar-par-colonne` : trois petits radars, un par houblon, chacun avec sa bande et ses propres inconnus, à la place du grand superposé (« À revoir », D77). Écart à la baseline déclaré dans la NOTE.
- `…/rpz4/etat.html`, `rpz4/NOTE.md` — chaude, greffe `ecart-face-au-retenu` : sous chaque barre des colonnes non retenues, l'écart signé face au retenu, en crans de ta 16D, mini barre divergente et nombre ; suit le houblon touché.
- Captures : `…/captures/rpz1.png`, `rpz2.png`, `rpz3.png`, `rpz4.png` (premier écran, 390 × 844) ; `rpz1-390.png` à `rpz4-390.png` (page entière) ; `rpz1-galaxy.png`, `rpz3-galaxy.png`, `rpz4-galaxy.png` (Galaxy touché) ; `rpz3-absolu.png`.
- Scripts (générateur split/join, captures, gestes) dans le scratchpad hors dépôt ; rien à la racine (`git status --short` : seuls `rpz1/` à `rpz4/` et `captures/rpz*` sont nouveaux ; `pistes-l5f.png` était déjà là avant la voie).

r6a est la base des quatre, reprise telle quelle (titre, contexte, radar r2, trois colonnes, neuf rangées, chimie, panel OSU, pont, légende) ; chaque greffe s'ajoute et est marquée `data-greffe`. Toutes les captures ont été ouvertes et regardées, avant et après correction.

## Critères
- G1 `variantes.mjs rpz1 rpz2 rpz3 rpz4` → `VARIANTES-BIEN-4`.
- G2 `controle-pictos-trait … rpz1 rpz2 rpz3 rpz4 --page=etat.html` → `TRAIT OK` (28 pictos par page, 0 faute).
- Indicatifs : `controle-commun … --sans=mots` → `COMMUN OK` (après deux corrections : contraste 4,48 et 4,24 → OK ; FICHE sur « Saaz (CZ) » → OK). Mots au premier écran : 77 / 61 / 72 / 71. Aucune erreur de page, pas de défilement horizontal.
- `controle-panel` sur les quatre → `PANEL ECHEC` (remplissage médian 0,77, ressemblance 0,92, rpz1 ~ rpz4 ≥ 0,95) : attendu et non corrigeable sans quitter la base r6a imposée par le brief ; le panel mesure la diversité d'un lot libre.

## Prédiction
Il dira « rpz4 et rpz1 très bien, à combiner » (les écarts sous la barre et les mots hors 16D répondent mot pour mot à « qu'on voit comme il faut les différences » et aux « types spéciaux »), trouvera rpz2 « intéressant mais c'est que l'huile », et jugera rpz3 selon ce qu'il voulait revoir du radar : « mieux que superposé » ou « trop petit ».

DÉCISION À PRENDRE : rpz3 remplace le radar r2 superposé (acquis) par trois radars, au nom de son « À revoir » ; si le pilote veut le superposé gardé à un toucher, c'est une passe 2.

CONNAISSANCE : l'écart en crans entre deux houblons se calcule des mêmes centres `RD` que r6a (cran = bande du style / 3) et recoupe r6n2 (Idaho 7 devant Cascade ~0,4 cran) ; `controle-panel` étalonné sur des panels libres échoue sur un lot « base imposée + greffes » (ressemblance 0,92).
LEÇON PROPOSÉE : aucune.
