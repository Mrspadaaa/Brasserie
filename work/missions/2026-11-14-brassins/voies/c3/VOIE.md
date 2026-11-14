# Voie c3 — Critique : pourquoi aucune variante ne lui plaît

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 30 tours · Dépend de : pg · Décideur : pilote

## Objectif
Ses mots (14.11), devant la page des 19 maquettes (s1e2, s1g, s2a2, s3b2 et le panel v0 de 15) : « Pas super fan de aucun, lance une
critique et fait d'autres versions ». Il ne dit pas pourquoi. Trouver la ou les causes communes (ce que toutes partagent et qu'il
n'aime pas), puis proposer 4 genres de solution neufs pour la série suivante (L13 : après un refus, changer de genre, partir d'une
référence qu'il connaît).

## Entrées
- Images refusées : `work/missions/2026-11-14-brassins/page/img/` : les 4 passes 2 (`*-repos.png`, `*-geste.png`, `*-liste.png`,
  `*-1280.png`), et au moins 6 v0 de séries différentes (`s1a`, `s1c`, `s2b`, `s2d`, `s3a`, `s3d`, repos). `ref-fiche.png` = l'écran actuel.
- Ce qu'il a CHOISI ailleurs (son goût, à opposer aux refusées) : `work/refonte-frontend/v4/ecran-1/base/captures/consolide-390.png`,
  `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/captures/q2b-b-390.png`, `work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/cmc2k.png`,
  `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/captures/p4b2f-premier-ecran.png`,
  `work/refonte-frontend/v4/ecran-1/fils11-substitution/captures/u4-vue-390.png`, et la vue du jour de brassage z1 qu'il a validée :
  `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/distracted-dewdney-b8bc6e/work/missions/2026-11-10-vue-brassin/v0/z1/z1-ebullition-390.png`, `z1-mesure-390.png`.
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` ; mots : `BRIEF-AUTEUR.md` § Ses mots, § Obligatoire.
- Ce qui a déjà été dit des refusées : `voies/t1/SYNTHESE.md`, `voies/c2/VERDICT.md` (ne pas les recopier : chercher ce qu'ils ont manqué).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/c3/` (`DIAGNOSTIC.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image citée (Read) ; ne lis pas les etat.html. Juge comme lui, à la question « qu'est-ce qui cloche dans toutes ? ».
- `DIAGNOSTIC.md`, ligne 1 : `OK — <n> causes, <n> genres`. Puis :
  - `## Causes` : numérotées, de la plus probable à la moins probable ; chacune avec la preuve vue (image, zone) et ce que ses choix
    (consolide, q2b, cmc2k, p4b2f, u4, z1) font à la place. Distinguer forme (densité, typographie, couleurs, cartes empilées,
    ressemblance entre variantes) et fond (question mal posée, ce qu'il vient faire au cuvier, ce qui manque).
  - `## Genres` : exactement 4, `### G1 — <nom>` à `### G4`, chacun : l'idée en une ligne ; la référence qu'il connaît ou une app
    de brasseur réelle (nommer laquelle et ce qu'on lui prend) ; ce que la fiche et la liste deviennent ; ce qui est retiré des
    refusées ; le risque. Au moins un genre très dense « tableau de cuverie », au moins un genre radicalement simple, et au plus un
    proche des refusées.
  - `## Garder` : ce qui, dans les refusées, tient (à reprendre tel quel), en 5 lignes au plus.
- Aucun chiffre neuf : les chiffres de BRIEF-AUTEUR.md § Les chiffres seulement.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline du brief (geste m2, z1, J+n depuis le levurage, deux températures, FG en bande, dry hop nommé et fusionné au stock,
  premier plan actionnable, pas de cockpit) ; inconnu = « — » ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280.

## Critères
`work/missions/2026-11-14-brassins/voies/c3/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au même
  format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (celles des entrées).
Réponse finale au pilote : une ligne.
