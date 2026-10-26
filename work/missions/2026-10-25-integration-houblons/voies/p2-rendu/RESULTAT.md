OK — rendu allégé : moment et grammes ÷ 1,8 à ×1, bande cmc2k au même pixel, tous critères joués ; ouverture de Comparer inchangée (DÉCISION)

## Fichiers modifiés (non commités)
- `src/ui/hopIndex/comparer/index.tsx` : (1) la mesure de la bande teintée cmc2k n'est plus un effet sans dépendances. `mesurer` (useCallback) est rejouée seulement si la colonne ou la hauteur peuvent changer (colonne retenue, moment, colonnes, lecture, familles montrées, étapes, houblon de référence, épingle). UN `ResizeObserver`, créé une fois, suit la taille de la section (fenêtre, repli, police).
- `src/pages/PageShell.tsx` :
  - (2) l'observateur d'isolation ignore les mutations dont la cible est dans la page de devant ;
  - l'effet `scrollKey` ne refait ni `scrollTop = 0` ni `focus()` au montage ; le focus est donné une fois par l'effet d'isolation ;
  - le contrôle « en-tête rendu » (8 `getComputedStyle` sur les ancêtres, dont le premier force le recalcul de style) ne tourne plus que clavier ouvert (`tight`), seul cas où son résultat sert ;
  - (3) un observateur d'attributs sur `<body>` pose `data-has-modal`, `data-has-drawer-open`, `data-has-fab`, `data-has-fab-floating`, `data-has-water-sels`, `data-has-activity-pill`. Il remplace les `body:has(...)`. La page porte `data-page-footer` quand son pied est rendu (remplace `[data-page-shell]:has(> footer)`).
- CSS, règles `:has` seulement : `brewer-chat.css`, `brewer-navigation.css`, `floating-actions.css`, `water/workshop.css`, `yeast-choice.css`. Spécificité conservée (`:root body[...]` là où l'argument du `:has` comptait deux classes). Plus aucun `:has` dans ces cinq fichiers.
- Tests : `tests/integration/AppQuickActionReturn.behavior.test.tsx` (la maquette de PageShell évalue aussi le vrai module, pour son observateur) ; `tests/integration/floatingActionsShellLayout.test.tsx` (deux tests deviennent asynchrones, `await act(async () => {})` avant de lire le style : l'attribut est posé en micro-tâche, avant la peinture).
- Hors de ma voie, à ne pas oublier : `fiche.css` garde `body:has(.pq-fiche) [data-vaul-overlay]` (autre voie). Pas de fichier de travail dans le dépôt (tout dans `%TEMP%/p2`). Pas de `git mv`.

## Le banc, avant / après en alternance (médiane / p95 « posé », ms ; n = 8)
Build « avant » = HEAD + arbre des autres voies sans mes fichiers ; build « après » = avec. Ordre joué : avant-1, après-1, avant-2, après-2 (journaux `%TEMP%/p2/alt-*.log`). « erreurs de page : aucune » dans les 4 runs. Poste chargé par d'autres sessions : ×4 varie jusqu'à ×3 d'un run à l'autre.

CPU ×1 (budget divisé par 4)
| mesure | avant-1 | après-1 | avant-2 | après-2 | budget |
|---|---|---|---|---|---|
| Comparer, réouverture | 168 / 196 | 170 / 192 | 180 / 189 | 170 / 197 | p95 ≤ 25 |
| Suggérer, réouverture | 68 / 70 | 65 / 76 | 78 / 81 | 67 / 69 | p95 ≤ 25 |
| Fiche, réouverture | 103 / 108 | 91 / 105 | 100 / 105 | 90 / 102 | p95 ≤ 25 |
| Comparer, changement de moment (jamais calculé) | 29 / 33 | 16 / 21 | 28 / 34 | 15 / 19 | 4 · 8,3 |
| Comparer, moment déjà calculé | 32 / 34 | 18 / 21 | 31 / 34 | 18 / 20 | 4 · 8,3 |
| Ma bière, + des grammes | 48 / 68 | 29 / 60 | 50 / 73 | 27 / 56 | 4 · 8,3 |

CPU ×4 (budget téléphone non divisé)
| mesure | avant-1 | après-1 | avant-2 | après-2 | budget |
|---|---|---|---|---|---|
| Comparer, réouverture | 1140 / 1314 | 357 / 622 | 570 / 1366 | 570 / 1773 | p95 ≤ 100 |
| Suggérer, réouverture | 319 / 550 | 141 / 496 | 132 / 347 | 725 / 980 | p95 ≤ 100 |
| Fiche, réouverture | 853 / 1125 | 428 / 618 | 294 / 508 | 699 / 989 | p95 ≤ 100 |
| Comparer, moment (jamais calculé) | 118 / 246 | 86 / 202 | 127 / 483 | 74 / 165 | 16 · 33 |
| Comparer, moment déjà calculé | 110 / 250 | 69 / 196 | 118 / 227 | 36 / 152 | 16 · 33 |
| Ma bière, + des grammes | 224 / 337 | 182 / 415 | 178 / 446 | 171 / 257 | 16 · 33 |

Lecture honnête :
- Gain net et répété à ×1 : changement de moment ≈ ÷ 1,8 (29 → 16, 32 → 18) ; + des grammes ≈ ÷ 1,7 (48 → 28). Dans le même sens à ×4, mais dans le bruit du poste.
- Aucun gain à ×1 sur les ouvertures (Comparer 168-180 → 170, Suggérer, Fiche ≈ −10 %). À ×4 les ouvertures varient trop pour conclure (570 et 1140 pour le même « avant »).
- Tous les budgets restent dépassés. Moment à ×1 : 15 ms contre 4 ; ouverture de Comparer à ×1 : 170 ms contre 25.
- Runs intermédiaires (non alternés, indicatifs) : après le seul (1)+(2), grammes ×1 posé 43 → 23 ; après (3), grammes 18 et moment 12 sur un run au poste calme.

## Pourquoi l'ouverture ne bouge pas (diagnostic, build à noms conservés, ×1)
Compteurs Chrome pour UNE ouverture de Comparer : 11 recalculs de style, 4 mises en page, ~55-130 ms de style. Les lectures forcées restantes : `getComputedStyle` de l'isolation (10 appels, sur du style propre), 1 `focus()`, `getBoundingClientRect` du pied (puis `--page-footer-height` posé sur la racine : tout le document est invalidé), 3 `getBoundingClientRect` de la bande cmc2k, puis leurs ré-appels dans les ResizeObservers. Le restyle des 2 153 nœuds fait partie du coût de l'ouverture ; les retirer seuls n'enlève pas ce coût. Pistes non faites :
1. ne plus invalider toute la racine avec `--page-footer-height` à chaque montage (le poser une fois, ou le limiter à la page) ;
2. mesurer la bande dans le ResizeObserver seul (déjà livré avant la peinture) ;
3. le compromis (c) ci-dessous. (La piste 1 a été mesurée à la reprise : un recalcul sur 11, sans gain ; retirée.)

## Critères de VOIE.md (rejoués à la reprise, 26.10)
- Banc avant/après, « erreurs de page : aucune » : fait (tableaux ci-dessus, 4 runs alternés).
- Captures Comparer 390 × 844, avant et après, ouvertes en image (`%TEMP%/p2/cap/{avant,apres}-s0…s5.png`, mesures dans `mesures.json`). La bande cmc2k (`.cmc-col-cadre`, `getBoundingClientRect`) est IDENTIQUE avant/après sur les 6 états. Son écart à la colonne attendue (tête retenue → bas de « Ses mots ») est ≤ 0,4 px, le même qu'avant (arrondi de la mesure d'origine).

  | état | bande (x ; y ; l × h), avant = après |
  |---|---|
  | ouverture (Idaho retenu, dry hop après) | 187 ; 445,8 ; 95 × 811 |
  | moment 10′ | 187 ; 445,8 ; 95 × 811 (vue : fond rosé sous Idaho) |
  | retour dry hop après | 187 ; 445,8 ; 95 × 811 |
  | colonne retenue → Cascade | 88 ; 445,8 ; 95 × 811 (vue : bande bleue sous Cascade) |
  | fenêtre 360 × 800 | 88 ; 433,5 ; 85 × 841 (vue : la bande suit la colonne rétrécie) |
  | retour 390 × 844 | 88 ; 445,8 ; 95 × 811 |

  Non joué : le repli d'une section (aucun repli sur Comparer au repos). Le ResizeObserver qui le suit est le même que celui du redimensionnement, joué.
- Maquette reconstruite (`construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p2`, dossier ignoré par git, seul chemin permis par le script) : `FONCTIONS-RAIL OK (37/37)` ; `RADAR-BASE OK (9 vues)` ; `ETATS OK (139/139) ; 15 voulu(s) non rejoué(s)`. Les clôtures précédentes disaient 141/141 et 13 : le registre a changé hors de cette voie ; mes fichiers ne touchent pas la maquette.
- Tests d'intégration ciblés (AppRoutePile*, AppLanceurOutilsHoublons, floatingActionsShellLayout, AppQuickActionReturn.behavior, + routePile et fix114) : 6 fichiers, 26/26 verts. Le run complet de `tests/integration` fait avant (19 échecs, dont 4 à moi, corrigés) n'est pas rejoué en entier : les 15 autres (hopV55* ×13 = #177, hopStudy ×1, monkey et YeastRecipeChoice sous charge) ne touchent pas mes fichiers.
- `tests/unit/hopIndexV4` + `tests/unit/designTokens.test.ts` : 25 fichiers, 236/236 verts.
- `npm run build` : vert (tsc, vite build, check-private-research).
- `node scripts/audit_inputs.mjs` : INPUT PROTECTION AUDIT PASSED (647 usages, 335 fichiers).

## Piste 1 de l'ouverture, `--page-footer-height` (essayée, RETIRÉE)
Essai de borne haute : la propriété n'est plus jamais posée sur la racine, le plus que la piste puisse gagner. Compteurs Chrome pour une ouverture de Comparer, 3 prises, build à noms conservés : 11 recalculs de style / 4 mises en page → 10 / 3 ; style 55-126 ms → 72-88 ms, dans le bruit. Un recalcul sur 11, sans gain mesurable ; le lanceur lit cette variable. Rien gardé ; `PageShell.tsx` remis tel quel (vérifié : plus de trace de l'essai).

## Essais
Banc : 1 « avant », 3 « après » (dont profils), 1 série alternée de 4, 1 essai de la piste 1. Captures : 1 passage. Aucun critère épuisé.

## Doutes et limites
- Les attributs de `<body>` suivent le DOM avec une micro-tâche de retard. Dans un navigateur c'est avant la peinture ; dans les tests jsdom il faut un `await`. Le module `PageShell` doit être évalué pour que l'observateur existe ; tout test qui le remplace en entier (comme AppQuickActionReturn) doit l'évaluer aussi.
- Le CSS lit maintenant des attributs. Une règle future `body:has(...)` rajouterait le coût. Les `:has` hors de ces cinq fichiers restent (`brew-day.css`, `index.css`, `themes.css`, `brew-equipment.css`, `comparer.css`, `fiche.css`, `hopV55/page.css`).
- Aucun vrai téléphone ; ×4 est un bridage du processeur seul.

DÉCISION À PRENDRE : Comparer s'ouvre en ≈ 170 ms à ×1 et ≈ 570 ms à ×4 après mes correctifs, très au-dessus de 200 ms à ×4. Options :
- (c) du banc : l'écran apparaît tout de suite avec son cadre et ses têtes, et radar, colonnes et « Ses mots » se montent après la première image (`startTransition`). Total inchangé, ressenti à ≈ 100 ms (non mesuré). Touche au dessin de ses maquettes choisies (règle n° 1), donc à lui de trancher, en mini maquettes.
- (d) la piste 2 (mesurer la bande dans le ResizeObserver seul) : au plus 3 `getBoundingClientRect` sur 11 recalculs, gain probablement faible ; sans effet sur le dessin.
Recommandation : (c) en mini maquettes, car (d) ne peut pas descendre sous quelques ms ; le restyle des 2 153 nœuds est le coût, il ne se retire pas sans changer ce qui se monte à l'ouverture.

CONNAISSANCE : en production, ces correctifs divisent par ≈ 1,8 le changement de moment de Comparer et le + des grammes à ×1 (sources : retrait des lectures de géométrie à chaque rendu, de la passe d'isolation sur les mutations internes et des `body:has`). L'ouverture est dominée par le restyle de 2 153 nœuds (11 recalculs de style, 4 mises en page par ouverture), pas par ces lectures (26.10, HEAD d5559447 + arbre).
LEÇON PROPOSÉE : un test qui remplace un module en entier (`vi.mock` sans `importActual`) perd les effets de bord du module, comme l'observateur d'attributs ; à vérifier quand une règle CSS passe de `:has` à un attribut posé en JS.
