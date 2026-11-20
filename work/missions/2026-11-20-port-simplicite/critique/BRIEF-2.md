# Critique, passe 2 — test d'écran après corrections (mode « Test d'écran » de `.claude/agents/critique.md`)

Modèle : opus (Fable interdit). Racine `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, non commitée, non déployée. Question : « combien et quels problèmes ? », liste numérotée (choix, format, ce qu'on voit, gravité B/G/D, capture).
Contexte : `critique/BRIEF.md` (ses choix, ses mots, la maquette), `critique/RESULTAT-A.md` et `RESULTAT-B.md` (28 problèmes de la passe 1). Corrections : `voies/v-corr-depense/RESULTAT.md`, `voies/v-corr-pl2pe1/RESULTAT.md`, `voies/v-corr-pb/RESULTAT.md`, `voies/v-corr-mesure/RESULTAT.md` (chacune dit corrigé ou écarté par problème, avec ses bancs et scripts).

## À faire, dans l'app réelle (`npx vite --port 3151 --strictPort`, ?dev-local, fixtures « ZZ TEST », lecture simulée, jamais Gemini)
1. Rejouer les 3 bloquants de la passe 1 par le geste : pa1 TVA à deux taux, pa2 « Relier les N comme avant », pm1 écart à la cible. Corrigé ou non.
2. Vérifier chaque problème marqué « corrigé » (une capture par problème, ouverte) ; un « écarté » : la raison tient-elle face à sa maquette ?
3. Combler ce qui n'a été vu par personne : pb1/pb2 en 390 cave ; Dépense (pa1+pa2+pl1) en 1280 clair et 390 cave ; pe1 par le geste en 1280 et en cave ; pl2 en 390 cave et 1280.
4. Problèmes nouveaux introduits par les corrections.
Utilise les scripts de banc des voies ; ne réécris pas un banc. Plafond de tours : écris `critique/RESULTAT-2.md` AU FIL (après chaque point), captures dans `critique/captures-2/`, aucun code. Arrête ton serveur. Rends une ligne : « N problèmes (b bloquants) — critique/RESULTAT-2.md ».
