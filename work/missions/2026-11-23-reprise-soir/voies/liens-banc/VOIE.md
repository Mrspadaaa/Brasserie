# Voie liens-banc — clore le banc de 63 liens avec la règle D449 (9 relectures Hydrogen restantes)

- Agent : executant ; Modèle : haiku ; Niveau : mécanique ; Plafond : 60 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes.

## Économie
- Mécanique : tout — une commande du banc, réponses déjà payées rejouées du cache.
- Gestes : un seul lancement du banc, sortie dans un fichier, puis le tableau.

## À faire
1. Lire l'usage de scripts/banc-liens.ts (`--help` ou l'en-tête), puis relancer le banc complet de 63 liens avec la règle d'après (D449), IA réelle, budget cumulé de la voie liens-modeles porté à 0,40 CHF (0,265 déjà dépensés) ; sortie dans voies/liens-banc/banc.log.
2. Écrire dans RESULTAT.md le tableau avant/après par champ (prix, nom, photo, caractéristiques, HT dit, livraison CH, inventions), le coût par lien et p50/p90, et la liste des 9 liens relus (n°, ce qui a changé).

## Critères
- 24/24 relectures de la règle payées ou servies du cache ; 0 invention ; dépense de la voie ≤ 0,40 CHF au journal work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl ; fin « BANC COMPLET <prix a/b, caract c/d, inventions e> ».

OWNS : ton dossier de voie ; mesures écrites par le banc ; lignes ajoutées au journal IA. Ne modifie aucun code.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : sans objet (banc) ; le banc écrit dans un fichier, lu par tail (équivalent --reporter=dot).
