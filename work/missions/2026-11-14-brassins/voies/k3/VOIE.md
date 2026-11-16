# Voie k3 — Critique de e9, e10, e11, s4 avant de montrer

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 30 tours · Dépend de : e9, e10, e11, s4 · Décideur : pilote

## Objectif
Ses mots (15.11) : « Ça semble pas du tout respecter l'identité global de l'app ?? » ; avant, devant 19
maquettes : « Pas super fan de aucun ». Pour e9a, e9b, e9c, e9d, e10a, e10b, e10c, e10d, e11a, e11b, e11c, e11d, s4a, s4b, s4c : « combien et quels problèmes il y a ? », comme le brasseur, avant qu'on
les lui montre, après leur rhabillage à l'identité de l'app. D'abord : chacune se lit-elle comme un écran de l'app (à côté des captures de l'app) ? Un verdict par variante (MONTRER ou CORRIGER), et pour CORRIGER la liste exacte des défauts.

## Entrées
- Images : `work/missions/2026-11-14-brassins/voies/e9/`, `work/missions/2026-11-14-brassins/voies/e10/`, `work/missions/2026-11-14-brassins/voies/e11/`, `work/missions/2026-11-14-brassins/voies/s4/` (tous les PNG des dossiers de variantes) et leurs `NOTE.md` ; la vue de chaque série :
  § Objectif de son `VOIE.md`.
- `work/missions/2026-11-14-brassins/voies/c3/DIAGNOSTIC.md` : les 7 causes du refus précédent. Une variante qui retombe dans une cause est un défaut.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres (vrais chiffres).
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.
- L'app réelle (Read) : `work/missions/2026-11-14-brassins/voies/a1-banc/captures/liste-remplie-390-clair.png`, `fiche-fermentation-390-clair.png`, `liste-remplie-390-cave.png` ; la trousse : `work/missions/2026-11-14-brassins/outils/identite/demo/demo-390-clair.png` ; contrôle : `node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/<série>`.
- Le verdict d'avant rhabillage (défauts déjà corrigés, à ne pas voir revenir) : `work/missions/2026-11-14-brassins/voies/c5a/VERDICT.md`, `c5b`, `c5c` (e1 à e11), `work/missions/2026-11-14-brassins/voies/c4a/VERDICT.md`, `c4b` (s4 à s7).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/k3/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image ; ne relis pas les etat.html. Vérifie chaque chiffre contre « Les chiffres » (L14) ; une donnée dite fictive dans
  NOTE.md doit rester plausible pour une micro-brasserie suisse de 24 L.
- Vérifie aussi qu'aucune fonction de l'écran actuel ne disparaît sans être dite dans NOTE.md (L02).
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; puis une section `## <id> — MONTRER|CORRIGER` par variante, liste
  numérotée (bloquant : ne ressemble pas à un écran de l'app (palette, police, graisse, rayon, chrome absent ou faux), idée perdue au rhabillage, chiffre faux ou inventé, fonction perdue en silence, illisible, geste sans effet, texte coupé ou chevauché,
  `type="number"` ou clavier pour un nombre, retour d'une cause c3). Chaque défaut dit l'image et la zone, et la correction attendue.
- MONTRER si aucun bloquant. Finir par `## Classement` : par série, les variantes dans l'ordre où il les aimerait, une ligne chacune.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2) ; inconnu = « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280 ; premier plan
  actionnable, pas de cockpit ni de code interne.

## Critères
`work/missions/2026-11-14-brassins/voies/k3/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au même
  format que `--reporter=dot > …`.
- Voie d'écran : les captures des variantes, toutes ouvertes.
Réponse finale au pilote : une ligne.
