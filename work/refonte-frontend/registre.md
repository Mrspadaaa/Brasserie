# Registre — refonte frontend houblons

Ce fichier ne contient que l'état en cours. L'historique du 17 au 20.10 (phases 1 à 8, lots 1 à 21, 1 572 lignes)
est dans `registre-archive-2026-10-17-au-20.md` : on l'ouvre pour un fait précis, sans le relire en entier.
Depuis le 22.10, chaque chantier tient son état dans sa mission (`work/missions/<date>-<sujet>/MISSION.md`).
Ce registre pointe ces missions, il ne les recopie pas.

## Objectif

Comprendre les vrais besoins houblons du brasseur, puis livrer l'outil houblons : d'abord en maquettes hors de
l'app, puis dans l'app après la porte B (fermée tant qu'il ne l'ouvre pas). Issue de suivi : #119.

## Où est l'état (22.10)

- **Reprise du lot 21** (lot 22 Comparer et sa reprise r6n, picto « épicé » r4d, lot 23 Dryhopper r7) :
  `work/missions/2026-10-22-reprise-lot21/MISSION.md`. Session « En attente ».
- **Système d'agents** (cerveau, voies, conseil, entonnoir, élagage) : `work/missions/2026-10-22-systeme-agents/ETAT.md`.
- **Page de lot en vigueur** : https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv. Pour la republier :
  `v4/outils/page-lot/PUBLIER.md`.
- **Ses mots** : `v4/SPEC-BRASSEUR.md`, le § 0 d'abord. **Ses refus** : `v4/DEFAUTS-COURT.md`. **Décisions** :
  `decisions.md`. **Acquis** : `cerveau/produit/acquis-valides.md`.

## En attente de ses choix

Rien n'attend sa réponse pour avancer (L24) : chaque choix ouvert est montré en variantes. La liste à jour se trouve
dans la section « Décisions » de la mission de reprise (lignes « ouverte ») : carte des outils, radar de Comparer,
base de comparaison, Substituer, levure, descripteurs hors familles, picto « épicé ». S'y ajoutent, plus anciens :
l8 ou l5, les conventions du moteur (`v4/ecran-1/fils21-choisir/donnees/PROFIL-SIMULE.md`) et la porte B.

## Risques ouverts (repris de l'historique)

- R1 : des demandes tapées hors des journaux (claude.ai, téléphone) manquent au corpus.
- R2 : les sessions `cli` mêlent messages humains et relais d'agents ; chaque citation porte son type.
- R3 : le corpus cite des messages privés ; analyser les secrets et les données personnelles avant tout envoi.
- R4 : une clé API Gemini apparaît en clair dans d'anciens journaux (M0009, M0642, M0643). Elle n'a pas été
  recopiée ; sa révocation est recommandée à l'utilisateur.
- R5 : le banc QA ne reflète pas la production (catalogue complet en fixture, 12 variétés en production).
