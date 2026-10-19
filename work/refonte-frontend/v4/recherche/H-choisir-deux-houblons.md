# H — Choisir deux houblons : ce qui est mesuré, ce que montrent les outils, ce qu'un outil honnête peut calculer

Recherche du 19.10.2026 (Opus 5.5, pilote). Quatre recherches web déléguées à des agents Haiku, puis
relues ; chiffres clés revérifiés par le pilote. Inventaire du dépôt fait par un agent de lecture,
puis contrôlé par sondage. Sources web consultées le 19.10.2026 ; les numéros `[n]` renvoient à la
section Sources. Aucun fichier du dépôt modifié hors de ce rapport.

**Niveau de preuve.** **[P]** publié avec comité de lecture. **[F]** fiche ou document de
fabricant. **[S]** secondaire : congrès, diapositives, blog, vulgarisation. **[H]** hypothèse ou
calcul du pilote. *lu* : page ou PDF ouvert. *relayé* : seulement un résumé de moteur, une
citation ou une page tierce.

**Statut par rapport au dépôt.** **établi** (avec le document du dépôt), **nouveau**, **contredit**
(avec la raison). Les chemins du dépôt partent de la racine `Brasserie/`.

---

## Ce que le dépôt savait déjà

Le dépôt contenait déjà l'essentiel de la **méthode**. Il lui manquait surtout des **chiffres
par variété, par moment et par matrice**.

| Acquis | Où | Ce que H en fait |
|---|---|---|
| Séparer trois niveaux : ce qui est apporté, ce qui reste ou se transforme, ce qui est perçu. Pas de somme « huile × poids » présentée comme intensité. | `docs/index-houblon-recherche.md` §3 | Repris tel quel ; H chiffre les deux premiers niveaux |
| L'huile totale prédit mal (aucune corrélation sur 23 lots de Cascade) ; le marqueur utile change avec la variété (géraniol pour Cascade, β-pinène pour Centennial ; ≈ 50 % de variance au mieux) | `docs/index-houblon-recherche.md` §3 ; E §2 | Confirmé [23] [89] |
| Dose Cascade 0 / 2 / 3,86 / 8 / 16 g/L (Lafontaine et Shellhammer 2018, tab. 3) : agrumes 1,9 ; 4,4 ; 5,8 ; 7,1 ; 7,0 ; herbacé/thé 2,5 ; 4,3 ; 5,7 ; 7,4 ; 10,4 sur 15 | `docs/hop-solver.md` l. 84 | Utilisé en §2 et §7 |
| Étalonnage Cascade 2015 : agrumes = 4,153 + 0,548 × géraniol (mg/100 g), R² 0,50 ; géraniol 0,32–4,07 mg/100 g sur 29 lots | `docs/index-houblon-etalonnage.md` ; `src/data/hopStudies/lafontaine2018.cascade2015.json` | Montre la variabilité par lot (§2.5) |
| Conjugués de thiols : la forme (Cys, GSH, γ-GluCys) compte ; aucun rendement universel (Santiago 2015, Chenot 2022, Christiaens 2025, Calicis 2025) | `docs/index-houblon-recherche.md` §2 | Complété par des ordres de grandeur (§6.2) |
| Classes « thiol impact » de Hopsteiner (250 échantillons, 97 variétés) | `docs/index-houblon-revue.md` l. 38–44 | **Nouveau ici** : valeurs de Citra, Cascade, Galaxy, Idaho 7 lues dans les tableaux [11] |
| Samia et al. : Diamond produit le plus de thiols mais le fruité perçu le plus faible | `docs/research/hop-style-practical-research.md` l. 179 ; `docs/research/hop-yeast-interactions-research.md` §2 | Repris en §8.4 |
| Hop creep : mécanisme établi (Kirkpatrick et Shellhammer 2018 ; Willemart 2025 ; Young et Fox 2026), aucun calcul universel de points de densité | `docs/index-houblon-recherche.md` §5 ; `docs/research/hop-yeast-interactions-research.md` §6 | Repris en §6 |
| Amertume du dry hop (humulinones, Maye et al. 2016) déjà simulée dans l'app | `docs/water-dryhop-2026-09-09.md` | Brique existante à réutiliser |
| Oxygène et stockage réduisent agrumes et tropical (Barnette et Shellhammer 2019) | `docs/research/hop-style-practical-research.md` §4 | Complété par des chiffres de vieillissement (§8.5) |
| Modèle V5.5 : dose hyperbolique (demi-dose 2–4 g/L en dry hop), extraction 1 − e^(−t/τ) avec τ = 2–12 h, matrice 0,85–1,15 « supposée », confiance « low » codée en dur ; aucune validation externe | `docs/hop-extrapolation.md` ; `src/data/hopExtrapolationBootstrap.json` ; `docs/validation/houblons-v5-2026-09-29.md` | Comparé à la littérature en §7.2 et §7.4 |
| Levures : US-05, Verdant, Pomona, Diamond au catalogue ; profils numériques de souche = « jugement L'Affinée » | `src/data/yeastCatalogueBootstrap.json` ; `src/data/hopExtrapolationBootstrap.json` | Fiches fabricant relues en §8.4 |
| OAV ≠ intensité ; seuil de perception ≠ seuil de rejet | `docs/index-houblon-revue.md` l. 17 et 43 | Règle conservée ; H donne les seuils en plage (§8.1) |
| Données : Beer Maverick (318), Hopsteiner (102), HopDatabase (MIT) ; COA Cascade (linalol 0,02–0,03 % en 2024, 0,3 % en 2025) ; COA Idaho 7 2025 (huile 2,5 ; linalol 0,4 ; géraniol 0,6) | `docs/index-houblon-consolidation.md` ; `src/data/hopPublicLotBootstrap.json` | Le lot prime (§2.5) |
| Rapport E (18.10) et commentaire de #131 (19.10) : sources, licences, défaut de la fiche Citra cryo | `work/refonte-frontend/v4/recherche/E-donnees-houblon.md` ; issue #131 | Prolongés, pas refaits |

**Ce qui est nouveau dans H.** Le profil sensoriel chiffré de Yakima Chief par forme de produit ;
les thiols libres mesurés pour Citra, Cascade, Galaxy et Idaho 7 ; un panel OSU qui compare 12
variétés en dry hop et au whirlpool à dose égale ; des taux de transfert par moment ; des seuils
avec leur matrice ; des chiffres de vieillissement et de HSI ; l'absence de données sur le
masquage en stout.

**Contradictions internes signalées par l'inventaire.** POF de Verdant et Pomona (« négatif »
dans un fichier, « non documenté » dans un autre) ; linalol de Cascade d'un facteur 10 entre COA
2024 et fiche Hopsteiner ; deux articles Lafontaine 2018 confondus pour le protocole. H les
signale là où ils comptent ; il ne les corrige pas.

---

## 0. L'essentiel

1. **Citra et Cascade se ressemblent sur le papier, même mesurés.** Sur houblon broyé, le
   panel de Yakima Chief donne des profils T-90 presque superposables : agrumes 92 contre 85,
   tropical 78 contre 73, baies 70 contre 67, sur 100 [1] [2]. Les mots et les profils de
   forme ne peuvent donc pas les séparer. **nouveau**
2. **L'écart est une affaire de quantité par gramme et de quelques molécules.** Citra porte
   environ 2 fois plus d'huile, environ 3 fois plus de linalol par gramme (milieux des plages
   YCH, plages qui se recouvrent), et le plus fort 4MMP libre des 97 variétés de Hopsteiner
   (38 µg/kg) contre 2,4–3,8 µg/kg pour Cascade US [1] [2] [7] [11]. Cascade porte 5 à 10 fois plus de farnésène [2] [7]. À 4 g/L en dry hop, 12
   variétés côte à côte : Citra est à l'extrême « intensité, agrumes, tropical », Cascade au
   centre, avec Nugget et Chinook [21]. **nouveau**
3. **Plus de Cascade ne donne pas un Citra.** Les agrumes plafonnent vers 8 g/L (7,1 puis 7,0 à
   16 g/L) ; l'herbacé/thé continue de monter (7,4 puis 10,4) [22]. La dose déplace la
   *qualité*, pas seulement l'intensité. **établi** (`docs/hop-solver.md`)
4. **Le moment change la variété ; la durée, peu.** Myrcène < 1 % retrouvé en ajout tardif,
   ≤ 2–3 % en dry hop ; linalol 60–63 % en tardif, jusqu'à 80 % en dry hop [30] [31] ; 4MMP
   −91 % après 60′ d'ébullition [13]. Yakima Chief range Cascade parmi les houblons pauvres en
   composés « survivables », à réserver au dry hop après fermentation [5]. L'essentiel d'un dry
   hop est extrait en 24 h : 5 à 7 jours n'ajoutent pas d'arôme mesuré, seulement du risque de
   hop creep si la levure est vivante [73] [68]. **nouveau**
5. **Le lot pèse autant que la variété.** À la même dose de 3,8 g/L, l'intensité globale de
   Cascade varie de 6 à 9,5 sur 15 selon le lot (29 lots, 19 fermes) [21] ; le géraniol, d'un
   facteur 13 [établi] ; le 4MMP de Simcoe 2006 vaut un cinquième de 2005 [12] ; un Cascade
   récolté tard donne plus d'agrumes [20]. **établi en partie, complété**
6. **Les seuils publiés divergent d'un facteur 10 à 80.** Linalol : 1,0–1,7 µg/L (seuil de
   différence), 8 µg/L, 83 µg/L (détection de groupe en pale ale à 4,9 %) [12] [34] [35]. Un
   rapport concentration/seuil n'a de sens qu'en plage, dans sa matrice. **nouveau**
7. **Biotransformation et levure : des drapeaux, pas des chiffres.** Géraniol → citronellol :
   mesuré, non chiffré en bière ; thiols libérés des précurseurs : 0,01–0,35 % sur précurseur
   synthétique [42] ; glycosides : faible libération ; levures « thiolées » : chiffres de
   fabricant [47]. **établi en partie, complété**
8. **Calculable aujourd'hui, avec preuve [P] ou [F] :** la charge par ajout (mL d'huile/hL,
   mg/L de linalol et de géraniol, ng/L de 4MMP), sa part transférée en plage, son rapport au
   seuil en plage, la saturation de dose (Cascade seulement) et des alertes (hop creep,
   vieillissement, HSI). **Pas calculable :** l'intensité d'un assemblage, l'effet de l'ordre de
   deux dry hops, le masquage dans une stout.

---

## 1. Citra contre Cascade en dry hop

### 1.1 Table chiffrée

Pellets T-90 sauf mention. « % » = % de l'huile totale. Le rapport est un ordre de grandeur
[H] calculé sur les plages citées.

| Grandeur | Citra | Cascade | Rapport, sens | Statut |
|---|---|---|---|---|
| Huile totale, mL/100 g | 1,0–3,0 (YCH) [1] ; 2,2–2,8 (Haas) [7] ; ≤ 2,8 (BarthHaas, 4 dernières années) [8] ; 1,5–3,0 (Beer Maverick, dépôt) | 0,5–2,0 (YCH) [2] ; 0,7–1,4 (Haas) [7] ; 0,8–1,5 (Hopsteiner) [10] ; 0,5–2,6 sur 29 lots 2015 (OSU) [21] ; 0,8–1,5 (Cascade FR) [9] | ≈ ×2 par gramme | établi (plages), complété |
| Myrcène | 50–70 (YCH) ; 60–65 (Haas) ; 28,6–66 (BarthHaas) | 40–60 (YCH) ; 45–60 (Haas, Cascade FR) | légèrement plus chez Citra ; ≤ 3 % passe en bière [31] | établi |
| Humulène | 7–12,5 (YCH) ; 11–13 (Haas) ; 7,9–13,2 (BarthHaas) | 10–20 (YCH) ; 8–13 (Haas) ; 10–16 (FR) | Cascade un peu plus | établi |
| Caryophyllène | 4–8 (YCH) ; 6–8 (Haas) ; 3,7–9 (BarthHaas) | 4–10 (YCH) ; 3–6 (Haas, FR) | comparable | établi |
| Farnésène | 0,1–1 (YCH) ; < 1 (Haas) ; ≤ 0,6 (BarthHaas) | 4,5–8,5 (YCH) ; 3–7 (Haas) ; 4–8 (Hopsteiner, FR) | **Cascade ×5 à ×10** | nouveau (farnésène absent du pack, #131) |
| β-pinène | 0,6–1 (YCH) | 0,5–1 (YCH) | comparable | nouveau |
| Linalol, % | 0,5–1 (YCH) ; 1–2 (Haas) ; 0,5–1,1 (BarthHaas) | 0,1–0,6 (YCH) ; 0,4–0,6 (Hopsteiner) ; 0,5 (FR) ; COA 0,02–0,03 (2024) et 0,3 (2025) | ≈ ×2 en part ; avec l'huile, **≈ ×3 par gramme** au milieu des plages YCH (plages qui se recouvrent) [H] | nouveau ; écart des COA **établi** |
| Géraniol, % | 0,2–0,8 (YCH) ; 0,2–0,6 (BarthHaas) | 0,1–0,5 (YCH) ; COA 0,19–0,5 ; 0,32–4,07 mg/100 g sur 29 lots | proche en part ; Cascade donne pourtant **le plus de géraniol en bière** des 11 cultivars de Kishimoto (82,8 µg/L à 2 g/L) [12] | nouveau |
| 4MMP libre, µg/kg | > 10, maximum 38 : le plus haut des 97 variétés (LC-MS/MS, récoltes 2019–2023) [11] ; parmi les plus hauts sur 53 échantillons, maximum de l'étude 114 [14] | US 2019–2023 : 2,4–3,8 [11] ; littérature 0,8–16,8 [11] ; 11,1 (récolte 2006) [12] ; Allemagne, Argentine : non détecté [11] | **≈ ×3 à ×15** | nouveau |
| 3MH libre, µg/kg | < 10 [11] ; 12 [16] | US : 2,9–6,6 (LC-MS/MS) [11] ; 10,0–117,1 (anciennes méthodes GC) [11] [17] | comparable ; Hopsteiner juge le 3MH « peut-être surestimé par le passé » | **contredit** : les 73–117 µg/kg souvent cités pour Cascade viennent de méthodes que Hopsteiner suspecte de confondre 3MH et 3M4MP [11] |
| 3M4MP libre, µg/kg | > 10 [11] | US : 3,4–10,0 [11] | Citra plus | nouveau |
| 3MHA dans le houblon | 27 µg/kg [15] | non détecté dans le houblon broyé [20] | Citra seul | nouveau |
| Précurseurs de 3SH | glutathionylés ≈ 23 mg/kg ; cystéinylés 0,6 mg/kg ; libre 12 µg/kg (équivalents thiol libre) [16] | cystéinylés libérables 1,64 mg/kg [17] ; conjugués jusqu'à 20 mg/kg [18, relayé] ; Samia 2026 : GSH 7,9 et Cys 0,19 mg/kg (dépôt) | **même ordre** | **contredit** : « Cascade = précurseurs, Citra = thiols libres » [19] ne tient pas pour les précurseurs ; Citra en porte autant (méthodes différentes) |
| Classe « thiol impact » | high [11] | high (US) ; medium (Allemagne, Argentine) [10] [11] | Cascade dépend du pays | établi (classes), nouveau (valeurs) |
| Glycosides | non trouvé par variété | non trouvé par variété | inconnu | — |
| Esters | isobutyrates ≤ 0,5 % de l'huile [8] | bière à 2 g/L : 2-méthylbutanoate d'éthyle 0,80 µg/L ; 4-méthylpentanoate d'éthyle 0,41 µg/L [12] | non comparable | nouveau |
| Cohumulone, % des α | 20–24 [1] | 29–35 [2] | compte à chaud (amertume), pas en dry hop | établi |
| Profil YCH, houblon broyé, T-90 (0–100) | agrumes 92 ; tropical 78 ; baies 70 ; floral 54 ; noyau 53 ; melon 52 ; herbacé 46 ; boisé 33 ; sucré 21 ; pomme 18 ; herbe 17 ; épicé 9 ; terreux 8 [1] | 85 ; 73 ; 67 ; 54 ; 50 ; 49 ; 50 ; 33 ; 20 ; 17 ; 27 ; 11 ; 12 [2] | **presque identiques** | nouveau |
| Dry hop 4 g/L, 72 h, 18 °C, sur levure (OSU, 12 variétés, panel entraîné) | à l'extrême de l'axe « intensité globale, agrumes, tropical » | au centre, avec Nugget et Chinook, vers floral et herbacé | Citra nettement plus intense | nouveau ; positions lues sur un biplot, pas de moyennes [21] |
| Bière, thiols mesurés | aucune mesure publiée trouvée avec un protocole comparable | 3,86 g/L, 24 h, 13–15 °C : 4MMP 5,8–10,4 ng/L (2014), non détecté (2016) ; 3MH 67–141 ng/L ; 3MHA 2,1–15,3 ng/L [20] | — | nouveau |
| Mots des fabricants | YCH : agrumes, fruits à noyau, tropical, boisé [1] ; Haas : mangue, chair de pamplemousse, zeste de lime [7] ; BarthHaas : pamplemousse, mangue, ananas, groseille à maquereau, mûre, groseille, lilas [8] | YCH : pamplemousse, floral, pin, herbacé, herbe [2] ; Haas : floral, pamplemousse, résine de pin [7] ; Hopsteiner : lime, cassis [10] | recouvrement « agrumes, floral » | établi |

### 1.2 Pourquoi ils diffèrent autant en dry hop

Du plus solide au plus fragile.

1. **Charge par gramme** [F mesuré, calcul H]. À 4 g/L, Citra apporte 4–12 mL d'huile/hL,
   Cascade 2–8 mL/hL [1] [2]. Pour le linalol, l'alcool terpénique qui passe le mieux en bière,
   l'écart par gramme est d'environ ×3 au milieu des plages (§7.4). Le panel OSU le confirme en bière (point 2 de §0) [21].
2. **Nature des thiols** [P mesuré]. Citra combine le plus fort 4MMP des 97 variétés
   (cassis, fruit de la passion) et du 3M4MP (pamplemousse, rhubarbe) [11]. Le 4MMP de Cascade
   reste près du seuil en bière : 5,8–10,4 ng/L pour un seuil de 1,5–7 ng/L [20] [12] [34].
   Le seuil du 4MMP est environ 1 000 fois plus bas que celui du linalol [19] : quelques µg/kg
   d'écart dans le houblon suffisent à basculer vers le « tropical ».
3. **Fond vert de Cascade** [F mesuré, lien sensoriel P]. Farnésène 3–8 %, plus d'humulène, moins
   d'huile utile : à forte dose, l'herbacé/thé monte quand les agrumes plafonnent [22].
4. **Survie** [F, dit]. Yakima Chief range Cascade parmi les houblons pauvres en composés
   solubles qui survivent à la chaleur et à la fermentation [5]. Méthode GC-SCD et GC-QTOF
   décrite, valeurs par variété en graphique seulement.
5. **Géraniol et levure** [P mécanisme, H application]. Cascade donne beaucoup de géraniol en
   bière [12] ; ajouté pendant la fermentation, il peut devenir du citronellol (§6.2). Cela
   oriente Cascade vers « agrumes, floral », sans tropical.

**Ce qui est dit, non mesuré.** « Tropical » sur Cascade (boutiques, Beer Maverick : non) ;
« Citra = thiols libres, Cascade = précurseurs » (diapositives BarthHaas–Nyseos [19]) :
contredit pour les précurseurs (table). « Similaires » dans nos outils : vrai pour les mots et
pour le profil sur houblon broyé ; faux pour la quantité et la chimie qui comptent en dry hop.

---

## 2. Comment experts et science choisissent entre deux houblons

### 2.1 Les facteurs qui décident vraiment

| Facteur | Ce qui est mesuré | Preuve, statut |
|---|---|---|
| **Dose et saturation** | Cascade 0–16 g/L : agrumes plafonnent dès ~8 g/L, herbacé/thé monte jusqu'à 16 g/L [22] ; l'extraction des terpénols en % baisse quand la dose monte [21] ; panel capable de séparer 0, 2, 3,8, 8 et 16 g/L sur l'intensité globale [21] | [P] Cascade seul ; **établi** (`docs/hop-solver.md`) |
| **Moment** | Dry hop plus intense que le whirlpool pour une même dose, et de caractère différent, sur 12 variétés [21] ; transferts par moment en §8.2 | [S] diapos OSU ; [P] Gahr 2019 ; **nouveau** |
| **Température, temps de contact** | Extraction des volatils clés en 24 h (Wolfe et al. 2012, cité comme justification du protocole OSU) [20] [73] ; détails en §7.2 | [P] ; **établi** (τ du modèle), complété |
| **Forme** | Profils YCH de Cascade selon la forme (lots différents) : feuille boisé 81 et herbe 57 ; T-90 boisé 33 et herbe 27 ; cryo boisé 26 et herbe 15, tropical 79 [2] ; cryo ≈ 2 fois l'α et l'huile du T-90 (Citra 21–28 % α, 2–6 mL/100 g) [1] | [F] ; **nouveau** ; confirme le défaut Citra cryo de #131 |
| **Lot et récolte** | §2.5 | [P] [F] |
| **Assemblage, synergie** | §7.3 | surtout inconnu |
| **Levure, biotransformation** | §6.2 et §8.4 | drapeaux |

### 2.2 Ce que disent les producteurs quand ils comparent

- **Yakima Chief** : variétés « similaires » choisies par l'équipe sensorielle sur l'arôme,
  l'usage et la comparaison des huiles. Pour Citra : Admiral, Centennial, Mosaic, Simcoe [1].
  Règles publiées : un houblon riche en « survivables » peut aller tôt (fin d'ébullition,
  whirlpool, dry hop actif) ; un houblon pauvre, tard. Associer un houblon riche en linalol à un
  houblon riche en géraniol (Loral + Talus), plutôt que deux riches en linalol [5]. [F, dit]
- **Hopsteiner** donne des substituts séparés pour la salle de brassage et le dry hop (Cascade :
  Centennial, Lemondrop pour les deux) [10]. [F]
- **BarthHaas** compare par linalol/α pour un ajout tardif et par mL d'huile/hL pour un dry hop
  (E §2). [F, **établi**]

### 2.3 Caractère à l'ébullition et caractère en dry hop d'une même variété

- **Mesuré** : sur 12 variétés à 4 g/L, chaque variété occupe deux positions différentes au
  whirlpool (25 min, 87–95 °C) et en dry hop (72 h, 18 °C) [21]. Exemple : Citra whirlpool vers
  tropical et fruité ; Citra dry hop vers intensité maximale et agrumes. [S, positions lues]
- **Mécanismes** : à chaud, myrcène perdu, 4MMP −91 % en 60 min à 100 °C mais −23 % à 90 °C,
  3MH qui *augmente* [13] ; époxydes d'humulène et de caryophyllène formés (E §2) ; linalol mieux
  conservé que le myrcène [30]. À froid, transfert des alcools, des esters et des thiols libres
  (§8.2). [P]
- **Conséquence** : un outil doit tenir **deux profils par variété**, « à chaud » et « à froid »,
  au lieu d'un seul jeu de descripteurs. [H fondé sur P]

### 2.4 Synergies, levure, biotransformation

Voir §6 et §7.3. En bref : les synergies linalol + géraniol + citronellol et thiols + terpènes
sont démontrées en mélange modèle [67] [24], sans pondération transposable. **établi**
(`docs/index-houblon-recherche.md` §3 pour Takoi 2016).

### 2.5 Variabilité par lot, par récolte, fraîcheur

- Même variété, même dose (Cascade 2015, 3,8 g/L) : intensité globale 6 à 9,5 sur 15 selon le
  lot ; huile 0,5 à 2,6 mL/100 g [21]. [S, données OSU]
- Récolte tardive de Cascade : plus d'huile et de thiols libres, moins de précurseurs, plus
  d'intensité et d'agrumes en dry hop ; conseil : Cascade tardif (matière sèche > 26 %) pour le
  dry hop [20]. [P] **nouveau**
- 4MMP de Simcoe : récolte 2006 = 1/5 de 2005 [12] ; thiols de Cascade « nettement influencés
  par le pays » [11]. [P]
- HSI : seuils et effets en §8.5.

---

## 3. Les données qui portent une intensité, et leur accès

| Donnée | Méthode, échelle | Sur quoi | Couverture | Licence, réutilisation | Statut |
|---|---|---|---|---|---|
| **Yakima Chief, profil sensoriel par variété et par forme** [1] [2] [3] [4] | ASBC Sensory Analysis 16 « Hop Grind » ; ≥ 7 panélistes internes validés par lot ; moyenne glissante sur 5 récoltes ; affichage 0–100 sur 13 catégories (sens exact du 0–100 non précisé : bulletin public en intensité 1–10) | houblon broyé, **pas en bière** | portefeuille YCH ; chaque lot dans l'outil Lot Lookup | CGU : « data compilations » propriété de YCH, aucune licence ouverte [6] | **nouveau** (le dépôt n'avait que le lexique) |
| **YCH, « survivables »** [5] | GC-SCD et GC-QTOF ; poster 2025, guide 2022 | houblon | variétés YCH, en graphique | idem | nouveau |
| **BarthHaas, Hop Aroma Compendium et Hopsessed** [58] [59] [60] | 12 catégories, intensité 1–10 ; frottement de cônes ou de pellets ; infusion froide 2 g/200 mL, 20 °C, 30 min, puis ajout à une bière de base [58] | houblon frotté **et** infusion en bière | volume 2 en 2013 ; nombre de variétés et de dégustateurs non trouvé | vocabulaire « propriété de BarthHaas » [59] ; ouvrage payant ; aucune licence | établi (12 catégories), complété |
| **BarthHaas, pages variétés** [8] | « médiane des 4 dernières années » ; thiols en µg/kg (Citra ≤ 28,7) | houblon | catalogue BarthHaas | aucune licence vue | établi (Ariana), complété |
| **Hopsteiner, classes « thiol impact »** [11] | LC-MS/MS ; 250 échantillons, 97 variétés, 12 pays, récoltes 2019–2023 ; seuil de classe 10 µg/kg | houblon | 97 variétés, tableaux par classe | article de revue, PDF public chez Hopsteiner ; CC BY 4.0 selon l'agent de recherche, **à confirmer** | établi (classes), nouveau (valeurs) |
| **Hopsteiner, fiches** [10] | thiol impact, linalol, farnésène, substituts brasserie/dry hop ; graphique d'arôme (échelle non lue) | houblon | ≈ 100 variétés | © ; aucune licence | établi |
| **Charles Faram, Hop Oracle** [28] | « Flavour intensity » (Cascade 8, Galaxy 8, Idaho 7 9), échelle non indiquée ; « in the beer / in the rub » | les deux | catalogue Faram | © | établi |
| **Schreurs et al. 2024** [55] | 226 mesures chimiques sur 250 bières finies ; panel de 16, 50 attributs, échelle 7 points ; R² moyen 0,21 | **bière finie**, sans recette | 250 bières | données Zenodo 10653704, CC BY 4.0 ; RateBeer restreint | établi (E), complété (licence) |
| **Legisa et Mengoni 2021** [56] | 9 bières mono-houblon, panel entraîné | bière | 9 | CC BY 4.0 sur l'article, CC BY-SA 4.0 en pied de page ; pas de données jointes | établi |
| **Nesvadba et al. 2023** [57] | dry hop 3 et 6 g/L, 26 dégustateurs (1–10) ; Ceres, Pluto, Saturn et mélanges 50/50 | bière | 3 variétés tchèques | CC BY-SA 4.0 | nouveau |
| **Lafontaine et al. 2018, 2019** [20] [22] [23] | panels OSU 0–15 ; 84 lots Cascade et Centennial ; doses ; récoltes | bière | Cascade, Centennial | articles ; 2018 BrewingScience en CC BY 4.0 | établi |
| **Certificat du lot** | selon le labo : α, β, HSI, huile, parfois linalol, géraniol | le lot | le lot | document du fournisseur | **établi** : la meilleure donnée |

Les jeux de données grattés sur les sites des producteurs (par exemple almet/hops-datasets, sans
licence visible, « expérimental, non maintenu ») sont à éviter sans accord [65].

**Conclusion.** Aucune donnée ouverte ne donne une intensité **en bière** par variété. Les
intensités publiques (YCH, BarthHaas, Faram) sont sur houblon broyé ou infusé, propriétaires,
et ne séparent pas Citra de Cascade. Ce qui sépare les deux est **chimique** et en partie
ouvert : huile, linalol, géraniol, thiols libres.

---

## 4. Les outils existants

| Outil | Ce qu'il calcule | Sur quelles données | Limite |
|---|---|---|---|
| **Hop Oils Calculator, Scott Janish** [61] | composition d'huile estimée en bière et radar d'arôme, par variété, grammes et moment (whirlpool, avant fermentation, dry hop ; ébullition exclue) | moyennes Select Botanicals Group, sans année ni méthode ; radars du Compendium | © 2014, aucune validation ni mise à jour trouvée ; **établi** (E) |
| **Yakima Chief, page variété et Lot Lookup** [1] [4] | profil 0–100 par forme ; « similaires » ; valeurs de lot | panel interne, laboratoire YCH | houblon broyé ; propriétaire |
| **Beer Maverick** [66] | plages agrégées, radar 0–5, substituts | plages de fournisseurs | méthode de similarité non publiée ; vérification anti-robot dans le navigateur, non contournée ; licence non trouvée ; **établi** |
| **BeerSmith Hop Control** [62] | filtres α/β/cohumulone et profil, radar, comparaison jusqu'à 6 variétés | « moyennes de l'industrie » | payant ; aucune donnée en bière |
| **HPA Hop Navigator** [63] | descripteurs de 7 houblons dont Galaxy | HPA | qualitatif |
| **Charles Faram Hop Oracle** [28] | intensité et mots, « bière / frotté » | Faram | échelle non indiquée |
| **Brewfather, Brewer's Friend** | IBU et doses ; aucune donnée d'arôme documentée trouvée | — | non vérifié dans le détail |
| **BarthHaas, dosage d'huile** (E §4) | grammes pour viser des mL d'huile/hL | huile totale | règle, pas prédiction ; **établi** |
| **V5.5 de L'Affinée** | plages 0–100 par famille | descripteurs cités, dose, contact, levure ; coefficients « jugement » | **établi** : non validé ; les analyses ne deviennent pas des intensités |

**Ce qui n'existe pas.** Aucun outil trouvé ne compare deux variétés **par la charge de
molécules actives en bière** selon le moment, ni ne distingue profil à chaud et profil à froid,
ni ne porte la variabilité de lot. [H, recherche non exhaustive]

---

## 5. Ce qu'un outil honnête peut calculer aujourd'hui

| Calcul | Formule | Preuve | Sortie |
|---|---|---|---|
| **Charge d'huile par ajout** | huile (mL/100 g) × dose (g/L) = mL/hL (erratum du 19.10 : le « ÷ 10 » de la première version était faux ; exemple : 2 mL/100 g × 4 g/L = 8 mL/hL, cohérent avec §7.4) | [F] plages, ou COA du lot | chiffre en plage |
| **Charge d'un composé** | charge d'huile × % du composé ; mL → mg par la densité (linalol ≈ 0,86 g/mL) | [F] ; conversion [H] (le % d'huile est une aire GC, pas un volume exact) | plage |
| **Charge de thiols libres** | µg/kg × g/L = ng/L | [P] Hopsteiner, Reglitz | plage ou classe |
| **Part transférée par moment** | charge × taux de transfert (§8.2) | [P] | plage |
| **Rapport au seuil (OAV)** | concentration ÷ seuil, seuil en plage et dans sa matrice | [P] [S] | plage ; jamais une intensité |
| **Survie par moment** | table qualitative par famille : hydrocarbures, alcools, esters, thiols, oxydés (E §5.3) | [P] | absent / partiel / extrait |
| **Saturation de dose** | courbe Cascade 0–16 g/L par attribut [22] | [P] Cascade seul | sens et ordre de grandeur ; hors Cascade : « forme générique » |
| **Profil « à froid » distinct du profil « à chaud »** | deux jeux de descripteurs et de survie par variété | [S] [P] | ordinal |

**Contrôle de cohérence** [H sur données P]. Cascade US (4MMP 2,4–3,8 µg/kg [11]) à 3,86 g/L,
avec un transfert de 70 % [11] : 6,5–10,3 ng/L calculés. Lafontaine 2019 mesure 5,8–10,4 ng/L
(2014) et « non détecté » (2016) [20]. Le calcul tombe dans la plage mesurée ; l'année 2016
rappelle que le lot peut tout changer.

---

## 6. Ce qu'un outil de dry hop, de biotransformation et de levure doit calculer

### 6.1 Les réglages du dry hop et leurs effets publiés

| Réglage | Effet mesuré | Preuve, statut |
|---|---|---|
| **Dose, saturation** | Cascade, cônes broyés, 24 h, 13–15 °C, 0 / 2 / 3,86 / 8 / 16 g/L : intensité globale 3,0 / 6,3 / 8,1 / 10,4 / 12,3 sur 15 (exposant de Stevens 0,35) ; agrumes plafonnent à 8 g/L ; herbacé/thé monte jusqu'au bout ; les auteurs retiennent 4–8 g/L [22]. Part extraite qui baisse avec la dose : linalol ≈ 23 → 7 %, géraniol ≈ 13 → 3 % [22]. 10 contre 15 g/L : triangle non significatif (13/28, p = 0,10) [77] | [P] ; doses **établies** (`docs/hop-solver.md`) ; la plage 4–8 g/L, mise en doute par l'inventaire, est **confirmée** dans l'article |
| **Moment** | ajout tôt dans la fermentation : moins de géraniol ; jour 6 > jour 3 pour géraniol et esters [81, relayé] ; fermentation active : plus de biotransformation, plus de pertes par le CO₂ (dit, non chiffré) [82] ; le CO₂ et la levure emportent le myrcène [33] | [P] relayé ; [F] dit |
| **Nombre d'ajouts** | Centennial 386, 772, 1 544 g/hL en un ou deux ajouts : deux ajouts donnent plus d'amertume, d'humulinones, de polyphénols et six attributs d'arôme plus forts ; à l'échelle industrielle (733 g/hL), chimie presque identique [76, relayé] | [P] relayé ; **nouveau** |
| **Température** | 0, 13 et 20 °C : plus chaud, transfert plus rapide ; l'agitation accélère avant 6 h [71] ; 4 contre 20 °C : linalol identique au jour 4, hydrocarbures plus extraits à chaud [69] ; 4 contre 19 °C pendant 14 j : pH et alcool montent à 19 °C (hop creep) [79, relayé] | [S] [P] relayé ; **nouveau** |
| **Temps de contact, agitation** | §7.2 : l'essentiel en 24 h | [S] [P] |
| **Forme** | cryo ≈ 40–50 % de la masse de T-90 pour la même huile ; substitution donnée par YCH : 40 g de cryo + 25 g de T-90 pour 100 g de T-90 [74] ; profil YCH plus fruité et moins boisé/herbacé en cryo (§2.1) [2] ; extrait fluide : aucune perte de bière, humulinones 0,77 contre 3,5 mg/L avec du T-90 [70] ; extrait CO₂ : pas d'humulinones [69] ; aucune comparaison trouvée pour les autres extraits | [F] [S] ; **nouveau** |
| **Pertes** | absorption 10,3–14,1 L/kg (essai à l'eau ; Citra T-90 14,1) [70] ; houblon épuisé : 33–51 % de l'huile et 52–77 % des α restent dans les cônes [75, relayé] ; oxygène apporté par ajout : aucun chiffre trouvé ; « hop burn » : aucune étude à comité trouvée | [S] [F] ; **nouveau** (absence) |
| **Amertume ajoutée** | humulinones extraites 113 / 76 / 74 / 47 % de 2 à 16 g/L ; BU 17,0 → 26,0 [22] ; Centennial 3 j : 98 / 91 / 87–88 % [69] | [P] ; **établi** (`docs/water-dryhop-2026-09-09.md`), complété |
| **Hop creep** | 10 g/L, 7 j, levure ale : +0,92 % vol. (T-90), +1,05 (cryo), +0,57 (cônes) ; 20 g/L : +0,90, effet de dose non significatif (p = 0,59) ; Cascade et Citra parmi les plus forts, variétés d'Europe centrale plus faibles [68] ; Cascade 10 g/L à 20 °C : +1,3 % vol. [84, relayé] ; +0,39 % vol. en 2 j (relayé dans 35) ; extrait apparent −0,8 à −1,2 % m/m ; aucun hop creep sans levure vivante ; fin en 8–10 j au chaud contre 14–15 j au froid ; 0,1 MPa de pression : +6 j [85, relayé] ; diacétyle 25 → 200 ppb (relayé) [87] ; β-amylase de l'orge : effet égal à celui de cinq cultivars [83] ; durée et température augmentent l'activité enzymatique, 10 % d'éthanol l'inhibe [80, relayé] ; Cascade > Mosaic [86, relayé] ; la souche de levure compte (30 souches comparées) [88, relayé] ; Galaxy, Idaho 7 : non trouvé | [P] ; mécanisme **établi** (`docs/index-houblon-recherche.md` §5), ordres de grandeur **nouveaux** |

### 6.2 La biotransformation

| Effet | Mesuré, ordre de grandeur | Qualitatif seulement | Preuve, statut |
|---|---|---|---|
| **Géraniol → β-citronellol** (réductase OYE2) ; géraniol → acétate de géranyle | géraniol divisé surtout dans les 3 premiers jours ; citronellol presque absent du moût puis croissant [93, relayé] ; souche de labo surexprimant OYE2 : 87 % de réduction contre 50 % pour le témoin [41] ; 12 souches, même moût : géraniol et nérol varient avec la souche (plus hauts avec US-05 et WLP001), linalol identique (p = 0,82) [44] | aucun taux de conversion en bière publié [41] | [P] ; **établi** (E §5.8), complété |
| **Linalol** | stable entre souches [44] ; racémisation R → S au vieillissement chaud [30] | — | [P] nouveau |
| **Glycosides** | aglycones libérables 0,6–28,6 mg/kg contre terpénols libres 7,8–109,2 mg/kg (5 cultivars) [53, relayé] ; avec β-glucosidase ajoutée, linalol +16,5 µg/L au plus [52, relayé] ; le cultivar est le premier facteur de variation [54] | libération par la levure de brassage « moins claire » [41] ; Brettanomyces jusqu'à 10 fois plus actif [41] | [P] relayé ; nouveau |
| **Thiols libérés des précurseurs (β-lyase)** | précurseurs ≈ 15 à 2 000 fois les thiols libres selon la forme et la méthode (Citra : 23 mg/kg de G-3SH pour 12 µg/kg de 3SH libre) [16] [17] [48] ; conversion en moût 0,1–0,5 % [41] ; γ-GluCys-3SHol : 0,15–0,35 % selon la souche (BRAS-45, SafLager E-30, SafBrew LA-01), Cys-3SHol 0,02–0,03 %, G-3SHol 0,08–0,21 % [42] ; « 0,3 % en brasserie » [19] | rendement sur houblon réel non mesuré ; azote et température modulent (moins d'azote, 12 °C : plus efficace) [43, relayé] | [P] ; **établi** (`docs/index-houblon-recherche.md` §2), complété |
| **IRC7 et levures « thiolées »** | IRC7 complet (souche F15) : 4MMP ≈ 1 000 ng/L contre non détecté avec l'allèle tronqué de 38 pb [45, relayé] ; délétion chez ≈ 88 % des souches [41, relayé] ; souches modifiées : 3MH jusqu'à ×73, 3MHA jusqu'à ×8 face à la parente [46] | Omega Cosmic Punch, Lunar Crush, Star Party, Helio Gazer : 3SH « ~60 / ~600 / 6 000+ ppt » sans source [47] ; « ×10 avec Cascade à l'empâtage » relayé, absent de la page lue | [P] et [F] ; **établi** (IRC7), complété |
| **3MH → 3MHA (acétylation)** | 3MHA absent du moût, synthétisé pendant la fermentation ; seuil 5 ng/L contre 55 pour le 3MH [13] ; bière Cascade 3MHA 2,1–15,3 ng/L [20] | taux par souche non publié en bière | [P] nouveau |
| **Phantasm** | poudre de peaux de sauvignon blanc (précurseurs) ; 1–2 lb/baril au whirlpool selon le vendeur | aucun résultat publié trouvé | [S] relayé |

### 6.3 La levure

- **Arôme propre** : esters (acétate d'isoamyle, hexanoate d'éthyle) et 4-vinylguaïacol (POF)
  varient fortement entre 12 souches sur un même moût houblonné ; 4-vinylguaïacol à l'état de
  traces avec US-05 [44]. [P, valeurs relatives]
- **Effet sur l'expression du houblon** : Samia : Diamond, plus de thiols, fruité perçu le plus
  faible [**établi**, dépôt] ; les lagers produiraient plus de terpénoïdes que les ales (thèse
  Otago, relayé) [S].
- **Fiches publiques** : Fermentis donne atténuation, sédimentation, esters « low », alcools
  supérieurs, température, dose, sans POF, STA1 ni β-lyase [50] ; Lallemand donne POF,
  diastaticus, atténuation, floculation, et la biotransformation en qualitatif [49] [50]. Les
  quatre souches du brasseur sont en §8.4.

### 6.4 Les outils existants

| Outil | Ce qu'il calcule | Données | Statut |
|---|---|---|---|
| Hop Oils Calculator, Janish [61] | huile estimée en bière par ajout | moyennes variétales ; ni absorption, ni hop creep | **établi** |
| Dosage d'huile BarthHaas (E §4) | grammes pour viser des mL d'huile/hL | huile totale | **établi** |
| Fiche Cryo de YCH [74] | équivalence cryo / T-90 | fabricant | nouveau |
| Calculateur d'efficacité YCH | non ouvert | — | relayé |
| Guide « Hop Oil Type DRY » de Hopsteiner | doses en g/hL par point d'ajout, « à titre indicatif » | fabricant | relayé |
| Calculateur de levée de Lallemand | dose de levure ; aucun volet biotransformation | fabricant | nouveau |
| Simulation d'amertume à cru de L'Affinée | humulinones, perte d'iso-α (Maye 2016) | articles | **établi** |
| Test de banc du hop creep (OSU) [91] | fermentation de laboratoire pour estimer la dégradation des dextrines par un lot de houblon | méthode publiée | relayé ; utile comme **mesure** que le brasseur peut faire |
| Calculateur de hop creep, de thiols ou de biotransformation | **aucun trouvé**, chez les fournisseurs comme dans la communauté | — | nouveau (absence) |

### 6.5 Proposition : entrées et sorties d'un outil honnête

**Entrées.** Pour chaque ajout : variété, lot (COA si connu), forme, dose (g/L), moment (chaud,
whirlpool et sa température, fermentation active avec densité, après fermentation), durée,
température, agitation. Pour la bière : levure, volume, densités, style. Pour le houblon : HSI et
date. Pour l'emballage : date et température de garde.

| Sortie | Forme | Preuve |
|---|---|---|
| Charge d'huile, de linalol, de géraniol, de 4MMP par ajout et cumulée | chiffre en plage (sources ou COA) | [F] [P] |
| Part retrouvée en bière par famille | plage, selon le moment (§8.2) | [P] |
| Rapport au seuil (linalol, géraniol, 4MMP, 3MH) | plage ; « au-dessus du seuil quelle que soit la source » ou « selon la source » | [P] [S] |
| Saturation de la dose | « au-delà de ~8 g/L, plus d'herbacé que d'agrumes » (Cascade) ; ailleurs « forme générique, non mesurée » | [P] |
| Temps de contact | **sens** : « l'essentiel est extrait en 24 h ; au-delà, pas de gain d'arôme mesuré » ; courbe 1 − e^(−t/τ), τ = 2–12 h | [S] [P] |
| Hop creep | **drapeau** avec ses facteurs (levure vivante, température, durée, forme) et les ordres de grandeur publiés : +0,4 % vol. en 2 j, +0,9 % vol. en 7 j à 10 g/L, diacétyle possible ; pas de hop creep sans levure vivante ; jamais un chiffre de points de densité pour **ce** brassin | [P] |
| Amertume ajoutée (humulinones) | brique existante (Maye 2016) | [P] **établi** |
| Biotransformation | **drapeaux** : « géraniol élevé + fermentation active : glissement possible vers agrumes » ; « précurseurs élevés + levure IRC7 : potentiel tropical, rendement inconnu » | [P] mécanisme, rendement [H] |
| Levure | profil propre (esters, POF) en mots ; aucune multiplication de l'arôme du houblon par un coefficient de souche | [F] |
| Vieillissement | perte attendue par famille et par semaine selon la température (§8.5) | [P] |
| HSI | classe de fraîcheur et perte d'α (BarthHaas) ; aucune perte d'arôme chiffrée | [F] |
| Intensité perçue par famille | **seulement le sens** et la comparaison entre variétés à dose égale quand un panel existe | [S] [P] |

### 6.6 Les cinq calculs les plus utiles pour cet outil

1. **Charge par ajout et cumulée** : mL d'huile/hL, µg/L de linalol et de géraniol, ng/L de
   4MMP, depuis le COA ou les plages des fiches. [F] [P]
2. **Part retrouvée en bière selon le moment et la dose** : table de transfert par famille
   (§8.2), avec sa base de calcul et la baisse du rendement quand la dose monte. [P]
3. **Position face à la saturation** : dose totale face à la zone 4–8 g/L, avec le glissement
   « agrumes qui plafonnent, herbacé qui monte » (Cascade mesuré, autres variétés génériques). [P]
4. **Rapport au seuil en plage** pour linalol, géraniol, 4MMP et 3MH, dans la matrice et au degré
   d'alcool de la bière. [P] [S]
5. **Risques datés** : hop creep (levure vivante, température, durée), perte d'arôme par semaine
   selon la température de garde, fraîcheur du houblon par le HSI. [P] [F]

---

## 7. Ce qui est vraiment prévisible

### 7.1 Galaxy et Idaho 7, comme Citra et Cascade

| Grandeur | Galaxy | Idaho 7 | Citra (rappel) |
|---|---|---|---|
| Huile, mL/100 g | 2,6–3,3 (HPA) [26] ; 1,8–5 (Beer Maverick, dépôt) | 1,0–3,0 (YCH T-90) [3] ; 1,0–1,6 (Haas 2020) [27] ; 2,5 (COA 2025, dépôt) | 1,0–3,0 |
| Myrcène | 32–56 (HPA) | 40–55 (YCH) ; 45–55 (Haas) ; 45,4 (COA) | 50–70 |
| Humulène | **0,8–2,2** (HPA) | 10–16 (YCH) ; 10–20 (Haas) | 7–12,5 |
| Caryophyllène | 7,0–14,7 | 5–10 | 4–8 |
| Farnésène | 2,8–5,1 | 0,1–1 | 0,1–1 |
| Sélinène | 5,9–12,7 (HPA) | — | — |
| Linalol | 0,5–1,0 (HPA) | 0,2–0,6 (YCH) ; 0,5–1,0 (Haas) ; 0,4 (COA) | 0,5–1 |
| Géraniol | non publié | **0,5–1** (YCH) ; 0,6 (COA) | 0,2–0,8 |
| Thiols libres [11] | high : 4MMP > 10 µg/kg, 3MH non détecté, 3M4MP > 10 | high : 4MMP présent, < 10 µg/kg d'après la mise en page du tableau 6 (à confirmer) ; 3MH + 3M4MP > 10 | high : 4MMP > 10 (max 38) |
| Mots du producteur | « fruit de la passion, pêche juteuse, agrumes acidulés » (HPA) [26] | « fruits tropicaux, chewing-gum, ananas », « souverain des survivables » (YCH) [3] ; goyave, pin, résine, abricot (Haas) [27] | — |
| Profil YCH T-90 (0–100) | — (non distribué par YCH) | agrumes 97 ; tropical 93 ; baies 90 ; melon 68 ; noyau 65 ; floral 54 ; sucré 39 ; herbacé 26 ; boisé 22 [3] | 92 ; 78 ; 70 ; 52 ; 53 ; 54 ; 21 ; 46 ; 33 |
| Dry hop, panel | OSU 4 g/L : près de « catty/sweaty », séparé de Citra [21] ; Galaxy contre Mosaic, triangle non significatif (17/38, il en fallait 19) [29] | aucun panel entraîné trouvé ; 20 dégustateurs, sans statistique [29] | §1 |
| HSI | 0,42 → α −16 % ; 0,63 → −47 % ; huile 2,3 → 1,15 mL/100 g [25] | fiche Haas 2020 : HSI 0,263 [27] | 0,43 → −15 % ; 0,61 → −38 % ; huile 2,0 → 1,2 [25] |

**Lecture.** Galaxy : beaucoup d'huile, presque pas d'humulène, du 4MMP et du 3M4MP ; risque
« catty » noté par le panel OSU. Idaho 7 : profil YCH le plus fruité des trois, et le géraniol le
plus haut, candidat au glissement géraniol → citronellol en dry hop actif. Aucune des deux n'a de
mesure de thiols en bière ni de panel entraîné en dry hop. **nouveau**

### 7.2 Le temps de contact

**L'essentiel est extrait en 24 h, souvent plus tôt.**

- Agité, à 20 °C : les hydrocarbures (myrcène, humulène) culminent entre 3 et 6 h puis
  baissent ; les alcools terpéniques (linalol, géraniol) montent pendant les 24 h [73]. [S, thèse
  OSU lue]
- Pilote de 4 hL, Cascade, 386 g/hL : linalol extrait à 89 % en 6 h avec une pompe, contre 43 %
  sans agitation. Sans agitation, la concentration de linalol et de myrcène au jour 1 égale celle
  des jours 4 et 7. Note du panel : 5,5 à 6 h contre 5,7 à 12 j, non significatif [73]. [S]
- Les protocoles OSU s'arrêtent à 24 h pour cette raison [20]. Le 4MMP passe surtout dans les
  deux premiers jours (Eureka!, −1 °C, 1 à 8 j) [92]. [P]
- Le modèle V5.5 (τ = 2–12 h, soit 95 % atteints en 6 à 36 h) est cohérent avec ces mesures.
  **établi**, désormais sourcé.

**Ce que changent 5 ou 7 jours face à 3.**

| Effet | Ce qui est publié | Forme dans l'outil |
|---|---|---|
| Arôme | aucun gain mesuré au-delà de 1 j en statique [73] ; hydrocarbures qui redescendent après leur pic, en agité [73] | **sens** : « pas plus d'arôme » |
| Herbacé, végétal | aucune donnée en fonction du temps trouvée ; l'herbacé est lié à la **dose** [22] | **inconnu** (le lien au temps est une croyance) |
| Polyphénols | 11,16 mg/L à 3 h, 10,29 mg/L à 96 h [78] ; plus élevés avec agitation et pellets [73] | **sens** : liés à l'agitation et à la forme, pas à la durée |
| « Hop burn » | aucune étude à comité | **inconnu** |
| Hop creep | exige une levure vivante ; +0,39 % vol. en 2 j [35] ; +0,9 % vol. en 7 j à 10 g/L [68] ; jusqu'à +1,3 % vol. (Cascade, 10 g/L, 20 °C, durée non lue) [84] ; plus rapide au chaud [85] | **drapeau**, avec ordres de grandeur |
| Oxydation | chaque ouverture et chaque ajout exposent la bière ; aucun chiffre par ajout trouvé | **drapeau** |

### 7.3 Dry hops successifs ou combinés

- **Deux ajouts contre un** : plus d'intensité sur six attributs, mais aussi plus d'amertume,
  d'humulinones et de polyphénols, en pilote ; écart presque nul à l'échelle industrielle [76].
  [P relayé]
- **Ordre des ajouts** (Citra puis Galaxy, ou l'inverse) : **aucune étude trouvée**.
- **Moment dans la fermentation** : jour 6 > jour 3 pour géraniol et esters [81] ; YCH affirme
  qu'un whirlpool d'Idaho 7 puis un dry hop actif de Sabro et Simcoe « charge le moût » en
  substrats de biotransformation, sans données [5]. [P relayé ; F dit]
- **Assemblages** : 15 mélanges Cascade, Centennial, Chinook à 3,8 g/L, 24 h, 18 °C (OSU) :
  résultats non extraits [64] ; 50/50 de variétés tchèques : Ceres + Pluto préféré à 3 g/L [57] ;
  YCH conseille d'associer un houblon riche en linalol à un houblon riche en géraniol [5].
- **Synergies** : linalol + géraniol + citronellol, effets additifs ou synergiques en mélange
  modèle [67] ; les thiols ne renforcent pas les hydrocarbures ; l'acide géranique (Sorachi Ace)
  renforce les terpènes ; une synergie thiols × alcools terpéniques est supposée, sans données [72]
  [90]. **établi** (Takoi 2016), complété.
- **Masquage** : aucune étude trouvée.

**Ce qui reste inconnu.** Si le second ajout s'extrait dans une bière déjà « saturée » ; si le
« catty » de Galaxy masque le fruité de Citra ; si l'ordre compte. Un outil honnête additionne les
**charges** de chaque ajout, montre la dose **totale** face à la zone de saturation (4–8 g/L,
Cascade), et marque la perception de l'assemblage « non modélisée ». [H fondé sur P]

### 7.4 Le « pouvoir aromatique » d'un ajout : une estimation honnête

**Chaîne proposée.** Charge introduite → part transférée selon moment, durée et forme →
rapport au seuil dans la matrice → repère du style. Les deux premiers maillons sont [F] et [P].
Le troisième est [P] avec des seuils qui divergent d'un facteur 10 à 80. Le quatrième n'a aucune
donnée pour la stout (§8.3).

**Exemple : 4 g/L, pellets T-90, dry hop après fermentation** [H, calcul sur les plages citées].

| | Citra | Galaxy | Idaho 7 | Cascade |
|---|---|---|---|---|
| Huile introduite, mL/hL | 4–12 | 10,4–13,2 | 4–12 | 2–8 |
| Linalol introduit, µg/L | 170–1 030 | 450–1 140 | 70–620 | 17–410 |
| Linalol en bière, transfert 44–82 % [30] [31] | 75–845 | 200–935 | 30–510 | 8–340 |
| Linalol en bière, transfert ≈ 7–23 % [22] | 12–240 | 30–260 | 5–140 | 1–95 |
| Géraniol introduit, µg/L | 70–850 | non publié | 180–1 070 | 18–360 |
| 4MMP introduit, ng/L | > 40 ; jusqu'à 152 (38 µg/kg) | > 40 | < 40 | 9,6–15 |
| 4MMP en bière, transfert ≈ 70 % [11] | > 28 ; jusqu'à 106 | > 28 | < 28 | 6,7–10,6 |
| 4MMP ÷ seuil (1,5–7 ng/L) | > 4 ; jusqu'à 70 | > 4 | < 19 | 1–7 |

Conversion : 0,01 mL/hL ≈ 86 µg/L de linalol (densité 0,86) et ≈ 89 µg/L de géraniol (0,89) ;
le pourcentage d'huile est une aire GC, d'où une erreur supplémentaire non chiffrée. Les deux
lignes de linalol montrent que la base du transfert pèse autant que la variété.

**Vérification.** Cascade à 2 g/L, ajouté après refroidissement du moût : la chaîne donne 1–170
µg/L de linalol ; Kishimoto mesure 56,9 µg/L [12]. Cascade à 3,86 g/L : 6,5–10,3 ng/L de 4MMP calculés, 5,8–10,4
mesurés [20]. La chaîne encadre les mesures, mais ses plages restent larges (×10 à ×40).

**Ce que l'outil peut dire à partir de là.**
- [P/F] « À dose égale, Citra apporte environ 3 à 15 fois plus de 4MMP libre que Cascade US :
  c'est l'écart mesurable du côté tropical et cassis. »
- [P/F] « Avec les seuils bas (1–8 µg/L), le linalol de Citra et de Galaxy dépasse le seuil
  dans toutes les combinaisons. Avec le seuil de détection de groupe en pale ale (83 µg/L), et
  pour Idaho 7 ou Cascade, cela dépend du lot et de la base de transfert. »
- [H] « Intensité perçue » : seulement le sens, et seulement là où un panel existe (Citra plus
  intense que Cascade à 4 g/L [21]).

**Comparaison avec le modèle V5.5.** Une hyperbole ajustée sur les moyennes du tableau 3 de
Lafontaine 2018 (écart au témoin) donne une demi-dose ≈ 5,6 g/L pour l'intensité globale
(3,0 ; 6,3 ; 8,1 ; 10,4 ; 12,3 sur 15) et ≈ 4,5 g/L pour les agrumes, qui plafonnent dès 8 g/L
[H calcul sur 22]. Les auteurs donnent un exposant de Stevens de 0,35 pour l'intensité globale
[22]. La demi-dose de 2–4 g/L du modèle V5.5 sature donc **plus tôt** que les données Cascade.
L'herbacé/thé, lui, ne sature pas sur 0–16 g/L : une seule courbe par houblon est fausse ; il
faut une courbe par attribut. **contredit** (paramètre « jugement » du modèle).

**Intervalles de confiance.** Les plages ci-dessus sont des **plages de sources**, pas des
intervalles de confiance. Le seul intervalle de prédiction défendable reste celui de
l'étalonnage Cascade 2015 (résidu −0,95 à +1,32 sur 15), dans son protocole [établi].

### 7.5 Faisable ou pas faisable

| Question du brasseur | Ce que l'outil peut dire aujourd'hui | Forme |
|---|---|---|
| « Que change un dry hop de Citra ? » | charge d'huile, de linalol, de géraniol et de 4MMP ; part retrouvée ; rapport au seuil | **chiffre avec plage** [F/P] |
| « Et Galaxy ? Idaho 7 ? » | idem ; thiols en classes seulement ; aucun panel entraîné | **chiffre avec plage** (huile, linalol) ; **drapeau** (thiols) |
| « Citra est-il plus fort que Cascade ? » | oui à dose égale (panel OSU 4 g/L) ; écart chimique chiffré | **sens** [S] + **chiffre** [P] |
| « Citra 3 j puis Galaxy 7 j ? » | charges cumulées ; extraction surtout dans les premières 24 h ; risques qui montent avec la durée | **chiffre avec plage** (charge) ; **sens** (durée) ; **inconnu** (ordre, synergie) |
| « 3 j Citra puis 5 j Idaho 7 ? » | idem ; Idaho 7 riche en géraniol : glissement vers citronellol si la levure est active | **drapeau** |
| « 3 j, 5 j ou 7 j ? » | 3 j suffisent pour extraire (l'essentiel en 24 h) ; 5–7 j n'ajoutent pas d'arôme mesuré, mais plus de hop creep si la levure est vivante et la bière tiède | **sens** + **drapeau** |
| « Pouvoir aromatique sur une 16D » | charge et rapport au seuil calculables ; perception en stout non documentée ; le style attend un arôme de houblon faible et facultatif | **chiffre** (charge) ; **inconnu** (perception) ; **drapeau** (hors style) |
| « Avec un intervalle de confiance » | plages de sources, oui ; intervalle de confiance statistique, non (aucune validation hors Cascade 2015) | **plage**, jamais « IC 95 % » |
| « Quelle synergie entre deux houblons ? » | mécanismes cités ; aucune pondération | **inconnu** |
| « Ma levure va-t-elle libérer des thiols ? » | IRC7 et β-lyase quand la fiche les donne ; rendement 0,01–0,35 % sur précurseur synthétique | **drapeau** + ordre de grandeur |
| « Risque de hop creep ? » | facteurs connus | **drapeau** |
| « Combien de semaines tient l'arôme ? » | pertes par famille selon la température (§8.5) | **plage** [P] |

---

## 8. Les briques d'un pouvoir aromatique honnête

### 8.1 Seuils de perception dans la bière

| Composé | Seuils publiés | Matrice, type | Source |
|---|---|---|---|
| Linalol | 1,0 et 1,7 µg/L (deux valeurs, renvois non lus) | seuil de différence, bière (Kishimoto 2006, repris en 2008) | [12] |
| | 8 µg/L | non précisée | [35] |
| | 83 µg/L à 4,9 % vol. ; 205 µg/L à 9,3 % | détection de groupe (ASTM E679, 38 juges), pale ale non houblonnée | [34] |
| Géraniol | 4,0 µg/L | différence, bière | [12] |
| | 4–5 et 40 µg/L | non précisée | [35] |
| | 141 µg/L à 4,9 % ; 305 µg/L à 9,3 % | détection de groupe, pale ale | [34] |
| β-citronellol | 8 et 40 µg/L | non précisée | [35] |
| | 53 µg/L à 4,9 % ; 31 µg/L à 9,3 % (non significatif) | détection de groupe | [34] |
| Myrcène | 9,5 µg/L | différence, bière | [12] |
| | 9,5 ; 30–200 ; 350 µg/L | non précisée | [35] |
| | 195 µg/L à 4,9 % ; 74 µg/L à 9,3 % | détection de groupe | [34] |
| α-humulène | 120 et 450 µg/L | non précisée | [35] |
| | 310 et 323 µg/L | détection de groupe | [34] |
| β-caryophyllène | 230 µg/L ; 770 et 660 µg/L | non précisée ; détection de groupe | [35] [34] |
| Époxydes d'humulène, humulénols, oxyde de caryophyllène | non trouvés | — | — |
| 4MMP | 1,5 ng/L | différence, bière | [12] |
| | ≈ 2 ng/L | bière | [11] |
| | 5 ng/L à 4,9 % ; 7 ng/L à 9,3 % | détection de groupe, pale ale | [34] |
| 3MH | 55 ng/L | différence, bière | [13] [11] |
| 3MHA | 5,0 ng/L ; 4 ng/L | différence, bière ; non précisée | [13] ; [35] |
| 3M4MP | 70 ng/L | bière | [11] |
| 2-méthylbutyl isobutyrate | 57 µg/L (solution modèle) ; 78 µg/L (bière) | Takoi 2009 | **établi** (`docs/index-houblon-lactones-esters.md`) ; [35] [36] |
| Isobutyrate d'éthyle ; isovalérate d'éthyle ; 2-méthylbutanoate d'éthyle | 6,3 ; 2,0 ; 1,1 µg/L | non précisée | [35] |

**Matrice.** De 5 à 10 % vol., le seuil du linalol est multiplié par 2,5 et celui du géraniol
par 2,2 ; 7 composés sur 10 ne bougent pas [34]. Entre lager à 4,6 % et bière brune à 6,4 %, seul
le caryophyllène change (2,3 contre 5,3 mg/L) dans un autre essai de la même équipe, dont les
valeurs en mg/L ne concordent pas avec le poster de 2016 [34]. **Aucun seuil mesuré dans une
stout n'a été trouvé.** **nouveau**

### 8.2 Taux de transfert du houblon vers la bière

| Composé | Ajout tardif (ébullition, whirlpool) | Dry hop | Sources |
|---|---|---|---|
| Linalol | 60–63 % | 80–82 % (Huell Melon) ; 44–80 % (5 variétés tchèques, 30 j à froid) ; ≈ 100 % (base huile) ; **≈ 23 % à 2 g/L, ≈ 7 % à 16 g/L** (Cascade, 24 h, base : huile hydrodistillée) | [30] [31] [32] [22] |
| Géraniol | −90 % entre moût et bière | 22–120 % ; 36–62 % après correction de l'acétate de géranyle ; ≈ 13 % à 2 g/L, ≈ 3 % à 16 g/L (Cascade, 24 h) | [30] [31] [32] [22] |
| Myrcène, hydrocarbures | < 1 % | ≤ 2 % ; 0,6–3,4 % ; ≈ 3 % ; < 1 % (Cascade, 24 h) | [30] [31] [32] [22] |
| Esters | 19–40 % (5 % pour le 2-méthylbutyl propanoate) | 45–83 % ; 16–57 % (2-méthylbutyl 2-méthylpropanoate) ; 0–60 % (géranate de méthyle) | [30] [31] |
| Alcools sesquiterpéniques | 7–18 % | 10–52 % | [30] |
| Époxyde d'humulène I | — | 25–60 % | [31] |
| 4MMP | −91 % en 60 min à 100 °C ; −23 % à 90 °C | ≈ 70 % (statique) | [13] ; [11] |
| 3MH | augmente à l'ébullition | transfert de 70 % *supposé* par Hopsteiner | [13] ; [11] |
| Polyphénols ; α-acides | — | 50–60 % ; 4–5 % | [32] |

**Lecture.** Les taux de dry hop vont de 7 à 100 % pour le linalol selon la base de calcul
(huile hydrodistillée ou teneur analysée du houblon), la dose et la durée. Chez Lafontaine 2018,
la part extraite **baisse quand la dose monte** : c'est le mécanisme de la saturation [22]. Un
outil doit donc porter le transfert en plage, avec sa base, et le faire dépendre de la dose.
**nouveau**

**Pertes pendant la fermentation active.** Le CO₂ emporte le myrcène, plus vite à température
plus haute [33] ; une levure à 100 millions de cellules/mL retire 98–99 % du myrcène d'une bière
en bouteille, sans toucher au linalol [33]. **Aucun pourcentage de perte par le CO₂ n'a été
trouvé.** **nouveau** (mécanisme **établi** dans `docs/research/yeast-hop-practical-evidence.md`
§3).

### 8.3 Matrice d'une stout (16D, Foreign Extra Stout)

- **BJCP 2021, 16D** [39] : OG 1,056–1,075 ; FG 1,010–1,018 ; 6,3–8 % vol. ; 30–40 SRM ; 50–70
  IBU. Arôme : torréfié moyen à élevé ; houblon « Low earthy, herbal, or floral hop aroma
  optional ». Amertume moyenne à élevée. **établi** (E §3)
- **Masquage par les malts torréfiés, le sucre résiduel, le corps** : aucune étude trouvée en
  bière. **nouveau** (absence)
- **Alcool** : de 5 à 10 % vol., seuils du linalol ×2,5 et du géraniol ×2,2 [34] ; une 16D à
  6,3–8 % est dans cette plage. [S]
- **Liaison aux mélanoïdines** : dans le café, les mélanoïdines retiennent des thiols
  (2-furfurylthiol, 3-méthyl-2-butène-1-thiol), pas les aldéhydes [40, relayé]. Transposition à la
  stout : non démontrée [H].
- **Conséquence.** Le moteur peut calculer la charge d'un ajout dans une 16D. Il ne peut pas dire
  si elle sera perçue. Il doit afficher : « style : arôme de houblon faible et facultatif ;
  perception en bière noire non documentée ; pars de ta dégustation ».

### 8.4 Les levures du brasseur

| Souche | β-lyase, IRC7 | β-glucosidase | POF | Esters | Diastaticus | Atténuation, T° | Sources |
|---|---|---|---|---|---|---|---|
| **SafAle US-05** | non publié | non publié | absent de la fiche ; « POF− » chez des tiers | « low » | absent de la fiche ; négatif chez des tiers | 78–82 % ; 18–26 °C | [50] [44] |
| **LalBrew Verdant IPA** | qualitative, « high » ou « medium » selon la lecture de la figure Lallemand | « medium » (lecture inférée) | non trouvé | abricot, tropical, agrumes (fiche) | non détecté (copies de fiche) | 72–82 % (communiqué, relayé) ou 75–82 % (catalogue du dépôt) ; 18–23 °C ou 18–25 °C | [49] [50] ; dépôt |
| **LalBrew Pomona** | non publié | non publié | négatif (fiche) | pêche, agrumes, tropical | négatif (fiche) | 75–84 % ; 18–22 °C | [50] [51] |
| **LalBrew Diamond** | non publié ; Samia : plus de thiols mesurés | non publié | négatif (fiche) | neutre | négatif (fiche) | 77–83 % ; 10–15 °C | [50] ; dépôt |

Pomona : biotransformation des terpènes « medium », mesurée comme citronellol produit depuis le
géraniol [51]. **Contredit** : le dépôt dit tantôt « POF négatif », tantôt « non documenté » pour
Verdant et Pomona ; les fiches lues confirment « négatif » pour Pomona et Diamond, rien pour
Verdant. Aucune des quatre n'a de rendement de thiols publié sur houblon réel.

### 8.5 Le vieillissement et la fraîcheur

| Effet | Chiffres | Source |
|---|---|---|
| Bière gardée 470 jours à 0, 4, 20, 30 °C | monoterpènes stables à 0–4 °C, ≈ −25 % à 20 °C, ≈ −50 % à 30 °C ; esters des acides du houblon ≈ −10 % à 0 °C, −60 à −70 % à 20 °C ; linalol perdu seulement à 30 °C, avec racémisation | [30] [P] |
| NEIPA à 5 °C, 3 et 6 mois | thiols et terpènes ≥ −50 % à 6 mois ; alcools monoterpéniques presque stables ; 4MMP à 59–67 % après 3 mois (relayé) | [36] [P, auteurs de fabricant] |
| 21 bières belges, 2 ans à 20 °C | linalol et géraniol restent à 45–70 % ; thiols < 40 % | [37] [S] |
| IPA à 4 et 20 °C, 12 semaines | décroissance d'ordre 1 du caryophyllène, du géraniol et du citronellol (r² 0,86–0,93) | [38] [S] |
| Oxygène, garde chaude | baisse des agrumes et du tropical | **établi** (Barnette et Shellhammer 2019) |
| HSI ≤ 0,25 / ≤ 0,31 / 0,31–0,40 / 0,40–0,50 / 0,50–0,60 / > 0,60 | transformation 0 / ≤ 10 / 10–21 / 21–31 / 31–39 / > 39 % | [25] [F] |
| Citra HSI 0,43 et 0,61 ; Galaxy 0,42 et 0,63 | α −15 et −38 % ; −16 et −47 % ; huile −40 % (Citra) et −50 % (Galaxy) ; qualité aromatique 6,54 → 5,75 → 4,79 (Citra), 6,42 → 5,54 → 4,21 (Galaxy), échelle non précisée | [25] [F] |

**Conséquence.** Une perte par famille et par semaine selon la température est calculable en
plage [P]. Le HSI donne une classe de fraîcheur et une perte d'α [F] ; la perte d'arôme reste un
**sens** (Citra et Galaxy : huile −40 à −50 % entre frais et vieilli).

---

## 9. Ce qui manque à l'outil de L'Affinée

Classé par **effet sur le choix**, puis par **faisabilité** (données accessibles, licence).

| Rang | Manque | Effet sur le choix | Données | Licence | Faisabilité |
|---|---|---|---|---|---|
| 1 | **La quantité par gramme** : huile, linalol, géraniol, 4MMP, en charge par ajout (mL/hL, µg/L, ng/L), au lieu de mots cités | **décisif** : c'est ce qui sépare Citra de Cascade | fiches YCH, Haas, BarthHaas, HPA, Hopsteiner ; COA ; article Hopsteiner pour les thiols | fiches propriétaires : relever quelques faits cités, ou saisir le COA ; article Hopsteiner à confirmer | **haute** : peu de valeurs par variété, calcul simple |
| 2 | **Deux profils par variété, « à chaud » et « à froid »**, avec la table de survie et les transferts (§8.2) | **fort** : le même houblon change de caractère | Gahr 2019, Tusha 2022 (CC BY), Kishimoto 2008, YCH « survivables » | articles citables ; YCH propriétaire | **haute** pour la table ; **moyenne** pour les profils par variété |
| 3 | **Le lot avant la variété** : COA, récolte, HSI, avec la variabilité affichée (×13 sur le géraniol de Cascade, ×5 sur le 4MMP de Simcoe) | **fort** : un mauvais lot efface l'écart entre variétés | COA du brasseur ; Hopsteiner, OSU | données du brasseur | **haute** (champs existants à brancher) |
| 4 | **Saturation par attribut** : agrumes qui plafonnent, herbacé qui monte | **fort** pour la dose et le choix « plus de Cascade ou passer à Citra » | Cascade seul [22] ; ailleurs générique | article | **moyenne** : un seul jeu publié |
| 5 | **Seuils en plage et rapport au seuil** | **moyen** : dit « au-dessus du seuil ou pas », pas l'intensité | §8.1 | articles, posters | **haute** |
| 6 | **Thiols libres par variété** en classes, avec les valeurs quand elles existent | **moyen à fort** pour le tropical | Hopsteiner 2024 (97 variétés) | à confirmer | **haute** |
| 7 | **Profil sensoriel chiffré par forme** (YCH) | **faible** pour séparer Citra et Cascade, **utile** pour la forme (feuille, T-90, cryo) | YCH | propriétaire, accord nécessaire | **basse** |
| 8 | **Vieillissement et HSI** | **moyen** pour décider quand boire et quel lot | Gahr 2019, Biendl 2021, BarthHaas | articles ; fiche | **haute** |
| 9 | **Hop creep et durée de contact** | **moyen** : risque et non arôme | Wolfe 2012, Lafontaine 2018, Young et Fox 2025, Hrabia 2024 | articles (thèse OSU en accès libre) | **haute** pour le drapeau et le message « 24 h suffisent » |
| 10 | **Biotransformation et levure** | **incertain** : drapeaux | fiches levure, Christiaens 2025 | fiches ; CC BY | **moyenne** (drapeaux seulement) |
| 11 | **Assemblages, ordre des ajouts, masquage en stout** | potentiellement fort, **inconnu** | aucune | — | **non faisable** : journal de dégustation du brasseur |

**Les trois manques qui changent le plus le choix** : la quantité par gramme (1), les deux
profils chaud/froid (2), le lot avant la variété (3).

---

## Sources

Toutes consultées le 19.10.2026. *lu* : ouvert par le pilote ou un agent ; *relayé* : résumé de
moteur ou page tierce.

1. Yakima Chief Hops, Citra® Brand, onglets Whole Leaf, T-90, Cryo (lu dans le navigateur ; valeurs du graphique sensoriel lues dans la page). https://www.yakimachief.com/variety/citra-brand
2. Yakima Chief Hops, Cascade (lu, idem). https://www.yakimachief.com/variety/cascade
3. Yakima Chief Hops, Idaho 7® Brand (lu, idem). https://www.yakimachief.com/variety/idaho-7-brand
4. Yakima Chief Hops, Sensory Analysis Program, FAQ et bulletin d'évaluation 2026 (lus). https://www.yakimachief.com/sensory-analysis · https://assets.contentstack.io/v3/assets/blt01aa4a23b23249e1/bltf039861c3f6d5d42/Hop_Sensory%20Ballot_2026.pdf
5. Yakima Chief Hops, Survivable Compounds Poster CY2025 et Handbook 2022 (lus, graphiques non lisibles). https://assets.contentstack.io/v3/assets/blt01aa4a23b23249e1/blt329a9dec6530abd3/6a5fad9788fadd4b8f60038b/Survivable_Compounds_CY2025_Final_Poster.pdf · https://assets.contentstack.io/v3/assets/blt01aa4a23b23249e1/blt9efc4c6c98470cd3/Survivable-Compounds-Handbook-2022.pdf
6. Yakima Chief Hops, Terms and Conditions (lu). https://www.yakimachief.com/terms-and-conditions
7. John I. Haas, MiniSpecSheets Citra et Cascade, 2022 (lus). https://www.johnihaas.com/wp-content/uploads/2020/09/MiniSpecSheets-Citra.pdf · https://www.johnihaas.com/wp-content/uploads/2020/09/MiniSpecSheets-Cascade.pdf
8. BarthHaas, Citra® (lu ; l'URL « cascade » du même site sert la page Sabro et a été écartée). https://www.barthhaas.com/hops-and-products/hops/citrar
9. Castle Malting, Cascade FR (lu). https://castlemalting.com/Publications/HopProducts/Cascade_FR_CMSpecA.pdf
10. Hopsteiner, fiche Cascade (lue). https://pim.hopsteiner.de/api/v1/en/varieties/cas.pdf
11. Schmidt, Hoferer, Biendl, *Determination of variety dependent « thiol impact »…*, BrewingScience 77 (11/12), 2024, p. 135–141 (lu) ; newsletter Hopsteiner 2025-02 (lue). https://cdn.hopsteiner.de/assets/cdn/service/technical_information_and_support/technical-publications/2024-12_Determination_of_Variety_Dependent_Thiol_Impact_Based_on_LC-MS_MS_Analysis_of_Different_Hop_Samples_Collected_Worldwide_BS_Schmidt_et_al.pdf · https://brauwelt.com/images/BWI_NL/hopsteiner/2025/2025-02_TS_Thiol_Impact.pdf
12. Kishimoto, Kobayashi, Yako, Iida, Wanikawa, *Comparison of 4MMP contents in hop cultivars from different growing regions*, J. Agric. Food Chem. 56, 2008, p. 1051–1057 (lu). https://researchmap.jp/read0145703/published_papers/19420725/attachment_file.pdf
13. Kishimoto, Morimoto, Kobayashi, Yako, Wanikawa, *Behaviors of 3MH and 3MHA during brewing processes*, J. Am. Soc. Brew. Chem. 66(3), 2008, p. 192–196 (lu). https://researchmap.jp/read0145703/published_papers/19420728/attachment_file.pdf
14. Reglitz, Steinhaus, J. Agric. Food Chem. 65(11), 2017, p. 2364–2372 (résumé lu) ; maximum attribué à Citra par une revue de l'UCLouvain (relayé). https://portal.fis.leibniz-lsb.tum.de/en/publications/quantitation-of-4-methyl-4-sulfanylpentan-2-one-4msp-in-hops-by-a-4/
15. Kankolongo Cibaka, Gros, Nizet, Collin, J. Agric. Food Chem. 63(11), 2015, p. 3022–3030 (résumé lu). https://research.dial.uclouvain.be/handle/2078.5/62348
16. Decourrière, Chenot, Silva Ferreira, Collin, *HPLC-ESI(+)MS/MS quantitation of the newly evidenced glutathione S-conjugates in… Citra and Sorachi Ace*, Flavour Science 2018, CC BY-NC-ND 4.0 (lu ; valeurs lues dans la figure 2). https://research.dial.uclouvain.be/bitstreams/4dce0cd7-d46d-4f82-b0a9-91ab20920c29/download
17. Gros et al., J. Inst. Brew. 119, 2013, p. 221–227, résumé dans la Hop Science Newsletter de février 2015 (relayé par une page lue). https://www.johnihaas.com/news-views/hop-science-newsletter-february-2015/
18. Roland et al., Flavour Fragr. J., 2016 (relayé). https://agris.fao.org/search/fr/records/65de7be163b8185d9ca8cdd3
19. Schönberger, Dagan, *Development of thiols and thiol precursors in different hop varieties*, séminaire CBC 2020 (lu). https://cdn.brewersassociation.org/wp-content/uploads/2020/05/CBC-Online-Seminar-Presentation-Development-of-Thiols-and-Thiol-Precursors-in-Different-Hop-Varieties.pdf
20. Lafontaine, Varnum, Roland, Delpech, Dagan, Vollmer, Kishimoto, Shellhammer, *Impact of harvest maturity on the aroma characteristics and chemistry of Cascade hops used for dry-hopping*, Food Chemistry 278, 2019, p. 228–239 (lu, version acceptée OSU). https://ir.library.oregonstate.edu/concern/parent/hq37vt81q/file_sets/7d279002b
21. Sharp, Lafontaine (Shellhammer Laboratory), *Dry-hopping beer and achieving consistent flavor*, Craft Brewers Conference 2018 (lu) ; travaux de thèse de Sharp (2016). https://www.craftbrewersconference.com/wp-content/uploads/2018_presentations/Dry-hopping-Beer-Achieving-Consistent-Flavor1.pdf
22. Lafontaine, Shellhammer, *Impact of static dry-hopping rate on the sensory and analytical profiles of beer*, J. Inst. Brew. 124(4), 2018, p. 434–442 (version OSU lue par un agent ; tableau 3 concordant avec `docs/hop-solver.md`). https://ir.library.oregonstate.edu/downloads/f1881s061 · https://onlinelibrary.wiley.com/doi/10.1002/jib.517
23. Lafontaine, Pereira, Vollmer, Shellhammer, BrewingScience 71, 2018, CC BY 4.0. https://brewingscience.de/index.php/brewingscience/article/view/277
24. Schönberger (BarthHaas), *Hop thiols: are they worth the hype for beer aroma?*, 15.05.2025 (lu). https://www.barthhaas.com/ressources/blog/blog-article/hop-thiols-are-they-worth-the-hype-for-beer-aroma
25. Schönberger, Zunkel, McMillan, Muñoz-Insa (BarthHaas), *How can the HSI be correctly assessed for brewing purposes?*, 04.07.2024 (lu). https://www.barthhaas.com/ressources/blog/blog-article/how-can-the-hsi-be-correctly-assessed-for-brewing-purposes
26. Hop Products Australia, Galaxy® (lu). https://hops.com.au/galaxy/
27. John I. Haas, Idaho 7 spec sheet, 2020 (lu par un agent). https://www.johnihaas.com/wp-content/uploads/2020/09/Haas_HopSpecSheets-Idaho7_110520.pdf
28. Charles Faram, Hop Oracle Galaxy ; fiche Idaho 7 ; fiche Cascade 2024 (lues). https://charlesfaram.com/uk/hop-oracle/galaxy/ · https://charlesfaram.com/wp-content/uploads/2025/01/Idaho-7-™-Hop-Variety-Specifications-and-Characteristics-.pdf · https://charlesfaram.com/wp-content/uploads/2024/12/Cascade-Hop-Variety-Specifications-and-Characteristics-EN-GB.pdf
29. Brülosophy, Galaxy contre Mosaic (2017) ; Idaho 7 (lus par un agent). https://brulosophy.com/2017/03/06/hop-comparison-galaxy-vs-mosaic-exbeeriment-results/ · https://brulosophy.com/?p=138488
30. Gahr, Forster, De Clippeleer, Van Opstaele, *Reproducibility trials… Part 3: transfer rates of aroma compounds from hops to beer and their ageing behaviour*, BrewingScience 72, 2019, p. 217–227 (lu par un agent ; résumé contrôlé par le pilote). https://brewingscience.de/index.php/brewingscience/article/view/260
31. Tusha, Nešpor, Jelínek, Vodičková, Kinčl, Dostálek, *Effect of Czech hop varieties on aroma of dry-hopped lager beer*, Foods 11(16):2520, 2022, CC BY 4.0 (lu). https://pmc.ncbi.nlm.nih.gov/articles/PMC9407075
32. Brauwelt International, résumés de BrewingScience 66 (2013) et 67 (2014) sur le dry hop et le transfert du géraniol (lus par un agent). https://brauwelt.com/en/topics/raw-materials/622358-on-the-fate-of-certain-hop-substances-during-dry-hopping · https://brauwelt.com/en/topics/raw-materials/622341-on-the-transfer-rate-of-geraniol-with-dry-hopping
33. Haslbeck et al., BrewingScience 70, 2017, p. 159–169 (résumé). https://doi.org/10.23763/BrSc17-16haslbeck
34. Peltz, Shellhammer, *Sensory thresholds of hop volatile compounds in beer*, World Brewing Congress 2016, poster 176 (lu) ; ASBC 2014, A-74 (lu par un agent). https://www.asbcnet.org/events/archives/2016/proceedings/Documents/176_Peltz.pdf · https://www.asbcnet.org:443/events/archives/2014Meeting/proceedings/2014Proceedings/A-74_Peltz.pdf
35. Klimczak, Cioch-Skoneczny, Duda-Chodak, Molecules 28(18):6648, 2023, CC BY, tableau 2 (lu). https://pmc.ncbi.nlm.nih.gov/articles/PMC10534726/
36. Biendl et al., MBAA Technical Quarterly 58(1), 2021 (lu par un agent ; auteurs de Hopsteiner). https://cdn.hopsteiner.de/assets/cdn/service/technical_information_and_support/technical-publications/2021-05_tq_biendl-et-al_mbba.pdf
37. Silva Ferreira, Collin, manuscrit soumis (lu par un agent). https://research.dial.uclouvain.be/bitstreams/09eb0fbe-3361-485e-8d5c-2a4fa5c3018a/download
38. Huismann et al., ASBC 2017, poster 36 (lu par un agent). https://www.asbcnet.org/events/archives/2017ASBCMeeting/proceedings/2017Proceedings/36_Huismann.pdf
39. BJCP 2021, 16D Foreign Extra Stout (lu). https://www.bjcp.org/style/2021/16/16D/foreign-extra-stout/
40. Hofmann et al., J. Agric. Food Chem., 2001, mélanoïdines de café (relayé). https://pages.uoregon.edu/chendon/coffee_literature/old_literature/2001%20J.%20Agric.%20Food%20Chem.,%20Coffee%20melanoidin%20impact%20on%20flavor%20and%20odor.pdf
41. Svedlund, Evering, Gibson, Krogerus, Appl. Microbiol. Biotechnol. 106, 2022, CC BY 4.0 (lu en partie). https://pmc.ncbi.nlm.nih.gov/articles/PMC9329171/
42. Christiaens et al., Molecules 30:325, 2025 (lu). https://pmc.ncbi.nlm.nih.gov/articles/PMC11767611/
43. Chenot et al., J. Agric. Food Chem. 69, 2021, et 2022 (relayés). https://research.dial.uclouvain.be/bitstreams/56598c13-32bd-495f-814d-57d397fe9ab9/download · https://pubmed.ncbi.nlm.nih.gov/35234466/
44. Kumar et al., Foods 12:1064, 2023 (lu). https://pmc.ncbi.nlm.nih.gov/articles/PMC10000826/
45. Roncoroni et al., Food Microbiol. 28, 2011, via Saccharomyces Genome Database (relayé). https://wiki.yeastgenome.org/index.php/IRC7
46. Molitor et al., Fermentation 8:370, 2022 (résumé lu). https://mdpi-res.com/d_attachment/fermentation/fermentation-08-00370/article_deploy/fermentation-08-00370.pdf
47. Omega Yeast, *All about thiolized yeast*, 30.06.2026 (lu). https://omegayeast.com/all-about-thiolized-yeast
48. Molitor, Shellhammer, *Hop biotransformation & yeast*, Lallemand Brewing, 2023 (lu). https://www.lallemandbrewing.com/en/asia/resources/whats-new/hop-biotransformation-by-brewing-yeast/
49. Lallemand, *IPA best practices* (lu par un agent). https://admin.lallemandbrewing.com/wp-content/uploads/2023/07/LAL-bestpractices-IPA_solutions-ENG-8.5x11.pdf
50. Fiches techniques : SafAle US-05 (Fermentis) ; LalBrew Pomona, Diamond, Verdant IPA (copies de distributeurs) (lues par un agent ; Verdant relayée). https://fermentis.com/en/product/safale-us-05 · https://murphyandson.co.uk/wp-content/uploads/2024/07/Pomona-TDS-ENG-8.5x11-Print-LalBrew.pdf · https://files.scottlab.com/uploads/DIAMOND%20TDS.pdf · https://www.murphyandson.co.uk/wp-content/uploads/2020/08/TDS_LPS_BREWINGYEAST_VERDANT_ENG_8.5x11.pdf
51. Escarpment Labs, LalBrew Pomona (lu par un agent). https://escarpmentlabs.com/products/lalbrew-pomona
52. Sharp et al., J. Inst. Brew., 2017, DOI 10.1002/jib.418 (relayé par un wiki). https://milkthefunk.com/wiki/Special:MobileDiff/13452
53. Kankolongo Cibaka et al., J. Am. Soc. Brew. Chem., 2017 (relayé ; page refusée). https://www.asbcnet.org/publications/journal/vol/2017/Pages/ASBCJ-2017-2257-01.aspx
54. Lafontaine et al., J. Agric. Food Chem. 69, 2021, résumé dans la Hop Science Newsletter de mars 2021 (relayé). https://www.johnihaas.com/news-views/hop-science-newsletter-march-2021/
55. Schreurs et al., Nature Communications, 2024, et données Zenodo (lus par un agent). https://pmc.ncbi.nlm.nih.gov/articles/PMC10966102/ · https://zenodo.org/records/10653704
56. Legisa, Mengoni, Kvasny Prumysl 67(6), 2021. https://kvasnyprumysl.eu/index.php/kp/article/view/253
57. Nesvadba et al., Kvasny Prumysl 69, 2023, p. 831–838, CC BY-SA 4.0 (lu par un agent). https://kvasnyprumysl.eu/index.php/kp/article/view/302/288
58. Zunkel et al. (BarthHaas), ASBC 2017, poster 38 (lu par un agent). https://www.asbcnet.org/events/archives/2017ASBCMeeting/proceedings/2017Proceedings/38_Zunkel.pdf
59. Hopsessed sensory worksheet (BarthHaas, via HPA) (lu par un agent). https://hops.com.au/downloads/hopsessed/hopsessed-sensory-worksheet.pdf
60. Brauwelt, *The Hop Aroma Compendium, volume 2* (lu par un agent). https://brauwelt.com/en/topics/quality-assurance/623986-the-hop-aroma-compendium-a-flavor-guide-volume-2-
61. Janish, Hop Oils Calculator et *Survivables* (lus). https://scottjanish.com/hop-oils-calulator/ · https://scottjanish.com/survivables-unpacking-hot-side-hop-flavor/
62. BeerSmith, revue de Hop Control, 2024 (lu par un agent). https://beersmith.com/blog/?p=14507
63. Hop Products Australia, Hop Navigator (lu par un agent). https://hops.com.au/hop-navigator/
64. Shellhammer, mélanges Cascade/Centennial/Chinook, ASBC 2017 (lu par un agent) ; webinaire ASBC sur les assemblages en dry hop. https://www.asbcnet.org/events/archives/2017ASBCMeeting/proceedings/2017Proceedings/31_Shellhammer.pdf · https://asbcnet.org/events/webinars/Pages/Hopblending.aspx
65. almet/hops-datasets, GitHub (lu par un agent ; aucune licence visible). https://github.com/almet/hops-datasets
66. Beer Maverick, Citra (vérification anti-robot dans le navigateur, non contournée). https://beermaverick.com/hop/citra/
67. Takoi et al., BrewingScience 69, 2016 (cité par le dépôt). https://brewingscience.de/index.php/brewingscience/article/view/299
68. Young, Fox, *Hop creep variability unveiled: a comparative analysis of hop variety, quantity, origin, and product type*, J. Inst. Brew. 131(4), 2025, p. 228–237 (texte lu par un agent ; résumé vérifié par le pilote). https://escholarship.org/content/qt9v2579x2/qt9v2579x2.pdf · https://jib.cibd.org.uk/index.php/jib/article/view/84
69. Smith, Maye, Wilson (Hopsteiner), *Formation of humulinones in hops and hop pellets and its implication for dry-hopped beers*, ASBC 2015, présentation 58 (lu par un agent). https://www.asbcnet.org:443/events/archives/2015Meeting/proceedings/2015Presentations/58_Maye.pdf
70. Paul-Pax, Novy, Schönberger, Tillner (BarthHaas), *Dry hopping with a flowable hop extract*, ASBC 2022, poster A-17 (lu par un agent). https://www.asbcnet.org/events/archives/Documents/P_PaulPax.pdf
71. Hinz, *Influence of time, temperature and hop oil content on aroma extraction during dry hopping*, ASBC 2016, présentation 19 (lu par un agent). https://www.asbcnet.org/events/archives/2016/proceedings/Documents/19_Hinz.pdf
72. Lafontaine, Takoi, questions et réponses du webinaire ASBC *The benefits of hop blending during dry-hopping*, 07.03.2019 (lu par un agent). https://www.asbcnet.org:443/events/webinars/Documents/20190307_QandA_HopBlending.pdf
73. Wolfe, *A study of factors affecting the extraction of flavor when dry hopping beer*, thèse MSc, Oregon State University, 2012 (lue ; résumé vérifié par le pilote). https://ir.library.oregonstate.edu/xmlui/bitstream/handle/1957/34093/Wolfe_thesis.pdf
74. Yakima Chief Hops, *Cryo Hops product overview sheet*, révision de février 2022, copie d'un distributeur (lue par un agent). https://rahrbsg.ca/wp-content/uploads/2024/11/Cryo_Hops_Product_Overview_Sheet_1.pdf
75. Hauser, Lafontaine, Shellhammer, *Extraction efficiency of dry-hopping*, J. Am. Soc. Brew. Chem., 2019 (relayé). https://doi.org/10.1080/03610470.2019.1617622
76. Hauser, Van Simaeys, Lafontaine, Shellhammer, *A comparison of single-stage and two-stage dry-hopping regimes*, J. Am. Soc. Brew. Chem. 77(4), 2019, p. 251–260 (relayé). https://doi.org/10.1080/03610470.2019.1668230
77. Brülosophy, *Investigating the dry hop saturation point*, 24.06.2019 (résumé lu). https://www.brulosophy.com/2019/06/24/investigating-the-dry-hop-saturation-point-exbeeriment-results/
78. Titus et al., *Impact of dry hopping on beer flavor stability*, Foods 10(6):1264, 2021 (résumé lu). https://pmc.ncbi.nlm.nih.gov/articles/PMC8229854
79. Oladokun et al., *Dry-hopping: the effects of temperature and hop variety on the bittering profiles and properties of resultant beers*, BrewingScience 70, 2017 (relayé). https://eprints.nottingham.ac.uk/49491/
80. Willemart, Tanriverdi, Collin, *Impact of contact time, temperature, and ethanol content on hop creep-related enzymatic activities in beer*, J. Am. Soc. Brew. Chem., 2025 (relayé ; cité par le dépôt). https://research.dial.uclouvain.be/handle/2078.5/263102
81. Takoi et al., *Screening of geraniol-rich flavor hop and interesting behavior of β-citronellol…*, J. Am. Soc. Brew. Chem. 72, 2014 (relayé). https://www.asbcnet.org/publications/journal/vol/abstracts/ASBCJ-2014-0116-01.htm
82. Lallemand Brewing, *Best practices: biotransformation*, 2020 (relayé). https://admin.lallemandbrewing.com/wp-content/uploads/2020/08/LAL-bestpractices-Biotransformation2020.pdf
83. Cottrell, *Contribution of β-amylase from hops to the fermentability of dry hopped beer*, J. Inst. Brew. 131(2), 2025, p. 92–99 (résumé lu). https://jib.cibd.org.uk/index.php/jib/article/view/75
84. Kirkpatrick, Shellhammer, *Evidence of dextrin hydrolyzing enzymes in Cascade hops*, J. Agric. Food Chem. 66, 2018, p. 9121–9126 (relayé par [35] ; cité par le dépôt). https://doi.org/10.1021/acs.jafc.8b03563
85. Hrabia, Poręba, Ciosek, Poreda, *Effect of dry hopping conditions on the hop creep potential of beer*, J. Am. Soc. Brew. Chem. 82(4), 2024, p. 412–421 (relayé). https://doi.org/10.1080/03610470.2024.2388430
86. Jobe et al., J. Am. Soc. Brew. Chem. 82, 2024, p. 39–46, enzymes de Cascade et Mosaic (relayé par [68]). https://doi.org/10.1080/03610470.2024.2335828
87. Brülosophy, *The surprising science of dry hopping: lessons from Tom Shellhammer*, 21.02.2019 (résumé lu). https://brulosophy.com/2019/02/21/the-surprising-science-of-dry-hopping-lessons-from-tom-shellhammer/
88. Bruner, Marcus, Fox, *Dry-hop creep potential of various Saccharomyces yeast species and strains*, Fermentation 7(2):66, 2021 (relayé). https://news.bftv.ucdavis.edu/sites/g/files/dgvnsk1131/files/files/news-articles/fermentation-07-00066.pdf
89. Vollmer, Shellhammer et al., J. Am. Soc. Brew. Chem. 74(4), 2016, huile totale et intensité sur 23 lots de Cascade (relayé, comme dans E). https://www.asbcnet.org/publications/journal/vol/2016/Pages/ASBCJ-2016-4123-01.aspx
90. Takoi et al., J. Agric. Food Chem., acide géranique de Sorachi Ace (relayé par [72]). https://pubs.acs.org/doi/abs/10.1021/acs.jafc.8b04395
91. Stokholm, Rubottom, Shellhammer, méthode de banc pour le hop creep, BrewingScience, 2020 (relayé). https://www.barthhaas.com/ressources/blog/blog-article/hop-creep-what-is-it-and-how-do-i-avoid-it-in-the-brewery
92. Schmidt et al., Eureka!, BrewingScience 72, 2019 (lu en partie par un agent). https://doi.org/10.23763/BrSc19-21schmidt
93. Takoi et al., comportement du géraniol et du β-citronellol pendant la fermentation, actes ASBC 2011, O-40, et J. Inst. Brew. 2010 (relayé par un wiki). https://asbcnet.org/events/archives/2011Proceedings/Pages/O-40.aspx
