# r1 — la 4e rangée de la preuve (froide)

**Idée** : le QR est un contrôle de plus, il entre dans la preuve « Vérification » de l'app comme une rangée chiffrée de même grammaire
(« QR-facture = lu  4/4 ») ; un désaccord devient un point numéroté comme les autres.

- **Chaleur** : froide (les idées retenues de l'écran en ligne, affinées ; aucune forme neuve hors du picto).
- **Axes** : où = une ligne de la preuve ; désaccord = un point numéroté (chip « 1 Total » et le panneau des deux tuiles de l'app) ;
  signe = un picto de QR dessiné (trois repères, croix suisse ; 16 px dans la rangée, 14 px dans la chip). Enrichir : non (froide).
- **Les six états** (`?etat=`) : confirme (rangée verte 4/4, détail à un toucher : montant, devise, n°, date) ; contredit (« Somme des
  lignes ≠ imprimé » et « QR-facture : montant ≠ lu 3/4 », total en pointillé d'attention, point 1 ouvert : lu 110,04 | QR 110,40,
  témoin « Somme des lignes : 110,40 », « Garder 110,40 » / « Garder 110,04 ») ; partiel (« = lu · sans montant 2/2 », détail : montant
  et n° « — ») ; illisible (picto barré, « lecture seule ») ; sans (rien : la rangée n'existe pas) ; lecture (QR lu en 0,4 s, ses quatre
  valeurs en gris « à comparer » au-dessus du squelette de l'app).
- **Honnêteté** : le total n'est changé qu'au toucher ; après « Garder 110,40 », la rangée dit « montant pris » (pas « = lu ») ; après
  « Garder 110,04 », elle reste « montant ≠ lu » et la somme reste signalée.
- **Base reprise** (règle n° 1, plancher à enrichir) : en-tête, « Voir le justificatif », bandeau (fournisseur, date, total, chip
  « n lignes » qui ouvre la preuve, barre des lignes par lien), preuve et compte des liens, tuiles TVA et Règlement, chip numérotée et
  panneau à deux tuiles (celui de « Payé » en ligne), lignes (picto de lien, pastille « +10 kg », quantité, montant), pied « Drive prêt ».
  À 1280 : les deux colonnes de l'app (440 px, lignes à droite). La preuve est montrée ouverte au repos pour voir la rangée (dans l'app,
  elle s'ouvre par la chip « 9 lignes »).

## Boosters UX (boosters-ux)
- Boosters : `preuve` (chip « 9 lignes », suivre) ; `qr-detail` — besoin lire ; la rangée QR ; quatre cases vertes ou pointillées ;
  capture `r1-geste-qr-ouvert.png` ; `point-total` — besoin choisir ; chip numérotée ; panneau deux tuiles ; `garder` — déclencher ;
  deux boutons ; le point se barre, la rangée change (`r1-geste-garde-qr.png`, `r1-geste-garde-lu.png`).
- B1 OK — 4 déclencheurs marqués, captures avant/après qui diffèrent.
- B2 OK — le total domine ; un seul `primary` d'écran (Confirmer) ; le « Garder 110,40 » noir reprend le bouton plein du panneau en ligne.
- B3 OK — 49 mots hors lignes (108 lignes comprises) ; détail QR à un toucher.
- B4 OK — le QR vit dans le groupe Vérification. B5 s.o. (v0, non mesuré). B6 OK — trois tailles + total ; chiffres en Plex Mono.
- B7 OK — CONTRASTE OK, pire 6,21:1. B8 OK — six états, inconnu « — ». B9 s.o. (statique). B10 s.o. (aucun champ). B11 « Le QR
  confirme le total, la devise, le n° et la date. » B12 OK — STANDARD OK (un trait d'icône). B13 OK — cibles ≥ 24 px.
- Écarts voulus : aucun.
