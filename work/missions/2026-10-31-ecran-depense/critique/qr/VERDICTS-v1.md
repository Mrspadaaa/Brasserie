QR-T2 OK — r4 RETOUCHE, z2 RETENUE, z4 RETOUCHE

# Verdicts de la passe 2 — contrôle QR dans « Nouvelle dépense » (v1, 01.11)

Critique calibré (portrait v2). Contrat : `critique/qr/SYNTHESE.md` (défauts, greffes, retouches communes par candidate). Base en ligne
comparée côte à côte : `voies/e-port/captures/souris390-01-repos.png`, `-02-preuve.png`, `voies/dp-doublon/captures/390-1-repos.png`.
Captures ouvertes en plein format : les six états à 390 des trois candidates ; r4 : feuille-qr, garde-qr, garde-lu, reglement-ouvert,
feuille-partiel, point-1, iban-copie, contredit-1280 ; z2 : confirme-ouvert, contredit-apres, confirme-tuile, partiel-ouvert, illisible-ouvert,
contredit-1280 ; z4 : confirme-ouvert, confirme-adopte, contredit-apres, confirme-tuile, confirme-preuve, illisible-ouvert, partiel-ouvert,
contredit-1280. Tailles déclarées mesurées par `font-size` dans les trois `etat.html` : rien sous 12 px.

Ce que la base en ligne impose (vu sur `souris390-01-repos`) : bandeau fournisseur + date en haut à droite, total 32 px mono, « CHF », chip
« N lignes », barre des liens ; tuiles numérotées ① ② (② « Règlement · Payé le · supposée », fermée) ; chips ③④⑤ ; « Lignes de la facture ·
N / 14 proposées » ; lignes avec cube, pastille « +6 kg », quantité, montant ; sous-ligne mouture « Rattacher les 5 » ; pied « Drive prêt ·
Confirmer ».

## La passe a progressé
Oui, nettement. Les deux z sont revenues sur l'écran en ligne (pastilles, tuile fermée « supposée », plis en bas, date à droite) ; le « sans QR »
est distinct de « pas vérifié » dans les trois ; les greffes sont prises (colonne fautive, témoin des lignes, sources dites, Photographier,
copié, « pas dans le QR »). Il reste un défaut d'honnêteté dans r4 (le règlement bascule seul) et une rognure visible dans z4 (l'IBAN).

---

## r4 (r4b — le total chiffre à chiffre) — RETOUCHE

### Défauts de la SYNTHESE
| n° | défaut | corrigé | où |
|---|---|---|---|
| 1 | confirme : total écrit deux fois | oui | `r4b-confirme-390` : une rangée « 110,40 CHF » + sceau QR vert 32 px ; le triple (lu / QR / lignes) n'existe qu'en contredit |
| 2 | « Garder » sans valeur | oui | `r4b-contredit-390` : « Garder 110,40 » plein, « Garder 110,04 » ; après geste `garde-qr` : « pris » / lu barré « remplacé » ; `garde-lu` : « non pris », colonne 40 marquée |
| 3 | « sans » = rien | oui | `r4b-sans-390` : cercle pointillé « sans QR » à la place du sceau ; distinct de « 0,4 s · à comparer » (lecture) et du sceau hachuré « illisible » |
| 4 | quatre tailles | oui | rangées QR et lignes à 20 px (mesuré : 32 / 20 / 16 / 14 / 12, toutes de la base) |
| 5 | tuile Règlement à quatre informations | oui, mais voir R1 | « À payer · 11.11 » + jauge, « QR · 30 j » en source ; conditions au toucher (`geste-reglement-ouvert` : « déduite : QR, 30 jours net · reste 10 j ») |

### Greffes
| greffe | prise | où |
|---|---|---|
| QR dessiné à la place de « ✓ QR » (z2) | oui | sceau 32 px au total, 20 px en tête de rangée |
| feuille « Ce que dit le QR » (z2 / r3) | oui | `geste-feuille-qr` : 5 champs « = lu », IBAN et référence sur deux lignes en mono, Copier → « ✓ copié » (`geste-iban-copie`), Conditions S1 |
| cercle vide « sans QR » (u4) | oui | `r4b-sans-390` |
| point ① qui saute au duel (u1 / z1) | oui | `geste-point-1` : le bandeau est cerné d'ambre |
| rangée hachurée en illisible (u3) | oui | `r4b-illisible-390` : « ??? , ?? · la lecture fait foi » |

### Base tenue ?
Pastilles des lignes (« +10 kg », « nouveau ») oui ; chip « 9 lignes » oui ; date en haut à droite oui ; plis sous les lignes oui (vus à 1280) ;
pied jamais bloqué oui. **Non** : la tuile Règlement. La base dit « ② Règlement · Payé le 12.10.2026 · supposée » ; r4 écrit « Règlement ·
À payer » dans les six états (`etat.html` l. 271 : `'<span>À payer' + (s1 ? ' · 11.11' : '')`). En sans, partiel et illisible, rien du QR ne
justifie « À payer » : c'est un champ qui change sans lui et sans source (« On a un 10' qui sort de null part »). En confirme et contredit,
les 30 jours du S1 font basculer le règlement de « payé » à « à payer » tout seul : c'est exactement ce que la SYNTHESE a refusé à z4
(défaut 2, « rien ne bascule sans lui »), et la retouche commune « rien ne change sans lui » vaut pour les trois. Les tuiles ont aussi perdu
leur numéro ① ② (la base numérote ses points) : au repos, r4 n'a aucun point, là où z2 et z4 montrent « ① Règlement · supposée ».

### Honnêteté
Montant : rien ne change sans lui (le total reste 110,04 jusqu'à « Garder » ; les deux sens sont joués et dits). « Confirmé » seulement pour
ce que le QR porte : partiel honnête (« ··· , ·· sans montant », « n° · date : pas dans le QR », feuille « — pas dans le QR »). « sans QR »
distinct de « pas vérifié ». Lecture : la plus honnête des trois (la rangée « lu » en squelette, « QR 110,40 · à comparer »).
Règlement : **non** (R1).

### Retouches, numérotées, avant de montrer
- **R1** — Tuile Règlement : reprendre « ① Règlement · Payé le 12.10.2026 · supposée » dans les six états (règle n° 1, D105 ; honnêteté).
  En confirme et contredit seulement, proposer « À payer · 30 j · 11.11 » en chip pointillé ambre, comme z4 (« proposé par le QR · toucher
  pour l'adopter ») ; la jauge et « déduite : QR, 30 jours net » n'apparaissent qu'après son toucher. En sans, partiel, illisible : la base
  telle quelle. Les numéros ① ② reviennent avec le point.
- **R2** — Même jeu de données que z2 et z4 (7 lignes, Maris Otter + mouture « Rattacher », ② mouture ×1 +3,75) : il va les regarder côte à
  côte (D126), et une fixture différente (9 lignes malts et houblons, sans mouture) lui fera comparer autre chose que le QR.
- Facultatif : « Photographier le QR » en illisible (z2 et z4 l'ont ; r4 dit seulement « la lecture fait foi »).

### Sa phrase
« Le lu / QR / lignes en colonnes c'est très très bien, on voit direct que c'est les deux chiffres inversés, et je garde d'un doigt. Mais
pourquoi le règlement dit À payer ??? j'ai rien touché, et sans QR il le dit aussi. »

---

## z2 (le sceau QR sur le bandeau) — RETENUE

### Défauts de la SYNTHESE
| n° | défaut | corrigé | où |
|---|---|---|---|
| 1 | base glissée | oui | `z2-confirme-390` : pastilles « +25 kg », « nouveau » ; ① Règlement « Payé le 12.10.2026 · supposée » fermée (carte au toucher, `confirme-tuile` : identique à la base) ; preuve derrière « 7 lignes » ; Détail et plis sous les lignes ; date en haut à droite ; mouture « Rattacher » |
| 2 | « sans » = absence | oui | `z2-sans-390` : cercle pointillé « sans QR » |
| 3 | IBAN et référence rognés | oui | `confirme-ouvert` : « CH93 0076 2011 6238 / 5295 7 », référence sur deux lignes, Copier à droite ; à 1280 (`contredit-1280`) l'IBAN casse « 5295 / 7 » dans la colonne gauche (lisible, à égaliser avec le 390) |
| 4 | écart dit trois fois | oui | `z2-contredit-390` : sceau ambre « 110,40 » + tuiles « lu sur la page 110,04 \| QR-facture 110,40 » ; chip ① « Total » sans valeur |
| 5 | texte ≥ 12 px, sceau ≥ 24 px | oui | mesuré : 12 / 14 / 16 / 18 / 28 ; sceau 64 × 62 |

### Greffes
| greffe | prise | où |
|---|---|---|
| colonne fautive (r4) | oui | « 04 » et « 40 » en pointillé d'attention dans le total et les deux tuiles |
| témoin « Somme des lignes » (r1) | oui | « ✓ Somme des lignes 110,40 · deux contre un » sous les tuiles |
| sources « lu sur la page \| QR-facture » (u2) | oui | titres des tuiles |
| « Photographier le QR » (u1 / u4) | oui | `z2-illisible-390` (bandeau) et `illisible-ouvert` (feuille) |
| « ✓ copié » (r3) | déclaré dans la NOTE, pas de capture : à ouvrir à la passe suivante si on y touche |
| « pas dans le QR » en partiel (u3) | oui | `partiel-ouvert` : Montant, Facture, Date « pas dans le QR » avec la valeur lue à côté |

### Base tenue ?
Oui, entièrement : c'est l'écran en ligne avec un sceau en plus. Seul écart mesurable : le total à 28 px (base 32 px), que l'œil ne
relève pas sur la capture.

### Honnêteté
Montant : le champ reste 110,04 jusqu'au toucher d'une tuile (`contredit-apres` : 110,40 pris, tuile QR noire, ① Total barré, Détail
110,40 / 110,40). « Confirmé » : « QR ✓ » seulement quand les quatre champs sont « = lu » ; en partiel le sceau dit « partiel » et la feuille
ne coche que Devise et Créancier. « sans QR » distinct. Illisible : « vu, barré par un tampon : rien décodé », tout « lu ».
Lecture : le total 110,40 s'affiche déjà, sans dire qu'il vient du QR (le sceau dit « lecture… ») ; r4 le fait mieux (« à comparer ») ;
remarque pour une passe 3, pas un blocage (état transitoire d'une demi-seconde).

### Trois secondes, disposition, habillage
Le QR dessiné à 64 px à droite du total se reconnaît sans lire ; le verdict tient en un mot sous le sceau (QR ✓ / 110,40 / partiel /
illisible / sans QR). Contredit : 150 px de bandeau, mais chaque pixel sert (deux valeurs, la colonne fautive, le témoin) : le dense utile,
pas le cockpit. Habillage au niveau de l'écran en ligne.

### Sa phrase
« Là je retrouve mon écran, mes pastilles sont là. Le QR à côté du total c'est clair, et en désaccord je vois direct le 04 / 40 et que les
lignes donnent raison au QR. Vachement bien. »

---

## z4 (la Section paiement dans le règlement) — RETOUCHE

### Défauts de la SYNTHESE
| n° | défaut | corrigé | où |
|---|---|---|---|
| 1 | base glissée | oui | `z4-confirme-390` : pastilles, ① Règlement « Payé le 12.10.2026 · supposée » fermée (carte au toucher, `confirme-tuile`), preuve derrière « 7 lignes » (`confirme-preuve`), Détail et plis sous les lignes, date à droite |
| 2 | le règlement bascule seul | oui | la tuile reste « supposée » ; « À payer · 30 jours · proposé par le QR · toucher pour l'adopter » en pointillé ambre ; `confirme-adopte` : après son toucher seulement, « ① À payer · 11.11.2026 » + jauge, section « À payer · adopté » |
| 3 | désaccord planqué en bas | oui | `z4-contredit-390` : total 110,04 pointillé, pastille « ≠ QR », tuiles lu / QR sous le total, témoin ; la ligne Montant de la section reprend le duel (`contredit-1280`) ; chip ① « Total » |
| 4 | 180 px | partiel | section repliée (titre, proposition, Compte, Référence) : ≈ 150 px avec la proposition, 90 sans ; le QR, « Payable à », Conditions et les coches au dépli (`confirme-ouvert`). C'est l'idée, il dira que ça prend de la place : mitigé, pas un rejet |
| 5 | pied sur Détail | oui | `z4-sans-390` : Détail visible au-dessus du pied |

### Greffes
| greffe | prise | où |
|---|---|---|
| colonne fautive (r4) | oui | « 04 » / « 40 » pointillés dans le duel |
| échéance datée + jauge (r4) | oui | après adoption seulement : « 11.11.2026 », jauge dans la tuile (D233 : une date visible pour À payer) |
| cercle « sans QR » (u4) | oui | `z4-sans-390` ; la section disparaît (juste : rien à payer depuis le QR) |
| « Photographier le QR » (u1) | oui | `z4-illisible-390` ; section pâle « QR vu, illisible », Compte « à saisir, le QR est barré » |
| pastille « ✓ QR » sur le total (r2 / u2) | oui | à côté de CHF : « ✓ QR », « ≠ QR », « QR partiel », « QR » barré, « QR lu » |

### Base tenue ?
Oui : même squelette que z2, la section s'insère entre les points et les lignes. Le pied recouvre les plis au défilement, ce qui est le
comportement de la feuille (Détail reste visible).

### Honnêteté
Rien ne bascule sans lui (défaut 2, le plus important, est réglé et joué). « Confirmé » seulement pour ce que le QR porte : partiel « bulletin
ouvert », « Conditions pas dans le QR », « Montant pas dans le QR · lu 110,40 », proposition « À payer » sans « 30 jours ». Illisible : « Payable
à : lu ». « sans QR » distinct. Montant : le champ reste 110,04 jusqu'au toucher (`contredit-apres`). Lecture : comme z2, le total 110,40
s'affiche sans dire qu'il vient du QR (la pastille grise « QR lu » le suggère à peine) ; remarque, pas un blocage.

### Retouches, numérotées, avant de montrer
- **R1** — L'IBAN se casse « CH93 0076 2011 6238 5295 / 7 » : un « 7 » seul sur la deuxième ligne, dans cinq états sur six au repos et à 1280.
  Ça se lit comme une rognure (SYNTHESE z2 défaut 3, « rien de rogné » ; DEFAUTS : rien de coupé). Correction : casser après « 6238 » comme
  la feuille de z2 (« CH93 0076 2011 6238 / 5295 7 »), ou élargir la colonne des valeurs de 12 px (étiquette « Compte » à 60 px).
- Facultatif : en lecture, la sous-ligne mouture garde « Rattacher » au lieu d'un squelette (NOTE l'admet).

### Trois secondes, disposition, habillage
La pastille « ✓ QR » au total répond en un coup d'œil ; la section est son bulletin, mot pour mot (Compte, Référence, Payable à). Le dense
utile : il paie depuis l'app. Mais au repos, la section pousse les lignes de 150 px sous le pli du téléphone, pour un fait (le QR confirme)
qui tient déjà dans la pastille.

### Sa phrase
« Ça c'est mon bulletin, je copie l'IBAN et c'est moi qui dis À payer, très bien. Mais ça prend de la place avant mes lignes, et le 7 tout
seul de l'IBAN c'est quoi ? »

---

## Côte à côte, ce qu'il gardera (prédiction)
Le sceau de z2 au bandeau, le duel chiffre à chiffre de r4 (déjà greffé dans z2 et z4), et la section de z4 repliée sous les points, sans
la proposition au repos. Il demandera le mélange plutôt qu'une seule : « z2 pour le haut, la section de z4 dessous ». Greffe à prendre pour
la passe 3 des trois : la lecture de r4 (rangée « lu » en squelette, « QR 110,40 · à comparer »).

LEÇON PROPOSÉE : quand la SYNTHESE pose une règle d'honnêteté sur une candidate (« rien ne bascule sans lui », z4 défaut 2), elle l'écrit
aussi dans les retouches communes avec un contrôle sur chaque état (sans, partiel, illisible compris) : r4 a passé le tri avec un règlement
qui basculait seul parce que la règle n'était écrite que pour z4.
