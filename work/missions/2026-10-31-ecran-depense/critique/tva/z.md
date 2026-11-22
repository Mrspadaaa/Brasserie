# Série z — critique calibrée (tri v0, 01.11)

Captures ouvertes : les 7 états de z1 à z4 (`annee`, `inconnues`, `douteuse`, `etrangere`, `si`, `vide`, `horsligne`), `1280` ×4,
`z3-carte`. Base comparée : `inventaire/captures/fin-synthese-390.png`. Au tri, aucun REJET.

## À signaler en premier : la coquille n'est pas celle de la base
Les quatre z reprennent l'en-tête de l'app **à peu près** : l'icône est un carré jaune « D » (la base : carré noir, chope),
le troisième bouton est un « ? » (la base : la bulle de discussion), le « + » du bas est un disque gris plus petit que le
disque noir de la base. Les onglets, la bascule « Situation / Coûts » et les libellés de la barre sont justes. Ce n'est pas la
vue, c'est le cadre ; mais la règle n° 1 dit « repris tels quels », et il voit ce genre d'écart (D105, D155). Retouche commune
à la série z, avant toute passe : copier la coquille de r1 (icône, bulle, +). Finances n'a pas d'entrée dans `ecrans.json` :
pas d'écart de choix à relever sur la vue elle-même.

Autre écart commun : la réponse à « est-ce que je récupère ? » est écrite « Remboursée : 0,00 · non assujetti ». « Rembourser »
est son mot (J8), bien ; mais « 0,00 » est un nombre à lire, pas un « Non » : en trois secondes, r1 et r3 répondent plus vite.
Et les états `vide` de z1 et z2 portent une phrase d'aide au repos (« Le cadre reste : la TVA se lit dès la première facture. ») :
exigence « aucune phrase d'aide au repos » (brief § Exigences, PORTRAIT § 4). À retirer dans les deux.

## z1 — mode « TVA » de Synthèse, récap à renvois, liste à pastilles (froide)

**Trois secondes.** « 160,19 CHF TVA payée · 11 factures » en gros, la bande ambrée « + 3 sans TVA lue · 228,10 CHF » juste
dessous : le coût, oui ; le « récupère ? » est la petite ligne « Remboursée : 0,00 · non assujetti ». Il comprend, mais lit.

**Tient.**
- Le récap qui renvoie : quatre chips à pastille (2,6 % · 8,1 % · choisie · DE) qui filtrent la liste ; la douteuse clignote
  quand on la renvoie (NOTE). Ses mots exaucés.
- La liste la plus dense du lot : 14 factures au premier écran, chacune avec date, fournisseur, objet, TTC, pastille + taux,
  TVA. PORTRAIT § 1.2 : « plus d'information utile bat plus de vide ». Les « inconnue · ? » se voient.
- Honnêteté : bande hachurée « sans TVA lue » avec son TTC, « total partiel » à 14 inconnues, « choisie » en pointillé,
  « DE 19 % · hors CH » violet, statut en chip à interrupteur « Non assujetti · réglage » qui mène aux Réglages.
- « Si » : feuille sobre (Aujourd'hui / Payée / AFC / fiduciaire / Réglages), aucun chiffre déduit.
- 1280 : une colonne, dense, lisible.

**Casse / limites.**
- Dans la liste, le « 228,00 » allemand est dans la même colonne que les TVA suisses : l'œil l'additionne. Retouche : « à part »
  ou « EUR » dans la colonne (comme r1), le montant dans la ligne.
- La facture allemande est en CHF (« 1 428,00 CHF ») : la base ne garde pas la monnaie, mais une MwSt en CHF le fera tiquer.
- Pas de « quand » (ni mois ni trimestre) ; la liste est plate.
- Cinq tailles de texte (dit dans la NOTE).

**Phrase prédite.** « z1 la liste avec les pastilles c'est très clair, on voit tout. Mais le remboursé 0,00 je dois lire,
mets Non. Et le D jaune en haut c'est quoi ? »
Verdict : mitigé-haut (la meilleure liste du lot, réponse moins frappante).

## z2 — Annuel, barres par trimestre, net « si assujetti » (tiède)

**Trois secondes.** Non : les cinq barres viennent d'abord, le « 160,19 » après, et le « récupère ? » n'est dit nulle part en
mot au premier écran ; la ligne « Si assujetti 160,19 − 1 159,93 = −999,74 » en rouge est la première chose qui parle de
remboursement, et elle demande un calcul. PORTRAIT § 3.1 : un écran qui demande de réfléchir pour l'essentiel perd.

**Tient.**
- La période est une barre qu'on touche : T1…T4 + 2026, chacune avec son montant à droite ; l'inconnu est un jeton « 1? »
  au bout de la barre, sans longueur ; une période toute inconnue est « — ». Honnête et net. 1280 : les barres s'étalent,
  la meilleure lecture 1280 du lot.
- `inconnues` : T1 « 6? — », T2 « 7? — », « total partiel » : le total ne trompe pas.
- Le net « si » n'existe qu'en différence, feuille avec ventes, taux, méthode, inconnues non comptées, statut, AFC : conforme
  à la fiche § Axes (jamais un « récupéré » seul).
- Les rubriques « Compte de résultat · Bilan · Clôture » de l'app sous la section (état `vide`) : la base est là.

**Casse / limites.**
- Le net en rouge au repos se lit comme une alerte ou un solde dû ; retouche : net en noir avec « je paierais » au lieu
  du signe seul, ou replié comme r2.
- Les mois ne sont plus écrits nulle part (retirés pour MOTS) ; T1…T4 lui suffisent sans doute, mais « T » n'est pas son mot.
- La réponse « Non » absente du premier écran : à ajouter devant le total (« Remboursée : non »).

**Phrase prédite.** « z2 les barres par trimestre c'est pas mal, on voit le T2. Par contre le truc en rouge −999 c'est quoi ?
Faut que je réfléchisse. »
Verdict : mitigé (bonne forme, réponse mal placée).

## z3 — carte de Synthèse → la gaufre, une case = 2 CHF, un rang par mois (chaude)

**Trois secondes.** Le coût, oui et fort : « 160,19 CHF », puis les rangs de cases ; avril et mai sautent aux yeux sans un
chiffre. Le « récupère ? » est la dernière ligne de l'écran (« Remboursée : 0,00 ») et passe sous le pli en `horsligne`.

**Tient.**
- « Voir la TVA avant de la lire » : la gaufre est l'idée la plus neuve du lot, et elle est honnête : la case « ? » n'a pas
  de valeur, un mois tout inconnu est « ? », pas 0 ; « +1? » à côté du montant du mois ; `inconnues` : sept mois de « ? »
  hachurés, « total partiel ». 1280 : la gaufre s'étire, les mois ouverts gardent leurs factures.
- La carte dans Synthèse (`z3-carte`) : 80 cases, le total, les chips, posée après Trésorerie, avec toutes les rangées de la
  base autour. C'est la seule variante du lot qui montre la carte fermée dans la vraie page de Synthèse avec ses rangées.
- Chips de taux qui filtrent les cases (les autres s'effacent) ; un rang ouvre ses factures ; douteuse en case pointillée.
- Deux couleurs et une hachure, pas plus : lisible (ma faiblesse connue est le radar multicolore ; ici ça ne s'applique pas).

**Casse / limites.**
- « ■ = 2 CHF » est une légende écrite au repos (la NOTE le dit). Un mot-signe, mais PORTRAIT § 4 « la légende écrite au
  repos ». Retouche : le montant du mois à droite suffit comme échelle ; l'unité au toucher.
- La gaufre arrondit : 4,41 CHF = 2 cases (4 CHF). Il ne le verra pas, mais c'est une case qui vaut « 2 CHF » et parfois 0,41.
- L'ordre : le « Non » tout en bas, contre la fiche (« je récupère ? » d'abord).
- Un gros mois tient sur deux lignes de cases (avril) : la ligne se brise, le rang est moins net.

**Phrase prédite.** « z3 ça c'est parlant, on voit direct avril et mai. Mais le = 2 CHF je dois lire la légende, et le
remboursé est tout en bas, ça devrait être en haut. »
Verdict : aime (idée forte, deux placements à corriger).

## z4 — mode TVA : la TVA par brassin en bouteilles, ct/L, le hors brassin à part (chaude)

**Trois secondes.** Le coût oui (« 160,19 CHF payée · 0,00 remboursée ») ; les bouteilles et « 6 ct/L » parlent brasseur tout
de suite ; « Hors brassin 110,03 · 69 % » est la phrase la plus utile du lot : la TVA n'est pas dans sa bière, elle est dans le
matériel.

**Tient.**
- Pensée brasseur : ct/L par brassin, en couleur de production, et le fût « Hors brassin » avec sa part. PORTRAIT § 3.2.
- Honnêteté : brassin tout inconnu = bouteille hachurée, « ? », « TVA inconnue » ; bande « 8 sans TVA lue · 1 727,90 » ;
  « total partiel » ; douteuse en segment hachuré « choisie » dans la barre du brassin ; DE violet « hors CH » dans le fût,
  hors du total.
- 1280 : deux colonnes de brassins, le hors brassin ouvert à droite : la meilleure 1280 chaude.
- Chaque brassin s'ouvre sur ses factures (#14 Pale Ale ouvert d'office avec ses trois lignes).

**Casse / limites.**
- Un brassin qui a une inconnue (#16 Stout, « 200 L · 1? ») affiche « 16,73 » et « 8 ct/L » sans « ≥ » : le ct/L est
  calculé sur la TVA connue et le dit en tout petit. Retouche : « ≥ 16,73 » et « ≥ 8 ct/L » quand une facture est inconnue.
- La hauteur de remplissage des bouteilles n'a pas d'échelle (relative au max ?) ; la barre sous le nom non plus. Il
  demandera « c'est rempli par rapport à quoi ? ».
- `vide` : « Hors brassin 0 % » : un zéro de part dans un état sans dépense ; mettre « — ».
- Le lien facture → brassin n'existe que pour les ingrédients ; un malt livré pour deux brassins n'a pas de règle (même
  réserve que r3).
- « Récupérable : Dépend de tes ventes : rien n'est déduit ici » dans la feuille « si » : une phrase de plus que nécessaire
  (J12). Garder « rien n'est déduit ici ».

**Phrase prédite.** « z4 les bouteilles j'aime bien, 10 ct par litre c'est concret, et le 69 % hors brassin c'est intéressant.
Mais le Stout avec le 1? il me dit 8 ct/L comme si c'était sûr. »
Verdict : aime (avec une rectification d'honnêteté).

## Pour la série
- Niveau : au niveau du lot 21 pour z1, z3, z4 ; z2 est un cran dessous (réponse absente du premier écran). Données
  fictives, cohérentes entre les quatre (160,19 = 50,16 + 110,03). Aucune n'est restée sur ses exemples.
- Diversité réelle : liste plate, barres par trimestre, gaufre par mois, bouteilles par brassin. Le PANEL ECHEC (0,91 ; z2 à
  0,49) vient de la coquille et des listes blanches ; à l'œil, quatre compositions.
- Ordre dans la série : z3 > z4 > z1 > z2.
