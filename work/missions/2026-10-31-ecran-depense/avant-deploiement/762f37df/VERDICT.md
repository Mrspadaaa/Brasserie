OK — 6 problèmes, 2 bloquants

# Test d'écran — Finances, rejeu des 9 problèmes de 28e87fb1, FN-3 à FN-10, 8 vues portées

Version : 762f37df (arbre propre). Banc local `?dev-local&finance-demo`, profil Chrome neuf par scénario, requêtes hors localhost
coupées (Gemini jamais joint). 390 tactile et 1280, clair et sombre (`cave`). Scripts : `capturer.mjs` (repris de 28e87fb1 ; 390 clair,
390 sombre, 1280 clair faits, 1280 sombre arrêté en cours, voir « Non vus »), `fnx.mjs` (deux pièces « ZZ TEST » écrites dans le seul
navigateur de test : Payé puis Annuler, virement 12,00 sur deux pièces, Modifier deux fois, Autres frais, baisse sous le payé ; 390 clair et
1280 sombre), `montage.mjs` (planches `M-*.png`). Aucune erreur de page. Rien d'enregistré hors du navigateur de test.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| bb-repos-1280-clair.png | clair | 1280 | Budget du brassin Pale Ale | 0 | 0 |
| pr-rempli-1280-clair.png | clair | 1280 | Prévoir une dépense, Loyer 500,50, Chaque mois | 0 | 0 |
| pr-rempli-390-clair.png | clair | 390 | même état | 0 | 0 |
| pfd-ouvert-390-clair.png | clair | 390 | Solde et paramètres (démo), 1 200 L/an | 2 | 1 |
| pfd-ouvert-390-sombre.png | sombre | 390 | même état (mêmes problèmes 2 et 3) | 0 | 0 |
| im-ouvert-390-clair.png | clair | 390 | Cuve de fermentation | 0 | 0 |
| arc-repos-390-clair.png | clair | 390 | Les archives, rien rangé | 1 | 0 |
| arc-repos-390-sombre.png | sombre | 390 | même état (même problème 6) | 0 | 0 |
| dbl-repos-390-clair.png | clair | 390 | Doublons, la paire au repos | 0 | 0 |
| ia-chat-390-clair.png | clair | 390 | Compagnon après « Envoyer » | 2 | 0 |
| fn6-ficheA-detail-390-clair.png | clair | 390 | fiche A après ✓ Payé puis Annuler, ligne « corrigé » ouverte | 0 | 0 |
| fn7-payer12-390-clair.png | clair | 390 | Payer ZZ TEST — Fournisseur, virement 12,00 | 0 | 0 |
| fn7-payer12-1280-sombre.png | sombre | 1280 | même état | 0 | 0 |
| fn7-ficheB-390-clair.png | clair | 390 | fiche B après le virement | 0 | 0 |
| fn5-autres-390-clair.png | clair | 390 | Modifier A, catégorie Autres frais | 0 | 0 |
| fn10-baisse-390-clair.png | clair | 390 | Modifier A, montant 9,00 sous le payé 10,00 | 0 | 0 |
| fn10-baisse-1280-sombre.png | sombre | 1280 | même état | 0 | 0 |
| fn10-apres-390-clair.png | clair | 390 | Opérations après « J’ai bien payé 10,00 » et Enregistrer | 1 | 1 |
| fn10-ficheA-390-clair.png | clair | 390 | fiche A après la baisse | 0 | 0 |
| fn9-modif2-390-clair.png | clair | 390 | second Modifier de A | 0 | 0 |

Bloquants : 2

## Problèmes

1. **Baisse sous le payé, « J’ai bien payé 10,00 » : le virement de 12,00 n'est plus compté** (fn10-apres, fn10-ficheA ; paiements lus
   dans `fnx.json`). A passe à « −9,00 » (le 10,00 du virement est contre-passé), B garde « −2,00 » : le virement réel de 12,00 n'est
   plus que 11,00 en banque. Le 1,00 devient une ligne « Trop payé sur « ZZ TEST — pièce A » … +1,00 · à encaisser » sans sortie
   d'argent. Opérations dit « payé 306,80 » (296,80 avant les deux pièces + 12,00 = 308,80 attendus) et « dépensé 719,80 », « Autres
   frais 8,00 » pour une pièce de 9,00 : le trop-payé est retiré une seconde fois de la dépense. FN-10 rejoue donc la même perte de 1,00.
   Bloquant (valeur fausse).
2. **Profil : deux prix du litre pour le même brassin** (pfd-ouvert-390, clair et sombre). La tuile dit « Pale Ale de septe… 7,36/L avec
   ce réglage » (production 1 200 L/an), alors que le budget du même brassin dit « 202,77 ÷ 27 L = 7,51 CHF/L » (bb-c3a). Bloquant
   (valeur fausse).
3. Profil : la tuile du prochain brassin est coupée, « Pale Ale de septe… », sans le « ≥ » ; m4pf-c montre « Pale Ale » et « ≥ 7,51/L ».
4. Compagnon : « Envoyer » n'envoie toujours pas (ia-chat). La question est bien la première ligne du champ, mais il faut un second
   « Envoyer » dans le chat. Pas pratique. Décision en attente du pilote (t1 : « le chat ne démarre jamais seul »).
5. Compagnon : la question préparée dit « sur le mois 2026-11 ? » (format machine) ; en brasseur : « novembre 2026 ».
6. Archives au repos : la poignée de la frise est posée à moitié hors de la feuille, au bord gauche (arc-repos 390, clair et sombre) ;
   m1ar-c la pose sur la frise, à la limite du rangé.

## Doutes (non comptés)

- Bandeau « Compagnon hors connexion · mode local » posé sur la rangée Filtres et la puce « Pourquoi les charges fixes… » (390) : banc
  local seulement, à revoir en ligne.
- Prévoir une dépense à 1280 : le premier « −500,50 » reste près de l'axe « 4 000 », lisible à la taille de la capture, non zoomé.
- Archives : 2024 (1 pièce) et 2025 (2 pièces) restent quasi plates face aux 12 de 2026 (déjà dit en 28e87fb1).
- Fiche A après la baisse : deux lignes « corrigé 10,00 » et « −9,00 » ; la mention « virement de 12,00 · 2 pièces » n'est plus visible
  sans ouvrir la ligne repliée.

## Rejeu des 9 problèmes de 28e87fb1

1. Budget à 1280 : corrigé, pleine largeur, lisible (bb-repos-1280-clair).
2. « Enregistrer » de m4bb-a : corrigé (Expliquer · Enregistrer · Prévoir 64,26).
3. Profil : « ≈ 44 brassins de 27 L » corrigé ; le prix du litre reste faux et coupé (problèmes 2 et 3).
4. Montants : corrigé (« 4 000,00 », « 1 800,00 », « 1 440,00 »).
5. Compagnon : question en tête corrigée ; second « Envoyer » demeure (problème 4).
6. Apport sans motif : non vu (capture faite, non ouverte).
7. Étiquette « −500,50 » : corrigée à 390 (posée sous la marche) ; 1280 en doute.
8. Icône de boîte des archives : corrigée (390 clair et sombre).
9. Statut des doublons : corrigé, « ✓ payé aujourd’hui · banque » entier, « sans pièce » dessous.

## FN rejoués

- FN-3 et FN-4 corrigés : deux ors dans la barre, étiquettes « pièce A 10,00 », « pièce B 2,00 ».
- FN-5 corrigé : pastille « ··· » dans Autres frais.
- FN-6 corrigé : Payé puis Annuler donne une ligne « corrigé 10,00 » barrée, le détail s'ouvre d'un toucher.
- FN-7 corrigé : fiche B « virement de 12,00 · 2 pièces ».
- FN-9 corrigé : Précision vide aux deux Modifier.
- FN-10 : la question est posée (« Erreur de saisie : j’ai payé 9,00 » / « J’ai bien payé 10,00 : 1,00 trop payé ») ; la seconde
  réponse perd le 1,00 (problème 1). Réponse « Erreur de saisie » non jouée.

## Non vus

- 1280 sombre des 8 vues : `capturer.mjs` arrêté en cours de 1280 sombre (consigne de fin) ; seuls fn7-payer12 et fn10-baisse à 1280
  sombre sont vus.
- Côte à côte avec la maquette fait pour m1ar-c et m4pf-c seulement ; m1do-a, m3pr-c, m3pm-d, m3im-c, m4bb-a, m4ia-c jugés sur la capture
  de l'app sans planche. Projet matériel (pm-*), Budget à 390, c3a, apport sans motif et fiche de l'apport : captures non ouvertes.
- FN-10 réponse « Erreur de saisie » ; FN-6 et FN-7 en 390 sombre et 1280 clair.
