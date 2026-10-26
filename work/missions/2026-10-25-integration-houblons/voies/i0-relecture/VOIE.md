# Voie i0-relecture — Relire l'état des lieux avant le conseil

- Mission : 2026-10-25-integration-houblons
- Agent : relecteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : i0-etat
- Décideur en cas de doute : pilote

## Objectif
Juger `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md` avant que le conseil s'en serve : les mesures sont
vraies, le classement tient face au code, les écarts B1 à B9 sont bien vérifiés.

## Entrées
- `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md` — le document jugé.
- `work/missions/2026-10-25-integration-houblons/voies/i0-etat/VOIE.md` — son contrat.
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md`, `src/ui/hopIndex/`, `src/domain/hopIndex/` — pour confronter.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-25-integration-houblons/voies/i0-relecture/RESULTAT.md`

## Consignes
Rejoue trois mesures du document par leur commande : un poids du build, un temps du moteur et une mesure à ×10. Écris dans
RESULTAT.md une section `## Rejouées`, avec une ligne par mesure : la commande, le chiffre du document, le tien, et « tient » ou
« écart ». Confronte au code au moins cinq lignes du classement et trois écarts B. Termine par une ligne `Verdict : ACCEPTÉ` ou
`Verdict : REJET — <raisons>`. Les fichiers de travail vont dans `os.tmpdir()`.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Mesurer avant d'affirmer (L20) ; un chiffre sans commande ne compte pas.
- Fini veut dire utilisable (L11) : un classement « fini » exige branché, parcours, typé, testé.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
