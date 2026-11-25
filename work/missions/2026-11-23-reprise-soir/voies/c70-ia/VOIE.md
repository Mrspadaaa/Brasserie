# Voie c70-ia — le rangement juste sur l'IA RÉELLE (C70-3, 4e retour : C67-2, C68-1, C69-1)

- Agent : auteur ; Modèle : opus ; Niveau : jugement (consigne et schéma d'une IA, mesurés) ; Plafond : 120 tours.
- Lis DOSSIER.md (même dossier), qui prime.
- Possède : functions/src/carnetIA.ts (consigne, schéma, post-traitement), src/domain/carnets/ia.ts (lecture de la réponse), scripts/banc-rangement.ts (neuf), work/missions/2026-11-23-reprise-soir/voies/c70-ia/, tests/fixtures/c70-ia/ (neuf), tests/unit/c70RangementIA.test.ts (neuf).

## Économie
- Mécanique : le banc en un script, une passe = un appel par phrase ; deux passes au plus (avant, après).
- Gestes : sans écran (voie de consigne) ; la preuve est le banc réel et Vitest.
- Captures 390 et 1280 ouvertes : sans objet ici ; le critique suivant jugera l'écran.
- Tests : `npx vitest run tests/unit/c70RangementIA.test.ts --reporter=dot > tests.log` ; Gemini JAMAIS dans npm test (réponses relevées rejouées).

## Tenue
- RESULTAT.md tenu au fil.
