# REPRISE — PERIODE-PARTOUT (21.11)

Défaut : `Brasserie/work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (ligne PERIODE-PARTOUT), capture `work/missions/2026-11-21-calendrier-entete/capture-22.jpg`.
Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711`. HEAD = `en-ligne/2026-11-21-tour8` (5fb61c580).
Interface du composant partagé : `FRISE-PARTAGEE.md` (même dossier). Ne pas toucher `src/ui/calendrier/**` (autre voie).

## TERMINÉ (21.11, reprise 2)

Commits sur `claude/port-carnet-1711` : e392a6cd2 (Synthèse + FrisePeriode + `.ops.fp` une colonne dès 900 px), 4e8d59308 (Revoir le mois),
1d5fc8342 (filtres Brassins). `geste.mjs --endroits periode` : rouge sur `en-ligne/2026-11-21-tour8` (3 KO), vert sur l'arbre (390/1280, clair/cave).
Build `VITE_HOP_V4=on VITE_CARNET_IA=production` vert ; vitest ciblé 10 fichiers, 106/106. Captures : `periode/cap-arbre/`.
Ouverts : `PlageMois.tsx`, règles `.syn-plage`/`.lst-dates` et `FinancePeriod.tsx` sans usage, laissés (suppression avec accord) ;
état d'« Revoir le mois » local (non relu au rechargement) ; la frise des filtres Brassins dit « 0 opération » (opérations financières).

## Fait (historique, avant reprise 2)

- `src/components/periode/FrisePeriode.tsx` (neuf) : `FriseDePeriode` (frise d'Opérations sur une `Periode`, + champs date desktop) et `FrisePeriode` (cadre `.ops`, `useDonneesFrise`).
- `src/components/periode/ChoixPlage.tsx` : sa frise passe par `FriseDePeriode` (plus de copie).
- Synthèse : `src/ui/finance/synthese/Scene.tsx` (`Periode` prend `frise: ReactNode` et `libre`; « … » ouvre la frise ; plus de `PlageMois`),
  `src/ui/finance/FinanceOverview.tsx` (props `periode`, `onPeriode` ; `periodeFrise`, `choisirPeriode`, `libre`), `src/components/tabs/FinancesTab.tsx` (passe `periode={periodeApp} onPeriode={changerPeriode}`),
  `src/ui/finance/synthese.css` (`.syn .syn-frise { margin:10px -26px 4px; }`, à juger en vision ; les règles `.syn-plage` restent tant qu'Analyse s'en sert).
- Tests mis à jour : `tests/integration/synthesePeriode.test.tsx` (frise, pas de `type=month`, PageDown −7 j), `fx1`, `finTour2` (test PlageMois retiré), `synthesePlageVersOperations` (test « aucun champ mois »), `tests/unit/periode.test.ts` (ChoixPlage → FrisePeriode → Frise).
- Preuve : vitest de ces 9 fichiers + `*eriode*` : 99/99 verts ; `npx tsc --noEmit` vert.

## Inventaire (écrans qui choisissent une période)

| Écran | Fichier:ligne (HEAD) | Avant | Décision |
|---|---|---|---|
| Finances › Synthèse « … » | `src/ui/finance/synthese/Scene.tsx:38` | `PlageMois` (2 `input type=month`) | FAIT (non commité) : `FrisePeriode` |
| Synthèse › Revoir le mois (Analyse), mode « Du … au » (défaut !) | `src/ui/finance/analyse/Filtrer.tsx:97` | `ChampsPlage` = `PlageMois` | À FAIRE : `FrisePeriode` avec `periode=depuisPlageFinances(du,au)`, `onChoisir` → `moisCouverts(p)` → `onEtat({...etat, du, au, ancre:null})`, `jourMax` = fin du mois courant ; puis supprimer `src/ui/finance/PlageMois.tsx` et les règles `.syn-plage` (synthese.css 112-119, analyse.css 144). État local (pas relu au rechargement : à signaler). |
| Brassins › filtres, segment « dates » | `src/ui/production/liste/FeuilleFiltres.tsx:356-359` | 2 `input type=date` | À FAIRE : `FrisePeriode` sur la période de l'app (le texte dit « Même période que l'en-tête ») |
| Finances › Opérations | `src/ui/finance/operations/Bande.tsx:79` (+ champs date desktop :93) | frise (référence) | rien |
| Pastille de l'en-tête | `src/components/periode/PastillePeriode.tsx:52` → `ChoixPlage` | frise | rien (passe par FriseDePeriode) |
| Page Plus | `src/components/plus/PagePlus.tsx:125` → `ChoixPlage` | frise | rien |
| Bord | `src/components/tabs/DashboardTab.tsx:194,334` | lit la période de l'app (libellé seul) | rien : se choisit par la pastille |
| Prévisions | `src/ui/finance/previsions/Previsions.tsx:188` | horizon 30 j / 90 j / 12 mois (segment) | rien : horizon, pas de période libre |
| Annuel | `src/ui/finance/annuel/Tete.tsx:62` | année (exercice) et versions | rien : exercice, pas de période libre |
| Recettes (catalogue) | `src/ui/production/CatalogToolbar.tsx:427-460` | select toutes / période de l'app ; branche `custom` morte | rien (pas de mois ; branche morte signalée) |
| `src/ui/finance/FinancePeriod.tsx:30` | `type=month` | aucun importeur (code mort) | signaler, ne pas supprimer sans accord |
| Calendrier | `src/ui/calendrier/**` | autre voie | rien |

## Prochaine action (dans l'ordre)

1. `scripts/parcours/geste.mjs` : il porte des modifs non commitées d'une AUTRE voie (jouerCalendrier, hunk @@ -362). Avant d'éditer : copie du fichier courant vers os.tmpdir() ; ajouter un endroit `periode` (option `--endroits periode`), fonction `jouerPeriode` : fixture `fixtureCalendrier` (via `parcours-calendrier:fixture`, comme `jouerCalendrier`), aller Finances › Synthèse, toucher « Autre période », exiger `[data-frise-periode] [data-testid=frise]` et AUCUN `input[type=month]`/`select` dans `.syn` ; glisser la poignée « Début » vers la gauche (tactile CDP à 390, souris à 1280) ; lire `aria-valuetext` et le titre `h2` ; recharger, vérifier `localStorage` `app_global_time_filter` (via StorageService UiState) et le titre identique. Rouge sur `--ref en-ligne/2026-11-21-tour8`, vert sur l'arbre. Idem ensuite pour Analyse et Brassins filtres.
2. Vision : captures 390 tactile et 1280, clair et cave, frise ouverte, OUVRIR chaque capture, côte à côte avec capture-22 (le segment g3a reste, la frise remplace les deux listes). Ajuster `.syn-frise` si la frise déborde.
3. Build : `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build`.
4. Commit Synthèse par index temporaire (`GIT_INDEX_FILE=<tmp> git read-tree HEAD`, `git add` des seuls fichiers ci-dessus + FrisePeriode.tsx ; pour geste.mjs : `git diff` copie→nouveau = mon patch, `git apply --cached` sur l'index temporaire), message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais `source4-…json`, `git add -A`, stash, push.
5. Puis Analyse (un commit), puis Brassins filtres (un commit), chacun avec étape geste, vitest, vision.

Fichiers de travail à la racine de port-carnet (`*.cjs`, `1`) : pas à moi, ne pas toucher.
