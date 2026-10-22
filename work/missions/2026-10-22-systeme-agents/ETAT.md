# État de reprise : système d'agents (session de supervision, 22.10 au soir)

À lire en premier après une compaction ou dans une nouvelle session. Le système est décrit dans
`docs/agents/systeme.md` ; les critères de montage (11/11 tenus) sont dans `GATES.md`.

## Ce qui est en place (commits locaux, rien n'est poussé)
- c768f2c, 1e7525c : cerveau/ (INDEX et LECONS importés par CLAUDE.md), hook `.claude/hooks/cerveau.mjs`,
  skills `voies` et `conseil`, agents executant, auteur, relecteur et conseiller, `scripts/agents/systeme.mjs`,
  export NotebookLM.
- 8f1f8f1 : L24, un choix du brasseur se montre en variantes et ne bloque pas le lot (contrôlé par `mission`).
- 6f1a964 : L25, agent `concepteur` (Opus) pour tout ce que le brasseur voit, agent `critique` (Fable) ;
  `mission` refuse une voie d'interface hors Opus ou Fable.
- 7803060, f8db284 : conseil en trois niveaux (avis croisé à 2 appels, rapide à 7, complet à 10), dossier
  de conseil unique, moments où il intervient (doc § « Quand le conseil intervient »).
- 5895412 : M12, une variante rejetée doit être relancée ou porter « <id> écartée : » ou « <id> choisie : »
  dans MISSION.md, et des écrans ne sont finis qu'une fois publiés. L27 : critique non étalonné, donc
  indicatif.
- 5c15433 : `scripts/agents/verifier-page.mjs` (Chrome à 390 px) avant toute publication de page.
- e9b78bd : retour du brasseur sur le lot 22 (SPEC, D101 ter, D104), vague 3 bis planifiée, source de
  la page dans `work/refonte-frontend/v4/outils/page-lot/` (voir PUBLIER.md).
- 6eb92d5 et 2e51591 : M13, l'entonnoir du lot 21.
  - Méthode : `.claude/skills/voies/references/entonnoir.md`, avec des séries v0 de 3 à 8 variantes et 30
    variantes au moins, un tri par le critique (sans rejet), une passe 2 par les mêmes agents, puis tout est montré.
  - `systeme.mjs mission` exige la colonne Étape et les deux contrepoids : une série Fable et une série au
    brief minimal.
  - Origine, mot pour mot : « la manière de faire […] avec les 44 variante puis les 5 meilleures était
    vraiment plus qualitatif ».
  - L'autre session a refait r4d (4 séries de 8) et r7 (lot 23, 6 séries et plus) en entonnoir.
- f924eee : élagage.
  - `systeme.mjs remplaces` (registre `cerveau/REMPLACES.md`) et `systeme.mjs charge` (30 000 caractères au
    plus pour ce qui est chargé partout).
  - LECONS est limité à 8 lignes mécanisées.
  - Cinq contre-indications ont été corrigées, et l'index de la mémoire locale est réduit à un renvoi.

## Page de lot en vigueur
https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv, « Lot 22 houblons », version 2. Les anciennes pages
(`2VTRQP7nLXhX5GqDaAGAyU`, `MoohEoyj…`) sont inaccessibles depuis ce compte.

## En cours ailleurs
La session « En attente » (local_6a42bfeb-1927-4a94-959c-c50362db1c88) exécute la vague 3 bis de
`work/missions/2026-10-22-reprise-lot21/MISSION.md` :
- r0c, inventaire et contrôles ;
- r6n1 et r6n2, reprise de r6a avec les éléments notés ;
- r4d, au moins 8 vraies propositions « épicé », sans piment ;
- critique sans tri, puis publication de la version 3.
Ne pas écrire dans ses fichiers pendant qu'elle tourne. Commiter seulement ses propres chemins
(`git commit -- <chemins>`).

## Ouvert, par priorité
0. **Élaguer les gros documents**, après la vague 3 bis : la session « En attente » s'en sert. Ils sont
   lus en entier et pèsent environ 60 000 jetons.
   - SPEC : un § 0 « Ce qui vaut aujourd'hui », de 40 lignes au plus ; les verdicts remplacés y sont marqués.
   - DEFAUTS (16 000 jetons) : une ligne par défaut, et l'histoire dans DEFAUTS-HISTOIRE.md.
   - Le registre (29 000 jetons) : l'état en cours seulement, le reste archivé par mois.
   - decisions.md.
   Chaque réduction est vérifiée par `systeme.mjs fidelite`, et les briefs des critiques pointent les
   versions courtes.
1. **Étalonnage du critique (L27)**, mission à créer :
   - jeu « capture et verdict mot pour mot » tiré de SPEC-BRASSEUR (y1b préférée, d1 « bordélique »,
     l8 « horrible mais la disposition », r4 « Aucun me convient », r4c « quasiment identique »,
     r6a « le meilleur »…) ;
   - épreuve à l'aveugle du critique Fable, avec un score d'accord et un seuil ;
   - commande `systeme.mjs etalonnage` ;
   - jeu nourri à chaque retour, et même étalonnage pour le regard Brasseur du conseil.
   Tant que ce n'est pas fait, le critique signale sans trier.
2. **Question laissée à l'utilisateur** : « qu'est-ce qui manque encore pour que le système colle à ce
   que tu veux ? ». Il a seulement répondu par des retours sur le lot 22. Ses attentes connues : voir
   les maquettes à chaque lot sans rien demander ; refaire automatiquement ce qui est mauvais ; un juge
   qui lui ressemble ; un coût raisonnable.
3. **Supervision** de la vague 3 bis, si l'utilisateur la demande (cron arrêté le 22.10).
4. **Accords en attente de l'utilisateur** :
   - push de la branche et PR ;
   - archivage du pont Sol caduc (skill sol-orchestrator, `.claude/roles/expert.md`,
     `scripts/claude-expert.mjs`, `docs/claude-expert.md`) ;
   - `pistes-l5f.png` à la racine.
5. **Export NotebookLM** : `node scripts/agents/systeme.mjs exporter --avec-spec --vers "C:/Users/mrspa/Documents/Nouveau dossier/cerveau-affinee-avec-paroles-du-brasseur.md"`,
   déposé à la main par l'utilisateur (pas d'API grand public).

## Pièges vus aujourd'hui
- Un sous-agent d'une session ouverte avant une modification de CLAUDE.md ne voit pas le nouveau
  contenu. Les types d'agents apparaissent en cours de session après un délai.
- Bash mange les barres obliques inverses dans les heredocs : écrire les scripts avec Write.
- `git commit -- <chemin>` refuse un fichier jamais suivi : faire d'abord `git add` de ce fichier.
- Le rejeu `systeme.mjs voies` réécrit les preuves d'un critère dont la sortie varie (durées de r2) :
  annuler ce changement s'il ne vient que du rejeu.
