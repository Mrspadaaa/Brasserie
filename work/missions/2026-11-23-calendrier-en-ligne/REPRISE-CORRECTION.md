# Reprise — correction de LISTE.md, classe (a) et focus 2 (23.11)

Worktree `port-carnet`, branche locale `claude/port-carnet-1711`. Rien de poussé ni de déployé.

## Commits de ce lot (après 73503ffbc)
| Id | Commit | Test rouge avant → vert |
|---|---|---|
| FC-1 / L-44, FC-2 / L-7 | 009c66af5 | vitest `tests/unit/proprietes` (it.fails retirés) |
| L-8 bord droit | ffdabac36 | e2e `barre-bord.spec.ts` L-8 |
| L-13 cadre à 1 sem. | c2e5cc8ad | e2e `frise-suite.spec.ts` L-13 |
| L-10 An au rechargement ; L-11 garde | 2a555042f | e2e L-10 ; L-11 jamais rouge (non reproduit) |
| L-14 frise partagée (brassin, idée) ; L-36 rejoué | 71e2579f3 | e2e `feuilles.spec.ts` L-14 ; L-36 vert d'emblée |
| L-37 garde | 5b2466cb3 | non reproduit |
| L-26 Carnet « Au calendrier » crée l'achat prévu | 8e1796a7a | e2e L-26 |
| L-28 Supprimer un brassin prévu | 3040ae02d | vitest `calSupprimerBrassin` + e2e L-28 |
| L-15 années | 217e7d764 | e2e L-15 |
| Outil e2e : date de Zurich | feda55906 | 44 rouges barre-bord après minuit (UTC ≠ Zurich), base 73503ffbc pareil |

Étiquettes de la courbe en paysage 844×340 : déjà vertes à la reprise (corrigées par 73503ffbc, L-3/L-4).

## Reste (classe a)
- L-2, L-5, L-12 : attendent Q-1, Q-3, Q-5 (mini maquettes).
- L-9 (signe de butée) et L-16 (brouillon de fête au rechargement) : détails sans règle écrite, non faits.
- L-11, L-36, L-37 : non reproduits sur la fixture ; tests de garde commités ; à rejouer en ligne.
- Classe (b) restante (L-17 à L-25, L-27, L-29 à L-35, L-38 à L-45) : à rejouer en ligne après déploiement.

## Vérifications
- vitest complet : 61 fichiers en échec, exactement les mêmes qu'à 73503ffbc (`functions/node_modules` absent : cheerio, firebase-functions, firebase-admin ; plus bugs-v3-t34-plein, designTokens, rejeu-649b/virgule-transversale, anciens).
- tsc : 0 erreur (`npx tsc --noEmit -p .`).
- e2e complet : 145 verts, 44 rouges tous dans barre-bord (date UTC de la fixture après minuit), 13 sautés ; barre-bord rejoué après feda55906 : 68/68 verts.
- Captures regardées (390) : feuilles brassin et idée avec la frise partagée ; Calendrier après Carnet › Au calendrier (achat en S7, fiche ouverte) ; An rechargé (« oct. 2026 – oct. 2027 », axe en mois) ; cadre à 1 sem. qui suit le doigt de 60 px.
