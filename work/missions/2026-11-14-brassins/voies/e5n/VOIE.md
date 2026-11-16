# Voie e5n — Créer un brassin, refait d'un autre genre

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : g2a · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11), mot pour mot : « … — Créer un brassin ?? Pas convaincu — … ». Aucune des 4 versions ne le convainc : e5a « la feuille
remise d'aplomb », e5b « le planning des cuves décide », e5c « rebrasser ce qui manque », e5d « la phrase à trous ». Faire 4 nouvelles
maquettes de « Créer un brassin » (le bouton + sous Brassins, la feuille de préparation : recette, volume, date, fermenteur libre, le cas
sans recette), d'un AUTRE genre que ces quatre (L13 : après un refus, changer de genre et partir d'une référence qu'il connaît).

## Entrées
- Les 4 refusées (Read, repos et geste, une fois) : `work/missions/2026-11-14-brassins/voies/e5/e5[a-d]/` et leurs NOTE.md ; critique :
  `voies/k2/VERDICT.md` § e5. Écris d'abord dans RESULTAT.md, en 5 lignes, pourquoi il n'est pas convaincu (hypothèses) et les 4 genres neufs.
- Ce qu'il aime (Read) : `work/refonte-frontend/v4/choix/baselines/` (`fiche/repos.png`, `dryhopper/repos.png`, `etape-houblons/repos.png`),
  la vue du jour de brassage z1 (`C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/distracted-dewdney-b8bc6e/work/missions/2026-11-10-vue-brassin/v0/z1/z1-preparer-390.png`),
  et ce qu'il vient de retenir : `voies/e7/e7a/e7a-repos-390-clair.png`, `voies/e4/e4c/e4c-repos-390-clair.png`.
- Ce que fait l'app aujourd'hui : `src/App.tsx` (l. 537-560, « Nouveau brassin ») et la feuille qu'il ouvre. Ses mots : `grep -n -i -E
  "nouveau brassin|préparer|planifi|lancer" work/refonte-frontend/v4/SPEC-BRASSEUR.md | head -30`.
- Trousse d'identité, obligatoire : `work/missions/2026-11-14-brassins/outils/identite/` ; `BRIEF-AUTEUR.md` § Les chiffres ;
  `DONNEES-COMMUNES.md` ; gabarit : `voies/e5/capture.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e5n/` : `e5na` à `e5nd` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`. Rien dans `src/`. Ni commit ni stash.

## Consignes
- 4 genres neufs, 1 froide, 2 tièdes, 1 chaude ; aucune ne reprend la forme d'une refusée.
- Images : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png` (le brassin créé apparaît planifié), `<id>-vide-390-clair.png` (sans
  recette), `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. Ouvrir chaque image (Read) une fois.
- `NOTE.md` : chaleur, « Idée : » (6 mots au plus pour le nom), en quoi elle diffère des 4 refusées.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Identité de l'app (trousse, contrôle d'identité OK) ; saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ;
  inconnu « — » ; cibles ≥ 44 px ; clair et cave ; 390 et 1280 ; données de BRIEF-AUTEUR et DONNEES-COMMUNES seulement.

## Critères
`work/missions/2026-11-14-brassins/voies/e5n/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
