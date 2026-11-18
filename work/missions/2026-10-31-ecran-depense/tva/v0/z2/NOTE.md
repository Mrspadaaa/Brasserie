# z2 — Annuel : la TVA par trimestre en barres empilées, le net « si assujetti » (v0 TVA, série z, 01.11)

**Chaleur : tiède.** La forme de mon approche : la TVA vit dans Annuel (« Bilan et impôts », là où il fera ses comptes), sous la
forme de cinq barres empilées par taux (T1 à T4, puis l'année), une par période. Toucher une barre choisit la période : la réponse
(le total), le net « si assujetti », la légende des taux et les factures de cette période suivent. Une seule idée : la période est
une barre qu'on touche.

**Axes** : place = section d'Annuel ; période = trimestre (le seul facteur libre : T1 à T4, ou l'année) ; « si assujetti » = le net
« récupérée − facturée » sur ses ventes enregistrées, hypothèses à un toucher (ventes TTC, 8,1 %, méthode effective, inconnues non
comptées, statut en réglage) ; forme = barre empilée par taux.

**Honnêteté** : une période dont toute la TVA est inconnue affiche « — », jamais 0,00 ; l'inconnu est un jeton hachuré « 3? » au
bout de la barre, hors de l'échelle (il n'a pas de longueur, il a un compte) ; à 14 inconnues la réponse se dit « total partiel ».
La douteuse est un segment en pointillé « choisie ». L'allemande est une ligne violette à part, « DE 19 % · hors CH », hors des
barres. Le net porte son signe, en rouge quand il est négatif, et ses hypothèses sont dans la feuille.

**Ce qui vient de la base** : en-tête, onglets (Annuel actif), le titre « Bilan et impôts » de FinancesTab, navigation du bas ; les
rubriques « Compte de résultat · Bilan · Clôture » en bande figée sous la section.

## Boosters UX (boosters-ux)
- Boosters : `periode` — choisir ; cinq barres pressables ; la pressée change réponse, net, légende, liste. `annee` — ajuster ;
  stepper ‹ 2026 ›. `statut` — lire, déclencher ; chip à interrupteur → Réglages. `si-net` — lire, déclencher ; rangée formule →
  feuille des hypothèses. `legende-taux` — comparer ; jetons de couleur et montants par taux.
- B1 OK (5 boosters, la barre pressée change tout le bas) · B2 OK (le 160,19 ; un primary dans le vide) · B3 OK (58 mots hors
  lignes) · B4 OK (barres dans un cadre, détail sans cadre, liste) · B5 OK · B6 : 12 / 14 / 28 (+ 16 et 18 de la coquille) · B7 OK
  (pire « Finances » 5,3:1 ; 4 textes sur hachures non mesurables : les jetons « 3? » passés sur fond blanc) · B8 OK (sept états ;
  « — » et tirets pour le vide) · B9 OK (fond au toucher) · B10 s.o. · B11 : « 160,19 CHF en 2026, surtout au T2 ; si j'étais
  assujetti je verserais 999,74 de plus » · B12 OK · B13 OK (rangées de 40 px).
- Écarts voulus : segments de barre et jetons de légende à angles droits (rayon 0), pour que la barre se lise comme une mesure.

## Contrôles (sorties)
PAGE OK · COMMUN OK (après trois correctifs : échelle des barres à 70 % de la rangée, rayons 2 px → 0, jeton « 3? » sur fond
blanc) · MOTS : 110 → 62 → 58 (libellés de mois retirés des rangées, comptes retirés de la légende) · CONTRASTE OK · CHOIX OK (0 ;
Finances sans entrée).
