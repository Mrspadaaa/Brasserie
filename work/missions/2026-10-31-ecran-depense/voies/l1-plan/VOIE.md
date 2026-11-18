# Voie l1-plan — son choix D de la lenteur : le plan technique, écrit sur le code et mesuré (D308)

Agent : `auteur`, modèle **opus** (la voie fixe une direction que le port suivra). Plafond : 50 tours. Ligne `l1-plan` de MISSION.md.
**Aucun code de l'app modifié**, aucun commit, aucun déploiement, aucun appel réel à Gemini. Tu n'écris que dans `voies/l1-plan/`.
Lis d'abord D292 et D308 dans `work/refonte-frontend/decisions.md`, `voies/m-lenteur/RESULTAT.md` (les temps mesurés), `choix-lenteur/RESULTAT.md`
(la maquette D et sa « DÉCISION À PRENDRE »), et regarde `choix-lenteur/img/d-06.png`, `d-15.png`, `d-lue.png`.

## Ses mots (SPEC, 02.11, mot pour mot)
« La lenteur go pour la d »

## Ce qu'il a choisi (sa maquette, règle n° 1)
L'écran de la dépense dès les deux lectures rapides (Flash-Lite), valeurs provisoires ; la 3.8 finit en arrière-plan ; « Confirmer » attend
la lecture finale. Marques : fil de 22 px sous l'en-tête, « Lectures ●●◌ », « Confirmer » gris avec une roue ; à l'arrivée, le fil part,
« Confirmer » redevient noir, puce « ↻ N corrigées » (même geste de filtre que les autres puces), valeur corrigée sur fond bleu, l'ancienne barrée.
Décision du pilote : sa saisie l'emporte, la 3.8 ne réécrit jamais une cellule qu'il a touchée.

## Le plan à écrire (`voies/l1-plan/PLAN.md`)
1. **Aujourd'hui, lu dans le code** (chemins et lignes) : le chemin d'une lecture du client au serveur et retour (`src/services/geminiScanner.ts`,
   `src/ui/finance/ExpenseSheet.tsx`, `functions/src/ai.ts`, `functions/src/invoice*.ts`, la fusion et le jugement des lectures, le cache, le
   coût, le journal `brewerAiCosts`, `traduireNoms`, l'envoi de plusieurs pages). Où les deux Flash-Lite se finissent, où la 3.8 part.
2. **Les options techniques**, chacune avec ce qu'elle change, côté serveur et côté client, son coût (appels, octets renvoyés), son risque :
   (a) un appel qui rend deux fois (callable en flux : vérifie dans `node_modules` et `functions/node_modules` que `firebase` ^11.4 et
   `firebase-functions` ^6.3 l'offrent, et comment le client le lit) ; (b) deux appels (le second ne relit pas l'image si le serveur garde
   la première lecture : dis comment, et combien de temps) ; (c) toute autre que le code rend possible. Aucune écriture de règles Firestore,
   aucun index neuf (interdits au pilote sans son accord) : écarte une option qui en demande, ou marque-la.
3. **La recommandation**, et pourquoi, en mesures : temps jusqu'au premier écran et jusqu'à « Confirmer », sur les nombres de m-lenteur.
4. **Les cas limites, dans la forme de sa maquette** : la 3.8 en échec, en retard (au-delà de 40 s), hors ligne pendant la 3.8, l'onglet fermé,
   plusieurs pages, une pièce que la 3.8 n'aurait pas lue (12 sur 14 l'appellent : les 2 autres finissent à 6 s), une cellule qu'il a touchée,
   une ligne ajoutée ou supprimée par lui, une ligne que la 3.8 ajoute ou retire. Pour chacun : ce qu'il voit, ce que « Confirmer » fait.
   Un cas qui demande un dessin absent de sa maquette : le noter « à montrer », sans l'inventer.
5. **Les voies du port**, découpées (serveur, client, écran), avec leurs fichiers (périmètres disjoints), leurs témoins rouges, leurs tests
   (Gemini toujours simulé : réponses rejouées, jamais un vrai appel) et le banc Chrome à jouer (`voies/e-bout/lancer.sh`).
6. **Ce qui demande son accord** : le redéploiement d'aiTask et de l'hébergement (cadre neuf, D308) ; rien d'autre ne doit en demander.

## Critères (le pilote les rejoue)
1. Chaque affirmation sur le code porte un chemin et une ligne qui existent (le pilote en tire 10 au hasard).
2. Le flux (a) est prouvé ou écarté par le code des paquets installés (chemin du fichier, nom de la fonction).
3. Les temps cités se retrouvent dans `voies/m-lenteur/RESULTAT.md`.
4. Aucun fichier hors `voies/l1-plan/` modifié (`git status --short`).

## Rendre
`PLAN.md`, puis une ligne `L1-PLAN OK — <option recommandée> — voies/l1-plan/PLAN.md` ou `L1-PLAN ECHEC — <raison>` ;
`LEÇON PROPOSÉE : …`, `CONNAISSANCE : …` en fin de PLAN.md.
