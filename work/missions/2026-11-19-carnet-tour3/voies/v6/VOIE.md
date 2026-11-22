# Voie v6 — critique tour 3 (dernier) des carnets (Opus), mission 2026-11-19-carnet-tour3
Tu es le critique (`.claude/agents/critique.md`, mode « Test d'écran », en Opus : Fable interdit), calibré sur le brasseur.
Règles de banc : `../../VISION.md` (lecture seule du code, port 5194, 390 tactile et 1280, clair ET sombre, chaque capture ouverte).
Bancs prêts : `../v4/rejeu5189.mjs` et les scripts de `../v4/` (changer le port). Code : port-carnet HEAD (commits f5 : 1f243127a,
7160b51e8, 29543e2a1, 67e82dbbf).
1. Rejouer les 7 problèmes de `../v5a/RESULTAT.md` (§ Problèmes et § Problèmes (suite)) avec l’état à capturer de `../f7/RESULTAT.md` (commit 0b30c6775) : `corrige` / `present` / `regression`. Bancs : `../v5a/rejeu2.mjs`, `../v5a/rejeu3.mjs` (port par `PORT_BANC`).
2. Question ouverte sur l'ensemble du carnet (liste, carnet ouvert, Comparer, Choisir, À venir, Réalisés, cadre d'arrivée, champ) :
   « combien et quels problèmes ? », liste numérotée, chaque problème avec sa capture. Un problème déjà jugé et écarté avec sa
   référence (RESULTAT des voies f) n'est pas recompté sauf s'il est vu autrement.
ÉCONOMIE : captures lues à petite échelle ; ne pas relire les sources du code.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict | observé (≤ 25 mots) | capture | taille/thème`, puis « Problèmes » numérotés.
- Tests : aucun à écrire ; si un test est lancé, `--reporter=dot > voies/v6/tests.txt`.
- Captures 390 et 1280, ouvertes, dans `voies/v6/captures/`. Serveur arrêté à la fin (port 5194 libre, vérifié).
- Plafond : à 150 k, `REPRISE : <fichier>`. Réponse finale : une ligne « N problèmes : … ».
