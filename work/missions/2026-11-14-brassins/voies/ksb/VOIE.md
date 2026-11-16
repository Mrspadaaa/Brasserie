# Voie ksb — Critique du port : feuille Brasser d1b et Créer c2a

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 35 tours · Dépend de : sb · Décideur : pilote

## Objectif
Ses choix (15.11) : « Créer : c2a · Recettes : r2a — Mais bien revoir cette écran notamment pour la sélection de date », puis « Feuille Brasser : d1b ». Règle n° 1 : « C'est critique que mes choix soient
respectés. SI non, rien n'a de valeur. » Juger l'app portée contre chaque maquette, état par état, côte à côte (D342, D344) :
« combien et quels problèmes il y a ? ». Un verdict par maquette (CONFORME ou CORRIGER) : deux : d1b et c2a.

## Entrées
- Captures de l'app : `voies/sb/captures/` ; maquettes : `voies/d1/d1b/` et `voies/c2/c2a/` (PNG du même état) ; inventaire : `voies/sb/INVENTAIRE.md`.
- Ce que le port dit avoir laissé : `voies/sb/RESULTAT.md` (ACCORD 1 à 10, écarts). Ne compte pas comme défaut un écart déclaré en ACCORD ; juge seulement s'il est bien dit à l'écran (jamais un chiffre inventé, l'inconnu en mots). Lecture du pilote : « Brasser » sur une carte c2a ouvre d1b, et le brassin n'est créé qu'à « Planifier ».
- Les chiffres attendus : fixtures de `voies/sb/banc.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/ksb/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

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
`work/missions/2026-11-14-brassins/voies/ksb/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : les captures, toutes ouvertes.
Réponse finale au pilote : une ligne.
