# Voie banc-modeles — quel modèle pour ranger une phrase (D453)

- Agent : auteur ; Modèle : opus ; Niveau : jugement (mesure) ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier), qui prime.
- Possède : scripts/banc-rangement.ts, functions/src/carnetIA.ts (SEULEMENT un paramètre de modèle optionnel pour le banc, sans changer le défaut de production), work/missions/2026-11-23-reprise-soir/voies/banc-modeles/, tests/fixtures/banc-modeles/.

## Économie
- Mécanique : le banc en un script ; une passe par modèle ; aucune relance d'une passe complète.
- Gestes : sans écran.
- Captures 390 et 1280 ouvertes : sans objet (banc).
- Tests : `npx vitest run tests/unit/c70RangementIA.test.ts --reporter=dot > tests.log` (rejeu des réponses relevées) ; Gemini JAMAIS dans npm test.

## Tenue
- RESULTAT.md tenu au fil.
