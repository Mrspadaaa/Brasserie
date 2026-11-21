# Chaîne ACHETER / DÉPENSER : analyse (21.11, partielle)

Portée : besoin (manque pour un brassin, seuil, matériel) → commande → facture photographiée → stock → Finances → Calendrier → brassin.
Jeu : 390×844 tactile, build de test de port-carnet, fixture simulée (`acheter/fixture-achat.mjs` : brassin « IPA de Noël » à J+10 qui manque
de 15 kg de pilsner, 250 g de Citra et 1 sachet d'US-05 ; soude sous son seuil ; besoin « Pompe de transfert » 450 CHF ; caisse de départ
+300 CHF). Lecture de facture simulée (2,5 s imposées par le banc). Bugs : `BUGS-acheter.md`. Banc rejouable : `acheter/chaine.mjs`.
REGLES.md n'existait pas à l'écriture : les règles citées sont celles du CADRAGE § 3 (R1 à R7).
Fréquences : aucun usage réel mesuré ici. Estimation, source sa fixture du 20.11 (« Impôt sur la bière · 4 brassins ») et ses
plaintes : un brassin ≈ une commande de matières et une facture ; quelques brassins par mois. Chaîne au moins mensuelle.

## 1. Table des chaînes

| Chaîne | Gestes aujourd'hui (joués) | Temps | Gestes visés | Frictions |
|---|---|---|---|---|
| A. Voir ce qui manque pour le prochain brassin | Bord : 0 (liste visible). Par Stocks : Stocks, Courses, **Tout voir** = 3 | 0,3 s/geste ; Stocks 1re fois : page « Chargement… » | 2 (Stocks, Courses) | WFA-1 liste vide par défaut ; WFA-2 NaN |
| B. Passer la commande (liste au fournisseur + dépense prévue) | Copier = 1, puis achat prévu à la main au Calendrier : + Achats, titre tapé, montant tapé, date, fournisseur ≈ 8 à 10 (non joué : estimé d'après la feuille d'achat) ; total ≈ 12 | — | 4 : Stocks, Courses, « Commander chez Brouwland », (Annuler possible) | WFA-4 rien ne relie la liste, la commande et le brassin ; ressaisie du montant et du fournisseur |
| C. Facture photographiée → dépense | +, Facture photo ou PDF, Photographier le ticket = 3 ; lecture 2,7 s (dont 2,5 s simulées) ; Ouvrir la ligne, Garder = 2 (lignes 2 et 3 perdues, WFA-8) ; Confirmer = 1. ≥ 6 gestes pour 3 lignes, sans compter les 2 lignes restées ouvertes | 4,4 s jusqu'à la lecture | 5 : +, Facture, photo, « Garder les 3 », Confirmer | pl1 marche : « Pour Commande de malt · trouvé » sans geste. WFA-6 g au lieu de kg, WFA-7 compteurs, WFA-9 bandeau Drive, WFA-10 refus muet |
| D. Facture → stock → brassin couvert | non joué (REPRISE) ; la carte Stock promet « 5 → 30 Kg après réception » | — | 0 de plus : le manque du brassin se recalcule seul | à prouver : manque de l'IPA de Noël à 0 après Confirmer |
| E. Facture → Finances → Calendrier | non joué (REPRISE) ; avant : trois récits de caisse (WFA-3) | — | 0 : un seul solde partout | WFA-3 ; WFA-5 le brassin « coût à venir » |
| F. Besoin matériel → achat → Parc | non joué (REPRISE) ; Stocks › Matériel › À venir montre « Pompe de transfert » | — | — | à jouer |

## 2. Quatre regards (sur ce qui a été joué)

1. **Le brasseur** (PORTRAIT § 3, lisibilité d'abord) : il aime la proposition « Pour Commande de malt · trouvé » et la carte « 5 → 30 Kg
   après réception » (retour immédiat, règle R4, « du grand art »). Il bute sur la liste vide (« Il me dit 4 à commander et la liste est vide
   ??? »), sur NaN, sur 25000 g, et surtout sur la caisse : « Je suis en négatif et je le vois que sur le calendrier ? ».
2. **Interaction** : cibles sous 44 px de haut dans la Dépense (Garder 65×32, Suivant 85×32, Ingrédient/Service/Matériel 32 px, « Photographier
   le ticket » 356×28, onglets de Stocks 69×28) ; Confirmer refusé sans phrase (WFA-10) ; aucun Annuler après Copier (rien n'est posé, donc rien à défaire). Hors ligne non joué.
3. **Intégration** : la donnée « à commander » vit dans Stocks, la « commande » dans Finances/Calendrier, le « coût du brassin » nulle part
   (WFA-4, WFA-5) ; la caisse a trois valeurs (WFA-3). La facture, elle, retrouve le besoin (pl1) et l'article (proposé).
4. **Performance perçue** : ouverture 0,46 à 0,77 s ; geste → calme 0,28 à 0,36 s, fenêtre de 250 ms comprise ; première ouverture de Stocks sur
   page blanche « Chargement de l'écran… » ; lecture simulée : 0,2 s d'app autour des 2,5 s du banc (le vrai délai Gemini n'est pas mesuré ici).

## 3. Propositions qui passent le filtre de gain (GAIN.md)

Chaque proposition est une chaîne d'actions ; aucune ne fixe un visuel (le visuel reste celui de l'écran qu'il a choisi).

**G1 — « Commander chez <fournisseur> » pose l'achat prévu** (R1 une action pose ses suites ; R2 estimation dite comme telle).
- Chaîne : Courses › fournisseur › Commander → l'achat prévu « Brouwland · 3 articles » est posé au Calendrier, avant le brassin qui en a besoin (jour
  du brassin moins le délai connu du fournisseur, sinon J−7), au montant **estimé** Σ manque × prix du stock (≈ 15×1,6 + 250×0,09 + 4,5 = 51 CHF,
  « estimé ») ; relié au brassin et aux articles ; la liste est copiée ; Annuler défait tout.
- Avant ≈ 12 gestes (B, dont 2 champs tapés), après 4 : −67 %. Ressaisie supprimée : fournisseur et montant. Fréquence : par brassin.
- Erreur rendue impossible : la courbe de caisse oublie la commande. Coût : un bouton par fournisseur dans Courses ; retire la création manuelle.
- Ses mots : « En 1 bouton on a 3 action super précise » (cas du projet, même règle) ; « tout ce qui m'economise des gestes ».

**G2 — Courses s'ouvre sur l'horizon du prochain brassin planifié** (R5 peu à la fois dans l'ordre de la décision ; R2 précision juste).
- Avant : Stocks, Courses, Tout voir = 3 et un écran vide trompeur ; après : 2 ; −33 %. Erreur rendue impossible : croire qu'il n'y a rien à commander
  (WFA-1). Coût : aucun ajout, le réglage « S49 · 6 sem. · Tout » reste.

**G3 — Une seule caisse partout** (R4 chaque réglage montre ce qu'il change ; règle n° 1 : la valeur, pas le dessin).
- Le solde « au plus serré » du Calendrier (−570, S50) est le même chiffre au Bord et en tête de Finances, dit « estimé » tant qu'un paiement attend.
- Gain : erreur rendue impossible (dépenser en se croyant au positif) ; 0 geste au lieu d'aller au Calendrier (2 gestes). Fréquence : chaque ouverture.
  Coût : un chiffre au Bord ; retire « Charges 0,00 » qui ne répond à rien. Ses mots : « je suis en négatif et on le voit même pas ».

**G4 — Le brassin planifié porte son coût estimé** (R1, R4).
- Le coût des ingrédients du brassin vient des prix du stock (ce qui manque au prix fournisseur) et entre dans la courbe, dit « estimé » ; la commande
  G1 le remplace quand elle est posée (jamais compté deux fois). Gain : erreur rendue impossible (courbe qui ignore le coût du brassin, WFA-5).
  Fréquence : par brassin. Coût : aucun geste ajouté. Recoupe la chaîne PRODUIRE : à confronter avec son analyse.

**G5 — Facture : un geste garde toutes les lignes sûres** (R6 vue spécialisée ; R1).
- Les lignes dont l'article est proposé avec son « avant → après » se gardent ensemble (« Garder les 3 ») ; seules les vraies divergences restent
  en doute, une à la fois, avec Suivant (WFA-8). Avant : ≥ 3 × (Ouvrir/Suivant + Garder) = 6 pour 3 lignes ; après : 1 ; −83 %.
  Erreur rendue impossible : une ligne reçue mais restée « proposée », donc absente du stock. Fréquence : par facture. Coût : un bouton ; retire le défilé ligne à ligne.
  Garde-fou : à vérifier contre « Terminé · 3 doutes à revoir » et la règle D295 (lien sûr) avant toute maquette.

## 4. Axes de goût (variantes, jamais des questions)
- G1 : la date de l'achat prévu — veille du brassin, J−7, ou délai appris du fournisseur ; la page reste sur Courses ou bascule au Calendrier (axe déjà ouvert au CADRAGE § 6).
- G1 : le prix estimé — dernier prix payé, prix de l'article, fourchette.
- G3 : le chiffre au Bord — solde au plus serré, ou « à dépenser sans passer sous 0 ».

## Annexe — gimmicks écartés
- Envoyer la commande au fournisseur par e-mail depuis l'app : geste externe, irréversible, et « Copier » suffit déjà.
- Estimer le prix par l'IA : le prix est déjà au stock ; un appel facturé pour rien.
- Une vue « toute la chaîne de l'achat » : refusée (pe5, CADRAGE § 4).
- Scanner un code-barres à la réception : pas de gain mesuré, la facture porte déjà les lignes.
- Animation du stock qui monte après Confirmer : rien de plus que « 5 → 30 Kg » déjà montré avant.
