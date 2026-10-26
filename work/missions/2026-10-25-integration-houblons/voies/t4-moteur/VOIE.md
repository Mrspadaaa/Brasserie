# Voie t4-moteur — Le moteur v4 dans src/domain/hopIndex/v4/, une seule copie (#163)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t1-branche-verte, t3-pile, t14-url (faites)
- Décideur en cas de doute : pilote

## Objectif
Le moteur v4 (`prototypes/houblons-v4/src/engine/`, 22 fichiers, et `prototypes/houblons-v4/src/style/`) et ses données
(`prototypes/houblons-v4/data/*.json`, avec leur source) **déménagent** dans l'app : `src/domain/hopIndex/v4/` et `src/data/hopV4/`.
Une seule copie : la maquette et les tests du prototype importent désormais le moteur depuis `src/` (pas de couche parallèle,
CLAUDE.md « finir ou brancher plutôt qu'ajouter »). Rien de plus au démarrage de l'app : le moteur n'est importé que par la maquette
et les tests tant qu'aucun écran n'est porté.

## Entrées
- `cerveau/decisions/2026-10-25-integration-architecture.md` (§ Recommandation, ordre T4) ; `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md` (B2, B3, B4, B8, Mesures).
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` (§ Fichiers et leur place dans l'app : `src/domain/hopIndex/v4/`).
- `prototypes/houblons-v4/src/engine/`, `prototypes/houblons-v4/src/style/`, `prototypes/houblons-v4/src/pack/` (dire ce qu'il devient),
  `prototypes/houblons-v4/data/` (`copies-de-work.mjs` dit d'où vient chaque fichier).
- Les importeurs : `prototypes/houblons-v4/parcours/src/**`, `prototypes/houblons-v4/tests/**`, `prototypes/houblons-v4/parcours/outils/portabilite.mjs`.
- `vite.config.ts`, `tsconfig.json`, `scripts/check-private-research.mjs`, `scripts/check-hop-budget.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/domain/hopIndex/v4/` (neuf), `src/data/hopV4/` (neuf)
- `prototypes/houblons-v4/src/` (les fichiers déplacés en sortent ; un `LISEZMOI.md` y dit où ils sont)
- `prototypes/houblons-v4/data/` (idem), `prototypes/houblons-v4/parcours/src/**` (chemins d'import seulement)
- `prototypes/houblons-v4/tests/**` (chemins d'import seulement), `prototypes/houblons-v4/parcours/outils/portabilite.mjs` (chemins),
  `prototypes/houblons-v4/parcours/ARCHITECTURE.md` (la ligne du moteur), `prototypes/houblons-v4/maquettes/parcours/` (construction)
- `work/missions/2026-10-25-integration-houblons/voies/t4-moteur/`

## Consignes
1. Avant de toucher : rejoue `npx vitest run prototypes/houblons-v4/tests`, `npm run build` et note le démarrage de
   `node scripts/check-hop-budget.mjs --dist dist --boot index,App,firebase --step Host` (aujourd'hui B1 = 919 ko gzip) dans RESULTAT.md.
2. Déplace avec `git mv` (l'historique suit). Imports relatifs, aucun alias, aucun `process.env` (B3, B4). Les JSON vont dans
   `src/data/hopV4/` avec leur source ; `copies-de-work.mjs` suit.
3. Rien de neuf au démarrage : aucun fichier de `src/` hors maquette et tests n'importe encore le moteur. Le chargement à la demande
   viendra avec les écrans (T9) ; ne crée pas d'import au démarrage.
4. `scripts/check-private-research.mjs` doit passer (il contrôle ce que `src/` peut contenir) : si un JSON y est refusé, dis pourquoi
   dans RESULTAT.md et ne contourne pas la règle.
5. Rejoue la maquette entière : `node prototypes/houblons-v4/parcours/outils/batterie.mjs` → BATTERIE OK (46 lignes) et
   `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` → ETATS OK.
6. Gemini jamais ; aucune donnée réelle ; ne touche pas aux écrans de la maquette au-delà des chemins d'import.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : la maquette rend exactement la même chose après le déménagement (batterie et états verts).
- L'inconnu n'est jamais 0 ; hors ligne et données préservés ; rien de supprimé (déplacé, pas effacé).
- Fini veut dire branché, typé, testé, build vert (L11).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Écris-le tôt et complète-le au fil des étapes. Réponse finale au pilote : une ligne.
