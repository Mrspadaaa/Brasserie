# v2a — Opérations, froid (affine le journal)

**Chaleur** : froide. **Idée** : le journal d'aujourd'hui, débarrassé de l'outil d'audit : un mois, une barre « entré / sorti »
colorée par catégorie, une pastille « à payer » qui filtre, quatre puces, puis les lignes avec un picto de catégorie.

**Où** : Finances › Opérations (inchangé).

## Problèmes de l'inventaire résolus
- 23 : 3 périmètres + 9 puces + Autres filtres + 2 sélecteurs → 4 puces (Tout, À payer, On me doit, Ventes) + « Filtres ⌄ » ;
  le « solde net » qui mélangeait tout devient deux nombres séparés (entré +720,00, sorti −725,40).
- 17 (en partie) : la puce « On me doit » répond « qui me doit » (0 dans la fixture).
- 30 : format suisse partout ; unité « CHF » en tête de chaque jour.
- Vocabulaire : « à payer », « on me doit », « en retard », jamais écriture, pièce, imputé.

## Baseline (où part chaque fonction)
Mois ‹ › : en tête. Recherche (libellé, tiers, montant) : loupe à côté du mois. Catégorie, Archives, Annulées, Doublons possibles,
Sans justificatif, Sans date, Paiements à confirmer : « Filtres ⌄ » et la rangée sous la liste. « Toutes les dates » : dans
« Filtres ». Apport ou prélèvement privé : sous la liste. Fiche d'une opération : la ligne (›), inchangée. Compagnon : remplacé
par la question au toucher « Pourquoi le mois finit à −5,40 ? ».

## IA (ajout du 09.11)
Au toucher seulement, sous la liste. Réponse en annexe, marquée « exemple », source « les 6 opérations de novembre » ; elle
explique, elle ne calcule rien de neuf (sans le loyer non payé : +394,60).

## Honnêteté
Chiffres de la fixture seulement ; la barre est proportionnelle aux vrais montants (720 / 468 / 186,80 / 42 / 28,60).

## Boosters UX (boosters-ux)
- barre-entre-sorti — lire et comparer ; barre empilée aux couleurs des catégories (DESIGN.md).
- pastille-a-payer — suivre et déclencher ; toucher = filtre À payer (v2a-apres-apayer.png : 2 lignes).
- puces-etat — choisir ; puces à compteurs.
- picto par catégorie (dans les lignes) — lire ; carré teinté, même couleur que la pastille.
- ia-expliquer — déclencher.
- B1 OK · B2 OK (barre entré/sorti domine ; aucune action primaire dans l'écran, le + reste l'ajout) · B3 OK (48 mots hors lignes)
  · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 partiel (« On me doit 0 » ; vide de mois à dessiner) · B9 s.o. · B10 OK · B11
  « En novembre : 720 entrés, 725,40 sortis, 460 à payer dont un retard » · B12 partiel (S4) · B13 OK.

## Ce qui tient / ce qui casse
Tient : on lit le mois en 3 secondes ; la liste reste la sienne. Casse : peu nouveau ; la légende de la barre est partie (les
couleurs sont celles des pastilles, juste dessous).
