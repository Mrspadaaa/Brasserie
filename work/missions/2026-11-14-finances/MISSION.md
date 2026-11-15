# Mission 2026-11-14-finances

## Objectif
Ses mots (14.11) : « ok lance 1, 2, 4 en sous session avec la création de mini maquettes (non jouable) SANS FABLE » ; point 1 : « Finances › Opérations : ta plainte du 10.11 reste ouverte (ce n'est pas ta maquette choisie « Lignes serrées v6a », pas de filtre du … au …) ; Synthèse, Prévisions et Annuel jamais refaits. »
Fini : Opérations porté en v6a ; un filtre du jour au jour choisi par lui en mini maquettes statiques, porté 1:1 ; Synthèse ramenée à g3a sur ses données ; Annuel vérifié ; tests, build, captures côte à côte, déploiement par tag `en-ligne/*`, jeu en ligne sur « ZZ TEST » retiré. Aucun agent Fable.

## Cadrage (jury tenu par le pilote, sans agent : Fable interdit, économie D207)
- Opérations = v6a (dernier mot, 10.11) ; v6b du 09.11 remplacé. Source : SPEC de compta-prix (worktree jolly-mahavira) l. 1657 et 1707.
- Synthèse g3a, Prévisions p5b, Annuel g6, Analyse a2a, Mon mois f2d : choisis ; pas de variantes (règle n° 1, D123). Écarts du port corrigés.
- Seul goût ouvert : la forme du filtre de dates dans v6a → axe de variantes (où, comment, après le geste).
- Irréversible : déploiement (demandé par la tâche, par tag), données réelles jamais.

## État de l'art
- Problème type : sélection d'un intervalle de dates (date range picker) au téléphone ; filtrage d'une liste par intervalle fermé [du, au].
- Examiné : `<input type="date">` natif (sélecteur du système, accessible, 0 Ko) ; react-day-picker 9 (MIT, environ 12 Ko gz, mode `range`, maintenu) ; MUI X DateRangePicker (plage payante) ; react-dates (abandonné). Filtrage : comparaison de clés ISO `AAAA-MM-JJ` (convention de `ledger.ts`).
- Décision : selon la variante choisie ; par défaut deux `input type=date` natifs. Un calendrier à plage → react-day-picker, jamais écrit à la main.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Base d'Opérations | v6a ; v6b | brasseur | tranchée : v6a (10.11) |
| Forme du filtre du … au … | 12 variantes s1 à s3 | brasseur | ouverte |
| Synthèse, cas ventes ≫ dépenses | état g3a (pointillé vide, segments lisibles) | pilote | tranchée (L03) |
| Annuel : matériel 5 500 dans la perte | usure ; charge | pilote | ouverte (après diagnostic y1) |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| s1 | 4 mini maquettes : la plage depuis la pilule du mois | conception | concepteur | opus | 60 | work/missions/2026-11-14-finances/voies/s1 | — | baseline : controle-serie (v6a gardée), controle-choix --registre, verifier-page | brasseur | v0 ×4 (2 froide, 2 tiède) |
| s2 | 4 mini maquettes : la plage par un booster (frise, calendrier) | conception | concepteur | opus | 60 | work/missions/2026-11-14-finances/voies/s2 | — | baseline : controle-serie (v6a gardée), controle-choix --registre, verifier-page | brasseur | v0 ×4 (2 tiède, 2 chaude) |
| s3 | 4 mini maquettes chaudes : préréglages, saisie, et une libre au brief minimal | conception | concepteur | opus | 60 | work/missions/2026-11-14-finances/voies/s3 | — | baseline : controle-serie (v6a gardée), controle-choix --registre, verifier-page | brasseur | v0 ×4 (4 chaude) |
| o1 | Opérations : rangées en v6a, sans toucher la bande de période | jugement | auteur | sonnet | 120 | src/ui/finance/TransactionRow.tsx, src/ui/finance/operations.css, src/ui/finance/journal.css, work/missions/2026-11-14-finances/voies/o1 | — | GATES o1 (controle-v6a) | pilote | — |
| y1 | Synthèse ramenée à g3a quand ventes ≫ dépenses ; diagnostic Annuel en lecture | jugement | auteur | sonnet | 120 | src/ui/finance/synthese, src/ui/finance/synthese.css, work/missions/2026-11-14-finances/voies/y1 | — | GATES y1 (controle-synthese) | pilote | — |
| c1 | Critique : tri et défauts du panel s1 à s3 | conception | critique | opus | 30 | work/missions/2026-11-14-finances/critique | s1, s2, s3 | controle-panel.mjs, SYNTHESE.md | pilote | tri |
| p2 | Défauts du critique corrigés sur les candidates avant de montrer | conception | concepteur | opus | 40 | work/missions/2026-11-14-finances/voies/s1, work/missions/2026-11-14-finances/voies/s2, work/missions/2026-11-14-finances/voies/s3 | c1 | baseline : controle-serie, controle-choix --registre, verifier-page | brasseur | passe 2 |

Écart assumé au contrôle M13 « aucune série en Fable » : le brasseur a dit « SANS FABLE » (14.11) et Fable est interdit jusqu'à nouvel ordre (10.11). Ses mots priment ; `systeme.mjs mission` garde cette seule ligne en échec.

## Agents
(au lancement)

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Opérations du … au … | v0 + passe 2 ; 14.11 | https://claude.ai/artifact/2xGEV9qoGgzadUBHVm2dsU | `work/refonte-frontend/v4/outils/pages/2026-11-14-finances-plage/index.html` |
| Finances, vues sous les boutons (13 vues sans maquette, 52 mini maquettes) | 14.11 v1 | https://claude.ai/artifact/AgKn2qcDMyGLrKuJNmsUqX | `work/refonte-frontend/v4/outils/pages/2026-11-14-finances-sous-vues/index.html` |
| Finances, tes retours du 15.11 (Modifier, Payer avec justificatif, apport, fiche, filtres) | 15.11 v1 | https://claude.ai/artifact/LStrn5pryjsMnB7eCVbWDP | `work/refonte-frontend/v4/outils/pages/2026-11-15-finances-retours/index.html` |

## Boucle de retour
Rejet du critique → agent neuf sur brief serré, 2 fois au plus, ou variante écartée. Plainte du brasseur → SPEC mot pour mot → DEFAUTS-RECURRENTS et contrôle rouge sur la version rejetée.

## Budget
D207 : v0 au repos plus un état ; un critique Opus ; agents neufs pour toute relance.

## Sources
- `work/missions/2026-11-14-finances/ANALYSE.md`
- `work/missions/2026-11-14-finances/ref/v6a/NOTE.md`, `work/missions/2026-11-14-finances/ref/v6a/etat.html`
- `work/missions/2026-11-09-compta-prix/MISSION.md`

## Signature
(à venir)

## Choix du brasseur
- s2ap2 choisie : « Ça j'adore / Peut être juste un peu plus compact et toujours un endroit pour mettre des chiffres pour la version de l'ordinateur » (14.11). Port : voie f1.

## Signature (14.11)
- Déployé : c193cf8c (hébergement seul), tag local `en-ligne/2026-11-14-finances` (non poussé), bundle servi index-CrIW0_MX.js = build, sans dev-local. Base : `en-ligne/2026-11-14-stock-b`.
- Voies : s1, s2, s3 (12 v0, SERIE OK, PAGE OK) ; c1 tri ; p2a, p2b (5 candidates, montrables) ; o1 V6A OK ; y1 SYNTHESE OK ; a1 ANNUEL OK ; r1 R1 OK ; f1 FRISE OK ; f2 suite complète sans rouge neuf (ROUGES.md : 58 rouges déjà sur la base, dépendances de functions/ absentes du worktree) ; f3 bloquants finaux. Verdict avant déploiement c193cf8c : 0 bloquant, pilote vu.
- Décisions : Opérations = v6a + s2ap2 (brasseur) ; pièce de matériel non classée = « à classer », résultat en attente (pilote, diagnostic y1) ; à payer placé à l'échéance dans la frise et la plage (règle de s2ap2), la vue du mois garde la date de pièce (écart dit).
- Ouvert : jeu en ligne sur « ZZ TEST » non fait (connexion Google du brasseur requise ; aucun chemin d'écriture changé, mais ✓ Payé déplacé par o1) ; mineurs du verdict c193cf8c 1 à 9 (plage vide en grand cadre, Archives sans année, lien Matériel « Archives comprises », boutons de l'étape 4, « ? » dans l'Entré, « + pièce » ouvre toute l'écriture, vente à 569,50 la bouteille sans alerte, Mois par mois, frise à cheval sans le 14) ; registre `controle-choix --registre` en échec antérieur (captures non versionnées) ; contrôle M13 « série Fable » écarté par « SANS FABLE ».
