# Voie kp2 — Contre-critique du port corrigé

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 35 tours · Dépend de : p5, p6 · Décideur : pilote

## Objectif
Ses choix (15.11) : « e1a », « e2a », « … — e4c », « e7a — … », « e11a — e10c ». Règle n° 1 : « C'est critique que mes choix soient
respectés. SI non, rien n'a de valeur. » Juger l'app portée contre chaque maquette, état par état, côte à côte (D342, D344) :
« combien et quels problèmes il y a ? ». Un verdict par maquette (CONFORME ou CORRIGER).

## Entrées
- D'abord : `voies/kp/VERDICT.md` (la critique précédente, 21 bloquants) et ce qui a été corrigé : `voies/p5/RESULTAT.md` (e1a, e2a, e4c), `voies/p6/RESULTAT.md` (e7a ; e11a n° 3 et 4 ; e11a n° 1, 2, 5 attendent son choix de la liste et du carnet, non comptés). Nouvelles captures : `voies/p5/captures/`, `voies/p6/captures/`. Pour chaque ancien [B] : corrigé ou non, sur la capture ; puis les défauts neufs.
- Captures de l'app : `voies/p1/captures/`, `voies/p2/captures/`, `voies/p3/captures/` (`<id>-<état>-app-…png`) ; maquettes :
  `voies/e1/e1a/`, `voies/e2/e2a/`, `voies/e4/e4c/`, `voies/e7/e7a/`, `voies/e10/e10c/`, `voies/e11/e11a/` (PNG du même état).
- Ce que chaque port dit avoir laissé : `voies/p1/RESULTAT.md`, `p2/RESULTAT.md`, `p3/RESULTAT.md` (sections écarts, ACCORD).
- Les chiffres attendus : `DONNEES-COMMUNES.md` et `voies/a1-banc/fixtures.json` (les captures de l'app sont sur ces fixtures).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/kp2/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque paire (maquette, app) du même état ; ne lis pas le code. Une capture plus ancienne que le dernier changement dit dans
  RESULTAT.md : le signaler, sans compter le défaut.
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; une section `## <id> — CONFORME|CORRIGER` par maquette, liste
  numérotée, `[B]` devant un bloquant (élément de sa maquette absent ou changé, geste perdu, chiffre faux, texte coupé, illisible,
  hors identité) ; chaque défaut dit l'état, la zone, l'écart et la correction attendue.
- Vers 150 k de contexte, écris ce qui est jugé et rends « REPRISE : VERDICT.md ».

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur ; inconnu dit en mots ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280. Fable interdit.

## Critères
`work/missions/2026-11-14-brassins/voies/kp2/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : les captures, toutes ouvertes.
Réponse finale au pilote : une ligne.
