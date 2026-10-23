# Voie r4d-verdict — Verdict sur les propositions « épicé » améliorées

- Mission : 2026-10-22-reprise-lot21
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Étape : verdict après la passe 2 (entonnoir, M13)
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r4d-a2-passe2, r4d-d2-passe2, r4d-e2-passe2, r4d-f2-passe2
- Décideur en cas de doute : pilote

## Lire d'abord (22.10, nuit)
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0 « Ce qui vaut aujourd'hui », puis seulement la section du picto « épicé ». Au lieu de DEFAUTS-RECURRENTS.md en entier : `work/refonte-frontend/v4/DEFAUTS-COURT.md` (lignes D101 à D101 quater).

## Objectif
Après la passe 2, **reclasser** les candidates améliorées, **regreffer** et rendre un **verdict** : satisfaisant ou non.
Satisfaisant = aucun REJET, tous les contrôles des passes verts, et ta phrase prédite du brasseur positive. Sinon, tu
écris pour chaque candidate ce que la passe 3 doit faire. Le pilote lance une passe 3 (puis 4 au plus), ou s'arrête si
la passe n'a plus rien apporté.

## Ce qu'il veut (22.10, nuit), mot pour mot
« Je veux un forme qui représente vraiment ce que c'est, genre canellle vanille, ou clou de girofle ect... Ce que ça
représente vraiment épicier sur un houblon... » (D101 quater). Quatre refus avant (D101 à D101 ter).

## Ce que tu n'es pas (L27)
Ton étalonnage n'est pas fait : ton avis est indicatif. Le brasseur verra toutes les propositions. Un REJET cite une
ligne de `DEFAUTS-RECURRENTS.md` (D60, D88, D101 à D101 quater…) ou une phrase de `SPEC-BRASSEUR.md`.

## Ce que tu fais
- Ouvre en image `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-{a,d,e,f}/passe2/captures/tailles-390.png` et `cartes-390.png`, et relis
  `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/SYNTHESE.md` (le classement et les greffes d'avant la passe).
- Pour chaque candidate : se nomme-t-elle à voix haute à 12 px ? Est-ce bien l'épice qu'elle dit ? Se confond-elle avec
  la feuille ou les brins ? La passe a-t-elle apporté quelque chose (avant → après) ?
- Écris `RESULTAT.md` :
  - ligne 1 : `OK — verdict : satisfaisant` ou `OK — verdict : passe 3` ;
  - `- **r4d** — ACCEPTÉ : …` ou `- **r4d** — REJET : …` (au format lu par le rejeu), puis une sous-ligne par
    candidate ;
  - `## Classement` (les candidates améliorées, reclassées), `## Greffes` (les nouvelles), `Phrase prédite : « … »` ;
  - `LEÇON PROPOSÉE : …` ou `aucune`.

## Possède (seuls chemins où écrire)
- `work/missions/2026-10-22-reprise-lot21/voies/r4d-verdict/RESULTAT.md`

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
Réponse finale au pilote : la ligne 1 de RESULTAT.md.
