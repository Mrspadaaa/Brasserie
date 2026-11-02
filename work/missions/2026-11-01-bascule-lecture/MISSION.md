# Mission 2026-11-01-bascule-lecture

## Objectif
Son accord (01.11, soir, D247), à « basculer la production sur C★v8 avec la correction automatique et le QR : même justesse, moins cher,
sans lecture coupée. Ça demande ton accord, car il faut redéployer la lecture en production » : « Yes ok ».
Fini veut dire : (1) `aiTask` lit une facture comme C★v8+N au banc (deux Flash-Lite à 8 192 jetons, la 3.8 sur désaccord ou lecture
manquante, ses valeurs, le statut du vote ; la normalisation N), testé avec Gemini simulé, déployé seul (`--only functions:aiTask`),
journaux relus ; (2) le QR-facture suisse lu dans le téléphone avant Gemini (zxing-wasm 3.1.5, pdf.js 4.10.38 pour un PDF, servis par
l'app, chargés à la demande), confronté à la lecture (`src/services/qrFacture.ts`), montré comme z2 (D246) dans l'écran en ligne, vérifié
dans Chrome sur fixtures, hébergement redéployé (D236).

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Bascule de la lecture en production | garder A ; C★v8+N+QR | utilisateur | tranchée : C★v8+N+QR (D247, « Yes ok ») |
| Où vit le QR à l'écran | z2, r4, z4 | brasseur | tranchée : z2 tel quel (D246) |
| Installer zxing-wasm et pdf.js sans toucher la jonction node_modules | install dans la jonction ; copie isolée avec `npm ci` | pilote | tranchée : `package.json` et `package-lock.json` (`--package-lock-only`), puis build, tests et déploiement depuis une copie isolée à `npm ci` réel (règle : aucune installation dans la jonction) |
| Degré de compaction de Dépense | p3c-1, p3c-2, p3c-3 | brasseur | ouverte : le QR se pose d'abord sur l'écran en ligne, puis suit le port de son degré |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| fn-csv8 | `scanInvoiceSafely` passe de A à C★v8+N (voies/fn-csv8/VOIE.md) | jugement | auteur | sonnet | 60 | functions/src/ai.ts, functions/src/invoiceScan*.ts, functions/src/invoiceVision*.ts, tests des lectures de facture, work/missions/2026-11-01-bascule-lecture/voies/fn-csv8/** | — | tests visés (Gemini simulé), `npm --prefix functions run build`, témoins | pilote | — |
| fn-relecture | relecture indépendante de fn-csv8 contre le banc (finalOfStarVote, withCodesNormalized) | jugement | relecteur | sonnet | 30 | work/missions/2026-11-01-bascule-lecture/voies/fn-relecture/** | fn-csv8 | parité avec le banc sur ses lectures enregistrées, verdict | pilote | — |
| qr-app | QR lu dans le téléphone, confronté, montré comme z2 dans l'écran en ligne (voies/qr-app/VOIE.md, à écrire) | jugement | auteur | sonnet | 80 | src/services/qrLecture*.ts, src/ui/depense/**, src/ui/finance/ExpenseSheet.tsx, tests/unit/depense/qr/**, work/missions/2026-11-01-bascule-lecture/voies/qr-app/** | — | tests visés, build, Chrome sur fixtures (390 tactile, 1280), captures | pilote | reprise |
| qr-rejeu | rejouer qr-app depuis la copie isolée, éprouver la CSP avec et sans `'wasm-unsafe-eval'` (voies/qr-rejeu/VOIE.md) | mécanique | executant | haiku | 40 | work/missions/2026-11-01-bascule-lecture/voies/qr-rejeu/**, %TEMP%/qr-app-copie | qr-app | tsc, build, check-no-dev-auth, tests de l'écran, témoin rouge, parcours Chrome, CSP (a/b), captures ouvertes | pilote | — |
| qr-ecart | l'état « écart » se règle par un choix QR / lu, comme le duel du total (voies/qr-ecart/VOIE.md) | jugement | auteur | sonnet | 40 | src/ui/finance/ExpenseSheet.tsx, src/ui/finance/InvoiceScanReview.tsx, src/ui/depense/**, tests/unit/depense/qr/**, work/missions/2026-11-01-bascule-lecture/voies/qr-ecart/**, %TEMP%/qr-app-copie | qr-app | tests de l'écran (échouaient avant), tsc, build, check-no-dev-auth, parcours Chrome, captures ouvertes | pilote | — |
| qr-critique | le port de z2 jugé contre sa maquette (`qr/v1/z2`) | jugement | critique | fable | 30 | work/missions/2026-11-01-bascule-lecture/voies/qr-critique/** | qr-app | captures côte à côte avec la maquette, verdict | pilote | — |
| fn-montant-seul | une ligne à un seul montant (lu en `price`, sans quantité ni `amountTTC`) reçoit ce montant en `amountTTC` à la normalisation ; mesuré au banc hors ligne (voies/fn-montant-seul/VOIE.md) | jugement | auteur | sonnet | 40 | functions/src/invoiceScanCore.ts, functions/src/invoiceVisionReview.ts, tests des lectures de facture, work/missions/2026-11-01-bascule-lecture/voies/fn-montant-seul/** | fn-csv8 | tests (échouaient avant), parité, rejeu hors ligne du banc sans appel, `npm --prefix functions run build` | pilote | — |

Reprise : z2 choisie : « Le sceau QR z2 parfait comme telle » (D246).

## Agents
- fn-csv8 : a7604fd4850db9c7e (auteur, lancé 01.11 soir).
- qr-app : a86404c3895918619 (auteur, lancé 01.11 soir).
- fn-relecture : aac5a8e4af131b876 (relecteur, lancé 01.11 soir, après le premier retour de fn-csv8).

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|

## Boucle de retour
Un test rouge ou une parité manquée : même agent, 2 relances. Un défaut vu par le critique : même agent. Après le déploiement, un échec
dans les journaux d'`aiTask` : retour arrière en redéployant le commit précédent (noté en D-n). Ses mots vont dans SPEC.

## Budget
Usage avant : 47 % hebdo (01.11 soir). Gemini : aucun appel réel dans les tests ; une seule lecture de contrôle après déploiement, sur une
pièce fictive, si le pilote la juge nécessaire (D210 : 40 au plus).

## Sources
- `functions/src/ai.ts` (`scanInvoiceSafely`), `functions/src/invoiceScanCore.ts`, `functions/src/invoiceScanBudget.ts`,
  `functions/src/invoiceVisionReview.ts`, `functions/src/models.ts`
- `scripts/banc-lecture-facture.ts` (C★v8 : `Csv8`, `finalOfStarVote`, `finalOfLite`, `withCodesNormalized`, `LITE_RAISED_OUTPUT`)
- `work/missions/2026-11-01-banc-lecture/GESTES.md`, `src/services/qrFacture.ts`, `work/missions/2026-10-31-ecran-depense/qr/v1/z2/`

## Reprise
- 01.11 soir : mission ouverte, fn-csv8 et qr-app lancées en parallèle (périmètres disjoints : functions/ contre src/ et package*.json).
  Prochaine action : à chaque retour, rejouer les tests et le build, puis fn-relecture (relecteur) et qr-critique (critique) ; ensuite
  déployer `aiTask` seul depuis une copie propre (lire « found », journaux), puis l'hébergement depuis une copie à `npm ci` réel.
  Ses réponses du soir : p3c-3 choisie, quantité en gras et champs alignés (D248, retouche p3c-r en cours chez le concepteur
  a435357168cc72f5c) ; port « Total seulement » partout (D249 : une voie après fn-csv8 et qr-app, et la vérité du banc à corriger) ;
  TVA : moins de 100k (D250 : vue TVA en mini maquettes, cas non assujetti). Après qr-app : port de p3c-3 dans l'app avec z2.
  Reste ouvert : push et PR.
- 01.11 soir, plus tard : p3c-3 retouchée (commit c11dac21, ALIGNE OK, témoin en échec rejoué) ; critique e-t5 (ab25a65a5ef72e1a5)
  en cours ; si RETENUE, lui envoyer p3c-3-repos.png et p3c-3-tous.png (SendUserFile), sinon relancer le concepteur avec ses défauts.
- 01.11 soir, plus tard : fn-csv8 rend « FN-CSV8 OK ». Au rejeu du pilote : build vert, manifeste intact (21dd75b3) ; 28 fichiers verts
  sur 29, `tests/integration/invoiceReview.test.ts` rouge (26 tests encore sur A). Relance 1/2 de fn-csv8 sur ce fichier. D251 : `model`
  renvoyé = `SCAN_MODEL` ; commentaire de `functions/src/models.ts` corrigé par le pilote. fn-relecture lancée en parallèle.
  qr-app rend « QR-APP OK » avec réserves. D252 : `InvoiceScanReview` rebranché, contrastes à mesurer de nouveau (suite 1 de qr-app).
  La CSP de `firebase.json` bloque le wasm : accord de l'utilisateur à demander, avec la preuve locale (avec et sans
  `'wasm-unsafe-eval'`). Ensuite : rejeu par l'exécutant (DEMANDE EXECUTANT du RESULTAT), puis qr-critique.
  qr-app suite 1 rendue (InvoiceScanReview rebranché, contrastes 5,74 et 5,67) ; qr-rejeu lancé (a1d894e8dcd76f5c9).
  Son « Oui » à la CSP (D253) : `'wasm-unsafe-eval'` ajouté à `script-src` de `firebase.json` **après** le retour de qr-rejeu (son
  épreuve lit le fichier tel quel), puis hébergement déployé depuis une copie à `npm ci` réel.
- fn-relecture : FN-RELECTURE ACCEPTE (aucun bloquant). fn-csv8 commitée (3b3e74ac). **`aiTask` déployé** (D254, révision
  aitask-00042-tet, aucune erreur au démarrage). À faire : relire les journaux à la première facture lue ; retour arrière = 5970478d.
- qr-rejeu (a1d894e8dcd76f5c9, relancé une fois à sa limite de tours) : ECHEC formel, examiné par le pilote. Étapes 2, 3, 6 et 7
  conformes : build code 0, 74 fichiers et 1 215 tests verts, CSP (a) sans sceau avec violation `wasm-eval`, (b) « QR ✓ » image et PDF,
  0 violation. Les trois points d'échec : (1) critère faux du pilote, `vue.test.ts` teste `qrVue.ts`, module pur qui reste en place ;
  (2) contraste « 110,40 » mesuré par le pilote au pixel, 5,67 ; (3) captures de qr-app régénérées par le même script sur le même code
  (`parcours.mjs` écrit par défaut dans `qr-app/captures` : un rejeu passe `--sortie`, L17). Captures CSP ouvertes par le pilote.
  `'wasm-unsafe-eval'` ajouté à `script-src` de `firebase.json` (D253), seul changement du fichier. qr-critique lancée
  (a7bcdb6dae375176a). Ensuite : commit de qr-app et de `firebase.json`, copie à `npm ci` réel, hébergement.
- qr-app et CSP commitées (95b947fd). Copie d'hébergement `%TEMP%/deploy-hosting-qr` : worktree neuf sur 95b947fd, `npm ci` réel,
  `.env` racine et `seedData.ts` copiés, jonction `functions/node_modules` (méthode D72). Build code 0, bundle propre, 74 fichiers
  de tests verts. qr-critique REJETTE, trois écarts avec z2 : lecture sans les valeurs du QR, ① après ②, feuille à 1280 qui repousse
  ① et ② sous le pli. Le reste est retenu tel quel. qr-app suite 2 (relance 1/2). Ensuite : nouveau critique, puis hébergement.
  Hors périmètre, relevés par le critique : feuille non pleine hauteur à 390 (D235), tuile « TVA — » vide (vue TVA, D250).
- qr-app suites 2 et 3 (relances 1 et 2/2) : les trois écarts sont corrigés et retenus, « invalide » est retenu, « écart » est marqué
  (date en ambre, « ① Date »). Le critique retient tout le sceau sauf un geste : en « écart », la chip se règle sans choix entre QR et
  lu. qr-app a épuisé ses relances, et son contexte est très chargé ; voie neuve qr-ecart (a9392eb42ccce392b), auteur Sonnet, contrat
  étroit. Ensuite : rejugement de « écart », commit (suites 2, 3 et qr-ecart), copie d'hébergement resynchronisée, déploiement.
- qr-ecart : QR-ECART OK (tests qui échouaient avant : 7 sur 33 ; 74 fichiers et 1 237 tests verts ; tsc, build et dev-auth propres ;
  captures ouvertes par le pilote). **qr-critique : QR-CRITIQUE RETENUE** pour tout le port. Commit dba49adb.
- **Hébergement déployé** (D255) : `index-CxkdwJ81.js` servi, CSP avec `'wasm-unsafe-eval'`, wasm en `application/wasm`. Les deux
  volets de la bascule sont en ligne. Reste : relire les journaux d'`aiTask` à sa première facture ; push et PR (son accord) ;
  ensuite, port de p3c-3 avec z2 (D248), port « Total seulement » (D249), vue TVA en mini maquettes (D250).
- **Test en ligne de la version déployée** (01.11, 15 h 31 à 15 h 36, lectures 2 et 3 du journal Gemini, 0,030 CHF ; fixtures fictives,
  rien enregistré). PNG : deux Flash-Lite d'accord, sans 3.8 ; QR lu ; l'état « écart » attrape une vraie erreur de date des deux
  Flash-Lite (« 261012 » lu 26.10.2012 au lieu de 12.10.2026). PDF : pdf.js et QR lus en ligne, deux Flash-Lite en désaccord, la 3.8
  tranche, en-tête juste (« = lu » partout). **Défaut** : les 7 montants de ligne sont rangés en `price` sans quantité ni `amountTTC`,
  l'écran montre « — » et ne vérifie pas la somme. Voie fn-montant-seul (a0989d26fc59ac84f) lancée. À noter : deux Flash-Lite d'accord
  sur une date fausse ne réveillent pas la 3.8 ; le QR est alors le seul garde-fou.
- fn-montant-seul : FN-MONTANT-SEUL OK (D256, 1257fd76) ; rejoué par le pilote : 176 tests visés verts, build vert, manifeste
  inchangé. Son « Oui et oui » (D257) : `aiTask` déployé (révision aitask-00043-raz), lecture de contrôle 4 juste (somme vérifiée,
  rien enregistré) ; branche poussée, PR https://github.com/Mrspadaaa/Brasserie/pull/199. Reste : port de p3c-3 avec z2 (D248),
  port « Total seulement » (D249), vue TVA en mini maquettes (D250).

## Signature
