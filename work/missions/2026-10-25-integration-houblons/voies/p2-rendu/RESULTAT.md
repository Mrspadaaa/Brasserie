ECHEC — critères non finis (arrêt demandé, quota) : changement de moment et grammes ÷ 1,8 à ×1 ; ouverture de Comparer inchangée ; captures, contrôles de maquette, build et audit non joués

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
3. le compromis (c) ci-dessous.

## Critères de VOIE.md
- Banc avant/après, « erreurs de page : aucune » : fait (tableaux ci-dessus).
- Captures Comparer 390 × 844 avant/après, bande au même pixel, bande qui suit le moment : NON FAIT. La bande est relue à chaque changement de colonne retenue, de moment, de colonnes ou de lecture, et à chaque changement de taille de la section ; pas vérifiée en rendu.
- `controle-fonctions-rail.mjs`, `controle-radar-base.mjs`, `controle-etats.mjs` : NON JOUÉS. Ils lisent la maquette (`prototypes/houblons-v4/parcours/src`, sa propre copie de Comparer), que cette voie n'a pas touchée. Pour la reconstruire : `node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p2`.
- `npx vitest run tests/integration` (une fois, avant la dernière retouche de PageShell) : 19 échecs sur 2138. Les 4 liés à mes changements (AppQuickActionReturn ×2, floatingActionsShellLayout ×2) sont corrigés (15/15 verts avec fix114 ensuite). Les 15 autres ne viennent pas de cette voie :
  - `hopV55*` (13) : voie r177, #177 ;
  - `hopStudy` (1) : collection invalide ;
  - `monkey.test.tsx` (2 graines) et `YeastRecipeChoice` (1) : délai de 15 s dépassé sous charge. Non rejoués seuls.
  - Non rejoué après la retouche « en-tête rendu seulement si `tight` » : à relancer avant de commiter (`AppRoutePile*`, `AppLanceurOutilsHoublons`, `floatingActionsShellLayout`).
- `npx vitest run tests/unit/hopIndexV4`, `tests/unit/designTokens.test.ts`, `npm run build`, `node scripts/audit_inputs.mjs` : NON JOUÉS. `npx tsc --noEmit -p .` : sans sortie (propre) après les deux premiers correctifs.

## Essais
Banc : 1 « avant », 3 « après » (dont profils), 1 série alternée de 4. Tests d'intégration : 1 run complet + 4 relances ciblées. Aucun critère épuisé ; arrêt demandé par le pilote.

## Doutes et limites
- Les attributs de `<body>` suivent le DOM avec une micro-tâche de retard. Dans un navigateur c'est avant la peinture ; dans les tests jsdom il faut un `await`. Le module `PageShell` doit être évalué pour que l'observateur existe ; tout test qui le remplace en entier (comme AppQuickActionReturn) doit l'évaluer aussi.
- Le CSS lit maintenant des attributs. Une règle future `body:has(...)` rajouterait le coût. Les `:has` hors de ces cinq fichiers restent (`brew-day.css`, `index.css`, `themes.css`, `brew-equipment.css`, `comparer.css`, `fiche.css`, `hopV55/page.css`).
- Aucun vrai téléphone ; ×4 est un bridage du processeur seul.

DÉCISION À PRENDRE : Comparer s'ouvre en ≈ 170 ms à ×1 et ≈ 570 ms à ×4 après mes correctifs, très au-dessus de 200 ms à ×4. Options :
- (c) du banc : l'écran apparaît tout de suite avec son cadre et ses têtes, et radar, colonnes et « Ses mots » se montent après la première image (`startTransition`). Total inchangé, ressenti à ≈ 100 ms (non mesuré). Touche au dessin de ses maquettes choisies (règle n° 1), donc à lui de trancher, en mini maquettes.
- (d) d'abord les pistes 1 et 2 ci-dessus (sans effet sur le dessin), avec le compteur de recalculs de style comme mesure.
Recommandation : (d), puis (c) seulement si l'ouverture reste au-dessus de ≈ 200 ms à ×4.

CONNAISSANCE : en production, ces correctifs divisent par ≈ 1,8 le changement de moment de Comparer et le + des grammes à ×1 (sources : retrait des lectures de géométrie à chaque rendu, de la passe d'isolation sur les mutations internes et des `body:has`). L'ouverture est dominée par le restyle de 2 153 nœuds (11 recalculs de style, 4 mises en page par ouverture), pas par ces lectures (26.10, HEAD d5559447 + arbre).
LEÇON PROPOSÉE : un test qui remplace un module en entier (`vi.mock` sans `importActual`) perd les effets de bord du module, comme l'observateur d'attributs ; à vérifier quand une règle CSS passe de `:has` à un attribut posé en JS.
