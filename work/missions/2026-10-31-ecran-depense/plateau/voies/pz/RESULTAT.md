OK — 4 variantes du plateau : rouge sur le champ, bandeau au pouce, ticket tamponné, rangée qui s'édite

Voie pz, concepteur Fable, 02.11. Base : son choix p3c-3 (`choix-v3c/img/p3c-3-geste-plateau.png`, ouvert avant de dessiner), sa capture du
DURGOL ouverte, B du nom, d-lue, D277. Les six cas du brief dans chaque variante, dans une vraie liste groupée (8 lignes de sa facture
Brau- und Rauchshop, 58,60), au téléphone d'abord. Pas de GATES.md dans le dossier : les trois critères de VOIE.md.

## Fichiers écrits (Possède seulement)
- `plateau/v0/pz1/`, `pz2/`, `pz3/`, `pz4/` : `etat.html` (états `?etat=repos|a|b|c|d|e|f`, `&theme=cave`), `NOTE.md`, 9 captures chacun :
  `pzN-repos.png`, `pzN-a.png` … `pzN-f.png` (390, clair), `pzN-b-cave.png` (390, sombre), `pzN-b-1280.png`.
- `plateau/voies/pz/capturer.mjs` (les 36 captures en une commande), `plateau/voies/pz/RESULTAT.md`.
- `git status --short` : rien hors de « Possède » (`/work/missions/**` est ignoré sauf `*.md` et `*.json` ; un commit demandera `git add -f`).
  Les `??` de la racine (`pistes-l5f.png`, `scripts/eval-hop/`, `src/data/hopSources/`) et les `M` de `src/ui/depense/` étaient là avant la voie.

## Les quatre idées (toutes sur la baseline, la même liste, le même pied)
| | chaleur | idée | ce qui change pour lui |
|---|---|---|---|
| pz1 | froide | p3c-3, le rouge sur le champ | le même plateau, une chose dite une fois, l'unité en un seul contrôle, le rouge/jaune/bleu sur le champ même, les gestes rares sur une rangée |
| pz2 | tiède | le bandeau au pouce | la rangée reste en haut avec une ligne de preuve ; trois prises (article · quantité · nature) sous le pouce, la prise à régler s'ouvre au-dessus |
| pz3 | chaude | le ticket tamponné | la ligne imprimée en quatre colonnes, et sous chaque mot le tampon de l'app ; la nature en tampon en biais ; le papier est l'extrait |
| pz4 | chaude | la rangée s'édite elle-même | rien ne s'ouvre : les cellules deviennent des pastilles sur 3 rangées ; la question du cas sur une 4e ; extrait et supprimer au glissé |

Écarts à la baseline, écrits dans les NOTE : pz2 remplace le pied tant qu'une ligne est ouverte (« OK » le rend) ; pz4 n'a pas de plateau
« sous » la rangée. La mouture « Rattacher » n'est dans aucune (hors des six cas). Le récap du haut est celui de p3c-3 abrégé (sans TVA/Payé).

## Critères
1. Quatre `etat.html`, six cas, captures 390 clair + un cas en sombre + 1280 : faites et ouvertes (36 ; j'en ai regardé 22 en image, dont les
   quatre cave et trois 1280). Chaque plateau tient entre la rangée et le pied à 844 sans défiler (le plus haut : pz3 f, 440 px).
2. Chaque NOTE : chaleur, idée, baseline cochée, sorties des contrôles. Oui.
3. `git status --short` : rien hors de Possède. Oui.

## Sorties décisives (02.11, une fois)
- `controle-panel.mjs pz1-b pz2-b pz3-b pz4-b` → remplissage médian 0,60 (0 sous 0,50), ressemblance 0,89, 0/6 doubles → **PANEL OK**
- `controle-commun.mjs plateau/v0 pz1 pz2 pz3 pz4 --page=etat.html --profil=sans-houblons --sans-lignes` → **COMMUN OK** (mots, couleurs,
  survol, blocs, contraste, standard, parlant, brutes OK ; au-style, fiche, trait, légende sautés par le profil)
- `mots-premier-ecran.mjs … --profil=sans-houblons` sans `--sans-lignes` : 166 · 173 · 158 · 147 (> 98 : la liste de facture compte ; D238 la sort)
- `controle-contraste.mjs … --profil=sans-houblons` (clair) → **CONTRASTE OK** ; pires : 4,92 · 4,66 · 5,04 · 4,53. Deux défauts corrigés avant :
  pz2 « ✓ au centime » 4,44 sur la bande, pz3 tampon de nature 3,38 et « ✓ centime » rogné (1:1).
- `verifier-page.mjs <etat.html> --min-images 0` → **PAGE OK** ×4 (sans `--min-images 0` : ECHEC « 0 images », les pages n'ont pas d'<img>).
- Non mesuré : le contraste en cave (l'outil ne prend pas `?theme=cave` ; les quatre captures cave sont ouvertes et lisibles) ; les boosters
  joués au doigt (pages statiques, le clic ouvre/ferme et choisit l'unité ; le glissé de pz4 est codé mais pas joué dans Chrome).

## Prédiction
Il garde pz3 pour l'idée (« ça c'est vraiment bien » sur le papier et les tampons, « mais » les tampons trop gros) et pz4 pour le geste
(« à la volée »), demande de greffer le rouge-sur-le-champ de pz1 partout, et trouve le bandeau de pz2 « pas mal mais ça cache la liste ».

DÉCISION À PRENDRE : aucune. Deux points à son goût, déjà en variantes : le pied remplacé par le bandeau (pz2) et l'absence de plateau (pz4).

CONNAISSANCE : `controle-contraste.mjs` et `controle-commun.mjs` ne mesurent que le thème clair d'une page statique (le chemin avec `?theme=`
plante) ; pour une maquette à deux thèmes, il faudrait une option `--theme=cave` qui pose `data-theme` avant la mesure.

LEÇON PROPOSÉE : aucune.

DEMANDE EXECUTANT : aucune pour la v0 (36 captures faites par `capturer.mjs` en une commande). En passe 2 : `node plateau/voies/pz/capturer.mjs
pz1b pz2b pz3b pz4b` puis les contrôles ci-dessus sur les dossiers `b`, sorties attendues PANEL OK, COMMUN OK, CONTRASTE OK, PAGE OK.
