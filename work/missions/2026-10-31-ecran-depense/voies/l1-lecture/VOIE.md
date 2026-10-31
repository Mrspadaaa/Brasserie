# Voie l1-lecture — la lecture d'une facture contrôlée par le code

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (code de la fonction de lecture)
- Plafond : 110 tours ; 3 essais par critère
- Dépend de : diagnostics d1 et d2
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
Le code vérifie ce que Gemini lit : quantité × prix, somme des lignes au centime, TVA par taux, HT + TVA = TTC. Chaque contrôle qui
échoue rend un **point typé** (quoi, où, attendu, lu, écart en centimes), en plus des phrases d'aujourd'hui. Le schéma lit ce qui manque
pour ces contrôles (taux par ligne, bases par taux, α d'un houblon, pro-forma). Sur sa facture 372765, la lecture simulée donne la
vérité champ par champ, et le bloc TVA incohérent est signalé à sa place.

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md` (fiabilité, aucun chiffre inventé, Gemini simulé, test d'abord,
deux temps : PLAN puis code).

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-depense/diagnostic/d1/DIAGNOSTIC.md` : tableau (lignes A3, A6, A9, A10, C1 à C4, P1, P2) et § 2, § 3.
- `work/missions/2026-10-31-ecran-depense/diagnostic/d1/verite-facture-372765.json`, `lecture-simulee-372765.json`.
- `functions/src/invoiceScanCore.ts`, `functions/src/prompts.ts` (le prompt et le schéma des factures), `tests/unit/invoiceScanCore.test.ts`.
- Pour le contrat seulement, sans y écrire : `functions/src/invoiceVisionReview.ts` (qui consomme `issues`) et `src/services/purchasePrefill.ts`.

## Possède (seuls chemins où écrire, un par ligne)
- `functions/src/invoiceScanCore.ts`
- `functions/src/prompts.ts` (le prompt et le schéma des factures seulement ; les autres prompts ne bougent pas)
- `tests/unit/invoiceScanCore.test.ts`
- `tests/unit/depense/lecture/`
- `work/missions/2026-10-31-ecran-depense/voies/l1-lecture/`

## Défauts visés
- **C1** quantité × prix unitaire = montant de ligne, au centime (remise et ligne sans prix comprises) ;
- **C2** somme des lignes = total, au centime : plus de tolérance de 5 centimes qui laisse passer ce que le client refuse ensuite ; le cas
  (b) du diagnostic compris ;
- **C3 et A10** : le taux (ou son code, N/R) de chaque ligne et les bases par taux sont lus ; la TVA est contrôlée par taux ; sur sa
  facture, le bloc imprimé qui ne se recoupe pas (110,40 ≠ 86,50) devient un point, sans qu'aucune valeur soit corrigée en silence ;
- **C4** : rien à changer (conforme) ; un HT calculé n'est jamais montré comme lu ;
- **A6** : la pro-forma payée est un type à part, jamais « À payer » quand le paiement est imprimé ;
- **A9** : l'α d'un houblon est un champ de la ligne (lu s'il est imprimé), en plus du libellé ;
- **P1** : un PDF 1.5 d'une page avec `/ObjStm` est accepté si ses pages se comptent ; refus seulement s'il dépasse 4 pages ou ne se compte pas ;
- **P2** : au-delà de la limite de lignes, aucune ligne n'est jetée en silence : le nombre de lignes perdues est dit, et le total n'est
  jamais déclaré vérifié ;
- **A3** : le prompt n'avertit que d'un doute réel (valeur illisible, absente alors qu'essentielle, confondable) ; il n'explique plus une
  valeur juste.

Le **contrat** du point typé (nom du champ, forme, codes) est écrit dans PLAN.md : la voie suivante (rapprochement des lectures, statut
« à confirmer ») et l'écran le consommeront. Il est **ajouté** au résultat ; `issues` reste rempli comme aujourd'hui. Si le format du
résultat change, la version du registre des lectures (`invoice-v4`) change aussi, pour qu'une ancienne lecture en cache ne soit pas servie
au nouveau format : le dire dans le plan.

## Hors périmètre
Le rapprochement des lectures, la troisième lecture, les journaux par lecture et le statut (voie suivante, `invoiceVisionReview.ts`,
`ai.ts`) ; l'écran ; la réduction d'image, un autre modèle, une réflexion plus faible (refusés par d2 : justesse) ; tout appel réel.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt. Dans `--contient "a,b,c"`, les
virgules séparent des mots qui doivent tous être dans RESULTAT.md.
