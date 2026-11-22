# Voie v5b — critique de la Dépense corrigée (Opus), mission 2026-11-19-carnet-tour3
Tu es le critique (`.claude/agents/critique.md`, mode « Test d'écran », en Opus : Fable interdit), calibré sur le brasseur.
Règles de banc : `../../VISION.md` (lecture seule du code, port 5193, 390 tactile et 1280, clair ET sombre, chaque capture ouverte
à petite échelle). Banc prêt : `../v3/outil.mjs` (port par `PORT_BANC`), `../v3/vite.v3.config.mjs`, `../v3/finals.ts` ; ne pas réécrire de banc.
1. Rejouer chaque id avec l'état à capturer de `../f6a/RESULTAT.md` (84551fc8e) et `../f6b/RESULTAT.md` (f568f3f00…aaf52d272) :
   LR1-5, v3-3, v3-4, LR3-3, LR2-3, LR1-9, v3-1, LR1-6, v3-5, LR1-7, v3-2, v3-7/v3-8 (« supprimer » atteint au doigt une fois la ligne ouverte).
2. Les états non joués par v3 : E1-2, BR-27, TE-35, TE-36, LR1-14, BE-23 (`../v3/VOIE.md` points 6 à 9).
3. Question ouverte sur la Dépense (saisie à la main, lecture, confirmation) : « combien et quels problèmes ? », liste numérotée avec capture.
Verdicts : `corrige` / `present` / `regression`.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict | observé (≤ 25 mots) | capture | taille/thème`, puis « Problèmes » numérotés.
- Tests : aucun à écrire ; si un test est lancé, `--reporter=dot > voies/v5b/tests.txt`.
- Captures 390 et 1280, ouvertes, dans `voies/v5b/captures/`. Serveur arrêté à la fin (port 5193 libre, vérifié).
- Plafond : à 150 k, `REPRISE : <fichier>`. Réponse finale : une ligne « N problèmes : … ».
