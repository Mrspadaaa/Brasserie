# Tests d'intégration adaptés à d1b (feuille « Brasser ») et c2a (« Créer »)

Règle : l'intention du test reste, la maquette gagne. La feuille n'a plus de liste de recettes, de curseur de volume, de « À définir / Aujourd'hui / Autre date » ni de « Créer le brassin à brasser » : on touche un jour du damier (3 semaines, `aria-label` « samedi 26 septembre… »), puis « Planifier sam. 26.09 ». La recette se choisit dans la liste c2a (« Brasser ») ou arrive par `initialRecipeId`.

Résultat : 18 tests, 18 adaptés, 0 supprimé. Rejeu des 5 fichiers : tous verts (batchScheduling 10, brewCreationBudgetContinuity 3, brewLegacyInstallationApp 4, brewLegacyInstallationLaunch 6, bStockMaterielActuelModal 1). `src/` non touché.

## batchScheduling.test.tsx (7 échecs → 7 adaptés)
| Test | Verdict | Adaptation |
|---|---|---|
| keeps a scheduled legacy recipe uncreated until its installation is explicitly adopted | adapté | liste c2a → « Brasser » → jour du jour → « Planifier dim. 20.09 » ; même refus d'adoption, rien créé |
| defaults to no date, confirms one frozen batch… | adapté (renommé « creates nothing before « Planifier »… ») | « À définir » n'existe plus (NOTE d1b : « Plus tard remplacé ») : on vérifie que rien n'est créé avant « Planifier », puis un brassin figé au jour touché (27.09.2026), `brewDate` vide, recette inchangée |
| requires an explicit valid day, then stores that plan without an actual date | adapté | « jour valide » = les jours passés sont inertes (désactivés), « Semaines d'après » ×3 atteint le 24.10, « Dans 34 jours » dit, `plannedBrewDate` 24.10.2026, `brewDate` vide |
| today is also an intention until the brewer starts | adapté | on touche « dimanche 20 septembre » (aujourd'hui) |
| keeps a failed acknowledgement reviewable and retries without a duplicate | adapté | plus de bouton « Confirmer l'enregistrement » : le même « Planifier » rejoue la confirmation, un seul brassin. Le test ne dit plus « sélecteur de recette désactivé » (il n'existe plus). Voir BUG 1 |
| allows correction after a confirmed rejected creation | adapté | après le refus confirmé, un jour est de nouveau touchable ; autre jour, nouveau « Planifier » |
| locks double clicks and closing while the exact batch awaits confirmation | adapté | double clic sur « Planifier » = 1 brassin ; « Fermer » et les jours du damier désactivés pendant l'attente |

## brewCreationBudgetContinuity.test.tsx (2 → 2 adaptés)
| Test | Verdict | Adaptation |
|---|---|---|
| creates the full scaled snapshot… while reserving stock | adapté | le curseur (×2 = 50 L) est retiré (d1b brasse le volume de la recette, ACCORD 2 de RESULTAT.md). Mêmes assertions (identité source, métadonnées, plan d'eau, malts, houblon, adjuvant, `brewBudgetDemands`, stock non touché, recette inchangée) à 25 L, valeurs mesurées sur le rendu ; `plannedBrewDate` vérifié par motif `JJ.MM.AAAA` (le jour proposé suit l'horloge). Le doublement reste couvert par le 3e test du fichier (calculateur) |
| requires explicit installation adoption for an old recipe, including the unchanged volume | adapté | seul le volume inchangé existe : refus « Modifier la recette ». La branche « Réglages → Brasserie » (volume changé à 50 L sans installation) ne s'atteint plus par l'UI : non testée ici |

## brewLegacyInstallationApp.test.tsx (2 → 2 adaptés)
| Test | Verdict | Adaptation |
|---|---|---|
| ne crée aucun brassin depuis le planificateur avant adoption (×2 profils) | adapté | « Lancer depuis la recette » ouvre la feuille d1b ; « Planifier » remplace « Créer le brassin à brasser ». Le 2e test du fichier (assistant) vérifie que « Planifier » n'apparaît pas |

## brewLegacyInstallationLaunch.test.tsx (6 → 6 adaptés)
| Test | Verdict | Adaptation |
|---|---|---|
| refuse la source legacy… (4 cas) | adapté | le volume visé (30 / 24 L) devient celui de la recette (`legacyRecipe(withProfile, targetL)`) ; liste → « Brasser » → « Planifier » ; mêmes refus, rien écrit |
| adopte le matériel en conservant les 19 / 26 L choisis (2 cas) | adapté | fin du test : horloge fixée au 20.09.2026, « Brasser », jour « samedi 26 septembre », « Planifier sam. 26.09 » ; brassin à 19 / 26 L, `plannedBrewDate` 26.09.2026 |

## bStockMaterielActuelModal.test.tsx (1 → 1 adapté)
| Test | Verdict | Adaptation |
|---|---|---|
| avertit, propose d'adapter, ne change pas le volume seul et ne bloque pas le bouton | adapté | le volume (60 L) se lit dans la ligne d'en-tête de la feuille (« 60 L · … ») au lieu du curseur ; l'avertissement, « Adapter à N L » (le volume passe sous 30 L) et le bouton non bloqué (« Planifier ») sont gardés |

## BUG réel du port
1. BUG : `src/components/QuickActionModal.tsx`, test `batchScheduling > keeps a failed acknowledgement reviewable…`, attendu : après une confirmation non reçue, le formulaire reste figé (avant : `fieldset disabled` tant que `pendingBatch` existe, sélecteur de recette désactivé, bouton « Confirmer l'enregistrement »), obtenu : la feuille d1b n'est désactivée que pendant `brewSaving` ; après l'erreur, les jours du damier sont de nouveau touchables alors que `pendingBatch.current` garde la date du premier choix. Toucher un autre jour puis « Planifier » rejoue la confirmation du brassin écrit avec l'ANCIENNE date, sans le dire. À corriger : désactiver les jours (ou verrouiller le choix) tant que `pendingBatch.current` existe, et libeller le bouton « Confirmer l'enregistrement ». Le test ne l'exige pas encore.
2. Remarque (pas un bug prouvé) : le jour proposé par défaut dépend de l'horloge réelle dans les tests sans horloge fixée (brewCreationBudgetContinuity, brewLegacyInstallationApp) ; ils n'asserent que la forme `JJ.MM.AAAA`.
