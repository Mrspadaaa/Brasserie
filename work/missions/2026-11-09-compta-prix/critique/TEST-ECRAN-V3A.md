OK — 8 problèmes, 1 bloquant

# Test d'écran — la caisse v3a portée (09.11)

Version : a0d94832 (worktree jolly-mahavira, sources de la caisse commises). Maquette choisie : `p2/v3a/v3a-page.png`, `v3a-1280.png`.
App : `http://localhost:3000/?dev-local&finance-demo`, Chrome du poste, 390 tactile (×2) et 1280, clair et cave. Entrées : + › Vendre, Clients › Facturer.
Captures : `critique/captures-v3a/` (27 par configuration, 4 planches `planche-<config>.png` maquette | app), script `critique/capturer-test-v3a.mjs`,
diagnostic `critique/diag-emission-v3a.mjs`. Les 4 planches et 16 captures ouvertes en plein format (390 : 01, 04 haut/bas, 07, 08, 10 bas, 12, 13, 16, 19 ;
cave 04, 10 ; 1280 : 04 clair, 10 cave). Aucune erreur de page, aucun débordement horizontal mesuré.

**Verdict : à corriger** (un bloquant), la mise en page est fidèle à v3a à 99 % sur les quatre configurations.

## Table

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 01-vide | clair, cave | 390, 1280 | ouvert par + › Vendre : Comptoir, Payé ici, « rien dans le panier », — CHF, Encaisser grisé | 3 | 0 |
| 02-client | clair, cave | 390, 1280 | Café du Bourg : passe en Facture QR, bande « adresse ? » + adresse, Facturer grisé | 3, 6 | 0 |
| 03-une-tuile | clair, cave | 390, 1280 | 1 × 33 cl : pastille 1, ligne, total 5,00, Facturer 5,00 CHF | — | 0 |
| 04-panier | clair, cave | 390, 1280 | 24 × 33 cl + 6 × 75 cl = 180,00, 30 j → 9 déc., annexe avec vrai QR | 3, 6, 7 | 0 |
| 05-10j | clair, cave | 390, 1280 | 10 j → 19 nov. (annexe « payable au 19 nov. 2026 ») | — | 0 |
| 06-moins | clair, cave | 390, 1280 | « − » sur 75 cl : 5 × 75 cl, 170,00 partout (ticket, bouton, annexe) | — | 0 |
| 07-adresse-fiche | clair, cave | 390, 1280 | + adresse : fiche client avec Rue / N° / NPA / Localité ; Échap la ferme sans fermer la caisse | — | 0 |
| 08-autre | clair, cave | 390, 1280 | Autre : désignation, quantité, prix unitaire, Annuler / Ajouter la ligne | — | 0 |
| 09-plus-biere | clair, cave | 390, 1280 | « + bière » grisé (un seul brassin conditionné) | doute | 0 |
| 10-martin | clair, cave | 390, 1280 | Martin Rey (adresse complète) : plus de bande, annexe « Martin Rey · Privé », QR réel | 7 | 0 |
| 11-date | clair, cave | 390, 1280 | date de l'annexe touchée : champ date sous le n° | — | 0 |
| 12-paye-sans-moyen | clair, cave | 390, 1280 | Payé ici sans moyen : « réglé en TWINT · Espèces », Encaisser grisé | 5 | 0 |
| 13-twint, 14-especes | clair, cave | 390, 1280 | TWINT puis Espèces : Encaisser actif ; quittance « payé par TWINT » / « payé en espèces » | 5 | 0 |
| 15-client-paye | clair, cave | 390, 1280 | Café du Bourg + Payé ici : pas de bande adresse (juste) | — | 0 |
| 16-emission | clair, cave | 390, 1280 | Facturer 180,00 CHF (Martin Rey) : **échec**, bande « Justificatif invalide (4 Mo maximum). » | 1, 2 | 1 |
| 17-nouvelle | — | — | « Facture enregistrée », Envoyer le PDF, Nouvelle vente : **non atteints** (16 échoue) | — | — |
| 18/22-fermer-brouillon | — | — | avertissement de fermeture avec brouillon : **non atteint par un vrai parcours** (16 échoue avant d'écrire le brouillon) | — | — |
| 19-clients-facturer | clair, cave | 390, 1280 | Clients › Facturer : même caisse, Café du Bourg présélectionné, Facture QR | 8 | 0 |
| 20-echap | clair | 390, 1280 | Échap sur la caisse pleine : fermée, panier perdu | 4 | 0 |
| 21-encaisse-apres | clair | 390 | Encaisser (Comptoir, espèces) : la caisse se ferme, toast de l'app | — | 0 |

## Problèmes (un par ligne ; B bloquant, G gênant, D détail)

1. **Émission — « Facturer 180,00 CHF » ne fait rien d'utile** (16-emission, les 4 configurations) : la bande rouge « Justificatif invalide (4 Mo maximum). » apparaît et aucune facture n'est enregistrée ; « Envoyer le PDF » suit le même chemin. Cause mesurée (diag) : le PDF produit par `SwissQrBillService.generateInvoicePdf` fait **12 307 847 caractères** en dataURL (plafond `MAX = 5 600 000` dans `financeDocuments.ts`), alors que le PNG du QR rastérisé n'en fait que 390 366 : le PDF embarque une image non compressée ou trop grande. Les tests passent parce que jsdom n'a pas de `rasteriser` (le QR y est factice). Geste sans effet : **B**.
2. **Le message de l'échec parle d'un « justificatif »** que le brasseur n'a jamais joint (16-emission) : valeur fausse pour lui ; il faut un mot de la caisse (« la facture n'a pas pu être produite… »), et surtout que 1 ne se produise plus. **G**.
3. **Jauge toujours à « 0,0/27 L nets »** (01 à 19) : elle ne compte que les litres saisis par cette caisse ; sur ses brassins déjà vendus en partie, elle dira 0 à l'ouverture. La maquette montre 12,4/27 L : ce qu'il attend, c'est ce qu'il reste du brassin. **G** (valeur fausse en réel, même si juste en démo).
4. **Échap ou × avec un panier plein ferme la caisse sans rien dire** (20-echap ; × idem par le même `fermer`) : 24 + 6 lignes perdues d'un geste. L'avertissement n'existe que pour une « écriture locale » en attente. **G**.
5. **Quittance imprimée (Payé ici) : « quittance : une ligne · 24 × Pale Ale · 33 cl · 6 × Pale Ale · 75 cl »** (12, 13, 14) : « quittance : une ligne » est un mot d'ingénieur ; la facture d'en face détaille deux lignes et deux montants. Écart (c) annoncé, mais le brasseur dira « c'est quoi une ligne ? ». **G**.
6. **Initiales « CD » pour Café du Bourg** (toutes) : la maquette dit « CB » ; la particule « du » est comptée. **D**.
7. **En-tête de l'annexe cassé à 390** (04-panier-bas, 10-martin-bas) : « n° FAC-2026-0001 · » puis la date seule à la ligne, « Brasserie · Démonstration » sur deux lignes ; la maquette tient sur une ligne. En partie dû au nom de démo, mais un nom de brasserie à deux mots le reproduira. **D**.
8. **Deux en-têtes pour la même caisse** (19-clients-facturer contre 01) : par + › Vendre, icône étincelle, « Vendre », × plat ; par Clients › Facturer, « Vendre » sans icône et × encadré. Écart (a) annoncé pour le premier, pas pour la différence entre les deux. **D**.

## Doutes (non comptés)

- À l'ouverture par + › Vendre, la caisse part sur Comptoir + Payé ici (la maquette montre Café du Bourg + Facture QR) : logique (aucun client encore), mais le premier écran qu'il voit n'est pas celui de sa maquette ; à lui de dire.
- « + bière » grisé quand un seul brassin est conditionné : juste, mais la maquette le montre actif ; un libellé « une seule bière » lèverait le doute.
- Facturer reste actif pour Café du Bourg sans adresse (comme la maquette) : une QR-facture sans débiteur est admise par les banques ; à confirmer avec sa pratique.
- Fiche client par « + adresse » : c'est la vieille fiche complète (contact, téléphone, email, notes) sous la caisse ; deux dialogues empilés à 390, lisibles. Rien de cassé.
- Hors ligne, « Réessayer », reprise de brouillon, « Facture enregistrée » / « Envoyer le PDF » / « Nouvelle vente » : **non vus**, inaccessibles tant que 1 n'est pas corrigé.
- Lecture du QR par une application bancaire : non testée ici (geste du pilote).

## DEMANDE EXECUTANT (après correction de 1)

1. `node work/missions/2026-11-09-compta-prix/critique/diag-emission-v3a.mjs` → attendu : `DIAG {"ok":true,"longueur":<< 5600000 …}` ; `FERMER1 {"caisse":true,"notes":["Une écriture locale existe déjà…"]}` si la reprise est rejouée par un vrai échec d'enregistrement.
2. `node work/missions/2026-11-09-compta-prix/critique/capturer-test-v3a.mjs` puis `node …/critique/planches-v3a.mjs` → attendu : `manques` vide, 27 captures × 4, et `16-emission-*` montrant « Facture FAC-2026-0001 enregistrée · 180,00 CHF », `17-nouvelle-*` la caisse vidée.
3. Ouvrir `16-emission-haut/bas` et `17-nouvelle` des 4 configurations.
