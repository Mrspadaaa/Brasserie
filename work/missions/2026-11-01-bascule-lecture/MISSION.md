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
| qr-critique | le port de z2 jugé contre sa maquette (`qr/v1/z2`) | jugement | critique | fable | 30 | work/missions/2026-11-01-bascule-lecture/voies/qr-critique/** | qr-app | captures côte à côte avec la maquette, verdict | pilote | — |

Reprise : z2 choisie : « Le sceau QR z2 parfait comme telle » (D246).

## Agents
- fn-csv8 : a7604fd4850db9c7e (auteur, lancé 01.11 soir).
- qr-app : a86404c3895918619 (auteur, lancé 01.11 soir).

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
  Ses questions ouvertes : degré p3c, port « Total seulement », TVA (assujetti ?), push et PR.

## Signature
