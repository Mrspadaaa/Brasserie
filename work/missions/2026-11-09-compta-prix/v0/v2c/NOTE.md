# v2c — Opérations en trois tas, chaud

**Chaleur** : chaude. **Idée** : plus de liste au premier plan : trois tas. « Je dois » (cartes à régler, le retard en rouge),
« On me doit » (factures ouvertes), et « Réglé » en carte proportionnelle (treemap) du mois. Un toucher sur « Payé » fait passer la
carte d'un tas à l'autre.

**Où** : Finances › Opérations ; la liste chronologique reste à un toucher (« Liste »). À 1280, les trois tas sont côte à côte.

## Problèmes de l'inventaire résolus
- 17 et 23 : « qui me doit de l'argent ? » est un tas, au premier plan ; « ce qui est payé » en est un autre ; plus de solde net.
- 30 : format suisse ; unité au total de chaque tas.
- Vide honnête : « On me doit 0,00 CHF · Personne » avec l'action là où la donnée viendra (« Facturer », vers v1).

## Baseline (où part chaque fonction)
Liste par jour, recherche, catégorie : « Liste » (la liste de v2a). Mois ‹ › : dans l'en-tête de « Réglé ». Archives, doublons,
annulées, sans justificatif, apport ou prélèvement privé : « Plus ⌄ ». Fiche : toucher une carte ou un pavé.

## IA (ajout du 09.11)
Annexe « exemple » : la facture d'exemple de v1 (Café du Bourg, 186,00 jusqu'au 9 déc.) dans « On me doit », avec
« ✦ Rédiger une relance » ; la relance rédigée est dessinée plus bas, marquée « exemple », source « la facture et la fiche
client », Envoyer / Modifier. Rien d'IA au repos.

## Honnêteté
Treemap : surfaces proportionnelles aux montants réglés (720 entré ; 186,80 / 68 / 42 / 28,60 sortis, total sorti réglé 325,40) ;
le loyer non payé n'y est pas, il est dans « Je dois ». Les deux petits pavés (Nettoyage 42,00, Matériel 28,60) ne portent que
leur montant et leur couleur : leur nom est à un toucher (défaut connu).

## Boosters UX (boosters-ux)
- tas-par-etat — lire et suivre ; trois tas teintés (alerte pâle, finances pâle, gris).
- carte-glissable — déclencher ; « Payé » → la carte se grise, le total du tas baisse (v2c-apres-paye.png : 400,00, 1).
- vide-qui-agit — déclencher ; cadre pointillé + « Facturer ».
- carte-proportionnelle — comparer ; treemap aux couleurs des catégories.
- ia-relance-declencheur, ia-relance — déclencher.
- B1 OK · B2 OK (les deux tas du haut) · B3 OK (40 mots) · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 OK (vide dessiné) · B9 s.o.
  · B10 OK · B11 « Je dois 460, on ne me doit rien, ce mois j'ai encaissé 720 » · B12 partiel (S4) · B13 OK.

## Ce qui tient / ce qui casse
Tient : la question « qui doit quoi » se lit sans filtre. Casse : la chronologie passe au second plan ; un treemap entrées +
sorties côte à côte peut se lire comme une seule masse (le « + » vert et la teinte les séparent, à éprouver).
