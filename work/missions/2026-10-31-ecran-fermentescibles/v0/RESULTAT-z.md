OK — série z : 4 concepts jouables (liste prête, verre en couches, pavés, frise des moments), baseline suivie

## Fichiers écrits (tous sous `v0/z*/`)
- `z1/etat.html`, `z1/NOTE.md`, `z1/captures-etats.mjs` (joue les états 2 et 3 et le 1280 pour z1 à z4), captures `z1-haut/page/couleurs/saisie/sucre/1280.png`.
- `z2/etat.html`, `z2/NOTE.md`, captures idem.
- `z3/etat.html`, `z3/NOTE.md`, captures idem.
- `z4/etat.html`, `z4/NOTE.md`, `z4/capture-glisser.mjs`, captures idem + `z4-glisser-pendant.png`, `z4-glisser-apres.png`.
- Ce fichier. Rien hors de `v0/z*/` ; aucun commit.

## Chaleurs et idées
| | Chaleur | Idée (une) | Mots | Remplissage |
|---|---|---|---|---|
| z1 | froide | la liste compactée : champ toujours prêt, 5 familles en segments, la ligne se tape (−/+, champ, « à renseigner » par ligne) | 76 | 0,40 |
| z2 | tiède | le verre : une couche par grain à sa part, hachurée « ? » ; la bière prend sa teinte quand les couleurs sont là | 55 | ~0,7 |
| z3 | chaude | les pavés : chaque malt occupe l'aire de sa part ; toucher un pavé, c'est taper sa masse ; 0 kg attend sous la surface | 59 | ~0,7 |
| z4 | chaude | la frise des moments : empâtage, ébullition, fermentation ; la puce se glisse d'un moment à l'autre, la règle des jours donne J+n | 57 | 0,33 |

## Sorties des contrôles (depuis la racine)
- `verifier-page.mjs <z>/etat.html --min-images 0 --captures …` : **PAGE OK** ×4 (0 erreur, 0 débordement).
- `mots-premier-ecran.mjs v0 z1 z2 z3 z4 --page=etat.html --max=80 --profil=sans-houblons` : 76 · 55 · 59 · 57, **MOTS OK**.
- `controle-contraste.mjs … --profil=sans-houblons` : **CONTRASTE OK** (pire 5,21:1 « 3 couleurs à renseigner »).
- `controle-commun.mjs v0 z1 z2 z3 z4 --page=etat.html --profil=sans-houblons` : mots, survol, blocs, contraste, standard, parlant, brutes **OK** ; au-style, fiche, trait, légende sautés par le profil ; **COULEURS ECHEC** ×4 (« 1 teinte franche, 3 au moins »). Voulu et dit dans chaque NOTE : les trois couleurs de sa recette sont à renseigner, l'écran reste neutre par honnêteté (J7) ; renseignées, les teintes EBC paraissent (captures `-couleurs.png`). Aucune couleur n'a été ajoutée pour le contrôle.
- `controle-panel.mjs z1..z4-haut.png` : **PANEL ECHEC** — remplissage médian 0,71 mais z1 (0,40) et z4 (0,33) sous 0,50 ; ressemblance 0,94 (chrome commun de 150 px et bas d'écran partagés ; 2 paires ≥ 0,95 : z1~z4, z2~z4). z1 : trois lignes puis le pied, c'est la liste ; z4 : deux moments sur trois vides, c'est sa recette. Je n'ai pas rempli pour le contrôle.
- États joués (puppeteer, `captures-etats.mjs`) : couleurs 3,5 · 4 · 2 → EBC ~7,6 (Morey, `beerColor.ts`) sur les 4 ; famille sucre, « Dextrose », Entrée → ligne à 0 kg, focus « Masse de Dextrose, en kilogrammes », « 0,4 », Entrée → 0,4 kg, ébullition, 5 % ferm., Grain reste 8 kg ; 0 erreur de page. z4 : glisser Haferflocken → fermentation, J+3, empâtage 6,5 kg.
- `grep type="number"` : 0 ×4.

## Captures regardées
Toutes les `-haut.png` ouvertes et jugées ; `-couleurs`, `-sucre` ouvertes pour z1, z2, z3, z4 ; `z4-glisser-pendant/apres` ouvertes ; `z3-1280` ouverte (colonne 560 px, surface étirée).

## Prédiction
« z2 le verre et z3 les pavés, ça c'est visuel, je comprends tout de suite ; z4 le rail pour les malts c'est malin mais vide tant que tout est à l'empâtage ; z1 c'est propre, c'est la base. Manque la couleur, mais c'est ma recette. »

DÉCISION À PRENDRE : le contrôle COULEURS (D74, 3 teintes franches) est-il pertinent sur un écran dont les données de couleur manquent ? Ici, la seule teinte honnête au repos est l'ambre « à renseigner ». Si le pilote veut des teintes au repos, l'axe serait une couleur par moment (empâtage, ébullition, fermentation) dans z4, pas une couleur de malt inventée.
CONNAISSANCE : `page.setViewport` qui change `isMobile` recharge la page dans Chrome sans écran ; une mesure lue après le passage à 1280 px lit l'état initial, pas l'état joué (le script l'imprime « EBC — » alors que les captures montrent ~7,6).
LEÇON PROPOSÉE : aucune.
