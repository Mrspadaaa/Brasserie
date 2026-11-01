# Voie k3-verite — la vérité de ses nouvelles pièces, écrite par deux lecteurs qui ne se voient pas

Agents : lecteur A (Opus) et lecteur B (Sonnet), en parallèle, chacun seul. Plafond : 45 tours chacun. Pilote : Opus. Date : 01.11.
Le pilote compare les deux fichiers et tranche chaque écart en regardant l'image (vérité croisée : aucune source seule).

## Pourquoi
Il a envoyé de nouvelles pièces réelles (01.11, 10 h) après « Tu as assez de vrai donné de test ? » ; puis : « Il y a des screenshots qui
sont de la même facture mais sur plusieurs écran ». Le banc n'a que 7 factures, toutes en image : il faut leur vérité pour les lire.

## Les pièces (toutes dans `work/finalisation-tickets-2026-10-08/H13-reels/`, hors de Git)
| id | fichiers | ce que c'est |
|---|---|---|
| doc8 | `doc8-facture-pdf-652093.pdf` | facture PDF B&R (« Pro-Forma Rechnung », commande 652093), 3 pages de lignes + page 4 QR-facture avec Swico S1 |
| doc9 | `doc9-facture-pdf-686863.pdf` | facture PDF B&R (commande 686863, n° 372765), 2 pages de lignes + page 3 QR-facture avec S1 |
| doc10 | `doc10-commande-652093-ecran-1.jpg`, `-2.jpg`, `-3.jpg` | la page web « Order Information » de la commande 652093, en trois captures de téléphone qui se recouvrent |
| doc11 | `doc11-commande-632135-ecran-1.jpg`, `-2.jpg`, `-3-long.jpg` | la page web de la commande 632135 (2023), trois captures ; la 3ᵉ est une longue capture de tout le tableau |
| doc12 | `doc12-commande-647304-ecran-1.jpg`, `-2.jpg`, `-3.jpg` | la page web de la commande 647304, trois captures ; les lignes 1 et 2 ne sont sur aucune |
| doc13 | `doc13-facture-cff-photo-tournee.jpg` | photo d'une facture papier CFF, tournée de 90° |
Un document = l'ensemble de ses fichiers : une capture répète souvent des lignes d'une autre ; chaque ligne imprimée ne compte qu'une fois.

## À faire (chaque lecteur, seul)
1. Lire le format : `work/finalisation-tickets-2026-10-08/H13-reels/cas.json`, `cas-2.json`, `cas-3.json` (champs `id`, `usage`, `level`,
   `file`, `mimeType`, `images`, `notes`, `expected` ; dans `expected` : `vendor`, `documentType`, `date`, `currency`, `invoiceNumber`,
   `orderNumber`, `amountHT`, `tvaAmount`, `amountTTC`, `tvaRate`, `paymentEvidence`, `items[{ name, kind, quantity, unit, price, amountTTC }]`),
   les conventions des `notes` (une liste = plusieurs valeurs justes ; `null` = absent du document), et les valeurs admises dans
   `functions/src/invoiceScanCore.ts` (`DOCUMENT_TYPES`, `SCAN_KINDS`, `paymentEvidence`).
2. Ouvrir chaque fichier en image (et en texte pour les PDF), à pleine résolution, et écrire la vérité **telle qu'elle est imprimée**. Rien de
   calculé qui ne soit imprimé (un HT absent reste `null` ; une somme de taux imprimés taux par taux peut s'écrire, en le disant dans `notes`).
   - un cas multi-fichier porte `"files": [...]` (dans l'ordre du tableau) en plus de `"file"` (le premier) et `"images": n` ;
   - `items` : une entrée par ligne imprimée, dans l'ordre du document, sans doublon entre captures ; `price` = le prix unitaire imprimé,
     `amountTTC` = le montant de la ligne imprimé ; les sous-lignes grises (« Mischung… », « Schrotung… [+CHF 0.10] ») ne sont pas des lignes ;
     une ligne « Zuschlag Schrotung » ou « Porto » du PDF en est une ;
   - doc12 : seules les lignes visibles ; écrire dans `notes` combien de lignes manquent et pourquoi (`"lignesInvisibles": n` dans `expected`) ;
   - écrire dans `notes` chaque piège : total de page qui n'est pas le total, prix d'une page web qui inclut la mouture, α du nom qui diffère
     entre commande et facture, anciens taux, commande non payée, période qui n'est pas la date, photo tournée, etc.
3. Écrire **un seul fichier** : lecteur A → `H13-reels/cas-4-a.json`, lecteur B → `H13-reels/cas-4-b.json` (`{ "note": "...", "cases": [...] }`).
   Ne lis jamais le fichier de l'autre lecteur, ni `cas-4.json` s'il existe.
4. Contrôle : `node -e "const j=require('./work/finalisation-tickets-2026-10-08/H13-reels/cas-4-<a|b>.json');const c=j.cases;if(c.length!==6)throw 1;for(const x of c){if(!x.expected||!Array.isArray(x.expected.items))throw x.id}console.log('VERITE OK',c.map(x=>x.id+':'+x.expected.items.length).join(' '))"` → `VERITE OK …`.

## Possède
Lecteur A : `work/finalisation-tickets-2026-10-08/H13-reels/cas-4-a.json` ; lecteur B : `…/cas-4-b.json`. Rien d'autre. Ces fichiers et les
pièces portent ses données personnelles : jamais copiés dans Git, ni dans un RESULTAT, ni dans un message (aucune valeur dans le retour).
Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`, `functions/.secret.local`. Aucun appel à
Gemini, aucune installation, aucun commit.

## Retour
Une ligne : `VERITE OK — <lecteur>, n lignes par document, k doutes` puis la liste des doutes (sans valeur : « doc11, ligne 6, prix peu lisible »).
