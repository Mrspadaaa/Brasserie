---
name: voies
description: Découper une mission de L'Affinée en voies parallèles. Opus planifie une fois, Haiku exécute le mécanique, Sonnet le jugement ; chaque voie se contrôle, réessaie dans sa voie et rend une ligne ; le pilote rejoue les critères puis signe. À utiliser pour tout travail de plusieurs parties indépendantes (lot de maquettes, étude, chantier de code), ou quand l'utilisateur dit « en voies », « lance les agents », « répartis ».
---

# Voies — séparer les tâches, décider, corriger

Référence complète : `docs/agents/systeme.md`. Ce skill est la marche à suivre du pilote.

## 1. Planifier une fois (pilote, Opus)
1. Relire la demande, les leçons (déjà en contexte) et chercher dans le cerveau :
   `node scripts/agents/systeme.mjs chercher <mots>`.
2. Créer `work/missions/<AAAA-MM-JJ>-<sujet>/MISSION.md` depuis `gabarits/MISSION.md`. Une voie par
   livrable qui se vérifie seul. Les périmètres d'écriture (« Possède ») sont disjoints.
3. Choisir le niveau de chaque voie :
   - **mécanique → `executant` (Haiku)** : lire, extraire, convertir au gabarit, lancer contrôles,
     tests, captures, régénérer ;
   - **interface → `concepteur` (Opus)** : tout ce que le brasseur verra (maquette, variante,
     fil de fer, picto, carte), montré dans une vraie carte de la base (L25) ;
   - **jugement → `auteur` (Sonnet)** : diagnostiquer, écrire une analyse, des contrôles, du code
     avec un choix ;
   - **conception d'architecture → `auteur` avec le modèle `opus`** : quand la voie fixe une
     direction que les autres suivront ;
   - **critique d'interface → `critique` (Fable, calibré sur PORTRAIT.md)** : obligatoire après
     toute voie d'interface, avant de montrer quoi que ce soit au brasseur ;
   - **relecture hors interface → `relecteur` (Sonnet)**.
   `systeme.mjs mission` refuse une voie d'interface hors Opus ou Fable, et une relecture d'interface
   sans critique.
4. Router chaque décision connue d'avance avec la grille de `docs/agents/systeme.md` § Décider
   (voie, pilote, conseil, brasseur, utilisateur).
5. Vérifier les entrées partagées avant l'éventail (L08) : une voie Haiku « entrées » passe en
   premier quand moteur, JSON ou constantes sont en jeu.
6. Vérifier : `node scripts/agents/systeme.mjs mission work/missions/<id>/MISSION.md` → MISSION OK.

## 2. Écrire les contrats
Par voie, `voies/<id>/VOIE.md` (gabarit `gabarits/VOIE.md`) et `voies/<id>/GATES.md` (format unlazy,
gabarit `gabarits/GATES.md`). Chaque critère a une commande qui peut échouer ; une sortie décisive
(`… OK`) ; un témoin négatif quand le contrôle est nouveau (L13). Passer chaque chemin cité par Glob
(L09). Recopier dans VOIE.md les exigences transversales et les acquis concernés (L05, L06).
Contrôler le format : `node .claude/skills/unlazy/scripts/gate-lint.mjs voies/<id>/GATES.md` → LINT OK.
L'approbation des commandes (écrites par le pilote lui-même) se fait au premier
`systeme.mjs voies … --approuver`.

## 3. Lancer l'essaim
- Toutes les voies prêtes partent dans **un seul message**, en arrière-plan :
  `Agent(subagent_type: "executant" | "auteur" | "relecteur", run_in_background: true,
  prompt: "Voie <id> de la mission <id> : lis work/missions/<id>/voies/<id>/VOIE.md et exécute-la.")`.
  Le prompt ne recopie pas le contrat : il pointe le fichier.
- Si le type d'agent n'est pas encore chargé (session ouverte avant sa création), utiliser
  `general-purpose` avec `model` = le modèle de la voie et ajouter au prompt :
  « Suis .claude/agents/<agent>.md comme tes instructions. »
- Plafonds : chaque agent a un `maxTurns`. Une voie bloquée s'arrête seule et revient en ECHEC ; elle
  ne mange pas le budget des autres. Budget de mission : noter dans MISSION.md l'usage avant et après
  (`get_usage`) ; s'arrêter vers 95 % de la fenêtre de 5 h.
- Pendant l'essaim, le pilote ne lit pas les sorties brutes : il attend les notifications.

## 4. Vérifier (pilote)
À chaque retour, une ligne arrive. Puis :
`node scripts/agents/systeme.mjs voies work/missions/<id> --approuver` (première fois), ensuite sans
`--approuver`. Le script rejoue les critères de chaque voie et ne croit pas son rapport (L16). Puis :
`git status --short` contre les « Possède » (L17). Pour une interface, la voie `relecteur` a dit OK.

## 5. Corriger : trois boucles
1. **Courte, dans la voie** : critère en échec → l'agent corrige et relance, 3 essais au plus.
2. **Moyenne, pilote** : rejeu en échec ou relecteur qui rejette → `SendMessage` au même agent
   avec le défaut précis (2 relances au plus). Au-delà, le contrat est en cause : le pilote le
   réécrit, ou soumet la question au conseil (skill `conseil`), ou la pose au brasseur.
3. **Longue, brasseur** : sa plainte → SPEC-BRASSEUR (mot pour mot) → DEFAUTS-RECURRENTS (contrôle
   qui échoue sur la version rejetée) → ce contrôle entre dans les GATES des voies suivantes. Une
   erreur de méthode → leçon (`cerveau/LECONS.md`). Un savoir durable → note du cerveau.
Les lignes `LEÇON PROPOSÉE` et `CONNAISSANCE` des RESULTAT.md sont traitées par le pilote à la
signature, jamais laissées en plan.

## 6. Signer
Dans MISSION.md, section « Signature » : la sortie de `systeme.mjs voies` (une ligne par voie),
les décisions prises et leur décideur, les leçons et notes ajoutées, ce qui reste ouvert. Commit
local. Push, PR, déploiement, données réelles, Gemini facturé, suppressions : groupés pour
l'utilisateur, sans bloquer le reste.
