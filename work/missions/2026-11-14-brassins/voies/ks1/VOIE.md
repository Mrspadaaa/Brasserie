# Voie ks1 — Critique du port : r2a (Recettes)

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 35 tours · Dépend de : s1 · Décideur : pilote

## Objectif
Ses choix (15.11) : « Créer : c2a · Recettes : r2a — Mais bien revoir cette écran notamment pour la sélection de date ». Règle n° 1 : « C'est critique que mes choix soient
respectés. SI non, rien n'a de valeur. » Juger l'app portée contre chaque maquette, état par état, côte à côte (D342, D344) :
« combien et quels problèmes il y a ? ». Un verdict par maquette (CONFORME ou CORRIGER) : une seule, r2a.

## Entrées
- Captures de l'app : `voies/s1/captures/` ; maquette : `voies/r2/r2a/` (PNG du même état) ; inventaire : `voies/s1/INVENTAIRE.md`.
- Ce que le port dit avoir laissé : `voies/s1/RESULTAT.md` (DÉCISION, ACCORD, écarts). Ne compte pas comme défaut ce qui y est déclaré ACCORD ou DÉCISION du pilote (Comparer et bilan retirés ; « Planifier » au lieu de « Aux besoins » ; ligne fermenteur retirée ; « Brasser » ouvre la feuille actuelle, que la voie d1 redessine) ; juge seulement si c'est bien dit.
- Les chiffres attendus : fixtures de `voies/s1/banc.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/ks1/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

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
`work/missions/2026-11-14-brassins/voies/ks1/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : les captures, toutes ouvertes.
Réponse finale au pilote : une ligne.
