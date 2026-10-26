OK — radar commun : tiretés longent le secteur hachuré ou font un arc (Comparer Absolu corrigé), points 9–10 px à liseré blanc

## CORRECTION 2 (après la critique, sur f5a53f99) : Comparer en Absolu
Cause : la branche `bas` envoyait aussi les cordes basses d'axes que seule une série ignore jusqu'au bord (rayons du contour au bord). Correctif, sans toucher aux autres écrans :
- le **tour du bord** reste pour un secteur hachuré : le groupe « sans donnée » (Substituer, fiche, Comparer) et les axes « pas goûté » de Ma bière (inchangés : captures identiques à celles que le critique a acceptées) ;
- une **corde basse sur des axes que seule cette série ignore** : un arc d'anneau au rayon du plus bas des deux points (`data-contour="arc"`), sans aller-retour radial (`cheminArc`) ;
- une enjambée qui contient le groupe **et** d'autres axes sans valeur de la série : un arc au rayon du plus bas des deux points jusqu'à l'arête du groupe, puis le tour du groupe seul (avant : le tour de tout l'enjambement, d'où les rayons).
Contrôle étendu (`controle-radar-lisible.mjs`) : un tireté ne s'éloigne pas du centre au-delà du plus haut de ses deux points (+ 2) sauf le long d'un secteur hachuré (à 4 px près) ; il couvre Comparer en Absolu (déjà mesuré) et au style. Test unitaire neuf : une série à qui il manque trois familles → arc, rayons ≤ 55 %.
- Sur **f5a53f99** (copie hors dépôt) : `LISIBLE ECHEC 4` (4 tiretés de Comparer Absolu : « monte au bord hors de tout secteur hachuré », 64 à 108 points sur 121) ; test unitaire neuf : `1 failed | 5 passed`.
- Sur le code corrigé : `LISIBLE OK` ; `npx vitest run radarLisible + radarContourOriginal` (+ radarBiere) : `3 files, 14 tests passed` ; `npm run build` : `✓ built in 22.89s` ; `controle-contour-original` → `CONTOUR OK` ; `controle-trait-ta-biere` → `TRAIT OK`.
- **`img/comparer-absolu-apres.png` rouvert** : le petit contour central reste net ; plus aucun rayon vers le bord ; les tiretés de Lotus, Calypso et Solero font de courts arcs serrés autour du contour, puis longent le secteur « sans donnée » (trois liserés parallèles). Substituer (`substituer-apres.png`) et Ma bière rouverts : même lecture qu'avant, la corde baies → noyau n'existe plus ; Ma bière identique à celle acceptée. Avant correction : `img/comparer-absolu-f5a53f99.png`.
- **Marque « peu de données » (voie c7), ouverte en image** (`img/peu-de-donnees-ecran.png`, `img/peu-de-donnees-ligne.png`) : recherche « Usda 200010 008 » (première variété `peuDeDonnees` du catalogue : 163 sur 505) dans l'ajout rapide, 390 × 844. La ligne : « Usda 200010 008  α 11,1 % / amérisant · caddie · *peu de données* (italique) / 10 g +4 IBU », pastille 10′ à droite. Mesuré : 13 px, gris `rgb(102,102,102)` (≈ 5,7:1 sur le fond clair), 88 × 18 px, sur la ligne d'origine, rien de tronqué ni de chevauché. Lisible, discret, hiérarchie de la ligne intacte (nom, α, rôle d'abord). Je n'ai rien de plus à signaler : c'est un texte, il ne dépend pas du radar.
- Limite : Comparer Au style garde ses cordes droites d'inconnus isolés en haut à gauche (65 à 87 % du rayon), signalées par le critique comme non bloquantes ; non touchées, comme demandé.

## Fichiers écrits
- `src/ui/hopIndex/commun/RadarBase.tsx` (dessin du radar seulement).
- `tests/unit/hopIndexV4/radarLisible.test.tsx` (neuf, 5 tests) ; `tests/integration/controle-radar-lisible.mjs` (neuf, Chrome).
- `tests/unit/hopIndexV4/radarContourOriginal.test.tsx` : deux nombres mis à jour (r 4 → 5 pour la retenue, r 3 → 4,6 pour une série seule), conséquence directe de D181.
- Ce dossier : `RESULTAT.md`, `img/` (captures avant/après + `bilan-avant.json`, `bilan-apres.json`).

## Ce qui change (et rien d'autre)
- **D180.** Un tireté qui enjambe le secteur « sans donnée » regroupé ne passe plus par la corde : du point connu, un arc au même rayon jusqu'à l'arête du secteur (la médiane entre deux axes), l'arête vers le bord, le tour du bord du secteur (polygone du dernier anneau, rentré de 2 px), puis le retour symétrique. Chaque série a son liseré (rentré de 2 + 3 px × rang) : trois tiretés sur le même bord se recouvriraient. Le chemin est un `<path data-role="tirete" data-contour="bord">`, tireté 5 4 comme avant, couleur et épaisseur de la série. Le plein et les voiles ne changent pas.
- **Un inconnu isolé** (entre deux axes voisins, ou toute corde qui reste à plus de 30 % du rayon) garde sa ligne droite. Seule extension : une corde qui passerait à moins de 30 % du centre sans enjamber le groupe (Ma bière : plusieurs axes « pas goûté » de suite ; une série à qui il manque plusieurs familles) longe aussi le bord. C'est ce que le contrôle « aucun tireté à moins de 30 % » impose sur Ma bière et Comparer (voir DÉCISION).
- **D181.** Point de série : r 3 → 4,6 (9,2 px), retenue 4 → 5 (10 px), hors du style 3,8/4,8 → 5,2/5,6 ; liseré blanc de 1,6 sur tous (avant : seulement la retenue et l'orangé). Les anneaux creux de l'original (r 6,2) et toutes les couleurs sont inchangés.

## Critères, sorties décisives
- Test neuf sur HEAD (copie de HEAD, hors dépôt) : `3 failed | 2 passed` ; sur mon code : `5 passed (5)`.
- Contrôle Chrome `controle-radar-lisible.mjs`, 390 × 844, échelle 1 : sur HEAD `LISIBLE ECHEC` (ex. « comparer-style : tireté de Lotus à 0 % du rayon du centre (seuil 30 %) », « comparer-absolu : tireté de Calypso à 20 % », « ma-biere : tireté à 16 % », points de 6,0 et 7,6 px sans liseré) ; sur mon code `LISIBLE OK`. Bilan après : fiche, Substituer, Comparer (Absolu et Au style), Ma bière ; points min 10 px, contraste fond ≥ 3,42:1, aire des autres séries ≥ 3,1:1.
- `npx vitest run tests/unit/hopIndexV4` : 81 fichiers, 760 tests verts. Une erreur « Timeout calling onTaskUpdate » du worker vitest (charge de la machine, 97 s) ; tous les tests passent.
- `npm run build` : `✓ built in 19.67s` (il réécrit `dist/`).
- `with_server.mjs … VITE_HOP_V4=on` : `controle-contour-original.mjs` → `CONTOUR OK` ; `controle-trait-ta-biere.mjs` → `TRAIT OK`.
- Captures ouvertes en image (avant et après) : Substituer (`img/substituer-*.png`), Comparer Absolu et Au style, Ma bière, fiche. Avant : la corde pointillée de baies à noyau sur Comparer ; après : plus aucune corde dans le radar, les tiretés suivent le bord hachuré ; points bleus et verts nets, cerclés de blanc.

## Essais
Un par critère, sauf la mise au point du contrôle (copie de HEAD sans `.env` ni `seedData.ts`, retrouvés) et une généralisation du tracé (voir plus haut) après la première capture de Ma bière.

## Doutes et limites
- **Caliente n'est pas proposé pour Lotus dans les fixtures** : le trio mesuré est Lotus contre Solero et Calypso (son cas exact ne se rejoue qu'avec ses données de production). Le contrôle essaie Caliente et Citra cryo d'abord, puis prend les deux premiers.
- **Lecture du « 3:1 »** : un liseré blanc ne peut pas tenir 3:1 sur un fond blanc. Le contrôle exige donc : la couleur de série du point tient ≥ 3:1 sur le fond et sur l'aire des autres séries (mélange réel du voile), et le liseré est clair (luminance ≥ 0,8, ≥ 1 px) pour détacher le point du trait. Les couleurs de série ne changent pas.
- **Exception du seuil de 30 %** : un point connu bas (moins de 30 % du rayon) est lui-même sous le seuil ; le contrôle exige alors 85 % du rayon de ce point, jamais plus bas que lui (la corde s'écarte, le point reste).
- **Comparer à trois houblons** avec beaucoup de « ? » : l'intérieur est dégagé, mais le bord se charge (jusqu'à trois tiretés en parallèle côte à côte). C'est plus lisible au centre, plus dense au pourtour ; à juger sur `img/comparer-style-apres.png`.
- Un point d'une série peut encore être recouvert par le voile d'une série dessinée après elle (les points restent dans le groupe de leur série, que les contrôles existants lisent) ; son contraste est tenu, sa visibilité aussi à 9–10 px.
- Suggérer (voie f7) et la fiche utilisent le même radar : ils changent d'apparence par ricochet, sans que j'aie touché à leur dossier. La fiche est mesurée.
- Le 30 % ne s'applique pas à un tireté qui ne traverse pas un secteur et reste à plus de 30 % (corde droite gardée, comme demandé).
- La maquette (`prototypes/houblons-v4/parcours`) réexporte ce radar : à reconstruire pour que `controle-radar-base.mjs` et les états la voient.

DEMANDE EXECUTANT :
1. `node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-r2` → attendu `CONSTRUIT OK`.
2. `node prototypes/houblons-v4/parcours/outils/verifier-types.mjs` → `TYPES OK`.
3. `node work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs prototypes/houblons-v4/maquettes/parcours-r2` → `RADAR-BASE OK (9 vues)` (même comptes de points et d'anneaux qu'avant : 8 vues + `biere · radar`).
4. `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-r2 --ecran=biere`, puis `--ecran=comparer`, puis `--ecran=fiche`, puis `--ecran=suggerer` → `ETATS OK (n/n)` pour chacun.
5. À ouvrir en image : les captures que ces contrôles écrivent pour Comparer au repos et en Absolu, la fiche, Suggérer en Radar, Ma bière en Radar. Dire si un tireté traverse encore un radar, et si un point est plus petit que 9 px.
Ne rien écrire hors de `maquettes/parcours-r2` et de `os.tmpdir()`.

DÉCISION (tranchée par la critique : arc d’anneau pour les cordes basses hors secteur hachuré, voir CORRECTION 2) : le tracé le long du bord vaut-il aussi pour les cordes basses hors du secteur regroupé (Ma bière, Comparer) ? Options : (a) oui, comme livré : le contrôle « aucun tireté à moins de 30 % » tient partout, mais le bord de Comparer à trois houblons se charge ; (b) non, seulement le secteur « sans donnée » regroupé, comme dit au départ : le contrôle ne porte alors que sur lui, et Ma bière garde ses cordes à 16 % du rayon. Recommandation : (a), car sa plainte vise tout trait qui traverse le graphe ; revenir à (b) en retirant la branche `bas` de `RadarBase.tsx` (3 lignes).

CONNAISSANCE : le radar commun a deux dessins de tireté (ligne droite pour un inconnu isolé, chemin le long du bord pour une corde basse ou un secteur regroupé) ; ils se distinguent par `data-contour="bord"`. Un contrôle qui cherche `line[data-role="tirete"]` rate les chemins.
LEÇON PROPOSÉE : un contrôle « avant » contre HEAD se lance depuis une copie de HEAD hors dépôt (git archive + jonction `node_modules` + `.env` et fichiers ignorés comme `src/data/seedData.ts`), jamais en remplaçant le fichier dans l'arbre de travail (L17).
