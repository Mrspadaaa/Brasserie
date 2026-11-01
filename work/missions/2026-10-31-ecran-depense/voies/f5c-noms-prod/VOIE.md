# Voie f5c-noms-prod — la tâche `traduireNoms` d'aiTask et son client, tels que mesurés au banc (D278, D280)

Agent : `auteur` (Sonnet). Plafond : 70 tours. Pilote : Opus. Aucun commit, aucun déploiement, aucun Gemini réel (simulé partout ; les tests
ne l'appellent jamais). Relire `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md` (sauf « Deux temps » : ici le geste est mesuré et
tranché, D280 ; et sauf « L'écran n'est pas refait ici » : tu ne touches pas l'écran).

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- D271 : « Langue utilisée pour les factures, allemand, anglais, français, italien. Ça traduits en français et fait le bon lien ».
- D275 : « Il y a plein de problème sur cette vue, déjà pas de traduction. »
- D278 : « Pour ce dernier, il faudra modifier aiTask, à mesurer au banc j'autorise ce changement ».

## Ce qui est tranché (D280, lire la ligne dans `work/refonte-frontend/decisions.md`)
- Un appel **texte seul**, à part de la lecture, sur les noms de base (`lireOptions(name, variant, unit).base`, `src/ui/depense/optionsDuNom.ts`),
  entrée par ligne `{ i, base, kind, stockCategory }`, bases dédoublonnées ; ni image, ni montant, ni quantité.
- Modèle `gemini-3.8-flash`, réflexion au plus bas, température 0 ; la consigne et le schéma **mot pour mot** ceux du banc mesuré
  (`SYSTEME_NOMS_FR`, `NOMS_SCHEMA`, le plafond de sortie `600 + 36 × noms`, `scripts/banc-noms-fr.ts`) : aucune retouche.
- La lecture (`scanInvoice`) ne change pas d'un octet.

## À faire
1. `functions/src/prompts.ts` : `TaskId` et `TASKS.traduireNoms` (`system`, `schema`, `acceptsFile: false`, plafond de sortie). Lire comment
   le chemin générique d'aiTask (`functions/src/ai.ts`) prend une tâche : budget réservé, essais, routage de modèle (`functions/src/models.ts` :
   la 3.8 doit être celle qui répond ; dire comment tu l'as vérifié), plafond d'entrée. Un test (côté des tests existants de `functions/`, ou
   `tests/unit/`) prouve : la consigne et le schéma égaux à ceux du banc (le test importe les deux) ; `scanInvoice` inchangé (sa consigne, son
   schéma, son plafond identiques à HEAD : instantané pris sur HEAD).
2. `src/services/aiClient.ts` : `'traduireNoms'` dans `AiTaskId`, rien d'autre.
3. `src/services/nomsFr.ts` (neuf) : `traduireLignes(lignes, { stock, enLigne, run })` → `Map<rang, nameFr>`.
   - Base par `lireOptions` ; clé `cleBase` (la même forme canonique que le banc, importée d'un module pur : ne recopie pas `scripts/` dans
     `src/` sans test d'égalité).
   - Une table locale (Dexie, **base à part** `laffinee-noms`, jamais une version de la base principale ; modèle `proofQueueStore.ts`) :
     `cleBase → { nameFr, le, par: 'ia' | 'brasseur' }`. Une base déjà dans la table, ou dont la ligne est reliée à un article du stock
     (le nom de l'article sert), n'appelle rien. Une traduction tapée par le brasseur (`par: 'brasseur'`) n'est jamais écrasée.
   - Hors ligne, échec, réponse illisible, `i` absent : rien, le nom imprimé reste ; jamais d'exception vers l'appelant ; un seul appel par
     pièce ; aucun nouvel essai en boucle.
   - Sans IndexedDB (jsdom) : pas de table, l'appel simulé marche quand même.
4. Le branchement à l'écran est au pilote (l'écran f3 écrit `ExpenseSheet.tsx`, `src/ui/depense/**`, `purchasePrefill.ts`) : rends dans
   RESULTAT.md le code exact, ancré par son texte, pour (a) appeler `traduireLignes` après la lecture, sans attendre, (b) poser `nameFr` sur les
   lignes du brouillon (champ facultatif, que f3 prévoit), (c) enregistrer `par: 'brasseur'` quand il retouche le nom d'une ligne.
5. Tests rouges d'abord (`tests/unit/depense/noms-fr/**`), Gemini simulé : table vide → un appel, la Map ; table pleine → aucun appel ;
   ligne reliée → aucun appel pour elle ; hors ligne → aucun appel ; échec → Map vide sans exception ; `par: 'brasseur'` gardé ;
   dédoublonnage (deux lignes, même base → une entrée) ; réponse avec un `i` inconnu ou répété → ignoré.

## Critères (rejoués par le pilote)
- `npx vitest run tests/unit/depense/noms-fr <le test de functions/ que tu écris> tests/unit/banc-noms-fr-texte.test.ts --maxWorkers=2` verts,
  et rouges d'abord (dis la sortie du témoin).
- `npx tsc --noEmit -p tsconfig.json` et la compilation de `functions/` (`npm --prefix functions run build`, ou la commande de son
  `package.json`) sans erreur.
- `git status --short` : rien hors de « Possède ».

## Possède
`functions/src/prompts.ts` (la tâche neuve seulement), `functions/src/models.ts` (une ligne de routage si nécessaire), le test de `functions/`
que tu écris, `src/services/aiClient.ts` (`AiTaskId`), `src/services/nomsFr.ts` (neuf), un module pur neuf pour `cleBase` si besoin
(`src/domain/nomsBase.ts`), `tests/unit/depense/noms-fr/**`, `work/missions/2026-10-31-ecran-depense/voies/f5c-noms-prod/**`.

## Rendre
`RESULTAT.md` (ligne 1 `OK — …` ou `ECHEC — …`) selon COMMUN.md, avec le code des branchements du pilote et la commande de déploiement
ciblée d'aiTask (que le pilote lancera, pas toi). Réponse au pilote : une ligne.
