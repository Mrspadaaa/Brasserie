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
- `DOSSIER.md` (même dossier, préparé par le pilote, 2 000 mots au plus) : extraits utiles des sources (lignes du registre, passages
  de SPEC, de CHOIX, du code). Le lire À LA PLACE des sources brutes ; ouvrir une source seulement pour un point qu'il ne couvre pas.
- `<chemin vérifié par Glob>` — <pourquoi le lire>

## Économie (exigé par le hook, 23.11)
- Mécanique : <ce qui part en voie executant Haiku (banc, captures, rejeu, lignes du registre), ou « aucune » et pourquoi>
- Gestes : <un script par lot de gestes ou de contrôles, sortie filtrée ; captures à demi-échelle sauf jugement de détail>

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
- Voie d'écran : rendre vite un commit prêt à mettre en ligne ; les captures 390 (côte à côte avec la maquette, ouvertes) se prennent
  sur l'app DÉPLOYÉE, après la mise en ligne. Unit et local trouvent peu de vrais bugs (23.11) : pas de long banc local avant.
Réponse finale au pilote : une ligne. Le pilote relance une voie au plus deux fois ; au-delà, il réécrit ce contrat.
