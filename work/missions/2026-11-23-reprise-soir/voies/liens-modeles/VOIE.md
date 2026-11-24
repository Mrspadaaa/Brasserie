# Voie liens-modeles — Escalader par Neon, Hydrogen automatique dès qu'un champ manque, mesuré au banc (D449)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 120 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : le banc est une commande (scripts/banc-liens.ts), réponses en cache rejouées gratuitement.
- Gestes : grep ciblé, un script par lot ; tests et banc dans des fichiers.

## À faire
1. Plan court en tête de RESULTAT.md (fichier:ligne, règle avant/après, coût estimé par lien).
2. Code : Escalader → gemini-4-neon ; automatique : Flash-Lite, puis Hydrogen si un champ de la fiche manque encore après Flash-Lite ; tests rouge puis vert (règle d'escalade, tarif Neon).
3. Banc 63 liens : avant (règle actuelle, cache) contre après (nouvelle règle) ; et Neon sur les liens encore incomplets ; tableau par champ (prix, nom, photo, caractéristiques, devise/frais), inventions, coût et durée p50/p90 par lien. Coût réel réservé AVANT l'envoi, 0,30 CHF au plus pour toute la voie ; chaque appel au journal work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl.
4. Reprendre un à un les 2 prix faux et les 4 caractéristiques manquantes du banc : cause écrite, corrigée si c'est une règle.

## Critères
- tsc (racine et functions/) : aucune erreur neuve ; tests touchés verts ; npx vitest run tests/unit/proprietes vert ; banc après ≥ banc avant sur chaque champ, 0 invention ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> » (aiTask à déployer par le pilote).

OWNS : functions/src/lienIA.ts, lireLien.ts, models.ts (constante Neon), geminiCosts.ts (tarif Neon) ; scripts/banc-liens.ts ; le libellé du bouton Escalader et ses étapes dans src/ui/carnets/LectureLien.tsx si nécessaire ; tests/unit/ et functions/test/ que tu crées ; ton dossier de voie ; lignes ajoutées au journal IA. Ne touche pas src/ui/finance, src/ui/saisie, src/domain/finance (voie ecr7), ni src/domain/stock, src/ui/stock. Ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/liens-modeles/tests.log 2>&1; tail -5 voies/liens-modeles/tests.log
