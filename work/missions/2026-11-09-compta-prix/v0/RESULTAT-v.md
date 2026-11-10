OK — 6 concepts v0 facture (v1a-c) et Opérations (v2a-c), PANEL OK, MOTS OK

## Fichiers écrits (tous sous `work/missions/2026-11-09-compta-prix/v0/`)
- `v1a/` Facturer froid : récap total + échéance en tête, articles par bière à compteur, une action « Créer la facture QR ».
- `v1b/` tiède : la facture est le formulaire ; papier éditable sur place, bulletin QR détachable.
- `v1c/` chaud : vendre comme à la caisse ; avatars, tuiles de formats, jauge du brassin, « Payé là / Facture QR » (fusionne
  les deux chemins de vente, problème 20 ; proposé sous le + › « Vendre »).
- `v2a/` Opérations froid : barre entré/sorti par catégorie, pastille « à payer », 4 puces, pictos de catégorie ; IA « Pourquoi le
  mois finit à −5,40 ? » au toucher.
- `v2b/` tiède : fil de l'argent ; barres divergentes sort/entre, à payer au-dessus d'« aujourd'hui · en caisse ».
- `v2c/` chaud : trois tas « Je dois / On me doit / Réglé » (treemap) ; IA « Rédiger une relance » au toucher (annexe exemple).
- Chacun : `etat.html`, `NOTE.md` (chaleur, idée, problèmes, baseline, B1 à B13), `<id>-haut.png`, `<id>-page.png`,
  `<id>-1280.png`, et une capture après toucher (`v1a-apres`, `v1b-apres`, `v1c-apres-fut`, `v2a-apres-apayer`, `v2b-apres`,
  `v2c-apres-paye`). Toutes ouvertes, sauf `*-page.png` et `v2b-apres` (premiers écrans et 1280 regardés).

## Sorties décisives (dernier rejeu, toutes les pages)
- `verifier-page.mjs --min-images 0` : PAGE OK × 6 (390 px, sans erreur, sans débord).
- `mots-premier-ecran.mjs --profil=sans-houblons --sans-donnees --sans-lignes --max=60` : v1a 57, v1b 59, v1c 59, v2a 48,
  v2b 59, v2c 40 → MOTS OK. (`--sans-lignes` selon D238 : lignes de journal et de facture marquées `data-mots="lignes"`.)
- `controle-commun.mjs --profil=sans-houblons --sans=mots` : couleurs, survol, blocs, contraste, parlant, brutes OK ;
  **standard ECHEC S4** (épaisseurs de trait d'icône rendues 1,2 à 2,1 px malgré stroke 1,8 et non-scaling-stroke) ; rayons
  ramenés à 10/16/24 px (S3 OK).
- `controle-panel.mjs` (6 premiers écrans) : médiane 0,59, 0 sous 0,50, ressemblance 0,88, 0/15 doubles → PANEL OK.
- `type="number"` : aucun. IBAN : jamais (« CH·· ···· (Réglages) »). Prix 33 cl 5,00 / 75 cl 11,00 / fût 20 L 180,00 marqués
  « prix exemple ».

## Prédiction
Il prendra v1c (« enfin une vente en deux touchers ») et v2c ou v2a pour Opérations ; v1b lui plaira à l'œil mais il le trouvera
serré au téléphone.

## Écarts et limites
- Maquettes statiques (message du 09.11) : les pages gardent un petit script d'avant ce message ; les états utiles sont dessinés en
  annexe (prix inconnu, après envoi, payé là, réponse IA, carte touchée, facture ouverte).
- Aucune capture de l'InvoiceSheet actuelle dans `inventaire/captures` : la baseline facture vient de l'INVENTAIRE (§ 8).
- Les captures de référence `l5b-cadres.png` et `s5a-cadres.png` citées par le brief n'existent pas dans ce worktree (seulement
  leurs NOTE.md) ; vocabulaire pris sur `s7a-cadres.png` et `p7-s1-ouverture-pendant.png`.

DÉCISION À PRENDRE : où vit la vente. v1c propose une seule entrée « Vendre » sous le + (remplace Clients › Facturer et
+ › Encaisser une vente) ; v1a et v1b gardent Clients › Facturer. À montrer en variantes, pas à trancher ici.

CONNAISSANCE : `controle-panel.mjs` ne compte une rangée « pleine » que si l'écart au fond dépasse 60 (somme RGB, fond quantifié à
248) : les teintes pâles de DESIGN.md (#F5F5F5, #EAF3FC) comptent comme du vide ; un écran plein mais aéré échoue (v1a : 0,39 puis
0,59 avec un récap #B9D7F2).

LEÇON PROPOSÉE : aucune
