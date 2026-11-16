OK — 4 problèmes, 0 bloquants

# Test d'écran — Finances, rejeu des 12 problèmes de efff31bd (corrections t3) et les 8 vues en 390 sombre et 1280 clair

Version : a2c5db31 (arbre propre au départ). Banc local `?dev-local&finance-demo`, profil Chrome neuf par scénario, requêtes hors localhost
coupées (Gemini jamais joint). 390 tactile et 1280, clair et sombre (`cave`), les quatre faits pour chaque script. Scripts (copies de t3 et
de efff31bd) : `capturer.mjs` (scénarios dbl, pay, fiche, prev, bien, profil, profildemo, budget, ia ; `pointerdown` avant chaque clic),
`fnx.mjs` (pièces « ZZ TEST » A 10,00 et B 15,00 écrites dans le seul navigateur de test : virement 12,00 sur A et B, Modifier A en Autres
frais, 9,00 sous le payé, « J’ai bien payé 10,00 », Enregistrer), `apport.mjs` (apport 500 avec motif, fiche), `montage.mjs` (planches
`M-*.png`, maquette choisie à gauche). Aucun ECHEC. Erreurs de page : seulement `setPointerCapture … No active pointer` (le `pointerdown`
synthétique du banc). Rien d'enregistré hors du navigateur de test.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| fn7-payer12-390-sombre.png | sombre | 390 | Payer ZZ TEST — Fournisseur, virement 12,00 (A 10,00, B 2,00, reste 13,00) | 0 | 0 |
| fn10-choix-390-sombre.png | sombre | 390 | Modifier A, 9,00 sous le payé, les deux réponses, avant/après | 0 | 0 |
| fn10-creance-390-clair.png | clair | 390 | Opérations après « J’ai bien payé 10,00 », ligne du trop-payé | 1 | 0 |
| fn10-ficheA-390-clair.png, fn10-ficheA-1280-clair.png | clair | 390, 1280 | fiche A, « 1,00 CHF à récupérer : voir la créance › » | 1 | 0 |
| fn10-ficheC-390-sombre.png | sombre | 390 | fiche « À récupérer : trop payé sur … » (même problème 2) | 0 | 0 |
| dbl-repos-390-sombre.png | sombre | 390 | Doublons, la paire au repos (m1do-a) | 0 | 0 |
| dbl-annule-390-sombre.png, dbl-annule-1280-clair.png | sombre, clair | 390, 1280 | après « Annuler celle-ci » | 1 | 0 |
| arc-range-390-sombre.png, arc-consulte-390-sombre.png | sombre | 390 | archives, poignée, « Ranger 2025 », « Consulter » 2024 (m1ar-c) | 0 | 0 |
| arc-consulte-1280-clair.png, arc-consulte-1280-sombre.png | clair, sombre | 1280 | « Consulter » 2024 | 1 | 0 |
| pr-ouvert-390-sombre.png, pr-rempli-390-sombre.png, pr-rempli-1280-clair.png | sombre, clair | 390, 1280 | Prévoir une dépense, vide puis Loyer 500,50 chaque mois (m3pr-c) | 0 | 0 |
| prev-onglet-390-sombre.png, prev-onglet-1280-clair.png | sombre, clair | 390, 1280 | Prévisions, Avec / Sans fermenteur, 2 107,34 / 2 857,34 entiers | 0 | 0 |
| pm-pret-390-sombre.png, pm-pret-1280-clair.png | sombre, clair | 390, 1280 | Fermenteur supplémentaire, « Prêt à acheter · tu en es là » (m3pm-d) | 0 | 0 |
| im-ouvert-390-sombre.png, im-ouvert-1280-clair.png | sombre, clair | 390, 1280 | Cuve de fermentation, 20 % du reste, 288,00 (m3im-c) | 0 | 0 |
| bb-repos-390-sombre.png, bb-c3a-bas-390-sombre.png, bb-repos-1280-clair.png | sombre, clair | 390, 1280 | Budget Pale Ale de septembre, « Prévoir 64,26 » entier, détail du litre (m4bb-a) | 0 | 0 |
| pfd-ouvert-390-sombre.png, pfd-ouvert-1280-clair.png | sombre, clair | 390, 1280 | Solde et paramètres, 1 200 L/an, pleine largeur à 1280 (m4pf-c) | 0 | 0 |
| ia-feuille-390-sombre.png, ia-feuille-1280-clair.png | sombre, clair | 390, 1280 | Compagnon, la question, sans la phrase du registre (m4ia-c) | 0 | 0 |
| ia-chat-390-sombre.png, ia-chat-390-clair.png, ia-chat-1280-clair.png | sombre, clair | 390, 1280 | Compagnon après « Envoyer », « en novembre 2026 » | 0 | 0 |

Bloquants : 0

## Argent (fnx.json et apport.json, les quatre configurations identiques)

- Avant : payé 296,80, à payer 425,00, dépensé 721,80. Après le virement de 12,00 sur deux pièces : payé 308,80 (+12,00), à payer 413,00,
  dépensé 721,80 ; fiche B « Reste à payer 13,00 · Déjà payé 2,00 », « virement de 12,00 · 2 pièces ».
- Baisse sous le payé, « J’ai bien payé 10,00 » : payé 308,80, à payer 413,00, dépensé 721,80 ; Brassage 211,80 → 201,80, Autres 10,00
  (A 9,00 + trop-payé 1,00). Le 1,00 n'est ni perdu ni compté deux fois ; il se lit « à récupérer 1,00 · sorti aujourd’hui · banque ».
- Apport 500,00 avec motif : enregistré, fiche « Apport pour le malt · Apports privés · ✓ encaissé · +500,00 » ; dépenses inchangées.

## Problèmes

1. **Archives consultées à 1280 : « du jj.mm.aaaa au jj.mm.aaaa » toujours vides** (arc-consulte 1280 clair et sombre ; champs Du = "",
   Au = ""). Le problème 5 de efff31bd n'est pas corrigé : la voie annonçait « du 01.01 au 31.12 » pour une année consultée.
2. **La croix × garde son gros cadre** (noir en clair, blanc en sombre) sur le projet de matériel après « Prêt à acheter » (pm-pret 390
   sombre, 1280 clair) et sur les fiches A et C après Modifier (fn10-ficheA 390 et 1280 clair, fn10-ficheC 390 sombre). Corrigé sur
   Prévoir, Cuve, Profil, Budget, Compagnon, Archives. Ses maquettes (m3pm-d) ont une croix simple.
3. Doublons, après « Annuler celle-ci » : le bandeau dit bien « Plus de doublon », mais le bloc reste ouvert avec « Ce n'est pas un
   doublon » et la puce « Doublons » reste allumée (dbl-annule 390 sombre, 1280 clair). m1do-a : « Doublons : plus rien, le filtre se
   referme ». En brasseur : « il n'y a plus de doublon et il me demande encore si c'en est un ».
4. Trop-payé à 390 : la ligne de statut est coupée, « à récupérer 1,00 · sorti aujourd’hui · … », et le nom « trop payé sur « ZZ TEST —
   piè… » (fn10-creance 390 clair). « À récupérer 1,00 » se lit ; la banque et la pièce d'origine non.

## Doutes (non comptés)

- Doublons : juste après l'annulation, les totaux restent payé 485,80 / dépensé 885,80 (la pièce annulée comptée encore) ; l'écran dit
  « L’annulation s’écrit dans quelques secondes ». Totaux après le délai non vus ; s'ils ne baissent pas de 94,50, c'est une valeur
  fausse (m1do-a : « octobre, brassage −94,50 »).
- Croix des fiches A et C : `fnx.mjs` tape le montant au clavier ; le cadre y est peut-être le mode clavier voulu. Celui de pm-pret vient
  d'un toucher (`pointerdown`), donc compté.
- ia-chat 390 clair : la feuille paraît pâlie dans son ensemble (transition ?) ; à 1280 clair la question (texte foncé sur vert pâle) et
  « Auto » (blanc sur vert foncé) se lisent. Contraste non mesuré.
- Prévisions 390 : les deux tuiles tiennent, mais « au-dessus de zéro » passe à la ligne mot par mot (tuiles de cinq lignes) ; l'étiquette
  « sans fermenteur supplémentaire 2 857,34 » chevauche toujours la marche de la courbe.
- Fiche A : « Paiements 5 » pour trois lignes visibles ; fiche C : « Corriger ce paiement saisi par erreur » offert sur le 1,00, non joué.
- Banc : la Pale Ale de septembre n'a ni houblon ni levure (« hors recette ») ; fixture, pas l'écran.
- Compagnon « Envoi à confirmer · Réception non confirmée » et bandeau « hors connexion · mode local » : banc local, réseau coupé.

## Rejeu des 12 problèmes de efff31bd

- VERDICT 1 (trop-payé dit « payé ») : corrigé, « à récupérer 1,00 · sorti aujourd’hui », ton à payer hachuré ; reste la coupure à 390
  (problème 4).
- VERDICT 2 (fiche A sans adresse du 1,00) : corrigé, « 1,00 CHF à récupérer : voir la créance › » (390 et 1280).
- VERDICT 3 (« sur le mois novembre 2026 ») : corrigé, « en novembre 2026 » (ia-chat, les quatre).
- VERDICT 4 (Compagnon peu lisible en clair) : corrigé à 1280 ; 390 clair en doute.
- B1 (Prévoir 64,26 coupé) : corrigé, entier à 390 et 1280.
- B2 (tuile Sans fermenteur coupée) : corrigé, 2 857,34 visible.
- B3 (Prêt à acheter ne devient pas l'étape) : corrigé, Devis coché, « tu en es là ».
- B4 (Doublons après annulation) : en partie, « Plus de doublon » et puce sans chiffre ; reste le problème 3.
- B5 (champs du/au vides en archive à 1280) : non corrigé (problème 1).
- B6 (profil en colonne étroite à 1280) : corrigé, pleine largeur, tuiles lisibles.
- B7 (croix au gros cadre) : en partie (problème 2).
- B8 (phrase « Il lit aussi le registre ») : corrigé, absente.

## Gestes joués

- Payer : virement 12,00 sur deux pièces ; ✓ Payé puis Annuler sur A ; ✓ Payé du loyer puis « Autre montant ».
- Modifier : Autres frais, 9,00 sous le payé 10,00, « J’ai bien payé 10,00 », Enregistrer ; Modifier Malt et houblons.
- Apport 500,00 avec motif ; Doublons : puce, « Annuler celle-ci » ; Archives : poignée, Ranger, Consulter 2024.
- Prévoir : Loyer 500,50 chaque mois ; Projet : Prêt à acheter ; Cuve : 10 % du prix ; Budget : choix du brassin, détail du litre,
  rangée ; Profil : curseur 2 500 L/an, « Tout est noté depuis » ; Compagnon : pastilles, Envoyer.

## Non vus

- Totaux des Doublons après le délai d'annulation ; « Rétablir ».
- Réponse « Erreur de saisie : j’ai payé 9,00 » ; « Avoir ou remboursement » sur le trop-payé.

Pilote : vu (16.11 : bb-c3a-390-sombre ouverte ; 4 mineurs versés à BUGS.md FN-13 à FN-16)
