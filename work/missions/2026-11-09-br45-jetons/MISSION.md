# Mission 2026-11-09-br45-jetons — l'atelier Houblons V5.5 en jetons de thème (BR-45)

## Objectif
BR-45 (`work/missions/BUGS.md`, BR 08.11) : « L'atelier Houblons V5.5 reste clair au thème cave (grand panneau beige
dans la page sombre) — 390 et 1280. » Une rustine `filter: invert` a été refusée et retirée par le pilote (elle
faussait les couleurs des familles d'arômes et les images). Mission accordée à part le 09.11.

Portée (L01, lecture étroite) : les couleurs écrites en dur dans `src/ui/hopV55/` (CSS et styles en ligne des TSX)
deviennent des jetons qui changent avec `data-theme`. Rien d'autre : ni mise en page, ni texte, ni comportement.

Fini, c'est :
- clair identique : chaque couleur calculée de l'atelier, avant et après, à ΔE2000 = 0 (mesuré sur le banc) ;
- cave sombre et lisible partout dans l'atelier : aucune grande surface claire, contraste de texte ≥ 4,5:1 ;
- plus aucune couleur littérale dans `src/ui/hopV55/` hors du fichier de jetons généré ;
- captures Chrome du banc 390 tactile et 1280, clair et cave, avant/après côte à côte, toutes ouvertes ;
- critique (Fable) avant de conclure ; tsc, tests touchés, `VITE_HOP_V4=on npm run build` verts ;
- BR-45 à « corrigé » avec le commit. Pas de déploiement ni de push : le pilote parent intègre.

## État de l'art
- Problème type : dériver un thème sombre d'une palette claire existante (« design tokens » sémantiques par thème),
  avec contrainte de contraste WCAG 2.x ; correspondance d'une couleur vers le jeton le plus proche par différence
  perceptuelle (ΔE CIEDE2000 en CIELAB).
- Examiné : le précédent du dépôt `scripts/theme/porter-reste.mjs` (#144, le sens inverse : cave d'origine exacte,
  clair dérivé par rôle et famille) ; l'algorithme « dynamic theme » de Dark Reader (fond : le sombre reste, le clair
  fonce ; texte : le clair reste, le sombre s'éclaircit ; teinte conservée) ; Material « dark theme » (surfaces
  surélevées plus claires) ; culori 4 (MIT : CIELAB/LCh D65, `differenceCiede2000`, `wcagContrast`, `clampChroma`) ;
  postcss + postcss-value-parser (déjà dans le dépôt) pour lire et réécrire les déclarations ; axe-core 4.10 (règle
  `color-contrast`, standard d'audit) et puppeteer-core (dépôt) pour la mesure dans Chrome ; pngjs + pixelmatch pour
  l'écart des captures.
- Décision : le mécanisme de `porter-reste.mjs`, inversé. Chaque couleur devient `rgb(var(--hv-<rôle>-<hex>))`
  (rôle `f` fond, `t` texte, `l` trait, `o` ombre ; l'alpha garde sa valeur, `rgb(var(--x) / a)`), définie dans
  `src/ui/hopV55/jetons.css` : en clair, la valeur d'origine exacte (rendu identique par construction) ; en cave, la
  règle Dark Reader par rôle en LCh, ancrée sur les jetons de `src/theme/themes.css` : une couleur neutre (C* < 10)
  prend le jeton `cave-*` / `cave-texte-*` le plus proche en ΔE2000 (référence `var(--cave-…)`, donc un vrai jeton de
  thème) ; une teinte garde son angle, sa luminance est remappée, puis éclaircie jusqu'au seuil (texte 4,5:1 sur
  `cave-800`, trait coloré 3:1 sur `cave-900`). Le papier de l'atelier (#f5f2e9) devient la page (`cave-950`), le
  blanc des panneaux `cave-900`, les teintes plus sombres en clair deviennent des surfaces plus claires en cave
  (surélévation). Les alias locaux (`--hq-ink`, `--pa-forest`…) employés dans plusieurs rôles reçoivent un alias par
  rôle. Outils dans `src/ui/hopV55/jetons/` (les `.mjs` de `work/missions/` ne sont pas suivis par git) ; culori,
  axe-core, pngjs et pixelmatch installés hors du dépôt (`BR45_DEPS`), sans toucher `package.json`.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Où vivent les jetons | 400 jetons dans `themes.css` ; fichier généré propre à l'atelier | pilote | tranchée : `src/ui/hopV55/jetons.css`, comme `couleurs-portees.css` ; les neutres y renvoient aux jetons `cave-*` de `themes.css` |
| Clair | valeur la plus proche d'un jeton (ΔE > 0) ; valeur exacte | pilote | tranchée : exacte, « sans changer le rendu au thème clair » |
| Bandeau vert sombre et bouton principal vert | gardés ; passés au jeton de l'app | pilote | tranchée : gardés (fond déjà sombre, règle Dark Reader) ; réversible |
| Contrôles | `tests/unit` ; dossier de l'atelier | pilote | tranchée : `src/ui/hopV55/jetons/` (périmètre de la mission : `src/ui/hopV55/` et la mission seuls) |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| j1 | contrôle rouge sur HEAD, script de conversion, jetons générés, banc avant/après | jugement | auteur | opus | 120 | src/ui/hopV55/**, work/missions/2026-11-09-br45-jetons/** | — | jetons/controle.mjs, jetons/banc.mjs, tsc, vitest hopV55, build | pilote | — |
| c1 | verdict du thème cave contre le clair, captures avant/après | jugement | critique | fable | 30 | work/missions/2026-11-09-br45-jetons/critique/** | j1 | captures ouvertes | pilote | — |

## Boucle de retour
Un critère en échec : corriger la règle du script (jamais un jeton à la main), régénérer, rejouer tout le banc.
Une plainte : SPEC, DEFAUTS, contrôle, correction.

## Journal
- 09.11, rouge sur HEAD : `node src/ui/hopV55/jetons/controle.mjs` → `JETONS ECHEC` (1 520 couleurs littérales,
  pas de jetons.css). Banc avant (`jetons/banc.mjs`, 96 états : clair et cave × 390 tactile et 1280 × 6 parcours de
  fixture × 4 onglets, tous les `<details>` ouverts) : en cave, 38 à 98 surfaces claires et 1 à 4 contrastes axe par état.
- Règle corrigée deux fois avant écriture (L29 : dans le script, jamais un jeton à la main) : traits colorés sans
  forçage 3:1 (plus voyants qu'en clair) ; neutres départagés par la seule clarté en ΔE2000 (sinon, dans le très
  sombre, l'écart de chroma l'emportait et le papier tombait sur `cave-900`). Alias imbriqués suivis par point fixe.
- Après (`porter.mjs --ecrire`, 1 520 couleurs, 450 jetons, 31 alias à plusieurs rôles) : `controle.mjs` → `JETONS OK`.
  `compare.mjs` : clair, 1 556 820 valeurs de couleur calculées identiques (ΔE2000 max 0,000, alpha 0, structure
  identique) ; 1 818 pixels différents, tous une horloge affichée (16:28 → 16:35). Cave : 0 contraste axe, 0 surface
  claire sur les 48 états. Vraie coque de l'app (`jetons/hote.mjs`, `?dev-local`, Brassins → Atelier) : fond
  `rgb(18,16,14)` = `cave-950` à 390 et 1280.
- `npx tsc --noEmit` vert (jonction locale vers `functions/node_modules` du dépôt principal, absent du worktree).
  `npm test` s'arrête avant vitest sur `audit_inputs` (`src/ui/etapeLevure/Chercher.tsx:308`, `Comparer.tsx:284`, déjà
  sur HEAD, hors mission) ; vitest lancé directement sur les fichiers de l'atelier.
- vitest (`npx vitest run hopV55 HopV55`) : 155 fichiers verts. `VITE_HOP_V4=on npm run build` vert (DRAPEAUX OK) ;
  jetons présents dans les paquets CSS Host et recipe-step.
- Critique c1 (`critique/VERDICT.md`) : OK, 5 problèmes mineurs, 0 bloquant. Passe 2 de la règle (dans porter.mjs) :
  encre `cave-texte-50` réservée à L* ≤ 21 (hiérarchie des gris, n° 2) ; fond de teinte saturée sombre relevé à
  L* 34–38 (action principale « Préparer l'essai », n° 5) ; traits colorés plancher L* 32 (pastille d'étape, n° 3).
  Laissés : n° 1 (radios et cases natives sous `color-scheme: dark`) et n° 4 (bordures `cave-800`, conformes à DESIGN.md).
  porter.mjs rendu rejouable (relit les jetons déjà employés).
- Passe 2 rejouée (banc « apres2 », 96 états) : clair, 1 556 820 valeurs identiques (ΔE2000 max 0,000 ; pixels : l'horloge
  seule) ; cave, 0 contraste axe et 0 surface claire sur 48/48 ; « Préparer l'essai » en vert moyen à liseré clair,
  pastille d'étape à contour visible (captures ouvertes). Contrôle `JETONS OK`. Reste ouvert : n° 1 et n° 4 du critique.
- Hors portée vue en passant : en clair, des textes déjà trop pâles (« 20 L · Avant brassage » de l'en-tête, « Lentille
  de confrontation ») ; inchangés, puisque le clair doit rester identique.

## Sources
- `work/missions/BUGS.md` (ligne BR-45) ; `DESIGN.md` (« Colors », « Les surfaces ») ; `src/theme/themes.css`
- `scripts/theme/porter-reste.mjs` et `src/theme/couleurs-portees.css` (le précédent, sens inverse)
