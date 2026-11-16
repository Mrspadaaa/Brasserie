OK — c4 : scénario de zéro rejoué ; plus rien de fixe sur « Pourquoi ce fournisseur ? »

- Fichiers (tous dans `r3/c4`) : `proto.src.html` → `proto.html` (`build.mjs`), `scenario.mjs`, `scenario.out`, `scenario.log`,
  `SCENARIO.md`, `gestes-ra.mjs`, `web.js` (copies de c3), `capt.mjs` (copie de calendrier/p8), `captures/` (77 `c4-E*.png`, 20 planches).
- Sorties : `node r3/c4/scenario.mjs` → **COEUR OK (57 étapes, 77 captures)** ; `node r3/c4/gestes-ra.mjs` → **GESTES OK**.
- Témoin (L13) : le même jeu sur c3 (`PROTO=../c3/proto.html`) échoue en E16, E19.9, E20.9 : 25 à 46 px du champ sous « Garder »,
  et le toucher n'arrive pas au champ (focus vide). E21 passait déjà, comme au dernier jeu.
- Corrigé (marqué `r3 · c4`) :
  1. Clavier ouvert dans une feuille : « Garder ce choix » n'est plus collé en bas, il reprend sa place en fin de feuille.
     Clavier fermé, il revient en bas.
  2. Le champ qui prend le clavier monte en haut de la partie visible, son libellé compris. Le champ suivant reste entier dessous.
     Mesure du doigt : 46/46 px visibles, 0 px recouverts, focus sur `#da-pf`, en E16, E19, E20 et E21.
  3. Entrée dans « Pourquoi » fait Suivant : le curseur passe au champ fournisseur sans viser.
  4. Pourquoi contredit : le superlatif se rapporte à la caractéristique nommée la plus proche. « Oxygène capté le plus bas, même à
     30 bouteilles par heure » était refusé à tort, au nom du CO2 par bouteille.
- Captures ouvertes : `captures/c4-E16c00-deux-lignes.png` (pourquoi de 2 lignes, champ fournisseur entier, pas de barre),
  `planche-06.png`, `planche-07.png`, `planche-08.png` (E16 à E18), `planche-11.png` (E19 piège et choix).
- Prédiction : « Là je tape, je touche le fournisseur, ça écrit au bon endroit ; ok. »

DÉCISION À PRENDRE : aucune nouvelle. Reste ouvert de c3 : un pourquoi contredit est refusé, sans « garder quand même ».
CONNAISSANCE : une barre d'action `sticky` en bas d'une feuille recouvre le champ visé dès que le clavier réduit la feuille.
Clavier ouvert, elle reprend sa place dans le flux, et le champ focalisé monte en haut de la partie visible.
LEÇON PROPOSÉE : aucune
