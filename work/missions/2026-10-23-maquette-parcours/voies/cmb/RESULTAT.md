OK — cmb1 à cmb4 : Comparer jouable, cinq moments, huiles, étapes ensemble ; G1 G2 G3 verts

## Fichiers écrits (Possède)
- `work/refonte-frontend/v4/ecran-1/fils25-comparer/cmb1/` à `cmb4/` : `etat.html` (page jouable, rendu au repos prérendu), `assets/` (script et feuille construits), `NOTE.md`, `source/` (le code React de la variante, à greffer : `index.tsx`, `calcul.ts`, `Ensemble.tsx`, et `Rail.tsx` / `Frise.tsx` / `Plans.tsx`, plus les deux scripts de construction).
- `work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/cmb{1..4}.png`, `-moment.png` (10′), `-long.png`, `-nelson.png` ; `cmb4-puce.png` (la puce de moment ouverte).
- Méthode : copie de `prototypes/houblons-v4/parcours` dans un miroir sous `os.tmpdir()` (jonctions vers `src/`, `node_modules/`…), écran Comparer modifié, construit par `construire.mjs` ; rien d'écrit hors de Possède.

## Les quatre (une idée chacune, sur la base jouable)
- cmb1 (tiède) : rpb1, le rail de cinq arrêts 60′ · 10′ · WP | actif · après, le meneur au-dessus ; Nugget en pointillé dans les barres.
- cmb2 (tiède) : rpz4, l'écart face au retenu à droite de chaque barre, coloré selon sa demande ; barre segmentée des moments.
- cmb3 (chaude) : rpb3, la frise est le sélecteur (toucher ou glisser), curseur noir.
- cmb4 (chaude) : w2, chacun à son meilleur moment (« ★ chacun »), « tous à », puce de moment par tête.
- Communs : cinq moments simulés par le moteur ; huiles (rpz2) dans chaque tête, Saaz en repère ; étapes ensemble au premier écran (D107) ; texte inutile retiré.

## Critères
- G1 : `VARIANTES-CMP-4` (mots : cmb1 95, cmb2 100, cmb3 93, cmb4 99 ; MOTS OK)
- G2 : `TRAIT OK` (57, 57, 57, 56 pictos, 0 faute)
- G3 : `QUAND OK` (60′, 10′, whirlpool, dry hop ; cmb4 aussi « meilleur »)
- Hors gates : COMMUN OK (`--sans=mots`) ; CHOIX OK ×4 (sur le dossier construit du miroir, `--ecran=comparer`) ; PANEL ECHEC (ressemblance 0,96).

## Prédiction
« Là je peux enfin choisir quand ; la frise et les plans me parlent, mais où sont passées mes rangées ? »

DÉCISION À PRENDRE : la base au premier plan (règle n° 1, brief) et la diversité du panel (`controle-panel`) se contredisent : radar et têtes identiques donnent 0,96 de ressemblance. Et D107 (étapes ensemble, au repos, au premier écran) avec cinq moments et ≤ 100 mots pousse les rangées sous le pli. À lui : étapes ensemble en nombres, ou en dessin seul.

CONNAISSANCE : `variantes.mjs` lit `etat.html` sans le jouer ; une page React construite n'y a que la coquille : il faut la prérendre (`source/prerendu.mjs`) ou que le contrôle rende la page. `controle-comparer-etapes` exige les étapes au premier écran (cadre défilant), pas seulement à l'écran après défilement.

LEÇON PROPOSÉE : une série qui reprend la maquette jouable joue `controle-choix` dès le premier rendu : retirer une ligne « inutile » (« dans la cuve ») ou un lien (panel OSU) casse un acquis gardé (états, D114).
