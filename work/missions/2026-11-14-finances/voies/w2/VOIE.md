# Voie w2 — Identifiants bruts (TX-…, cashComplete) dans les réponses du compagnon Finances

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : b37600f5 (en ligne)
- Décideur en cas de doute : pilote

## Objectif
Identifiants bruts (TX-…, cashComplete) dans les réponses du compagnon Finances.

## Entrées
- Registre de la mission : `work/missions/BUGS.md` (lignes FN-22 à FN-26) ; constats du jeu de nuit : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md` (lignes 22, 24, 25, 26 et leur REJEU) ; corrections déjà faites : `work/missions/2026-11-14-finances/voies/u2/RESULTAT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/domain/finance/assistantContext.ts`
- `src/ui/finance/compagnon`
- `src/ui/finance/FinanceAssistant.tsx`
- `tests`
- `work/missions/2026-11-14-finances/voies/w2`

## Consignes
Pour chaque point : d'abord un test qui échoue sur HEAD (le dire dans RESULTAT.md), puis la correction, puis le test vert. Jouer d'abord le chemin du testeur au banc.
- L'Aide au brasseur voit des identifiants bruts (`TX-…`, `cashComplete`) dans les réponses du compagnon Finances. Trouver d'où ils viennent (contexte envoyé par `assistantContext.ts`, consigne, rendu) ; le contexte envoyé nomme les pièces par leurs mots (fournisseur, date, montant) et les drapeaux en français (« caisse complète » ou rien), jamais un identifiant interne ; si une référence est nécessaire pour un lien, elle reste hors du texte que le modèle peut recopier. Si la cause est dans `functions/` (serveur), ne pas y toucher : écrire le diff exact dans RESULTAT.md (DEMANDE PILOTE).
- Gemini jamais appelé : tests sur le contexte construit (aucun « TX- », aucun nom de champ anglais).
- Captures 390 et 1280, clair et cave, de chaque point visible, dans `work/missions/2026-11-14-finances/voies/w2/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/w2/emulateur.txt`.
- La ligne « Tests » : `npx vitest run tests/integration/compagnonContexte.test.tsx tests/unit/assistantContextSansId.test.ts --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/w2/tests.txt`.
Réponse finale au pilote : une ligne.
