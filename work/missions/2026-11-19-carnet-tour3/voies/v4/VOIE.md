# Voie v4 — test d'écran des carnets corrigés (critique Opus), mission 2026-11-19-carnet-tour3
Tu es le critique (`.claude/agents/critique.md`, mode « Test d'écran », en Opus : Fable interdit), calibré sur le brasseur
(`work/refonte-frontend/v4/SPEC-BRASSEUR.md`, portrait du critique). Règles de banc : `../../VISION.md` (lecture seule du code,
webapp-testing, port 5187, 390 tactile et 1280, clair ET sombre, chaque capture ouverte avant de juger). Code : port-carnet HEAD.
À juger, chaque id avec l'état à capturer donné dans :
- `../f2/RESULTAT.md` (15 PCN, commits bfd8cfae8, 013bcdbca ; captures déjà prises dans `../f2/captures/` : les ouvrir, ne refaire que les manquants) ;
- `../f4b/RESULTAT.md` (commit a44245e81) dont sa « DEMANDE EXECUTANT » : PCN-62, 63, 102 (captures), PCN-71, PCN-116 (thème sombre) ;
- `../f4c/RESULTAT.md` (commit 982f2d370).
Verdict par id : `corrige` / `present` (ce qu'on voit, mot pour mot) / `regression` (cassé par le correctif).
Puis, sur l'ensemble du carnet (liste, carnet ouvert, Comparer, À venir, Réalisés, cadre d'arrivée), la question ouverte :
« combien et quels problèmes ? », liste numérotée, chaque problème avec sa capture. Rien de bloquant n'est tu.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict | observé (≤ 25 mots) | capture | taille/thème`, puis « Problèmes » numérotés.
- Tests : aucun à écrire ; si un test est lancé, `--reporter=dot > voies/v4/tests.txt`.
- Captures 390 et 1280, ouvertes, dans `voies/v4/captures/`. Serveur arrêté à la fin (port 5187 libre).
- Plafond : à 170 k, `REPRISE : <fichier>`. Réponse finale : une ligne « N problèmes : … ».
