# Chaîne ACHETER / DÉPENSER : analyse (21.11, chiffres mesurés)

Portée : besoin (manque pour un brassin, seuil, matériel) → commande → facture photographiée → stock → Finances → Calendrier → brassin.
Jeu : 390×844 tactile, build de test de `port-carnet` (HEAD d5a2f056c, build reconstruit le 21.11), `?dev-local`, fixture simulée
(`acheter/fixture-achat.mjs`, TVA corrigée), lecture de facture simulée (banc : 2,5 s imposées, aucun appel Gemini). Bugs : `BUGS-acheter.md`.
Banc : `acheter/chaine.mjs` (segments 1 à 3), `acheter/parcours.mjs <1|4>` (chaînes 1 à 4 et INP), `acheter/horsligne.mjs`, `acheter/stock-apres.mjs`.
Captures : `acheter/captures/parcours-1x/`, `parcours-4x/`, `hors-ligne/`, `stock-apres/` (toutes ouvertes et regardées).

Méthode des chiffres :
- **Geste** : un toucher. **Temps** : toucher → DOM calme 250 ms (mesuré). Les attentes du script (1,5 s après Confirmer,
  4 s après la photo hors ligne) sont retirées des temps d'app et dites ainsi.
- **INP** (mesuré) : Chrome, CDP `Emulation.setCPUThrottlingRate` à 1× puis 4×, PerformanceObserver `event` (seuil 16 ms).
  Moins de 50 interactions : INP = le maximum. Attribution au geste par horodatage (non vérifiée par trace).
  Limite : le temps « toucher → calme » ne rend que 430 ms là où l'INP du OK compte 984 ms ; l'INP fait foi.
- Fréquences : aucun usage réel mesuré. Estimation, source sa fixture du 20.11 et ses plaintes : un brassin ≈ une commande et une facture ;
  quelques brassins par mois. Chaîne au moins mensuelle (estimé).
- Chaîne B (commande) non jouée : aucun bouton « Commander » ; seul « Copier la liste ». Ses chiffres restent estimés.

## 1. Table des chaînes

| Chaîne | Gestes (mesuré) | Temps mesuré : ×1 / ×4 | Gestes visés | Frictions |
|---|---|---|---|---|
| A. Voir ce qui manque | Bord : 0 (« 4 articles à commander » visible). Stocks, Courses, Tout voir = 3 | 1,5 s / 2,8 s | 2 (G2) | WFA-1 : « 1 manque · rien cette semaine » sans « Tout voir » ; WFA-2 NaN |
| B. Passer la commande | non joué (estimé : 12 gestes dont 2 champs tapés) | — | 4 (G1, estimé) | WFA-4 : rien ne relie la liste, la commande et le brassin |
| C. Facture → stock | 9 gestes : Actions rapides, Facture, Photographier (3) ; Ouvrir la ligne, Garder (2, ligne 1 seule) ; Confirmer ; OK de la feuille ; Stocks, Articles (2). Lignes 2 et 3 jamais ouvertes, confirmées quand même | photo 4,0 s / 5,2 s, dont 2,5 s de lecture simulée ; Confirmer ≈ 0,5 s / 0,9 s ; OK 0,4 s / 0,4 s | 6 pour la même facture (G5 : 9 → 8, −11 %, rejeté) | WFA-14 (OK : INP 984 ms) ; WFA-6, WFA-7, WFA-8 |
| C′. Stock après Confirmer (mesuré) | Malt pilsner 30 kg (+25 kg, facture 21.11) ; Citra 650 g (+500 g) ; US-05 : +6 sachets facturés ; Bord : « 1 article à commander : Soude caustique » (IPA de Noël « À brasser », prévu 01.12). Le manque du brassin est couvert | — | 0 de plus | Soude sous seuil : besoin de 1,5 kg encore affiché (vrai, pas une erreur) |
| D. Facture → Finances → Calendrier | Finances : 1 geste, 0,7 s / 1,4 s ; facture visible « à payer 421,57 · Brouwland · BW-2026-1142 · Payer ». Calendrier : 1 geste, 1,5 s / 2,4 s | — | 0 de plus (une seule caisse) | WFA-3 : Bord « Charges 421,57 », Finances « à payer 421,57 », Calendrier « −570 CHF » : trois chiffres ; WFA-15 : « Commande de malt −420 » reste à côté de la facture 421,57 |
| E. Matériel → Parc | Stocks, Matériel, À venir, Pompe de transfert (4) ; Marquer comme réalisé, Parc (2). Total 6 : 1,8 s / 2,5 s puis 0,8 s / 1,1 s | — | 6 (la voie facture de la Pompe non jouée : pas de fixture) | WFA-12 : le 450 CHF disparaît du Calendrier sans dépense ; WFA-13 : la pompe va en Réalisés, pas au Parc |
| F. Hors ligne (photo) | Bord, Actions rapides, Facture, Photographier (4) ; Saisir à la main (1). Message « Service IA momentanément indisponible. » clair ; photo gardée (`01-courses.png`) ; saisie à la main proposée | message ≈ 0,3 s après le geste | — | WFA-9 reconfirmé : bandeau « Connecter Drive · La connexion Google ne peut pas être préparée » dans la même feuille |

Doublon mesuré (positif) : re-photographier le même ticket après Confirmer affiche « Déjà enregistré · même fichier » et ne double pas la dépense.

## 2. Regards (sur ce qui a été joué)

1. **Le brasseur** (PORTRAIT § 3, lisibilité d'abord) : il tient la carte « 5 → 30 Kg après réception » et le manque du brassin qui se recalcule (la commande du malt disparaît du Bord après la facture). Il bute sur les trois chiffres de la caisse et sur la pompe qui « disparaît » de son calendrier.
2. **Interaction** : la feuille « Tes finances, avant → après » (Annuler / OK) reste ouverte sur Bord, Courses et Calendrier après Confirmer. Rien ne dit ce que OK valide (WFA-14). Lignes 2 et 3 jamais ouvertes ; compteurs contradictoires (WFA-7).
3. **Intégration** : la facture alimente le stock et Finances, pas le Calendrier comme ligne propre ; le Matériel réalisé sort de la caisse prévue sans passer par une dépense (WFA-12).
4. **Performance (CPU ×4)** : ouvertures d'onglet à 1,0 à 1,4 s (Stocks 1,4 s, Calendrier 1,2 s, Finances 1,0 s) contre 0,3 à 0,4 s à ×1. Le OK de la feuille : INP 984 ms à ×4 comme à ×1 (1008 ms). Un temps identique à 1× et à 4× ne ressemble pas à du calcul : probablement une attente fixe dans le gestionnaire ; à confirmer par trace Performance.

## 3. Propositions après mesure (GAIN.md, cinq points)

Chaque proposition est une chaîne d'actions ; aucune ne fixe un visuel.

**G1 — « Commander chez <fournisseur> » pose l'achat prévu.** Non candidat pour l'instant : point 2 (chaîne jouée) non rempli, la chaîne B n'a pas été jouée. Chiffres : estimés (12 → 4 gestes, −67 %). À jouer avant toute maquette.

**G2 — Courses s'ouvre sur l'horizon du prochain brassin.** Mesuré : Stocks, Courses, Tout voir = 3 gestes (1,5 s / 2,8 s) ; « 1 manque · rien cette semaine » cache la ligne du 01.12 tant qu'on ne touche pas Tout voir. Après : 2 gestes, −33 % (estimé pour l'après). Erreur rendue impossible : croire qu'il n'y a rien à commander (WFA-1). Coût : aucun ajout. **Candidat.**

**G3 — Une seule caisse partout.** Mesuré : trois chiffres pour une même situation. Bord « Charges 421,57 CHF » ; Finances « à payer 421,57 » ; Calendrier « −570 CHF à dépenser (S50) » qui ne bouge pas quand la facture est confirmée, puis « −120 CHF (S48) » quand la Pompe est marquée réalisée sans dépense (WFA-12). Le solde se lit en 1 geste (Calendrier, 1,5 s). Gain : erreur rendue impossible (dépenser en se croyant au positif, ou une dépense qui sort de la caisse sans paiement). **Candidat, renforcé.**

**G4 — Le brassin planifié porte son coût estimé.** Mesuré : « IPA de Noël · coût à venir » après la facture, malgré un prix au stock pour chaque ingrédient (WFA-5 reconfirmé). Gain : erreur rendue impossible (courbe sans coût du brassin). Coût : aucun geste ajouté. À confronter à PRODUIRE. **Candidat, à confronter.**

**G5 — Facture : un geste garde toutes les lignes sûres.** **Retiré.** Mesuré : Confirmer passe avec « 2 proposés · 3 à contrôler », et les trois lignes entrent au stock (Malt +25 kg, Citra +500 g, US-05 +6). Le cas « ligne reçue restée proposée, donc absente du stock » n'est pas reproduit. Gain réel : un geste (le « Garder » des lignes 2 et 3, si on le garde), soit 1 sur 9 gestes de la chaîne, −11 %, sous le seuil de 30 % (GAIN point 4). Le problème utile est WFA-7 (compteurs), pas un geste de plus.

## 4. Axes de goût (variantes, jamais des questions)

- G2 : horizon du prochain brassin, ou liste « à commander cette semaine » avec « tout voir » en repli.
- G3 : le chiffre au Bord : solde au plus serré, ou « à dépenser sans passer sous 0 ».
- G3 : une pompe « réalisée » sans paiement : sortie de la caisse prévue, ou ligne « à payer » tant qu'aucune dépense ne la couvre (à trancher par le brasseur, règle n° 1).
- G4 : coût du brassin : prix du stock, ou fourchette.

## Annexe — gimmicks écartés

- Envoyer la commande au fournisseur par e-mail depuis l'app : geste externe, irréversible, et « Copier » suffit déjà.
- Estimer le prix par l'IA : le prix est déjà au stock ; un appel facturé pour rien.
- Une vue « toute la chaîne de l'achat » : refusée (pe5, CADRAGE § 4).
- Scanner un code-barres à la réception : pas de gain mesuré, la facture porte déjà les lignes.
- Animation du stock qui monte après Confirmer : rien de plus que « 5 → 30 Kg » déjà montré avant.
- « Garder les 3 lignes » (ex-G5) : un geste sur neuf, et le risque de perte non reproduit (21.11).
