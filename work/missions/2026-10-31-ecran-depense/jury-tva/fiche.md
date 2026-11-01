# Fiche de cadrage — la vue TVA (D250), jury rapide du 01.11 soir

## Hypothèse
Avant : une vue de Finances, TVA payée par taux et par période, un chiffre « si assujetti » à part (60 %). Après (75 %) : la vue répond
d'abord à **« est-ce que je récupère la TVA ? »** (non : non assujetti, selon son réglage), puis **combien la TVA lui a coûté** sur la
période, avec les dépenses dont la TVA est inconnue **comptées à côté, jamais à zéro**. Le « si assujetti » n'existe qu'en différence
(récupéré moins facturé sur ses ventes enregistrées) ou pas du tout : c'est un axe de variantes.

## Tranché
| n° | Question | Réponse | Source |
|---|---|---|---|
| J3 | Pourquoi maintenant | il a demandé « une vision là dessus » et n'a vu aucune page | SPEC l. 889, l. 903 (« Je vois pas l'artefact où j'ai déjà validé ? ») |
| J5 | Acquis | la tuile ① TVA de p3c-3 telle quelle ; la vue lit le choix fait à la saisie, ne le recalcule pas | D248 ; capture `v3/p3c-3/p3c-3-geste-tva.png` |
| J6 | Refusé | rien de déduit montré comme vrai ; pas d'intro fiscale ; pas de cockpit | PORTRAIT § 4 ; critique v1 (« Tu n'es pas assujetti ») |
| J7 | Contrainte | « l'inconnu jamais à zéro » : une dépense ancienne à 0 est « TVA inconnue » | PORTRAIT § 3.4 ; `src/types/index.ts:22-23` (0 ambigu) |
| J8 | Ses mots | « rembourser », « taux », « assujetti », « facture » ; « impôt préalable » entre parenthèses seulement | SPEC l. 889 |
| J9 | Code contre sources | taux multiples perdus, 0 ambigu, monnaie perdue à l'enregistrement | `src/types/index.ts:22-23` ; `functions/src/invoiceScanCore.ts` (`vat`, `currency`) |
| J12 | Hors périmètre | déclaration AFC, conseil fiscal ; l'impôt sur les acquisitions reste une note (à vérifier) | SPEC l. 889 (« une vision », pas un conseil) |
| J18 | Cas réel | une facture dont la TVA lue se contredit (colonne ≠ somme des taux) : « choisie à la saisie », jamais « payée » sans réserve | capture p3c-3 (N + R ≠ imprimé) |

## Hypothèses du pilote (réversibles, à recopier dans chaque brief)
1. Le statut vient du réglage de l'app (`isTvaRegistered`) et se dit comme un réglage (« Non assujetti · réglage »), pas comme un fait.
2. Premier plan : la réponse « récupérer : non », le total de TVA de la période, sa part par taux pour les dépenses dont le taux est connu,
   et le compte des dépenses à TVA inconnue, à côté du total ; au toucher : les dépenses d'un taux, les douteuses, les inconnues.
3. Les factures étrangères (MwSt 7 / 19 %) ne sont pas de la TVA suisse : comptées à part, jamais dans les taux suisses.
4. Taux : 8,1 % normal, 2,6 % réduit, 3,8 % hébergement ; sa bière est au taux normal. Ingrédients probablement à 2,6 % (non vérifié pour
   chaque produit : la vue lit le taux de la facture, elle ne le suppose pas).
5. 60 mots au plus au premier plan (sans les lignes de dépenses) ; 390 d'abord ; données fictives.

## Axes de variantes (séries v0)
- **place** : un mode de Synthèse à côté de « Situation / Coûts » ; une section d'Annuel ; une carte de Synthèse qui ouvre la vue.
- **période** (le seul facteur libre de la vue, L10) : année ; trimestre ; par brassin (sa ventilation naturelle selon le regard Brasseur).
- **« si assujetti »** : aucun chiffre, un lien vers l'AFC et sa fiduciaire ; le net « récupéré − facturé » sur ses ventes enregistrées,
  hypothèses visibles au toucher (taux de ses ventes, méthode effective ; la méthode TDFN ne récupère rien).
- **forme** : barre empilée par taux ; liste à pastilles ; chiffres seuls.

## Accords groupés (à lui, avec la page)
- Garder la TVA **par taux** (et dire « inconnue » plutôt que 0, et la monnaie) à l'enregistrement d'une dépense : champ facultatif, sans
  migration, mais un déploiement : son accord.

## À mesurer et au conseil
- À mesurer : sur les vérités du banc (13 pièces), combien ont deux taux, une monnaie étrangère, ou aucune TVA imprimée.
- Au conseil (pas maintenant) : l'impôt sur les acquisitions (services étrangers au-delà de 10 000 CHF par an, à vérifier) ; seulement
  s'il le demande.

## Désaccords du jury
- Brasseur : ordre « je récupère ? » d'abord, période brassin ou année, net « si » attendu. Contradicteur : deux questions dans une vue
  (L10), net seulement ou rien, curseur refusé (simulateur fiscal). Tranché : la vue garde un seul facteur libre (la période) ; le « si »
  devient un axe (rien, ou net fixe sur ses ventes enregistrées) ; pas de curseur.

## Coût
2 appels (Brasseur fable 39 k jetons, Contradicteur opus 36 k jetons).
