# Voie t12-critique — L'étape Houblons de l'app jugée contre sa maquette choisie (#170)

- Mission : 2026-10-25-integration-houblons
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : t12-ma-biere
- Décideur en cas de doute : pilote

## Objectif
Juger, comme le brasseur le ferait, l'étape Houblons de l'app (drapeau allumé) contre sa maquette choisie (`etape-houblons`, base v4.10,
légende v2a avec les barres de v2e) : chaque paire de captures de `voies/t12-ma-biere/RESULTAT.md` § Côte à côte. Un verdict : ACCEPTÉ
ou REJET, avec chaque écart visible cité (règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. »).

## Entrées
- `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/RESULTAT.md` et ses captures (ouvre chacune en image, L12).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` (le portrait du brasseur en juge) ; `work/refonte-frontend/v4/SPEC-BRASSEUR.md`.
- `work/refonte-frontend/v4/choix/ecrans.json` (`etape-houblons`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-25-integration-houblons/voies/t12-critique/RESULTAT.md`

## Consignes
Compare état par état : rail, cartes, pastilles, légende v2a (ses mots exacts, la barre de v2e), ajouts proposés, boutons, couleurs,
tailles. Un écart d'un pixel qui change ce qu'il lit compte ; un écart de rendu du navigateur sans effet ne compte pas. Termine par
une ligne `Verdict : ACCEPTÉ` ou `Verdict : REJET — <écarts>` et, pour chaque écart, la phrase qu'il dirait.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 ; L03 (sa maquette telle quelle) ; L12 (une capture non regardée ne prouve rien) ; L27 (un défaut se signale, la diversité ne se rejette pas).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md`, réponse finale au pilote : une ligne.
