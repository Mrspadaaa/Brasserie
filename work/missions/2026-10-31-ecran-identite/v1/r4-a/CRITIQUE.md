# r4-a — critique calibrée (Fable, 31.10)

RETOUCHES — r4-a : r4 reconnaissable, les deux demandes tenues, mais ni l'ouverture de la règle ni la saisie des nombres ne se voient au repos

- **r4-a** (chaque nombre est un curseur, et se tape) — ACCEPTÉ, 2 retouches avant de la montrer. Phrase prédite : « C'est bien, c'est
  mon r4 avec la cuve en dessous. Mais l'ébullition s'arrête toujours à 120 ??? et sur ordinateur je vois pas que le chiffre se tape. »
  Correction : un signe d'ouverture au bout de la règle d'ébullition ; le pointillé du nom « neipa v3 » sous 24 et 60, au repos.

Captures ouvertes : `r4-et-r4a-repos.png`, `r4a-haut.png`, `r4a-page.png`, g1 à g3 (repos, pendant, après), `ordinateur-1280-ebullition-120.png`.
`etat.html` lu pour deux doutes (l. 63-65 : soulignement des nombres au survol seulement ; l. 210, 263 : la règle d'ébullition s'étend au
relâché, rien ne l'annonce au repos). Grille : PORTRAIT v2, D205, SPEC § 0 et ses mots du 31.10.

## 1. Règle n° 1 — r4 reprise telle quelle ?

Oui, côte à côte, il la reconnaît : même nom en pointillé, même pastille de style, mêmes deux cartes à curseur avec 24 L et 60 min en 48 px,
même règle par 1 L et 5′, même NOLO, même pied « Suivant — Fermentescibles ». La couleur, les rayons, le thème sont ceux de r4.

Écarts que ses mots ne demandent pas (tous viennent des greffes de `critique/SYNTHESE.md` § r4, que D205 reprend ; je les liste pour qu'il
les voie venir, aucun n'est un rejet) :
1. Pastilles « OG 1,065–1,085 · IBU 60–100 » et « Repères ⌄ » sous le style (greffe u2). La tuile « Repères du style · BJCP 2021 » du bas
   disparaît ; « BJCP 2021 » n'est plus au premier plan (il est derrière « Repères ⌄ », j'imagine ; à vérifier).
2. La barre de la cuve sous la règle du volume, « cuve 45 L · ~27 L avant ébullition » (greffe e2 / e1) : une rangée de plus dans la carte Volume.
3. Conséquence de 2 : la règle du volume va de 0 à 45 au repos (r4 : 0 à ~34). La zone rouge hachurée fait un tiers de la piste au repos,
   contre un dixième dans r4. Même nature, plus grande ; voir « À surveiller ».
4. La tuile Matériel passe de pleine largeur (« Royal Catering · cuve 45 L ») à une demi-tuile « Royal Catering » à côté d'Espace libre.
5. « 20 % » devient « ~20 % » (hypothèse 3, juste).
6. La phrase « Fermenteur plein : réduis le volume. » devient « +1 L de trop » en rouge (greffe g2, D3). Il ne l'avait vue qu'à 31 L.
7. Le bouton + descend sous le pied (il ne recouvre plus Suivant). Bien.

Écarts demandés par ses mots, bien faits : « fermenteur 30 L » devient une puce qui ouvre le matériel ; 24 et 60 deviennent des champs ;
la règle s'étend.

## 2. Ses deux demandes

**« je veux plus d'ébullition »** — tenue, pas visible.
- g1 : pouce tenu à 100 (règle 0–120), relâché à 120 → règle 0–150, « ~6 L évaporés », « ~30 L avant ébullition ». Tapé « 120 » → pareil.
  Juste et cohérent (3 L/h).
- Mais au repos la carte est identique à r4 : la règle se termine à 120, rien ne dit qu'elle s'ouvre. Il poussera le pouce au bout, lâchera,
  et verra 150 ; s'il ne lâche pas, ou s'il regarde seulement la capture de repos, il redira « limite ». Pour 200′ (D37, « tiens 200' c'est
  mieux »), il faut quatre glissers ou taper : taper est bien, encore faut-il savoir qu'on peut (point suivant).
- Retouche A : un signe d'ouverture au bout de la règle, au repos et dans chaque état : par exemple le dernier chiffre « 120 › » ou la
  dernière graduation en pointe, et le même au bout de la règle du volume. Zéro mot ajouté (79/80 au premier écran : il n'y a plus de place).

**« SI je change de fermenteur »** — tenue et visible.
- g2 : la puce « fermenteur 30 L » ouvre la tuile Matériel sur « Fermenteur [60] L », « ↺ profil » ; après : « fermenteur 60 L » en trait
  plein, « 36 L libres », règle 0–65, conseil ~48, rouge au-delà de 60, la cuve 45 L restée sur la même règle. Honnête : aucun second
  fermenteur inventé, retour au profil possible.
- La puce tiretée se lit « vient du profil », comme « repère » et « ~3 L évaporés » : cohérent dans la maquette. Un doigt la touchera.

**« pouvoir modifier aussi les chiffre directement »** — tenue, pas visible.
- Le code et le jeu puppeteer le prouvent (Tab, ↑ ↓, Entrée, Échap, valeur hors règle acceptée). À 1280 la colonne est centrée à 560,
  comme l'assistant ; rien ne déborde.
- Mais sur la capture ordinateur, 24 et 120 sont du texte : le soulignement n'apparaît qu'au survol (`.r4a-in:hover`), et au téléphone
  jamais. Le nom « neipa v3 » porte lui un pointillé au repos : la maquette a déjà sa convention « ça se tape », et les nombres ne la suivent
  pas. Lui, après avoir demandé la saisie, cherchera du regard où cliquer.
- Retouche B : le même pointillé (1,5 px, `--trait`) sous 24 et 60 au repos, sur les deux formats ; au focus, trait plein (déjà fait).
  Même traitement pour « Fermenteur 30 L » dans la tuile dépliée (il l'a, cadre bleu). Zéro mot ajouté.

## 3. Les greffes — aident-elles, ou chargent-elles ?

- **Pastilles OG · IBU + Repères ⌄** : aident. « il manque la relation avec le style » (D59) trouve sa réponse en deux pastilles, sans
  liste. Léger.
- **Cuve sur la même règle, ~27 L avant ébullition** : aide, et c'est l'information qu'un brasseur veut à cet endroit (ce qu'il met dans la
  cuve pour avoir 24 L au fermenteur). Une barre fine, deux étiquettes : pas un cockpit. Elle bouge avec les deux curseurs (g1 : ~30, g3 : ~34)
  et avec le fermenteur, c'est ce qui rend les curseurs parlants.
- **« +1 L de trop » en rouge** : aide, remplace l'explication (D3) par la conséquence, sous le pouce (g3).
- **Repères en pastilles plutôt qu'en tuile** : neutre à léger gain ; la source « BJCP 2021 » ne doit pas se perdre derrière le chevron.
- Charge : 79 mots (limite 80), tailles de texte dans la norme, tout tient en un écran de 390 avec le pied et le +. Aucun texte ouvert, aucune
  légende au repos. Rien à retirer ; rien à ajouter non plus en mots.

## 4. En trois secondes

« C'est bien, c'est mon r4 avec la cuve en dessous et les repères du style. Mais l'ébullition s'arrête toujours à 120 ??? et sur
ordinateur je vois pas que le chiffre se tape. »

## Retouches avant de la montrer

1. **A — l'ouverture se voit** : un signe au bout des règles d'ébullition et de volume (« 120 › » ou graduation en pointe), au repos ; la
   règle continue à s'étendre au relâché et à la saisie comme maintenant. Capture au repos et après 120 à refaire.
2. **B — la saisie se voit** : pointillé au repos sous 24 L et 60 min, comme sous « neipa v3 », au téléphone et à 1280 ; survol et focus
   gardés. Capture ordinateur à refaire avec le champ 120 au focus (caret visible), pour qu'il voie l'état « je tape ».

## À surveiller (pas une retouche : goût prêté, non cité)
- La zone rouge hachurée au repos (30 → 45) est trois fois plus grande que dans r4. Elle dit la même chose (« au-delà du fermenteur »). S'il
  dit « c'est quoi tout ce rouge », l'alléger au repos (hachure plus pâle) et la densifier seulement quand le volume y entre.
- « ~27 L avant ébullition » = 24 + ~3, sans pertes de fond ni contraction ; marqué « ~ », et la NOTE prévoit le moteur au port (J7). Il
  pourra dire « il manque les pertes » : la réponse est au port, pas dans le dessin.
- g3 pendant = après : le curseur n'a pas d'état « tenu », mais le nombre et « +1 L de trop » changent en direct ; c'est ce qu'il regarde.

LEÇON PROPOSÉE : aucune.
