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

## Tour 2 (21.11, CRITIQUE-1) — arrêt à 151 k, rien commité
### Fait
- `cmp-build.mjs` patché (A1, A3, B1, B3, C1, C3) ; a2, b2, c2 non régénérées (`FIGEES`) : leurs pages restent la v0.
  - A1 : « ≥915 » (plus en vert, aucune meilleure CHF/m³) ; épingle pleine sur la ligne active seule, les autres sans épingle ;
    phrase « Touche une ligne » retirée ; prix inconnu = barre hachurée « ? » ; devis = étiquette B3 pointillée « Devis » ;
    plan au sol à l'échelle (0,28 px/cm) dans « Au sol ».
  - A3 : ordre fixe = classement dans toutes les bandes, nom court au bout de chaque barre ; en-tête dans l'ordre, unité m³ ;
    dispo en segments depuis « auj. » (3–4 sem. : plein puis pointillé), axe auj. 2 4 6 8 sem. ; porte (icône + cm) sous chaque
    rectangle au sol, rang sur le rectangle ; légendes « mieux » et « à l'échelle » retirées.
  - B commun : titre = modèle (Cellule 180, Compacte 150, Pro 210), puce « 4,06 m³ · 2e » (rang du volume), ordre c, a, b ;
    ligne vendeur · dispo sans pays (plus de coupure) ; « Ce qui compte » et « lu · saisi » retirés ; « on compare » gardé (base h06-5).
  - B1 : EUR : pastille touchée (chevron) et décomposition ouverte, tout en CHF : 2 362 + port 357 + TVA 220 + frais 60 = ≈3 000.
  - B3 : phrases retirées ; étiquette € entière au-dessus ; au toucher, barre segmentée + légende en CHF (2 362 · 357 · 280) ;
    vides : « Saisir » et « Devis / sur demande » sur l'étiquette ; pavé sans « ' » (touche « , »), saisie « 3 350 » formatée.
  - C1 : puces de caisse retirées ; titre = modèle (prix une seule fois, dans la 1re case en étiquette B3) ; case bleue « janv. ⌄ »
    (mois choisi par lui), en pointillé sans prix ; ronds de rang des autres articles (g05-9).
  - C3 : « trop juste » et point rouge retirés ; achat en jalon (point + étiquette bleue) au mois d'À venir ; « + » et œil retirés ;
    montants en encre normale ; sans prix : bouton À venir en pointillé bleu ; ronds de rang.
- Captures refaites (18) : 0 débord, 0 texte < 14 px, bas max 698 (champ 714). AUCUNE ENCORE OUVERTE.

### Reste, dans l'ordre
1. Ouvrir les 18 captures `cmp-captures/cmp-{a1,a3,b1,b3,c1,c3}-{repos,sans,eur}.jpg` ; refaire ce qui ne se lit pas en 3 s.
2. `for f in cmp-{a1,a3,b1,b3,c1,c3}-*.html; do node ../../../scripts/agents/controle-base.mjs carnet work/missions/2026-11-21-carnet-maquettes/$f --dures --statique; done`
   (depuis la racine) : attendu DURES OK, STATIQUE OK ; BASE ECHEC connus (C2 liste des carnets hors écran ; C4 « À venir » hors axe C).
   Vérifier qu'aucune page C ne contient « trop juste » ni « payable » : `grep -l "trop juste\|payable" cmp-c1-* cmp-c3-*` → rien.
3. `choix-carnet-2.html` : retirer les sections `#a2`, `#b2`, `#c2` et leurs liens de `#a-choisir` ; à leur place, une ligne
   « A2 écartée : la barre change de sens selon l'épingle, volume répété » ; « B2 écartée : trop haute pour un prix, doublonne Comparer » ;
   « C2 écartée : la frise payable / trop juste est la caisse dans le carnet (C4) ». Ajouter en tête « Tour 2 : corrigées selon CRITIQUE-1 ».
   Puis `node scripts/agents/verifier-page.mjs work/missions/2026-11-21-carnet-maquettes/choix-carnet-2.html --page-lot` → PAGE OK.
4. Commit par chemins : `git add work/missions/2026-11-21-carnet-maquettes/{cmp-build.mjs,cmp-REPRISE.md,choix-carnet-2.html} work/missions/2026-11-21-carnet-maquettes/cmp-{a1,a3,b1,b3,c1,c3}-*.html work/missions/2026-11-21-carnet-maquettes/cmp-captures/cmp-{a1,a3,b1,b3,c1,c3}-*.jpg`, sans push.

## Tour 3 (21.11, CRITIQUE-2) — fini, commité
- Rang B suit ETATS[etat].ordre (rond sur le picto, puce verte = volume seul) ; A3 axe « 8 » au bout + « sem. » ; B3 « Devis » seul et CHF + lien sous « dès 5 400 » ; C1 rond de rang en tête, plus de chevauchement « CHF ? » ; C3 modèle en titre, « 2 513 € » espacé.
- Non fait (doute) : C3 sans, étiquette du jalon à gauche du point (place manquante à droite).
- 18 captures refaites et ouvertes ; choix-carnet-2.html : PAGE OK (25 images), A2/B2/C2 en lignes « écartée ».
