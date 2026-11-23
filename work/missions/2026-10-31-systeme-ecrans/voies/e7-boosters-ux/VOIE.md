# Voie e7-boosters-ux — les « boosters » UX/UI, mis en avant et adaptés

Agent : general-purpose (Opus), pour lire les dépôts en ligne. Une méthode : un skill, écrit dans nos mots. Écris RESULTAT.md tôt.

## Ses mots (31.10)
« Oublie pas de bien mettre en avant les UX UI booster ! » Juste avant, il a lancé la refonte de l'écran Identité de la création de
recette (`work/missions/2026-10-31-ecran-identite/MISSION.md`).

## Ce qui est demandé
1. **Lire, en lecture seule**, avec WebFetch : ne télécharge, ne clone, n'installe et n'exécute rien, pas même leurs scripts Python ou
   Node.
   - https://github.com/nextlevelbuilder/ui-ux-pro-max-skill : son SKILL.md et ses bases (styles, palettes, typographies, règles UX,
     types de produit) ;
   - https://github.com/Leonxlnx/taste-skill : son SKILL.md, et ce que mesure son `inspect.mjs` (le cadre, l'espacement, la hiérarchie).
   Lis aussi notre rapport (`work/missions/2026-10-31-methodes/RAPPORT.md`, § 2 et § 6), et nos skills d'interface :
   `.claude/skills/impeccable/`, `ui-design-system`, `a11y-audit`, `senior-frontend`, et `frontend-design` s'il existe. Lis enfin
   `.claude/rules/affinee-frontend.md`, DESIGN.md, `docs/ui-compacte.md` et PRODUCT.md.
2. **Écrire `.claude/skills/boosters-ux/SKILL.md`**, en français, avec un `name` et une `description` qui le font charger avant toute
   conception ou revue d'écran de L'Affinée :
   - Les heuristiques UX/UI qui renforcent vraiment un écran de l'app. Une check-list courte et vérifiable : hiérarchie, premier plan,
     regroupement, rythme d'espacement, contraste, états (vide, erreur, chargement, hors ligne), retours de geste, saisie sur téléphone,
     lecture à un coup d'œil, cohérence entre écrans.
   - Pour chacune : la source (ui-ux-pro-max, taste-skill, impeccable…) et comment la vérifier (une mesure, un contrôle, une capture).
   - **Ce qui cède devant nos règles**, écrit en toutes lettres :
     - DESIGN.md fait autorité, et sa densité compacte prime sur les 44/48 px imposés ;
     - pas de cockpit ;
     - le brasseur choisit : l'outil ne choisit jamais le style ni la direction ;
     - jamais de question bloquante ;
     - le monospace des chiffres est permis.
   - Comment l'employer dans l'entonnoir :
     - chaque concepteur de v0 le charge, avec impeccable et ui-design-system ;
     - chaque variante coche la check-list dans sa NOTE ;
     - le critique la joue au tri ;
     - au port, s'y ajoutent a11y-audit et senior-frontend.
   - Les mesures de taste-skill qu'on peut refaire avec nos outils (puppeteer-core, sans leur script) : l'écart à une grille, le nombre
     de niveaux typographiques, le blanc utile. Une recette courte suffit, sans code tiers.
3. `SOURCE.md` à côté du skill : les dépôts, leurs licences (MIT, à vérifier) et ce qui en vient.
4. Proposer, sans l'écrire, la ligne à ajouter à `.claude/rules/affinee-frontend.md` (tableau des skills) et au BRIEF du lot Identité.

## Critères
- Le skill existe, en 200 lignes au plus. Un grep montre qu'il ne contient aucune consigne de poser une question à l'utilisateur, et aucun
  minimum universel de 44 px.
- Chaque heuristique a sa source et sa façon de la vérifier.

## Possède
- `.claude/skills/boosters-ux/` (neuf).
- `work/missions/2026-10-31-systeme-ecrans/voies/e7-boosters-ux/`.

Ne lance aucun serveur. Pas de `git stash`, aucun commit. Rends une ligne.
