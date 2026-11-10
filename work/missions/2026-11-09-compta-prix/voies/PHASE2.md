# Phase 2 du port : d2, uc, up

Phase 1 commitée (480f8d3e) : `chaineLitre.ts`, `materielFutur.ts`, `numeroFacture.ts`, `swissBeerTax.ts`, `brewBudget.ts`, `swissQrBill.ts`.
Lis `PLAN-METIER.md` (§ de ta voie, § 3.5 à 3.7), `voies/COMMUN.md` (décisions P1 à P7), `voies/ETAPE2.md` (usure comptée une fois) et
les RESULTAT.md de d1 et d3 (ce qu'ils laissent à d2 et uc).

## Règle n° 1 (ports uc et up)
Sa maquette choisie est la base, reprise telle quelle (L03) : `etat.html`, NOTE.md et captures de la maquette, ouvertes avant de coder.
Inventaire de chaque élément et état de la maquette dans PLAN.md, puis le port ne retire que ce qu'elle n'a pas. Langue visuelle :
DESIGN.md, `.claude/rules/affinee-frontend.md`, `docs/ui-compacte.md`. CSS de l'écran dans son fichier, classes préfixées (L26). Jamais
`type="number"`. Deux thèmes (clair et cave). Données de vérification : `?dev-local&finance-demo`.
Décisions du pilote sur les questions B1 et B2 du plan : B1 (b) le bloc « À payer » de c3a sépare « avant le brassage » et « plus tard »
(impôt après le conditionnement), le reste de la maquette inchangé ; B2 (a) bouton « Prévoir 64,26 CHF » gardé, le geste fige les
entrées et ouvre la ligne dans Prévisions.

## Voies
| Voie | Objet | Possède |
|---|---|---|
| d2 | prévision dérivée des brassins planifiés et des projets de matériel, **domaine seul** (l'écran Prévisions attend son choix) | `src/domain/finance/brewForecast.ts` (neuf), `src/domain/finance/forecast.ts`, `tests/unit/brewForecast.test.ts`, `tests/unit/financeForecast*.test.ts` existants, `voies/d2/**` |
| uc | port de **c3a** (coût d'un brassin et d'un litre) : maquette `work/missions/2026-11-09-compta-prix/p2/c3a/` | `src/ui/finance/CoutBrassinFlux.tsx` (neuf), `src/ui/finance/BrewBudgetSheet.tsx`, `src/ui/finance/BrewBudgetDialog.tsx`, `src/ui/finance/cout-brassin.css` (neuf), `tests/integration/brewBudgetSheet.test.tsx`, `tests/integration/brewBudgetDialog.test.tsx`, `voies/uc/**` |
| up | port de **p2b** (impôt bière, la règle des degrés) : maquette `work/missions/2026-11-09-compta-prix/v0/p2b/` | `src/ui/production/ImpotBiereSheet.tsx` (neuf), `src/ui/production/impot-biere.css` (neuf), `src/ui/BatchDetailSheet.tsx` (le lien seulement), `src/components/tabs/ClientsTab.tsx` (section Impôt seulement, l. ~279-315), tests d'intégration neufs `tests/integration/impotBiere*.test.tsx`, `voies/up/**` |

## Étapes
1. **PLAN.md seul**, puis arrête-toi et rends une ligne (gabarit `.claude/skills/voies/references/sans-memoire.md` § 2 : défauts visés,
   changements fichier/fonction, inventaire de la maquette pour uc et up, tests qui échouent d'abord, appelants hors Possède par grep sur
   `src/` `tests/` `scripts/` rejoués sur HEAD, risques données existantes / hors ligne / arrondis, hors périmètre).
2. Après la revue (un message du pilote) : code, tests rouges puis verts, `npx tsc --noEmit` vert, captures de l'écran porté à 390 et 1280,
   deux thèmes, côte à côte avec la maquette, **ouvertes** (L12). Le jugement visuel final revient au critique.
RESULTAT.md tenu au fil dans `voies/<id>/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/<id>/tests.txt 2>&1`, puis lire la ligne `Test Files … | Tests …`.
Aucun commit, pas de `git stash`, Gemini jamais appelé, l'IBAN jamais recopié. Rends une ligne.
