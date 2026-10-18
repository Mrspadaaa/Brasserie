# Méthode de conception frontend — L'Affinée

Adoptée le 18.10.2026 après deux prototypes houblons refusés (v2, puis v3 arrêtée).
Elle vaut pour tout écran de l'app, pas seulement les houblons. Elle complète
[PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md),
[le guide UI](../ui-compacte.md) et [le protocole de revue UX](protocole-revue-ux.md).

## Pourquoi cette méthode

Les échecs de la v2 et de la v3 ont trois causes vérifiées (décisions D17 à D19) :

1. **Des substituts ont jugé à la place du brasseur** : contrôles automatiques et
   relecteurs Fable étaient au vert, le brasseur a refusé.
2. **Ses propres références ont été perdues** : l'inventaire n'a lu que ses messages
   directs. Les demandes relayées dans les briefs d'agents (carte Territoire, échelles
   relatives au style, bascule Barres / Radar) en sont sorties.
3. **Aucune méthode de conception outillée** : pas de parcours écrit avant les écrans,
   pas d'atelier de composants, pas de critère à nous. D'où la comparaison avec un
   site concurrent comme critère de réussite.

## Cinq principes

1. **Le brasseur juge. Tout le reste filtre.** Les contrôles et les relecteurs
   éliminent les défauts avant lui ; ils ne valident jamais à sa place.
2. **Ses mots et ses choix passés d'abord.** On relit tout le corpus : messages,
   briefs d'agents, décisions d'archive, concepts qu'il a aimés ou rejetés.
3. **Le parcours et les données avant l'apparence.** On écrit ce que le brasseur
   fait, dans quel ordre, avec quelles données et quels états, puis on dessine.
4. **Construire dans la pile de l'app, composant par composant.** React,
   TypeScript, Tailwind et les jetons de DESIGN.md, chaque état visible dans un
   atelier. Un prototype hors pile se réécrit à l'intégration.
5. **Chaque étape a un outil, une sortie et une porte.** Une étape sans sortie
   vérifiable n'est pas faite.

## Les étapes

| Étape | Sortie | Outils | Porte |
|---|---|---|---|
| E0 Besoin | Corpus complet, banque de questions, 3 à 5 scénarios chronométrables, chacun avec une citation du brasseur | Scripts d'extraction, vérification des citations mot pour mot | Chaque scénario cite le brasseur ; aucune source exclue sans raison écrite |
| E1 Références | Planche : ce qu'il a aimé, ce qu'il a refusé, pourquoi ; grammaire graphique reprise ailleurs (pour dessiner, jamais pour juger) | Captures (Chrome, galerie d'archive), Claude in Chrome en lecture seule | Chaque référence a sa citation ou sa décision |
| E2 Cadrage | Brief de surface : tâche, résultat, états, limites ; 5 à 7 structures ; tirage ; contrat de direction | Skill **impeccable** : `shape`, `concept-seed`, `surface-brief` | Contrat à 6 blocs écrit avant le code |
| E3 Modèle et données | Modèle de calcul réutilisé (pas recopié), grammaire de visualisation (échelles, encodages, palette vérifiée en daltonisme), inventaire des états (vide, chargement, erreur, incalculable) | Code du domaine (`src/domain`, `functions/src`), Vitest, contrôle de contraste (`a11y-audit`) | Calculs testés ; chaque graphique dit son échelle et son incertitude |
| E4 Atelier de composants | Chaque composant dans tous ses états, avec des données réelles, à 390 et 1280 | **Storybook** (Vite, React), jeux de données de production figés | Chaque état a son récit ; captures de référence enregistrées |
| E5 Assemblage | Le parcours complet, joué de bout en bout | Vite, mêmes composants | Les scénarios E0 se jouent sans raccourci |
| E6 Contrôles automatiques | Rapports verts | **Playwright** (scénarios joués, régression visuelle par capture), **axe-core** (accessibilité), `check-hop-*` (un toucher, règles U, budgets), `impeccable detect` | Zéro échec ; un échec bloque |
| E7 Revues | Verdicts écrits | `impeccable critique` (notation heuristique), **impeccable-finish-reviewer** (contexte neuf, contre le contrat), relecteur Fable à l'aveugle par composant (protocole de revue UX) | Zéro bloquant ouvert ; chaque correction revérifiée |
| E8 Test brasseur | Réussite, temps et hésitations par scénario, sur son téléphone, 5 minutes | Lien privé (Artifact), grille de test | C'est la porte B. Rien n'entre dans l'app avant son accord |
| E9 Documentation | Décisions, captures de référence, écart à DESIGN.md | **impeccable-documenter**, registre de mission | Décisions journalisées ; DESIGN.md modifié seulement avec son accord |

## Rôles

- **Pilote (Opus)** : besoin, cadrage, contrat, vérification des portes, intégration.
- **Constructeur** (agent Opus, contexte neuf) : E3 à E6, sur un brief et un registre
  de critères (skill `unlazy`).
- **Haiku** : extractions, captures, jeux de données ; le pilote relit.
- **Relecteurs** (contexte neuf, sans les rapports de l'auteur) : finish-reviewer
  d'impeccable, Fable à l'aveugle.
- **Le brasseur** : juge final, en 5 minutes par version, sur ses scénarios.

## Outils

| Outil | Rôle | Où | État au 18.10 |
|---|---|---|---|
| impeccable | Cadrage, tirage de structures, contrat, critique, détecteur, revue finale, documentation | `.claude/skills/impeccable` | Installé, jamais utilisé en v2 ni en v3 |
| Storybook | Atelier de composants et de leurs états | Projet de prototype isolé, avec son propre `package.json` | À installer |
| Playwright + axe-core | Scénarios joués, régression visuelle, accessibilité | Même projet isolé | À installer |
| puppeteer-core et `check-hop-*` | Un toucher, règles U, budgets | `scripts/` | Installé |
| Vitest | Calculs du domaine | App | Installé |
| a11y-audit | Contraste, accessibilité statique | `.claude/skills/a11y-audit` | Installé |
| Plugins Design et Data (Anthropic) | Recherche utilisateur, synthèse, visualisation | Catalogue claude.ai | Proposés, non installés |

Les outils de prototype vivent dans un projet isolé : le `package.json` de l'app ne
change pas avant la porte B.

## Ce qui est interdit

- Juger une version contre un site concurrent. La concurrence fournit une grammaire,
  pas un critère.
- Déclarer une étape faite sur un reçu, un registre « vert » ou une capture non
  regardée.
- Recopier un calcul du domaine dans un prototype : on l'importe.
- Livrer au brasseur une version qui n'a pas passé E6 et E7.
