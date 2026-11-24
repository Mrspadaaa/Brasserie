# Voie bandeau — « Enregistrement sur le serveur… » ne couvre jamais rien et ne reste pas

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis DOSSIER.md À LA PLACE des sources brutes ; ouvre ses captures.

## Économie
- Mécanique : aucune.
- Gestes : grep de l'avis et de son état ; un script par lot ; tests dans un fichier.

## À faire
1. Cause en tête de RESULTAT.md : pourquoi l'avis reste affiché (dès 19:29 sur sa capture, et déjà vu au Calendrier : « bandeau Enregistrement… qui reste ») et pourquoi il est posé sur les onglets.
2. Tests rouges AVANT (tests-rouge.log) : l'avis n'apparaît que pendant une écriture réelle ; il disparaît à sa fin (ou dit l'échec) ; il ne recouvre jamais un contrôle ni du contenu (place réservée ou petite pastille dans un coin libre, comme l'avis « Nouvelle version » placé en bas) ; puis correctif, vert.
3. Registre : ligne neuve BD-1 (m) à work/missions/BUGS.md → « corrigé en local <hash> » ; BUGS OK.

## Critères
- tsc : aucune erreur neuve ; tests touchés verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : le composant de l'avis d'enregistrement et son état (src/ui/PersistenceStatus.tsx ou celui que grep trouve, src/services/firestoreRepo.ts pour l'état seulement) ; tests/unit/ que tu crées ; ligne BD-1 ; ton dossier. Ne touche pas src/ui/carnets, src/domain/carnets, functions/ (autre voie), src/domain/stock, src/ui/stock. Ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > tests.log 2>&1; tail -5 tests.log (dans ton dossier).
