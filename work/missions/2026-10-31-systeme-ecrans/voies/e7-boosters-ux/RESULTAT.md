OK — skill `boosters-ux` écrit (200 lignes : 13 points B1–B13 sourcés et vérifiables, 6 recettes puppeteer-core, 6 règles qui l'emportent, emploi dans l'entonnoir) et `SOURCE.md` (MIT vérifiée pour les deux dépôts) ; rien téléchargé ni exécuté.

## Livrables
- `.claude/skills/boosters-ux/SKILL.md` : boosters mis en avant (B1), check-list B2–B13 (hiérarchie, premier plan,
  regroupement, rythme, typographie, contraste, états dont hors ligne, gestes, saisie, coup d'œil, cohérence, cibles),
  « Ce qui cède devant nos règles » (DESIGN.md et sa densité, pas de cockpit, le brasseur choisit, jamais de question
  bloquante, monospace des chiffres, écran ≠ vitrine), recettes R1–R6 (marges et ancrages, écart à l'échelle
  d'espacement et rayons, blanc utile, niveaux typographiques, cibles, flou/barres/gestes), entonnoir (cadrage, v0, tri,
  passes, port), gabarit de NOTE. Le skill est reconnu par la session (listé dans les skills disponibles).
- `.claude/skills/boosters-ux/SOURCE.md` : dépôts, licences et copyrights, fichiers lus et non lus, table « ce qui vient
  d'où », ce qui est écarté, texte MIT.

## Critères rejoués
- Lignes : `wc -l SKILL.md` = 200 (≤ 200).
- 44 px : `grep -nE '(^|[^0-9])44([^0-9]|$)'` → une seule ligne (26), qui écarte les 44/48 px de ui-ux-pro-max. Témoin :
  le même grep trouve « Are touch targets at least 44×44pt? » dans `impeccable/reference/critique.md`.
- Questions : `grep -niE 'question|demand|\bask|interrog|AskUser'` → lignes 22 (« sans redemander d'autorisation »),
  38–39 (« Jamais de question bloquante », les questions d'impeccable et de ui-ux-pro-max écartées), 123 (« la question
  de l'outil », L10, un concept et non une question posée). Aucune consigne d'interroger l'utilisateur. Témoin : 36 lignes
  dans `impeccable/reference/critique.md`, dont « STOP and call the AskUserQuestion tool ».
- Source et preuve : B1 à B13 ont chacun un « Source : » et un « Preuve : » (compte par point : 1 et 1).
- Aucun caractère de contrôle (M10) ; `git status` : seuls `.claude/skills/boosters-ux/` et ce RESULTAT.md, neufs.

## Propositions, non écrites
- `.claude/rules/affinee-frontend.md`, tableau des skills, ligne à ajouter :
  `| Boosters UX/UI (comprendre et agir autrement que par le texte) et check-list d'écran : hiérarchie, premier plan, rythme, états, gestes, saisie, cohérence | `boosters-ux`, avec `impeccable` et `ui-design-system` ; au port, avec `a11y-audit` et `senior-frontend` |`
- `BRIEF-AUTEUR.md` du lot Identité (partie « Indicatif ») : « Boosters UX : charge `boosters-ux` avec `impeccable` et
  `ui-design-system` ; marque chaque booster `data-booster="nom"` ; coche B1 à B13 dans ta NOTE (gabarit du skill), mesures
  recopiées sans chercher à les faire passer en v0. Dès la v0 relèvent de l'obligatoire : B8 et B11 (honnêteté des
  données) et B13 (le doigt à 390 px). »

## Risques ouverts, pour le pilote
- Deux plafonds de mots au premier écran : 60 (DESIGN.md, D24) et 80 (SPEC, `mots-premier-ecran.mjs --max=80` des lots
  houblons). Le skill applique DESIGN.md (60) et le signale ; à trancher si besoin.
- `controle-standard.mjs` (S3) attend des rayons 2/4/8 px (maquettes houblons) ; DESIGN.md en fixe trois, 10/16/24. B12
  suit DESIGN.md ; sur un écran choisi, sa maquette prime (règle n° 1).
- `jouer-boosters.mjs` et `controle-lot.mjs` (`--tailles`, `--fill`) ne lisent que le format `pNN/index.html`
  (`portee-defauts.json` : « tourne : non ») ; le skill les cite pour ce format et donne R3, R4, R6 sinon.
- Les recettes R1–R6 sont des recettes, pas encore un script : inachevé récupérable (une voie executant ou auteur peut les
  coder dans `outils/`, avec témoin négatif).
- Le déclenchement du skill n'est pas encore éprouvé à la manière de `skill-creator` (voie e6 à venir).

CONNAISSANCE : ui-ux-pro-max sépare lui-même le web du natif (`app-interface.csv` n° 6 : 44 pt / 48 dp en natif, 24 px CSS
sur le web, « ne pas fondre ces seuils en un nombre ») ; utile pour défendre la densité de DESIGN.md.
