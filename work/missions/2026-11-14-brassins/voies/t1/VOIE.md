# Voie t1 — Tri du panel v0 (15 mini maquettes)

- Mission : 2026-11-14-brassins
- Agent : critique
- Modèle : opus (Fable interdit)
- Niveau : jugement
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : s1, s2, s3
- Décideur en cas de doute : pilote

## Objectif
Classer les 15 variantes (s1a…s3e) comme le brasseur, sans rejet de diversité ; garder 3 candidates divergentes et leurs greffes
(même des plus extravagantes) ; lister les défauts de chaque variante (pour la passe 2) ; mesurer le panel.

## Entrées
- `work/missions/2026-11-14-brassins/voies/s1/`, `s2/`, `s3/` : chaque `<id>/` (PNG, `NOTE.md`) et `RESULTAT.md` de série.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` (baseline obligatoire), `jury-brassins/fiche.md`, `voies/a2-ecran/VERDICT.md`.
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/t1/` (`SYNTHESE.md`, `panel.txt`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre (Read) chaque image `-repos-390-clair` et `-geste-390-clair` des 15, et les listes ; puis les caves et 1280.
- `SYNTHESE.md` : `## Classement` (15 lignes : id, note de 1 à 5 selon lui, une ligne) ; `## Candidates` (3, divergentes) ;
  `## Greffes` (élément, variante d'origine, candidate qui le reçoit) ; `## Défauts par variante` (liste numérotée par id :
  écart à la baseline, chiffre faux, illisible, cible < 44 px, texte en trop) ; `## Retouches communes`.
- Mesure du panel : `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs <toutes les -repos-390-clair.png> > work/missions/2026-11-14-brassins/voies/t1/panel.txt` ; un ECHEC se dit dans SYNTHESE, il ne bloque pas.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline du brief (geste m2, z1, J+n depuis le levurage, deux températures, FG en bande, dry hop nommé et fusionné au stock,
  premier plan actionnable, pas de cockpit) ; inconnu = « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au
  même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, ouvertes.
Réponse finale au pilote : une ligne.
