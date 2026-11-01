# z4 — la Section paiement du QR comme règlement (v0 QR, série z, 01.11)

**Chaleur : chaude.** Une facture qui porte un QR-facture est une facture à payer : la carte Règlement bascule d'elle-même sur
« À payer · 30 jours · QR » et montre, dedans, la **Section paiement** du bulletin telle qu'elle est imprimée (titre en capitales, le QR
avec sa croix, « Compte / Payable à » IBAN, « Référence », « Payable à »), chaque numéro avec « Copier » ; en bas, ce que le QR confirme
de la lecture : Montant 110,40 CHF ✓, Facture F-1001 ✓, Date 12.10.2026 ✓. Le point « Payé 12.10 supposée » disparaît : le QR a répondu.

**Axes** : où = la carte Règlement (le QR sert à payer, il vit là) ; le désaccord = dans la section, la ligne Montant devient « lu
110,04 / QR 110,40 » à toucher, le total du bandeau reste 110,04, et un point numéroté 1 ; le signe = la section paiement entière, mot
pour mot comme sur le papier ; enrichir = IBAN, référence, créancier, conditions, prêts à payer (axe principal).

**Honnêteté** : partiel = « QR-facture · bulletin ouvert », « Montant non imprimé · lu 110,40 », Devise CHF ✓ ; illisible = section
pâle « QR vu, illisible », « à saisir, le QR est barré », Référence « — », « lu : Malterie Fictive SA », et le règlement reprend celui
de la lecture (Payé le 12.10.2026 supposée, le point 1 revient) ; sans = la carte Règlement de la base, rien d'autre ; lecture = section
qui pulse, « QR lu en 0,5 s », « lignes en lecture… ». Une seule date visible (l'échéance est dite « 30 jours », D233).

## Ce qui vient de la base
Tout l'écran en ligne (voir z1) ; la carte Règlement garde sa bascule Déjà payé / À payer (sur « Déjà payé », la section se replie).
Lignes `data-mots="lignes"`.

## Boosters UX (boosters-ux)
- Boosters : `section-paiement` — lire ; le bulletin reproduit ; `copier` ×2 — déclencher ; `deux-valeurs` — choisir ; lu / QR dans la
  ligne Montant, le total suit, la ligne du bas dit « Montant pris » ou « Montant lu gardé » (contredit / contredit-apres). `chip-qr` —
  suivre. `bascule-reglement` — choisir ; replie la section sur « Déjà payé ». `barre-lignes`, `action-unique` : la base.
- B1 OK (8) · B2 OK (110,40 ; la section est la seconde masse) · B3 OK (64 mots sans lignes ; 108 avec : la section porte IBAN et
  référence, 12 nombres) · B4 OK · B5 OK · B6 OK (12 / 14 / 16 / 28) · B7 OK (pire 5,27:1) · B8 OK · B9 OK · B10 s.o. · B11 : « À payer,
  110,40 CHF à Malterie Fictive SA, tout est là pour payer » · B12 OK · B13 OK (Copier 24 px, tuiles 28 px).
- Écarts voulus : B3 (64 mots : la section est dense par nature ; avec les lignes, 108).

## Contrôles (sorties)
CHOIX OK (0 écran) · COMMUN OK (--sans-lignes) · MOTS OK 64 (108 avec lignes, > 100 : D238 les exclut) · CONTRASTE OK (58 textes,
pire 5,27:1) · PAGE OK. Captures : six états à 390, geste « prendre QR », 1280 confirme et contredit ; pas de capture « ouvert » (rien à
ouvrir, tout est à plat).

## Ce qui tient, ce qui casse
Tient : la section est la chose qu'il tient en main chaque mois, et elle répond à « je paie comment ? » sans un mot de plus ; le règlement
devient juste (à payer, pas « payé supposé »). Casse : 180 px de haut dans la feuille, les lignes descendent ; IBAN et référence rognés
à 390 (Copier les porte) ; si la facture est en fait déjà payée, c'est à lui de basculer.
