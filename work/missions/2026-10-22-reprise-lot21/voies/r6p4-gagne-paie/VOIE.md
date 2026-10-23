# Voie r6p4-gagne-paie — Variante de r6n2 : On gagne, on paie

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Étape : reprise (r6n2 choisie le 23.10) ; chaleur chaude
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : r6nc2-critique
- Décideur en cas de doute : brasseur (il choisit parmi r6n2 et ses variantes) ; pilote pour le contrat

## Lire d'abord
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0 « Ce qui vaut aujourd'hui », puis les sections de Comparer.
Au lieu de DEFAUTS-RECURRENTS.md en entier : `work/refonte-frontend/v4/DEFAUTS-COURT.md`.

## Objectif
Une mini maquette de Comparer, `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/etat.html` : r6n2, avec les meilleures idées retenues, sous ton angle.

## Ton angle
**On gagne, on paie** (e5 de Dryhopper, jugée « Très bien celui-là, je vois ce que je gagne et ce que je paie »).
Transposée aux houblons : sous la tête de chaque colonne, ce que le houblon apporte à sa stout (floral, agrumes…) d'un
côté, ce qu'il coûte de l'autre (résineux, amertume, ce qui sort du style), en barres divergentes chiffrées, avec la
loupe à mini-barres de e5. Forme libre pour ce bloc ; le reste de r6n2 reste reconnaissable.

Trois autres variantes partent de r6n2 en même temps (r6p1 nettoyée, r6p2 la réponse d'abord, r6p3 son défi au premier
écran, r6p4 on gagne / on paie : la tienne est l'une d'elles). Ne regarde pas leurs dossiers.

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/BRIEF-R6P.md` — le brief commun : lis-le en entier d'abord.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/` (etat.html, generer.mjs, NOTE.md) et `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-*.png` — le plancher.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/BRIEF-REPRISE.md`, `work/refonte-frontend/v4/ecran-1/fils22-comparer/BRIEF-AUTEUR.md`, `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/` — le balisage, les données, l'inventaire.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`, `cerveau/produit/acquis-valides.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/**`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p4-*.png`
- `work/missions/2026-10-22-reprise-lot21/voies/r6p4-gagne-paie/RESULTAT.md`
Fichiers de travail dans ton dossier ou dans `os.tmpdir()`, jamais à la racine (L17).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent : ligne 1, les idées reprises (d'où, où), les sorties décisives, les captures
ouvertes par leur nom, ta prédiction de sa réaction, `CONNAISSANCE : …` et `LEÇON PROPOSÉE : …`. Garde quatre tours
pour l'écrire. Réponse finale au pilote : une ligne.
