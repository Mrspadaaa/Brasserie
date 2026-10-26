# Voie t11-communs — Les composants communs de la maquette dans src/ui/hopIndex/, une seule copie (#168)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un déménagement : le rendu ne change pas d'un pixel)
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t4-moteur, t9-paresseux (faites)
- Décideur en cas de doute : pilote

## Objectif
Comme le moteur en T4 : les composants communs de la maquette (`prototypes/houblons-v4/parcours/src/commun/`) **déménagent** dans l'app,
`src/ui/hopIndex/` (une seule copie). La maquette les importe désormais de là, et les écrans portés de l'app (T12 et suivantes) les
reprendront tels quels : ses choix rendus par le même code (règle n° 1). Carte d'ARCHITECTURE.md : `BarreStyle`, `JetonHoublon`, `Pictos`,
`familles` (→ `familyTokens.ts`), `Marques`, `LigneContexte`, `Legende`, `Pont`, `Onglets`, `gestes`, `nombres` et leurs feuilles de style.
**Restent dans la maquette** : ce qui dépend de sa coquille (`Cadres.tsx` emploie `PageShell` et `Sheet` de l'app avec la navigation de la
maquette ; ARCHITECTURE dit « rien : PageShell et Sheet de l'app employés tels quels »), et toute pièce qui importe `coquille/`.

## Entrées
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` (§ Fichiers et leur place dans l'app) ; `prototypes/houblons-v4/parcours/src/commun/` (et `index.ts`).
- Les importeurs (leçon L17 : `grep` de l'ancien chemin sur tout le dépôt avant d'écrire) : 34 fichiers de `parcours/src/`, `work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs`,
  et ce que le `grep` trouvera d'autre.
- `src/ui/hopIndex/` (T3, T8, T9 y ont des fichiers : ne les modifie pas).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/hopIndex/` : fichiers neufs seulement (les composants déménagés et leurs styles)
- `prototypes/houblons-v4/parcours/src/commun/` (les fichiers en sortent ; ceux qui restent restent), `prototypes/houblons-v4/parcours/src/**` (chemins d'import seulement)
- `work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs` (chemin seulement), `prototypes/houblons-v4/parcours/ARCHITECTURE.md` (les lignes faites)
- `tests/unit/hopIndexV4/` (un test de rendu neuf : `Pictos`, `JetonHoublon`, `familyTokens`)
- `prototypes/houblons-v4/maquettes/parcours/` (construction)
- `work/missions/2026-10-25-integration-houblons/voies/t11-communs/`

## Consignes
1. Déplace avec `git mv`. Imports relatifs ; les alias de la maquette (`@app/`) deviennent des chemins de l'app.
2. Le rendu ne change pas : la batterie entière (46/46, dont teinte, traits, pictos, légende v2a) et les 141 états de ses choix le prouvent.
3. Rien de plus au démarrage de l'app : les composants ne sont importés que par la maquette, les tests et le chunk des outils.
4. Gemini jamais ; aucune donnée réelle ; `functions/` intact.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : ses choix rendus à l'identique (pictos au trait, couleurs des familles, légende v2a avec les barres de v2e, D140).
- Un composant de l'app réemployé apporte ses boutons (L26) : rien à changer ici, mais à garder en tête pour T12.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Écris-le tôt ; garde 15 tours pour les critères (la batterie prend ~25 min : en arrière-plan).
Réponse finale au pilote : une ligne.
