OK — Suggérer lit l'appel complet d'emblée après préchauffe ; 0 px de saut, 5 cas, 2 modes ; 1 test d'un autre fichier échoue

## Ce qui est fait (D111)
- **Après préchauffe** : `prechauffe.ts` expose `estChauffee(recette)` (la clé volume|levure|durée est dans le `Set` des chauffées). `suggerer/index.tsx` décide **une fois à l'ouverture** (`useState(() => estChauffee(recette))`) : `dEmblee = avecMoins || chauffee`. D'emblée, Suggérer lit `proposer` (complet) : groupe « Remplacer » au premier rendu, aucun appel différé, aucune place réservée. La règle de f6 (visée « moins de… » = appel complet d'emblée) reste.
- **Sans préchauffe** (ouverture directe à froid, visée « plus de… ») : premier affichage rapide, appel complet au repos, **place réservée** `PLACE_REMPLACER_PX = 42` (`differe.ts`, était 0 : un titre + une ligne, hauteur mesurée en f6). La section de place n'est rendue que sur ce chemin (`place > 0`).

## Critères
**1. 0 px de saut, 5 cas, 390 × 844, l'app, stock de fixtures** (script `capturer.mjs`, `perf/capturer-chauffe.txt`, `perf/capturer-froid.txt`, `CAPTURE OK` aux deux modes). Positions en px depuis le haut de la page, avant (premier affichage) → après (appel complet arrivé) :

| cas | mode préchauffé : dry hop / levure | Remplacer | mode froid : dry hop / levure | place |
|---|---|---|---|---|
| 21C agrumes | 1785,2 → 1785,2 / 1944,2 → 1944,2 (**0 / 0**) | aucun | 1827,2 → 1827,2 / 1986,2 → 1986,2 (**0 / 0**) | 42 px, reste (vide) |
| 21C floral+agrumes−résineux | 2039,7 → 2039,7 / 2214,7 → 2214,7 (**0 / 0**) | aucun | idem (visée « moins » : d'emblée) | aucune |
| 16D plus floral | 1786,2 → 1786,2 / 1945,2 → 1945,2 (**0 / 0**) | **1 ligne dès le premier rendu** | 1786,2 → 1786,2 / 1945,2 → 1945,2 (**0 / 0**) | 42 px puis le groupe la prend |
| 16D moins résineux | (pas de dry hop) / 1365,9 → 1365,9 (**0**) | 10 lignes d'emblée | idem | aucune |
| 16D floral+tropical | 1768,7 → 1768,7 / 1961,9 → 1961,9 (**0 / 0**) | aucun | 1810,7 → 1810,7 / 2003,9 → 2003,9 (**0 / 0**) | 42 px, reste (vide) |

- Verdicts de carte changés : 0 dans les 10 passes. Lignes principales : stables (préchauffé 15→15, 15→15, 14→14, 0→0, 15→15) ; en froid, 16D floral 15 → 14 à l'arrivée (une ligne de « Ajouter » quitte la liste pour le groupe : le contenu du rapide diffère de celui du complet, comme en f6, mais rien ne se déplace).
- **16D plus floral préchauffé : le +42 px de f6 est parti** (dry hop 1786,2 dès le premier affichage, valeur que f6 mesurait « après »).

**2. Aucun vide de 42 px après préchauffe** : en mode préchauffé, `place` = 0 section, 0 px dans les 5 cas ; le dry hop est 42 px plus haut qu'en froid dans les deux cas sans « Remplacer » (21C agrumes 1785,2 contre 1827,2 ; 16D floral+tropical 1768,7 contre 1810,7). Le vide de 42 px n'existe plus que sur le chemin froid, dans 2 des 5 cas.

**3. Premier appel (moteur, `froid-complet.ts` de f6 et `f4-froid.ts`, 5 processus par mode, `perf/premier-appel.txt`), médiane (min–max), ms** :

| appel | avec préchauffe | sans préchauffe |
|---|---|---|
| complet (`proposer`, ce que Suggérer lit désormais d'emblée après chauffe) | **220,1** (216,1–232,9) | 467,1 (290,3–590,8) |
| rapide (`proposerRapide`) | 195,1 (191,4–215,2) | 451,6 (388,5–554,7) |
| `f4-froid.ts --chauffe=aucune` (rapide, froid) | | 431,2 (293,3–460,5) |

  f6 annonçait ~232 ms ; ici 220 (même ordre ; chaque processus est un premier appel). L'appel complet préchauffé coûte **25 ms de plus** que le rapide préchauffé. Dans Chrome (journal du moteur), la préchauffe elle-même fait 173 à 231 ms. Le froid est très dispersé (290 à 590) : le chiffre à retenir est « 2 fois plus cher sans préchauffe », pas la valeur exacte.

**4. Tests** : `npx vitest run tests/unit/hopIndexV4/suggererRemplacementsDifferes.test.tsx tests/unit/hopIndexV4` → **79 fichiers verts, 754 tests verts, 1 test rouge** (`radarContourOriginal.test.tsx`, « laisse le point plein du remplaçant… » : 0 points au lieu de 3) et le « Timeout calling onTaskUpdate » connu (sortie 1, `perf/vitest.txt`). Le rouge n'est pas de ma voie : il teste `commun/RadarBase.tsx`, modifié dans l'arbre par la voie r2-radar-lisible (non commité) ; il échoue aussi seul. Mes deux fichiers de test : verts (11 tests). **`npm run build`** : vert, `tsc` compris (`perf/build.txt`).

**5. Captures ouvertes** (`img/`) : `chauffe-16D-floral-avant.png` et `-apres.png` : identiques, le groupe « Remplacer Nugget — Cascade 87 g » est là au premier affichage, entre « Ajouter » et « Dry hop », sans trou ; `froid-16D-floral-avant.png` : « Ajouter » liste Target et Motueka, la place de 42 px est tenue avant « Dry hop ». Les autres captures (`*-apres`, autres cas) existent, non ouvertes : leurs écarts mesurés sont 0.

## Tests écrits
`suggererRemplacementsDifferes.test.tsx` (3 tests) : « plus floral » à froid (place 42 px présente, appel complet attend le repos, liste inchangée à l'arrivée) ; « plus floral » après préchauffe (file du repos vide, aucune place, groupes et lignes identiques avant/après le repos) ; « moins résineux » (inchangé). `suggererD108.test.tsx` : la valeur de la place (0 → 42) et un test `estChauffee` (faux avant, programmée mais pas partie : faux, vrai après, indifférent aux grammes, faux pour un autre volume).

## Essais
Captures : 2 passes (une par mode, vertes du premier coup). Vitest : 2. Build : 1.

## Écarts, doutes et limites
- **Fichier hors de ma liste** : `tests/unit/hopIndexV4/suggererD108.test.tsx` (f6) affirmait `PLACE_REMPLACER_PX === 0` ; le changement de D111 le rendait faux. Mis à jour (une assertion + un test). Aussi `prechauffe.ts` : dans `suggerer/`, donc dans ma liste.
- **Réserve de 42 px = une ligne** : à froid, un groupe « Remplacer » de plus d'une ligne dépasse la réserve et pousse la suite du surplus (non mesuré en froid : les 5 cas n'ont que 0 ou 1 ligne en « plus de… »). À froid aussi, quand aucun groupe n'arrive, le vide de 42 px reste (2 cas sur 5) : lâcher la place ferait sauter de −42 px. C'est le compromis demandé par D111 pour le chemin sans préchauffe.
- **Mode froid de la mesure** : simulé en écartant la seule tâche de repos de la préchauffe (`.prechauffer(` dans le code de la tâche) ; la préchauffe de l'étape n'a donc jamais lieu. Dans le vrai usage, c'est l'ouverture directe de Suggérer avant la fin du repos ou hors de l'étape Houblons.
- **Décision à l'ouverture, figée** : si la préchauffe se termine pendant que Suggérer est ouvert à froid, l'écran reste sur le chemin différé (pas de bascule en route : le groupe ne bougerait plus de toute façon grâce à la place). En worker, `estChauffee` devient vrai au départ de la tâche, pas à sa fin : l'appel complet fait alors la queue derrière la préchauffe dans le worker (aucun effet sur le fil principal).
- Contenu : en préchauffé, la liste d'un « plus de… » est celle de l'appel complet (« Remplacer » peut retirer une ligne de « Ajouter » : 16D floral montre Target seul dans « Ajouter », Cascade dans « Remplacer »), ce que le brasseur voyait déjà après l'arrivée en f6.
- Les captures n'ont pas été jugées par le critique (aucun changement de dessin : seulement l'ordre d'arrivée).

## Fichiers
Écrits : `src/ui/hopIndex/suggerer/prechauffe.ts` (+`estChauffee`), `differe.ts` (place 42, commentaire), `index.tsx` (`chauffee`, `dEmblee`, `place`) ; `tests/unit/hopIndexV4/suggererRemplacementsDifferes.test.tsx`, `suggererD108.test.tsx` (hors liste, voir plus haut) ; ce dossier : `capturer.mjs`, `img/`, `perf/`.

## DEMANDE EXECUTANT :
Aucune obligatoire. Si le brasseur veut voir : `node scripts/with_server.mjs --server "npm run dev -- --port 5293 --strictPort" --port 5293 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/f7-suggerer-sans-saut/capturer.mjs --mode=chauffe --etiquette=chauffe` (attendu `CAPTURE OK`, écarts 0) puis `--mode=froid --etiquette=froid`. À rejouer quand r2-radar-lisible sera commité : `npx vitest run tests/unit/hopIndexV4` (attendu 0 rouge hors Timeout).

DÉCISION À PRENDRE : aucune. (Pour le pilote : le test rouge `radarContourOriginal` appartient à r2-radar-lisible.)

CONNAISSANCE : Après préchauffe, l'appel complet de Suggérer coûte 220 ms au premier appel (rapide 195 : +25 ms) ; sans préchauffe, 430 à 470 ms (290 à 590). Le chemin « complet d'emblée après préchauffe » supprime à la fois l'arrivée différée et la place réservée ; la place de 42 px ne reste que pour l'ouverture à froid.
LEÇON PROPOSÉE : aucune
