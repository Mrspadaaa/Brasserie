# Voie e3-etats-donnees — les contrôles d'états de la maquette après le changement de données (règle n° 1)

Agent : auteur (Sonnet). Ce contrôle garde **ses choix** : tu ne l'affaiblis pas. Tu sépares ce qui a changé parce que les
données ont changé (mots, nombres, noms) de ce qui aurait changé dans le dessin.

## Le constat
`controle-etats.mjs`, sur la maquette reconstruite (`node prototypes/houblons-v4/parcours/outils/construire.mjs`), donne
**ETATS ECHEC (29/139)**. La liste est identique sur HEAD et après la voie a2 : la cause n'est pas l'interface.
- Les données ont changé : descripteurs de 12 sources (d4, D83) et moteur v2 de Substituer (e2, D86).
- Il y a 15 états de Substituer, avec des mots comme « Magnat et Yeoman, 99 sans inconnue ».
- Il y a des mots de données comme « Motueka + Citra cryo ».
- Certains états de Dryhopper sont déjà rouges sur HEAD : « actif · 2 j », « 98 mots au premier écran pour 96 ».

Voir `voies/a2-demande-reelle/RESULTAT.md`, Critères.

## À faire
1. Lis le contrôle (`work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs`), les fichiers d'états
   (`work/refonte-frontend/v4/choix/etats/*.json`) et le registre de ses choix (`work/refonte-frontend/v4/choix/ecrans.json`).
2. Pour chacun des 29 états en échec, classe-le en écrivant la preuve :
   - **donnée** : seuls des mots, des nombres ou des noms venus des données diffèrent. Les blocs, leur ordre et leurs éléments sont
     les mêmes : capture de l'état, avant et après, regardée côte à côte. La valeur attendue se met à jour avec la nouvelle, et la
     raison s'écrit dans le fichier d'états (`note` : « D83/D86, 26.10 : données changées, dessin identique »).
   - **dessin** : un bloc manque, a bougé ou a changé de forme. Ne mets rien à jour, signale-le ; c'est une régression à corriger.
   - **compte de mots** (« 98 pour 96 ») : un plafond de mots au premier écran qui dépend des noms. Dis si la hausse vient de noms
     plus longs (donnée) ou d'un texte ajouté (dessin).
3. Rejoue `controle-etats.mjs` : `ETATS OK (139/139)`, ou le nombre restant, chacun expliqué.

## Critères
- ETATS OK, ou chaque état restant classé « dessin », avec sa capture.
- Aucun état mis à jour sans sa capture avant et après regardée, et sa note.
- `controle-radar-base.mjs` et `controle-fonctions-rail.mjs` tiennent sur la même maquette.

## Possède
- `work/refonte-frontend/v4/choix/etats/*.json` (les valeurs attendues et leurs notes).
- `work/missions/2026-10-25-integration-houblons/voies/e3-etats-donnees/`.

Rien dans `src/`, rien dans `controle-etats.mjs` sans raison écrite. N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`.

Écris RESULTAT.md tôt. Retour en une ligne.
