QR-U OK — quatre mini maquettes jouables (rangée, sceaux, fermeture éclair, tampon), six états, captures ouvertes

# Série u — le QR-facture dans « Nouvelle dépense » (v0, 01.11)

Base : l'écran en ligne (r2b portée, `voies/e-port/captures/souris390-01/-02`, `pc1280-01-repos`), fixture B&R (Brau- und Rauchshop
GmbH, 27.04.2026, 86,50 CHF, 23 lignes, n° 372765). Contredit : lecture 85,60 (chiffres permutés), QR et somme des lignes 86,50 (fixture).
Six états par `?etat=` : confirme (défaut), contredit, partiel (montant et devise seuls), illisible, sans, lecture.

## Fichiers écrits
- `qr/v0/u1/`, `u2/`, `u3/`, `u4/` : `etat.html`, `NOTE.md`, captures `<id>-<etat>.png` (6 × 390), `<id>-1280-confirme.png`,
  `<id>-1280-contredit.png`, `<id>-geste-apres.png` (contredit après le geste), `<id>-geste-toucher.png` (partiel après un toucher du
  signe QR), `<id>-haut.png` et `<id>-page.png` (verifier-page).
- `qr/v0/u-outils/capturer.mjs` (`node …/u-outils/capturer.mjs u1` → `CAPTURES OK 10 (u1)`, idem u2 à u4, sans erreur de script).

## Les variantes
| id | chaleur | l'idée | tient | casse |
|---|---|---|---|---|
| u1 | froide | une rangée « QR-facture » dans la preuve, quatre cases (montant, CHF, n°, date) vert ✓ / ambre ≠ / pointillé — ; contredit = point 1 « Prendre 86,50 » | le plus fidèle à l'écran en ligne ; se lit d'un coup d'œil | la preuve doit être ouverte (elle l'est d'office ici, fermée en ligne à 390) ; 130 mots avec lignes |
| u2 | tiède | un sceau QR de 24 px collé à chaque champ confirmé (date, montant, n°) ; contredit = segment « lu 85,60 \| QR 86,50 » sur le total | zéro liste : la confirmation est là où est le chiffre ; le duel en segment est un vrai booster | « sans » ne montre rien : on ne distingue pas « pas de QR » de « pas vérifié » ; sceau gris pointillé proche du vert à 24 px |
| u3 | tiède-chaude | fermeture éclair : ruban lu en haut, ruban QR en bas, dents vertes fermées là où ils concordent, ouvertes ≠ là où ils divergent | le plus parlant visuellement ; « Fermer sur 86,50 » referme les dents | +90 px avant les lignes ; le ≠ chevauche les dents ouvertes à 1280 |
| u4 | chaude | tampon rond « QR-FACTURE » à croix suisse, penché sur le total, à l'encre de son verdict (= LECTURE, ≠ MONTANT fendu, MONTANT SEUL, ILLISIBLE, cercle vide sans QR) ; un toucher le retourne | frappant, se reconnaît sans légende ; « sans QR » se dit enfin | la date quitte le coin droit du bandeau ; texte en arc à 12 px seulement |

## Sorties des contrôles (depuis la racine, `<dir>` = `work/missions/2026-10-31-ecran-depense/qr/v0`)
| contrôle | u1 | u2 | u3 | u4 |
|---|---|---|---|---|
| `controle-choix.mjs <dir>/<id> --ecran=depense` | CHOIX OK (0 conforme ; 0 ouvert) — dépense sans entrée dans ecrans.json | idem | idem | idem |
| `controle-commun.mjs … --profil=sans-houblons` | COMMUN ECHEC 1 (mots 130 > 98) | ECHEC 1 (mots) | ECHEC 1 (mots) | ECHEC 1 (mots) |
| idem `--sans-lignes` (D238) | COMMUN OK | COMMUN OK | COMMUN OK | COMMUN OK |
| `mots-premier-ecran.mjs … --max=100` | MOTS ECHEC 130 | ECHEC 120 | ECHEC 118 | ECHEC 119 |
| idem `--profil=sans-houblons --sans-lignes` | MOTS OK 95 | OK 55 | OK 69 | OK 57 |
| `controle-contraste.mjs` (les deux profils) | CONTRASTE OK, pire « TVA » 5,24:1 | OK 5,24:1 | OK 5,24:1 | OK 5,24:1 |
| `verifier-page.mjs <etat.html> --min-images 0` | PAGE OK | PAGE OK | PAGE OK | PAGE OK |

Les mots : la commande du brief compte aussi les lignes de facture (`data-mots="lignes"`), que l'écran en ligne montre au même endroit ;
hors lignes (D238, la règle de Dépense depuis le 01.11), les quatre passent. Couper des lignes pour passer sous 100 irait contre « je
vois le maximum d'items ». Contraste et mots ne mesurent que l'état par défaut (confirme). Le premier essai de u1 avait trois traits
d'icône (STANDARD ECHEC S4) : unifiés à 1,5 px rendus, puis STANDARD OK.

## Captures ouvertes (toutes regardées en plein format)
u1 : confirme, contredit, partiel, illisible, sans, lecture, 1280-contredit, geste-apres, geste-toucher. u2 : confirme, contredit,
partiel, illisible, sans, lecture, 1280-contredit, geste-apres, geste-toucher. u3 : contredit, partiel, illisible, lecture, sans,
1280-contredit, geste-apres, page. u4 : confirme, contredit, partiel, illisible, sans, lecture, 1280-confirme, 1280-contredit,
geste-apres, geste-toucher. Défauts vus et corrigés en route : quantités des lignes poussées à droite, « Voir le justificatif »
centré, « = lu » et « 23 lignes » affirmés pendant la lecture (malhonnête), point 1 de u2 rangé après 2 et 3, arcs du tampon serrés et fente
qui coupait « QR ».

## Prédiction
Il s'arrête sur u4 (« ça c'est parlant ») et sur la fermeture éclair de u3. u1 lui paraîtra juste mais textuel, et u2 trop discret.

DÉCISION À PRENDRE : la commande MOTS du brief sans `--sans-lignes` échoue sur les quatre (lignes comprises). Le pilote dit si D238
s'applique à cette série.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un brief de série sur Dépense devrait écrire `--sans-lignes` dans sa commande MOTS (D238), sinon chaque série la rejoue en échec.
