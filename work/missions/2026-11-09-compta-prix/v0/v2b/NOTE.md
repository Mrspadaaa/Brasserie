# v2b — Opérations en fil de l'argent, tiède

**Chaleur** : tiède. **Idée** : le journal devient une rivière verticale : ce qui sort part à gauche, ce qui entre à droite, la
longueur de chaque barre est le montant ; au-dessus de « aujourd'hui · en caisse », ce qui reste à payer (en rose), dessous, le
mois écoulé.

**Où** : Finances › Opérations (inchangé).

## Problèmes de l'inventaire résolus
- 23 : plus de solde net mélangé ; le sens (sort / entre) est la position, le montant est la longueur ; le bas du mois donne deux
  totaux séparés (sorti −725,40, entré +720,00).
- Ce qui reste à payer (460,00) est **au-dessus** de la ligne d'aujourd'hui : le retard (Solde atelier, 20 déc. 2025) en rouge, le
  loyer du 25 nov. en barre hachurée (pas encore payé).
- 30 : format suisse ; la trésorerie 4 181,60 CHF de la fixture sert d'ancre.

## Baseline (où part chaque fonction)
Mois ‹ ›. Chercher, Catégorie, Toutes les dates, Apport ou prélèvement, Archives · doublons : rangée de puces sous le mois.
Fiche : toucher une barre (annexe « toucher le loyer » : Payé, Justificatif, Modifier). « À encaisser » : apparaîtrait à droite
au-dessus d'aujourd'hui (vide dans la fixture). Compagnon : dans la fiche (passe 2).

## Honnêteté
Échelle linéaire unique (720 CHF = 160 px) : les petites dépenses restent petites, leur montant est écrit. Couleurs = catégories.

## Boosters UX (boosters-ux)
- fil-de-l-argent — lire et comparer ; barres divergentes autour d'un axe ; zone future teintée.
- retard-en-tete — suivre ; rouge, en haut.
- embouchure-du-mois — lire ; deux totaux, jamais additionnés.
- B1 OK · B2 OK (la rivière domine) · B3 OK (59 mots, limite) · B4 OK · B5 non mesuré · B6 OK · B7 OK (contraste OK) · B8 OK
  (barre hachurée = non payé) · B9 s.o. · B10 OK · B11 « Il me reste 460 à payer, dont un retard ; ce mois, la vente au marché
  compense presque tout » · B12 partiel (S4) · B13 OK.

## Ce qui tient / ce qui casse
Tient : le poids de chaque dépense se voit sans lire ; « avant / après aujourd'hui » est une vraie lecture. Casse : à 30 opérations
par mois, la rivière défile beaucoup (regrouper par jour ou par catégorie en passe 2) ; les libellés longs à gauche serrent
(« Solde atelier · 20 déc. 2025 » touche le bord).
