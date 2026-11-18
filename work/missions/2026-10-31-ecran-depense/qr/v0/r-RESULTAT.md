OK — série r : quatre mini maquettes QR (r1 froide, r2 tiède, r3 et r4 chaudes), six états jouables

## Les quatre idées
| id | chaleur | idée | où | désaccord | signe | enrichir |
|---|---|---|---|---|---|---|
| r1 | froide | le QR, 4e rangée de la preuve « Vérification » (« QR-facture = lu 4/4 ») | ligne de la preuve | point numéroté « 1 Total » + panneau à deux tuiles de l'app | picto QR dessiné (16 / 14 px) | — |
| r2 | tiède | une pastille « ✓ QR » sur chaque champ du récap (ses mots : « les pastilles sur les items ») | pastille par champ | segment côte à côte « lu 110,04 \| QR 110,40 = lignes » | le mot « QR » (plein, creux, pointillé) | — |
| r3 | chaude | le talon détachable du bulletin suisse, sous une perforation, avec un sceau à quatre arcs | sceau | valeur du QR proposée, lue barrée, « Prendre » | coche avec sa source | IBAN et référence à copier |
| r4 | chaude | le total chiffre à chiffre : lu, QR, lignes en colonnes, la colonne fautive marquée (04 / 40) | bandeau, sous le total | chiffre à chiffre (forme neuve), « Garder » par rangée | « ✓ QR » en tête de rangée | conditions S1, échéance et jauge des 30 jours |

Données fictives seulement : Malterie Fictive SA, F-1001, 110,40 CHF (lu 110,04 en `contredit`), 12.10.2026, 9 lignes dont la somme fait
110,40 ; IBAN et référence QRR de l'exemple public de SIX. Les six états par `?etat=confirme|contredit|partiel|illisible|sans|lecture`.

## Fichiers écrits (Possède)
- `qr/v0/r1/` à `r4/` : `etat.html` (classes `qrrN-…`, script dans une fonction immédiate, assemblage par concaténation et `join`),
  `NOTE.md`, `gestes.json`, captures `rN-<état>-390.png` (6), `rN-confirme-1280.png`, `rN-contredit-1280.png`, `rN-geste-*.png` (3),
  `rN-page-*.png` (verifier-page).
- `qr/v0/r1/capturer.mjs` (captures de la série, `node …/r1/capturer.mjs r1 r2 r3 r4`) ; `qr/v0/r1/controles.log` (sorties ci-dessous).
- `git status` : seul `qr/` est nouveau. Rien d'autre touché.

## Contrôles (depuis la racine ; journal : `qr/v0/r1/controles.log`)
- controle-choix `--ecran=depense`, r1 à r4 : `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))`. Le dépense n'a pas
  d'entrée dans `ecrans.json` : sortie notée telle quelle.
- controle-commun `--profil=sans-houblons --sans-lignes` (D238, correction du pilote) : `COMMUN OK` (mots, couleurs, survol, blocs,
  contraste, standard, parlant, brutes ; au-style, fiche, trait, legende sautés par le profil). Premier passage : STANDARD ECHEC
  (S4, quatre épaisseurs de trait d'icône) ; corrigé en mettant tous les pictos à 1,5 et la croix suisse en aplat.
- mots-premier-ecran `--max=100 --profil=sans-houblons --sans-lignes` : r1 49, r2 30, r3 45, r4 48 → `MOTS OK`. Pour mémoire, lignes
  comprises : 108, 100, 106, 115. Lignes marquées `data-mots="lignes"` (colonne des lignes), aucune ligne coupée.
- controle-contraste `--profil=sans-houblons` : `CONTRASTE OK` (pires : r1 et r3 6,21:1, r2 6:1, r4 6,21:1).
- verifier-page `--min-images 0` : `PAGE OK (0 images chargées, 390 px, sans erreur)` ×4.
- controle-panel (24 captures 390, six états × 4) : **PANEL ECHEC**. Ressemblance 0,96, 85 % de paires presque identiques ; remplissage
  médian 0,50. Cause : la règle n° 1 et L10 (un seul facteur libre, l'écran en ligne repris tel quel) donnent aux quatre premiers
  écrans le même squelette, voulu. La différence vit dans la zone du QR, environ 120 px. Remplissage : celui des lignes de l'app,
  hautes de 52 px. Non forcé (le contrôle aurait voulu des écrans qui s'écartent de la base).

## Captures ouvertes et jugées (390 tactile, plein format)
- r1 : confirme, contredit, partiel, illisible, lecture, contredit-1280, geste-garde-qr. Corrigé après regard : lecture trop vide
  (ajout des quatre valeurs du QR « à comparer ») ; « = lu » faux après « Garder 110,40 » (devient « montant pris »).
- r2 : confirme, contredit, partiel, lecture, illisible, geste-pastille-ouverte, geste-garde-lu-detail. Corrigé : chip « 9 lignes »
  renvoyée à la ligne en partiel ; créancier coupé dans le tableau ; « QR illisible » barré, illisible (pointillé).
- r3 : confirme, contredit, partiel, illisible, lecture, confirme-1280, geste-prendre-qr. Corrigé : chip en coche pendant un doute
  (alerte) ; fournisseur et date affichés pendant la lecture (squelette) ; « ✓ montant » après « Prendre » (« montant pris du QR ») ;
  conditions S1 retirées (axe d'r4).
- r4 : confirme, contredit, partiel, lecture, geste-garde-qr, geste-echeance-ouverte. Corrigé : colonnes non alignées entre 32 et 24 px
  (cases de 21 px pour chaque chiffre) : l'inversion 04 / 40 se voit.

## Ce qui tient, ce qui casse
- Tient : la base en ligne intacte dans les quatre ; le total jamais changé sans geste ; « confirmé » réservé à ce que le QR porte
  (partiel sans montant, n° ni date) ; « Confirmer » jamais bloqué ; le picto QR se nomme sans légende à 14 et 16 px.
- Casse ou faible : r1 montre la preuve ouverte au repos (dans l'app, elle s'ouvre par la chip) ; r2 ajoute la ligne « Facture F-1001 »
  au bandeau (écart à la base, dit) ; r4 a quatre tailles de texte (B6) et sa rangée QR à 24 px est un peu bruyante en `confirme` ;
  `sans` vaut « rien » pour r1, r3 et r4, une mention discrète pour r2 seulement ; les mots ne se mesurent que sur l'état par défaut.

**Prédiction** : r4 le frappe (« on voit tout de suite l'erreur »), r3 lui plaît pour l'IBAN à copier, r2 tient ses pastilles ; r1
lui semblera juste mais sans surprise.

DÉCISION À PRENDRE : controle-panel échoue par construction quand le brief impose la base en ligne et un seul facteur libre. Faut-il
le juger sur la zone du QR seulement, ou le lever pour les variantes d'une partie d'écran ? Je n'ai pas tordu les maquettes pour le
faire passer.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : controle-panel mesure un squelette commun que la règle n° 1 rend obligatoire quand la voie ne fait varier qu'une
partie d'un écran choisi. Pour ces voies, le brief dit quel panel s'applique (zone recadrée, ou contrôle levé) avant le dessin.
