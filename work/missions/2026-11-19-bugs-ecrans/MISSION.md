# Mission 2026-11-19-bugs-ecrans

## Objectif
Le brasseur (19.11) : « Corrige tout alors tu attendais quoi ??? Tout tout tout ». Les 92 défauts « ouvert » de
`work/missions/BUGS.md` hors Carnet, Dépense, Finances (t3-carnet), Calendrier (t3-calendrier), Levure/Conduite (refonte) et
T2-*/T2B-* (t3-corrections). Fini : chaque ligne a un verdict prouvé (corrigé + commit, écarté + raison, ouvert — accord requis),
reporté au registre, `controle-bugs.mjs` → BUGS OK ; les commits envoyés à t3-corrections pour la mise en ligne, puis rejoués en ligne.

## État de l'art
- Problème type : correction de défauts par test de non-régression écrit d'abord (test-first regression), validation de saisie
  bornée, facture QR suisse (Swiss QR-bill, norme SIX), arrondi suisse aux 5 centimes.
- Examiné : Vitest + Testing Library (déjà au dépôt) pour la non-régression ; puppeteer-core (déjà au dépôt, skill webapp-testing)
  pour les mesures de recouvrement et de contraste ; `swissqrbill` (npm, MIT, maintenu, génère la section paiement QR en PDF/SVG)
  plutôt qu'un QR écrit à la main ; arrondi aux 5 centimes par `Math.round(x * 20) / 20` (règle d'arrondi commerciale suisse).
- Décision : bibliothèques déjà au dépôt ; `swissqrbill` seulement si la voie c1 construit la facture QR ; aucun algorithme à la main.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Goût non tranché dans un défaut | lecture étroite réversible ; accord requis si sa maquette change | pilote | tranchée : lecture étroite, notée au registre |
| Données réelles, sécurité (SU-NOTE-4, TE-NOTE-7, LR3-NOTE-3, SU-NOTE-1) | agir ; accord requis | utilisateur | tranchée : ouvert — accord requis |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| t1 | 15 défauts transversaux (+ flottant, noms d'écran, recherche, eau) | jugement | auteur | sonnet | 120 | voir voies/t1/VOIE.md | — | verdicts.mjs t1 ; --tests | pilote | — |
| r1 | 17 défauts Recettes et fiche de recette | jugement | auteur | sonnet | 120 | voir voies/r1/VOIE.md | — | verdicts.mjs r1 ; --tests | pilote | — |
| a1 | 13 défauts Malts/sucres, Fermentescibles, import | jugement | auteur | sonnet | 120 | voir voies/a1/VOIE.md | — | verdicts.mjs a1 ; --tests | pilote | — |
| a2 | 8 défauts Identité, NOLO, Paliers | jugement | auteur | sonnet | 120 | voir voies/a2/VOIE.md | — | verdicts.mjs a2 ; --tests | pilote | — |
| b1 | 16 défauts Brassins, Mesures, Atelier R&D | jugement | auteur | sonnet | 120 | voir voies/b1/VOIE.md | — | verdicts.mjs b1 ; --tests | pilote | — |
| s1 | 12 défauts Stocks, Houblons, Bord | jugement | auteur | sonnet | 120 | voir voies/s1/VOIE.md | — | verdicts.mjs s1 ; --tests | pilote | — |
| c1 | 7 défauts Clients et Ventes | jugement | auteur | sonnet | 120 | voir voies/c1/VOIE.md | — | verdicts.mjs c1 ; --tests | pilote | — |
| k1 | test d'écran des écrans touchés, 390 tactile et 1280, deux thèmes | jugement | critique | opus | 30 | voies/k1/ | t1, r1, a1, a2, b1, s1, c1 | « combien et quels problèmes ? » | pilote | — |
| h1 | T3B-4, T3B-5 (en ligne passe 4) | jugement | auteur | sonnet | 120 | voir voies/h1/VOIE.md | — | verdicts.mjs h1 ; --tests | pilote | — |
| f1 | T3B-6, T3B-11, T3B-12 (en ligne passe 4) | jugement | auteur | sonnet | 120 | voir voies/f1/VOIE.md | — | verdicts.mjs f1 ; --tests | pilote | — |
| e1 | T3B-7, T3B-8, T3B-9 (en ligne passe 4) | jugement | auteur | sonnet | 120 | voir voies/e1/VOIE.md | — | verdicts.mjs e1 ; --tests | pilote | — |
| v1 | T3B-10, T3B-13 (en ligne passe 4) | jugement | auteur | sonnet | 120 | voir voies/v1/VOIE.md | — | verdicts.mjs v1 ; --tests | pilote | — |

## Agents
Notés au lancement.

## Pages
Aucune page : correction de défauts, aucun choix montré.

## Boucle de retour
Voie en échec : relance du même agent avec le défaut précis (2 fois au plus). Critique : 3 tours au plus, liste figée, chaque défaut
prouvé seul (L18). Plainte nouvelle du brasseur : SPEC, DEFAUTS-RECURRENTS, contrôle qui échoue avant.

## Budget
Sept auteurs Sonnet en parallèle, un critique Opus ; 120 tours au plus par voie.

## Sources
- `work/missions/BUGS.md`
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md`

## Signature
À écrire.

Voies : t1 15, r1 17, a1 13, a2 8, b1 16, s1 12, c1 7, x1 3, y1 3 (+6 revus), z1 14 : VERDICTS OK partout, TESTS OK. Critique Opus k1 tour 1 : 17 problèmes (2 bloquants) ; correctifs A, B, C : 16 corrigés, 1 détail ouvert (Historique à 390, drapeau éteint). Registre canonique (Brasserie) : 85cc5bbed, BUGS OK.
Transmis : TE-35, TE-36, BE-23, BE-26, BE-27, BR-27 à t3-carnet (faits, versés par eux) ; B1-NOTE-3, BR-91/BE-15, TE-13 à t3-corrections ; TL-7, TL-19, T3-11 à t3-corrections (note partagée, relances épuisées) ; PC-NOTE-3, 7, 16 à t3-calendrier.
Accord requis : SU-NOTE-4, TE-NOTE-7, LR3-NOTE-3, SU-NOTE-1, LR3-NOTE-1 (données réelles, sécurité) ; goûts TL-10, TL-16, MV-9, TE-17, GE-NOTE-1, BT-2, TE-27, TE-53, TE-54. Hors zone Levure : BR-100/BE-53, AM-56 (brasser), BR-5 (projection).
Build : échoue sur src/ui/calendrier/frise/MenuAppuiLong.tsx (travail en cours de t3-calendrier), pas sur nos fichiers ; tsc vert. Non rejoué en ligne : attend la mise en ligne par t3-corrections.
