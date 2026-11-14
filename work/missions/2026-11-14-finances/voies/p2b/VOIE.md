# Voie p2b — passe 2 des candidates s3b, s3c

- Mission : 2026-11-14-finances
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 50 tours ; 3 essais par critère
- Dépend de : c1
- Décideur en cas de doute : brasseur (page de choix) ; pilote pour le reste

## Objectif
Corriger chaque défaut numéroté du critique et poser ses greffes sur s3b, s3c, pour qu'elles soient montrables : v6a intacte au repos, plage du jour au jour, effet juste après le geste.

## Entrées
- `work/missions/2026-11-14-finances/critique/SYNTHESE.md` — lire seulement les lignes de s3b, s3c (tableau), « Candidates » et « Greffes ».
- `work/missions/2026-11-14-finances/DOSSIER.md` — ses mots et les exigences ; ne pas relire les sources qu'il résume.
- `work/missions/2026-11-14-finances/voies/s3/s3b/` — etat.html, images, NOTE.md
- `work/missions/2026-11-14-finances/voies/s3/s3c/` — etat.html, images, NOTE.md

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/p2b`

## Consignes
Charger `boosters-ux`, `impeccable`, `ui-design-system`. Pour chaque id : copier son dossier vers `work/missions/2026-11-14-finances/voies/p2b/<id>p2/` (classes renommées `<id>p2-…`), corriger tous ses défauts, poser les greffes reçues, garder ‹ › utilisables en plage (10.11 : « Pourquoi je peux pas changer de mois ? Je veux !! »), une opération hors plage reste visible à sa place (ligne « hors plage »), montants justes. Images : `<id>p2-repos.png`, `<id>p2-apres.png` (et l'état intermédiaire s'il existe), 390 px, échelle 2. NOTE.md : ce qui a changé, défaut par défaut. Aucun Fable, aucun sous-agent.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : v6a telle quelle au repos ; « ✓ Payé » 24 px ; geste principal 44 px ; peu de texte au premier plan ; jamais type="number" ; inconnu ≠ 0 ; lignes-tâches filtrantes gardées ; une hachure veut dire « à payer » (ne pas lui donner un autre sens).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, une ligne par candidate (id, défauts corrigés, images ouvertes) : une limite de tours ne perd rien.
- Tests : maquettes statiques, aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-finances/outils/controle-serie.mjs work/missions/2026-11-14-finances/voies/p2b s3bp2,s3cp2 > work/missions/2026-11-14-finances/voies/p2b/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
- Voie d'écran : 390 clair, repos et après, chaque image ouverte avant de rendre.
Réponse finale au pilote : une ligne.
