# Voie p2a — Passe 2 de s1e

- Mission : 2026-11-14-brassins
- Agent : concepteur
- Modèle : opus (Fable interdit)
- Niveau : conception
- Plafond : 45 tours ; 3 essais par critère ; contexte : ne relis que ce qui est listé, arrête-toi avant 180 k avec un REPRISE.md
- Dépend de : t1
- Décideur en cas de doute : brasseur

## Objectif
s1e en v2 (ses 3 corrections, greffes reçues) ET une variante sœur s1g = fusion s1e + s1c (densimètre dans la courbe) + s2d (geste posé sur son seuil), sans remplacer s1e. Mini maquettes statiques (non jouables), prêtes à montrer.

## Entrées (rien d'autre)
- `work/missions/2026-11-14-brassins/voies/s1/s1e/etat.html` (ta base : copie-la dans `work/missions/2026-11-14-brassins/voies/p2a/s1e2/etat.html`, préfixe de classes inchangé ou `s1e2-`) et sa `NOTE.md`.
- `work/missions/2026-11-14-brassins/voies/t1/SYNTHESE.md` : § « Candidates » (la tienne : s1e), § « Greffes » (lignes « Reçue par » s1e), § « Défauts par variante » (s1e), § « Retouches communes ».
- Pour les greffes, regarder seulement les PNG de : voies/s1/s1c, voies/s2/s2d (pas leurs etat.html, sauf pour copier un fragment précis).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § « Obligatoire » et § « Les chiffres ».
- Skill `boosters-ux` (une fois) ; `impeccable` et `ui-design-system` seulement si un doute de forme le demande.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/p2a/` : `s1e2/`, `s1g/` (`etat.html`, PNG, `NOTE.md`), `RESULTAT.md`, `tests.txt`.
Rien dans `src/`. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()`.

## Consignes
- Corrige chaque défaut de s1e listé par t1 et chaque retouche commune ; intègre les greffes reçues. Premier écran plein à 390
  (aucune bande vide de plus de 80 px), sans décor.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png` (après un geste : °C de cuve relevée au curseur m2),
  `<id>-dryhop-390-clair.png` (après « Ajouté aujourd'hui »), `<id>-liste-390-clair.png`, `<id>-repos-390-cave.png`,
  `<id>-repos-1280-clair.png`. Rendu puppeteer-core 390 × 844, `isMobile`, `hasTouch` (script de capture de la série d'origine
  réutilisable : `work/missions/2026-11-14-brassins/voies/s1/`).
- Ouvre chaque PNG et juge-le comme lui ; corrige avant de rendre (L12).
- Mesure : `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/missions/2026-11-14-brassins/voies/p2a/*/*-repos-390-clair.png work/missions/2026-11-14-brassins/voies/p2a/*/*-geste-390-clair.png` dans `tests.txt`.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline : geste m2 tel quel (toucher, piste, bande cible, ±0,1 / ±0,001, valeur tapée à un toucher) ; grammaire z1 ; J+n depuis le
  levurage avec sa date ; deux températures (cuve face à la consigne 18–20 °C ; échantillon avec la densité) ; FG en bande ; dry hop
  nommé, dosé, daté, « Ajouté aujourd'hui » qui confirme le déstockage ; premier plan actionnable ; pas de cockpit ni de bandeau
  d'alerte ; inconnu = « — » ; chiffres à la virgule, pas de double espace avant l'unité ; cibles ≥ 44 px ; deux thèmes ; alcool et
  atténuation « provisoires ».

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) : défauts corrigés un par un, greffes intégrées, images ouvertes.
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK et de
  controle-panel, au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
