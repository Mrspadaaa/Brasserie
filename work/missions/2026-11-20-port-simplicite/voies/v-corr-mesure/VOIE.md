# Voie v-corr-mesure — corriger pm1, pe3, pe4 après la critique

- Agent : auteur · Modèle : sonnet · Plafond : 80 tours · Décideur : pilote
- Racine : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`. Lire `critique/RESULTAT-B.md` (problèmes 10 à 15 et les doutes pe3, pe4), `voies/v-pm1/RESULTAT.md`, `voies/v-pm1-tests/RESULTAT.md`, `voies/v-pe3/RESULTAT.md`, `voies/v-pe4/RESULTAT.md`, `voies/v-pm1/VOIE.md` (exigences transversales : elles valent ici mot pour mot), maquettes `maquette/captures/pm1-*`, `pe3-*`, `pe4-*`.

## Corrections (décisions du pilote)
10. BLOQUANT pm1 : l'écart s'écrit à la cible affichée (68,5 contre 67 → « +1,5 au-dessus ») ; si une tolérance compte, la carte l'écrit (« cible 66 à 68 ») comme pour le pH. Aucun chiffre que le brasseur ne peut recalculer de ce qu'il voit.
11. pm1 : toucher le curseur de pH (même sans le déplacer) compte comme une pose : « Relever » s'active ; s'il est inactif, la raison se lit (« glisse sur ta mesure »).
12. pe3 : pastille de trace lisible (texte à la taille de la maquette, pas moins que le plancher de DESIGN.md), ↺ touchable à 44 px (zone élargie sans chevaucher).
13. pe3 à 1280 : pas deux fois la même chose sur une rangée ; garde la pastille (son choix) et dis comment la colonne « Dernier mouvement » est traitée (elle vit dans StocksTab, interdit : si elle seule peut changer, écris « DEMANDE PILOTE »).
14. pe4 : « Retenir » inactif se lit inactif (pas un aplat qui paraît actif).
15. pe4 : quand la question de dose est posée, pas de « OK » en plus : « Pas maintenant » et « Retenir » suffisent (OK reste quand il n'y a pas de question).
Doutes : refaire les captures pe4 avec l'unité réelle (`uniteDeDose`, un PBW en kg → g) ; vérifier l'« achat · −24 kg » de pe3 sur un VRAI mouvement de facture (une facture saisie dans l'app réelle) ; la ligne « ✓ Brassage fini » après Retenir (v-pe4) sur un vrai brassage terminé.

## Possède
- `src/ui/brassage/AppelMesure.tsx`, `src/domain/appelMesure.ts`, `tests/unit/appelMesure*.ts*`, `src/ui/stock/LigneStock.tsx`, `src/ui/StockRow.tsx`, `src/domain/stock/traceMouvement.ts`, `tests/unit/traceMouvement.test.ts`, `src/ui/BandeauEffets.tsx`, `tests/unit/bandeauEffetsPe4.test.tsx`, le CSS de LigneStock (`l1-trace`), `work/missions/2026-11-20-port-simplicite/voies/v-corr-mesure/`

## Consignes
Un test qui échoue avant 10, 11, 15. Puis JOUER DANS L'APP RÉELLE par les gestes : pm1 au banc `?preview=brew&view=brassage` (BrewDayPage réelle) ; pe3 : une facture « ZZ TEST » saisie (lecture simulée), puis Stocks › la ligne, ↺ ; pe4 : un brassage terminé et un fût marqué propre. `npx vite --port 3142 --strictPort`, ?dev-local. 390 tactile et 1280, clair et cave, captures OUVERTES, écarts écrits. Interdits : StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx, ExpenseSheet.tsx, tout hors Possède ; aucun commit, stash, checkout ; pas de npm run build ; Gemini simulé.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments ; une ligne par problème 10 à 15 et par doute : corrigé (preuve) ou écarté (raison).
- Ligne « Tests » écrite dans un fichier : `npx vitest run tests/unit/appelMesure.test.ts tests/unit/appelMesureVue.test.tsx tests/unit/traceMouvement.test.ts tests/unit/bandeauEffetsPe4.test.tsx tests/unit/effetsFinances.test.ts tests/unit/consommationGestes.test.ts --reporter=dot > work/missions/2026-11-20-port-simplicite/voies/v-corr-mesure/tests.txt`
- Captures dans `voies/v-corr-mesure/captures/`. Réponse finale : une ligne.
