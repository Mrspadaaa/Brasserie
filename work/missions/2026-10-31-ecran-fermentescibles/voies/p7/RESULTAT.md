OK — s1, s2, s3 : RECHERCHE OK, MASSE OK, VOLEE OK

Les trois variantes sont livrées. Pour chacune : RECHERCHE OK (R0 à R6), MASSE OK, MOMENT OK, VOLEE OK, PAGE OK, MOTS OK, COMMUN OK,
CONTRASTE OK, HAUTEUR OK, CAPTURES OK, et GESTES OK (8) depuis la correction du contrôle par le pilote (voir CONTRÔLE ?, résolu).

Sa question (D220) : « Oui ça c'est bien, et maintenant la recherche, comment elle s'affiche ? Dans la liste ? ». Sa consigne arrivée
pendant la voie (D221) : « Concentre toi sur la recherche et l'ouverture de la recherche avec les stocks. Celles de la vrai app était pas
trop mal ». J'ai adapté les variantes déjà construites sans recommencer :
- les trois s'ouvrent au toucher du champ sur le stock, dans les formes de l'app ;
- le stock de la maquette est devenu une fixture ;
- la quantité en stock s'écrit en toutes lettres.

## Fichiers écrits
- `v7/s1/` : `etat.html`, `NOTE.md`, `patch.mjs`, `commun-p7.mjs` (fixture, alias, recherche ; partagé par les trois), `gen-capturer.mjs`
  (il écrit les trois `capturer.mjs`), `capturer.mjs` et 26 captures `p7-s1-*.png`.
- `v7/s2/`, `v7/s3/` : `etat.html`, `NOTE.md`, `patch.mjs`, `capturer.mjs` et 26 captures chacun ; `v7/s3/relance1.cjs` (la
  relance 1, déjà posée dans `patch.mjs`, à ne pas rejouer).
- `voies/p7/COMPRIS.md`, `voies/p7/RESULTAT.md`.
- `git status` relu : rien d'écrit hors du « Possède ». `controle-recherche.mjs` et `VOIE.md` ont été modifiés par le pilote (D221),
  pas par moi.

## Sorties décisives
| Critère | s1 | s2 | s3 |
| --- | --- | --- | --- |
| RECHERCHE (G2, G13, G24) | RECHERCHE OK | RECHERCHE OK | RECHERCHE OK |
| MASSE (G3, G14, G25) | MASSE OK | MASSE OK | MASSE OK |
| MOMENT (G4, G15, G26) | MOMENT OK | MOMENT OK | MOMENT OK |
| VOLEE (G5, G16, G27) | VOLEE OK (10) | VOLEE OK (10) | VOLEE OK (10) |
| GESTES (G6, G17, G28) | GESTES OK (8) | GESTES OK (8) | GESTES OK (8) |
| PAGE (G7, G18, G29) | PAGE OK | PAGE OK | PAGE OK |
| MOTS (G8, G19, G30) | 76 mots, MOTS OK | 76 mots, MOTS OK | 76 mots, MOTS OK |
| COMMUN (G9, G20, G31) | COMMUN OK | COMMUN OK | COMMUN OK (après un trait de chevron passé de 1,3 à 1,17 px) |
| CONTRASTE (G10, G21, G32) | CONTRASTE OK (pire 4.85:1) | CONTRASTE OK | CONTRASTE OK |
| HAUTEUR (G11, G22, G33) | HAUTEUR OK (1,04 écran) | HAUTEUR OK (1,04) | HAUTEUR OK (1,04) |
| CAPTURES (G12, G23, G34) | CAPTURES OK | CAPTURES OK | CAPTURES OK |

G1 : COMPRIS OK (4 doutes). Les capturers vérifient aussi :
- 8 grains : 1,02 écran ;
- tous les gestes de p6-b2, rejoués ;
- Münchner Malz ajouté avec la masse à 0, le curseur dans sa masse et 15 EBC ;
- l'aperçu correspond au premier résultat.

CONTRÔLE ? (résolu : le pilote a corrigé le contrôle, il accepte Munich ou Münchner Malz ; G6, G17, G28 rejoués : GESTES OK (8) ×3) `controle-gestes-ligne.mjs` (AJOUT) tape « Munich », Entrée, puis attend une ligne `/^Munich/`. C'est exactement le défaut
que D220 corrige et que R2 de `controle-recherche.mjs` interdit : « Munich » doit donner Münchner Malz. La base p6-b2 passe GESTES
(8 sur 8) parce qu'elle crée encore « Munich ». Les deux contrôles ne peuvent pas passer ensemble. Je ne l'ai pas contourné. Il faut
adapter AJOUT, par exemple en acceptant `/^Münchner|^Munich/` ou en tapant un nom inconnu.

## Les trois formes, captures ouvertes
Les captures sont dans `work/missions/2026-10-31-ecran-fermentescibles/v7/<s>/p7-<s>-*.png` :
- repos ;
- ouverture, mu, munich, pils et abbey, chacun en `-pendant` et en `-zoom`, avec le clavier de 300 px hachuré ;
- `munchner-apres` ;
- `1280-mu-pendant`.

Captures ouvertes : repos (s1), ouverture (s1, s2, s3), mu (s1, s2, s3), pils (s1, s2, s3), Munich (s1), abbey (s1), Münchner après
(s1, s2), 1280 mu (s3).

- **s1, sous le champ (tiède)**
  - Au repos : les sacs de la base.
  - Le champ touché : des tuiles sur deux colonnes. Chaque tuile a une étoile si l'article est épinglé, une pastille de teinte avec l'EBC
    (Carapils 4, Carahell 25, Caramünch II 120 : la couleur les sépare) et « 12,5 kg en stock » ou « stock épuisé ».
  - Un article déjà dans la recette prend toute la largeur : « déjà 5,0 kg · 18 kg en stock ».
  - En tapant, les lettres tapées sont surlignées.
  - Capture jugée : nette et lisible ; le fournisseur manque, faute de place.
- **s2, « Dans la liste » (tiède)**
  - Le champ touché : trois lignes fantômes sous la dernière ligne, puis « + 2 au stock · tape pour affiner ». Chaque fantôme a un trait
    tireté, un nom gris et le détail de l'app.
  - « pils » éclaire la ligne Pilsner : trait d'or, et « déjà 5,0 kg ↵ » à la place de sa part.
  - Un toucher sur un fantôme en fait une vraie ligne.
  - J'ai essayé de compenser le défilement pour garder le champ immobile. Je l'ai retiré : Pilsner passait coupé sous l'en-tête collant.
    Le champ descend donc avec les fantômes et reste au-dessus du clavier.
- **Relance 1 (critique v6)** : la fixture ne donne plus d'EBC aux trois articles déjà dans la recette (Pilsner Malz, Weizenmalz hell,
  Haferflocken) : « le stock connaît la couleur et la ligne non ??? » ne peut plus se dire. Le repos de p6-b2 garde ses trois « ? ».
  Les trois variantes ont été reconstruites et G2 à G34 rejoués : tous OK. s1 et s2 ne changent pas autrement.
- **s3, menu ancré (froide)**
  - C'est la liste de l'app telle quelle : rangée sur deux lignes, épinglés en tête avec l'étoile, « Créer « … » (stock à zéro) » sous
    un trait.
  - Relance 1 : elle s'ouvre sous le champ, sa hauteur plafonnée à l'espace au-dessus du clavier, et ses 8 articles défilent dans
    la liste. Elle ne passe au-dessus que s'il ne reste pas une rangée dessous. Le ticket reste visible (D212).
  - Relance 1 : « déjà 5,0 kg » est sur la ligne du nom, le détail se lit en entier (« 18 kg en stock · Weyermann ») et rien ne
    s'ellipse (D151). Le pavé vide sous le champ est replié.
  - Captures refaites et ouvertes : `p7-s3-ouverture-pendant`, `p7-s3-pils-zoom`, `p7-s3-mu-pendant`.
  - Enrichie avec : le sac teinté, « déjà 5,0 kg », la touche ↵ sur la rangée active, les lettres en gras et ↓ ↑.
  - À 1280, le menu s'ouvre sous le champ.

## Alias (dits dans chaque NOTE.md)
Munich → Münchner Malz · Pils → Pilsner Malz · Pale → Pale Ale Malz · Weizen, Wheat, Blé → Weizenmalz hell · Cara → Carapils ·
Avoine → Haferflocken. La recherche ignore aussi les accents et tolère une lettre près : « pilsener » trouve Pilsner Malz.

## En brasseur
Je prendrais s3 : c'est l'app qu'il trouvait « pas trop mal », avec « déjà 5,0 kg » et le stock lisible d'un coup d'œil. s2 répond
littéralement à « Dans la liste ? », mais l'ouverture y pousse le champ de 140 px. s1 est la plus compacte, sans fournisseur.
Prédiction : « s3 c'est bien, comme l'app mais mieux ; s2 je vois où ça va arriver ».

DÉCISION À PRENDRE : aucune (l'adaptation de AJOUT à D220 est faite par le pilote).

CONNAISSANCE : la recherche de l'app (`Combobox.tsx`) n'a pas de limite de résultats (`maxResults = Infinity`). Au téléphone, il faut
caler la hauteur de la liste sur l'espace visible sous l'en-tête collant, sinon l'ouverture déborde.

LEÇON PROPOSÉE : avant de lancer une voie, rejouer chaque critère de GATES.md contre la version voulue, et pas seulement sur HEAD (L13).
Ici, GESTES encode le défaut que R2 corrige, et seule la construction l'a révélé.
