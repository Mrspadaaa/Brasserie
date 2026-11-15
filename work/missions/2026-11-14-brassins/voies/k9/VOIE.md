# Voie k9 — Critique de e8na à e8nd et e9na à e9nd avant de montrer

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 40 tours · Dépend de : — · Décideur : pilote

## Objectif
Ses mots (15.11), mot pour mot : « Le carnet de recettes, pas très compact, pas super convaincu quand il y aura des dizaines de recette » ; « e8 · Le carnet de recettes j'ai déjà donné mon avis la dessus » ; « · L'Atelier R&D toujours pas super convaincu ». e8n : 4 carnets compacts pour 30 à 40 recettes, rien de la forme des refusées e8a à e8d. e9n : 4 Ateliers R&D d'un autre genre, rien de la forme des refusées e9a à e9d.
Sur la page précédente, il a dit « Toujours pas très clair » (revue : `work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md`) : juger
aussi si chaque variante se distingue des autres AU REPOS à 390, et si « Ce qui change » et « Geste » de NOTE.md disent vrai.
« Combien et quels problèmes il y a ? », comme lui. Un verdict par maquette (MONTRER ou CORRIGER).

## Entrées
- Images et NOTE.md : `work/missions/2026-11-14-brassins/voies/e8n/e8n[a-d]/`, `voies/e9n/e9n[a-d]/` ; `voies/e8n/RESULTAT.md`, `voies/e9n/RESULTAT.md` (pourquoi les refusées ne convainquaient pas).
- Refusées (repos seulement) : `voies/e8/e8[a-d]/`, `voies/e9/e9[a-d]/`.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres ; `DONNEES-COMMUNES.md`.
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/k9/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image une fois ; ne relis pas les etat.html. Vérifie chaque chiffre contre « Les chiffres » (L14).
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; une section `## <id> — MONTRER|CORRIGER` par maquette, liste numérotée,
  `[B]` devant un bloquant (attente manquée, chiffre faux, fonction perdue en silence, illisible, texte coupé, hors identité, variantes
  qui se ressemblent au repos, choix déjà fait trahi) ; chaque défaut dit l'image, la zone et la correction. Finir par `## Classement`
  (par série, une ligne par maquette, avec la phrase qu'il dirait).
- Vers 150 k de contexte, écris ce qui est jugé et rends « REPRISE : VERDICT.md ».

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2) ; inconnu dit en mots ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280 ; identité de l'app. Fable interdit.

## Critères
`work/missions/2026-11-14-brassins/voies/k9/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : les captures, toutes ouvertes.
Réponse finale au pilote : une ligne.
