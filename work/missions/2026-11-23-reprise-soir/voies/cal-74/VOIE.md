# Voie cal-74 — Calendrier : lenteur mesurée et les 5 constats de cal-73

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement (performance mesurée) ; Plafond : 120 tours.
- Lis DOSSIER.md (même dossier), qui prime.
- Possède : le code du Calendrier (trouve-le : grep des composants de l'onglet Calendrier et de la frise), ses tests, tests/unit/cal74Regles.test.tsx (neuf), scripts/mesure-calendrier.mjs (neuf), work/missions/2026-11-23-reprise-soir/voies/cal-74/. Pas src/ui/carnets, pas src/domain/carnets, pas src/domain/stock, src/ui/stock, src/ui/finance.

## Économie
- Mécanique : la mesure en un script puppeteer (avant, après), relancé sans modification.
- Gestes : un script par lot ; captures à demi-échelle.
- Captures 390 et 1280 ouvertes : 390 avant/après de chaque constat corrigé ; 1280 une fois.
- Tests : `npx vitest run tests/unit/cal74Regles.test.tsx <tests du calendrier touchés> --reporter=dot > tests.log`.

## Tenue
- RESULTAT.md tenu au fil.
