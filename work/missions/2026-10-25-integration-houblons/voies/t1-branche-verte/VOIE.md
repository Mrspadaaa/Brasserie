# Voie t1-branche-verte — Un houblon inconnu ne plante plus Ma bière ; les tests du moteur dans npm test (#160)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 70 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Premier geste du verdict du conseil (D65) : (1) un ajout dont le houblon est inconnu du moteur (`inconnu:<nom>`, par exemple
le Hallertau d'une vraie recette) rend un arôme « non simulé », jamais une exception ; (2) les tests de
`prototypes/houblons-v4/tests/` tournent avec le Vitest de la racine (`npm test`) ; (3) le parcours existant wizard → `hopV55`
→ retour est joué dans Chrome sur fixture, sans rien écrire, pour savoir si `DraftFreshnessChoice` surgit au retour.

## Entrées
- `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md` — R1, R2, R6 (avec la correction de la relecture).
- `cerveau/decisions/2026-10-25-integration-architecture.md` — § Premier geste.
- `prototypes/houblons-v4/parcours/src/moteur/index.ts` (lignes 184 et 214), `prototypes/houblons-v4/parcours/src/integration/conversion.ts`.
- `prototypes/houblons-v4/tests/` (dont `conversion-recette.test.ts`, 2 rouges sur HEAD), `prototypes/houblons-v4/vitest.config.*` s'il existe.
- `vitest.config.ts` (racine), `package.json` (scripts).
- `src/pages/useFullScreenRoute.ts`, `src/pages/BrewWizard.tsx` (lignes 462-470, 1410-1437, 2705-2720), `src/App.tsx` (vers la ligne 971).
- `cerveau/agents/verification-locale.md` — lancer l'app en local (`?dev-local`) pour le parcours Chrome.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/src/moteur/index.ts`
- `prototypes/houblons-v4/tests/` (un test neuf ; réparer un test existant seulement s'il teste l'ancienne exception)
- `vitest.config.ts`
- `work/missions/2026-10-25-integration-houblons/voies/t1-branche-verte/` (RESULTAT.md, captures du parcours)

## Consignes
1. Écris d'abord le test (un ajout `inconnu:hallertau` passé à `lireBiere` rend la bière lue, l'ajout marqué non simulé, sans
   exception) et montre-le **rouge sur HEAD** (L13). Note la sortie dans RESULTAT.md.
2. Corrige `houblon()` / `lireBiere` : l'inconnu reste `null` avec sa raison, jamais 0 ni une valeur inventée. Les autres
   appels qui demandent un houblon inconnu gardent leur comportement s'ils le gèrent déjà.
3. Ajoute `prototypes/houblons-v4/tests/**` à la porte de `vitest.config.ts`. Si ces tests demandent des alias propres au
   prototype, mets-les dans `vitest.config.ts` seulement (jamais dans `vite.config.ts` de l'app). Gemini n'est jamais appelé.
4. Parcours Chrome (sans écrire de code de l'app) : app locale sur fixture (`?dev-local`), wizard → étape Houblons → atelier
   V5.5 → retour. Capture avant et après le retour, ouvre-les (L12), et écris ce que tu vois : étape retrouvée ?
   `DraftFreshnessChoice` ? brouillon intact ?
5. Une autre voie construit `prototypes/houblons-v4/maquettes/parcours*` : ne construis pas la maquette. Scripts de travail
   dans `os.tmpdir()`.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- L'inconnu n'est jamais 0 (honnêteté des données) ; aucune donnée réelle ; rien de supprimé.
- Fini veut dire branché, typé, testé, build vert (L11).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec les sections `## Témoin` (le test rouge sur HEAD) et `## Parcours wizard` (captures et
constat). Réponse finale au pilote : une ligne.
