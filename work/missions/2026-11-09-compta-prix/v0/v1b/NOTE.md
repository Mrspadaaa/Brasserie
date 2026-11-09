# v1b — La facture est le formulaire, tiède

**Chaleur** : tiède. **Idée** : on n'édite plus un formulaire qui produira un PDF ; on touche la facture elle-même, déjà
mise en page, bulletin QR détachable compris. Ce qu'il voit est ce que le client recevra.

**Où** : Clients › client › Facturer ; aussi Opérations › On me doit › Facturer.

## Problèmes de l'inventaire résolus
- 9 : le bulletin QR est dessiné sous les ciseaux (code, compte « CH·· ···· (Réglages) », montant qui suit le total).
- 10 : destinataire avec son trou d'adresse visible (hachures attention, « adresse ? »), n° « 2026-·· suite ».
- 21 : « Payable au 9 déc. 2026 » (30 j par défaut), souligné en pointillé = modifiable au toucher.
- Interface : le total HT/TVA est visible avant l'envoi (« Total · sans TVA ») ; un article = une ligne de facture.

## Baseline (où part chaque fonction)
Date et échéance : sur le papier, au toucher. Articles : ligne touchée → compteur sur place ; « + article » en pointillé ; retirer :
compteur à 0. Prix unitaire : toucher la colonne. Enregistrer et télécharger : « Envoyer le PDF » ; « Aperçu » plein écran.
Annuler : ‹ (en-tête de l'app). Adresse et nom de la brasserie (problème 11) : « L'Affinée, Fribourg » viennent des Réglages.

## Honnêteté
Prix marqués « prix exemple » (étiquette sur la ligne de coupe). Le code QR est un aperçu dessiné, pas un vrai code. Annexe « envoyée » :
la facture passe dans Opérations › On me doit (186,00 CHF jusqu'au 9 déc.), forme de v2c.

## Boosters UX (boosters-ux)
- papier-editable — lire et ajuster ; la facture rendue, éditable sur place.
- ligne-en-edition — ajuster ; ligne bleutée + compteur ; total et montant QR suivent (v1b-apres.png : 25 × 33 cl → 191,00).
- echeance-touchable — choisir ; date soulignée en pointillé, cycle 30 j / à réception / 10 j.
- trou-adresse — suivre ; hachures = inconnu requis.
- qr-vivant — lire ; le montant du bulletin = le total.
- B1 OK · B2 OK (le papier domine ; 1 primaire « Envoyer le PDF ») · B3 OK (59 mots) · B4 OK (une feuille, deux parties séparées
  par la coupe) · B5 non mesuré · B6 OK (3 tailles) · B7 OK · B8 OK (adresse inconnue ; annexe après envoi) · B9 s.o. · B10 OK ·
  B11 « La facture de 186 CHF pour Café du Bourg, avec son QR » · B12 partiel (S4) · B13 OK.

## Ce qui tient / ce qui casse
Tient : zéro traduction entre saisie et PDF ; le QR rend l'objet concret. Casse : un papier à 390 px reste serré (texte à 12–14 px) ;
plusieurs articles allongent la feuille ; l'édition « au toucher sur le papier » doit rester découvrable (soulignés pointillés).
