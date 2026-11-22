# Voie a1-analyse — combien et quels problèmes, Stocks › Matériel

- Mission : 2026-11-14-materiel
- Agent : critique (en Opus : Fable interdit)
- Modèle : opus
- Niveau : jugement
- Plafond : 30 tours
- Dépend de : a0-banc
- Décideur en cas de doute : pilote

## Objectif
Juger l'écran actuel comme le brasseur, par la vision (D343, D344) : « combien et quels problèmes ? », liste numérotée, puis les
parcours manquants. M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- Sa capture : `M/brasseur/14-11-stocks-materiel.jpg`. Captures du banc : `M/banc/*.png`, `M/banc/INDEX.md` (ouvre-les toutes).
- `M/BRIEF-AUTEUR.md` §2 (ce que l'app sait déjà : dépenses reliées, immobilisation) et §3 (données).
- Code (version en ligne, copie `C:/Users/mrspa/AppData/Local/Temp/materiel-banc`) : `src/ui/EquipmentList.tsx`,
  `src/ui/EquipmentSheet.tsx`, `src/components/tabs/StocksTab.tsx` (sous-onglet `materiel`), `src/ui/finance/ExpenseSheet.tsx`
  (lignes `equipment` et `maintenance`), `src/domain/finance/types.ts` (`FinancialAsset`).
- `PRODUCT.md`, `DESIGN.md` (parties utiles), `cerveau/brasseur/pas-de-cockpit.md`, `cerveau/brasseur/penser-brasseur.md`.

## Possède
- `M/analyse/`, `M/voies/a1-analyse/`. Rien d'autre.

## Consignes
Écris `M/analyse/ANALYSE.md` :
1. `## Problèmes` : liste numérotée P1…Pn, chacun : vue et thème/largeur, ce qu'on voit (mesuré si possible), pourquoi le brasseur
   le refuserait, gravité (bloquant, gênant, mineur).
2. `## Parcours manquants` : M1…Mn — au moins : entretien dû (quand, rappel), noter un entretien fait, panne (signaler, depuis quand,
   réparée), étalonnage des instruments (densimètre, pH-mètre, réfractomètre), lien aux dépenses (achat, entretien payé),
   valeur et amortissement, matériel vendu/réformé (sortie d'inventaire autre que supprimer), lien avec le brassage (cuve,
   fermenteur utilisés par les profils de brassage). Pour chacun : ce que l'app a déjà (données, code), ce qui manque.
3. `## Couverture` : tableau vue × état (liste, À traiter vide et non vide, recherche, Actions, fiche, Achat, Gestion, nouveau,
   Enregistrer un achat, vide) × 390/1280 × clair/cave : capture du banc, problème(s).
4. `## À garder` : ce qui marche et doit survivre.

## Exigences transversales
Données fictives seulement. Aucune donnée réelle, aucun Gemini. Captures non regardées = pas de preuve (L12).

## Critères
`GATES.md` du même dossier ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : sans objet (aucun code, pas de `--reporter=dot > …`) : « Tests : sans objet » dans RESULTAT.md.
- Voie d'écran : les captures 390 tactile et 1280, clair et cave, du banc, toutes ouvertes.
Réponse finale : une ligne (nombre de problèmes, dont bloquants ; nombre de parcours manquants).
