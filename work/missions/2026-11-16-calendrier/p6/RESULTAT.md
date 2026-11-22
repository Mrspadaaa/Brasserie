OK — p6 : g6 « Ta semaine », c2h6 « à te permettre » ; 8 corrigés, 6 sans objet (c4e5)

Fichiers écrits (rien hors de `p6/`) : `p6/assemble.mjs` (p5/build.mjs + retouches, chaque chaîne trouvée une seule fois),
`p6/g6.part.mjs` (section g6 neuve), `p6/build.mjs` (produit), `p6/{g6,c2h6}/etat.html`, 28 captures, planches `p6/_pl-*.png`.
Rebâtir : `node p6/assemble.mjs && node p6/build.mjs`.

## Les deux idées fortes
- **g6 · Ta semaine** : la tête est une carte qui dit, pour la semaine touchée (cette semaine au repos) : **259 à te permettre**
  (le plus bas du libre d'ici la fin : dépenser plus ferait passer une semaine sous 0 ; « au plus serré S24 · 14 juin »),
  **1 j libre** sur 2 avec ses jours l m m j v s d colorés, ce qui l'attend (« Blonde · brasser mar. · −148 »), et la prochaine
  semaine trop chargée en bouton (« S50 · 4 j pour 2 › », qui y amène). Toucher un en-tête de semaine met la carte à jour.
  La rangée Libre porte l'argent (verres) **et les jours** (« 1 j », « −2 j » en rouge) : la réponse « je peux ou pas ? » tient sur une ligne.
- **c2h6 · L'escalier « à te permettre »** : 259 devient « à te permettre », suivi des marches « ensuite 1 928 dès S26 · 28 juin ·
  4 505 dès S33 · 16 août » (boutons qui amènent la vue) ; la même marche est tracée en pointillé vert sur la courbe. Il voit
  combien il peut engager, et **dès quand** un achat plus gros passe.
- Moteur commun inchangé : `node p6/build.mjs` → `plus bas 259 S24 · sans Embouteilleuse 3 059 S24`. Caisse 4 180 · +120 / sem. · 2 j, marqués exemple.
- Gardés : + volant (S47, S22, S14 selon la vue) et ses étages Partout / Sur Calendrier / Poser ; filtres par type (rangées
  masquables de g6, puces de c2h6) ; activités sans budget en pointillés ; paysage plein écran (Revenir).

## Les 14 problèmes de p5/CRITIQUE.md
3. **Corrigé** (g6, paysage) : la bande de l'année passe dans l'en-tête, entre ‹ et › ; les rangées « réponse » viennent d'abord :
   Libre (argent et jours), Toi, Papiers, puis Cuve et Comptoir, sans défiler. Preuve : `g6/g6-paysage-844.png`, `…-cave-844.png`.
4. **Corrigé** : chaque brassin de la Cuve porte son coût (« Blonde −148 », « Porter −176 »), à 390, 844 et 1280.
5. **Corrigé** : le bandeau est remplacé par la carte, calculée sur la même série que le tableau. En « et si », elle montre
   « ~~259~~ 3 059 à te permettre », et la colonne S22 « ~~496~~ 3 296 » libre ; plus de valeur d'avant à côté de la nouvelle.
6, 7, 8, 9, 10, 15. **Sans objet** : c4e5 n'est pas reprise en p6 (consigne : g6 et c2h6). Sa feuille de période reste une greffe ouverte.
11. **Corrigé** (c2h6, repos 390) : une colonne « libre » ou une ligne qui tomberait sous le + passe en dessous (fonction `degage`, au rendu).
12. **Corrigé** (c2h6, geste 390) : la rangée du gantt qui tomberait sous le + descend sous lui (Brassins), le reste ne bouge pas.
13. **Corrigé** : les valeurs 0 à 6 000 sont dans une gouttière à droite ; la courbe s'arrête avant, plus de « 4 000· ».
14. **Corrigé** : avec la gouttière, « nov » est entier à 1280 (`c2h6/c2h6-repos-1280.png`).
16. **Corrigé** : pilules Partout en 13,5 px, icône 30 px : « Encaisser une vente » tient sur une ligne (`*-plus-390.png`).

En plus, pour la navigation (7 → visée 9) :
- g6 a une barre « ‹ S47 → S1 · 16 nov. → 10 janv. › » (cibles 44 × 40), le glisser horizontal du tableau, et la semaine du jour soulignée.
- Le plein écran passe dans cette barre ; la légende écrite est retirée (doute de la critique), la mousse garde un titre au survol.
- c2h6 : les filtres tiennent sur une ligne qui défile (fondu à droite). On voit S47, S48 et le début de S49 sans défiler.
- Greffe du glisser (en partie) : l'« et si » de g6 a une bande « payer en », verte ou rouge, alignée sur les colonnes.
  Elle porte la mention « vert : elle tient, il reste au moins 259 », et « La déplacer ↔ » reste le bouton. Le glisser n'est pas jouable.

## Sorties
- `node p6/assemble.mjs` → ASSEMBLE OK ; `node p6/build.mjs` → ECRIT c2h6, ECRIT g6, moteur ci-dessus.
- `capt.mjs p6 repos,geste,plus` / `PAYSAGE=1 … paysage,paysage-plus` / `LARGEUR=1280 … repos` → CAPTURES OK (×3, puis rejeux ciblés après retouches).
- Mesure « rien sous le + » (script de rendu, chaque élément texte contre le +) : g6 390 repos, 390 geste, 844, 1280 : rien ;
  c2h6 390 repos, 390 geste, 1280 : rien ; **c2h6 844 : « Fêtes » signalé** par la mesure, mais rien n'est visible sous le + dans la capture.
  Le doute reste ouvert.
- `controle-panel.mjs` sur les 16 captures hors état + → **PANEL OK** (remplissage médian 0,73, 0/120 paires presque identiques).
- `controle-commun.mjs --sans=mots` → COMMUN ECHEC 9 : erreurs de navigation (`page.goto`). Le lanceur attend une route de l'app,
  pas une page statique ; il n'a pas été joué non plus en p5. `controle-choix` n'a pas été joué.

Captures ouvertes : `_pl-g6-390.png` (repos, geste, cave, +), `_pl-g6-paysage.png`, `g6/g6-repos-1280.png`, `_pl-1280.png`,
`_pl-geste.png`, `_pl-c2h6-390.png`, `_pl-c2h6-fin.png`, `_pl-c2h6-paysage.png` (paysage et + en cave). Non ouverts un à un : 1280 en cave de g6 après la dernière retouche,
`g6-paysage-plus`.

Restes vus, non corrigés : à 390, les mois de c2h6 se serrent (« 2027 févr mars avr », « août sept »), un défaut déjà là en p5. En geste, l'étiquette
Frigo de c2h6 touche le bord droit. Au repos de c2h6, un blanc reste sous la S49 (sa colonne libre passe sous le +). En paysage, le libellé
« au plus serré · 259 » de la bande de g6 est retiré : le trait rouge et le 259 de la tête le portent.

Notes estimées (moi, pas le critique), sur quatre regards (Brasseur, UX/UI, Parcours, Navigation) :
- g6 : 9, 9, 8, 9 ;
- c2h6 : 9, 8, 8, 8.

Prédiction : « Ta semaine en haut, c'est exactement ce que je regarde le lundi : combien je peux sortir, combien de jours il me reste, et la S50 qui va coincer. »

DÉCISION À PRENDRE : aucune nouvelle ; la place de l'onglet Calendrier et la légende retirée restent à lui montrer.
CONNAISSANCE : « ce que tu peux te permettre en semaine r » = min du libre de r à la fin. Sur la fixture : 259 jusqu'en S24, puis
1 928 dès S26 et 4 505 dès S33. C'est la mesure honnête d'une dépense possible ; le libre de fin de semaine la surestime (S50 : 5 172 libre, 259 permis).
LEÇON PROPOSÉE : un contrôle « rien sous le + » doit mesurer chaque élément texte, pas seulement les blocs déclarés. En p5, `.§dt` (« suite », « en cuve »)
passait sous le + sans être vu.
