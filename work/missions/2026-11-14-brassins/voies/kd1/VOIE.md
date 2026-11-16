# Voie kd1 — Critique de la feuille « Brasser » (choix du jour) avant de montrer

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 30 tours · Dépend de : — · Décideur : pilote

## Objectif
Juger les 4 versions de la feuille « Brasser » de r2a (voie d1), refaites d'après sa demande du 15.11 : « Créer : c2a · Recettes : r2a — Mais bien revoir cette écran notamment pour la sélection de date ». Sa capture de la feuille actuelle : `work/missions/2026-11-14-brassins/voies/d1/ref/sa-capture-c2a-geste.jpg`. Le choix du jour doit être compris d'un coup d'œil, et la raison de chaque jour proposé doit être dite (cuve libre, dry hop, mise en bouteille).
Sur la page précédente, il a dit « Toujours pas très clair » (revue : `work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md`) : juger
aussi si chaque variante se distingue des autres AU REPOS à 390, et si « Ce qui change » et « Geste » de NOTE.md disent vrai.
« Combien et quels problèmes il y a ? », comme lui. Un verdict par maquette (MONTRER ou CORRIGER).

## Entrées
- `work/missions/2026-11-14-brassins/voies/d1/RESULTAT.md` (lecture de la demande, données réelles et fictives) et `voies/d1/VOIE.md`.
- Les 21 PNG : `voies/d1/d1a/`…`d1d/` (repos, geste, loin, conflit à 390 clair ; repos 390 cave ; d1d repos 1280) et chaque `NOTE.md`.
- Sa capture : `voies/d1/ref/sa-capture-c2a-geste.jpg` ; la maquette r2a choisie : `voies/r2/` (geste « Brasser »).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres ; `DONNEES-COMMUNES.md`.
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/kd1/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image une fois ; ne relis pas les etat.html. Vérifie chaque chiffre contre « Les chiffres » (L14).
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; une section `## <id> — MONTRER|CORRIGER` par maquette, liste numérotée,
  `[B]` devant un bloquant (attente manquée, chiffre faux, fonction perdue en silence, illisible, texte coupé, hors identité, variantes
  qui se ressemblent au repos, choix déjà fait trahi) ; chaque défaut dit l'image, la zone et la correction. Finir par `## Classement`
  (par série, une ligne par maquette, avec la phrase qu'il dirait).
- Vers 150 k de contexte, écris ce qui est jugé et rends « REPRISE : VERDICT.md ».

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Saisie au curseur (m2) ; inconnu dit en mots ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280 ; identité de l'app. Fable interdit.

## Critères
`work/missions/2026-11-14-brassins/voies/kd1/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil ; `tests.txt` porte la sortie des CHECK.
Réponse finale au pilote : une ligne.
