OK — 8 maquettes passe 2 : facture v3a–v3d, Opérations v4a–v4d ; PAGE, MOTS, COMMUN, PANEL OK

## Fichiers écrits (tous sous `work/missions/2026-11-09-compta-prix/p2/`)
- Facture, 4 variantes proches de v1c (la caisse : à qui, quoi en tuiles, payé ici ou QR) :
  - `v3a/` La caisse, tenue : Comptoir au lieu de « sans nom ? », Pro / Privé, pastille bière + « + bière », tuile Autre, échéance à réception / 10 j / 30 j, annexe facture imprimée avec bulletin QR.
  - `v3b/` Le ticket devient la facture : papier en tête, talon ✂ « Payé ici / Facture QR », client demandé sur le talon QR seulement, étagère − / + sous le pouce.
  - `v3c/` L'étagère et deux sorties : bouteilles à la taille relative sur une planche, cuve du brassin qui se remplit, deux sorties « Payé ici » / « Facture QR ».
  - `v3d/` La caisse en deux colonnes : formats à gauche, ticket vivant à droite (s5a), client dans un champ avec recherche sous le champ (p7-s1), bascule de paiement.
- Opérations, 4 concepts, v2a en plancher ; un rangement du journal par concept :
  - `v4a/` par date : entré / payé / à payer (hachuré) sur deux barres à la même échelle, cartes « à régler » avec « ✓ Payé », état sur chaque ligne.
  - `v4b/` par état : trois colonnes À payer · On me doit · Payé ; la carte change de colonne ; bascule Colonnes / Liste.
  - `v4c/` par catégorie : piles à l'échelle (charges fixes 400 hachurés), matériel à part, tiroirs.
  - `v4d/` par personne : À payer / On me doit, « Atelier attend 460,00 », puis « Avec chacun ».
- Chaque dossier : `etat.html` (classes préfixées), `NOTE.md`, `<id>-haut.png`, `<id>-page.png`, `<id>-1280.png`. Les états utiles
  sont dessinés en annexe dans la page (facture imprimée, payé ici, adresse inconnue, deux bières, cuve dépassée, recherche du client,
  réponse IA, carte payée, fiche d'un tiers).

## Sorties décisives (dernier rejeu, les 8)
- `verifier-page.mjs --min-images 0 --captures` : PAGE OK × 8 (390 px, sans erreur, sans débord) ; 1280 : débord 0, erreurs 0 × 8.
- `mots-premier-ecran.mjs --profil=sans-houblons --sans-donnees --sans-lignes --max=60 --page=etat.html` : v3a 55, v3b 59, v3c 58,
  v3d 55, v4a 45, v4b 60, v4c 31, v4d 52 → MOTS OK.
- `controle-commun.mjs --profil=sans-houblons --sans=mots` : couleurs, survol, blocs, contraste, standard (S3 et S4 compris), parlant,
  brutes OK → COMMUN OK. (Le S4 de la v0 est réglé : plus de `vector-effect`, épaisseurs ramenées à 1,5–1,7 px rendus.)
- `controle-panel.mjs` (8 premiers écrans) : médiane 0,63, 0 sous 0,50, ressemblance 0,86, 0/28 paires → PANEL OK.
- Aucun `type="number"` ; IBAN jamais (« CH·· ···· (Réglages) »).

## Corrections transversales appliquées
Grille d'exemple 33 cl 5,00 · 75 cl 10,00 · fût 20 L 160,00 (panier 180,00 CHF, marqué « prix exemple ») ; 27 L nets partout (12,4/27 L) ;
payé 325,40 ≠ à payer 400,00 (+ 60,00 en retard de 2025, tenu à part) ≠ dépensé 696,80 (matériel 28,60 à part, v4c) ; plus aucun
« sorti −725,40 » pour novembre ; couleurs et hachures nommées (légendes v4b, v4c ; « à payer » en ocre v4a) ; décimales constantes ;
pas de barres de fournisseurs au premier plan. Le coût du litre n'apparaît dans aucun de ces écrans.

## Captures (ouvertes : les 8 `-page.png` en planche, `v3a-1280.png`, `v4b-1280.png`)
`p2/v3a/v3a-haut.png` … `p2/v4d/v4d-haut.png`, mêmes noms en `-page.png` et `-1280.png`.

## Prédiction
Il prendra v3a ou v3c pour vendre (« c'est v1c en mieux », l'étagère le fera sourire) et v4b ou v4d pour Opérations (« enfin je vois
qui je dois ») ; v4c lui semblera faire doublon avec la Synthèse.

DÉCISION À PRENDRE : où vit la vente (le + › « Vendre » seul, ou aussi Clients › fiche) — inchangé depuis la v0, à montrer en variantes ;
et le rangement par défaut d'Opérations (date / état / catégorie / personne) : c'est l'axe de v4a–v4d, à lui de choisir.

CONNAISSANCE : `controle-standard.mjs` (S4) calcule l'épaisseur rendue comme stroke-width × (largeur rendue / largeur du viewBox) et
ignore `vector-effect:non-scaling-stroke` ; avec cette propriété, le dessin et le contrôle divergent. Retirer `vector-effect` et régler
stroke-width par taille d'icône (2,2 pour 18 px, 1,8 pour 20 à 24 px) fait passer S4 ; l'écart toléré est 0,3 px strict (1,5 et 1,8 échouent).

LEÇON PROPOSÉE : aucune
