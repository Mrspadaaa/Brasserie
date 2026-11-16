OK — 4 problèmes, 0 bloquants

# Test d'écran — Finances, rejeu des 6 problèmes de 762f37df (corrections t2)

Version : efff31bd (arbre propre au départ). Banc local `?dev-local&finance-demo`, profil Chrome neuf par scénario, requêtes hors localhost
coupées (Gemini jamais joint). 390 tactile et 1280, clair et sombre (`cave`), les quatre faits pour chaque script. Scripts (copies de
762f37df) : `fnx.mjs` (pièces « ZZ TEST » A 10,00 et B 15,00 écrites dans le seul navigateur de test : ✓ Payé puis Annuler, virement 12,00
sur A et B, Modifier A en Autres frais, 9,00 sous le payé, « J’ai bien payé 10,00 », Enregistrer ; ajouts : `fn0-ops`, `fn7-ops`,
`fn10-creance`, `fn10-ficheC`), `capturer.mjs` (scénarios pay, fiche, profildemo, budget, ia, dbl), `apport.mjs` (apport 500 avec motif,
fiche). Aucune erreur de page. Rien d'enregistré hors du navigateur de test.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| fn7-payer12-1280-clair.png | clair | 1280 | Payer ZZ TEST — Fournisseur, virement 12,00 (A 10,00, B 2,00) | 0 | 0 |
| fn7-ficheB-390-sombre.png | sombre | 390 | fiche B après le virement, « virement de 12,00 · 2 pièces » | 0 | 0 |
| fn10-baisse-1280-clair.png | clair | 1280 | Modifier A, 9,00 sous le payé 10,00, les deux réponses | 0 | 0 |
| fn10-choix-390-sombre.png | sombre | 390 | même état, avant/après dans Opérations | 0 | 0 |
| fn10-apres-390-clair.png | clair | 390 | Opérations après « J’ai bien payé 10,00 » et Enregistrer | 1 | 0 |
| fn10-creance-390-clair.png | clair | 390 | même état, ligne du trop-payé | 0 | 0 |
| fn10-creance-1280-sombre.png | sombre | 1280 | même état, barres et totaux | 0 | 0 |
| fn10-ficheA-390-clair.png | clair | 390 | fiche A après la baisse | 1 | 0 |
| fn10-ficheC-390-clair.png | clair | 390 | fiche « À récupérer : trop payé sur … » | 0 | 0 |
| fn2-avis-390-clair.png | clair | 390 | ✓ Payé du loyer, avis « Payé 400,00 · Annuler · Autre montant » | 0 | 0 |
| fn2-avis-1280-clair.png | clair | 1280 | même état | 0 | 0 |
| fn2-autre-390-clair.png | clair | 390 | Autre montant : Payer l’Atelier, 400,00 | 0 | 0 |
| modif-malt-390-sombre.png | sombre | 390 | Modifier Malt et houblons | 0 | 0 |
| apport-apres-390-clair.png | clair | 390 | Apport 500,00 sans motif, Enregistrer | 0 | 0 |
| fiche-apport-1280-sombre.png | sombre | 1280 | fiche de l’apport « Apport pour le malt » | 0 | 0 |
| pfd-ouvert-390-clair.png | clair | 390 | Solde et paramètres, 1 200 L/an | 0 | 0 |
| pfd-ouvert-390-sombre.png | sombre | 390 | même état | 0 | 0 |
| arc-repos-390-clair.png | clair | 390 | Les archives, rien rangé | 0 | 0 |
| arc-repos-390-sombre.png | sombre | 390 | même état | 0 | 0 |
| ia-chat-390-clair.png | clair | 390 | Compagnon après « Envoyer » | 2 | 0 |
| ia-chat-1280-clair.png | clair | 1280 | même état (mêmes problèmes 3 et 4) | 0 | 0 |
| ia-chat-1280-sombre.png | sombre | 1280 | même état (problème 3 seul) | 0 | 0 |

Bloquants : 0

## Argent (fnx.json, les quatre configurations identiques)

- Avant : payé 296,80, à payer 425,00, dépensé 721,80 (A et B à payer). Après le virement : payé 308,80 (+12,00), à payer 413,00,
  dépensé 721,80.
- Après « J’ai bien payé 10,00 » : payé 308,80, à payer 413,00, dépensé 721,80. Sorties des pièces ZZ : A 9,00 + B 2,00 + trop-payé
  1,00 = 12,00 ; le 10,00 du virement est contre-passé une seule fois. « Autres frais 10,00 » = A 9,00 + trop-payé 1,00 ; Brassage passe
  de 211,80 à 201,80 (A changé de catégorie). Le 1,00 n'est ni perdu ni compté deux fois.

## Problèmes

1. **Trop-payé dit « payé », pas « à récupérer »** (fn10-apres, fn10-creance, 390 et 1280). La ligne porte « ✓ payé aujourd’hui ·
   banque » et « + pièce » comme une dépense ordinaire ; « À récupérer » n'est que dans le nom, coupé à 390 (« trop payé sur « ZZ TEST —
   piè… »). Rien ne reste « à recevoir » : en brasseur, « j'ai 1,00 à récupérer, l'écran me dit payé ».
2. **Fiche A : le 1,00 n'a pas d'adresse** (fn10-ficheA). « Paiements 5 », deux lignes « corrigé 10,00 » barrées et « −9,00 » ; rien ne
   renvoie au trop-payé de 1,00 ni au virement de 12,00. Depuis la pièce, on ne sait pas où est parti le franc.
3. Compagnon : la question préparée dit « sur le mois novembre 2026 » (ia-chat, toutes) ; en brasseur : « en novembre 2026 ».
4. Compagnon en clair : la question envoyée est en ocre sur gris moyen, et « Auto » en texte sombre sur vert foncé ; peu lisibles à 390
   et 1280 (en sombre, lisibles).

## Doutes (non comptés)

- Fiche du trop-payé : « Corriger ce paiement saisi par erreur » et « Modifier » restent offerts sur le 1,00 ; non joués. Si on corrige ce
  paiement, la perte de 1,00 de 762f37df revient-elle ?
- Compagnon : « Envoi à confirmer · Réception non confirmée » ; banc local, réseau coupé : à revoir en ligne.
- Bandeau « Compagnon hors connexion · mode local » posé sur la liste à 390 : banc local seulement.
- Fiche A : « Paiements 5 » pour trois lignes visibles (les contre-écritures comptent).

## Rejeu des 6 problèmes de 762f37df

1. Baisse sous le payé, « J’ai bien payé 10,00 » : corrigé (voir « Argent »). Restent la lecture du trop-payé (problèmes 1 et 2).
2. Profil, prix du litre : corrigé, « ≥ 7,51/L » comme le budget « 202,77 ÷ 27 L = 7,51 » (pfd-ouvert, bb-c3a).
3. Tuile du brassin : corrigée, « Pale Ale · ≥ 7,51/L · avec ce réglage », entière (390 clair et sombre).
4. Compagnon « Envoyer » : corrigé, la question part seule dans le chat (ia-chat, quatre configurations).
5. Mois machine : « 2026-11 » disparu ; la tournure reste fausse (problème 3).
6. Archives au repos : corrigé, la poignée est posée sur la frise au début de 2024, entière (390 clair et sombre).

## Gestes joués

- Payer : virement 12,00 sur deux pièces, « reste 13,00 » sur B ; fiche B « Reste à payer 13,00 · Déjà payé 2,00 ».
- Modifier : Autres frais, Précision vide, montant 9,00, les deux réponses montrées avec l'avant/après ; Modifier Malt et houblons.
- ✓ Payé puis Annuler (A, fiche « corrigé 10,00 ») ; ✓ Payé du loyer puis « Autre montant » et ✓ Payer 400,00 : payé 696,80, à payer
  0,00, rien de compté deux fois.
- Apport : sans motif, refusé avec « Dis à quoi sert cet apport (le motif) » ; avec motif, enregistré, +500,00 en Apports, payé et dépensé
  inchangés ; fiche « Apport pour le malt · ✓ encaissé · +500,00 ».

## Non vus

- Réponse « Erreur de saisie : j’ai payé 9,00 » non jouée.
- Fiche du trop-payé à 1280 et en sombre ; « Avoir ou remboursement » sur le trop-payé (le retour du 1,00) non joué.
- Côte à côte avec les maquettes non refait : seuls les points rejoués sont comparés au verdict 762f37df.
