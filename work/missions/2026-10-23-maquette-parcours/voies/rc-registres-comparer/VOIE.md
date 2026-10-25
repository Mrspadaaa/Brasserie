# Voie rc-registres-comparer — les registres de Comparer suivent son choix (cmc2g retouché)

Agent : auteur (Sonnet). Mission : `work/missions/2026-10-23-maquette-parcours/MISSION.md`.

## Pourquoi
Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Son choix pour Comparer a changé.
Ce n'est plus r6a et x3b (D107), c'est **cmc2g** : « C'est quasiment parfait » (SPEC-BRASSEUR, 25.10), retouché ensuite en
cmc2h, cmc2i, puis cmc2j ou cmc2k selon la transition qu'il prendra. La maquette porte maintenant cmc2h (commit b0d517c1, voie
rb-radar-commun). Les registres décrivent encore r6a, et des textes qu'il a fait retirer : « Aussi encore pas mal de légende et
texte inutile, qui n'apporte rien ». La batterie, les états et les choix tombent donc pour cette seule raison. Le détail est dans
`voies/rb-radar-commun/RESULTAT.md` § Critères et DÉCISION À PRENDRE.

## À faire
1. `work/refonte-frontend/v4/choix/ecrans.json`, écran `comparer` :
   - `choix` : cmc2g retouché (radar rdg5, chaque axe à son échelle au moment, D68) ;
   - `mots` : une phrase **mot pour mot** de SPEC-BRASSEUR, par exemple « C'est quasiment parfait » ;
   - `capture` : `work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/brasseur-cmc2g-retouches.jpg` ;
   - `inventaire` : un nouvel inventaire de cmc2h, au format de `fils22-comparer/donnees/inventaire-comparer.json`, tiré de
     `prototypes/houblons-v4/parcours/src/ecrans/comparer/` (ses `data-element`, `data-acquis`, `data-etat`) ;
   - les compléments gardés s'ils restent vrais. Leurs `mots` doivent se retrouver tels quels dans SPEC ; le complément 4 a été
     corrigé le 25.10.
2. `choix/etats/comparer.json`, `acquis.json`, `suggerer.json` : un état qui exige un texte retiré à sa demande (« dans la cuve »,
   « de contact », « Résineux déjà au-delà », « Face à ta stout, par », « IBU » sur Comparer) est réécrit sur ce qui le porte
   maintenant (la feuille « ? »), ou retiré si son sens n'existe plus. Chaque changement cite ses mots.
3. Les contrats de `controle-teinte.mjs`, `controle-comparer-etapes.mjs` et `controle-comparer-familles.mjs` pour Comparer :
   - les adapter à cmc2h (teinte, étapes au premier écran, rangées des familles), **sans affaiblir** ce qu'il demande toujours :
     choisir quand comparer, les 5 moments visibles ensemble, ta stout aux mêmes étapes, l'inconnu jamais 0 ;
   - si une exigence de D107 tombe avec son nouveau choix, écrire pourquoi, avec ses mots, en DÉCISION À PRENDRE plutôt que de la
     retirer en silence.
4. Une ligne `D69` à ajouter dans `work/refonte-frontend/decisions.md`, proposée dans RESULTAT.md : le pilote l'écrit.

## Critères
Rejouer sur `prototypes/houblons-v4/maquettes/parcours` (construire d'abord : `node prototypes/houblons-v4/parcours/outils/construire.mjs`) :
- `node prototypes/houblons-v4/parcours/outils/batterie.mjs` → `BATTERIE OK 46/46` ;
- `controle-etats.mjs` → `ETATS OK` ;
- `controle-choix.mjs` → `CHOIX OK`.

Noter l'état sur HEAD d'abord (42/46, 4/141, ECHEC).

## Possède
`work/refonte-frontend/v4/choix/`, `work/refonte-frontend/v4/ecran-1/fils25-comparer/donnees/`,
`work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs`, `controle-comparer-etapes.mjs`, `controle-comparer-familles.mjs`,
`work/missions/2026-10-23-maquette-parcours/voies/rc-registres-comparer/`.
Pas `prototypes/`, pas `src/`. Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec chaque changement, ses mots et la sortie des trois critères.
