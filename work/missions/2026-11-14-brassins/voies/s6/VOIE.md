# Voie s6 — Série G3 — La conduite de z1, transposée (mini maquettes, après refus)

- Mission : 2026-11-14-brassins
- Agent : concepteur
- Modèle : opus (Fable interdit)
- Niveau : conception
- Plafond : 45 tours ; 3 essais par critère
- Dépend de : c3
- Décideur en cas de doute : brasseur (il choisit sur la page)

## Objectif
Ses mots (14.11), devant les 19 premières maquettes : « Pas super fan de aucun, lance une critique et fait d'autres versions ».
3 mini maquettes statiques (non jouables) du genre **G3 — La conduite de z1, transposée** : le compteur de jours et la table d'ajouts à cocher de z1, pièce pour pièce. Genre neuf (L13) : rien du squelette commun refusé.

## Entrées
- `work/missions/2026-11-14-brassins/voies/c3/DIAGNOSTIC.md` en entier : les 7 causes du refus (à éviter toutes) et ta section
  `### G3` (ton genre, sa référence, ce que fiche et liste deviennent, le risque). § Garder : ce qui peut revenir.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` : « La question », « Ses mots », « Obligatoire », « Les chiffres », « Chaque variante ».
- Son goût (ouvre-les, Read) : `work/refonte-frontend/v4/choix/baselines/` `etape-houblons/repos.png`, `fiche/repos.png`,
  `comparer/repos.png`, `dryhopper/repos.png`, `substituer/repos.png` ; z1 :
  `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/distracted-dewdney-b8bc6e/work/missions/2026-11-10-vue-brassin/v0/z1/z1-ebullition-390.png`
  et `z1-mesure-390.png` (et `etat.html` du même dossier pour ses jetons et sa structure).
- Couleurs des familles d'arômes et pictos : `node scripts/agents/systeme.mjs chercher pictos familles`, puis le code qu'elle cite.
- Skills `boosters-ux`, `impeccable`, `ui-design-system` (Skill, une fois) ; `DESIGN.md` (Colors, Typography, Layout).
- Ne relis pas les maquettes refusées : le diagnostic les résume.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/s6/` : un dossier par variante `s6a` à `s6c` (`etat.html`, PNG, `NOTE.md`).
Rien dans `src/`. Ni commit ni stash. Fichiers de travail : ton OWNS, ou `os.tmpdir()` préfixés `s6-`.

## Consignes
- 3 variantes du genre, vraiment différentes : 1 froide (le genre pur), 1 tiède, 1 chaude (mêle ton genre à un autre de c3).
- Contre les causes de c3 : (1) pas l'en-tête + puces de phase + courbe + cases °C + carte dry hop + pied ; (2) le héros n'est pas
  le relevé de °C de cuve (il reste à un toucher, geste m2) ; (3) couleur pleine et contrastée, comme ses choix (familles,
  aires remplies, barres noires, coches vertes pleines), peu de pointillés ; (4) une phrase-réponse en gros en tête
  (« Dry hop demain · Citra + Mosaic », « Garde dès que stable ») et le critère « stable » dessiné ; (5) un houblon montré en
  brasseur : nom, α (« — » si inconnu), rôle, pastilles de familles ; (6) pas de graphe à moitié vide : cadrer l'axe sur ce qui se
  joue ; (7) aucune phrase grise d'aide au repos ; l'écran rempli à 390 et un vrai poste de cave à 1280.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png` (geste : dry hop « Ajouté aujourd'hui », ou densité
  au curseur m2, ou °C de cuve). Une variante ajoute `<id>-liste-390-clair.png`. Ta meilleure ajoute `<id>-repos-390-cave.png` et
  `<id>-repos-1280-clair.png`. Rendu : puppeteer-core (`.claude/skills/webapp-testing/SKILL.md`), 390 × 844, `isMobile`, `hasTouch`.
- Environ 10 tours par variante. Contexte : n'ouvre chaque image qu'une fois ; vers 150 k, finis les images manquantes et rends.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline du brief (geste m2, z1, J+n depuis le levurage, deux températures, FG en bande, dry hop nommé et fusionné au stock,
  premier plan actionnable, pas de cockpit) ; inconnu = « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes.
- Hypothèses du pilote (liantes) : densimètre ; °C de cuve seule en un toucher, la densité ajoute la °C d'échantillon ; prochain
  geste tiré de la recette figée (date estimée ou seuil de densité) ; tout brassin en cours visible ; un seul taux d'alcool,
  « provisoire » avant densité stable ; rappels dans l'app seulement ; 1280 élargi.
- Honnêteté : les chiffres de BRIEF-AUTEUR.md seulement ; aucune valeur d'arôme, d'IBU ou d'α inventée (α « — » ou celui d'une
  source du dépôt citée dans NOTE.md) ; aucun brassin inventé.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) : variantes, chaleur, idée, images ouvertes.
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ici (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK,
  au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave (selon la liste ci-dessus), toutes ouvertes.
- `NOTE.md` par variante : chaleur, idée en une ligne, baseline cochée, causes c3 évitées (1 à 7), écarts assumés.
Réponse finale au pilote : une ligne.
