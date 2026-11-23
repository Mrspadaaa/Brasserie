# Inventaire du nettoyage du dépôt (lecture seule, 23.11)

Worktree `openai-clean-start`, branche à jour de `main` (HEAD `eabc81dca` au départ). Rien n'est supprimé ni modifié : ce fichier est le seul livrable. Scripts de mesure dans le dossier temporaire de la session, non versionnés.

## Résumé

| Sujet | Chiffre |
|---|---|
| work/ à garder (cité) | **438,1 Mo, 6 851 fichiers** |
| work/ à archiver | **1 026,9 Mo, 14 458 fichiers** (sur 1 465,0 Mo, 21 309 suivis) |
| Code mort sûr | **18 fichiers (1 324 lignes)** ; 125 fichiers portent 173 exports inutilisés, 32 portent 73 types inutilisés |
| Code testé mais jamais atteint depuis `main.tsx` | 33 fichiers dont 13 faux positifs (domaine levure, chargé par `import.meta.glob`) : 20 vrais candidats, 2 216 lignes |
| vitest | 1 768 fichiers, 18 066 tests, **79 fichiers en échec** : 62 viennent de dépendances absentes (environnement), 17 sont de vrais échecs ; 20 min 00 s mur |
| Tri des tests (1 775 fichiers `*.test.*`) | GARDER 807 ; RETIRER 796 (121 666 lignes, ≈ 74 % du temps vitest cumulé) ; À TRANCHER 165 ; hors vitest 7 |
| tsc | **froid 64 s, à chaud 4 s** (incrémental) ; le coût est réparti, pas un fichier |
| Historique | 3 290 commits, pack 1,38 Gio ; arbre gardé en 1 commit : **317 Mio** (variante serrée : **105 Mio**) |

Alerte : `tsc` échoue déjà sur ce HEAD (`src/data/seedData.ts(9,3)` : `GanttTask` n'existe plus dans `../types`), donc `npm run build` (qui commence par `tsc`) échoue aussi. Même cause que le test `bugs-d20-bt2`. De plus `vite-plugin-pwa` et `cheerio` sont absents de `node_modules` de ce worktree.

## 1. work/ vivant ou mort

Méthode : tous les chemins `work/...` cités (texte brut ou `path.join('work', ...)`) dans 4 473 fichiers : tout le dépôt hors work/, dist, node_modules, output, public, prototypes, plus `work/refonte-frontend/{decisions,registre}.md`, `v4/choix/*`, `SPEC-BRASSEUR.md`, `DEFAUTS-RECURRENTS.md`, `BUGS.md` et les REPRISE/MISSION/VOIE/ETAT des missions 2026-11-2x. Un fichier est gardé si un chemin cité est lui-même ou son dossier parent, **sauf** s'il n'est cité que par le journal (decisions, registre, BUGS) : ce journal cite presque toute mission, donc une citation seule de sa part ne sauve rien (27,8 Mo concernés ; ils sont dans l'archive). Les citations dans le code ou les scripts sont comptées même si elles sont de simples commentaires.

Limite : la méthode est plutôt généreuse. Trois dossiers pèsent 277 Mo à eux seuls et ne sont gardés que parce qu'un script y écrit ou lit : `2026-10-31-ecran-depense/avant-deploiement` (137 Mo, défaut de `scripts/agents/controle-avant-deploiement.mjs`), `2026-10-25-integration-houblons/voies` (80 Mo, scripts `collecte-hop/` et `eval-hop/`), `2026-10-31-ecran-fermentescibles` (59 Mo, un commentaire dans `src/ui/fermentescibles/modele.ts`). Si ces scripts sont eux-mêmes anciens, la décision de garder ces dossiers est à reprendre : voir la variante serrée au §5.

### 1a. Dossiers à GARDER (au moins un fichier cité)

| Dossier | Gardé (Mo) | Fichiers gardés | Sur total (Mo / fichiers) | Cité par |
|---|---:|---:|---|---|
| work/missions/2026-10-31-ecran-depense | 148.4 | 1605 | 255.4 / 3377 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-10-25-integration-houblons | 80.5 | 1531 | 80.6 / 1547 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-10-31-ecran-fermentescibles | 58.9 | 715 | 58.9 / 715 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-17-carnet-retouches | 46.0 | 667 | 107.4 / 1104 | scripts/src/tests/.claude/docs ; choix/SPEC/DEFAUTS |
| work/refonte-frontend/v4 | 22.7 | 534 | 74.3 / 2187 | scripts/src/tests/.claude/docs ; REPRISE/MISSION 11-2x ; choix/SPEC/DEFAUTS ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-21-calendrier-entete | 20.1 | 38 | 20.1 / 38 | REPRISE/MISSION 11-2x ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-21-workflows-app | 15.4 | 387 | 15.4 / 387 | scripts/src/tests/.claude/docs ; REPRISE/MISSION 11-2x ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-21-calendrier-fiche | 10.6 | 86 | 10.6 / 86 | REPRISE/MISSION 11-2x ; choix/SPEC/DEFAUTS ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-21-chasse-carnet | 4.7 | 25 | 4.7 / 25 | REPRISE/MISSION 11-2x ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-16-calendrier | 4.3 | 37 | 262.3 / 1958 | choix/SPEC/DEFAUTS |
| work/missions/2026-11-14-gemini4 | 3.6 | 296 | 3.6 / 296 | scripts/src/tests/.claude/docs |
| work/missions/2026-11-20-calendrier-plainte | 2.8 | 10 | 2.8 / 10 | scripts/src/tests/.claude/docs ; choix/SPEC/DEFAUTS ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-19-ma-levure-maquettes | 2.5 | 10 | 42.6 / 411 | REPRISE/MISSION 11-2x ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-22-eau-sels | 2.0 | 12 | 2.0 / 12 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-10-23-maquette-parcours | 1.8 | 375 | 1.8 / 375 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-21-chasse-stock | 1.5 | 13 | 1.5 / 13 | decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-18-choix-calendrier | 1.5 | 7 | 17.5 / 188 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-10-31-ecran-identite | 1.4 | 22 | 21.3 / 506 | scripts/src/tests/.claude/docs ; choix/SPEC/DEFAUTS ; REPRISE/MISSION 11-2x |
| work/missions/2026-10-22-reprise-lot21 | 1.0 | 203 | 1.0 / 203 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-17-port-carnet | 1.0 | 89 | 1.0 / 89 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/BUGS.md | 1.0 | 1 | 1.0 / 1 | scripts/src/tests/.claude/docs ; REPRISE/MISSION 11-2x ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-21-stock-maquettes | 0.8 | 2 | 11.9 / 130 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-17-port-calendrier | 0.7 | 2 | 2.3 / 164 | decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-20-frise | 0.6 | 16 | 0.6 / 16 | scripts/src/tests/.claude/docs ; REPRISE/MISSION 11-2x ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-10-brassin-mesures | 0.5 | 1 | 3.0 / 38 | choix/SPEC/DEFAUTS |
| work/missions/2026-11-09-ecran-levure | 0.5 | 8 | 2.7 / 89 | scripts/src/tests/.claude/docs ; choix/SPEC/DEFAUTS |
| work/missions/2026-10-31-systeme-ecrans | 0.5 | 24 | 0.5 / 24 | scripts/src/tests/.claude/docs |
| work/missions/2026-11-01-banc-lecture | 0.5 | 34 | 0.5 / 34 | scripts/src/tests/.claude/docs ; choix/SPEC/DEFAUTS ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-22-saisie-main | 0.5 | 2 | 25.9 / 233 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-08-enrichissement | 0.3 | 39 | 0.3 / 39 | scripts/src/tests/.claude/docs |
| work/refonte-frontend/decisions.md | 0.3 | 1 | 0.3 / 1 | scripts/src/tests/.claude/docs ; REPRISE/MISSION 11-2x |
| work/refonte-frontend/inventaire-ecrans.json | 0.2 | 1 | 0.2 / 1 | scripts/src/tests/.claude/docs |
| work/missions/2026-11-16-carnet-decision | 0.2 | 1 | 8.1 / 115 | choix/SPEC/DEFAUTS |
| work/finalisation-tickets-2026-10-08 | 0.1 | 1 | 0.1 / 1 | scripts/src/tests/.claude/docs |
| work/missions/2026-11-03-lecture-longue | 0.1 | 8 | 0.3 / 31 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-21-carnet-maquettes | 0.1 | 1 | 5.3 / 66 | REPRISE/MISSION 11-2x ; decisions/registre/BUGS (journal seul) |
| work/missions/SUIVI.md | 0.1 | 1 | 0.1 / 1 | decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/missions/2026-10-22-essai-voies | 0.0 | 1 | 0.1 / 8 | scripts/src/tests/.claude/docs |
| work/missions/2026-10-22-systeme-agents | 0.0 | 11 | 0.1 / 17 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-08-audit-metier | 0.0 | 1 | 0.0 / 1 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-10-31-methodes | 0.0 | 1 | 0.0 / 1 | scripts/src/tests/.claude/docs |
| work/missions/2026-11-20-port-simplicite | 0.0 | 6 | 0.1 / 14 | REPRISE/MISSION 11-2x ; decisions/registre/BUGS (journal seul) |
| work/refonte-frontend/INVENTAIRE-ECRANS.md | 0.0 | 1 | 0.0 / 1 | scripts/src/tests/.claude/docs |
| work/missions/2026-11-08-lecture-en-ligne | 0.0 | 6 | 0.0 / 10 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-22-menu-plus | 0.0 | 1 | 0.0 / 2 | REPRISE/MISSION 11-2x ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-10-parcours-complet | 0.0 | 1 | 0.3 / 34 | choix/SPEC/DEFAUTS |
| work/missions/2026-10-23-theme-performance | 0.0 | 1 | 0.1 / 10 | scripts/src/tests/.claude/docs ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-09-banc-gemini | 0.0 | 1 | 0.0 / 1 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/refonte-frontend/prompt-session.md | 0.0 | 1 | 0.0 / 1 | scripts/src/tests/.claude/docs |
| work/missions/2026-11-20-planning-carnet | 0.0 | 2 | 0.0 / 2 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-21-chasse-calendrier | 0.0 | 1 | 0.8 / 30 | REPRISE/MISSION 11-2x ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-19-carnet-tour3 | 0.0 | 1 | 3.6 / 327 | REPRISE/MISSION 11-2x ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-15-simplicite | 0.0 | 1 | 0.0 / 10 | scripts/src/tests/.claude/docs ; choix/SPEC/DEFAUTS |
| work/missions/2026-11-20-workflows | 0.0 | 1 | 0.0 / 1 | choix/SPEC/DEFAUTS |
| work/missions/2026-11-01-bascule-lecture | 0.0 | 1 | 2.2 / 65 | scripts/src/tests/.claude/docs |
| work/missions/2026-11-19-ma-levure | 0.0 | 1 | 0.1 / 10 | decisions/registre/BUGS (journal seul) ; choix/SPEC/DEFAUTS |
| work/refonte-frontend/registre.md | 0.0 | 1 | 0.0 / 1 | scripts/src/tests/.claude/docs |
| work/missions/outils-mise-en-ligne | 0.0 | 1 | 0.0 / 4 | REPRISE/MISSION 11-2x |
| work/missions/2026-11-19-bugs-ecrans | 0.0 | 1 | 88.0 / 1522 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-08-rejeu-88eb | 0.0 | 1 | 0.0 / 1 | scripts/src/tests/.claude/docs ; decisions/registre/BUGS (journal seul) |
| work/missions/2026-11-16-vues-calendrier | 0.0 | 1 | 0.1 / 5 | choix/SPEC/DEFAUTS |
| work/missions/2026-11-16-choix-ouverts | 0.0 | 1 | 6.9 / 91 | choix/SPEC/DEFAUTS |

### 1b. À ARCHIVER (reste non cité du dossier, ou dossier entier)

| Dossier | Archivé (Mo) | Fichiers archivés | Entier ? |
|---|---:|---:|---|
| work/missions/2026-11-16-calendrier | 258.1 | 1921 | partiel |
| work/missions/2026-11-09-levure-port | 119.9 | 983 | oui |
| work/missions/2026-10-31-ecran-depense | 107.0 | 1772 | partiel |
| work/missions/2026-11-14-finances | 97.7 | 1244 | oui |
| work/missions/2026-11-19-bugs-ecrans | 88.0 | 1521 | partiel |
| work/missions/2026-11-17-carnet-retouches | 61.4 | 437 | partiel |
| work/missions/2026-11-14-compagnon | 55.0 | 399 | oui |
| work/refonte-frontend/v4 | 51.6 | 1653 | partiel |
| work/missions/2026-11-19-ma-levure-maquettes | 40.1 | 401 | partiel |
| work/missions/2026-11-22-saisie-main | 25.5 | 231 | partiel |
| work/missions/2026-10-31-ecran-identite | 19.9 | 484 | partiel |
| work/missions/2026-11-16-liens-app | 19.3 | 165 | oui |
| work/missions/2026-11-18-choix-calendrier | 16.0 | 181 | partiel |
| work/missions/2026-11-21-stock-maquettes | 11.0 | 128 | partiel |
| work/missions/2026-11-01-renovation | 9.7 | 215 | oui |
| work/missions/2026-11-16-carnet-decision | 7.9 | 114 | partiel |
| work/missions/2026-11-16-choix-ouverts | 6.9 | 90 | partiel |
| work/missions/2026-11-21-carnet-maquettes | 5.2 | 65 | partiel |
| work/missions/2026-11-19-carnet-tour3 | 3.6 | 326 | partiel |
| work/missions/2026-11-10-brassin-mesures | 2.5 | 37 | partiel |
| work/missions/2026-11-14-brassins | 2.3 | 636 | oui |
| work/missions/2026-11-09-ecran-levure | 2.2 | 81 | partiel |
| work/missions/2026-11-01-bascule-lecture | 2.2 | 64 | partiel |
| work/missions/2026-11-17-port-calendrier | 1.6 | 162 | partiel |
| work/missions/2026-11-21-cal-frise-prix | 1.6 | 12 | oui |
| work/missions/2026-11-09-compta-prix | 1.6 | 290 | oui |
| work/missions/2026-11-10-lenteur | 1.1 | 34 | oui |
| work/missions/2026-11-14-futs | 0.9 | 21 | oui |
| work/missions/2026-11-21-chasse-calendrier | 0.8 | 29 | partiel |
| work/missions/2026-11-10-onglet-finances | 0.8 | 29 | oui |
| work/missions/2026-11-14-ecrans-transversaux | 0.5 | 109 | oui |
| work/missions/2026-11-14-materiel | 0.4 | 116 | oui |
| work/missions/2026-11-08-banc-tous-ecrans | 0.3 | 62 | oui |

(Petits dossiers et restes < 0,5 Mo et < 40 fichiers regroupés : 446 fichiers ; liste complète : `rm.txt` reproductible par le script de la méthode.)


### 1c. Fichiers sensibles (noms seulement, aucun ouvert)

- Secrets : aucun `.env` réel suivi. Seuls `.env.example` et `functions/.env.example`.
- Factures et pièces réelles probables : `tests/fixtures/gemini-usage-bench/facture-tva-mixte.pdf`, `tests/fixtures/gemini-usage-bench/vision-2/facture-a4-photo.jpg` (+ `.truth.json`), `work/missions/2026-10-31-ecran-depense/diagnostic/d1/verite-facture-372765.json`, `work/missions/2026-11-01-bascule-lecture/voies/fn-montant-seul/facture-qr-d257.pdf`.
- Fixtures de factures fictives (à confirmer fictives) : `src/ui/depense/apercu/qr/facture-*.{png,pdf}`, `work/missions/2026-10-31-ecran-depense/voies/dp-doublon/fixtures/facture-fictive-7001.pdf`.
- Captures montrant un IBAN : `work/missions/2026-10-31-ecran-depense/qr/v0/r3/r3-geste-iban-copie.png`, `qr/v1/r4/r4b-geste-iban-copie.png`.
- Captures de reçus (nom « recu ») : `work/missions/2026-10-31-ecran-depense/v3/p3*/…-recu.png`, `voies/e-port/captures/*-recu.png`.
- Photos réelles probables : `work/missions/2026-10-25-integration-houblons/voies/i2-ia-substituer/img/reel-*.png` (captures de l'app, pas des photos), `docs/validation/levure-revue-utilisateur-2026-09-25` (11 jpg/jpeg), `work/missions/2026-11-21-stock-maquettes/plainte-tri.jpg`, `work/missions/2026-11-19-ma-levure-maquettes/port/plainte-20-11/*` (photos envoyées par le brasseur, à vérifier). `work/missions/2026-10-31-ecran-fermentescibles/choix-v7/sa-capture-s1-propositions.jpg` : capture du brasseur.
- Outils : `.agents/skills/ui-design-system/scripts/design_token_generator.py` et sa copie `.claude/skills/...` (nom contenant « token », sans lien avec un secret).

Avant toute publication d'une archive : relire ces fichiers, surtout les factures réelles et les captures d'IBAN.

## 2. Code mort (knip)

Commande : `npx knip --config <tmp>/knipA.json --reporter compact`, configuration dans le dossier temporaire. Entrées : `src/main.tsx`, `*.worker.ts`, `functions/src/**`, tests, scripts, tools. Le plugin vite échoue (`vite-plugin-pwa` absent), donc plugins vite/vitest désactivés dans la seconde passe « production » (entrées `main.tsx`, workers, `functions/src`), qui sépare le code atteint seulement par les tests.

Le bon résultat : seulement **51 fichiers de `src/` ne sont pas atteints depuis `main.tsx`** (4 824 lignes sur 316 656 lignes TS suivies sous `src/`). Les 317 000 lignes sont donc surtout du code vivant, pas du code mort : le poids vient de ce que l'app contient, des tests et du dossier work/.

### Sûr à retirer (aucun importeur, ni test, ni import dynamique, ni `/src/...` dans un script de navigateur)

18 fichiers, 1 324 lignes. Les 3 mentions restantes sont textuelles : `scripts/agents/inventaire-ecrans.mjs` les liste comme « inaccessibles ».

```
src/components/ConfirmModal.tsx          src/components/charts/CashflowBarChart.tsx
src/components/charts/ExpenseDonutChart.tsx   src/components/feuilles/ConversationsBoite.tsx
src/components/periode/GrillePeriode.tsx  src/services/hopV55/decisionArchiveV4.ts
src/services/imageCompression.ts          src/ui/BrewSheetWithCompanion.tsx
src/ui/NumPad.tsx                         src/ui/SwipeRow.tsx
src/ui/depense/Ticket.tsx                 src/ui/finance/FinanceComparisonChart.tsx
src/ui/finance/InvoiceScanReview.tsx      src/ui/finance/InvoiceSheet.tsx
src/ui/hopIndex/HopSearchPanel.tsx        src/ui/hopIndex/fiche/Silhouette.tsx
src/ui/hopIndex/fiche/index.tsx           src/ui/production/brasser/banc/banc.tsx
```

Retirer aussi, ensuite : la dépendance `motion` (son seul usage est `SwipeRow.tsx`) ; des tests touchent ces fichiers de façon indirecte : `tests/ux-mobile/financePeriodDrilldown.test.tsx` mocke `FinanceComparisonChart` (hors include vitest) ; `tests/integration/caisseVente.test.tsx` vérifie seulement que `InvoiceSheet` n'est plus importé (test qui devient sans objet).

### À vérifier

- 20 fichiers atteints seulement par des tests (2 216 lignes) : `src/domain/clientSuppression.ts`, `src/services/excelService.ts` (cité par `scripts/agents/controle-virgule.mjs`), `src/ui/BrewReadingsSummary.tsx`, `DilutionField.tsx`, `IngredientPicker.tsx`, `KegSheet.tsx`, `src/ui/atelier/*` (CurseurPrix, Ecrire, EssaiPrix, FicheContact, FicheIdee, NoteCarte, PastilleStyle, atelierModel, rangerIA), `src/ui/etapeLevure/Conduite.tsx`, `src/ui/hopIndex/{HopSolverPanel,HopSolverVarietyPicker,HopWorkshop,hopSolverTransport}`, `src/ui/hopV55/PropertyAdviceIntentEditorV3.tsx`. Écrans jamais montés par l'app : les retirer avec leurs tests d'écran.
- Exports inutilisés : 125 fichiers, 173 noms ; types : 32 fichiers, 73 noms ; exports dupliqués : 14. Beaucoup sont des constantes de version et des `assert…` de contrats (ex. `BREWING_REFERENCE_FORMAT_VERSION`) : à relire avant de retirer, car des tests les consomment peut-être ; ne retirer que le mot `export` serait sans risque.
- Dépendances : `workbox-build`, `workbox-window` (devDependencies) : `vite.config.ts` configure `workbox` via `vite-plugin-pwa`, donc à confirmer au build avant de retirer. Non listées dans le `package.json` racine : `cheerio` (8 scripts + 11 tests de levure et houblons qui échouent ici), `d3-scale` (`tests/unit/echellePrix.test.ts`), les paquets de `functions/` (déclarés dans `functions/package.json`, donc faux positifs).

### Faux positifs

- `src/domain/levure/*` (13 fichiers) : chargé par `import.meta.glob('../../domain/levure/index.ts')` dans `src/ui/etapeLevure/{domaine,Chercher}.tsx`. Vivant.
- 19 fichiers aux « imports non résolus » (17 dans `scripts/`, 2 dans `tests/integration/*.mjs`) : chemins `/src/...` importés par une page Chrome (ex. `/src/services/storage.ts`). Ils prouvent au contraire que ces modules sont utilisés par les scripts de contrôle.
- `INITIALES` (`src/components/periode/periode.ts`) : mot présent dans d'autres fichiers (définitions locales), export probablement inutile mais le nom est homonyme.
- Les « dépendances non listées » de `functions/src/**` : propres à `functions/package.json`.

Vérification à la main de 10 éléments (importeurs, imports dynamiques, chaînes de chemin) : `ConfirmModal`, `NumPad`, `SwipeRow` (seul `inventaire-ecrans.mjs` les nomme, comme inaccessibles) ; `InvoiceSheet` (un test affirme qu'il n'est plus importé) ; `FinanceComparisonChart` (mock dans un test hors vitest) ; `hopIndex/fiche/index.tsx` (une recherche d'abord positive, causée par des fichiers voisins nommés `fiche`, aucun import réel) ; `Ticket.tsx` (le mot « Ticket » ailleurs, aucun import) ; `domain/levure/*` (faux positif prouvé par `import.meta.glob`) ; exports `ACTIVE_STATUSES`, `ibanAbsent`, `erreursInstallation`, `BREWING_REFERENCE_FORMAT_VERSION`, `assertBrewingObservedStateInput` (une seule occurrence, leur définition : vrais inutilisés) ; `VOIES` de `calendrier.ts` (homonyme dans des scripts : incertain). Un cas douteux : `INITIALES`. Aucun faux positif parmi les 18 fichiers sûrs.

Liste complète des exports inutilisés (knip compact, `fichier: noms`) :

```
src/components/periode/periode.ts: INITIALES, compter
src/components/reglages/Vues.tsx: ibanAbsent
src/components/reglages/regles.ts: erreursInstallation
src/domain/batchStatus.ts: ACTIVE_STATUSES
src/domain/brewingObservedState.ts: brewingObservedStateInputContentReference, assertBrewingObservedStateInput
src/domain/brewingReference.ts: BREWING_REFERENCE_FORMAT_VERSION
src/domain/brewingSensory.ts: BREWING_SENSORY_CONTRACT_VERSION, brewingSensoryDocumentaryMentionError, assertBrewingSensoryDocumentaryMention
src/domain/calendrier.ts: VOIES
src/domain/carnets/comparer.ts: libelleEcarteAncien (comparer)
src/domain/carnets/operations.ts: VERSION_CARNET
src/domain/equipment/actions.ts: stateFor
src/domain/fabActions.ts: OUTILS_HOUBLONS_EVENT
src/domain/finance/controlesPiece.ts: SEUIL_EAN_LUS, ean13Valide
src/domain/finance/ledger.ts: fromCents
src/domain/hopDecision/adviceEvidence.ts: listHopAdviceEvidence
src/domain/hopIndex/v4/fiches.ts: stockKeyOf
src/domain/hopIndex/v4/froid.ts: AMERTUME_FROID_RULE, HOP_CREEP_RULE, LIMITE_RULE
src/domain/hopIndex/v4/palier.ts: raisonAmerisant
src/domain/hopIndex/v4/temoin.ts: poserTemoinNegatif
src/domain/levure/axes.ts: AXES_NUMERIQUES
src/domain/levure/couleurs.ts: nomFamille
src/domain/levure/fiche.ts: faitsMalAttribues
src/domain/levure/filtres.ts: trancheDe, passe
src/domain/plusEcran.ts: lettresActives
src/domain/productionInsights.ts: OUTCOME_METRICS
src/domain/rechercheAvancee/facettes.ts: etatDe
src/domain/recipeValidation.ts: assertRecipeFields
src/domain/stock/murDonnees.ts: ALPHA_MIN, ALPHA_MAX
src/domain/suppressionLiee.ts: liensChose
src/domain/tarifs/friseDisposition.ts: GOUTTIERE
src/domain/water/index.ts: MASH_PH_UNCERTAINTY, RA_BAND_REFERENCE_RATIO, scaleBandForMashRatio, SPARGE_TARGET_PH, HCO3_ACID_TOLERANCE_PPM (W)
src/domain/yeastCatalogue.ts: catalogueAssertions
src/services/brewAlarms.ts: remoteAlarmsConfigured
src/services/brewerHopAdviceRuntimeAdapter.ts: createBrewerHopAdviceApiRuntimeFactoryV3
src/services/brewerJobs.ts: brewerJobStatus
src/services/dataBackup.ts: exportConfirmedBackup
src/services/decoupe.ts: remplirHorsPapier
src/services/driveFileStore.ts: getDriveOriginalMetadata
src/services/enrichissementTravail.ts: requeteDe
src/services/financeExport.ts: FinanceExport
src/services/financeService.ts: FinancialService
src/services/firebase.ts: isUsingEmulators
src/services/hopV55/assistedAdviceArchive.ts: HOP_V55_ASSISTED_RECORD_COLLECTION, assertHopV55AssistedAdviceAppendOnly
src/services/hopV55/assistedSemanticAdviceArchiveV2.ts: hopV55AssistedAdviceWizardTicketV1Reference
src/services/hopV55/assistedSemanticAdviceContextV4.ts: prepareHopV55SemanticAdviceContextLaunchV1
src/services/hopV55/canonicalObservationFixture.ts: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_SOURCE
src/services/hopV55/decision.ts: HOP_V55_DECISION_CRITERIA_VERSION (decisionService)
src/services/hopV55/decisionReadingAccessors.ts: isHopV55SemanticDecisionReadingArchive
src/services/hopV55/futureRecipeDraft.ts: prepareFutureRecipeDraft, reviseFutureRecipeDraft, materializeFutureRecipe, readFutureRecipeMaterializationReceipt
src/services/hopV55/observationSupport.ts: hopV55ObservationSupportComparisonBindingReference
src/services/hopV55/propertyAdvicePreparation.ts: hopV55PropertyAdviceMaterialsNearSpan, hopV55PropertyAdviceMaterialSubjectLabel
src/services/hopV55/propertyAdviceRecordsV4.ts: readHopV55PropertyAdviceV4ReadingContext (recordsV4Module)
src/services/hopV55/propertyAdviceReexaminationCommand.ts: stageHopV55PropertyAdviceReexaminationRecord, appendHopV55PropertyAdviceReexaminationCommandReceiptToWorkspace, appendStage, appendReceipt, lookupReexaminationCommand
src/services/migration.ts: resetMigrationFlag, buildSeedEntries
src/services/recipeDraft.ts: readLocalYeastDocumentary, candidateSheetFromAdoptedDocumentary (recipeDraftService)
src/theme/theme.ts: THEMES
src/ui/BrewLaunchPanel.tsx: BrewLaunchPanel, BrewLaunchPied
src/ui/BrewerBudget.tsx: BrewerBudget
src/ui/BrewerNotifications.tsx: BrewerNotificationOption
src/ui/DateField.tsx: MOIS_FR
src/ui/FermentationWorkshop.tsx: FermentationTemperatureChart
src/ui/LevelGauge.tsx: LevelDot
src/ui/NoloProcessComparison.tsx: noloProcessLabels
src/ui/RatioSlider.tsx: ratioLabel
src/ui/atelier/atelierModel.ts: LIBELLE_TIROIR
src/ui/calendrier/entete/Fenetre.tsx: SEUIL_ANNEE
src/ui/calendrier/frise/usePointeur.ts: ZONE_DEFILE_PX
src/ui/carnets/CarteArticle.tsx: prixAvecDevise
src/ui/carnets/Comparer.tsx: texteClassees
src/ui/carnets/EtatIA.tsx: pluriel
src/ui/carnets/pictos.tsx: libellePicto
src/ui/companion/parts.tsx: AV
src/ui/companion/reponse.tsx: Suite
src/ui/depense/Recap.tsx: Preuve
src/ui/depense/finale.ts: shortUnit (finale)
src/ui/equipment/DetailModel.ts: lecturesDerniere
src/ui/equipment/ListFil.tsx: FilHaut, FilSans, FilPied, FilVide
src/ui/etapeLevure/Comparer.tsx: AXES_AROMES
src/ui/etapeLevure/apercuDev.ts: recetteApercuMunich
src/ui/fermentescibles/Ajout.tsx: memeArticle
src/ui/fermentescibles/Plateau.tsx: Croix
src/ui/fermentescibles/modele.ts: MOMENTS
src/ui/finance/analyse/Analyse.tsx: chf
src/ui/finance/analyse/Caisse.tsx: nomSource
src/ui/finance/analyse/format.ts: maj
src/ui/finance/financeFormat.ts: longDate, monthLabel, signedCHF, duMois, auMois
src/ui/finance/operations/calculs.ts: montantSigne
src/ui/finance/operations/plage.ts: peutGlisser, contient, etendre, montrer, jourDeFenetre
src/ui/geste/curseurNatif.ts: useCurseurNatif
src/ui/geste/index.ts: useCurseurNatif
src/ui/hopIndex/HopExtrapolationPanel.tsx: HopExplorationChart
src/ui/hopIndex/HopRecipeWorkbench.tsx: HopIbuRange
src/ui/hopIndex/HopWorkshop.tsx: HopTrialResult, HopTrialComparison
src/ui/hopIndex/comparer/calcul.ts: CRITERES
src/ui/hopIndex/dryhopper/commun.ts: FAMILIES, useAppuiLong
src/ui/hopIndex/dryhopper/frise.ts: loupe
src/ui/hopIndex/fiche/FicheHoublon.tsx: useFiche
src/ui/hopIndex/fiche/complements-ui.ts: __reinitialiserComplementsUi
src/ui/hopIndex/maBiere/LegendeGroupe.tsx: CleFamilles
src/ui/hopIndex/maBiere/briques.tsx: Intensite
src/ui/hopIndex/maBiere/index.tsx: default
src/ui/hopIndex/maBiere/rail.ts: gesteEnCours
src/ui/hopIndex/parcours/adaptateur.ts: mesures, medianeRecalcul, viderMesures, UNITES, MOMENTS
src/ui/hopIndex/parcours/donnees.ts: poserDegustationParDefaut
src/ui/hopIndex/parcours/mesure.ts: medianeRecalcul
src/ui/hopIndex/parcours/operations.ts: classeEbullition
src/ui/hopIndex/suggerer/briques.tsx: domaine, position, Piste
src/ui/hopIndex/suggerer/voies.ts: estMuet
src/ui/hopV55/CultureHypothesisEditor.tsx: default
src/ui/hopV55/PropertyAdviceAnnotationEditorV4.tsx: changeLinesV4
src/ui/hopV55/PropertyAdviceIntentEditorV3.tsx: COMPENSATION_KIND, COMPENSATION_FORBIDDEN_METRICS, blockingCompensationIssues, compensationIssues
src/ui/hopV55/contextualExplorationModel.ts: HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT, HOP_V55_EXPLORATION_PROFILE_FORMAT
src/ui/hopV55/propertyAdviceCompensationV3.ts: isCompensationQuestion
src/ui/prix/geometrie.ts: anVersBouteille
src/ui/production/ImpotBiereSheet.tsx: ImpotBiereLien
src/ui/production/fermentation/GrapheTemps.tsx: nSgLabel
src/ui/production/fiche/PostFiche.tsx: Pas
src/ui/production/fiche/StageLadder.tsx: jourDuJour
src/ui/production/fiche/ui.tsx: Titre
src/ui/production/liste/listeModel.ts: nombreDeCriteres
src/ui/production/volumes/Coque.tsx: PhraseReponse
src/ui/recap/pistes.tsx: texteHorsPlage
src/ui/useViewport.ts: useKeyboardOpen
src/ui/vente/enregistrerVente.ts: QrFactureInvalide
src/ui/water/useWaterWorkshop.ts: waterStateWithRetainedAcid
```

Types :

```
src/domain/finance/invoicePoints.ts: ControlStatus, ScanSource, ScanValue (client)
src/domain/finance/periodeSynthese.ts: CategoriePile
src/domain/hopIndex/v4/temoin.ts: TemoinNegatif
src/domain/water/index.ts: SaltCaution, AcidDef, ParsedWaterTarget, MashPhEstimate, IonBand, SolveResult, MinimalDilutionInput, MinimalDilution (W)
src/services/hopV55/assistedAdviceWorkspace.ts: HopV55AssistedAdviceTicketHistoryEntry, HopV55AssistedAdviceRecordHistoryEntry
src/services/hopV55/assistedSemanticAdviceArchiveV2.ts: HopV55AssistedAdviceWizardSemanticTurnV1
src/services/hopV55/contracts.ts: HopV55QualifiedStudyCreateCommandV1, HopV55QualifiedStudyFreshness, HopV55QualifiedStudyLinkStatus, HopV55QualifiedStudyLinkV1, HopV55QualifiedStudyPreparationV1, HopV55QualifiedAdvicePreparationContextV1, PersistHopV55QualifiedStudyResult, HopV55QualifiedStudyPreferenceCommandV1, HopV55QualifiedStudyPreferenceFreshnessInput, HopV55QualifiedStudyPreferenceFreshnessValidator, HopV55QualifiedStudyPreferenceStatus, PersistHopV55QualifiedStudyPreferenceResult, HopV55PropertyAdviceAnswerRecordV4, HopV55PropertyAdviceAnnotationLedgerV1, HopV55PropertyAdviceCorrectionV4Draft, HopV55PropertyAdviceDossierRecordV4, HopV55PropertyAdviceLedgerDecisionV1, HopV55PropertyAdviceLedgerEntryV1, HopV55PropertyAdvicePreparationV4, HopV55PropertyAdviceV4ReadingContext, HopV55PropertyAdviceOutcomeV4, HopV55PropertyAdviceV4Actor, HopV55PropertyAdviceV4Transition
src/services/hopV55/explorationTrialPreparation.ts: HopV55ExplorationTrialPreparationHistoryEntry, HopV55ExplorationTrialReceiptHistoryEntry
src/services/hopV55/productStudyPreparation.ts: HopV55ProductStudyPreparation
src/services/hopV55/semanticAdoptionApplicationHost.ts: HopV55SemanticTurnV3
src/services/hopV55/semanticAdoptionController.ts: HopV55SemanticAdoptionPureConfirmResultV1
src/services/recipeDraft.ts: YeastCandidateDocumentaryFields (recipeDraftService)
src/services/yeastDbCorrections.ts: YeastDbCorrectionChange, YeastDbCorrectionIdentity, YeastDbCorrectionScope, YeastDbCorrectionManualCreate
src/ui/AiAssist.tsx: IngredientFacts, IngredientKind
src/ui/FormNav.tsx: TextInputProps
src/ui/WaterTargetSheet.tsx: CustomTarget
src/ui/atelier/LigneOuverte.tsx: IdeePrix
src/ui/calendrier/entete/Courbe.tsx: MouvementNomme
src/ui/calendrier/frise/Frise.tsx: DragEtat
src/ui/carnets/EtatIA.tsx: MessageV
src/ui/etapeLevure/Chercher.tsx: EtatFiltresRA
src/ui/fermentescibles/Ligne.tsx: FermentableKind
src/ui/finance/TransactionJournal.tsx: JournalFilter
src/ui/geste/index.ts: RappelsGlisse, OptionsGlisse
src/ui/hopIndex/dryhopper/hote.tsx: AjoutParcours
src/ui/hopIndex/parcours/adaptateur.ts: DonneesParcours, DegustationParcours
src/ui/hopIndex/parcours/types.ts: Action, MomentId
src/ui/hopV55/DecisionPreparation.tsx: HopV55SemanticDecisionPreparationProps
src/ui/hopV55/DecisionResponse.tsx: HopV55DecisionResponseReading
src/ui/hopV55/PropertyAdviceIntentEditorV3.tsx: CompensationIssue
src/ui/hopV55/assistedAdviceUiContracts.ts: HopV55SemanticCompanionActivityV3
src/ui/hopV55/contextualExplorationModel.ts: HopV55ExplorationProfileCriterionV1, HopV55ExplorationProfileRead
```

Exports dupliqués :

```
functions/src/brewerHopAdviceContextBinding.ts: projectBrewerHopAdviceContext, deriveBrewerHopAdviceContextBinding
src/domain/finance/controlesPiece.ts: cleGs1Valide, ean13Valide
src/domain/levure/index.ts: levure, default
src/domain/stock/horizon.ts: SEMAINES_FENETRE, POSITION_SEUIL
src/services/financeService.ts: FinanceService, FinancialService
src/services/hopV55/futureRecipeDraft.ts: readHopV55FutureRecipeMaterializationReceipt, readFutureRecipeMaterializationReceipt
src/services/hopV55/futureRecipeDraft.ts: materializeHopV55FutureRecipe, materializeFutureRecipe
src/services/hopV55/futureRecipeDraft.ts: reviseHopV55FutureRecipeDraft, reviseFutureRecipeDraft
src/services/hopV55/propertyAdviceReexaminationCommand.ts: lookupStoredHopV55PropertyAdviceReexaminationCommand, lookupReexaminationCommand
src/services/hopV55/propertyAdviceReexaminationCommand.ts: appendHopV55PropertyAdviceReexaminationCommandStaging, appendStage
src/services/hopV55/propertyAdviceReexaminationCommand.ts: appendHopV55PropertyAdviceReexaminationCommandReceipt, appendHopV55PropertyAdviceReexaminationCommandReceiptToWorkspace, appendReceipt
src/services/hopV55/semanticAdoptionApplicationHost.ts: HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3, HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT
src/ui/hopV55/CultureHypothesisEditor.tsx: HopV55CultureHypothesisEditor, default
src/ui/hopV55/HypothesisEditor.tsx: HopV55HypothesisEditor, default
done
```

## 3. Tests

### 3a. `npx vitest run` (JSON dans le dossier temporaire)

1 768 fichiers lancés, 18 066 tests : 17 982 réussis, 24 échoués ; 79 fichiers en échec. Durée murale 1 196 s (20 min), sous charge (tsc, knip et trois copies de dépôt tournaient en parallèle : à rejouer seul pour une mesure propre).

**Environnement (62 fichiers, pas des défauts du code).** Dépendances absentes dans ce worktree : `cheerio` (27 fichiers : 16 via `functions/src/brewerSuppliers.ts` et `lireLien.ts`, 11 directement), `firebase-functions` (15 + 5 via `functions/node_modules/firebase-functions`), `firebase-admin` (15). Cause : `functions/node_modules` non installé et `cheerio` absent du `package.json` racine. Les fichiers (tous sous `tests/unit` sauf indication) : driveAuthorization, financeAssistantContext, invoiceRelectureArgon, invoiceReview (integration) ; aiTaskMonthlyBudget, backupTransferServer, banc-compagnon, banc-lecture-facture, banc-t2a-usages, banc-t2c-recherche, banc-t2c, brewAlarmServer, brewerAppContext, brewerApplyTransaction, brewerBudgetLedger, brewerFlashLimits, brewerHarness, brewerHopAdviceProposal, brewerHopAdviceSemanticProfileV5, brewerHopAdviceWizardDispatchV1, brewerJobsRequestNotSent, brewerSuppliers, brewingNuanceTools, brewSessionServer, carnetsCritique5Donnees, carnetsLireLien, d100AiTaskOutput, dataBackupServer, fermentationCompanion, fermentationImport, fermentationResearchAccess, financeDocumentHistory, financeDocumentMigration, financialSyncServer, geminiErrors, geminiModelRouting, geminiNetworkGuard, invoiceScanBudget, invoiceScanCsv8, invoiceScanHydrogen, invoiceScanMontantSeul, invoiceScanTransport, monthlyAiBudget, noloCompanion, yeastBelgianEnrichment, yeastBiotransformationScope, yeastCatalogue, yeastCatalogueEnrichment, yeastDbCorrections, yeastFactValues, yeastFermentationContexts, yeastLagerEnrichment, depense/p2-retirees-serveur, depense/d381/serveur, hopIndexV4/collecteBrewersfriend, hopIndexV4/collecteHopslist, hopIndexV4/collecteUsda, hopIndexV4/hopReclasserIA.

**Échecs réels (17 fichiers).** Cause probable en une ligne :

| Fichier | Verdict | Cause probable |
|---|---|---|
| `tests/unit/bugs-d20-bt2.test.tsx` | vrai défaut | `src/data/seedData.ts` référence encore `GanttTask` / Planning supprimé ; casse aussi `tsc` |
| `tests/unit/designTokens.test.ts` | vrai défaut | classes Tailwind « muettes » (degré absent de la palette) dans un écran récent |
| `tests/unit/rejeu-649b/virgule-transversale.test.ts` | vrai défaut | 5 « {nombre} unité » sans formateur à virgule (plainte du brasseur, contrôle de DEFAUTS) |
| `tests/integration/calendrierLotA.test.tsx` | vrai défaut | `--cave-100` absent du thème clair dans `frise/feuille.css` |
| `tests/integration/YeastSupplyEntry.test.tsx` | à vérifier | jour civil de Zurich après minuit : dépend de l'horloge/fuseau, possible vrai défaut de date |
| `tests/integration/calendrierPaquetG-frise.test.tsx` | périmé | positions de ligne 34 au lieu de 32 : mise en page de la frise changée depuis le lot |
| `tests/integration/AppQuickActionReturn.behavior.test.tsx` | périmé | comportement du lanceur et de l'inertie modifié |
| `tests/integration/carnetsParcours.test.tsx` | périmé | parcours IA lente / « Carnet créé » : textes ou ordre changés |
| `tests/integration/equipmentProjects.test.tsx` | périmé | libellé « Paiement prévu en… » changé |
| `tests/integration/hopV55ObservationStateEditor.test.tsx` | périmé | ancienne couche HopV55 : champs ou activation changés |
| `tests/integration/hopV55ObservationSupportPanel.test.tsx` | périmé | idem, libellé « Début de portée » absent |
| `tests/integration/hopV55ReferencePanel.test.tsx` | périmé | idem, bouton non désactivé |
| `tests/integration/mobileDailyViews.test.tsx` | périmé | texte « Brassin du samedi » changé |
| `tests/integration/previsionsEcran.test.tsx` | périmé | « Déplacer » : élément reçu `FRIGO` différent de l'attendu |
| `tests/integration/yeastPitchingExecution.test.tsx` | périmé | curseur « Jour de brassage » plus présent |
| `tests/unit/bugs-v3-t34-plein.test.tsx` | périmé | invitation à tourner à 390 px : comportement abandonné ou modifié |
| `tests/unit/stock/murDonnees.test.ts` | périmé | ordre « Fumé, Sucres » inversé (ordre figé) |

Ce sont surtout des tests d'écran : leur échec confirme leur fragilité (l'app a bougé, pas le test).

### 3b. Tri GARDER / RETIRER des 1 775 fichiers de tests

Règle appliquée (voir `work/missions/2026-11-23-nettoyage-depot/VOIE.md`, qui remplace « un test par écran ») : on garde ce qui est stable ; tout test d'écran qui fige un comportement non validé ou mouvant est candidat au retrait. Tri **automatique** par heuristique (imports, mots-clés, citations), pas une lecture de chaque fichier ; il est volontairement prudent : une partie des « À TRANCHER » ira au retrait quand elle sera lue, donc le brasseur aura probablement raison sur les 90 %. Il n'y a ni dossier `e2e/`, ni `tests/unit/proprietes/`, ni usage de `fast-check` dans ce dépôt : ces critères de garde ne couvrent rien ici. Seul `tests/fuzz/propertyFuzzer.test.ts` joue ce rôle (rangé en domaine).

| Groupe | Fichiers | Lignes | Tests | Temps vitest cumulé (s) |
|---|---:|---:|---:|---:|
| GARDER / domaine (calculs, données, hors ligne ; import seulement domain/services/data/types/stock/finance...) | 759 | 117 775 | 9 450 | 673 |
| GARDER / cité (par DEFAUTS-RECURRENTS, package.json ou un script) | 48 | 7 846 | 709 | 65 |
| **GARDER total** | **807** | **125 621** | **10 159** | **738** |
| RETIRER / écran fragile (DOM, `render`, testing-library) | 710 | 104 939 | 5 520 | 2 043 |
| RETIRER / texte ou source figés (lit un fichier source, snapshots) | 79 | 16 108 | 1 068 | 122 |
| RETIRER / code mort (n'importe que du code mort) | 2 | 85 | 5 | 0 |
| RETIRER / figé par lot ou version (nom) | 5 | 534 | 34 | 0 |
| **RETIRER total** | **796** | **121 666** | **6 627** | **2 165** |
| À TRANCHER / sans import de src | 124 | 12 176 | 864 | 5 |
| À TRANCHER / domaine mais nom de lot | 22 | 1 833 | 234 | 0 |
| À TRANCHER / touche du code mort et du code vivant | 19 | 2 551 | 182 | 34 |
| Hors vitest (hors include) | 7 | 1 033 | 0 | 0 |

**Gain.** Retirer les 796 fichiers RETIRER : −121 666 lignes (−46 % des lignes des fichiers `*.test.*` (264 880 au total)), −6 627 tests sur 18 066, et **≈ 74 % du temps vitest cumulé** (2 165 s sur 2 942 s mesurés) : en gros 1 196 s de mur → ≈ 310 s. L'écart vient surtout des 710 tests d'écran (jsdom). 17 des 79 fichiers en échec sont dans RETIRER (13 d'écran, 2 de texte figé, 2 de lot) ; 28 sont dans GARDER (dont la plupart d'environnement) et 34 dans À TRANCHER (échecs d'environnement : leur import passe par `functions/`).

Les « RETIRER écran fragile » comportent des tests encore verts et utiles pour le brasseur (ex. contrôles de plaintes en DOM) : toute citation par DEFAUTS-RECURRENTS ou un script sauve déjà un fichier (groupe « cité ») ; mais les citations de `cerveau/` ou des notes ne comptent pas.

Fichiers non `*.test.*` sous `tests/` (≈ 190 de plus pour atteindre 1 969 avec le dossier `prototypes/houblons-v4/tests`) : `tests/fixtures` (105 : factures de banc, captures, témoins), `helpers` (5), `setup*` (3), `ux-mobile` (29 fichiers hors vitest), `qa` (10), `scientific` (4), `fuzz` (2). À garder avec les tests qui les utilisent ; à trier après le tri des tests.

Vérification manuelle de 10 cas : `FloatingActions.behavior` (RETIRER, rendu et clavier : juste) ; `hopV55FixturePreview` (RETIRER, ancienne couche HopV55 : juste) ; `brewFrise` (RETIRER, « les mots de p2c » : texte figé, juste) ; `carnetsCritique5Decider` (RETIRER, lit des sources : juste) ; `propertyFuzzer` (GARDER : juste) ; `hopColdIbuContact` (GARDER : calcul, juste) ; `calendrierEchelle` (classé écran à tort, c'est un calcul d'échelle de dates : règle corrigée, maintenant GARDER) ; `bStockFuts` et `carnetsLecteurs` (classés « mort » à tort, ils testent aussi du domaine vivant : règle corrigée, maintenant À TRANCHER) ; `brewDayPh` (classé « cité » à tort par une note `cerveau/` : règle corrigée, la citation ne compte plus que dans DEFAUTS, package.json et scripts). Six règles justes, trois corrigées après coup ; l'heuristique reste à ±10 % d'erreur.

#### GARDER : répartition par dossier

tests/unit (racine) : 528 ; tests/unit/depense : 129 ; tests/unit/hopIndexV4 : 43 ; tests/integration (racine) : 31 ; tests/unit/stock : 18 ; prototypes/houblons-v4/tests : 14 ; tests/unit/finance : 10 ; tests/unit/fermentables : 7 ; tests/unit/levure : 6 ; tests/unit/identite : 4 ; tests/unit/fermentescibles : 3 ; tests/unit/rejeu-ff0f : 3 ; tests/fuzz (racine) : 2 ; tests/integration/etapeLevure : 2 ; tests/unit/bHoublons : 2 ; tests/unit/a1defauts : 1 ; tests/unit/geste : 1 ; tests/unit/recettes : 1 ; tests/unit/rejeu-649b : 1 ; tests/unit/rejeu-ff0f-depense : 1

Tests GARDER « cités » (liste complète) : prototypes/houblons-v4/tests/engine.test.ts, prototypes/houblons-v4/tests/pouvoir.test.ts, prototypes/houblons-v4/tests/substitution.test.ts, prototypes/houblons-v4/tests/tolerance.test.ts, integration/brewEquipment.test.tsx, integration/carnetEntreeUnique.test.tsx, integration/dataEntry.test.tsx, integration/eauSels.test.tsx, integration/inputProtection.test.tsx, integration/recapM2.test.tsx, integration/stoutSmoke.test.tsx, integration/stoutWaterProfile.test.tsx, integration/textInput.test.tsx, integration/todoTimelineFrise.test.tsx, unit/banc-enrichissement.test.ts, unit/brewEquipment.test.ts, unit/brewerHopAdviceProposal.test.ts (ÉCHEC), unit/brewingMath.test.ts, unit/carnetsChasseV2.test.tsx, unit/carnetsLireLien.test.ts (ÉCHEC), unit/depense/banc-k6/troisieme-d261c.test.ts, unit/depense/banc-k6/vote-d272b.test.ts, unit/depense/bandes/familles-d273.test.ts, unit/depense/bandes/unites-d273f.test.ts, unit/depense/confiance/unites.test.ts, unit/depense/d381/coupables.test.ts, unit/depense/d381/jonctions.test.ts, unit/depense/drive-fond/file.test.ts, unit/depense/enregistrement/unites.test.ts, unit/depense/enrichir/file.test.ts, unit/depense/lecture/unites.test.ts, unit/depense/pages/entree-reelle.test.tsx, unit/depense/pages/entree.test.tsx, unit/depense/sm0811/pied.test.tsx, unit/depense/stock/unites.test.ts, unit/fermentescibles/modele.test.ts, unit/hopIndexV4/bannirZero.test.ts, unit/hopIndexV4/demandeReelle.test.tsx, unit/hopIndexV4/descripteursSources.test.ts, unit/hopIndexV4/etapeHoublons.test.tsx, unit/hopIndexV4/moteurInchange.test.ts, unit/hopIndexV4/renvoisEtDemande.test.tsx, unit/hopIndexV4/traductionMots.test.ts, unit/invoiceScanCache-d273c.test.ts, unit/nouvelleVersion.test.ts, unit/numericInput.test.ts, unit/stoutAlkalinity.test.ts, unit/stoutEdgeCases.test.ts. Les autres GARDER sont le reste des fichiers `*.test.*` de `tests/unit`, `tests/integration` et `tests/fuzz` qui n'apparaissent pas dans les listes ci-dessous.

#### RETIRER : liste complète

**écran-fragile** : 710 fichiers, 104939 lignes

integration/AppEnregistrerRetourFiche.test.tsx, integration/AppLanceurOutilsHoublons.test.tsx, integration/AppRoutePile.test.tsx, integration/CommandPalette.test.tsx, integration/FermentationResearchSheet.test.tsx, integration/FermentationTemperatureChart.test.tsx, integration/FermentationWorkshop.test.tsx, integration/FloatingActions.behavior.test.tsx, integration/HopAromaChart.test.tsx, integration/HopExtrapolationPanel.test.tsx, integration/HopIndexPanel.test.tsx, integration/HopPredictionView.test.tsx, integration/HopRecipeGuide.test.tsx, integration/HopRecipePanel.test.tsx, integration/HopRecipeWorkbench.test.tsx, integration/ModalHandoff.behavior.test.tsx, integration/ModalOpenerContext.behavior.test.tsx, integration/NoloAlcoholChart.test.tsx, integration/NoloBrewDayGuide.test.tsx, integration/RecipeTextExport.test.tsx, integration/YeastBeerTarget.test.tsx, integration/YeastCandidatePicker.test.tsx, integration/YeastCatalogueDetails.test.tsx, integration/YeastCataloguePanel.test.tsx, integration/YeastDbCorrectionsPanel.test.tsx, integration/YeastHopIngredientPickerRefs.test.tsx, integration/YeastIngredientPicker.test.tsx, integration/YeastObservationList.test.tsx, integration/YeastPitchingReading.test.tsx, integration/YeastRecipePlanSafety.test.tsx, integration/YeastRecipeWorkbench.test.tsx, integration/YeastStarterEntry.test.tsx, integration/YeastSupplyComparison.test.tsx, integration/YeastSupplyEntry.test.tsx (ÉCHEC), integration/analyse.test.tsx, integration/annuelCalculs.test.tsx, integration/annuelEcran.test.tsx, integration/annuelGestes.test.tsx, integration/apportAnnulable.test.tsx, integration/apportPoches.test.tsx, integration/archivesFrise.test.tsx, integration/assistantPlusActions.test.tsx, integration/atelierNoterTarifs.test.tsx, integration/avisApresAnnulation.test.tsx, integration/bDiversCapacites.test.tsx, integration/bDiversClients.test.tsx, integration/bDiversEntete.test.tsx, integration/bDiversIbanConfig.test.tsx, integration/bDiversImpot.test.tsx, integration/bDiversJournal.test.tsx, integration/bDiversNoms.test.tsx, integration/bHoublonsDejaCorriges.test.tsx, integration/bHoublonsRO4.test.tsx, integration/bStockJourBrassage.test.tsx, integration/bStockMaterielActuelModal.test.tsx, integration/bStockSousOnglet.test.tsx, integration/bStockVolumesNoms.test.tsx, integration/backupPanel.test.tsx, integration/batchAbvOgConfirmee.test.tsx, integration/batchAm4Am5.test.tsx, integration/batchDefautsB.test.tsx, integration/batchFollowUp.test.tsx, integration/batchMissingTargets.test.tsx, integration/batchNombresFr.test.tsx, integration/batchPackagingVolume.test.tsx, integration/batchScheduling.test.tsx, integration/batchStockFollowUp.test.tsx, integration/bienAmorti.test.tsx, integration/bootstrapError.test.tsx, integration/brassageLevureAbsenteParcours.test.tsx, integration/brewAssist.test.tsx, integration/brewBilan.test.tsx, integration/brewBudgetDialog.test.tsx, integration/brewCompanion.test.tsx, integration/brewCreationBudgetContinuity.test.tsx, integration/brewDayDefautsB.test.tsx, integration/brewDayPh.test.tsx, integration/brewDayWorkflow.test.tsx, integration/brewLegacyInstallationApp.test.tsx, integration/brewLegacyInstallationLaunch.test.tsx, integration/brewMaintenant.test.tsx, integration/brewMesurerOuvertureSansEcriture.test.tsx, integration/brewMesurerOuvertureSansSauvegarde.test.tsx, integration/brewP3.test.tsx, integration/brewPageI1b.test.tsx, integration/brewPageI2.test.tsx, integration/brewPageI2Inert.test.tsx, integration/brewPageK1.test.tsx, integration/brewPageK2.test.tsx, integration/brewPageK5.test.tsx, integration/brewSession.test.tsx, integration/brewSound.test.tsx, integration/brewSuiviThermiquePremierPlan.test.tsx, integration/brewSystemCalibration.test.tsx, integration/brewSystemNavigation.test.tsx, integration/brewV1LotC.test.tsx, integration/brewV1LotD.test.tsx, integration/brewWizardColdContactEvidencePersistence.test.tsx, integration/brewWizardDeclaredSnapshotJson.test.tsx, integration/brewWizardDraftAsyncChange.test.tsx, integration/brewWizardDraftFreshness.test.tsx, integration/brewWizardFirstSaveSourceContract.test.tsx, integration/brewWizardHopV55.test.tsx, integration/brewWizardHopV55FutureDraft.test.tsx, integration/brewWizardInstallation.test.tsx, integration/brewWorkspace.test.tsx, integration/brewWortPair.test.tsx, integration/brewerBudget.test.tsx, integration/brewerChat.test.tsx, integration/brewerChatAssisted.test.tsx, integration/brewerNavigation.test.tsx, integration/brewerWaterProposal.test.tsx, integration/budgetPiles.test.tsx, integration/bugs-c1-AM69-ui.test.tsx, integration/bugs-f2-LR3-NOTE-1-caisse.test.tsx, integration/bugs-f2-k3-caisse.test.tsx, integration/bugs-k1-fiche-houblon.test.tsx, integration/bugs-s1-br110.test.tsx, integration/bugs-s1-te49.test.tsx, integration/bugs-s1-te52.test.tsx, integration/caisseAdresses.test.tsx, integration/caisseEnFond.test.tsx, integration/calDate.test.tsx, integration/calFeuilleJour.test.tsx, integration/calK3Suites.test.tsx, integration/calPasseG3.test.tsx, integration/calPasseGlisse.test.tsx, integration/calPasseL.test.tsx, integration/calPasseM.test.tsx, integration/calPasseS.test.tsx, integration/calRenvois.test.tsx, integration/calendrier-onglet.test.tsx, integration/calendrierBordRang.test.tsx, integration/calendrierEchelle.test.tsx, integration/calendrierFeuille.test.tsx, integration/calendrierGestes.test.tsx, integration/calendrierJalons.test.tsx, integration/calendrierLotA.test.tsx (ÉCHEC), integration/calendrierLotB.test.tsx, integration/calendrierLotC.test.tsx, integration/calendrierMenuV12.test.tsx, integration/calendrierMoisPort.test.tsx, integration/calendrierPC153.test.tsx, integration/calendrierPaquetE.test.tsx, integration/calendrierPaquetF.test.tsx, integration/calendrierPaquetG-entete.test.tsx, integration/calendrierPaquetG-frise.test.tsx (ÉCHEC), integration/calendrierPaysageV1.test.tsx, integration/calendrierPaysageV1bis.test.tsx, integration/calendrierPeriodeFinances.test.tsx, integration/calendrierPersistance.test.tsx, integration/calendrierPlus.test.tsx, integration/calendrierPlusVolant.test.tsx, integration/calendrierTour2Cal.test.tsx, integration/calendrierVoie2.test.tsx, integration/carnetEnvoiIA.test.tsx, integration/carnetNoteBrute.test.tsx, integration/carnetTour3F3.test.tsx, integration/carnetsParcours.test.tsx (ÉCHEC), integration/clotureInventaires.test.tsx, integration/compactClients.test.tsx, integration/compactProduction.test.tsx, integration/compactRecipe.test.tsx, integration/compactStocks.test.tsx, integration/compagnonContexte.test.tsx, integration/companionComposants.test.tsx, integration/companionFx2c.test.tsx, integration/companionFx3.test.tsx, integration/companionRecipeWizard.test.tsx, integration/companionReponseFx2a.test.tsx, integration/contactConversionUnique.test.tsx, integration/contreCalculRendementLibelle.test.tsx, integration/coutBrassinCorrections.test.tsx, integration/coutBrassinRenvois.test.tsx, integration/ct4BloquantZero.test.tsx, integration/ct4CalendrierRetour.test.tsx, integration/ct4F1Bord.test.tsx, integration/ct4F1Operations.test.tsx, integration/ct4F2.test.tsx, integration/cxRechercheMur.test.tsx, integration/d100AiErrorsVisible.test.tsx, integration/dashboard.test.tsx, integration/dashboardNavigation.test.tsx, integration/defautsStocksEcrans.test.tsx, integration/depenseD3.test.tsx, integration/depenseFermerEtType.test.tsx, integration/depenseLiaisonStock.test.tsx, integration/depenseMaterielNom.test.tsx, integration/depenseMedicament.test.tsx, integration/depensePiece.test.tsx, integration/depenseRabais.test.tsx, integration/depenseRelireFin.test.tsx, integration/depenseS1.test.tsx, integration/depenseS1ligne.test.tsx, integration/depenseTotaux.test.tsx, integration/documentProofLink.test.tsx, integration/doublonsPaire.test.tsx, integration/eauPrechargement.test.tsx, integration/ecritureAnnuleeCachee.test.tsx, integration/editTransactionBe66.test.tsx, integration/equipmentAvantDeploiement.test.tsx, integration/equipmentDetail.test.tsx, integration/equipmentProjects.test.tsx (ÉCHEC), integration/equipmentTimeline.test.tsx, integration/etapeLevure/critique2011-2.test.tsx, integration/etapeLevure/etapeCritique.test.tsx, integration/etapeLevure/etapeDose.test.tsx, integration/etapeLevure/etapeRetours.test.tsx, integration/etapeLevure/etapeStockCatalogue.test.tsx, integration/etapeLevure/maLevure1911.test.tsx, integration/etapeLevure/plainte2011.test.tsx, integration/etapeLevure/reperesNaN.test.tsx, integration/etapeLevure/t42Carte.test.tsx, integration/etapeLevure/vues-corrections.test.tsx, integration/etapeLevure/vues-ligne.test.tsx, integration/etapeLevure/vues-reel-d1.test.tsx, integration/etapeLevure/vues-reel.test.tsx, integration/etapeLevure/vues.test.tsx, integration/expenseSheet.test.tsx, integration/expenseSheetMouture.test.tsx, integration/f2ReelAnnuel.test.tsx, integration/f2ReelArgent.test.tsx, integration/f2ReelCout.test.tsx, integration/f2ReelPrevisions.test.tsx, integration/f2ReelPrix.test.tsx, integration/factureClientSaisie.test.tsx, integration/ficheBarre.test.tsx, integration/finTour2.test.tsx, integration/financeAnnuelSaisie.test.tsx, integration/financeArchives.test.tsx, integration/financeJournalDoubleSomme.test.tsx, integration/financeJournalDoublons.test.tsx, integration/financeJournalUx.test.tsx, integration/financeQuickActions.test.tsx, integration/financeWorkspace.test.tsx, integration/financesLot2.test.tsx, integration/financesTour3.test.tsx, integration/fixMateriel.test.tsx, integration/fixTarifs.test.tsx, integration/fixTarifsVente.test.tsx, integration/fnJeuEnLigne.test.tsx, integration/fournisseurs.test.tsx, integration/futsListe.test.tsx, integration/futsPort.test.tsx, integration/fuzzSaisie.test.tsx, integration/headerSignataire.test.tsx, integration/hopCatalogueLoading.test.tsx, integration/hopFactsBasisQualification.test.tsx, integration/hopV55AssistedAdvicePanel.test.tsx, integration/hopV55AssistedColdContactCard.test.tsx, integration/hopV55BiologicalInputsEditor.test.tsx, integration/hopV55Catalogue.test.tsx, integration/hopV55Comparison.test.tsx, integration/hopV55ContextualExploration.test.tsx, integration/hopV55CreusetCompatible.test.tsx, integration/hopV55CultureHypothesisEditor.test.tsx, integration/hopV55DecisionPreparation.test.tsx, integration/hopV55DecisionResponse.test.tsx, integration/hopV55DocumentaryDecision.test.tsx, integration/hopV55Explorer.test.tsx, integration/hopV55FixturePreview.test.tsx, integration/hopV55FutureRecipeDraftPanel.test.tsx, integration/hopV55Host.test.tsx, integration/hopV55NuanceExplorer.test.tsx, integration/hopV55NuancePlanEditor.test.tsx, integration/hopV55ObservationExplorer.test.tsx, integration/hopV55ObservationStateEditor.test.tsx (ÉCHEC), integration/hopV55ObservationSupportPanel.test.tsx (ÉCHEC), integration/hopV55ObservationWorkbench.test.tsx, integration/hopV55PageCatalogueUse.test.tsx, integration/hopV55PageDisplayedPropertyVersionV4.test.tsx, integration/hopV55PageExplorationPreparationReuse.test.tsx, integration/hopV55PageExplorationTrial.test.tsx, integration/hopV55PageExplorationTrialNative.test.tsx, integration/hopV55PageFreshWorkspace.test.tsx, integration/hopV55PageHistoricalReading.test.tsx, integration/hopV55PagePreparationResume.test.tsx, integration/hopV55PagePropertyAdvice.test.tsx, integration/hopV55PagePropertyAdviceV3.test.tsx, integration/hopV55PagePropertyAdviceV4.test.tsx, integration/hopV55PagePropertyRequalificationV4.test.tsx, integration/hopV55PageQualifiedAdviceSemanticV4.test.tsx, integration/hopV55PageQualifiedProductStudy.test.tsx, integration/hopV55PageSemanticReading.test.tsx, integration/hopV55PlanningEditor.test.tsx, integration/hopV55ProgramEditor.test.tsx, integration/hopV55PropertyAdviceAnnotationEditorV4.test.tsx, integration/hopV55PropertyAdviceAssociatedMaterials.test.tsx, integration/hopV55PropertyAdviceContextNotice.test.tsx, integration/hopV55PropertyAdviceDecision.test.tsx, integration/hopV55PropertyAdviceDecisionV4.test.tsx, integration/hopV55PropertyAdviceDecisionV4CultureProvenance.test.tsx, integration/hopV55PropertyAdviceIntentEditor.test.tsx, integration/hopV55PropertyAdviceOperationalPresentation.test.tsx, integration/hopV55PropertyAdviceReexaminationPanelV4.test.tsx, integration/hopV55QualifiedAdvicePreparationControls.test.tsx, integration/hopV55QualifiedStudyPanel.test.tsx, integration/hopV55QuestionScopePanel.test.tsx, integration/hopV55RecipeColdContactWorkbench.test.tsx, integration/hopV55RecipeCopyPanel.test.tsx, integration/hopV55RecipeDraftLiveRefresh.test.tsx, integration/hopV55RecipeDraftWorkspaceSource.test.tsx, integration/hopV55RecipeStep.test.tsx, integration/hopV55ReferenceEditor.test.tsx, integration/hopV55ReferencePanel.test.tsx (ÉCHEC), integration/hopV55ReferenceSelectionFocusC04.test.tsx, integration/hopV55SemanticDecisionReading.test.tsx, integration/hopV55SensoryComparison.test.tsx, integration/hopV55SensoryPresentation.test.tsx, integration/hopV55WizardCorrectionRelations.test.tsx, integration/houblonsHorsBornes.test.tsx, integration/iaFichesStock.test.tsx, integration/impotAnneeCalcul.test.tsx, integration/impotAnneeEcran.test.tsx, integration/impotBiereLien.test.tsx, integration/impotBiereSheet.test.tsx, integration/incomeProofFlows.test.tsx, integration/jus0Journey.test.tsx, integration/k1SeuilInconnu.test.tsx, integration/ligneOuverte.test.tsx, integration/limitesRenvois.test.tsx, integration/litresFocus.test.tsx, integration/liveDataViews.test.tsx, integration/loginPageAccessibility.test.tsx, integration/materielFicheStocks.test.tsx, integration/mobileDailyViews.test.tsx (ÉCHEC), integration/modifierMontant.test.tsx, integration/montantFinanceRefus.test.tsx, integration/movementSheet.test.tsx, integration/noloBrewTools.test.tsx, integration/noloFermentationWorkshop.test.tsx, integration/noloOverview.test.tsx, integration/noloRecipeSolver.test.tsx, integration/noloWizardApply.test.tsx, integration/nouvelleDepenseColonne.test.tsx, integration/numberInputBorneFrappe.test.tsx, integration/operationsApports.test.tsx, integration/operationsBarresFiltrent.test.tsx, integration/operationsCalculs.test.tsx, integration/operationsPeriode.test.tsx, integration/operationsV6bMois.test.tsx, integration/ouvertureArchiveVolume.test.tsx, integration/p1FichePage.test.tsx, integration/pageShellPerformance.test.tsx, integration/pastilleAnnee.test.tsx, integration/payerVirement.test.tsx, integration/pc2LevureCocheSansQuantite.test.tsx, integration/pc2NouvelArticleCategorie.test.tsx, integration/pc2NouvelArticleListe.test.tsx, integration/periodeSaisie.test.tsx, integration/periodeToutCoherente.test.tsx, integration/persistanceBandeau.test.tsx, integration/portHIngredients.test.tsx, integration/previsionAjout.test.tsx, integration/previsionsCorrectifs.test.tsx, integration/previsionsEcran.test.tsx (ÉCHEC), integration/previsionsEscalier.test.tsx, integration/previsionsMesureProjet.test.tsx, integration/previsionsPlacement.test.tsx, integration/previsionsPrevoir.test.tsx, integration/prixACompleter.test.tsx, integration/prixCorrectionsFz.test.tsx, integration/prixEcran.test.tsx, integration/productionCatalog.test.tsx, integration/productionVolumeBornes.test.tsx, integration/profilEffets.test.tsx, integration/projetPiste.test.tsx, integration/projetsPrevisions.test.tsx, integration/quiARecuLot.test.tsx, integration/ratioSlider.test.tsx, integration/recetteMemeChiffre.test.tsx, integration/recetteRL.test.tsx, integration/recetteSupprimerApp.test.tsx, integration/recetteSupprimerPartout.test.tsx, integration/recetteSupprimerPlus.test.tsx, integration/recipeAccessibility.test.tsx, integration/recipeAutoComplete.test.tsx, integration/recipeDisclosureLoading.test.tsx, integration/recipeEditing.test.tsx, integration/recipeImportRoundTrip.test.tsx, integration/recipeList.test.tsx, integration/recipeRecapReview.test.tsx, integration/recipeThermalPlanVirgule.test.tsx, integration/recipeWizardSafety.test.tsx, integration/renvoisPartout.test.tsx, integration/retirerEcriture.test.tsx, integration/retraitAnnulable.test.tsx, integration/routePile.test.tsx, integration/rxPrixInconnu.test.tsx, integration/rxSaisiesRefusees.test.tsx, integration/sansJustificatifNormal.test.tsx, integration/sansJustificatifSaisie.test.tsx, integration/settingsIban.test.tsx, integration/soldeDepartCause.test.tsx, integration/soldeDepartVisible.test.tsx, integration/stockCompteursOnglet.test.tsx, integration/stockHorizon.test.tsx, integration/stockHorizonOnglet.test.tsx, integration/stocksPaquetG.test.tsx, integration/stocksTour3.test.tsx, integration/stocksVision1911.test.tsx, integration/synthese.test.tsx, integration/synthesePeriode.test.tsx, integration/synthesePlageVersOperations.test.tsx, integration/t43MaterielChf.test.tsx, integration/taxWorkspace.test.tsx, integration/u2FeuillePrevision.test.tsx, integration/u2FeuilleProjet.test.tsx, integration/uiPerformance.test.tsx, integration/upgradeSheetTe35.test.tsx, integration/v1FicheProjetSupprimer.test.tsx, integration/vd2FicheToutVoir.test.tsx, integration/vdRecompterTri.test.tsx, integration/venteComptoirBornes.test.tsx, integration/w1Mineurs.test.tsx, integration/waterAcidBalance.test.tsx, integration/waterAnalysis.test.tsx, integration/waterAnalysisInteraction.test.tsx, integration/waterEdgeCases.test.tsx, integration/waterManualImpact.test.tsx, integration/waterManualSparge.test.tsx, integration/waterMineralDetails.test.tsx, integration/waterOsmosis.test.tsx, integration/waterProfileContract.test.tsx, integration/waterReactivity.test.tsx, integration/waterTargetStatus.test.tsx, integration/waterVolumeExplanation.test.tsx, integration/waterVolumesBilan.test.tsx, integration/waterWorkshop.test.tsx, integration/yeastCandidateWizardPersistence.test.tsx, integration/yeastEnrichmentUi.test.tsx, integration/yeastInitialGoalIntent.test.tsx, integration/yeastPitchingExecution.test.tsx (ÉCHEC), integration/yeastPitchingWizardOwnership.test.tsx, integration/yeastRecipeDossierProvenance.test.tsx, integration/yeastTransferUi.test.tsx, integration/yeastWorkflow.test.tsx, unit/appelMesureVue.test.tsx, unit/bAssistantNonExamines.test.tsx, unit/bAssistantSept.test.tsx, unit/bHoublons/bilanDoses.test.tsx, unit/banc-lecture-k5.test.ts, unit/brassins-sans-titre-1911.test.tsx, unit/bugs-a1-fermentescibles.test.tsx, unit/bugs-a2-br67.test.tsx, unit/bugs-a2-te14.test.tsx, unit/bugs-b1-mesures.test.tsx, unit/bugs-ct4a-CT4-B-8-11.test.tsx, unit/bugs-ct4a-t2-hooks.test.tsx, unit/bugs-ct4a-t2.test.tsx, unit/bugs-ct4b-10.test.tsx, unit/bugs-ct4b-4.test.tsx, unit/bugs-ct4b-5.test.tsx, unit/bugs-ct4b-bord-retard.test.tsx, unit/bugs-d20-bt2.test.tsx (ÉCHEC), unit/bugs-d20-te27.test.tsx, unit/bugs-e1-t3b.test.tsx, unit/bugs-f1-k2.test.tsx, unit/bugs-f1-t3b11-12.test.tsx, unit/bugs-f1-t3b6.test.tsx, unit/bugs-g1-LR1-NOTE-3.test.tsx, unit/bugs-g1-LR2-4-ecran.test.tsx, unit/bugs-g1-LR2-6-libelle.test.tsx, unit/bugs-h1-t3b4.test.tsx, unit/bugs-h1-t3b5.test.tsx, unit/bugs-k1-a.test.tsx, unit/bugs-k1b-malts.test.tsx, unit/bugs-k1b-nolo.test.tsx, unit/bugs-l3-bk4-2.test.tsx, unit/bugs-r1-TE-12.test.tsx, unit/bugs-r1-TE-33.test.tsx, unit/bugs-r2-catalogue.test.tsx, unit/bugs-r2-conduite.test.tsx, unit/bugs-r2-empatage.test.tsx, unit/bugs-r3-barre.test.tsx, unit/bugs-r3-wizard.test.tsx, unit/bugs-s1-br75.test.tsx, unit/bugs-s2-AM-56.test.tsx, unit/bugs-t1-recherche.test.tsx, unit/bugs-t2-TL-10-ajout.test.tsx, unit/bugs-v1-k2.test.tsx, unit/bugs-v1-t3b-10.test.tsx, unit/bugs-v1-t3b-13.test.tsx, unit/bugs-v3-bk31-piles.test.tsx, unit/bugs-v3-t32-brassage-passe.test.tsx, unit/bugs-v3-t34-plein.test.tsx (ÉCHEC), unit/bugs-w1-wizard.test.tsx, unit/bugs-x1-br5.test.tsx, unit/bugs-x1-br6.test.tsx, unit/bugs-x1-br98.test.tsx, unit/bugs-y1-t310.test.tsx, unit/bugs-y1-t311.test.tsx, unit/bugs-y1-t312.test.tsx, unit/bugs-z1-tl12.test.tsx, unit/bugs-z1-tl27.test.tsx, unit/calPasseCourbe.test.tsx, unit/calendrierOrientation.test.ts, unit/carnetsBanc.test.ts, unit/carnetsCorrection1Integration.test.tsx, unit/carnetsCorrection3Fil.test.tsx, unit/carnetsCritique4Figes.test.tsx, unit/carnetsCritique4Fil.test.tsx, unit/carnetsCritique5Figes.test.tsx, unit/carnetsCritique5Fil.test.tsx, unit/carnetsCritique6Figes.test.tsx, unit/carnetsCritique7Suite.test.tsx, unit/carnetsEcrans.test.tsx, unit/carnetsEnLigne2.test.tsx, unit/carnetsEnLigne4.test.tsx, unit/carnetsOrigineTitre.test.tsx, unit/carnetsPaquet1.test.tsx, unit/carnetsTour3F13.test.tsx, unit/carnetsTour3F13b.test.tsx, unit/carnetsTour3F13c.test.tsx, unit/carnetsTour3F2.test.tsx, unit/carnetsTour3F4b.test.tsx, unit/carnetsTour3F4c.test.tsx, unit/carnetsTour3F5b.test.tsx, unit/carnetsTour3F5d.test.tsx, unit/carnetsTour3F9.test.tsx, unit/champMontantEntree.test.tsx, unit/comboboxLargeurListe.test.tsx, unit/comboboxListeFeuilleCourte.test.tsx, unit/consommationAnnulerFut.test.tsx, unit/ct4CalendrierDetail.test.tsx, unit/ct4F2Escalier.test.tsx, unit/ct4c-g1-etagere.test.tsx, unit/ct4c-g1-t2-etagere.test.tsx, unit/ct4c-g2-rendu.test.tsx, unit/ct4c-g3-payer-finances.test.tsx, unit/ct4c-g3-payer-seule.test.tsx, unit/ct4c-g3-recouvrement.test.tsx, unit/cxEcartAlpha.test.tsx, unit/dateFieldMois.test.tsx, unit/depense/d381/stock-repare.test.tsx, unit/depense/doublon/feuille.test.tsx, unit/depense/drive-fond/feuille.test.tsx, unit/depense/drive-fond/fiche.test.tsx, unit/depense/drive-fond/notification.test.tsx, unit/depense/ecran/bande.test.tsx, unit/depense/ecran/ecran.test.tsx, unit/depense/ecran/finitions.test.tsx, unit/depense/ecran/libelles.test.tsx, unit/depense/ecran/p3c.test.tsx, unit/depense/ecran/sous-groupes-d307.test.tsx, unit/depense/ecran/sous-groupes-d311.test.tsx, unit/depense/ecran/tri.test.tsx, unit/depense/enrichir/malts-completer.test.tsx, unit/depense/enrichir/n2-fiche-a-saisir.test.tsx, unit/depense/f1-tour3-c.test.tsx, unit/depense/f1-tour3.test.tsx, unit/depense/f10-tour3.test.tsx, unit/depense/f12-tour3.test.tsx, unit/depense/f14-tour3.test.tsx, unit/depense/f6b-tour3.test.tsx, unit/depense/f8-tour3.test.tsx, unit/depense/fiche/ecran.test.tsx, unit/depense/g2a/plier-regrouper.test.tsx, unit/depense/g2a/quantite-un-toucher.test.tsx, unit/depense/g2a/rangee.test.tsx, unit/depense/g2a/rattacher-tous-db.test.tsx, unit/depense/g2a/tout-valider.test.tsx, unit/depense/g7/ecran-g7.test.tsx, unit/depense/h13-0811/tva-deux-taux.test.tsx, unit/depense/lecture-d/ecran.test.tsx, unit/depense/lecture-d/finitions.test.tsx, unit/depense/loupe.test.tsx, unit/depense/m9/lt5-ecran.test.tsx, unit/depense/nom-b/ecran-nom-b.test.tsx, unit/depense/nom-b/fiche-n5.test.tsx, unit/depense/noms-fr/ecran-noms.test.tsx, unit/depense/onglets/ta2-compteur.test.tsx, unit/depense/p2-retirees.test.tsx, unit/depense/p3-cache.test.tsx, unit/depense/p3-sunstore.test.tsx, unit/depense/p4/ecran-dp4.test.tsx, unit/depense/p5/ecran-p5.test.tsx, unit/depense/pages/alleger.test.tsx, unit/depense/pages/parcours.test.tsx, unit/depense/pages/rangee.test.tsx, unit/depense/pu4d/plateau.test.tsx, unit/depense/qr/bulletins-lo1.test.ts, unit/depense/qr/ecran-qr.test.tsx, unit/depense/raccord/changer-fichier.test.tsx, unit/depense/raccord/ecran-lecture.test.tsx, unit/depense/raccord/ecran-recu.test.tsx, unit/depense/rangees/rangees.test.tsx, unit/depense/sm0811/suivre-ecran.test.tsx, unit/depense/stock/ecran.test.ts, unit/depense/stock/renovation-d306.test.tsx, unit/fermentescibles/a1-defauts.test.tsx, unit/fermentescibles/absurdites-am.test.tsx, unit/fermentescibles/ajout-repli.test.tsx, unit/fermentescibles/b-assistant-0911.test.tsx, unit/fermentescibles/etape.test.tsx, unit/fermentescibles/rj9-sucre-nom-malt.test.tsx, unit/fix-futs-1611.test.tsx, unit/fix-nuit-1611-1.test.tsx, unit/fix-nuit-1611-2.test.tsx, unit/fix-nuit-1611-3.test.tsx, unit/fix-nuit-1611-4.test.tsx, unit/fix-nuit-1611-5.test.tsx, unit/fix-nuit-1611-6.test.tsx, unit/fullScreenRouteDoubleFermer.test.tsx, unit/gesteDateEcrit.test.tsx, unit/h1-t2-carnet-tout.test.tsx, unit/hopIndexV4/appuiRepete.test.tsx, unit/hopIndexV4/biereApp.test.tsx, unit/hopIndexV4/biereAppDegustee.test.tsx, unit/hopIndexV4/biereUnMot.test.tsx, unit/hopIndexV4/cartesOuvertes.test.tsx, unit/hopIndexV4/catalogueBranche.test.tsx, unit/hopIndexV4/chargementOutils.test.tsx, unit/hopIndexV4/communsHopIndex.test.tsx, unit/hopIndexV4/comparerApp.test.tsx, unit/hopIndexV4/comparerVide.test.tsx, unit/hopIndexV4/croixPile.test.tsx, unit/hopIndexV4/etiquettesSources.test.tsx, unit/hopIndexV4/ficheComplements.test.tsx, unit/hopIndexV4/ficheSourcesAutres.test.tsx, unit/hopIndexV4/ficheSuggererApp.test.tsx, unit/hopIndexV4/interpoleFinitionsU3.test.tsx, unit/hopIndexV4/legendeBandeAutres.test.tsx, unit/hopIndexV4/outilsApp.test.tsx, unit/hopIndexV4/radarContourOriginal.test.tsx, unit/hopIndexV4/radarEchelles.test.tsx, unit/hopIndexV4/radarLisible.test.tsx, unit/hopIndexV4/radarTrouDuZero.test.tsx, unit/hopIndexV4/rechercheAvancee-critique.test.tsx, unit/hopIndexV4/rechercheAvancee-houblons.test.tsx, unit/hopIndexV4/rechercheAvancee-role.test.tsx, unit/hopIndexV4/sourcesLignes.test.tsx, unit/hopIndexV4/substituerFaceAFace.test.tsx, unit/hopIndexV4/substituerIA.test.tsx, unit/hopIndexV4/suggererAgrumesSaazGalaxy.test.tsx, unit/hopIndexV4/suggererBuildComposesAPart.test.tsx, unit/hopIndexV4/suggererCataloguePlein.test.tsx, unit/hopIndexV4/suggererD108.test.tsx, unit/hopIndexV4/suggererGelNeipa.test.tsx, unit/hopIndexV4/suggererIA.test.tsx, unit/hopIndexV4/suggererRemplacementsDifferes.test.tsx, unit/hopIndexV4/suggererStockReel.test.tsx, unit/hopIndexV4/suggererViseePosee.test.tsx, unit/hopIndexV4/useHopData.test.tsx, unit/hopV55RecipeColdContactAssociation.test.ts, unit/hopV55RecipeColdContactHost.test.ts, unit/hopV55SemanticAdoptionApplicationHost.test.ts, unit/identite/cartes.test.tsx, unit/identite/champNombreTactile.test.tsx, unit/identite/correctifs.test.tsx, unit/identite/cuveTropPetite.test.tsx, unit/identite/refusSaisie.test.tsx, unit/identite/resumeMateriel.test.tsx, unit/identite/saisieDemesuree.test.tsx, unit/inputEntree.test.tsx, unit/k1-entrees-carnet.test.tsx, unit/levureMontage.test.tsx, unit/plageDate.test.tsx, unit/port-p1-modele.test.tsx, unit/port-p2-bilan.test.tsx, unit/port-p3-coque-volumes.test.tsx, unit/port-p5-depot.test.tsx, unit/port-p5-modele.test.tsx, unit/port-p6-bilan-plus.test.tsx, unit/port-p7-alcool.test.tsx, unit/port-p7-phrase-rebrasser.test.tsx, unit/port-q2-liste.test.tsx, unit/port-q3-carnet.test.tsx, unit/port-q5-carnet.test.tsx, unit/port-q6-liste.test.tsx, unit/port-s1-recettes.test.tsx, unit/port-sb-brasser-creer.test.tsx, unit/recapEtat.test.tsx, unit/recetteTour3.test.tsx, unit/rejeu-649b/be98-tarif-valeur-vide.test.tsx, unit/rejeu-649b/rl1-litres-fiche.test.tsx, unit/rejeu-649b/rl12-brouillon-abandonne.test.tsx, unit/rejeu-649b/te24-br2-deux-lotus.test.tsx, unit/rejeu-649b/te47-prix-message-visible.test.tsx, unit/rejeu-73db/be98-tarif-neuf-enregistrer.test.tsx, unit/rejeu-ff0f-b/rechargementAssistant.test.tsx, unit/rejeu-ff0f-b/rl11MashRatioSnapshot.test.tsx, unit/rejeu-ff0f-depense/illisible.test.tsx, unit/rejeu-ff0f-depense/unite-deduite.test.tsx, unit/rejeu-ff0f/b1-10-nom-etape.test.tsx, unit/rejeu-ff0f/be71-montant-refus.test.tsx, unit/rejeu-ff0f/be98-tarif-plafond.test.tsx, unit/rejeu-ff0f/br56-eau-virgule.test.tsx, unit/rejeu-ff0f/n1-double-toucher-retirer.test.tsx, unit/rejeu-ff0f/n4-masse-negative.test.tsx, unit/rejeu-ff0f/rl1-rl3-fiche-recette.test.tsx, unit/rejeu-ff0f/rl10-dose-arrondie.test.tsx, unit/rejeu-ff0f/ro2-sucre-masse.test.tsx, unit/rejeu-ff0f/te21-br42-recap-refus.test.tsx, unit/rejeu-ff0f/te24-br2-retirer-houblon-annuler.test.tsx, unit/rejeu-ff0f/te40-date-sans-virgule.test.tsx, unit/rejeu-ff0f/te47-prix-materiel.test.tsx, unit/renommerSurPlace.test.tsx, unit/rvRejeu88eb.test.tsx, unit/rxCartes.test.tsx, unit/stock/bStockCourbe.test.tsx, unit/stock/manqueRecetteFiche.test.tsx, unit/stockLineMatching.test.ts, unit/t45ajout.test.tsx, unit/t47lavageDoses.test.tsx, unit/toucherFantome.test.tsx, unit/useAppuiLong.test.ts, unit/waterAnalysisDoubleToucher.test.tsx, unit/waterRefusNegatif.test.tsx, unit/wizardStepRail.test.tsx

**figé-texte** : 79 fichiers, 16108 lignes

integration/AppQuickActionReturn.behavior.test.tsx (ÉCHEC), integration/atelierFeuillesContacts.test.tsx, integration/brewAppel.test.tsx, integration/brewBudgetSheet.test.tsx, integration/brewDayQuantitesB.test.tsx, integration/brewFrise.test.tsx, integration/brewJourP3.test.tsx, integration/brewMesuresSansCible.test.tsx, integration/brewOrdreM2.test.tsx, integration/brewPageI1a.test.tsx, integration/brewPageK3.test.tsx, integration/brewPageK4.test.tsx, integration/caisseVente.test.tsx, integration/calendrierDetail.test.tsx, integration/calendrierEnLigne1.test.tsx, integration/calendrierEntete.test.tsx, integration/calendrierFrise.test.tsx, integration/calendrierJalonsLies.test.tsx, integration/calendrierMessages.test.tsx, integration/calendrierTour3.test.tsx, integration/eauW1b.test.tsx, integration/etapeLevure/critique2011.test.tsx, integration/f2ReelOperations.test.tsx, integration/f3ReelCoutImpotClient.test.tsx, integration/fix114.test.tsx, integration/fixMateriel2.test.tsx, integration/floatingActionsShellLayout.test.tsx, integration/friseToutHistorique.test.tsx, integration/fx1.test.tsx, integration/impotBiereClients.test.tsx, integration/paliersR2.test.tsx, integration/recetteR1.test.tsx, integration/stocksTabBoucle.test.tsx, integration/x2Constats.test.tsx, unit/banc-lecture-facture.test.ts (ÉCHEC), unit/boutonConduiteClair.test.ts, unit/brewDayCssB.test.ts, unit/bugs-c1-preuves.test.ts, unit/bugs-ct4a-CT4-B-3-7.test.tsx, unit/bugs-r2-nolo.test.tsx, unit/bugs-y1-masque.test.tsx, unit/calPasseMenuFrise.test.ts, unit/carnetsCorrection3Decider.test.tsx, unit/carnetsCritique4Decider.test.tsx, unit/carnetsCritique5Decider.test.tsx, unit/carnetsCritique6Decider.test.tsx, unit/carnetsCritique6Fil.test.tsx, unit/carnetsIAServeur.test.ts, unit/carnetsTour3F11.test.tsx, unit/carnetsTour3F5.test.tsx, unit/carnetsTour3F5c.test.tsx, unit/carnetsTour3F7.test.tsx, unit/ct4c-g1-t2-paysage.test.tsx, unit/ct4c-g1-t3-paysage.test.ts, unit/ct4c-g2-prix.test.tsx, unit/ct4c-g2-t2-prix.test.tsx, unit/ct4c-g2-t3-prix.test.tsx, unit/ct4c-g3-t2-plus.test.ts, unit/ct4c-g4-fournisseur-entier.test.tsx, unit/dashboardPalette.test.ts, unit/depense/enrichir/learn.test.ts, unit/hopIndexV4/apportMinoritaire.test.ts, unit/hopIndexV4/carteNonSimule.test.ts, unit/hopIndexV4/catalogueComplet.test.ts, unit/hopIndexV4/ecritureBrouillon.test.ts, unit/hopIndexV4/etapeHoublonsRecetteReelle.test.tsx, unit/hopIndexV4/radarBiere.test.tsx, unit/hopIndexV4/substituerOrdreImpose.test.ts, unit/hopV55PropertyAdviceFamiliesV3.test.ts, unit/k1d-ecarts.test.tsx, unit/pastillePlageEntiere.test.ts, unit/periode.test.ts, unit/stock/bStockPastilles.test.ts, unit/stock/murMiseEnPage.test.tsx, unit/stock/murMontage.test.tsx, unit/stock/ta3Verdict.test.ts, unit/swissBeerTax.test.ts, unit/t41gouttierePlus.test.ts, unit/tarifsFrise.test.ts

**mort** : 2 fichiers, 85 lignes

integration/batchDateExport.test.ts, integration/sliderFieldBornes.test.tsx

**figé-lot** : 5 fichiers, 534 lignes

unit/bDiversContraste.test.ts, unit/d100AiTaskOutput.test.ts (ÉCHEC), unit/d100RecipeImportResult.test.ts, unit/depense/p2-retirees-serveur.test.ts (ÉCHEC), unit/depense/port/port-banc-juge.test.ts


#### À TRANCHER : liste complète

**mort-partiel** : 19 fichiers, 2551 lignes

integration/HopRecipeSimulationPanel.test.tsx, integration/HopSolverPanel.test.tsx, integration/HopWorkshop.test.tsx, integration/bStockFuts.test.tsx, integration/brewJourC3.test.tsx, integration/brewMesuresCurseur.test.tsx, integration/compactEquipment.test.tsx, integration/etapeLevure/etapeCoque.test.tsx, integration/hopV55PropertyAdviceCompensationV3UI.test.tsx, integration/ingredientPickerRefs.test.tsx, unit/bAssistantHorsZone.test.tsx, unit/carnetsLecteurs.test.ts, unit/clientSuppression.test.tsx, unit/hopSolverTransport.test.ts, unit/port-q10-ranger-ia.test.tsx, unit/port-q4-carnet.test.tsx, unit/port-q4-modele.test.ts, unit/port-q7-atelier.test.tsx, unit/port-q9-bloquants.test.tsx

**domaine-nommé-lot** : 22 fichiers, 1833 lignes

unit/bugs-c1-AM69.test.ts, unit/d100AiDeadlines.test.ts, unit/depense/banc-k6/ht-d272.test.ts, unit/depense/bandes/renovation-d306.test.ts, unit/depense/bandes/sous-groupes-d307.test.ts, unit/depense/bandes/sous-groupes-d311.test.ts, unit/depense/enrichir/d378.test.ts, unit/depense/f1-tour3-b.test.ts, unit/depense/f6a-tour3.test.ts, unit/depense/p2-normalize.test.ts, unit/depense/p3-categorie-piece.test.ts, unit/depense/port/port-controle-somme.test.ts, unit/depense/port/port-enregistrement.test.ts, unit/depense/rabais-p4.test.ts, unit/hopIndexV4/hx6AlphaCryo.test.ts, unit/port-q1-modele.test.ts, unit/port-q5-destockage.test.ts, unit/port-q5-taches.test.ts, unit/stock/bStockEmpatagePlafonne.test.ts, unit/stock/bStockMaterielActuel.test.ts, unit/stock/p1Courbe.test.ts, unit/v-lot-reste-prevu.test.ts

**sans-import-src** : 124 fichiers, 12176 lignes

prototypes/houblons-v4/tests/pack.test.ts, integration/driveAuthorization.test.ts (ÉCHEC), integration/invoiceRelectureArgon.test.ts (ÉCHEC), integration/invoiceReview.test.ts (ÉCHEC), unit/aiTaskMonthlyBudget.test.ts (ÉCHEC), unit/alarmeArreterContraste.test.ts, unit/bHoublons/contrasteMoment.test.ts, unit/banc-compagnon.test.ts (ÉCHEC), unit/banc-lecture-ajouts.test.ts, unit/banc-lecture-modeles.test.ts, unit/banc-lecture-noms-fr.test.ts, unit/banc-noms-fr-texte.test.ts, unit/banc-t2a-usages.test.ts (ÉCHEC), unit/banc-t2b-justif.test.ts, unit/banc-t2b-taches.test.ts, unit/banc-t2c-recherche.test.ts (ÉCHEC), unit/banc-t2c.test.ts (ÉCHEC), unit/brewAlarmServer.test.ts (ÉCHEC), unit/brewSessionServer.test.ts (ÉCHEC), unit/brewerAppContext.test.ts (ÉCHEC), unit/brewerBudgetLedger.test.ts (ÉCHEC), unit/brewerCatalogueDescriptions.test.ts, unit/brewerCatalogueRules.test.ts, unit/brewerCatalogueStore.test.ts, unit/brewerFlashLimits.test.ts (ÉCHEC), unit/brewerHopAdviceLaneV1.test.ts, unit/brewerHopAdviceTransportV1.browser.test.ts, unit/brewerPush.test.ts, unit/brewerResearch.test.ts, unit/brewerReview.test.ts, unit/brewerSuppliers.test.ts (ÉCHEC), unit/bugs-al1-alignement.test.ts, unit/bugs-b1-notes-recette.test.ts, unit/bugs-g1-LR1-8.test.ts, unit/bugs-g1-LR2-6.test.ts, unit/bugs-g1-LR3-1.test.ts, unit/bugs-g1-SU-NOTE-6.test.ts, unit/champCoucheFocus.test.ts, unit/classesTailwind.test.ts, unit/ct4c-g1-paysage.test.ts, unit/ct4c-g3-t3-marge-basse.test.ts, unit/depense/banc-k6/lp2-tva.test.ts, unit/depense/banc-k6/lp3-commande.test.ts, unit/depense/banc-k6/lp5-lectures.test.ts, unit/depense/banc-k6/lt3-ticket-quantite.test.ts, unit/depense/d380/bandes.test.ts, unit/depense/d380/message.test.ts, unit/depense/d381/serveur.test.ts (ÉCHEC), unit/depense/ecran/fixture.test.ts, unit/depense/fiche/fixture-s6.test.ts, unit/depense/lecture-d/serveur.test.ts (ÉCHEC), unit/depense/lecture/document.test.ts, unit/depense/lecture/facture-372765.test.ts, unit/depense/lecture/pdf.test.ts, unit/depense/lecture/plafond-38.test.ts, unit/depense/lecture/taille.test.ts, unit/depense/rapprochement/desaccords.test.ts, unit/depense/rapprochement/lecture-coupee.test.ts (ÉCHEC), unit/depense/rapprochement/relais.test.ts, unit/depense/rapprochement/source-unique.test.ts, unit/depense/rapprochement/statut.test.ts, unit/depense/rapprochement/troisieme-lecture.test.ts, unit/depense/rejeu-enregistre.test.ts, unit/designTokens.test.ts (ÉCHEC), unit/driveAuthorizationCore.test.ts, unit/fermentationResearchAccess.test.ts (ÉCHEC), unit/finance/controlesPiece.serveur.test.ts, unit/financeDocumentHistory.test.ts (ÉCHEC), unit/financeDocumentMigration.test.ts (ÉCHEC), unit/financialSyncServer.test.ts (ÉCHEC), unit/front-sans-firebase-admin.test.ts, unit/gemini38LiveProof.test.ts, unit/geminiCostsArgon.test.ts, unit/geminiCostsHydrogen.test.ts, unit/geminiErrors.test.ts (ÉCHEC), unit/geminiModelRouting.test.ts (ÉCHEC), unit/geminiNetworkGuard.test.ts (ÉCHEC), unit/geminiRequestSchema.test.ts, unit/hopIndexV4/ajoutsAmertume.test.ts, unit/hopIndexV4/bancEvalMetriques.test.ts, unit/hopIndexV4/cacheHorsLigne.test.ts, unit/hopIndexV4/collecteBarthHaas.test.ts, unit/hopIndexV4/collecteBeerAnalytics.test.ts, unit/hopIndexV4/collecteBrewersfriend.test.ts (ÉCHEC), unit/hopIndexV4/collecteBritishHops.test.ts, unit/hopIndexV4/collecteBsg.test.ts, unit/hopIndexV4/collecteCharlesFaram.test.ts, unit/hopIndexV4/collecteCommunautaire.test.ts, unit/hopIndexV4/collecteCrosbyhops.test.ts, unit/hopIndexV4/collecteFreestylehops.test.ts, unit/hopIndexV4/collecteHopdatabase.test.ts, unit/hopIndexV4/collecteHopsdirect.test.ts, unit/hopIndexV4/collecteHopsjson.test.ts, unit/hopIndexV4/collecteHopslist.test.ts (ÉCHEC), unit/hopIndexV4/collecteHopsteiner.test.ts, unit/hopIndexV4/collecteHpa.test.ts, unit/hopIndexV4/collecteIhps.test.ts, unit/hopIndexV4/collecteIndiehops.test.ts, unit/hopIndexV4/collecteJohnIHaas.test.ts, unit/hopIndexV4/collecteNzhops.test.ts, unit/hopIndexV4/collecteUsahops.test.ts, unit/hopIndexV4/collecteUsda.test.ts (ÉCHEC), unit/hopIndexV4/collecteYakimavalleyhops.test.ts, unit/hopSecondPass.test.ts, unit/hopV55PrimaryButtonSpecificity.test.ts, unit/invoiceDateAnnee.test.ts, unit/invoiceScanBudget.test.ts (ÉCHEC), unit/invoiceScanCore.test.ts, unit/invoiceScanCsv8.test.ts (ÉCHEC), unit/invoiceScanHydrogen.test.ts (ÉCHEC), unit/invoiceScanMontantSeul.test.ts (ÉCHEC), unit/invoiceScanRangsProvisoires.test.ts, unit/invoiceScanTransport.test.ts (ÉCHEC), unit/invoiceScanVote.test.ts, unit/invoiceVisionReview.test.ts, unit/modelsCompagnon.test.ts, unit/monthlyAiBudget.test.ts (ÉCHEC), unit/plus-etats.test.ts, unit/recherche-chose.test.ts, unit/recipeDiagnostic.test.ts, unit/recipePageLoader.test.ts, unit/rejeu-ff0f-depense/assemblage-avertissements.test.ts, unit/segmentContraste.test.ts, unit/transport05Indexes.test.ts


#### Hors vitest

claude-resume.test.mjs, ux-mobile/fermentation.test.tsx, ux-mobile/financePeriodDrilldown.test.tsx, ux-mobile/stockComparison.test.ts, ux-mobile/stockRecipeFlow.test.tsx, ux-mobile/waterScenario.test.tsx, ux-mobile/yeastChoiceComparison.test.tsx

## 4. Vitesse de tsc

`npx tsc --noEmit --incremental --tsBuildInfoFile <tmp>/tsb.info` : **froid 64 s ; à chaud 4 s** (rejeu sans modification). `tsconfig.json` : `include: ["src"]`, `strict: false`, `skipLibCheck: true`, `resolveJsonModule: true`, pas d'`incremental`. Donc **les tests (1 775 fichiers) ne sont pas vérifiés par `tsc`**.

Diagnostic étendu : 2 252 fichiers (dont 1 484 vérifiés), 332 049 lignes TS, 143 720 lignes de JSON, 202 401 lignes de définitions, **746 423 types**, 2,1 Go de mémoire, temps de vérification 61 s sur 65 s (analyse 1,6 s). Le coût est la vérification de types, répartie : le fichier le plus lent, `src/ui/hopV55/Page.tsx`, prend 3 s ; ensuite 1,1 s ou moins ; aucune dérive d'un seul module. Leviers :

1. **Activer `"incremental": true` et un `tsBuildInfoFile` stable** dans `tsconfig.json` : 64 s → 4 s à chaud, sans toucher au code.
2. Réduire le volume : retirer l'ancienne couche HopV55 et les 18 fichiers morts. Les 143 720 lignes de JSON sont importées dans le graphe (`resolveJsonModule`) : les gros fichiers de `src/data` (yeastCatalogueBootstrap 8,6 Mo, hopBeerMaverickBootstrap 2,0 Mo, yeastCatalogueLibrary 1,4 Mo, hopDatabaseBootstrap 1,2 Mo...) ne sont pas tous importés par TypeScript ; vérifier lesquels pèsent via `tsc --listFiles`. `src/data` fait 34,7 Mo.
3. Utiliser `--generateTrace` (déjà fait) si un pic apparaît après nettoyage ; pas de `include` trop large (`src` seulement), donc rien à gagner de ce côté.

## 5. Historique

- Étiquettes locales : 112 (`en-ligne/*` 96, `aitask/*` 9, `compagnon/*` 2, `archive/happy-satoshi-f3f2c1`, `drive/2026-11-10-domaine`, `maquette-2026-10-24-soir`, `regle-l9-2026-11-16`, `sauvegarde`). Distantes (`git ls-remote --tags origin`) : 41 étiquettes distinctes (67 lignes avec les `^{}` d'annotation). 71 étiquettes locales n'existent pas sur origin. Branches : 1 distante (`main`), 83 locales ou suivies (`git branch -a`).
- Pack actuel : 1,38 Gio, 378 objets libres, 3 290 commits (des avertissements « garbage found » d'objets temporaires dans `.git/objects`).
- **Dépôt neuf d'un seul commit de l'arbre gardé** (tout hors work/, plus les 6 851 fichiers work/ gardés ; extrait par un index temporaire depuis HEAD, clone temporaire dans le dossier temporaire, `git gc --aggressive`) : 11 879 fichiers, 12 404 objets, **pack 316,9 Mio**, `.git` 319 Mo, arbre extrait 572 Mo (435 Mo pour work/, 50 Mo pour `src`, 26 Mo `tests`, 18 Mo `.claude`, 17 Mo `.agents`, 12 Mo `docs`).
- **Variante serrée** (même arbre sans les quatre gros dossiers de captures cités par des scripts : `2026-10-31-ecran-depense/avant-deploiement`, `2026-10-25-integration-houblons/voies`, `2026-10-31-ecran-fermentescibles`, `2026-11-17-carnet-retouches`) : arbre 253 Mo, **pack 104,8 Mio**. À arbitrer : `carnet-retouches` est cité par `choix/` (images de maquettes choisies) ; ne le retirer qu'avec accord du brasseur (règle n° 1).
- Ces tailles sont pour l'arbre sans retrait de tests ni de code mort : retirer ces éléments gagne peu (le poids est dans les images de work/). Les étiquettes `en-ligne/*` ne sont utiles qu'avec l'historique ; un dépôt d'un seul commit les perd (à conserver dans l'archive, pas dans `main`).
