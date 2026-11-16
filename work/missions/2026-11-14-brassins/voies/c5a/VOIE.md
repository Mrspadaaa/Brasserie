# Voie c5a — Critique de e1, e2, e3, e4 avant de montrer

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 30 tours · Dépend de : e1, e2, e3, e4 · Décideur : pilote

## Objectif
Ses mots (14.11) : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? » ; avant, devant 19
maquettes : « Pas super fan de aucun ». Pour e1a, e1b, e1c, e1d, e2a, e2b, e2c, e2d, e3a, e3b, e3c, e3d, e4a, e4b, e4c, e4d : « combien et quels problèmes il y a ? », comme le brasseur, avant qu'on
les lui montre. Un verdict par variante (MONTRER ou CORRIGER), et pour CORRIGER la liste exacte des défauts.

## Entrées
- Images : `work/missions/2026-11-14-brassins/voies/e1/`, `work/missions/2026-11-14-brassins/voies/e2/`, `work/missions/2026-11-14-brassins/voies/e3/`, `work/missions/2026-11-14-brassins/voies/e4/` (tous les PNG des dossiers de variantes) et leurs `NOTE.md` ; la vue de chaque série :
  § Objectif de son `VOIE.md`.
- `work/missions/2026-11-14-brassins/voies/c3/DIAGNOSTIC.md` : les 7 causes du refus précédent. Une variante qui retombe dans une cause est un défaut.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres (vrais chiffres).
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/c5a/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image ; ne relis pas les etat.html. Vérifie chaque chiffre contre « Les chiffres » (L14) ; une donnée dite fictive dans
  NOTE.md doit rester plausible pour une micro-brasserie suisse de 24 L.
- Vérifie aussi qu'aucune fonction de l'écran actuel ne disparaît sans être dite dans NOTE.md (L02).
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; puis une section `## <id> — MONTRER|CORRIGER` par variante, liste
  numérotée (bloquant : chiffre faux ou inventé, fonction perdue en silence, illisible, geste sans effet, texte coupé ou chevauché,
  `type="number"` ou clavier pour un nombre, retour d'une cause c3). Chaque défaut dit l'image et la zone, et la correction attendue.
- MONTRER si aucun bloquant. Finir par `## Classement` : par série, les 4 dans l'ordre où il les aimerait, une ligne chacune.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2) ; inconnu = « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280 ; premier plan
  actionnable, pas de cockpit ni de code interne.

## Critères
`work/missions/2026-11-14-brassins/voies/c5a/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au même
  format que `--reporter=dot > …`.
- Voie d'écran : les captures des variantes, toutes ouvertes.
Réponse finale au pilote : une ligne.
