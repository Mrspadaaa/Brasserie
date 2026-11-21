# Reprise — mini maquettes Carnet : Comparer, prix, choisir → À venir (concepteur cmp-, 21.11)

Arrêt à 160 k (consigne : rendre vers 150 k). Rien n'est commité.

## Fait
- Lu : maquettes.json « carnet » (base ra+p5f ; figés comparer g01-8, v03-4, g05-8, h04-7, h06-7 ; choisi g05-11, g05-9 ;
  articles h06-5 ; gardes C1 à C8, refus K1 à K5, CR-VOIX, CR-AVENIR-CAL), captures 02 à 04, CRN-PRIX,
  VOIES-CORRECTION D1/D2/D6, AMELIO-ux (U1, U2, U4 à U6 ; formes R7 : pastille v02), AMELIO-workflow (AMW-1, 2, 3, 10),
  AMELIO-besoin. ecrans.json n'a pas d'entrée carnet : `controle-choix` ne s'applique pas ; le contrôle est
  `node scripts/agents/controle-base.mjs carnet <f.html> --dures --statique`.
- `cmp-build.mjs` : écrit 27 pages `cmp-<v>-<état>.html` (v = a1 a2 a3 b1 b2 b3 c1 c2 c3 ; état = repos, sans, eur).
  - A1 colonnes-cartes (base g01-8), épingle sur la ligne, chaîne « Classé par Prix › Volume › Dispo », ligne CHF/m³.
  - A2 lignes d'article, puces épinglées numérotées (ordre de décision), barre ∝ valeur (base h04-7 + h06-5).
  - A3 bandes par attribut : barres en couleur d'article, plan au sol à l'échelle, frise de dispo.
  - B1 pastille v02 (pleine, pointillée « CHF ? », ≈ rendu brun + décomposition en puces).
  - B2 barre empilée sur une règle CHF commune (article, port, TVA + frais).
  - B3 étiquette accrochée ; en EUR, étiquette € derrière, ≈ CHF devant ; sans prix, pavé de saisie (pas type=number).
  - C1 trois pastilles prix › livré › payé (À venir) + étiquette « déc. trop juste / janv. payable ».
  - C2 frise des mois : commande → livraison (délai) → poignée de paiement ; mois colorés payable / trop juste / prix ?.
  - C3 après Choisir : carte au bleu d'Achats, rangée « Achats » du Calendrier en aperçu, « À venir · janv. · Annuler ».
  - Aucune caisse dans le carnet (K5) : seulement des étiquettes de mois, jamais un montant de caisse.
- `cmp-capture.mjs [filtre]` : 27 captures dans `cmp-captures/cmp-<v>-<état>.jpg` (390 × 844, ×2), faites ;
  sortie : 0 débord, 0 texte < 14 px ; 4 pages dépassent le haut du champ d'ajout (714 px).

## À faire, dans l'ordre
1. Corriger les débords : A3 (repos 716, sans 716, eur 732 : réduire `.sol` à 70 px de haut ou `.fr` à 56) ;
   B3 sans (749 : pavé à 36 px de haut ou titre « Articles » retiré). Relancer `node cmp-build.mjs && node cmp-capture.mjs`.
2. Ouvrir les 27 captures (aucune n'a encore été regardée) ; refaire ce qui ne se comprend pas en 3 s.
3. `controle-base.mjs carnet <chaque cmp-*.html> --dures --statique` ; attendu : C1 « 1 façon · 3 articles » OK, C4 « À
   venir » seulement sur C (ajouter si exigé), C2 (Frigo, Ventil, Évier) est une garde de la liste des carnets : à noter
   « hors écran » dans le retour plutôt qu'à truquer.
4. Copier les références dans `cmp-ref/` (03-chambre.jpg, 04-comparer.jpg de ../2026-11-21-chasse-carnet ; g01-8, h04-7,
   h06-5, g05-9 .webp de ../2026-11-17-carnet-retouches/maquettes/page2/img/).
5. Écrire à la main `choix-carnet-2.html` sur le modèle de `../2026-11-21-calendrier-fiche/choix-fiche.html` : 3 sections
   d'axe (A, B, C), 3 versions chacune avec ses 3 captures (repos, sans prix, EUR) + référence ; `#a-choisir` en tête
   (une version par axe) ; docs `db.doc('choix/carnet2-'+id)`, localStorage `choix-carnet-2`, ids a1…c3 + general.
   Puis `node scripts/agents/verifier-page.mjs work/missions/2026-11-21-carnet-maquettes/choix-carnet-2.html --page-lot`
   → PAGE OK.
6. Commit par chemins (`cmp-*`, `cmp-captures/`, `cmp-ref/`, `choix-carnet-2.html`), sans push.

## Fait à la reprise (21.11)
- A3 : sol 68 px, frise contenue (8 sem. sur une ligne), légendes 1,8×1,5 en virgule, légende à colonnes égales ; B3 : étiquettes en SVG,
  € visible derrière, pavé 6 × 3 (704 px) ; € cohérent partout (2 513 € + port → ≈3 000 CHF rendu) ; C1 sans : « undefined » corrigé, « À venir » ;
  C3 sans : bouton sur une ligne. 27 captures ouvertes, 0 débord.
- controle-base : DURES OK et STATIQUE OK ×27 ; BASE ECHEC partout sur C2 (Frigo, Ventil, Évier : garde de la liste des carnets, hors
  écran) et, sur A et B, C4 « À venir » (sortie de l'axe C, non truquée). choix-carnet-2.html : PAGE OK (34 images).
