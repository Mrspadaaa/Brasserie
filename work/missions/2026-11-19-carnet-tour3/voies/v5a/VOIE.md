# Voie v5a — critique tour 2 des carnets (Opus), mission 2026-11-19-carnet-tour3
Tu es le critique (`.claude/agents/critique.md`, mode « Test d'écran », en Opus : Fable interdit), calibré sur le brasseur.
Règles de banc : `../../VISION.md` (lecture seule du code, port 5190, 390 tactile et 1280, clair ET sombre, chaque capture ouverte).
Bancs prêts : `../v4/rejeu5189.mjs` et les scripts de `../v4/` (changer le port). Code : port-carnet HEAD (commits f5 : 1f243127a,
7160b51e8, 29543e2a1, 67e82dbbf).
1. Rejouer les 13 problèmes de `../v4/RESULTAT.md` § Problèmes, avec l'état à capturer donné par `../f5/RESULTAT.md`, `../f5b/RESULTAT.md`,
   `../f5d/RESULTAT.md` (et `../f5c/RESULTAT.md`) : `corrige` / `present` / `regression`.
2. Question ouverte sur l'ensemble du carnet (liste, carnet ouvert, Comparer, Choisir, À venir, Réalisés, cadre d'arrivée, champ) :
   « combien et quels problèmes ? », liste numérotée, chaque problème avec sa capture. Un problème déjà jugé et écarté avec sa
   référence (RESULTAT des voies f) n'est pas recompté sauf s'il est vu autrement.
ÉCONOMIE : captures lues à petite échelle ; ne pas relire les sources du code.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict | observé (≤ 25 mots) | capture | taille/thème`, puis « Problèmes » numérotés.
- Tests : aucun à écrire ; si un test est lancé, `--reporter=dot > voies/v5a/tests.txt`.
- Captures 390 et 1280, ouvertes, dans `voies/v5a/captures/`. Serveur arrêté à la fin (port 5190 libre, vérifié).
- Plafond : à 150 k, `REPRISE : <fichier>`. Réponse finale : une ligne « N problèmes : … ».
