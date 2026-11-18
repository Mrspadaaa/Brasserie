# Voie t4-ecran — test d'écran du port za3 (avant déploiement)

- Mission : 2026-11-14-materiel
- Agent : critique (en Opus : Fable interdit)
- Modèle : opus
- Niveau : jugement
- Plafond : 30 tours
- Dépend de : d2a, d2b
- Décideur en cas de doute : pilote

## Objectif
Mode « Test d'écran » (`.claude/agents/critique.md`) : l'app réelle contre sa maquette choisie za3 (règle n° 1), « combien et quels
problèmes ? », liste numérotée (D344). M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- App au banc : `M/voies/d2a/captures/*.png` (liste, traiter, ajout, vide, cave, 1280) et `M/voies/d2b/captures/*.png` + `INDEX.md`
  (fiche pH-mètre, hors tolérance, pompe, frigo, Gestion, cave, 1280). Journaux `journal-*.json` à côté.
- Maquette : `M/v2/za3/za3-*.png` (repos, geste, traiter, ajout, vide, repos-cave, repos-1280), NOTE.md ; `M/PORT.md` (inventaire).
- Note : banc d2a daté du 14.11, banc d2b du 15.11 (dates décalées d'un jour : pas un défaut).

## Possède
- `M/critique/ECRAN-PORT.md`, `M/voies/t4-ecran/`. Rien d'autre.

## Consignes
`M/critique/ECRAN-PORT.md` : `## Problèmes` P1…Pn, chacun : capture, zone, ce qu'on voit contre za3, gravité (bloquant / gênant /
mineur), correction précise (fichier probable si évident). Puis `## Conforme` (ce qui est fidèle) et `## Verdict` (DEPLOYABLE ou
A CORRIGER, bloquants listés). Vérifie en particulier : décimales des lectures et écarts (za3 : « +0,01 », « 4,03 · 7,02 »,
« pH 7,00 », « ±0,05 »), dépenses reliées à 390, toast « Étalonné · à jour jusqu'au … · Annuler », lignes du fil qui se touchent,
cibles 44 px, cave, 1280.

## Critères
`GATES.md` ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : sans objet (pas de `--reporter=dot > …`) : « Tests : sans objet » dans RESULTAT.md.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale : une ligne (nombre de problèmes, bloquants, verdict).
