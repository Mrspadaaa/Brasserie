OK — Diagnostic Drive, lenteur (3e lecture trop sensible) et onglets Finances : 15 défauts prouvés, mesures rejouables

## Fichiers écrits (tous dans `work/missions/2026-10-31-ecran-depense/diagnostic/d2/`)
- `DIAGNOSTIC.md` : tableau des défauts (DR1-6, LE1-6, TA1-6), réponses 1 à 3, chronologie chiffrée, plan de coupes avec gain ET risque pour la justesse.
- `mesure-client.mjs`, `mesure-client.json`, `vide.html` : lecture, empreinte et réductions d'image, mesurées en Chrome sur sa facture.
- `mesure-reconcile.ts` : sonde de `reconcileInvoiceVision` sur les 23 lignes de sa facture.
- `mesure-onglets.ts`, `mesure-onglets.txt` : sondes A à F sur synthèse, journal et prévision (données d'essai).
- `RESULTAT.md` (voies/d2).

## Critère G1
`node scripts/agents/systeme.mjs note …/DIAGNOSTIC.md --contient "Le Drive,La lenteur,Entrées,Prévision,Tout,inachevé récupérable,octets,estimé"` → `NOTE OK`. Essais : 1.

## Résultats décisifs
- **Drive** : par le code, le justificatif part au clic « Confirmer », directement du navigateur vers l'API Drive, et il est vérifié (taille, SHA-256) avant que la dépense soit écrite ; échec = erreur affichée, rien d'enregistré, reprise sans doublon. Mais l'écran ne le prouve pas (« Voir le justificatif » = copie locale ; message final « Achat enregistré. ») et aucun test n'a jamais touché un vrai Drive (18 tests + banc émulateur = Drive factice). Son doute est fondé côté preuve, pas côté logique.
- **Lenteur** : 3,2 s de démarrage à froid (journaux), pas de réduction d'image (735 721 → 980 964 octets envoyés), lectures côté client négligeables (1 à 2 ms, mesuré). Le gros du temps est serveur : 2 lectures parallèles puis une 3e **en série**, déclenchée dès qu'une ligne diffère, même par `stockCategory` (sonde : deux lectures qui ne diffèrent que par « Malz »/« Malt » → `needsCorrection=true`, avec ses 5 lignes « Zuschlag Schrotung »). Coupe C1 (déclencheur limité aux champs qui comptent) : 15 à 30 s estimés, sans risque pour les montants.
- **Second appel de 40 à 60 s** : depuis cet écran, c'est forcément un second `scanInvoice` (autre appel `aiTask` impossible ici), donc un second choix de fichier, d'octets différents (même fichier = cache < 1 s ou refus). Ce n'est ni la relecture visuelle ni la 3e lecture, qui sont dans la même requête. Pas de relance automatique. L'écran l'attend (`busy`). Le ressenti « 10 à 20 s » colle à l'appel 1 (3,2 + 1 à 2 + 6 à 8 s).
- **Onglets** : pas d'onglet « Entrées » (lecture signalée) ; pas de filtre Entrées/Sorties dans Opérations (TA1) ; Tout compte les annulées mais le total non (TA2) ; achat daté demain : 0 en synthèse, 50,00 en prévision (TA3) ; sans échéance = placé aujourd'hui (TA4) ; un seul paiement inconnu cache toute la trésorerie (TA5) ; tendance = médiane qui projette 600 CHF sur trois achats (TA6).

## Tests rejoués (verts)
`financeDocuments`, `driveAuthorizationCore`, `drivePersistentAuth`, `purchaseEntry` : 39 ; `tests/integration/driveFileStore.test.ts` : 18 ; `financeForecast`, `finance`, `financeInvoice`, `invoiceVisionReview`, `purchasePrefill` : 77.

## Doutes et limites
- Aucun rendu des onglets vu (voie i1) ; les défauts d'onglets viennent du code et de sondes.
- Je ne peux pas dire lequel des deux appels du journal a rempli ses captures. Un geste en lecture seule le tranche : lire les deux documents `invoiceScans/*` du jour (champs `calls`, `reservations`, `createdAt`, `finishedAt`). Non fait (données réelles).
- Les durées Gemini par lecture (15 à 30 s) sont estimées depuis les 40 à 60 s du journal et la structure du code, pas mesurées.
- Cause du 1er appel de 6 à 8 s inconnue (lecture complète rapide, ou échec rapide) : même geste.
- Réduction d'image (C6), résolution moyenne (C7), modèle léger (C8), suppression des extraits (C9) : écartées sans banc de justesse.
- J'ai écrit un petit script de remplacement de texte par heredoc (supprimé) pour corriger des numéros de ligne de DIAGNOSTIC.md ; relu après coup, deux remplacements manquants refaits par Edit, résultat vérifié par `grep`.

DÉCISION À PRENDRE : lire les deux `invoiceScans/*` du jour (lecture seule, données réelles) pour trancher quel appel a produit l'écran et combien de lectures chacun a faites. Options : le pilote le lit avec ses outils ; ou on ajoute d'abord la trace par lecture (LE4) et on rejoue. Recommandation : le pilote le lit maintenant, c'est gratuit et décisif.

DÉCISION À PRENDRE : « Entrées, Prévision et Tout » (lecture du pilote) : retenir mes lectures (Prévisions, périmètre Tout, absence de filtre Entrées/Sorties) ou demander au brasseur sa capture. Recommandation : garder ma lecture pour l'écran Opérations/Prévisions et lui montrer une mini maquette avec le filtre Entrées/Sorties dans l'entonnoir.

CONNAISSANCE : `docs/finances.md` § Conservation des factures décrit encore un stockage Firestore ; le code range les originaux sur Drive (le 31.10). `STOCK_LINE_PROPOSALS_ENABLED=false` (`stockLineMatching.ts:14`, D117) explique « Aucun mouvement de stock » sur sa capture. Les 5 lignes « Zuschlag Schrotung » de sa facture (libellé identique) font échouer le rapprochement par noms de `reconcileInvoiceVision` dès que deux lectures diffèrent d'un champ.

LEÇON PROPOSÉE : aucune
