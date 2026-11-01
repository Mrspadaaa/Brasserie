# r4-a — chaque nombre est un curseur, et se tape (passe 1 de r4, 31.10)

OK — r4-a : r4 telle quelle ; règles ouvertes et saisie visibles au repos ; source BJCP à un toucher ; COMMUN OK

- **Base** : `v0/r4`, choisie par le brasseur (règle n° 1), reprise telle quelle ; `v0/r4` n'est pas touchée.
- **Ses mots** : « 7 · r4 · Chaque nombre est un curseur Est le meilleur, mais limite peut être un peu trop, au je veux plus
  d'ébullition, SI je change de fermenteur... Quelques adaptations mais si non c'est bien ! » Puis : « Aussi il faut que 7 · r4
  · Chaque nombre est un curseur soit accessible en mode ordinateur, donc pouvoir modifier aussi les chiffre directement ».
- **Ma lecture** : la même que celle du pilote. « limite peut être un peu trop » parle des bornes, trop serrées ; « au je veux » se
  lit « ou je veux ». Deux cas sont visés : l'ébullition au-delà de 120 min, et un autre fermenteur que celui de 30 L.

## Chaque élément de r4, et ce qu'il devient
| # | Élément de r4 | Dans r4-a | Raison |
|---|---|---|---|
| 1 | En-tête commun (‹, Identité 1/7, Abandonner, import, thème) | gardé | commun aux 7 étapes (J12) |
| 2 | Fil des 7 étapes | gardé | commun |
| 3 | Bandeau Grain · OG · IBU · EBC | gardé | commun |
| 4 | Nom « neipa v3 », souligné en pointillé | gardé | |
| 5 | Pastille « Double IPA 22A ⌄ » | gardée | |
| 6 | — | ajouté : pastilles OG 1,065–1,085 et IBU 60–100 sous le style, puis « Repères ⌄ » pour le reste | greffe u2 ; les valeurs de la recette restent au bandeau (un chiffre, une fois) |
| 7 | « Volume · fermenteur 30 L » | adapté : « fermenteur 30 L » devient une puce tiretée ; elle ouvre le matériel sur le champ du fermenteur. Si la capacité est changée, le trait devient plein | changer de fermenteur depuis l'écran |
| 8 | Grande lecture « 24 L » (48 px) | gardée ; c'est maintenant un champ sur place (`inputmode="decimal"`) | taper le chiffre, au téléphone comme sur ordinateur |
| 9 | « 6 L libres » | gardé. Au-delà du fermenteur, « +1 L de trop » en rouge (`role=alert`) ; à égalité, « 0 L libre, plein » | greffe g2 |
| 10 | Piste du volume : doré, hachuré libre, zone rouge au-delà de 30, trait rouge | gardée. La règle suit le fermenteur, le volume et la cuve : 0–45 au repos, 0–65 avec 60 L ; elle s'étend par 5 L. Entre le fermenteur et le volume, le dépassement est en rouge foncé | bornes ouvertes, dépassement visible |
| 11 | Conseil ~24, en tireté | gardé ; il suit le fermenteur (~48 pour 60 L) | |
| 12 | Règle par 1 L, chiffres tous les 10 | gardée, étendue | |
| 13 | Phrase « Fermenteur plein : réduis le volume. » | retirée ; remplacée par « +1 L de trop » et la zone rouge | greffe g2, retouche du critique |
| 14 | — | ajouté : la barre de la cuve sur la même règle. Elle s'arrête à 45 L, avec le moût d'avant ébullition et la part évaporée en bleu ; « cuve 45 L · ~27 L avant ébullition » | greffe e2 |
| 15 | Lecture « 60 min » | gardée ; c'est maintenant un champ sur place (`inputmode="numeric"`, arrondi à 5′) | taper le chiffre |
| 16 | Curseur 0–120 par 5′ | adapté : la règle s'étend toujours d'une demi-heure au-delà de la valeur, au relâché ou à la saisie (120 → 0–150, 165 → 0–180…). Elle ne bouge pas pendant le glisser | « je veux plus d'ébullition » |
| 17 | Bulle « ~3 L évaporés » | gardée | |
| 18 | Règle par 5′ | gardée, étendue | |
| 19 | Interrupteur NOLO ≤ 0,5 % | gardé | |
| 20 | Tuile « Espace libre 20 % repère » | adaptée : « ~20 % » | « ~ » sur le simulé (hyp. 3) |
| 21 | Tuile « Repères du style · BJCP 2021 » | déplacée : « Repères ⌄ » au bout des pastilles (n° 6). Elle déplie FG, alcool, EBC « sous ↓ » et la source « 22A · BJCP 2021 » | elle laisse sa place à la tuile Matériel ; la source reste à un toucher (retouche C) |
| 22 | Tuile « Matériel · Royal Catering · cuve 45 L » | adaptée : « Royal Catering ». Elle se déplie sur place sur « Fermenteur [30] L », avec « ↺ profil » si la capacité change ; Entrée valide et replie | 45 L s'écrit une fois (barre de la cuve) ; changer de fermenteur par le matériel |
| 23 | Pied « Retour · Suivant — Fermentescibles », lanceur + | gardés ; le + ne recouvre rien au repos | commun |
| 24 | Annexe des états | adaptée : recette vide (le seul « Coller une recette » du corps), volume effacé, évaporation au repli de 10 %/h | import seulement sur une recette vide (retouche commune) |

## Retouches du critique (CRITIQUE.md, 31.10), sans mot ajouté (79 mots)
- **A. Ouverture des règles, visible au repos.** Au bout de chaque règle (volume, ébullition), la graduation finit en pointe ▶. Le
  dernier chiffre porte un « › » (« 40 › », « 120 › », puis « 150 › » une fois étendue). Le signe vient d'un pseudo-élément CSS : il
  n'entre pas dans le compte des mots. Il se voit dans chaque état (repos, g1 à g3, 1280).
- **B. La saisie, visible au repos.** Sous 24 et sous 60, le pointillé du nom (1,5 px, `--trait`), au téléphone comme à l'ordinateur ;
  au focus, un trait plein de 2 px. Le champ « Fermenteur [30] L » du matériel déplié garde son cadre.
- **C. La source « BJCP 2021 ».** « Repères ⌄ » déplie sur place FG 1,008–1,018, alcool 7,5–10 %, EBC 12–28 « sous ↓ » (la seule
  plage que la recette manque, EBC 9,5) et « 22A · BJCP 2021 ». Replié au repos. Capture : `reperes-ouverts.png`.

Aucun bouton d'import dans le corps d'une recette remplie : l'icône de l'en-tête suffit. Rayons : 10 et 16 px (DESIGN.md). Jamais
`type="number"` (grep : 0).

## Ordinateur et clavier
- Chaque nombre se tape : volume, ébullition, capacité du fermenteur. Au clic ou au toucher, le chiffre devient un champ sélectionné.
  Le curseur suit la frappe.
- Tab passe d'un champ à l'autre (nom, style, repères, fermenteur, volume, curseur du volume, ébullition, curseur de l'ébullition…).
- ↑ et ↓ ajoutent ±1 L ou ±5′, dans le champ comme sur le curseur. Entrée valide, Échap rend la valeur d'avant.
- Une valeur tapée hors de la règle est acceptée : la règle s'étend (ébullition, volume) ou le dépassement se voit en rouge.
- À 1280 px, la colonne est centrée à 560 px, comme l'assistant ; le + est à son bord.
- Joué (puppeteer) : focus sur le volume, Tab, Tab (focus sur l'ébullition), « 120 », Entrée → 120 min, règle 0–150. Ensuite, « 45 »
  puis Échap → 120 gardé ; Tab vers le curseur, puis ↑ → 125.

## Honnêteté
- « ~27 L avant ébullition » = volume + évaporation (24 + ~3), comme e2, marqué « ~ ». Le calcul de l'app (`brewingMath.ts` l. 557) y
  ajoute pertes de fond, houblons et contraction : il donnera plus. Au port, ce nombre vient du moteur, pas de cette addition (J7).
- Évaporation : 3 L/h, `boilOffLPerHour` du profil de démonstration (fixture `fruty.ts`, comme sa capture), toujours « ~ ». Repli de 10 %/h
  dit « estimé ».
- Les 60 L du geste 2 sont tapés pour la démonstration : aucun second fermenteur n'est inventé. Le profil garde 30 L (« ↺ profil »).

## Contrôles (31.10, outils en cours de correction par la voie o1)
- `verifier-page.mjs v1/r4-a/etat.html --min-images 0` : PAGE OK.
- `mots-premier-ecran.mjs v1 r4-a --page=etat.html --max=80` : 79 mots, MOTS OK (rejoué après A à C).
- `controle-contraste.mjs v1 r4-a --page=etat.html` : CONTRASTE OK (pire « Grain », 5,27:1).
- `controle-commun.mjs v1 r4-a --page=etat.html --profil=sans-houblons` : COMMUN OK. Mots, couleurs, survol, blocs, contraste,
  standard, parlant et brutes sont OK ; au-style, fiche, trait et légende sont sautés par le profil.
- `controle-panel.mjs` sur r4 et r4-a : PANEL ECHEC (ressemblance 0,92). C'est voulu : r4-a reprend r4, la diversité ne s'y mesure pas.
- Reste à rejouer par le pilote avec les outils d'o1 : panel, mots, contraste, profil sans-houblons ; aussi `controle-etats.mjs` si
  r4-a entre au registre.

## Captures (toutes ouvertes)
- Repos : `r4a-haut.png`, `r4a-page.png`.
- r4 et r4-a côte à côte, au repos : `r4-et-r4a-repos.png`.
- Ébullition à 120 min : `g1-ebullition-repos.png`, `g1-ebullition-pendant.png` (pouce tenu à 100, règle 0–120),
  `g1-ebullition-apres.png` (120 min, règle 0–150, ~6 L évaporés, ~30 L avant ébullition).
- Changement de fermenteur : `g2-fermenteur-repos.png`, `g2-fermenteur-pendant.png` (matériel déplié, « 60 » tapé),
  `g2-fermenteur-apres.png` (fermenteur 60 L, règle 0–65, conseil ~48, 36 L libres, cuve 45 L sur la même règle).
- Volume à 31 L dans 30 L : `g3-volume-repos.png`, `g3-volume-pendant.png` (pouce tenu), `g3-volume-apres.png` (« +1 L de trop » en
  rouge, ~34 L avant ébullition). Pendant et après se ressemblent : le curseur ne montre pas d'état « tenu » visible, sinon le pouce.
- Ordinateur : `ordinateur-1280-ebullition-120.png` (pointillés sous 24 et 120, règle « 150 › »).
- Repères dépliés : `reperes-ouverts.png`.
- Refaites après les retouches A à C et rouvertes : `r4a-haut.png`, `r4-et-r4a-repos.png`, `ordinateur-1280-ebullition-120.png` ; les
  g1 à g3 ont été rejouées dans le même passage.

## Prédiction
« Là c'est bien, je peux mettre 120 et changer de fermenteur. La cuve en dessous, c'est top. »

DÉCISION À PRENDRE : « ~27 L avant ébullition » vient de la greffe e2 (volume + évaporation). Le moteur de l'app compterait aussi
pertes et contraction (≈ 29 à 30 L ici) : au port, prendre le nombre du moteur. Le dessin ne change pas.
CONNAISSANCE : un curseur dont la règle s'étend ne doit pas recalculer sa borne pendant le glisser. Au premier essai, la borne suivait
la valeur sous le pouce, et le geste « 120 » finissait à 180.
LEÇON PROPOSÉE : aucune.

## Reprise
Ajouté par la voie p1-port (31.10) : l'inventaire `inventaire-r4a.json` (les 24 éléments ci-dessus) et ses marqueurs `data-element`.
- r4a-entete : repris — en-tête commun, inchangé
- r4a-fil : repris — fil des sept étapes, inchangé
- r4a-bandeau : repris — bandeau commun Grain OG IBU EBC
- r4a-nom : repris — nom pointillé en haut
- r4a-style : repris — pastille du style teintée
- r4a-plages : repris — pastilles OG et IBU sous le style
- r4a-puce-fermenteur : repris — puce tiretée dans l'en-tête du volume
- r4a-volume-champ : repris — grande lecture du volume, champ sur place
- r4a-libres : repris — ligne libres, plein ou trop
- r4a-piste-volume : repris — piste dorée et zone rouge
- r4a-conseil : repris — repère conseil sur la piste
- r4a-regle-volume : repris — règle par 1 L avec son chevron
- r4a-plein-retire : écarté — la phrase « Fermenteur plein » cède sa place à « +1 L de trop » et à la zone rouge (greffe g2, retouche du critique)
- r4a-cuve : repris — barre de la cuve sous la règle
- r4a-ebullition-champ : repris — grande lecture de l'ébullition
- r4a-curseur-ebullition : repris — curseur et piste de l'ébullition
- r4a-evaporation : repris — bulle des litres évaporés
- r4a-regle-ebullition : repris — règle par 5′ avec son chevron
- r4a-nolo : repris — interrupteur NOLO
- r4a-espace-libre : repris — demi-tuile espace libre
- r4a-reperes : repris — repères dépliés à un toucher sous Repères
- r4a-materiel : repris — demi-tuile matériel
- r4a-pied : repris — pied commun et lanceur
- r4a-etats : repris — annexe des états en bas de la page
