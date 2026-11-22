**EN LIGNE 16.11 nuit : en-ligne/2026-11-16-transversaux (dad1df1b). Voir MISSION.md § Signature.**

# État de reprise — écrans transversaux (15.11, soir)

- Objectif : porter 1:1 ses choix (d3p2 ; m3 avec la période en plage « du … au » de Finances, une seule source ; b1s-a « Deux étages » : + toujours
  flottant, commun toujours là, écran en tête ; r3p2 recherche), tester, déployer, jouer en ligne. Mots : SPEC-BRASSEUR (14.11 et 15.11), MISSION.md
  § « Contrat réécrit — 15.11 ».
- Code : worktree `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, branche `claude/ecrans-transversaux` (base `en-ligne/2026-11-14-atelier-uv4`),
  tout commité (ports reglages, feuilles, b1→b1s-a, m3+plage, r3, intégration, 10 correctifs du test d'écran, KegBoard 44e1fcc0). tsc 0, build vert.
  Rouges de la suite antérieurs au port : designTokens, virgule-transversale, expenseSheet, recipeAiWorkflow, recipeEditing, yeastPitchingExecution.
- Test d'écran Opus (voies/voie-critique/TEST-ECRAN.md) : 10 problèmes, tous corrigés (voies/port-integration/RESULTAT.md, captures correctifs/),
  vus par le pilote. Reste non bloquant : à 390 le + flottant couvre la fin des lignes basses de Plus (« Drive à c… ») ; « Nouveau brassin sera LOT-001 »
  à côté de B-031 (numérotation de la fixture ?).
- 15.11 tard : le brasseur choisit b1s-b « La pile au pouce » (« Ça j'aime énormément, à améliorer et implémenter ») : le + porté (b1s-a) est à refaire en b1s-b AVANT tout déploiement ; la voie de déploiement a reçu l'ordre de s'arrêter avant firebase deploy.
- EN COURS : voie `voies/deploiement/` (auteur Sonnet, lancé 15.11) : copie `C:/Users/mrspa/AppData/Local/Temp/deploy-transversaux` sur
  `en-ligne/2026-11-15-finances` (contient futs et atelier-kckd), cherry-pick des commits, contrôles, `firebase deploy --only hosting`, tag
  `en-ligne/2026-11-15-transversaux`. Son état : `voies/deploiement/RESULTAT.md` (1re ligne OK / ECHEC / REPRISE).
- Après : vérifier la page servie (pilote, Chrome) ; jeu en ligne de chaque entrée (en-tête, Plus, période dans Plus puis Finances/Brassins/Bord,
  recherche, + sur chaque onglet, Réglages 4 onglets, Journal, Connexions, Saisir au nom, Conversations, caisse v3a intacte) sur données « ZZ TEST »
  retirées ensuite ; signature de MISSION.md (systeme.mjs voies), leçon ci-dessous, commit par chemins ; récapitulatif ≤ 400 car.
- Décisions du pilote : vente d3p2 non portée (caisse v3a, choix déployé d'une autre mission) ; dates libres arrondies aux mois dans Finances, dit à l'écran ;
  « Ajouter aux courses » → « Courses » (il n'ajoute rien).
- Leçon à écrire à la signature (LECONS au plafond : fusionner dans L17) : l'inventaire et la base d'un port se prennent sur le dernier tag déployé,
  pas sur la branche (la vente de d3p2 était dessinée sur un écran déjà remplacé par la caisse v3a).
- Pages : 64BnDUYmehXQUv2kTJRUAu (14.11), H9K7tsC6CKoQHQNZW9pL6P (période et +), E3MHXvErduH8FKH2NtzBpf (+ flottant).
