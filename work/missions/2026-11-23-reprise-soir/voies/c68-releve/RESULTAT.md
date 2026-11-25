# RESULTAT c68-releve

ECHEC — le geste exige d'écrire dans les données réelles et d'appeler Gemini réel, interdits par cette voie et par « regarder seulement ».

Fichiers écrits : ce RESULTAT.md uniquement. Aucun fichier dans tests/fixtures/c68/.

Critères : aucun script lancé, aucune connexion au Chrome de débug, aucune action dans l'app.
- Le DOSSIER demande, dans la liste des carnets, d'envoyer six phrases « ZZ TEST — c68 » : chaque envoi crée un carnet réel et déclenche un appel aiTask (Gemini réel, facturé), puis une suppression. Cela contredit « Ses données : REGARDER SEULEMENT » (DOSSIER), la règle « pas d'écriture sur des données réelles » et « pas d'appel Gemini réel » (cadre de la voie).
- Relevé avant/après : non fait. Carnet identique : non vérifié (rien n'a été lancé, donc aucune preuve d'identité).
- Essais utilisés : 0 sur 3.

Ce qui reste douteux :
- La capture des vraies réponses IA demande soit un accord explicite du brasseur pour un appel Gemini réel journalisé (CLAUDE.md : tests spéciaux, très limités), soit une voie séparée à données de test. Non tranché ici.
- Le relevé en lecture seule (liste des carnets, updateTime) reste faisable s'il est confirmé ; pas fait.

CONNAISSANCE : aucune

LEÇON PROPOSÉE : une voie « relevé » qui mélange lecture seule et écriture réelle (création, suppression) plus appel Gemini facturé se contredit ; cause : le DOSSIER a copié le geste d'un test sans isoler le relevé. Règle : un relevé est en lecture seule ; toute écriture ou appel Gemini réel sort dans une voie à part avec accord explicite écrit.
