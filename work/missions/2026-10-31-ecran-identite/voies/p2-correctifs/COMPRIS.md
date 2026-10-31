# Compris : voie p2-correctifs

## Objectif
Corriger dans l'app les 11 écarts du critique (`critique/VERDICT-port.md`) pour que l'étape Identité garde r4-a, aussi quand on la touche : alertes redites retirées du premier plan, sources et liens simplifiés, fermenteur et volume repliés, bandeau sur une ligne à 1280, focus des nombres en trait plein, colonne alignée si les autres étapes sont à 560 px, et « Abandonner » sur la ligne du titre. Chaque état doit ressembler à sa capture de r4-a, à 390 et à 1280. La base est `v1/r4-a/etat.html` et sa NOTE, pas une interprétation libre.

## Écrit dans
- `src/pages/BrewWizard.tsx`
- `src/pages/recipe-wizard.css`
- `src/ui/identite/`
- `tests/unit/identite/`
- `work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/`

## Fini quand
- Les contrôles de la capture sont ajoutés d'abord et échouent avant toute correction ; la ligne `IDENTITE ECHEC n` est recopiée dans RESULTAT.md sous « TEMOIN AVANT : ».
- Après correction, les 11 écarts sont traités dans l'ordre du verdict, chacun avec sa capture ouverte.
- G1 : `npm run build` affiche `built in`.
- G2 : les tests `tests/unit/identite` passent (`TESTS IDENTITE OK`).
- G3 : la série Chrome dans `captures/r3/` affiche `IDENTITE OK`, avec les captures ouvertes (vide, clavier, repères, fermenteur 60, profil, repos 1280, côte à côte avec r4-a).
- G4 : RESULTAT.md contient « TEMOIN AVANT : IDENTITE ECHEC », « baseline » et « Rien ne se perd ».
- G5 : le contrôle de registre `ecrans-app.json` affiche `REGISTRE OK`.
- La baseline des autres étapes est lancée, sans `--prendre` ; chaque écart nouveau est nommé avec sa cause.
- RESULTAT.md ligne 1 : `OK` ou `ECHEC`, avec « IDENTITE OK (n contrôles), 11 écarts traités ».

## Ne fait pas
- Ne modifie ni VOIE.md, ni GATES.md, ni `voies/p1-port/`.
- Ne touche pas à `ecrans.json`, `ecrans-app.json`, `functions/`, `.codex/`, `source4-portable-bundle-manifest-01.json`, et ne lit pas `functions/.env`.
- Pas de `git stash`, pas de commit, pas de push, pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`.
- Pas de données réelles, pas d'appel hors localhost, pas de Gemini, pas de cockpit, pas de `type="number"`, pas de texte sous 12 px.
- Ne retire rien ailleurs dans l'app.
- Ne reprend pas les références de la baseline (`--prendre`) : c'est le pilote qui le fait.
- Pas de code écrit par heredoc ni par `node -e`.

## Doutes
- Le fichier du bandeau de l'assistant (n° 4) peut vivre hors de `BrewWizard.tsx`. Le chemin n'est pas connu d'ici ; s'il existe, il faut le modifier et le nommer dans RESULTAT.md, et il n'est pas dans la liste « Écrit dans » tant qu'il n'est pas identifié.
- Le n° 6 dépend d'une mesure : si toutes les étapes sont à 740 px, rien ne change et c'est dit dans RESULTAT.md. La mesure n'a pas encore été faite.
- Je n'ai pas lu les fichiers cités (`r4-a`, `VERDICT-port.md`, `capturer-identite.mjs`) ; je n'ai donc pas vérifié leur contenu, seulement leur rôle décrit dans VOIE.md.
- Le port de la capture (5613) et celui de la baseline (5614) diffèrent ; aucun conflit apparent, mais à surveiller si un serveur tourne déjà.
