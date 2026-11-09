# Voie b-assistant — bugs ouverts, zone « Assistant de recette hors Levure (Identité, Malts/sucres, Paliers, Eau, Récap), carnet de recettes » (mission 2026-11-09-levure-port)
- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Liste : `b-assistant/BUGS-b-assistant.md` (134 bugs). Règles : `../REGLES-BUGS.md` (à lire en premier, à suivre telles quelles).
- Possède : src/pages/BrewWizard.tsx SAUF le bloc step === 'levure' (voie u1 l'édite en même temps : relis le fichier avant chaque Edit), src/ui/fermentescibles/**, src/ui/identite/**, src/ui/water*/** et src/domain/water*, src/pages/recipe-wizard.css, les composants du carnet de recettes ; les tests de ces fichiers ; `work/missions/2026-11-09-levure-port/voies/b-assistant/**`.
- Port du serveur de développement : 5655.
- Un bug de l'étape Levure : « à trancher : port u1 en cours » (les anciens écrans Levure sont remplacés).
