v2 : 35 lignes rejouées, banc 5182 + app ?dev-local ; 18 corrige, 9 present, 4 partiel, 4 non-conclu ; 6 défauts neufs ; sombre non joué, la plupart des captures non ouvertes

# Voie v2 — rejeu local (port 5182)

Code servi : `port-carnet`, HEAD 8982b959b de `claude/port-carnet-1711` (contient bfd8cfae8, 013bcdbca). Ce worktree porte des
modifications non commitées d'une autre session (CalendrierTab, QuantityStepper…), hors carnet, servies telles quelles. Aucun fichier de code touché.
Outils : `outil.mjs`, `banc.mjs` (scénario par ligne, `?preview=carnets`), `app.mjs` (parcours réel `?dev-local`, Stocks › Matériel › Carnets,
joué à 390 et 1280 : liste vide, création, lien, 2e lien, Comparer, article, À venir). Journaux : `captures/journal-*.txt`, `captures/run-*.log`.
Thème clair seulement : sombre non joué (PCN-71, 116). Preuve : captures **ouvertes** = recon-ventil-1280, app-1280-3/4, app-390-4/6/7,
renommer-390, g8-390 ; les autres verdicts reposent sur le texte et les mesures DOM du journal (captures prises mais non ouvertes, cf. Reprise).

| id | verdict | observé (≤ 25 mots) | capture | taille |
|---|---|---|---|---|
| PCN-52 | corrige | Lien depuis la liste : « Rangé dans … Ventilation, à l'instant · 1er sur 5 · tient 80 °C oui », carte nom·vendeur·prix ; pompe-inox : « Carnet créé, en tête des Carnets », compteur 6 → 7 dit. Photo de carte non vue. | lienListe-*-clair-a, -b-pompe | 390, 1280 |
| PCN-54 | present (390) / corrige (1280) | Picto 132 px : 1280 dans un cadre de 150 (entier) ; 390 cadre de 104 px, picto 132, overflow visible : dépasse de 28 px. App 390 (pompe) : picto entier. | article-hotte-*, app-390-7-article | 390, 1280 |
| PCN-55 | corrige | Comparer 390 : colonnes à 116, 198, 280, 362 px ; 3 entières, la 4e coupée (comme g01-8). Vide sous les noms non mesuré. | comparer-390-clair | 390 |
| PCN-58 | partiel | À venir : « Prochain achat · depuis son carnet · Frigo · 4 900 CHF TTC · Froid Léman · Fixer la date · Ouvrir le carnet ». Encore groupé « Sans date · 1 », sans « en stock ». | avenir-*-clair | 390, 1280 |
| PCN-59 | corrige | Puce « ✻ Comparer sur le débit (L/min) · Ajouter » touchée : elle disparaît, critère ajouté (app 390, banc 1280 et 390). Libellé du critère : défaut neuf 2. | app-390-6-comparer, pompe-*-3 | 390, 1280 |
| PCN-60 | corrige | Zéro : frigo, puis évier et hotte tapés dans le carnet ouvert : 3 carnets distincts (Carnets 3), aucun critère croisé. | zero-*-clair-0 à 4 | 390, 1280 |
| PCN-61 | present | « Ventilation de la salle » depuis la liste (IA lente) : aucun « Déjà un carnet proche », « Carnet créé » d'emblée : doublon de Ventilation de la salle de brassage. | d131-*-pendant, -apres | 390, 1280 |
| PCN-62 | partiel | 1280 : ··· › Modifier, « Se modifie ici », Enregistrer : note changée (1 600 m³/h). 390 : texte inchangé (geste ou outil, non tranché). | notes-*-modifier, -modifiee | 1280 ✓, 390 ? |
| PCN-63 | partiel | 390 : Supprimer, bandeau Annuler, Annuler remet la note, bandeau parti. 1280 : la feuille ne s'est pas rouverte après Modifier (non conclu). | notes-390-clair-supprimee, -annulee | 390 ✓, 1280 ? |
| PCN-64 | corrige | Frigo envoyé : une pastille « À venir · ZZ TEST — Frigo… », zéro « Dans À venir depuis » répété. | lie-*-clair | 390, 1280 |
| PCN-71 | non-conclu | Frigo choisi ouvert : `.cn-pourquoi` absent du DOM (« Pourquoi ce choix » non atteint par ouvrir=frigo) ; sombre non joué. | choisi-*-haut, -pourquoi | 1280 |
| PCN-72 | corrige | 390, ✎ : « ✎ Se renomme ici » avec titre en grand, en-tête, contenu et champ « Renommer » visibles ; ✎ aligné à gauche du libellé. | renommer-390-clair (ouverte) | 390 |
| PCN-74 | present | Grille de l'article : « tient 80 °C · oui », Disponibilité, Origine ; ni débit ni prix, aucun rang (hotte, hélicoïde). Pompe (app) : « débit 25 L/min 2e ». | article-*-1280, app-390-7-article | 390, 1280 |
| PCN-75 | corrige | Vignettes 1280 : objets dessinés en couleur (hotte, extracteur, pompe) sur carré clair, pas de trait fin. | recon-ventil-1280, app-1280-4 | 1280 |
| PCN-76 | non-conclu | 1280 : la note en vrac « sol » n'est pas partie (Carnets 6). 390 : 3 carnets, titre « Résine pour le sol du local », phrase mise en forme. | vrac-sol-*-clair | 390 |
| PCN-85 | corrige | URL hotte-140 une seule fois à l'écran (« votre message : « … » »). | lienListe-1280-clair-a | 1280 |
| PCN-86 | corrige | Banc : « ZZ TEST — » identique sur Liste, Comparer, Choisi, Réalisés, À venir. En ligne non joué. | prefixe-* | 390, 1280 |
| PCN-87 | corrige | 1280 : segment 316–1052 (736 px) = colonne 736 ; + volant à 1060, 8 px de la colonne. | largeurs-1280-clair | 1280 |
| PCN-92 | corrige | Note du banc : « 3 lignes rangées dans 3 carnets » ; levure : « 3 lignes rangées dans 2 carnets » ; jamais « +3 · à acheter ». | vrac-banc-*, vrac-levure-* | 390, 1280 |
| PCN-93 | corrige | Texte dans Ventilation : pendant « L'IA range… », après « Rangé ici, à l'instant » ; aucun rang promis, aucun contredit. | pendant-texte-*-a, -b | 390, 1280 |
| PCN-102 | partiel | D-63 corrigé (3 carnets) ; lien avant (puce Coller) non joué ; D-118 prouvé à 1280 seulement. Local seul. | zero-*, notes-1280-* | 390, 1280 |
| PCN-103 | present | 390 focus du champ (g8) : bulle sur une ligne « Le critère « pas trop de bruit » pe… », coupée ; ne dit pas entre quoi. | g8-390-clair (ouverte) | 390 |
| PCN-107 | corrige | Comparer, sous le tableau : « Écartés · 1 », « Ventilateur de plafond 130 cm », « brasse la buée sans la sortir ». | comparer-*-ecartes | 390, 1280 |
| PCN-108 | present | Pompe, 2e lien : en-tête du tableau à 748 px, champ à 743 : sous la flottaison ; au-dessus, la puce « ✻ Comparer sur … ». | d35-1280-clair-2 | 1280 (390 idem : 745/747) |
| PCN-110 | non-conclu | Photo et légende : l'article « Hotte murale » porte une image (img) ; ligne « lues sur la fiche… » non trouvée ; v5 non ouvert (outil). | article-murale-* | 390, 1280 |
| PCN-112 | non-conclu | Levure : « 3 lignes rangées dans 2 carnets », carnet « Prochain brassin » né ; la phrase citée de sa carte non lue. | vrac-levure-*-clair | 390, 1280 |
| PCN-113 | present | Hors ligne : « Carnet créé », « Hors ligne : rangé sur l'appareil, tel quel », puis Ce qui compte · rien encore, Façons… ; aucun « l'IA le range au retour ». | horsligne-*-clair | 390, 1280 |
| PCN-116 | corrige (clair) | 1280 clair : 1 800 et 420 en vert gras sur aplat gris clair, lisibles ; sombre non joué. | recon-ventil-1280 (ouverte) | 1280 |
| PCN-119 | present | Zéro, « une hotte qui tient 80 °C au-dessus de la cuve » : titre = la phrase brute en minuscule. Coupure 80/°C non vue. | hotte80-390-clair | 390 |
| PCN-123 | corrige | Cadre « Arrive ici, dans Articles » (lien) : 12 px sous le contenu, soit son seul retrait. | pendant-lien-1280-clair-a | 1280 |
| PCN-126 | present | Pompe ouvert : « autre projet… frigo de garde pour 20 fûts » part dans Frigo (✓) ; « tuyau silicone 8 mm, 5 m » devient critère de Pompe « Tuyau silicone 8 mm au moins ». | pompe-1280-clair-1 à 3, -rouvert | 1280 (390 idem) |
| PCN-131 | corrige | Lien de ventilation depuis la liste : « Rangé dans … Ventilation · 1er sur 5 » à 1280 comme à 390. | lienListe-*-a | 390, 1280 |
| PCN-132 | present | Comme PCN-108 : la puce Ajouter précède, le tableau est sous la flottaison. | d35-*-2 | 390, 1280 |
| PCN-134 | corrige | « hotte murale à 1 200 m³/h au moins » depuis la liste : rangé dans Ventilation (« parle de hotte »), Carnets reste à 6. | hotte-*-liste | 390, 1280 |
| PCN-135 | corrige | Aucun carnet né, donc pas de titre brut ; dans le carnet : article « Hotte murale 1 200 m… » rangé. Critère affiché réduit à « tient 80 °C » (à revoir). | hotte-*-carnet | 390, 1280 |

## Défauts neufs

1. `?dev-local` 1280 : carnet « frigo… » créé ~8 s après l'ouverture, puis « Base initialisée avec 11 enregistrements » : Carnets 0, carnet et 1er lien perdus (app-1280-3-pompe-lien1). Probablement propre à la graine locale ; perte silencieuse à vérifier.
2. Puce acceptée « Comparer sur le débit (L/min) » : le critère s'écrit « …, puis Comparer sur débit · proposé par l'IA » (verbe recopié), en-tête et Comparer (app-390-6-comparer).
3. Pompe : le cadre pendant promet « va dans · Nouveau carnet Tuyau silicone », l'après en fait un critère de Pompe (même cause que PCN-126).
4. Zéro : titres incohérents d'un carnet à l'autre : « frigo de garde pour 6 fûts » (phrase en minuscule) à côté de « Évier » (mis en forme).
5. 390 : la ligne « 2 articles à comparer » touche le bord de la puce proposée, sans marge (app-390-4-pompe-lien2).
6. Ventilation après dépôt d'une hotte : la ligne Critère passe de « tient 80 °C, puis le débit » à « tient 80 °C » seul (hotte-*-carnet, texte) ; à confirmer à l'image.

## Reprise (ouvert)

Captures prises non ouvertes : la plupart des `captures/*.png` hors celles citées « ouvertes » ; un critique doit les regarder avant de signer.
À rejouer : sombre (PCN-71, 116 : `node banc.mjs choisi,comparer 1280 sombre`) ; PCN-62 à 390, PCN-63 à 1280 (une page par geste) ;
PCN-71 par Choisir sur un carnet À comparer ; PCN-76 note en vrac à 1280 ; PCN-110 article v5 (« Lien sans aperçu » n'est pas un bouton).
Serveur 5182 arrêté à la fin.
