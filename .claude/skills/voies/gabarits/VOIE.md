# Voie <id> — <titre court>

- Mission : <AAAA-MM-JJ-sujet>
- Agent : <executant | auteur | relecteur>
- Modèle : <haiku | sonnet | opus>
- Niveau : <mécanique | jugement | conception>
- Plafond : <tours> tours ; 3 essais par critère
- Dépend de : <ids de voies, ou —>
- Décideur en cas de doute : <pilote | conseil | brasseur>

## Objectif
<Une phrase : le livrable complet, vérifiable.>

## Entrées
- `<chemin vérifié par Glob>` — <pourquoi le lire>

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `<chemin ou dossier>`

## Consignes
<Ce que l'agent doit savoir et que le cerveau ne dit pas déjà. Court.>

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- <au style ; inconnu ≠ 0 ; peu de texte au premier plan ; penser en brasseur ; acquis concernés…>

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18 : sans ces trois points, la voie ne part pas)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`npx vitest run <fichiers> --reporter=dot > <dossier de la voie>/tests.txt`), et la suite
  entière visée pour les fichiers touchés, rouges hors zone compris (dits, pas laissés).
- Voie d'écran : les captures 390 tactile et 1280, clair et cave, côte à côte avec la maquette, toutes ouvertes.
Réponse finale au pilote : une ligne. Le pilote relance une voie au plus deux fois ; au-delà, il réécrit ce contrat.
