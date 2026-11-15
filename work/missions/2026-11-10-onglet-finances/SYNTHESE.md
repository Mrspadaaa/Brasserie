OK — tri : f1b, f2d, f3d (puis f2b, f1e) · 0 bloquant · 41 problèmes comptés

# Synthèse du tri v0 — onglet « effet sur mes finances » (critique Fable, 10.11)

Lu : DOSSIER.md, BRIEF-V0.md, 15 NOTE.md ; ouvert : v6a-haut, v6a-etat et les 45 captures (haut, fermé, encaissement).
Question posée à chaque capture, en brasseur : « qu'est-ce que cette pièce change à mon mois, et je le vois en 3 s ? »
Référence : la forme v6a (piles par catégorie, hachure « à payer », rangée payé · à payer · dépensé), sans items ni opérations.

**Niveau du panel** : au-dessus du plancher. Quatorze concepts sur quinze gardent le vocabulaire v6a, les écarts sont exacts
au centime partout (vérifiés : 383,80 − 325,40 ; 755,20 = 468 + 245,20 + 42 ; 4 210 − 58,40 ; 774 − 720), aucune liste d'items
ni d'opérations, aucune cible vue sous 24 px. Pas de relance de série. Série 1 collée à v6a par consigne (un tiers du lot),
pas plus. `controle-panel.mjs` : ÉCHEC déclaré sur la série 1 par le fond de saisie imposé, OK ailleurs (non rejoué ici).

**Aucun rejet** : le classement ordonne, le brasseur voit tout.

Trois constats transversaux, à corriger partout avant la passe 2 :
- T1. Les captures « encaissement » des séries 2 et 3 montrent le picto ✦ dans l'en-tête Vendre et, en série 3, une bande blanche
  de 95 px au-dessus du dialogue : fond à refaire tel que l'app (DOSSIER « jamais réinventé »).
- T2. Halos et lueurs (f2e, f3a, f3d, f3e) : refus explicite (« le glowing, les halos », PORTRAIT § 4). Remplacer par un contour
  net ou un segment plus clair, comme f1b et f3c.
- T3. Fermé, l'onglet doit déjà porter l'écart : f1a, f1b, f1c, f1d, f2c, f3c l'ouvrent sur un mot seul (« mon mois »). Les meilleurs
  fermés sont f2b (« Brassage 186,80 → 245,20 »), f1e (mini-piles + 58,40), f3e (ruban + 58,40), f3a (« Brassage +58,40 »).

## 1. Classement

| Rang | Id | Nom | Force · problèmes |
|---|---|---|---|
| 1 | f1b | Le malt sur la pile | v6a intact, la pièce cernée de noir sur sa pile et la pastille « +58,40 » juste au-dessus : lu en 1 s, Ventes pareil en caisse. Problèmes : (1) fermé, la languette « Mon mois » ne dit pas l'écart ; (2) la rangée payé · dépensé ne marque pas ce qui a bougé ; (3) pastille et montant « 245,20 » empilés serrés au-dessus de la pile. |
| 2 | f2b | La ligne du mois | Le meilleur fermé du lot : « Brassage 186,80 → 245,20 » avec la vignette des piles, sans ouvrir ; ouvert, fantôme pointillé dans la pile et anciens montants barrés dans la rangée. Problèmes : (1) légende écrite « avant · après » au repos (D1) ; (2) rangée cassée sur deux lignes, « dépensé » orphelin ; (3) « 186,80 » barré dans la pile à ~12 px, dense ; (4) en caisse, le fantôme fait presque toute la pile Ventes. |
| 3 | f2d | Payée ou à payer | Sa phrase reprise : bascule « ✓ Payé \| À payer » à 32 px, la pièce tombe pleine ou hachurée, « Encaissé \| Facture QR » en caisse ; fermé « Mon mois +58,40 ». Problèmes : (1) titre en question « Payée ou à payer ? », texte en trop ; (2) deux commandes pour le même fait (Règlement de la saisie et la bascule) ; (3) tuiles à la place de la rangée v6a, la pile seule n'a plus sa ligne payé · à payer · dépensé ; (4) carte haute, le graphe est poussé en bas. |
| 4 | f1e | Les écarts en pastilles | Fermé exemplaire : mini-piles colorées + « +58,40 » dans le pied ; ouvert, la pastille sur la pile. Problèmes : (1) quatre tuiles = une ligne de chiffres en plus, risque cockpit (D2) ; (2) pastilles noires lourdes, trois fois le même « +58,40 » ; (3) ronds « = » inutiles (« Ça c'est inutile ») ; (4) la rangée v6a a disparu au profit des tuiles. |
| 5 | f2a | Saisie \| Finances | Titre qui répond seul : « Brassage 58,40 payée » ; graphe plein écran, segment cerné, tuiles d'écart. Problèmes : (1) la saisie disparaît entièrement, on ne voit plus qu'on est dans la pièce (DOSSIER « ouvert, il laisse voir ») ; (2) 1 100 px de graphe pour cinq piles, crème vide (D4) ; (3) « inchangé » écrit trois fois ; (4) à 1280, rangée sous la barre (noté par l'auteur). |
| 6 | f1c | L'ombre d'avant | Honnête : ombre grise d'avant derrière chaque pile, ancien montant barré, tableau avant / après sous le graphe. Problèmes : (1) ombres sur toutes les piles, bruit visuel, Ventes a l'air en relief ; (2) voile modal sur la saisie ; (3) en caisse, le tableau dit « rien n'a bougé » alors que Ventes a bougé (Ventes absent de la rangée) ; (4) fermé sans écart. |
| 7 | f3d | La cascade | Lecture gauche → droite : dépensé 696,80, la pièce, 755,20 ; en caisse la même sur Ventes. Problèmes : (1) halo sur la pièce flottante (T2) ; (2) on perd les piles par catégorie de v6a, Brassage remonté en haut ; (3) Matériel absent (exact, mais il manque au mois) ; (4) légende à droite en texte. |
| 8 | f2c | Le solde après | Le solde mène, gros et net : « 4 151,60 −58,40 », escalier et piles dessous ; dense et utile. Problèmes : (1) autre question que la sienne (le solde, pas le mois) ; (2) marche de 58 sur un axe de 4 210, à peine visible, axe tronqué ; (3) fermé « Mon solde après » gris, sans écart ; (4) solde = fixture non renseignée dans l'app (Prévisions vide). |
| 9 | f1a | Après Enregistrer | L'état v6a « Après ✓ Payé » presque mot pour mot, deux graphes alignés, honnête. Problèmes : (1) aucun écart chiffré, il faut soustraire 245,20 − 186,80 soi-même ; (2) deux graphes = 55 % de l'écran pour une pile qui bouge ; (3) fermé : « mon mois » en gris 12 px, quasi invisible. |
| 10 | f2e | Entré contre dépensé | Message fort : la pièce fait passer le dépensé (755,20) au-dessus des ventes (pointillé 720,00). Problèmes : (1) halo (T2) ; (2) perd la comparaison catégorie à catégorie de v6a ; (3) légende en colonne de texte ; (4) Matériel isolé tout à droite ; (5) en caisse, trait vertical résiduel à droite de la pile dépensé. |
| 11 | f3e | Le ruban du mois | Fermé remarquable : le ruban du mois est l'onglet, avec « +58,40 ». Problèmes : (1) Nettoyage et Matériel trop fins pour se lire, légende déportée ; (2) lueur sur le segment (T2) ; (3) vide de 40 px sous le titre ; (4) le ruban Ventes et le ruban dépenses ne se comparent pas aussi vite que deux hauteurs. |
| 12 | f3c | Avant, après au doigt | Bouton « Maintenir : voir avant » à 56 px, segment plus clair sans halo, pastille au repos. Problèmes : (1) à 390 le tiroir couvre 80 % de l'écran, la saisie n'est qu'une tranche ; (2) deux commandes pour un seul geste (segment avant \| après et le bouton) ; (3) « Finances » écrit à la verticale ; (4) tiroir à droite, loin du pouce. |
| 13 | f1d | Avant, après, au doigt | Pied scindé « Mon mois \| Enregistrer » propre, bascule 28 px. Problèmes : (1) sur l'écran fixe l'écart n'existe pas : « un écran qui demande un toucher pour voir l'essentiel perd » (PORTRAIT § 3.1) ; (2) tout le reste estompé, Ventes illisible en pastel ; (3) fermé sans écart. |
| 14 | f3a | La pièce s'allume | Fermé « Brassage +58,40 » en pilule noire centrée : le plus moderne du lot ; titre « Ce que la pièce change » juste. Problèmes : (1) vitrine sombre dans le thème clair, écart au thème choisi page blanche (D106) ; (2) halo jaune = refus explicite (T2) ; (3) les autres piles éteintes, le mois ne se lit plus ; (4) tuiles encore. |
| 15 | f3b | Le mois en anneaux | Idée neuve, écart au centre. Problèmes : (1) un arc se compare mal à un autre, le brasseur lit des hauteurs ; (2) la hachure « à payer » des Fixes paraît plus grande que Brassage et Nettoyage réunis ; (3) quart bas-gauche vide ; (4) le trait noir « avant » et l'arc de la pièce sont minuscules ; (5) anneaux multicolores concentriques : même famille que le radar refusé. |

## 2. Candidates (trois, une par approche, trois chaleurs)

### f1b — Le malt sur la pile (froide) — candidate de base
Retouches : (a) fermé, écrire l'écart dans la languette ; (b) souligner ou mettre en gras payé 383,80 et dépensé 755,20 dans la
rangée ; (c) espacer pastille et montant au-dessus de la pile.
Greffes : la ligne-résumé fermée « Brassage 186,80 → 245,20 » avec vignette des piles (f2b) à la place de la languette ; les
anciens montants barrés dans la rangée (f2b) ; en caisse, la Ventes hachurée verte « à encaisser » sur Facture QR (f2d) ;
le titre « Ce que la pièce change » (f3a) si un titre reste.

### f2d — Payée ou à payer (tiède) — candidate du geste
Retouches : (a) remplacer le titre-question par rien ou par « Mon mois » ; (b) rendre la rangée v6a sous le graphe, tuiles
supprimées, pastille d'écart posée dans la rangée ; (c) une seule commande : la bascule de l'onglet réécrit Règlement et le dit
en une ligne.
Greffes : segment cerné de noir + pastille sur la pile (f1b) ; fermé « Mon mois +58,40 » déjà là, garder ; la pilule noire
centrée de f3a comme forme du bouton fermé ; en caisse, « à encaisser 0,00 » devient « — » si rien (honnêteté, D14).

### f3d — La cascade (chaude) — candidate de la représentation
Retouches : (a) supprimer le halo, garder un contour net ; (b) ajouter Matériel à part après son pointillé, comme v6a ;
(c) remettre l'ordre des couleurs de v6a dans la pile (Fixes en bas, Brassage, Nettoyage) et mettre la pièce en segment clair
au sommet.
Greffes : la rangée barrée « payé 325,40 → 383,80 » (f2b, déjà là en partie) ; fermé, le ruban-onglet de f3e ou les mini-piles
de f1e avec « +58,40 » ; le pointillé des ventes qui montre le dépassement (f2e) comme repère horizontal au niveau 720,00.

### Greffes bonnes à prendre, d'où qu'elles viennent
- Ligne-résumé fermée avec « avant → après » (f2b) → f1b, f3d.
- Ruban du mois comme onglet fermé, écart au bout (f3e) → f3d, f1e.
- Pilule noire centrée « Brassage +58,40 » (f3a) → f2d, f1b.
- Bascule « ✓ Payé \| À payer » 32 px et sa jumelle « Encaissé \| Facture QR » (f2d) → f1b.
- Pointillé au niveau des ventes pour dire si le dépensé passe au-dessus (f2e) → f3d, f1b.
- Bouton « Maintenir : voir avant » (f3c) → f2d, comme geste secondaire, jamais seul (leçon de f1d).
- Montants barrés dans la rangée (f2b) → toutes.
- Tableau avant / après sous le graphe (f1c) → f2c si le solde est gardé en passe 2.

### Relances ciblées
- f2c : à garder vivante comme « axe 3 » (piles + solde) si le brasseur veut le solde : escalier à zéro ou marche grossie ×3,
  fermé avec l'écart.
- f2a et f3c : fusion possible en passe 2, panneau latéral à 1280 seulement ; à 390, feuille mi-hauteur (la saisie reste visible).
- f3b : à montrer au brasseur une fois (variété, L27), pas de passe 2 sauf demande.

## 3. Pastilles pour la page

| Id | Pastille |
|---|---|
| f1b | favorite |
| f2b | favorite |
| f2d | favorite |
| f1e | bien |
| f2a | bien |
| f1c | bien |
| f3d | bien |
| f2c | avec réserve |
| f1a | avec réserve |
| f2e | avec réserve |
| f3e | avec réserve |
| f3c | avec réserve |
| f1d | à revoir |
| f3a | à revoir |
| f3b | à revoir |

## Phrases prédites du brasseur
- f1b : « Ça c'est clair, je vois direct le malt sur ma pile. Mais fermé il me dit rien. »
- f2b : « La ligne en bas avec 186,80 → 245,20, très bien, j'ai même pas besoin d'ouvrir. Enlève la légende. »
- f2d : « Le ✓ Payé qui fait tomber la pièce hachurée, vachement bien. Pourquoi la question en titre ? »
- f1d : « Je vois pas ce qui change ??? Il faut toucher ? »
- f3a : « Pourquoi c'est noir ? Et le glowing, j'ai déjà dit. »
- f3b : « Les anneaux je compare rien, c'est joli mais inutile. »

## Doutes (non comptés)
- Le « ✦ » dans l'en-tête Vendre des séries 2 et 3 : picto de l'app réelle ou ajout du concepteur ? À vérifier sur
  `captures/caisse-entree-390.png` avant la passe 2.
- Le trait vertical à droite de la pile dépensé dans `f2e-etat.png` : marqueur voulu (niveau avant) ou résidu.
- Tailles de texte mesurées à l'œil sur capture ×2 ; aucune cible vue sous 24 px, mais la languette f3d fermée (~30 px) et la
  poignée f1a sont à mesurer au DOM.

LEÇON PROPOSÉE : aucune.
