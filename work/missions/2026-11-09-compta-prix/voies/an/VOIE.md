# Voie an — porter l'outil d'analyse a2a dans l'app (choisi le 10.11)

Agent : auteur (Sonnet), plafond 150. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11)
« L'escalier, quatre vues / a2a / … Super ! Ajoute encore un petit peu de clarté dans le protage mais c'est du 19/20 pas besoin de mini
maquettes en plus ». Son besoin d'origine : « un outil d'analyse pour voir si je respecte mes budget, voir l'évolution réelle en fonction de
mes opérations … sur des vrais chiffres. Et aussi pouvoir comparer d'année en année ».

## Maquette choisie (règle n° 1 : reprise telle quelle, 99 %)
`work/missions/2026-11-09-compta-prix/p7/a2a/` : `etat.html` (cinq figures : ouverture « Caisse », Sources, Budget, Filtrer, ses données
d'aujourd'hui), `NOTE.md`, captures `a2a-v1.png` … `a2a-v5.png`, `a2a-1280.png`. Ouvre-les toutes avant le plan. Parents : `p6/a1a/`
(escalier), `p6/a1e/` (cascade), `p6/a1b/` (tuiles). Entrée : Synthèse › « Revoir le mois » (NOTE) — un outil à part, pas la vue principale.
**Clarté (sa seule demande en plus)** : chaque vue ouvre par une phrase-réponse chiffrée d'une ligne ; unités dites (CHF, période) ;
le pointillé « prévu », le trait gris « 2025 », le hachuré « dépassé » et l'orange « pas prévu » se lisent sans légende cherchée (libellé
court au point de la courbe ou légende d'une ligne) ; pas de mot de plus que nécessaire (premier plan ≤ 60 mots hors chiffres).

## Les nombres viennent du domaine (jamais recalculés à l'écran, jamais un 0 inventé)
- **Caisse (escalier réel)** : le solde jour par jour depuis les paiements réels (`FinancialPayment`, `summarizeLedger`/`ledger.ts`) à partir
  du solde de départ confirmé ; sans solde confirmé, l'escalier est en écart depuis le début de la période (comme Prévisions p5b, et le
  bandeau du solde CP-4 renvoie). Chaque marche : son opération (étiquette accrochée, couleur de sa source), prévu en pointillé (prévisions
  `FinancialPlan` et prévision dérivée des brassins P1), « pas prévu » en orange. 2025 : même jour l'an dernier (carte + trait gris).
- **Sources** : la cascade de a1e : caisse au début → ventes → chaque source → caisse à la fin, prévu en cadre pointillé, 2025 en encoche,
  dépassé hachuré, matériel à part (`periodeSynthese` avec `mois`/`jusqua` : une seule définition de dépensé, matériel à part).
- **Budget** : une règle par source, réel contre prévu de la période (prévu = plans + prévision dérivée), dépassement hachuré, encoche 2025 ;
  brassins prévu → réel (`brewForecast.ts`, coût réel du brassin : `chaineLitre`/`troisNotions`).
- **Filtrer** : les tuiles de a1b (12 mois gagné/perdu, règle du budget au pied, 2025 au coin) comme sélecteur de période (un mois ou une
  plage : réutilise `src/ui/finance/PlageMois.tsx`), pastilles source / fournisseur / brassin ; l'escalier et les chiffres suivent.
- **✦ Pourquoi ?** : IA au toucher, sourcée, simulée en test (jamais Gemini réel dans `npm test`) ; réutilise le chemin IA existant de la
  Synthèse (grep `Pourquoi`).
Écris les calculs neufs en fonctions pures (`src/domain/finance/analyse.ts`) avec leurs tests unitaires (Vitest, une règle par test).
Chaque manque visible est un renvoi (règle CP-18 : `voies/rv/RENVOIS.md`) ; ajoute l'écran au contrôle `tests/integration/renvoisPartout.test.tsx`.

## Étapes
1. `voies/an/PLAN.md` : inventaire de chaque élément des cinq figures de a2a et de son état, source de chaque nombre, fichiers, tests rouges
   d'abord. Puis code sans attendre de revue (lecture seule, aucune écriture de données).
2. Domaine + tests ; écran `src/ui/finance/analyse/**` (+ CSS préfixé `ana-`) ; entrée depuis la Synthèse.
3. `npx vitest run <fichiers> --reporter=dot > voies/an/tests.txt 2>&1` (neufs + tests Synthèse, periodeSynthese, renvoisPartout, FinancesTab :
   grep). `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch ; `npx vite build --outDir "$TEMP/an-build"`.
4. Captures 390 tactile et 1280, clair et cave, les quatre vues + l'état sur SES données (`?dev-local&finance-demo=reel`) et sur la démo
   riche (`?dev-local&finance-demo`), côte à côte avec les figures de a2a, ouvertes (L12) ; « combien et quels problèmes ? » numéroté dans
   RESULTAT.md, corrige ce qui s'écarte de a2a. Serveur `npx vite --port 3011 --strictPort` en arrière-plan, arrêté à la fin.

## Possède
`src/domain/finance/analyse.ts` (neuf), `src/ui/finance/analyse/**` (neuf), `src/ui/finance/analyse.css` (neuf), `src/ui/finance/FinanceOverview.tsx`
et `src/ui/finance/synthese/**` (l'entrée « Revoir le mois » seule), `src/components/tabs/FinancesTab.tsx` (ouverture de l'outil seule),
`tests/unit/analyse*.test.ts`, `tests/integration/analyse*.test.tsx` (neufs), `tests/integration/renvoisPartout.test.tsx` (un bloc ajouté),
`work/missions/2026-11-09-compta-prix/voies/an/**`. Lis `voies/COMMUN.md` (acquis).

RESULTAT.md au fil dans `voies/an/RESULTAT.md`. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle. Rends une ligne.
