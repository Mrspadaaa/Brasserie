# u1 — la feuille d'aujourd'hui, chaque doute posé sur son champ (v0, 31.10)

- **Chaleur** : froide (affine la baseline : même feuille, même ordre, même pied).
- **Axes** : A1 sur place (le doute vit sur le champ ou la ligne) ; A2 repliées sauf les douteuses (« Les 23 lignes ⌄ ») ;
  A3 une icône par ligne ; A5 le verdict en tête.
- **L'idée** : la feuille de l'app, sans bandeau « Lecture à confirmer » : le compteur « 6 à régler ↓ » saute d'un doute à
  l'autre, et chaque doute se règle là où il est (pastille tiretée « supposée », valeurs côte à côte, calcul).

## Sa facture, et ce qui est simulé
Ses 23 lignes et ses montants viennent de `verite-facture-372765.json`. Simulé, et dit : le stock (stock d'essai, pas le sien) ;
« Target α 11,8 » et « Hallertauer Blanc DE » au stock (pour les deux « bis ») ; l'unité illisible de Sabro (sa facture porte
« g ») ; la prévision « Ingrédients de novembre 90,00 » ; la dépense 380001 du doublon (état 8). Le moyen « Virement » est marqué
« déduit » d'« E-Finance ». L'échéance 07.05.2026 est « déduite » de « 10 Tage netto ».

## Baseline, cochée (chaque fonction au premier plan ou à un toucher)
- [x] justificatif : voir (vignette), changer (feuille du justificatif, non dessinée en v0 : la vignette est le bouton)
- [x] Total TTC (se tape, le détail suit) · [x] Pour quoi ? (champ) · [x] date de l'achat (⌄ : champ, Hier, Aujourd'hui)
- [x] Déjà payé / À payer · [x] payé le et moyen (dans le point « Payé le ») · [x] l'échéance (à « À payer », déduite)
- [x] fournisseur et catégorie (⌄) · [x] lier à une dépense prévue (⌄)
- [x] lignes : type d'achat, réception (article, quantité, unité), matériel (option du type) ; ajouter (« + Ligne »), retirer
  (corbeille du détail), regrouper ; « Détail 86,50 / 86,50 » (rouge et écart dès qu'un montant change)
- [x] référence et TVA : n° de commande, n° de facture, TVA, taux (⌄ « Référence ») · [x] pied « Confirmer et enregistrer » · [x] ×

## Honnêteté
- Payé le : « 27.04.2026 supposée » (aucune date imprimée). HT : « — non imprimé », pas un point. Taux unique : absent, pas un point.
- TVA : un seul point, « 2,80 · 4,15 » côte à côte, bases « 26,20 + 84,20 = 110,40 ≠ 86,50 · écart 23,90 » ; proposé : vide.
- Chaque ligne ouverte : « 6 Kg × 2,30 = 13,80 ✓ », et l'imprimé (« Maris Otter, Kg ») ; « 2 Stk = 2 sachets » vu.
- Mouture : proposée, rattachée par le seul geste « Rattacher les 5 moutures » ; « Laisser à part » possible ; « Détacher ».
- Écart : manque une marque « proposé » sur « Pour quoi ? » (composé par le code, jamais lu) ; à faire en passe 2.

## États (annexe de la page)
1 lecture en cours (Envoi 1,2 s · Lecture… · Vérification ; Total « en lecture », « Saisir à la main ») · 2 sans point
(illustration, dite) · 3 le premier écran · 4 un réglé (5 à régler), puis tout réglé · 5 erreur (fichier gardé, total à la main,
Relire) · 6 Drive à connecter (vu au pied, Confirmer reste actif) · 7 envoi au Drive sans bloquer, puis le reçu (nom lisible, lien)
· 8 doublon possible (380001, même commande 686863, même total) · 9 hors ligne (brouillon gardé, enregistrement au retour du réseau).

## Boosters UX (boosters-ux)
- `compteur-saut` — suivre ; pastille « 6 à régler ↓ » ; saute au prochain doute et l'ouvre (capture `u1-saut-mouture.png`)
- `doute-sur-place` — choisir ; pastille tiretée sur le champ, verte une fois réglée (`u1-regle-paye.png`)
- `preuve-recoupe` — lire ; « 23 lignes recoupées ⌄ » ouvre les trois contrôles et la page 2 (`u1-preuve.png`)
- `total-sur-place` — ajuster ; le total se tape, « Détail » suit · `reglement` — choisir ; segment · `drive-pret` — lire ; au pied
- B1 OK — 6 boosters marqués, avant/après capturés · B2 OK — 86,50 domine, un seul bouton plein (le pied) · B3 OK — 95 mots
- B4 OK — trois groupes (fiche, articles, référence) · B5 à mesurer (R2 non joué) · B6 OK — 28/14/12 px, mono pour les mesures
- B7 OK — CONTRASTE OK (pire 4,65:1) · B8 OK — 9 états · B9 partiel — pas de mesure du délai · B10 OK — 0 `type="number"`,
  `inputmode="decimal"` · B11 « 86,50 CHF chez Brau- und Rauchshop, 6 points à régler » · B12 OK — chevron ⌄ partout, STANDARD OK
- B13 OK — cibles 28 à 32 px

## Contrôles (sorties)
- `verifier-page` : PAGE OK (1 image, 390 px, sans erreur) · `controle-commun --profil=sans-houblons` (u1 à u4) : COMMUN OK
- `mots-premier-ecran` : u1 95 mots, MOTS OK · `controle-contraste` : CONTRASTE OK · `controle-panel` (série u) : PANEL OK, médiane 0,59

## Ce qui tient, ce qui casse
- Tient : c'est son écran, en mieux ; les 6 points au premier écran, chacun à sa place ; rien à apprendre.
- Casse : les doutes suivent l'ordre du formulaire, pas le risque (la TVA vient en dernier) ; la feuille reste longue.

Captures : `u1-haut.png`, `u1-page.png`, `u1-repos.png`, `u1-regle-paye.png`, `u1-saut-mouture.png`, `u1-mouture-rattachee.png`,
`u1-preuve.png`, `u1-enregistre.png`, `u1-1280.png`.
