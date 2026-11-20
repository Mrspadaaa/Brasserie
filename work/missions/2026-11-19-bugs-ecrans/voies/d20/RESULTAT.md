# Voie d20 — décisions du brasseur du 20.11
- TE-27 | corrigé | f1543b51e | l'atelier V5.5 (dépliant « Atelier houblons avancé » et montage de HopV55RecipeStep) n'est plus dans l'étape Houblons de BrewWizard.tsx ; `lazy` et import `ChevronDown` retirés ; module `src/ui/hopV55/` et données intacts. Les lignes de houblon, l'écran v4 et « Ajouter un houblon · lots, COA et conditions de contact » restent.
- BT-2 | corrigé | 920773e97 | décision du coordinateur (SPEC l. 2330 : « tu peux le supprimer ») : le Planning (GanttTask) quitte le code (type, prop `planning` de DashboardTab, état `planning`/`setPlanning` de App.tsx, `getPlanning`/`savePlanning`/`updatePlanningTask`/`deletePlanningTask` de storage.ts, migration locale `laffinee_planning`, `initialPlanning` de seedData.example.ts) et l'affichage de cb027d551 (revert exact). Une collection `planning` déjà stockée n'est plus lue : elle reste intacte et se charge sans erreur (test dans storage.test.ts). Premier verdict « écarté » remplacé par « corrigé ». (BT-2 avait été une première fois « écarté — retrait de l'affichage » ; l'ordre du coordinateur l'a remplacé.)

## Tests
- Écrits avant, vus échouer : `tests/unit/bugs-d20-te27.test.tsx` (dépliant encore là), `tests/unit/bugs-d20-bt2.test.tsx` (3 échecs : prop exigée, tâche affichée, sources).
- `npx vitest run` des tests touchés + tests/integration/brewWizard* + hopV55WizardCorrectionRelations + tests/unit/hopIndexV4 + dataEntry, recapM2, monkey, noloRecipeSolver, storage, dashboard, AppQuickActionReturn, fix114, bugs-s2-AM-56, bugs-w1-wizard → 130 fichiers passés, 2 ignorés ; 3 échecs hors voie : (a) `brewWizardFirstSaveSourceContract` ×2 (étape Levure : bouton « Associer l'article… » introuvable, aucun lien avec Houblons) ; (b) `monkey` « atelier de l'eau » graine 7, flaky sous charge, repassé seul : 6/6 verts. `fix114` (« Facture : une seule fois dans le menu », Finances) échoue aussi, hors voie (zone Finances).
- `npx tsc --noEmit` : aucune erreur.

## Tests adaptés (TE-27)
- `bugs-w1-wizard.test.tsx` : bloc « TE-27 » (dépliant fermé) retiré, remplacé par bugs-d20-te27.
- `hopIndexV4/etapeHoublons.test.tsx` (T12) : la ligne `toMatch(/<HopV55RecipeStep />)` devient `not.toMatch`.
- `it.skip` (jouaient l'atelier à travers BrewWizard ; note en tête de fichier) : `brewWizardColdContactEvidenceNative` (1), `brewWizardColdContactEvidencePersistence` (3), `brewWizardDeclaredSnapshotJson` (5), `brewWizardHopV55` (5).
- BT-2 : `bugs-s2-BT-2.test.tsx` supprimé (affirmait l'affichage), `planning={[]}` / `getPlanning` retirés de dashboard, bugs-s2-AM-56, AppQuickActionReturn, fix114 ; bloc « Planning » de storage.test.ts remplacé par « ancienne collection ignorée ».

## Captures (voies/d20/captures/, toutes ouvertes)
`d20-te27-houblons-{390,1280}-{clair,cave}` (+ `-bas` à 390) : étape Houblons 3/7 : bandeau, « Amertume et répartition », « Mes ajouts de houblons · 1 » (Nugget), « Ajouter un houblon · lots et conditions de contact » replié, Retour / Suivant — Levure ; aucun atelier ni dépliant. Un premier 390 clair montrait « Ouverture de la page… » (chargement) : refait avec attente, ouvert.
`d20-bt2-bord-{390,1280}-{clair,cave}` (+ `-bas`) : Bord ; Agenda = « Cette semaine au calendrier », puis l'événement « Marché d'Automne… » (Calendrier) ; aucune tâche de Planning.
Script : `capturer.mjs` (port 3107, `?dev-local`).

## Doutes
- Non touché volontairement : `functions/src/dataSchema.ts` garde `planning` dans les collections (le dépôt client s'en sert pour charger/sauvegarder ; l'enlever changerait la sauvegarde serveur et les règles), `functions/src/brewerAppContext.ts`, `migration` de données réelles. À retirer en ligne à part (décision du coordinateur).
- `applyHopV55Change` et `conserveHopV55ColdEvidence` restent dans BrewWizard.tsx, sans appelant (réversible si l'atelier revient). `noUnusedLocals` est faux : tsc passe.
- `src/data/seedData.ts` (non suivi par git) nettoyé localement aussi.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
