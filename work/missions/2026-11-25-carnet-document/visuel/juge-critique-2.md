# Juge critique au portrait, tour 2 (25.11 nuit)

Grille : PORTRAIT.md v2. La note est la plus basse de « se voit en 3 s » et « répond au besoin », jamais une moyenne, et elle est tirée vers le bas.
Règles dures : § ORGANISE-TROP-TEXTUEL, § FRISE-GENERIQUE, § ENTETE-PEU-UTILE. Décision du pilote : 30 mots au repos ; après un geste, sa ligne
citée ne compte pas, le texte ajouté reste à 30 mots au plus.
Captures ouvertes : les 60 de `cap12/` (v1, v2, v3, v6, v7 × 12 cas), en planches côte à côte par cas ; les 16 gestes de la v7 dans `cap/v7-*` ;
`cap/{v1,v2,v3,v6}-ecoulement-{sansia,refus}.png`.
B = bloquant (valeur fausse, info clé absente, geste sans effet, illisible, règle dure ou refus explicite rejoué, mineur revu 2 fois selon L12).
m = mineur.

## Tour 1 → tour 2 : ce qui est réglé, ce qui reste
| Tour 1 | État au tour 2 (captures) |
|---|---|
| C1 réglé invisible | **Réglé** partout. Le pilsner est vert « ✓ Réglé », avec « Rouvrir » et « ▸ Détail 3 » (`cap12/v*-pilsner.png`). |
| C2 jours restants | **Réglé.** J-36 31 déc., J-96 avant mars, J-20 avant le 15, J-11 samedi 6 déc., J-5 lundi. |
| C3 option sans titre | **Réglé.** Fin d'ébullition / À froid, Technicien / Décaler au jeudi ; plus aucun « ? » seul. |
| C4 date de la tâche | **Réglé**, sauf deux cas. v3 la met au bout du rail, loin de la tâche. Pour la chaudière de la v7 et de la v3, la date est là, mais la raison manque (voir CN1). |
| C5 bouteilles 400/600 | **Réglé.** ⚠ 400/600 et coût total : Verallia ≥504, B 410, Occasion ≥80 ⚠. L'occasion n'est plus couronnée. |
| C6 prix pro (bar) | **Réglé** partout (☐ 💶 Prix pro). |
| C7 doublons | **Réglé** pour 150 CHF, 10 fûts et 4 CHF. **Neuf** : J-36 est dit 2 fois (v2, v3, v6) et 3 fois (v1) dans `cap12/v*-assurance.png`. |
| C8 picto faux CO2 | **Réglé** : paire 1,2 bar ↘ 0,4 bar en rouge, 🫧. |
| C9 α citra | Sans objet : le rendu générique n'affiche aucun α (absent de `reponses/`). |
| Doute ★ conseillé | **Réglé** : « ✦ conseillé » en pointillé violet sur Fournisseur B. |

## Nouveaux problèmes communs (comptés une fois)
- **CN1 (B) Raccord déjà changé, montré comme une option à faire.** Captures : `cap12/v2-co2.png`, `v3-co2.png`, `v6-co2.png`, `v7-co2.png` (ligne 🛠️
  « Raccord changé » sans ✓) et `v1-co2.png` (carré tâche sans ✓). C'est un fait accompli, rangé parmi les solutions. Valeur fausse, déjà relevée
  au tour 1 (C3, « déjà fait ») : un mineur revu 2 fois devient bloquant (L12). Correction : le ranger dans 🔎 trouvé avec ✓ (« Raccord changé ✓ »),
  à côté de la paire 1,2 ↘ 0,4 bar.
- **CN2 (m) J-8 du pilsner sans objet.** Captures : `cap12/v1-pilsner.png`, `v2`, `v6`, `v7`. « Commandé 2 sacs, brassin maintenu · J-8 3 déc. » :
  on ne sait pas si J-8 est la livraison ou le brassin. La v3 l'écrit « Brassin J-8 ». Correction : « 🍺 Brassin J-8 ».
- **CN3 (m) IA absente, lignes coupées et valeur perdue.** Captures : `cap/v7-bouteilles-sansia.png`, ligne 4 « Besoin avant » (« le 15 » perdu) ;
  `cap/*-ecoulement-sansia.png`, « Écoulement au sol de la… ». Correction : ses lignes sur 2 lignes au plus, la date gardée.
- **CN4 (m) Citra, table entièrement hachurée.** Captures : `cap12/v3-citra.png`, `v7-citra.png` (4 cases sur 4 hachurées) ; `v2-citra.png` (deux tuiles
  vides et « 0/1 trouvé »). Le héros dit « Choisir l'offre » alors que rien n'est connu. Correction : sans aucune case connue, pas de table, mais
  une rangée « 💰 ? 📦 ? » sous les deux vendeurs, et la table quand une première valeur arrive.

## v7 — la recette
**Avis.** C'est la meilleure des cinq. Le héros est compact (≈ 25 % de l'écran), avec ☐ À faire, son verbe, J-n et ses mots, ✓, « ⏭ plus tard »
écrit, et 3 ↩. L'anneau ✓1 ✗1 est en petit dans son coin. Tout le reste tient au-dessus du pouce, sur les 12 cas. La table « qui gagne quoi » des
bouteilles (`cap12/v7-bouteilles.png`) est la réponse à sa vraie question : B, 410 CHF, ⚠ 400/600 pour l'occasion, hachuré pour la livraison
inconnue. Les gestes tiennent (`cap/v7-*`) :
- la ligne s'ouvre sur place, mots surlignés, avec « Mes notes ↩ » et « ☆ Retenir » ;
- la ligne de l'IA dit « Proposé par l'IA, pas dans tes notes », avec ✕ Retirer et ＋ Garder ;
- l'Aide montre une seule proposition, ✦ IA, sans cacher le héros ;
- le refus affiche un toast avec Annuler ;
- l'état IA absente montre ses notes numérotées.

Le texte ajouté après un geste reste sous 30 mots. Les propositions de l'Aide ont du sens en brassage : « Note le code du voyant avant d'appeler »,
« Livraison Verallia ? », « Demande si le joint suffit avant le devis ».

Phrase prédite : « Là c'est clair, je vois quoi faire et pour quand, et le tableau des bouteilles c'est exactement ça. Mais la chaudière,
j'appelle pas demain à 7h, je brasse à 7h ! »

**Problèmes.**
1. B — `cap12/v7-chaudiere.png`, `cap/v7-chaudiere-repos.png` : le héros affiche « Appeler le technicien · J-1 demain 7h », et la ligne « Brassage
   IPA » a disparu au repos. Elle n'existe plus que dans `cap/v7-chaudiere-sansia.png`. On lit l'heure de l'appel, alors que c'est l'heure du
   brassage : valeur fausse (étape 0, sens métier), et la raison de l'urgence est perdue. La v6 la garde (« ⏳ Brassage IPA J-1 »).
   Correction : « J-1 · avant brassage 7h », ou bien « aujourd'hui » en rouge, avec « 🍺 Brassage IPA demain 7h » en sous-ligne du héros.
2. B — CN1 : `cap12/v7-co2.png`, « Raccord changé » dans 🛠️ sans ✓.
3. m — CN4 : `cap12/v7-citra.png`, table 2 × 2 entièrement hachurée.
4. m — `cap12/v7-citra.png`, `v7-bouteilles.png` : la pastille 🛒 en haut à gauche du héros est muette, et fait doublon avec ⚖️. La retirer.
5. m — CN2 (`cap12/v7-pilsner.png`) et CN3 (`cap/v7-bouteilles-sansia.png`).
6. m — `cap12/v7-ecoulement.png` : « Changer le joint » est cassé sur 2 lignes à côté du hachuré, alors que « Sanitaire entreprise X » tient.
7. m — `cap12/v7-co2.png`, `v7-chaudiere.png`, `v7-bouteilles.png` : 30 mots pile, aucune marge. Tout ajout devra en retirer.

**À greffer ailleurs.** C'est la base.

**Note : 7,5/10.**

## v6 — Une seule chose maintenant
**Avis.** Les corrections sont faites : le réglé est en vert, les dates sont dans le héros, les bouteilles sont honnêtes. Le héros se lit
toujours en une seconde, mais il mange 30 à 40 % de l'écran. Pour le pilsner (`cap12/v6-pilsner.png`), « Commandé 2 sacs, brassin maintenu »
en 40 px prend la moitié de l'écran pour une chose réglée. La v7 fait la même chose en plus compact, et la dépasse.

Phrase prédite : « Toujours aussi clair. Mais c'est énorme pour pas grand-chose, et "Fournisseur B par 600" ça veut dire quoi ? »

**Problèmes.**
1. B — CN1 : `cap12/v6-co2.png`.
2. m — `cap12/v6-bouteilles.png` : « 👑 Fournisseur B par 600 » est cryptique, et aucun prix à la bouteille n'est montré (la v7 les montre).
3. m — `cap12/v6-assurance.png` : « Renouveler l'assurance J-36 » répète le J-36 du héros. `v6-chaudiere.png` : J-1 dit 2 fois.
4. m — `cap12/v6-pilsner.png` : le héros réglé est géant. Un réglé n'a pas besoin de 40 px.
5. m — ⏭ sans libellé visible (`cap12/v6-*.png`), alors que la v7 écrit « plus tard ».
6. m — CN2.

**À greffer.** La sous-ligne « ⏳ Brassage IPA J-1 » de la chaudière, qui manque à la v7.

**Note : 7/10.**

## v2 — Tuiles
**Avis.** Grand progrès. La tâche est la première tuile, avec J-n. La paire 1,2 bar le 15 ↘ 0,4 bar le 22 (`cap12/v2-co2.png`) se lit à deux
mètres. La **jauge du coût total** des bouteilles (`cap12/v2-bouteilles.png` : barre par offre, hachuré pour l'inconnu, ⚠ 80 en rouge,
👑 410) est le meilleur visuel des cinq pour « lequel coûte le moins » : elle se voit sans lire de chiffres. Reste le défaut de genre : une
tuile géante pour une chose qui ne le mérite pas.

Phrase prédite : « La barre des prix c'est top, je vois direct que B est le moins cher. Mais "par 600" en énorme, encore, ça dit rien. »

**Problèmes.**
1. B — `cap12/v2-bouteilles.png` : la tuile « Fournisseur B / par 600 » en 32 px ne dit rien. Le tour 1 l'avait déjà relevé (B1, « par 600 en
   géant ne dit rien ») : c'est rejoué. Correction : supprimer la tuile, car la jauge suffit.
2. B — CN1 : `cap12/v2-co2.png`, tuile « Raccord changé ».
3. m — `cap12/v2-bar.png` « 0/1 trouvé », `v2-citra.png` « 0/1 », `v2-chaudiere.png` « 0/2 » : une jauge de recherche à zéro, pour une ou deux
   questions, est du bruit qui occupe une tuile entière. Elle n'a de sens qu'à partir d'une piste trouvée.
4. m — `cap12/v2-assurance.png`, `v2-chaudiere.png` : J-36 et J-1 dits 2 fois (tâche, puis échéance).
5. m — `cap12/v2-citra.png` : deux tuiles vendeur vides, seulement hachurées (CN4).

**À greffer.** La jauge du coût total, au-dessus de la table v7 des bouteilles ou à la place de sa ligne 🧾 ; le chiffre clé avec sa date
dessous (déjà dans la v7).

**Note : 6,5/10.**

## v1 — Carte mentale
**Avis.** Les corrections tiennent : 8 branches au plus, plus de chevauchement, une carte « maintenant » au-dessus du pouce avec J-n, et une
carte des bouteilles lisible (`cap12/v1-bouteilles.png` : ≥504, 410 ✦ conseillé, ≥80 ⚠ 400/600). Mais pour une échéance ou un mémo, la carte
cache ce qu'il a à faire : la cave n'est plus qu'un cœur J-11 et un nœud « 📋 3 » (`cap12/v1-cave.png`). L'œil va au centre, alors que l'action
est en bas.

Phrase prédite : « C'est joli, mais pour la cave je vois même pas ce qu'il y a à faire, faut cliquer. »

**Problèmes.**
1. B — CN1 : `cap12/v1-co2.png`.
2. m — `cap12/v1-cave.png`, `v1-fete.png`, `v1-assurance.png` : ses sous-tâches sont cachées derrière « 📋 3 » et « 📋 4 », à un toucher.
3. m — `cap12/v1-assurance.png` : J-36 est dit 3 fois (cœur, nœud, carte).
4. m — `cap/v1-ecoulement-refus.png` : le trait pointillé reste après le refus. Le défaut est connu et n'est pas corrigé.
5. m — `cap12/v1-pilsner.png` : un grand cœur « Réglé » vide, et le détail n'est plus accessible (pas de « ▸ Détail »).
6. m — `cap12/v1-sureau.png`, `v1-levure.png` : le cœur sans contenu n'apporte rien à une idée ou à un test.

**À greffer.** Rien de neuf. L'anneau et la grammaire des formes sont déjà dans la v7.

**Note : 6/10.**

## v3 — Chemin
**Avis.** Elle sort de la frise générique : le rail dépend du genre, et la sureau et la levure n'en ont pas (§ FRISE-GENERIQUE tenue à la lettre).
Le halo a disparu. La table N colonnes des bouteilles est bonne, et la v7 l'a reprise. Mais le rail éloigne la date de la tâche : « Réserver
le stand » est en haut, J-96 au bout du rail, 380 px plus bas (`cap12/v3-fete.png`, `v3-cave.png`, `v3-assurance.png`, `v3-bar.png`). Aux
bouteilles, sous la table, une station ✋ répète les 3 vendeurs en grands boutons ☆.

Phrase prédite : « Mieux, mais je dois descendre pour voir pour quand, et les trois étoiles en dessous du tableau, ça sert à quoi ? »

**Problèmes.**
1. B — `cap12/v3-chaudiere.png` : même défaut que la v7. « Appeler le technicien J-1 demain 7h », et Brassage IPA absent.
2. B — CN1 : `cap12/v3-co2.png`.
3. m — date au bout du rail, loin de la tâche : `cap12/v3-fete.png`, `v3-cave.png`, `v3-assurance.png`, `v3-bar.png`. La correction 1 demandait
   la date dans le héros.
4. m — `cap12/v3-bouteilles.png` : la station ✋ répète « ☆ Verallia ☆ Fournisseur B ☆ Occasion » sous la table (3 rangées pour rien). Le
   héros n'a pas de titre, puisque la station ⚖️ n'a pas de verbe. J-20 flotte entre la table et le rail.
5. m — `cap12/v3-ecoulement.png` : « Contacter entreprise » / « X » coupé ; `v3-citra.png` : table entièrement hachurée (CN4).
6. m — doute, non compté : même dépendant du genre, un rail vertical sur 10 cas sur 12 peut encore lui sembler « la frise sur le côté ».

**À greffer.** Le libellé « Brassin J-8 » du pilsner (CN2).

**Note : 6/10.**

## Classement
1. **v7 (7,5)** : la recette fonctionne. Elle dit quoi faire et quand en 3 s sur 11 cas sur 12. Ses gestes sont propres et l'IA y est marquée et
   refusable. Une valeur fausse sur la chaudière.
2. **v6 (7)** : juste et lisible, mais trop grosse. La v7 la dépasse sur tout, sauf sur la ligne Brassage IPA.
3. **v2 (6,5)** : la jauge du coût total est la meilleure image d'un achat. « par 600 » est rejoué, et les jauges 0/1 font du bruit.
4. **v3 (6)** : la frise est sortie, mais la date est loin de la tâche, la station ✋ est redondante et Brassage IPA est perdu.
5. **v1 (6)** : propre, mais elle cache les sous-tâches et n'apporte plus d'idée neuve.

La passe a progressé : 8 des 9 communs du tour 1 sont réglés, et aucune variante n'est sous 6. Elle n'est pas « satisfaisante » : CN1 est un
bloquant partout, et la chaudière a un B dans la v7 et la v3.

## À écarter
Aucune n'est sous 6 chez moi. v1 et v3 sont à 6 tout juste, et toutes leurs idées sont déjà dans la v7 : je propose de les arrêter au tour 3,
sauf si elles y apportent une idée neuve. La v6 reste comme témoin du héros « grand format ».

## Recette, tour 3 (mécanisme → source)
1. **Base v7 telle quelle** : héros compact, À faire / ✓ Réglé, J-n avec ses mots, anneau, « ⏭ plus tard », n ↩, rangées 🔎 / 🛠️ / 📋, table N
   offres avec 🧾, hachuré, ✦ IA et ✕, Aide une à une, toast Annuler, IA absente.
2. **Raison de l'échéance sous le verbe** (« 🍺 Brassage IPA demain 7h », et la date du héros « avant 7h » ou « aujourd'hui ») → **v6** (ligne
   ⏳ Brassage IPA). Corrige B1 de la v7.
3. **Fait accompli rangé en ✓** (« Raccord changé ✓ » dans 🔎, jamais dans 🛠️) → neuf (CN1).
4. **Jauge du coût total** (barre par offre, hachuré pour l'inconnu, ⚠ en rouge) en tête de la table des bouteilles, ou à la place de sa
   ligne 🧾 → **v2**.
5. **Objet du compte à rebours** (« Brassin J-8 ») → **v3**.
6. **Citra sans valeur connue** : pas de table, une rangée « 💰 ? 📦 ? », et la table à la première valeur → neuf (CN4).
7. **Nettoyage** : retirer la pastille 🛒 muette du héros, ne pas couper « Changer le joint », écrire ses lignes en entier dans l'état IA
   absente (CN3), ne dire J-n qu'une fois.

LEÇON PROPOSÉE : un retrait de doublons doit garder la raison d'une date. La v7 a supprimé « Brassage IPA J-1 » parce que J-1 était déjà dans le
héros, et le héros dit désormais l'heure du brassage comme celle de l'appel. Le contrôle des doublons compare les chiffres et oublie l'objet
qu'ils portent.
