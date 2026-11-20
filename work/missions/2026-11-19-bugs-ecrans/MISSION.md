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
| ct4a | critique tour 4 B, n° 1, 2, 3, 7, 8, 9, 10, 11 | jugement | auteur | sonnet | 120 | voir voies/ct4a/VOIE.md | — | verdicts.mjs ct4a ; --tests | pilote | — |
| ct4b | critique tour 4 B, n° 4, 5, 6, 12, 13, 14, 15 | jugement | auteur | sonnet | 120 | voir voies/ct4b/VOIE.md | — | verdicts.mjs ct4b ; --tests | pilote | — |
| w1 | TL-7, TL-19, TL-16, T3-11, BK2-5, TE-27 (reprise de tous les ouverts) | jugement | auteur | sonnet | 120 | voir voies/w1/VOIE.md | — | verdicts.mjs w1 ; --tests | pilote | — |
| r2 | BK2-1, BK2-2, BK2-3, BK2-4, BK2-6, BR-100, BE-53, RJ-14, TE-53, TE-54, GE-NOTE-5 (reprise de tous les ouverts) | jugement | auteur | sonnet | 120 | voir voies/r2/VOIE.md | — | verdicts.mjs r2 ; --tests | pilote | — |
| s2 | AM-56, BT-2, TL-10, GE-NOTE-1 (reprise de tous les ouverts) | jugement | auteur | sonnet | 120 | voir voies/s2/VOIE.md | — | verdicts.mjs s2 ; --tests | pilote | — |
| f2 | T3-8, T3-9, LR3-NOTE-1 (reprise de tous les ouverts) | jugement | auteur | sonnet | 120 | voir voies/f2/VOIE.md | — | verdicts.mjs f2 ; --tests | pilote | — |
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

## État de l'art — al1
Voie al1 (LR1-8, LR2-9 : le rapprochement des lignes de deux lectures d'un même justificatif, `alignLines` de `functions/src/invoiceVisionReview.ts`). Date : 20.11.
- Problème type : alignement de deux séquences ordonnées (Needleman-Wunsch 1970, programmation dynamique, O(n·m)) quand chaque paire possible a une ressemblance ;
  sous-problème : ressemblance de deux libellés mal lus (distance d'édition, coefficient de Dice sur bigrammes). Variante sans ordre : appariement biparti pondéré (algorithme hongrois, O(n³)).
- Constat : la version actuelle rapproche par niveaux (référence + nom, référence seule, nom seul, puis chiffres). Sur doc25 les deux lectures rattachent l'EAN à la ligne voisine : le niveau « référence seule »
  pose AFFRET 4,25 sur « AFFRET / DEBOUCREOR » 7,50 et tout se décale d'un rang ; la référence, preuve forte quand elle est juste, trompe quand l'OCR la glisse.
- Examiné (npm, 20.11) : `sequence-alignment` 0.0.8 (MIT, 135 ko, dernière publication 05.2022) et `seqalign` 1.0.6 (MIT, 35 ko, 05.2022) : alignement de chaînes de caractères / biologie, matrice de score fixe, pas de
  score par paire d'objets (nom, montant, référence) ; `bioseq` 0.2.0 (Apache-2.0, 196 ko, 11.2026) : alphabets biologiques ; `needleman-wunsch` : retiré de npm ; `munkres-js` 1.2.2 (Apache-2.0 / BSD, 2022) et
  `hungarian-algorithm` (paquet de sécurité vide) : appariement sans ordre, donc qui oublie l'ordre des lignes d'un ticket ; `fastest-levenshtein` 1.0.16 (MIT, 21 ko, 2022) : distance d'édition, sans dépendance, mais n'apporte
  rien que `editDistanceAtMost1` et le coefficient de Dice (10 lignes) ne fassent déjà. Aucune n'est dans `functions/package.json` : en ajouter une change la liste des dépendances déployées (verrou, paquet), pour du code
  qu'aucune ne fournit (le score propre au justificatif).
- Décision : Needleman-Wunsch écrit en 15 lignes (la récurrence est celle du manuel ; ce n'est pas une rustine sur un module : c'est la méthode standard à la place des niveaux), score par paire = nom (Dice, OCR tolérant,
  nom contenu dans une ligne fondue) + montant égal (un montant inconnu n'est jamais égal) + référence égale (preuve) ; une paire n'existe qu'au-dessus d'un seuil (aucune paire par la position seule, par la référence seule
  ni par le montant seul) ; l'ordre des lignes est respecté ; l'ensemble des paires maximise la somme des scores. Aucune dépendance ajoutée. Tests : doc25 (vraies réponses enregistrées, sans appel) et cas courts
  (`tests/unit/bugs-al1-alignement.test.ts`, `bugs-g1-LR1-8.test.ts`) ; chaque changement rejoue `tests/unit/depense`, `tests/unit/finance`, `tests/unit/invoice*` et les tests de `functions`.
- Limite dite : un ticket relu dans un autre ordre (deux colonnes) ne se rapproche plus par position ; le rapprochement reste par ressemblance mais dans l'ordre. Si un cas réel l'exige, l'appariement hongrois
  (sans ordre) est la suite, pas une deuxième rustine.
