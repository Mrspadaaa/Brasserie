# Voie s3 — Série C — L'écart au prévu (mini maquettes v0)

- Mission : 2026-11-14-brassins
- Agent : concepteur
- Modèle : opus (Fable interdit)
- Niveau : conception
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : a1, a2, jury
- Décideur en cas de doute : brasseur (il choisit sur la page)

## Objectif
5 mini maquettes statiques (non jouables) de la série C — L'écart au prévu : la réalité face au plan de la recette (OG → bande FG, consigne °C, dry hop au jour ou au seuil) : ce qui suit le plan se tait, ce qui s'écarte se voit seul ; liste triée par urgence ou par fermenteur.

## Entrées
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` — seulement les sections dites dans « Consignes » (brief minimal).
- Skills `boosters-ux`, `impeccable`, `ui-design-system` (Skill, une fois) ; `DESIGN.md` (Colors, Typography, Layout).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/s3/` : un dossier par variante `s3a` à `s3e` (`etat.html`, PNG, `NOTE.md`).
Rien dans `src/`. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()`.

## Consignes
- **Brief minimal, créatif à fond** (contrepoids de M13, à la place d'une série Fable interdite) : de BRIEF-AUTEUR.md, lis seulement « La question », « Ses mots », « Obligatoire » et « Les chiffres » ; pas les exemples, pas le verdict, pas la fiche du jury. Ose la forme.
- 5 variantes, toutes différentes et pas déclinées l'une de l'autre : 1 froide, 2 tièdes, 2 chaudes (une chaude mêle ton axe à un
  autre). Autres séries (ne pas les refaire) : s1 : A — La cuve d'abord ; s2 : B — Le prochain geste d'abord.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png` ; deux variantes ajoutent `<id>-liste-390-clair.png` ;
  tes deux meilleures ajoutent `<id>-repos-390-cave.png` et `<id>-repos-1280-clair.png`. Rendu : puppeteer-core
  (`.claude/skills/webapp-testing/SKILL.md`), 390 × 844 avec `isMobile` et `hasTouch`.
- Environ 10 tours par variante ; la fidélité fine vient en passe 2.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline du brief (geste m2, z1, J+n depuis le levurage, deux températures, FG en bande, dry hop nommé et fusionné au stock,
  premier plan actionnable, pas de cockpit) ; inconnu = « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes.
- Hypothèses du pilote (liantes) : densimètre ; °C de cuve seule en un toucher, la densité ajoute la °C d'échantillon ; prochain
  geste tiré de la recette figée (date estimée ou seuil de densité) ; tout brassin en cours visible ; un seul taux d'alcool,
  « provisoire » avant densité stable ; rappels dans l'app seulement ; 1280 élargi.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) : variantes, chaleur, idée, images ouvertes.
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ici (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK,
  au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave (selon la liste ci-dessus), toutes ouvertes.
Réponse finale au pilote : une ligne.
