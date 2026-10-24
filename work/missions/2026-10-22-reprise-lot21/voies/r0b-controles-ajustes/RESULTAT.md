OK — D99 admet acquis à un toucher et radar r3 ; D100 prend --seuil ; quatre témoins, 61 mutations

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs` (D99 : acquis « à un toucher », radar r3, en-tête mis à jour)
- `work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs` (D100 : `--seuil=<0..1>`, en-tête mis à jour)
- `work/refonte-frontend/v4/tournoi/outils/temoins/acquis-toucher-ok/etat.html` (positif)
- `work/refonte-frontend/v4/tournoi/outils/temoins/acquis-deux-touchers/etat.html` (négatif)
- `work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-seuil-ok/etat.html` (positif)
- `work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-seuil-ko/etat.html` (négatif)
- ce fichier. Rien d'autre écrit dans le dépôt (générateur, captures et mutations dans le scratchpad).

## Comportement ajouté
**D99 à un toucher.** Plus aucun `<details>` ouvert d'office. Au repos on mesure ; pour chaque acquis caché, on cherche les `button`, `summary`, `[role="button"]` visibles au repos qui le déclarent (`aria-controls` vers le conteneur ou un élément qui le contient, ou `data-ouvre-acquis="a b"`). Pour chacun : page rechargée, un seul tap tactile, nouvelle mesure. Sortie par page : `acquis-toucher-ok · 4/4 : radar r3 (au repos), chimie (à un toucher), osu (au repos), valeurs (à un toucher)` ; ligne finale inchangée `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`. Messages d'échec distincts : « caché au repos, sans déclencheur à un toucher » ; « un seul toucher sur son déclencheur ne le fait pas apparaître (deux touchers ou plus : absent) » ; fautes de contenu suffixées « (après un toucher) ».
**D99 radar r3.** Dans `[data-acquis="radar"]` : un seul svg visible = règle r2 inchangée (150 px, 2 séries) ; deux svg ou plus = règle r3 (120 px, `data-axes` identiques, 5 axes, une série de 5 sommets au moins par svg, `data-valeurs` alignées, séries pas toutes identiques). La ligne dit « radar r3 ».
**D100 seuil.** `--seuil=0.25` (virgule admise ; hors de [0 ; 1] ou illisible : code 2). « Plus de » strict (Motueka 3/12 = 25 % ne dépasse pas 0,25). La ligne OK dit le seuil : `SANS-FAMILLE OK (1 houblon(s) au-dessus de 25 %, part « autres » visible)`.

## Sortie décisive de chaque critère (CHECK rejoués depuis la racine)
- G1 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)` après `acquis-toucher-ok · 4/4 : radar r3 (au repos), chimie (à un toucher), osu (au repos), valeurs (à un toucher)`.
- G2 : `ECHOUE OK` — « valeurs : un seul toucher sur son déclencheur ne le fait pas apparaître » ; radar, chimie, osu tenus (3/4).
- G3 : `ECHOUE OK` (y3 : radar absent ; chimie, osu, valeurs non balisés).
- G4 : `SANS-FAMILLE OK (1 houblon(s) au-dessus de 25 %, part « autres » visible)` (Galaxy 29 %).
- G5 : `ECHOUE OK` — Galaxy 29 % (2 mots sur 7), aucune part « autres » visible.
- G6 : `SANS-FAMILLE OK (0 houblon(s) au-dessus de 50 %, rien à montrer)`.
- G7 : `ECHOUE OK` (l5f : Nelson Sauvin 83 %, Hallertau Blanc 67 %).
- Critères de r0 rejoués après modification : y3 et y1b en échec ACQUIS, `acquis-ok` OK 4/4 (tout « au repos »), l5f en échec SANS-FAMILLE, `sans-famille-ok` OK (2 houblons à 50 % comme à 25 %).
Essais : 1 par critère, aucun échec.

## Preuves
- **61 mutations** rejouées hors dépôt (`scratchpad/mut-r0b.mjs`) : 60 jugées comme attendu, 1 « mal jugée » qui était ma mutation et non le contrôle (data-part 0.39 refusé car la limite est part réelle 0,286 + 0,10 = 0,386 ; rejouée à 0.38 : OK). 0 contrôle mal jugé. Échecs obtenus notamment : déclencheur absent / sans déclaration / aria-controls vers un id absent / opacity 0 / display none / visibility hidden / déclarant un autre acquis / second toucher nécessaire / details non déclaré ; radar r3 à 1 radar, axes différents, 4 axes, 100 et 119 px (120 px passe), sans série, séries identiques, 4 sommets, valeurs mal alignées, sans data-radar, sans balise ; chimie sans pictos après toucher ; valeurs sans source ; OSU simulé ; part « autres » hachurée, orange, bleue, sans balise, minuscule, sans fond, sans nom, data-part gonflée ; seuils 0, 0.28, 0.2857, 0.3, 1, `0,25`, `0.125` (affiché 12,5 %), `abc`, `-0.1`, `1.5`, vide (code 2). Passent comme voulu : aria-controls seul, data-ouvre seul sur un summary natif, 2 radars r3, panneau « Preuves » non caché, `<details>` avec summary déclaré.
- Captures à 390 px prises et ouvertes (L12) : `acquis-toucher-ok` au repos puis après un toucher sur chaque déclencheur, `acquis-deux-touchers`, `sans-famille-seuil-ok` (barre : agrumes 1, tropicaux 3, noyau 1, autres 2 en gris), `sans-famille-seuil-ko` (même barre sans « autres », mots en une ligne de texte). Les trois radars r3 s'affichent deux par rangée à 168 px ; pictos d'axes à la place des libellés (12 libellés ne tiennent pas à cette taille).

## Chiffres des témoins
Valeurs de `pack-fiches.json` et des témoins de r0 (radar, chimie, OSU, valeurs : repris de `acquis-ok`, déjà sourcés). Galaxy : 5 mots rattachés (agrumes ; fruit de la passion, ananas, fruits tropicaux ; pêche) + 2 sans famille (cannabis, dank) = **29 %** (2 sur 7), et non 40 % comme l'écrivait VOIE.md ; corrigé par le pilote, les témoins disent 29 %. α affiché : 11–16 % (Beer Maverick 2023, `alpha.sources`), pas les 17,2 % de la fiche de stock.

## Doutes et limites
- **`<details>` nu n'est plus ouvert d'office** : un lot qui range un acquis dans `<details><summary>` doit déclarer le summary (`aria-controls` ou `data-ouvre-acquis`). Plus strict que r0, conforme à VOIE.md ; le message d'échec dit quoi ajouter. Un auteur qui l'oublie échoue sans que l'acquis soit réellement absent.
- Seul le premier toucher est joué ; le contrôle ne vérifie pas que le déclencheur est assez grand pour un doigt (aucune taille minimale demandée ; les témoins ont 44 px).
- Un déclencheur peut déclarer un acquis et en ouvrir un autre : on ne compte que l'acquis déclaré.
- Au seuil 0,25, les houblons jugés dans le pack passent de 5 (seuil 0,5) à bien plus (Galaxy 29 %, Aurum 38 %, Lotus 38 %, Columbus 33 %, Target 27 %, Golding 29 %…). Beaucoup de leurs mots sans famille sont des génériques (fruité, doux, noble) : si le brasseur retient l'option B avec seuil 25 %, la liste des mots génériques à exclure du calcul pèse plus que le seuil. Non compté ici.
- Brancher dans `controle-lot.mjs` / `controle-commun` : au pilote. Les lignes D99 et D100 de DEFAUTS-RECURRENTS.md (« à ajuster avant r6 ») sont à mettre à jour par lui.

DÉCISION À PRENDRE : seuil par défaut du contrôle D100 pour le lot 22. Options : (a) garder 0,5 par défaut et passer `--seuil=0.25` dans les GATES du lot 22 si l'option B est retenue ; (b) mettre 0,25 par défaut. Recommandation : (a), le défaut reste celui de la règle écrite au brasseur ; le seuil réel se corrige par le brasseur dans les GATES, pas dans le code.

CONNAISSANCE : Galaxy a 29 % de mots sans famille (2 sur 7 : cannabis, dank), pas 40 % ; à un seuil de 25 %, les houblons jugés par D100 sont nombreux (Aurum 38 %, Lotus 38 %, Columbus 33 %, Galaxy 29 %, Golding 29 %, Target 27 %), beaucoup pour des mots génériques (fruité, doux, noble) : à ajouter à [[descripteurs-hors-familles]].

LEÇON PROPOSÉE : aucune
