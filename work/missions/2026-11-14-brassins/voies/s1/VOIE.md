# Voie s1 — Série A — La cuve d'abord (mini maquettes v0)

- Mission : 2026-11-14-brassins
- Agent : concepteur
- Modèle : opus (Fable interdit)
- Niveau : conception
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : a1, a2, jury
- Décideur en cas de doute : brasseur (il choisit sur la page)

## Objectif
5 mini maquettes statiques (non jouables) de la série A — La cuve d'abord : la courbe en jours EST l'écran : densité qui descend vers la bande de FG, °C de cuve face à la consigne, jalons (dry hop, repos, garde) posés sur l'axe des jours ; le relevé part de la courbe.

## Entrées
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` — tout ce qu'il faut ; le lire en entier d'abord.
- `work/missions/2026-11-14-brassins/jury-brassins/fiche.md` — tranché, hypothèses du pilote, axes.
- `work/missions/2026-11-14-brassins/voies/a2-ecran/VERDICT.md` — § « Pour les maquettes ».
- Skills `boosters-ux`, `impeccable`, `ui-design-system` (Skill, une fois) ; `DESIGN.md` (Colors, Typography, Layout).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/s1/` : un dossier par variante `s1a` à `s1e` (`etat.html`, PNG, `NOTE.md`).
Rien dans `src/`. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()`.

## Consignes
- 5 variantes, toutes différentes et pas déclinées l'une de l'autre : 1 froide, 2 tièdes, 2 chaudes (une chaude mêle ton axe à un
  autre). Autres séries (ne pas les refaire) : s2 : B — Le prochain geste d'abord ; s3 : C — L'écart au prévu.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png` ; deux variantes ajoutent `<id>-liste-390-clair.png` ;
  tes deux meilleures ajoutent `<id>-repos-390-cave.png` et `<id>-repos-1280-clair.png`. Rendu : puppeteer-core
  (`.claude/skills/webapp-testing/SKILL.md`), 390 × 844 avec `isMobile` et `hasTouch`.
- Environ 10 tours par variante ; la fidélité fine vient en passe 2.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline du brief (geste m2, z1, J+n depuis le levurage, deux températures, FG en bande, dry hop nommé et fusionné au stock,
  premier plan actionnable, pas de cockpit) ; inconnu = « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes.
- Hypothèses du pilote : recopiées de `jury-brassins/fiche.md` § « Hypothèses du pilote » (les lire, elles lient).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) : variantes, chaleur, idée, images ouvertes.
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ici (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK,
  au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave (selon la liste ci-dessus), toutes ouvertes.
Réponse finale au pilote : une ligne.
