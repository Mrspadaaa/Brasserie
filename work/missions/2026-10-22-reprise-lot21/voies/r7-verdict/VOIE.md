# Voie r7-verdict — Verdict sur les cinq candidates de Dryhopper améliorées

- Mission : 2026-10-22-reprise-lot21
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Étape : verdict après la passe 2 (entonnoir, M13)
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r7a2-passe2, r7b2-passe2, r7d2-passe2, r7e2-passe2, r7g2-passe2
- Décideur en cas de doute : pilote

## Lire d'abord
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0, puis les sections de y1b, x3b et a2b ;
`work/refonte-frontend/v4/DEFAUTS-COURT.md` ; `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Objectif
Après la passe 2, **reclasser** les cinq candidates améliorées, **regreffer**, et rendre un **verdict** : satisfaisant
(aucun REJET, contrôles verts, phrase prédite positive) ou passe 3, avec pour chaque candidate ce qu'elle doit encore
faire. Ton avis est indicatif (L27) : le brasseur verra les cinq puis les 56 ; un REJET cite une ligne de DEFAUTS ou la SPEC.

## Ce que tu fais
- Ouvre en image, pour chaque candidate, `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-<x>/passe2/captures/<id>-premier-ecran.png` et `<id>-toucher-390.png`
  (a1, b4, d8, e5, g1), et compare à sa v0 (`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-<x>/captures/<id>-390.png`) et à `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/SYNTHESE.md`.
- Écris `RESULTAT.md` : ligne 1 `OK — verdict : satisfaisant` ou `OK — verdict : passe 3` ; une ligne par candidate au
  format du rejeu (`- **a1** — ACCEPTÉ : …` ou `— REJET : …`) ; `## Classement`, `## Greffes`, `Phrase prédite : « … »` ;
  `LEÇON PROPOSÉE : …`.

## Possède (seuls chemins où écrire)
- `work/missions/2026-10-22-reprise-lot21/voies/r7-verdict/RESULTAT.md`

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.
