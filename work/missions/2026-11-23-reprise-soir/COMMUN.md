# Règles communes à toutes les voies (23.11 soir) — à lire en premier

- Copie de travail : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie` (branche claude/refonte-houblons-v4 = origin/main 06c430228), sauf voie frise (sa copie lot-cal).
- Plusieurs voies écrivent dans la même copie : n'écrire QUE dans ton « Possède ». Jamais `git add -A`, jamais `git stash`, jamais remettre un fichier à HEAD. Commit par chemins : `git commit -m "<msg>" -- <tes fichiers>` (index.lock : réessayer une fois après 5 s). Pas de push, pas de déploiement, pas d'écriture sur les données réelles.
- Interdit : src/domain/stock, src/ui/stock (autre session). Ne jamais build dans `dist/` de cette copie (le pilote build) ; `npx tsc --noEmit -p .` et `npx vitest run <tes fichiers>` suffisent.
- Navigateur : uniquement le Chrome de débug déjà ouvert (port 9222) par puppeteer-core `connect({browserURL:'http://127.0.0.1:9222'})`, dans TON onglet neuf ; à la fin `page.close()` de ton onglet puis `browser.disconnect()`. JAMAIS `browser.close()`, jamais fermer Chrome, jamais l'extension « Claude in Chrome ». S'il n'écoute pas sur 9222 : ne pas le lancer toi-même, le dire.
- Captures à 390 px de large, entières, OUVERTES (Read) avant tout OK. Une capture non regardée ne prouve rien (L12).
- Gemini : jamais dans npm test (toujours simulé). Appel réel seulement si ta voie le permet, coût estimé AVANT envoi, chaque appel journalisé dans `work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl` (une ligne JSON : date, tache, url, modele, cout_chf). Budget total restant ≈ 3,3 CHF pour toutes les voies.
- Répondre en français. Fin : une ligne « RESULTAT <voie> : OK|ECHEC — <preuves> — commits <hash> » et RESULTAT.md dans ton dossier de voie (fait, preuves, captures, restes, `LEÇON PROPOSÉE :` / `CONNAISSANCE :` si besoin).
- Plafond de contexte : à 350 k, écris REPRISE.md dans ton dossier et rends « REPRISE : <fichier> ».
