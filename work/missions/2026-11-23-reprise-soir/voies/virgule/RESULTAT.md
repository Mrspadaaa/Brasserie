OK — controle-virgule.mjs : 3 faux positifs levés, 7 → 0, vraies violations toujours signalées

## Fichiers écrits
- `scripts/agents/controle-virgule.mjs` (OWNS)
- `work/missions/2026-11-23-reprise-soir/voies/virgule/` : `temoins.mjs`, `temoins.log`, `tests.log`, ce RESULTAT.md. Aucun fichier de src/ ni tests/ touché (les `M src/…` du `git status` sont ceux de c52-fix).

## Les 3 formes (sans poser de « virgule-ok » dans src/)
1. Constante d'espace (`${nf(q)}${NB}kg`, murAutres.ts ×4) : `constanteEspace` : l'expression est un identifiant dont la dernière définition visible est une `const` initialisée par un littéral fait d'espaces seulement (insécable, fine, ` `…). Un chiffre dans le littéral, un `let`, une définition postérieure à l'usage : violation.
2. `chf` (EssaiPrix.tsx ×2) : `virguleDecimale` : un formateur est à virgule s'il porte `split('.')` ET un gabarit `…},${…}` (virgule collée entre deux interpolations). L'une seule des deux marques, `${e}.${d}` ou `${e}, ${d}` (liste) : pas à virgule.
3. `const kppm = cond ? Math.round(x) : null` (WaterRadar.tsx) : `variableEntiere` : `const` dont toutes les branches (ternaires imbriqués et `??` suivis) sont null/undefined ou un entier prouvé par les règles ENTIER existantes. `Math.round(x*10)/10`, une branche `a / 3`, un `let`, un paramètre : violation.
   Portée : la recherche de la définition remonte depuis l'usage ; passé une fonction de premier niveau (function ou composant fléché), seules les constantes de colonne 0 restent visibles (une `const k` d'un autre composant ne couvre pas un paramètre `k`).

## Critères
- `node scripts/agents/controle-virgule.mjs` → `VIRGULE OK` (7 → 0).
- `node work/…/virgule/temoins.mjs` (temoins.log) → `TÉMOINS OK`, 37 lignes OK : 20 négatifs signalés (point décimal brut, littéral 12.5, toFixed, String, division, `Math.round(x*10)/10`, `let`, définition tardive, autre fonction, formateur split seul / `${e}.${d}` / liste, formateur inconnu…), 8 positifs acceptés (les 3 formes + variantes), 8 « mord » : le contrôle de HEAD signale chaque positif (le témoin sait échouer), et `controler()` sur src/ = 0.
- `npx vitest run tests/unit/virgule* tests/unit/rejeu-649b/virgule* --reporter=dot` (tests.log) : le motif `tests/unit/virgule*` ne trouve rien (le test vit dans `tests/unit/rejeu-649b/virgule-transversale.test.ts`) ; ce fichier : 1 fichier, 8 tests verts.
- Aucun fichier de src/ modifié par la voie ; commit par chemins.

## Essais, doutes, limites
- Essais : 1 par critère (pas d'échec à relancer). Une correction de ma part en cours de route : la portée des définitions (voir ci-dessus), ajoutée avec ses deux témoins négatifs.
- Limite : la constante d'espace et l'entier se lisent dans le même fichier ; une `NB` importée d'un autre module resterait signalée (cas absent aujourd'hui). La recherche de portée est une heuristique par colonne 0, pas un analyseur syntaxique ; elle penche vers le signalement.
- Le test rejeu-649b rejoue le contrôle sur tout src/ : il reste vert tant que c52-fix n'écrit pas de nombre au point.

CONNAISSANCE : le contrôle de virgule reconnaît maintenant trois écritures justes de plus (gabarit `,${d}` après `split('.')`, constante d'espace, `const` entière à branches entières/null) ; un nombre au point décimal reste fautif.
LEÇON PROPOSÉE : aucune
