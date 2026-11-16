# Voie kq2 — Contre-critique du port corrigé (gfc, e6a + e6c, e3gb, e9na)

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 35 tours · Dépend de : q5, q6, q7 · Décideur : pilote

## Objectif
Ses choix (15.11) : « Fermentation : gfc · Filtres : e6a + e6c · … · Carnet : e3gb · … · Atelier : e9na ». Règle n° 1 : « C'est critique que mes choix soient
respectés. SI non, rien n'a de valeur. » Juger l'app portée contre chaque maquette, état par état, côte à côte (D342, D344) :
« combien et quels problèmes il y a ? ». Un verdict par maquette (CONFORME ou CORRIGER).

## Entrées
- D'abord : `voies/kq/VERDICT.md` (12 bloquants) et ce qui a été corrigé : `voies/q5/RESULTAT.md` (gfc, e3gb), `voies/q6/RESULTAT.md` (e6a, e6c), `voies/q7/RESULTAT.md` (e9na ; n° 1 attend l'accord). Nouvelles captures : `voies/q5/captures/`, `voies/q6/captures/`, `voies/q7/captures/`. Pour chaque ancien [B] : corrigé ou non ; puis les défauts neufs.
- Maquettes : `voies/gf/gfc/`, `voies/e6/e6a/`, `voies/e6/e6c/`, `voies/e3g/e3gb/`, `voies/e9n/e9na/` (PNG du même état).
- Ce que chaque port dit avoir laissé : `voies/q1/RESULTAT.md` à `voies/q4/RESULTAT.md` (sections écarts, ACCORD).
- Les chiffres attendus : `DONNEES-COMMUNES.md` et `voies/a1-banc/fixtures.json` (les captures de l'app sont sur ces fixtures).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/kq2/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

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
`work/missions/2026-11-14-brassins/voies/kq2/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : les captures, toutes ouvertes.
Réponse finale au pilote : une ligne.
