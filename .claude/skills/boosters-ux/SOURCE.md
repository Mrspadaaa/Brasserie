# Provenance du skill boosters-ux

Écrit le **2026-10-31** pour la voie e7-boosters-ux (mission `work/missions/2026-10-31-systeme-ecrans/`), sur ses mots :
« Oublie pas de bien mettre en avant les UX UI booster ! » (31.10, juste après le lancement de la refonte de l'écran
Identité, `work/missions/2026-10-31-ecran-identite/MISSION.md`).

Aucun fichier n'a été copié, téléchargé, cloné ni installé, et aucun script n'a été exécuté (ni `search.py`, ni
`inspect.mjs`). Les dépôts ont été lus en ligne le 31.10.2026, branche `main`, par WebFetch : l'outil rend un résumé fait
par un petit modèle, si bien qu'un seuil cité vient de ce résumé et non d'une lecture intégrale du fichier. `SKILL.md` est
une réécriture en français : les règles y sont triées, fusionnées et soumises à DESIGN.md ; aucune phrase n'est traduite
mot pour mot, sauf la courte citation d'impeccable (B12), skill déjà présent dans ce dépôt.

## Les dépôts

| Dépôt | Licence (vérifiée) | Copyright | Créé / dernier push / étoiles |
|---|---|---|---|
| nextlevelbuilder/ui-ux-pro-max-skill | MIT : API GitHub (`spdx_id` MIT) et `LICENSE` à la racine | « Copyright (c) 2024 Next Level Builder » | 2025-11-30 / 2026-10-30 / 143 219 |
| Leonxlnx/taste-skill | MIT : API GitHub (`spdx_id` MIT) et `LICENSE` à la racine | « Copyright (c) 2026 Leonxlnx » | 2026-02-19 / 2026-10-31 / 106 648 |

### Fichiers lus

- ui-ux-pro-max, sous `https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/ui-ux-pro-max/` :
  `SKILL.md` ; `references/quick-reference.md` (les 10 catégories de règles et leurs identifiants) ;
  `references/pro-rules.md` (règles et check-list avant livraison) ; `data/ux-guidelines.csv` (119 lignes, lignes
  pertinentes) ; `data/app-interface.csv` (32 lignes) ; `data/products.csv` (192 types de produit) ; `data/colors.csv`
  (192 palettes) ; `data/typography.csv` (74 couples) ; `data/styles.csv` (100 000 premiers caractères sur 148 042). Plus
  `https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/LICENSE`, l'arbre du dépôt (API, lecture
  tronquée) et `https://api.github.com/repos/nextlevelbuilder/ui-ux-pro-max-skill`.
- taste-skill, sous `https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/` : `SKILL.md` ;
  `references/app-screens.md` (mode application) ; `references/critique.md` (14 passes, plafonds) ; `scripts/inspect.mjs`
  (déroulé des mesures) ; `scripts/lib/probe.mjs` (fonctions `probe`, `frame`, `layout`, `app`, `colourShare`) ;
  `scripts/lib/rules.mjs` (`judge`, `judgeLayout`, `judgeApp`, `APP_SKIP`). Plus
  `https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/LICENSE`, l'arbre du dépôt et
  `https://api.github.com/repos/Leonxlnx/taste-skill`.
- Dans ce dépôt : `work/missions/2026-10-31-methodes/RAPPORT.md` (§ 2.6, 2.10, 6) ; les skills `impeccable` (`SKILL.md`,
  `reference/operate.md`, `craft-floor.md`, `layout.md`, `critique.md` en partie), `ui-design-system`, `a11y-audit` et
  `senior-frontend` (contexte local et en-tête) ; `frontend-design` n'existe pas dans `.claude/skills/` ;
  `.claude/rules/affinee-frontend.md`, DESIGN.md, `docs/ui-compacte.md`, PRODUCT.md, SPEC-BRASSEUR (§ 4), les contrôles de
  `work/refonte-frontend/v4/tournoi/outils/` cités, `cerveau/brasseur/pas-de-cockpit.md`, `cerveau/produit/saisie-mobile.md`.

### Non lus

- taste-skill : `scripts/lint.mjs`, `draw.mjs`, `assets.mjs`, `scenes.mjs`, `lib/cdp.mjs`, `lib/app-draw.mjs`,
  `lib/inspection-files.mjs` ; `references/tells.md`, `layout.md`, `type.md`, `colour.md`, `motion.md` ; `library/*.json`.
- ui-ux-pro-max : les scripts Python (`search.py`, `core.py`, `design_system.py`…) ; `icons.csv`, `charts.csv`,
  `motion.csv`, `landing.csv`, `google-fonts.csv`, `ui-reasoning.csv`, `react-performance.csv`, `stacks/*.csv` ; la fin de
  `styles.csv`.

## Ce qui vient d'où

| Point du skill | ui-ux-pro-max | taste-skill | Chez nous |
|---|---|---|---|
| B1 boosters | — | « un élément vivant » (SKILL.md) | PRODUCT.md, `docs/ui-compacte.md`, SPEC § 4, `jouer-boosters.mjs` |
| B2 une chose domine | `visual-hierarchy`, `primary-action` | critique, passes 1 et 2 (test du flou) | impeccable `layout` ; DESIGN.md (Button) |
| B3 premier plan | `content-priority`, `progressive-disclosure` | — | DESIGN.md (D24, budget vertical) ; impeccable (charge cognitive) ; `mots-premier-ecran.mjs`, `controle-hauteur.mjs` |
| B4 regroupement | `field-grouping` | critique passe 4 ; `ragged-edges` | impeccable `layout`, `craft-floor` |
| B5 rythme | `spacing-scale` | `blank-gap`, `panel-void`, passe 5 | DESIGN.md (dimensions compactes) ; impeccable `layout` |
| B6 typographie | `number-tabular` | `size-count`, `tabular`, `numeric-align`, `tiny-text` | DESIGN.md (Typography, D24) ; mission Identité |
| B7 contraste, couleur | `color-contrast`, `color-not-only`, pro-rules (clair et sombre) | `contrast` | DESIGN.md (lois 1 et 5) ; a11y-audit ; `controle-contraste`, `controle-teinte`, `controle-standard`, `scripts/theme/contraste.mjs` |
| B8 états | `empty-states`, `error-recovery`, `offline-support`, `content-jumping`, `read-only-distinction` | `app-screens.md` § 11 | PRODUCT.md ; `docs/ui-compacte.md` ; impeccable `harden`, `operate` ; `fuite-touchers`, `controle-valeurs-brutes` |
| B9 gestes | `press-feedback`, `tap-feedback-speed`, `drag-threshold`, `dragging-alternative`, pro-rules | `reduced-hidden` | DESIGN.md (Do's and Don'ts) ; impeccable `operate` ; `controle-etats` |
| B10 saisie | `input-labels`, `error-placement`, `inline-validation` | — | `cerveau/produit/saisie-mobile.md` ; DESIGN.md |
| B11 coup d'œil | — | critique, passe 1 | DESIGN.md (D24, Reading) ; `docs/ui-compacte.md` ; L10 |
| B12 cohérence | `consistency`, `icon-style-consistent` | `radius-mix` | DESIGN.md (Shapes, Components) ; impeccable `operate` ; `controle-baseline` |
| B13 cibles | `web-target-size`, `focus-not-obscured` | — | DESIGN.md (cibles web) ; a11y-audit |
| R1 à R6, mesures | — | `layout()` (marges aux 2e et 98e centiles, ancrages), `judgeLayout` (`off-centre`, `ragged-edges`), `judgeApp` (`radius-mix`, `panel-void`, `tiny-text`), `frame()` (`filled`), critique (test du flou) | `capture.mjs` (`fill`, `typo`), `scripts/theme/captures-ecrans.mjs`, skill `webapp-testing` ; recettes réécrites, sans code tiers |

## Ce qui est à nous

La définition du booster et sa mise en avant (PRODUCT.md, `docs/ui-compacte.md`, SPEC § 4) ; toutes les valeurs chiffrées
qui font foi (DESIGN.md) ; les contrôles existants ; l'emploi dans l'entonnoir ; le gabarit de la NOTE ; les règles
« Ce qui cède » (CLAUDE.md, règle n° 1, L01, L24, L27, rapport des méthodes § 6).

## Ce qui est écarté, contraire à nos règles

- ui-ux-pro-max : les cibles de 44 × 44 pt / 48 × 48 dp, le champ de 44 px, le corps de 16 px, le style « Accessible &
  Ethical » (cible de 44 px, police de 16 px) ; le choix du style, de la palette et des polices par le produit
  (`--design-system`, `products.csv` : « Brewery/Winery » donne « Motion-Driven + Vintage Analog / Retro Film » et une
  palette bordeaux et or, `colors.csv` n° 64) ; la question de la stack posée à l'utilisateur ; « Data-Dense Dashboard ».
- taste-skill : le tirage et le choix de la direction par l'agent (`draw.mjs`, 7 styles d'application) ; l'interdit du
  monospace hors code ; les règles de page (photos réelles, huit éléments animés, entrées de 60 à 90 ms, accroche) ; les
  marges de 16 à 20 px au téléphone, les cibles de 44 px au téléphone, les 4 à 9 tailles ; le téléchargement d'images
  (`assets.mjs`) ; le score pondéré et ses plafonds, faits pour des pages vitrines.
- impeccable (déjà dans le dépôt) : les questions finales de `critique` (« Ask the User »), le « Ask once » du routage ;
  la cible de 44 × 44 pt de son persona mobile.

## Texte de la licence MIT (le même pour les deux dépôts)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
