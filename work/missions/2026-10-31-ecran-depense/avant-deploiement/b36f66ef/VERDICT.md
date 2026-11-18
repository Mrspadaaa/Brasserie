OK — 3 problèmes, 0 bloquants

# Test d'écran — Finances, FN-30 à FN-42 (voie x3)

Version : b36f66ef (HEAD, `git diff b36f66ef -- src` vide). Banc local `?dev-local&finance-demo`, port 3000 (200). Script
`work/missions/2026-11-14-finances/voies/x3/jeu.mjs` (copie adaptée de x1, journaux `voies/x3/log-*.txt`) et sonde FN-30
`voies/x3/sonde30.mjs` (`log30-*.txt`), profil Chrome neuf par configuration, quatre configurations (390 tactile, 1280 souris ;
clair et sombre `cave`), aucune erreur de page. Gestes par l'app : saisie de A 10,00 et B 15,00 à payer (fournisseur « ZZ TEST —
Fournisseur ») ; ✓ Payé sur A ; Annuler (vrai toucher) à 1,1 s ; double toucher ; « Autre montant » (vrai toucher) ; fiche A ;
B payée 12,00 par la fiche ; B Modifier à 10,00 › « J'ai bien payé » › Enregistrer ; Opérations ; fiche de la créance ; Annuel ;
puis B2 5,00 et C 3,00 à payer, fiches des deux B, Payer 6,00 depuis C. Sonde : ✓ Payé A 10,00 puis « Autre montant » 8,00 › Payer.
74 captures ici ; 12 ouvertes en plein format (le tableau).

## Nombres relevés (identiques dans les quatre configurations)

| moment | payé | à payer | dépensé | à la main |
|---|---|---|---|---|
| avant | 296,80 | 400,00 | 696,80 | juste |
| A et B à payer | 296,80 | 425,00 | 721,80 | juste |
| ✓ Payé sur A | 306,80 | 415,00 | 721,80 | juste |
| Annuler à 1,1 s | 296,80 | 425,00 | 721,80 | annulé, juste |
| double toucher | 306,80 | 415,00 | 721,80 | payé une fois, aucune fiche |
| « Autre montant » ouvert puis fermé | 306,80 | 415,00 | 721,80 | rien écrit, juste |
| B payée 12,00 | 318,80 | 403,00 | 721,80 | juste |
| B à 10,00, « J'ai bien payé » | 316,80 | 400,00 | 716,80 | 696,80 + 20,00 ; 716,80 − 400,00 = 316,80 : juste |
| B2 5,00 et C 3,00 à payer | 316,80 | 408,00 | 724,80 | 716,80 + 8,00 ; 724,80 − 408,00 = 316,80 : juste |
| sonde : A 10,00 ✓ Payé puis « Autre montant » 8,00 | 304,80 | 402,00 | 706,80 | 296,80 + 8,00 ; reste 2,00 : juste, le 10,00 est remplacé |

En caisse 4 181,60 → 4 159,60 (−22,00). Annuel : Autres frais 233,00 (213,00 + 20,00, sans la créance).

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 03b-autre-montant-390-clair.png | clair | 390 | « Autre montant » touché : feuille « Payer ZZ TEST — Fournisseur », A seule cochée, B « pas dans ce virement » | 0 | 0 |
| 11-autre-montant-8-390-clair.png | clair | 390 | même feuille, 8,00 tapé : « reste 2,00 » hachuré | 0 | 0 |
| 03c-fiche-A-390-clair.png | clair | 390 | fiche A après Payé, Annuler, Payé : « Paiements 2 », « annulé 10,00 » replié, −10,00 vivant | 0 | 0 |
| 05a-payer-12-390-clair.png | clair | 390 | feuille Payer B, une pièce, 12,00 : « zz 12,00 · reste 3,00 » | 0 | 0 |
| 06-apercu-bien-paye-390-clair.png | clair | 390 | Modifier B à 10,00, « J'ai bien payé » choisi : aperçu après avec « 2,00 à récupérer » | 0 | 0 |
| 06-apercu-bien-paye-390-cave.png | sombre | 390 | même aperçu en sombre | 0 | 0 |
| 07-ops-a-recuperer-390-clair.png | clair | 390 | Opérations : « ZZ TEST — pièce B · trop payé » 2,00 ; « Autres frais 20,00 » sur 2 + 10 + 10 | 1 | 0 |
| 07b-ops-bande-390-clair.png | clair | 390 | bande 316,80 / 400,00 / 716,80 ; pile « Nettoya… » | 1 | 0 |
| 07c-ops-sans-bandeau-1280-cave.png | sombre | 1280 | Opérations à +8 s : bandeau effacé ; « Autres frais 20,00 » sur 2 + 10 + 10 | 1 | 0 |
| 07d-fiche-creance-390-clair.png | clair | 390 | fiche de la créance : titre « À récupérer : trop payé sur « ZZ TEST — pièce B » » | 1 | 0 |
| 09-fiche-B1-390-clair.png | clair | 390 | fiche de B (payée) : « 2,00 CHF à récupérer : voir la créance » ; « corrigé 12,00 » barré, −10,00 | 0 | 0 |
| 10-fifo-6-1280-clair.png | clair | 1280 | Payer 6,00 depuis C : « pièce B 5,00 · pièce C 1,00 · reste 2,00 », le plus ancien d'abord | 0 | 0 |

Bloquants : 0

## Vu juste

- FN-30 : le vrai toucher sur « Autre montant » arrive sur le bouton de l'avis (`BUTTON.ops-avis-b`) et ouvre Payer, pas la fiche ;
  8,00 remplace le paiement de 10,00 (payé 304,80, reste 2,00) ; fermer sans payer n'écrit rien. « Annuler » de l'avis : même chose.
- FN-31 : B2 saisie avant C le même jour : 6,00 vont d'abord à B2 (5,00), puis 1,00 à C.
- FN-32 : à deux pièces, « pièce B 5,00 », « pièce C 1,00 », plus « zz ».
- FN-36 : « 2,00 à récupérer » dans l'aperçu après, seulement avec « J'ai bien payé ».
- FN-38 : la fiche de B2 (5,00, à payer) ne montre aucune créance ; celle de B payée : « 2,00 CHF à récupérer : voir la créance ».
- FN-39 : « Doublons » désactivé, nom « Doublons : aucun doublon », infobulle « Aucun doublon à montrer » (avant et après B2).
- FN-40 : bandeau présent à 2, 4 et 5 s, effacé à 8 s (quatre configurations).
- FN-41 : fiche A : « Paiements 2 », la paire annulée repliée « annulé 10,00 » ; le −10,00 vivant suit m5fo-a (« −186,80 »).
- FN-42 : ligne « ZZ TEST — pièce B · trop payé » entière à 390.
- Non-régression : FN-33 (double toucher : payé une fois, avis visible, aucune fiche), FN-35 (question sur B partielle), FN-37
  (dépensé sans la créance, Annuel +20,00).

## Problèmes

1. **« Autres frais 20,00 » coiffe trois lignes qui font 22,00** (07-ops-a-recuperer-390-clair, 07c-ops-sans-bandeau-1280-cave) :
   la créance de 2,00 reste rangée sous Autres frais sans signe qu'elle sort du sous-total. Déjà n° 1 de 18abc69f, non traité.
   En brasseur : « 2 + 10 + 10, ça fait 22, pas 20 ».
2. **Pile à 390 : « Nettoya… »** (07b-ops-bande-390-clair). Déjà n° 5 de 18abc69f, non traité.
3. **La créance porte deux noms** (07d-fiche-creance-390-clair contre 07-ops-a-recuperer-390-clair) : la ligne dit
   « ZZ TEST — pièce B · trop payé », sa fiche titre « À récupérer : trop payé sur « ZZ TEST — pièce B » » sur deux lignes.
   En brasseur : « c'est la même chose ? ». Attendu : le même nom (FN-42) en titre de la fiche.

## Doutes (non comptés)

- Feuille Payer à une seule pièce : « zz 12,00 », « zz 8,00 » (05a-payer-12-390-clair, 11-autre-montant-8-390-clair). C'est la
  règle de m5pa-d (premier mot, « loyer ») appliquée au préfixe « ZZ TEST » ; un vrai nom donnerait « malt ». FN-32 ne couvre que
  plusieurs pièces.
- « Autre montant » : la feuille montre A « à payer 10,00 » juste après « Payé 10,00 », sans dire qu'elle remplace ce paiement
  (le geste remplace bien, mesuré). « Payer 10,00 » peut faire craindre un double paiement.
- Garde FN-33 : un toucher sur « Autre montant » à 0,4 s du ✓ Payé ne fait rien, sans signe (sonde, premier essai) ; à 1,2 s il
  marche. Voulu par FN-33.
- Fiche de B après « J'ai bien payé 12,00 » (09-fiche-B1-390-clair) : le 12,00 qu'il a vraiment payé est barré « corrigé »,
  suivi de −10,00 ; la ligne « 2,00 CHF à récupérer » l'explique.
- Ligne de la créance à 390 : « sorti aujourd'hui · … » et le fournisseur coupés ; « à récupérer 2,00 » reste lisible.
- Aperçu de Modifier (06) : l'option non choisie « Erreur de saisie » garde un cadre bleu (focus) ; en sombre, la choisie est la
  claire : la paire se lit moins vite en sombre.
- 10-fifo-6-1280-clair : l'anneau de focus de la première case (venu du clavier) est coupé au bord gauche de la feuille.
- « Compagnon hors connexion · mode local » couvre Filtres et Doublons (390 et 1280) : mode local du banc.
- FN-40 « au changement de vue » : non provoqué au banc (le bandeau ne naît pas du paiement de la sonde) ; prouvé par le test de x2.

Pilote : vu (16.11 soir : 02-avis-390-clair, avis au-dessus de la ligne, payé une fois ; 07d-fiche-creance-390-clair, créance 2,00 sortie banque, un paiement).
