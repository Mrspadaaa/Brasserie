# Voie c68-releve — vraies réponses de l'IA de rangement, pour des tests qui jugent le vrai chemin

- Agent : critique ; Modèle : opus ; Niveau : test sur l app réelle (ZZ TEST, mandat du brasseur : « les seul vrai tests sont ceux sur la vrai app », budget IA 0,10 CHF par test journalisé, comme critique-NN) ; Plafond : 70 tours.
- Lis DOSSIER.md (même dossier), qui prime.
- Possède : work/missions/2026-11-23-reprise-soir/voies/c68-releve/, tests/fixtures/c68/ (neuf).

## Économie
- Mécanique : un seul script puppeteer pour tout le relevé (releve.mjs), relancé sans modification en cas d'échec réseau seulement.
- Gestes : un script ; captures 390 à demi-échelle, ouvertes : avant, chaque carte « rangé pour toi », après.
- Captures 390 et 1280 ouvertes : 390 seulement (relevé, pas de jugement d'écran) ; 1280 sans objet.
- Tests : sans objet (relevé de données, aucun test lancé ; un test éventuel se lancerait avec --reporter=dot > tests.log) ; écrit dans RESULTAT.md la liste des fixtures produites.

## Tenue
- RESULTAT.md tenu au fil.
