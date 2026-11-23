# Workflow durable des agents — validation

Mission du 24 septembre 2026, branche `codex/yeast-refactor-preparation`, référence `f06d07735df1a0c6987bee41759f8155ef2cbc37`. Critères fixés avant les autres éditions. Aucun code applicatif, commit, push, appel Claude, recherche web ou diagnostic avec génération de modèle.

## Critères avant édition

| Critère | Preuve attendue |
| --- | --- |
| Entrée et reprise | `AGENTS.md` reste automatique ; le prompt exact pointe `docs/prompts/refonte-levure.md`. L'état vivant reste dans le registre de cette mission. |
| Avis et délégation | Deux angles Astra pour une refonte à risque, consultations supplémentaires motivées, Sol responsable ; Luna bornée avec fichiers attribués. |
| Outils et preuves | Outils adaptés aux faits ; chaque jalon distingue contrôles exécutables, revue humaine, faits prouvés et points ouverts. |
| Profils | Seules les instructions courtes changent ; modèle, effort, fenêtre, délégation et permissions restent identiques. Les deux copies globales égalent les gabarits après sauvegarde hors dépôt. |
| Périmètre | Seuls les fichiers attribués changent ; aucun code applicatif ni archive réécrite. |

## Responsabilités et contrôles prévus

Sol possède `AGENTS.md`, `docs/openai-setup.md`, `docs/prompts/refonte-levure.md`, les deux profils dans `.codex/profiles/`, `.codex/agents/sol.toml` et ce registre. Une revue Luna, si utile, est limitée à ces fichiers, en lecture seule. Vérifier le diff, la cohérence TOML, l'égalité des copies installées et `git diff --check`. Relire les consignes pour vérifier que le démarrage et la reprise sont actionnables sans créer de procédure globale.

## Résultats, limites et preuves

- `docs/openai-setup.md` contient le prompt exact pour la session suivant la PR14 ; `AGENTS.md` reste l'entrée automatique et la mission Levure garde son propre registre de reprise.
- Revue Luna `durable_doc_review` en lecture seule : couverture des exigences confirmée ; deux retouches de formulation intégrées. Aucun autre écart signalé. Aucun avis Astra demandé : cette édition n'a pas d'arbitrage structurant ouvert.
- Contrôles exécutables : réglages hors `developer_instructions` identiques à `HEAD` dans les trois TOML ; délimiteurs multilignes contrôlés ; `git diff --check` réussi ; sept fichiers modifiés ou ajoutés, tous attribués. Le registre n'a pas d'espaces de fin de ligne.
- Profils globaux sauvegardés dans `C:/Users/mrspa/AppData/Local/Temp/laffinee-yeast-prep-20260924/profile-backup-20260924-200304-924/`, puis copies `sol-full` et `astra-review` identiques octet pour octet aux gabarits (SHA256 vérifiés). Journal du diff : `C:/Users/mrspa/AppData/Local/Temp/laffinee-yeast-prep-20260924/git-diff-check.txt`.
- Relecture par les agents : les deux avis Astra visent des angles distincts, Luna a un périmètre, l'état de reprise sert aux jalons et le prompt de démarrage suffit à pointer la mission. Aucun test applicatif, build ou navigateur : aucun écran ni code applicatif changé. Aucune validation humaine n'est revendiquée.

Ces contrôles ne prouvent ni le comportement d'une future session ni un gain de quota. La validité métier et l'UX de la refonte Levure restent à démontrer pendant cette mission future.

## Suite liée — critères avant édition (HEAD `8555744`)

| Critère | Contrôle prévu |
| --- | --- |
| Expert et livrables | Astra consultable hors refonte selon l'enjeu, avec enquête ciblée en lecture seule et avis concret ; Luna peut posséder un livrable borné, avec preuve et revue réellement indépendante. |
| Recherche | Choix des outils selon la question ; distinguer enquête approfondie web + agents du produit Deep Research et dater sources, inconnues et décision. |
| Goal | Deux prompts futurs valides ; `/goal` proposé pour Levure, jamais créé sans demande explicite, sans promesse de qualité ou de quota. |
| Configuration et périmètre | Modèles, efforts, fenêtres, permissions et Claude inchangés ; sauvegarde hors dépôt, copies des deux profils, contrôle du diff et des réglages ; aucun code, commit ou push. |

Sol possède les six fichiers déjà attribués et ce registre. Une seule revue Luna en lecture seule vérifiera les ambiguïtés de consignes si elle apporte une preuve utile. Contrôles prévus : comparaison des clés TOML hors instructions avec `HEAD`, égalité des profils installés, `git diff --check`, portée des fichiers et relecture des deux prompts. Aucun diagnostic avec génération de modèle ni recherche web répétée.

**Résultats de cette suite :**

- `AGENTS.md`, la mission Levure et les trois instructions TOML donnent à Astra un rôle transversal avec enquête ciblée ; Luna peut tenir un livrable autonome borné. Les deux prompts futurs restent dans `docs/openai-setup.md` ; aucun goal n'a été créé.
- Revue Luna `expert_workflow_review` en lecture seule : seul écart utile, le motif « besoin de recul » absent du profil Sol ; corrigé avec renvoi explicite à `AGENTS.md`. Aucune revue par l'auteur n'est présentée comme indépendante.
- Inventaire `ALL_TOOLS` de cette tâche : `web__run` présent, aucun outil Deep Research dédié. Les capacités du produit et du mode Goal sont rapportées d'après les deux documents officiels cités dans `docs/openai-setup.md`, transmis comme déjà vérifiés ; aucune recherche web répétée ni essai de disponibilité dans un sous-agent.
- Réglages TOML hors `developer_instructions` identiques à `HEAD` dans les trois fichiers ; délimiteurs multilignes contrôlés. Les profils globaux `sol-full` et `astra-review` ont été sauvegardés dans `C:/Users/mrspa/AppData/Local/Temp/laffinee-yeast-prep-20260924/expert-profile-backup-20260924-201510-021/`, puis installés avec SHA256 identiques aux gabarits.
- `git diff --check`, portée des sept fichiers et présence des deux prompts contrôlés. Aucun test applicatif, build ou navigateur : cette suite ne touche pas l'application. Aucun diagnostic de profil avec génération de modèle, appel Claude, commit ou push.

Ces preuves portent sur les fichiers et copies de cette session. Elles ne garantissent ni l'accès futur à Deep Research, ni la qualité d'une exécution Goal, ni une économie de quota.
