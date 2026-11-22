# Chaîne DOCUMENTS : ce qu'un document entré pose seul (21.11)

Ses mots : « J'ai l'impression que pour papier et vente il faudrait avoir un peu la même logique sauf que c'est pas une durée mais
une date. SI par exemple j'ai oublié de noter une vente ou quoi... Après en théorie, tout ce qui est vente, papier et tout devrait être
automatique quand j'entre un document... » (SPEC-BRASSEUR, 21.11, capture-12).

**Jeu.** Au doigt, 390×844 tactile, build de test d'une copie propre de `port-carnet` HEAD 5fb61c580 (`git archive` vers
`os.tmpdir()/wfd-head`, `.env` local copié, config `scripts/parcours/vite.parcours.config.mjs`), `?dev-local`, fixture ZZ TEST
`fixtureChaines` (pilsner ramené à 5 kg), lecture de pièce **simulée** (`acheter/banc.mjs` : `aiTask` répondu dans la page, aucun
appel Gemini ; réseau hors localhost coupé). Banc : `documents/pas.mjs`. Captures : `documents/captures/` (toutes ouvertes).
**Mesuré** = joué au banc ; **compté** = gestes relevés au banc ou au code ; **estimé** = ni joué ni compté. Aucune fréquence n'est
mesurée : estimées sur ses données (14 brassins par an, ventes de fûts aux pros, tickets de magasin).

Solde de référence au Calendrier (« à dépenser sans passer sous 0, S50 ») : **1 010 CHF** avant tout document (mesuré).

## 1. Table document × effet automatique

| Document (gestes d'entrée, comptés) | Calendrier | Finances | Stock / Parc | Reste à la main | Doublon |
|---|---|---|---|---|---|
| **Facture fournisseur à payer**, photo ou PDF (4 : Actions rapides, Facture, Photographier, Confirmer ; lecture 2,5 s simulée) | **manque** : rien à sa date ni à son échéance ; « à dépenser » 1 010 → 993, la dette de 421,57 n'y entre pas (cap. 02) | fait : « à payer 421,57 · échéance à préciser » (cap. 03) | fait : 3 lignes reliées entrent au stock (« 2 → 1 article à commander ») | l'échéance (non lue sur le document) ; le paiement : Finances › Payer › ✓ Payer (3, compté) | **oui** : « Commande de malt −420 » reste à côté de la facture 421,57 (cap. 02) |
| **Ticket payé** (Landi, 18.11, carte ; 4 gestes) | **manque** : absent d'Achats et de Papiers en S47 ; seul le solde bouge, 1 010 → 985 (cap. 05) | fait : « 24,90 payé » | **manque** : la ligne « Soude caustique 2 kg » (picto stock), sans article existant, n'entre pas au stock, sans phrase | créer l'article et son stock à la main | non |
| **Facture de matériel payée** (Brewferm, pompe 450, du 28.10 ; 4 gestes) | **doublon** : « Pompe de transfert −450 » reste en Travaux ; 1 010 → **560** (cap. 06) | fait : dépense payée (mois d'octobre) | fait : nouvel appareil au Parc ; **doublon** : le projet reste « À venir 1 » (cap. 07) | retirer le projet à la main (Matériel › À venir › Marquer comme réalisé) | **oui**, 450 comptés deux fois |
| **Pièce fiscale : impôt sur la bière** (facture OFDF payée, 37,37 ; 4 gestes) | **doublon** : « Impôt sur la bière · 2 brassins » reste dans Papiers en janvier ; 1 010 → 973 (cap. 08) | fait : dépense payée | — | la déclaration : Clients › Impôt bière › « Copier pour Taxas » (le montant est calculé, ~37,37) ; le paiement saisi comme une facture | **oui** : la pièce ne solde pas l'échéance dérivée (aucun lien au code) |
| **Vente en caisse** (comptoir, 2 × 33 cl, TWINT ; 7 gestes) | fait : « +9 » dans Ventes, au 21.11 (cap. 11) | fait : « Entré 9,00 » | fait : Pale Ale 120 → 118 × 33 cl | la date si la vente est oubliée : sélecteur natif dans l'annexe, sous le pli (cap. 12) | non |
| **Facture à un client** (QR, La Cigogne, 2 fûts ; 6 gestes) | **manque partiel** : rien au 21.11 (jour de la vente et de la livraison) ; l'attente d'encaissement au 21.12 seulement ; 1 010 → 730 (la promesse du 1.12 soldée, l'argent au 21.12) (cap. 10) | fait : « À encaisser 280,00 » | fait : F-001 et F-002 livrés, proposés et modifiables (cap. 09) | l'encaissement : Finances › Encaisser › ✓ (3, compté) | non : la promesse est soldée (B5, défaut oui) |
| **Vente notée au Calendrier, puis encaissée** (Ventes › client › +280 › Ajouter ; puis caisse) | fait : 1 010 → 1 290 → 1 290 (cap. 14) | fait | fait : fûts livrés | la note elle-même (intention, légitime) ; une date passée impossible dans la feuille (horizons Aujourd'hui à 1 an, cap. 13) | non : « La vente promise … est soldée » |
| **Relevé bancaire** | n'existe pas | n'existe pas : aucun import (ni camt, ni CSV) | — | chaque paiement et chaque encaissement se confirme pièce par pièce (3 gestes chacun) | — |

**Bilan.** 7 documents joués et 1 absent (relevé). **Fait** : la vente (caisse, facture client, note puis encaissement) pose ses
suites et solde son prévu. **Manques** : 6 (dépense payée hors Calendrier ; échéance de facture non lue ; facture client absente à sa
date ; article neuf d'un ticket hors stock ; date passée d'une vente ; relevé bancaire). **Doublons** : 3, tous côté dépense (achat
prévu, matériel prévu, impôt dérivé). La règle B5 « un réel solde son prévu » est faite pour la vente, pas pour la dépense.

## 2. Propositions (filtre GAIN, cinq points)

**PD-1 — Tout document daté pose sa chose au Calendrier, à sa date, passé compris ; une seule source.** (R1, R5 « rien deux fois »)
La pièce elle-même (dépense payée, ticket, facture émise ou reçue, pièce fiscale) devient la chose de sa rangée (Achats, Travaux,
Papiers, Ventes) à la date du document ; à payer, elle est aussi à son échéance. Aucune copie : la chose lit la pièce, comme
« encaissées » le fait déjà pour la vente (`useDonneesCalendrier.ts`), et le prévu soldé disparaît (PD-2).
- Chaîne jouée : ticket du 18.11 et facture du 28.10 absents du Calendrier (cap. 05, 06) ; facture client absente au 21.11 (cap. 10).
- Avant : impossible (aucun geste ne pose une dépense passée au Calendrier). Après : 0 geste.
- Fréquence : chaque ticket et chaque facture, hebdomadaire (estimé).
- Gain : oubli impossible (un mois sans ses dépenses au Calendrier, alors que ses ventes y sont).
- Coût : rien d'ajouté à l'écran ; plus de choses dans les rangées Achats et Papiers (passé compris), à dire en une ligne par semaine
  dans le mode An (série déjà regroupée, CRITIQUE-12).

**PD-2 — Un réel solde son prévu, pour tous les genres, comme la vente le fait déjà.** (R1, R7 : pousser le « Solde » de la caisse)
La Dépense propose « ✓ Solde l'achat prévu « Commande de malt » −420 », défaut oui, Annuler, sur le prévu le plus proche par
fournisseur, catégorie et montant ; la facture d'un matériel prévu le passe de « À venir » au Parc et retire son projet ; une pièce
OFDF solde l'échéance d'impôt de sa période.
- Chaîne jouée : 3 doublons mesurés (1 010 → 560 pour la pompe ; −420 à côté de 421,57 ; impôt gardé, 1 010 → 973).
- Avant : retirer le prévu à la main (≈ 4 gestes, estimé : Calendrier, la chose, l'ouvrir, Réalisé ou Supprimer), impossible pour
  l'impôt (dérivé du brassin, aucun geste). Après : 0 (proposé, coché).
- Fréquence : chaque facture de matières, mensuel (estimé) ; matériel, rare ; impôt, trimestriel.
- Gain : erreur rendue impossible (caisse fausse de 450 CHF, mesurée) ; ressaisie supprimée.
- Coût : une ligne cochable dans la Dépense, la même que dans la caisse (`cs-solde`). Rien d'autre.

**PD-3 — L'échéance d'une facture se lit sur le document ; à défaut, elle s'estime.** (R2, R1)
La lecture rend l'échéance imprimée (« payable à 30 jours », date d'échéance) ; sinon le délai appris du fournisseur, sinon 30 jours
marqués « estimé ». La facture entre alors dans « à dépenser » et au Calendrier à son échéance.
- Chaîne jouée : facture à payer « échéance à préciser », hors de la courbe (1 010 → 993, la dette de 421,57 absente) (cap. 02, 03).
  Le schéma de lecture n'a aucun champ d'échéance (`geminiScanner.ts`, compté au code).
- Avant : trouver la pièce dans Finances et taper sa date (≈ 4 gestes, estimé), ou l'oubli. Après : 0 ; 1 pour corriger.
- Fréquence : chaque facture fournisseur, mensuel au moins (estimé).
- Gain : ressaisie supprimée (la date est imprimée) ; erreur impossible (caisse surestimée de la dette).
- Coût : un champ de plus à lire ; il se mesure au banc de lecture (skill `banc-lecture`, simulé puis réel en test dédié) avant
  toute bascule.

**PD-4 — Une vente oubliée se date sur la frise, à un repère, passé compris.** (R3, R2 ; sa demande de capture-12)
La date de la caisse et de la feuille Ventes du Calendrier prend la frise de la feuille d'ajout (D404) avec un seul repère, tiré
vers le passé.
- Chaîne jouée : la caisse n'a qu'un sélecteur natif dans l'annexe, sous le pli (cap. 12) ; la feuille Ventes n'offre que
  Aujourd'hui, 1, 3, 6 mois et 1 an (cap. 13).
- Avant : défiler, toucher le champ, choisir le jour, valider (4, estimé). Après : 1 glisser (−75 %).
- Fréquence : à chaque oubli, mensuel (estimé, ses mots « SI par exemple j'ai oublié »).
- Gain : −75 % de gestes. Coût : le mécanisme de frise existe (R7), il se porte.

**PD-5 — Le relevé bancaire confirme les paiements et les encaissements.** (R1 ; L29 : problème d'école, le rapprochement bancaire)
Méthode standard en Suisse : relevé ISO 20022 **camt.053 / camt.054** exporté de l'e-banking ; la facture QR émise par l'app porte
sa référence (QRR), donc l'encaissement se rapproche exactement ; une dépense se rapproche par montant, date et bénéficiaire, proposée
et non imposée. Aucune IA (la garantie se bâtit sans elle, L20).
- Chaîne jouée : Finances › Payer › ✓ Payer (3) et Finances › Encaisser › ✓ (3), pièce par pièce.
- Avant : 3 gestes par pièce, soit ≈ 30 à 60 par mois (estimé, 10 à 20 pièces). Après : ≈ 3 gestes par relevé.
- Fréquence : mensuel. Gain : −90 % (estimé) et une ressaisie supprimée (le paiement est déjà dans la banque).
- Coût : une entrée neuve (+ › Relevé), un format à lire, des cas ambigus à proposer. Décision lourde : voir plus bas.

**Gimmicks écartés.**
- Déclarer l'impôt à Taxas depuis l'app : geste externe, aucune interface publique ; « Copier pour Taxas » suffit.
- Lire le relevé PDF par l'IA : le camt est un standard exact, l'IA n'ajouterait qu'un risque et un coût.
- Une vue « tous mes documents » : refusée (pe5, CADRAGE § 4).
- Rappel push à l'échéance : la chose au Calendrier (PD-1, PD-3) le porte déjà.

## 3. Bugs (WFD-n)

| N° | Gravité | Constat (preuve) | Règle |
|---|---|---|---|
| WFD-1 | haute | Facture de matériel payée (pompe 450) : l'appareil entre au Parc, mais le projet reste « À venir 1 » et « Pompe de transfert −450 » reste au Calendrier ; à dépenser 1 010 → 560 (cap. 06, 07). Prolonge WFA-12 et WFA-13. | R1, R5 |
| WFD-2 | haute | Facture à payer : l'échéance n'est pas lue (aucun champ au schéma), la pièce tombe en « échéance à préciser », hors du Calendrier et de « à dépenser » (cap. 02, 03). | R1, R4 |
| WFD-3 | haute | WFA-15 toujours là sur HEAD 5fb61c580 : « Commande de malt −420 » à côté de la facture 421,57 ; la Dépense n'a pas le « Solde » de la caisse (cap. 02). | R1, R5 |
| WFD-4 | moyenne | Facture OFDF payée : « Impôt sur la bière · 2 brassins » reste dans Papiers en janvier ; 1 010 → 973 (cap. 08). Cas fabriqué (pièce de novembre) ; l'absence de lien pièce → impôt est un fait du code. | R1 |
| WFD-5 | moyenne | Dépense payée (ticket du 18.11, facture du 28.10) absente du Calendrier à sa date, alors qu'une vente encaissée y est (+9 au 21.11) (cap. 05, 11). | R1 |
| WFD-6 | moyenne, à confirmer | Ligne de ticket « Soude caustique 2 kg » (picto stock) sans article existant : rien au stock après Confirmer, sans phrase (Stocks › Articles relu). | R1, R4 |
| WFD-7 | basse, à trancher | Facture client : la vente du 21.11 n'est pas au Calendrier ce jour-là, seulement l'encaissement attendu au 21.12 (cap. 10). | R1 |
| WFD-8 | basse | Date d'une vente : sélecteur natif dans l'annexe de la quittance, sous le pli (cap. 12) ; la feuille Ventes n'a pas de passé (cap. 13). | R2, R3 |
| WFD-9 | basse | L'entrée « Facture, photo ou PDF » ouvre « Photographier le ticket ». WFA-2 (« seuil NaN g ») reconfirmé au Bord. | — |

Non établi : la baisse de 17 CHF du solde après la facture à payer (1 010 → 993) ; cause non trouvée (prix du Citra changé par la
facture, sur le coût estimé du brassin ?).

DÉCISION À PRENDRE : PD-5 (import camt) ajoute un genre de document ; à passer au conseil avant toute maquette (format, banques
du brasseur, rapprochement des dépenses).
