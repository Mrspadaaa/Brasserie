OK — série p : 6 concepts (Prévisions p1a/b/c, Impôt bière p2a/b/c), statiques, COMMUN OK ; PANEL et MOTS en écart

## Fichiers écrits (tous dans v0/p*/)
- `v0/p1a/etat.html`, `NOTE.md` · `v0/p1b/…` · `v0/p1c/…` · `v0/p2a/…` · `v0/p2b/…` · `v0/p2c/…`
- `v0/p-outils/capturer-1280.mjs` (captures 1280 des six)
- Captures par concept : `<id>-haut.png` (premier écran 390), `<id>-page.png` (page entière : écran + état annexe), `<id>-1280.png`. Toutes ouvertes et regardées (L12).

## Les six
- **p1a, froid** — « Ce qui va sortir » : la réponse « fin janvier, il restera 2 107,34 CHF » domine, une barre en couleurs de catégorie sur la trésorerie, trois mois en liste avec le total du mois, le fermenteur compté ou non par un interrupteur sur sa ligne. Annexe : solde de départ à confirmer.
- **p1b, tiède** — l'escalier de trésorerie : deux cartes « Avec / Sans le fermenteur » (2 107,34 / 2 857,34), un graphique en marches numérotées retrouvées dans la liste avec le solde « après », le point bas nommé. Annexe : la marche fantôme.
- **p1c, chaud** — trois mois en colonnes (s5a), les sorties en blocs à la hauteur du montant, le fermenteur se pose dans le mois choisi (nov. / déc. / janv. / pas) et les fins de mois bougent. Annexe : posé en décembre.
- **p2a, froid** — « Ma part à la Confédération » : la fourchette 4,49 – 8,98 CHF avec sa raison (densité manquante), trois lignes Combien / Quand / À qui, le brassin, « Noter la densité ». Annexe : 12 °P → 6,74 CHF, exemple.
- **p2b, tiède** — la règle du barème en °Plato à trois bandes, le brassin en curseur, l'impôt par 33 cl / 75 cl / fût 20 L (0,08 / 0,19 / 5,06 CHF à 12 °P) ; feuille du brassin. Annexe : 15 °P.
- **p2c, chaud** — en cave / sorti : « Dû aujourd'hui 0,00 CHF », l'impôt court à la sortie de cave (problème 13), frise déclarer / payer, le Compagnon rédige la déclaration au toucher (exemple, sources). Annexe : 12 L sortis, réponse du Compagnon. Feuille depuis Prévisions.

## Sorties décisives
- `verifier-page.mjs` : **PAGE OK** × 6. `capturer-1280.mjs` : **CAPTURES 1280 OK** (aucun débordement, aucune erreur).
- `controle-commun.mjs v0 p1a p1b p1c p2a p2b p2c --page=etat.html --profil=sans-houblons --sans=mots` : **COMMUN OK** (couleurs, survol, blocs, contraste, standard, parlant, brutes ; au-style, fiche, trait, légende sautés par le profil ; mots joué à part, ci-dessous).
- `controle-panel.mjs` (6 `-haut.png`) : **PANEL ECHEC** sur le remplissage seul : médiane 0,58 (0,55 visé), ressemblance 0,85 (< 0,90), 0 paire presque identique ; mais 2 captures sur 6 sous le plancher 0,50 : **p2a 0,498** et **p2b 0,479** (20 % au plus). Les quatre autres : p1a 0,519 · p1b 0,673 · p1c 0,582 · p2c 0,828. Cause : des lignes de texte fines et un pied bas ; trois essais de densification n'ont pas suffi (le remplissage compte les rangées encrées, pas la hauteur des blocs).
- `mots-premier-ecran.mjs --sans-donnees` : **MOTS ECHEC** 6/6 au-dessus de 60 : p1a 83 · p1b 93 · p1c 71 · p2a 113 · p2b 104 · p2c 91. Le chrome de l'app (en-tête, rail, barre du bas) pèse ~ 12 mots ; le reste est le contenu des listes. Un passage à 60 demande de retirer des lignes, pas des explications : aucune phrase d'aide au repos ne reste.
- Honnêteté : aucun chiffre hors de la fixture ; 12 °P, 1 200 L et la réponse du Compagnon marqués « exemple » ; « ~ » et « estimé » sur le budget du brassin ; inconnus en « ? », hachures ou fourchette ; « Entrées prévues : aucune » au lieu de 0,00 ; « Dû 0,00 » expliqué par la colonne vide. L'IBAN n'apparaît nulle part.
- Statiques (ses mots du 09.11, relayés par le pilote) : les scripts ont été retirés ; chaque état utile est dessiné dans un second cadre à côté.
- Non fait : thème cave, mesures B5 et B9 ; les skills `impeccable` et `ui-design-system` n'ont pas été chargés (budget), `boosters-ux` l'a été.

## Prédiction
Il s'arrêtera sur p1c (« ça c'est parlant, on voit les mois ») et sur p2c pour la vérité « en cave / sorti » et le Compagnon ; il dira de p2b « 8 centimes la bouteille, ça je retiens » et trouvera p1a et p2a « juste la base en mieux ».

DÉCISION À PRENDRE : où vit l'Impôt bière — Clients (p2a, baseline), fiche du brassin (p2b) ou feuille de Prévisions (p2c) ; les trois sont dessinés, à lui de choisir. Et p2b emploie trois teintes « bière » pour les classes du barème, à la limite de l'échelle EBC réservée au moût (DESIGN.md).
CONNAISSANCE : sur la fixture, 12 mois sans vente prévue donnent « il manquera 1 492,66 CHF » (loyer × 12 + 60 + 64,26 + 750 − 4 181,60) : l'écran Prévisions à 12 mois doit prévoir le cas négatif et le dire en mots, pas en rouge seul.
LEÇON PROPOSÉE : le remplissage de `controle-panel` compte les rangées encrées : élargir un rembourrage ou allonger une ligne ne le remonte pas, seul un contenu dessiné (barre, bloc, pastille) le fait ; à écrire dans le brief v0 pour éviter trois essais à vide.
