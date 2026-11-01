PRÊT À MONTRER — r4e-a et r4e-b : chaque besoin à la volée (part, moment et jour, couleur « ? », masse, retrait, ajout, nom → détail) en 1 toucher sur la ligne, plateau toujours visible, tout r4d gardé ; 0 bloquant, 0 majeur, 6 détails (2 à corriger en une ligne chacun, dans les deux)

Critique t5 (Fable calibré, PORTRAIT v2), 31.10. Lu : VOIE.md p5, RESULTAT.md p5, VERDICT-v3, NOTE r4d, D211 et D212, SPEC § Malts/sucres.
Captures de la voie ouvertes une à une (L12) : les 9 de r4e-a et les 9 de r4e-b, r4d-repos en face. Page jouée moi-même (script du scratchpad,
hors dépôt) : fermentation sur la ligne, `#huit`, `#fruit` pour chaque variante ; mesure des textes (< 12 px) et des cibles de liste (< 24 px) en
repos, fermentation, 8 grains, fruit. Contrôles rejoués depuis la racine : `controle-volee.mjs` a VOLEE OK (10), b VOLEE OK (10), témoin r4d
VOLEE ECHEC 6 ; `controle-gestes-ligne.mjs` a GESTES OK (8), b GESTES OK (8).

## Ce qui vaut pour les deux
- **Règle n° 1 (D105)** : r4d reprise telle quelle hors des gestes. En-tête, fil, bandeau « Grain · OG — · IBU · EBC », teinte hachurée puis en
  dégradé, ticket et puces, carte des repères (rendement 75 %, style 1,060–1,085, « 3 couleurs à renseigner », échelle 6–14), plateau clair avec − +,
  piste et pouce noir, pied Retour / Suivant, + flottant, sucre en ligne (Dextrose « 100 % ferm. », Lactose « 0 % ferm. » et son bandeau), famille figée,
  « J+3 » sur une ligne en fermentation, pilules rose (ébullition) et verte (fermentation) : déjà dans r4c (même règle CSS, ligne 242), pixel pour
  pixel à l'œil sur r4e-x-repos / r4d-repos, r4e-x-1280 / r4d-1280, r4e-x-huit / t4-huit. Seuls écarts visibles au repos : un chevron (a) ou ⇄ (b)
  après le moment, le chiffre de la part à 16 px (a), une encoche noire au bout de la barre (b). Chacun est le geste qu'il a demandé (D211) : il le
  reconnaîtra.
- **D212** : le plateau est visible dans toutes les captures et dans les 6 états joués ; `#replie` n'existe plus (capturer.mjs le vérifie).
- **Mesures** : 0 texte sous 12 px, 0 cible de liste sous 24 px (18 cibles à 3 lignes, 44 à 8), lignes de 50 px (47–48 à 8 grains), pied à 769 px au
  repos (0,91 écran) et 864 à 8 grains (1,02 ; r4d 0,95, plafond 1,05). Mots au premier écran : 73 (a), 76 (b), r4d 76.
- **Détail n° 2 de t4** (saut de liste au retrait) : réglé. La place laissée fait 46 px pour une ligne de 50 ; Haferflocken monte de 2 px au lieu de 16
  (r4e-a-retrait-apres, r4e-b-retrait-apres : 501 → 497 ×2).
- **Hérités, pas des écarts** : pendant un réglage sur Weizenmalz, le cadre et le plateau restent sur Pilsner (t4 n° 5, consigne du pilote) ; à 8
  grains le + flottant couvre le « 8 » de la piste du plateau (déjà dans r4c, t4-huit).

## r4e-a — le chiffre se tape, le mot ouvre son menu sous la ligne

### 1. Chaque besoin en 1 toucher, sans le plateau
| Besoin | Geste | Preuve |
|---|---|---|
| Part | 1 toucher sur « 19 », « 30 », Entrée ; la masse suit (2,79), le grain passe à 9,29, Pilsner 54 %, Hafer 16 %, leurs masses inchangées | r4e-a-part-pendant, r4e-a-part-apres |
| Moment et jour | 1 toucher sur « empâtage ⌄ » : trois pilules dans la ligne, sous elle ; 1 toucher sur « ébullition » ; le jour se tape dans « fermentation J+[3] » | r4e-a-moment-pendant, r4e-a-moment-apres ; fermentation jouée : « J+3 ⌄ » sur la ligne |
| Couleur « ? » | 1 toucher sur « ? », « 8 », Entrée : pastille dorée, barre de la ligne dorée, segment doré dans la teinte, « 3 → 2 couleurs à renseigner » | r4e-a-couleur-pendant, r4e-a-couleur-apres |
| Masse | comme r4d (contrôle GESTES, masse 2,5 jouée par capturer.mjs) | r4d-masse-pendant (inchangé) |
| Retrait | × puis « Annuler » 6 s, ligne barrée « retiré », grain 6,5 kg, parts recalculées (77 / 23) | r4e-a-retrait-apres |
| Ajout | champ du ticket, comme r4d (contrôle GESTES) | — (D207) |
| Nom → détail | 1 toucher sur le nom déplace le plateau (contrôle DETAIL 390 et 1280) | r4e-a-1280 |

### 2. Tout r4d gardé : oui (voir « Ce qui vaut pour les deux »).

### 3. Densité, hiérarchie, mots
Deux grands nombres par ligne (« 63 » et « 5,0 », tous deux mono 16 px) : la part pèse autant que la masse. À 8 grains (joué) la colonne 55 / 17 / 17 / 6 /
3 / 3 se lit comme un tableau : dense, mais chaque chiffre répond à « combien » (PORTRAIT § 1.2, il prend le dense utile). Le menu du moment pousse
Haferflocken de 46 px : il reste collé à sa ligne, rien ne sort de l'écran. 73 mots, aucune phrase d'aide.

### 4. Sa phrase
« Là oui : je tape le %, je prends le moment dans la ligne et je mets la couleur sans ouvrir le plateau. Par contre 2,79 kg, arrondis-moi ça. »

| n° | gravité | état et largeur | écart (capture) | correction attendue |
|---|---|---|---|---|
| a1 | détail, à corriger | part pendant et après, 390 et 1280 | La masse qui suit la part s'écrit à 10 g (« 2,79 kg », grain « 9,29 kg ») alors que toute la page écrit 1 décimale au-dessus de 1 kg (r4e-a-part-pendant). b arrondit au cran de la piste (« 2,8 », « 9,3 »). | Arrondir la masse déduite au cran de la piste (50 g sous 1 kg, 100 g au-dessus), comme b ; une ligne dans le calcul de la part. |
| a2 | détail, à corriger | couleur pendant, 390 | Le « ? » devient un champ de 50 × 28 px : le nom et le rang du dessous sautent de 28 px à droite sous le doigt (r4e-a-couleur-pendant, Weizenmalz passe de 100 à 156 ×2). « Je pose le doigt et je regarde ce qui bouge » (PORTRAIT § 3.5). | Champ de la largeur de la pastille (36 px, deux chiffres suffisent ; « 1500 » défile) ou champ en superposition de la pastille : la ligne ne bouge plus. |
| a3 | détail (goût prêté, L27) | repos, 390 et 1280 | La part à 16 px rivalise avec la masse ; r4c l'avait en gris 12 px. C'est le prix d'un champ qu'on tape sans zoom (DESIGN.md, 16 px). | Aucune avant qu'il le dise. Si « trop de chiffres » : part en 14 px mono et gris, passée à 16 px au toucher seulement. |

## r4e-b — la barre se tire, le mot tourne d'un toucher

### 1. Chaque besoin en 1 toucher, sans le plateau
| Besoin | Geste | Preuve |
|---|---|---|
| Part | le doigt tire la barre : pendant, barre épaisse et pouce noir, « 30 % du grain » et « 2,8 kg » en gras, grain 9,3, Pilsner 54 %, Hafer 16 % ; après, encoche à 30 % | r4e-b-part-pendant, r4e-b-part-apres |
| Moment et jour | 1 toucher sur « empâtage ⇄ » : la ligne lit « ébullition ⇄ », « Annuler » 6 s à la place de la part ; 2e toucher : « J+[3] » (le jour se tape dans la pilule) | r4e-b-moment-pendant, r4e-b-moment-apres ; fermentation jouée : « J+3 · Annuler » |
| Couleur « ? » | comme a | r4e-b-couleur-pendant, r4e-b-couleur-apres |
| Masse, retrait, ajout, nom → détail | comme r4d et a | r4e-b-retrait-apres (6,5 kg, 77 / 23), r4e-b-1280 |

### 2. Tout r4d gardé : oui. Les lignes sont celles de r4d au pixel près, plus l'encoche et le ⇄.

### 3. Densité, hiérarchie, mots
La plus proche de r4c au repos : un seul grand nombre par ligne, la part reste en gris 12–13 px. Barre : 84 × 24 px à 390 (mesuré), soit 1,2 % par
pixel ; le % se lit pendant le glissé et la masse tombe au cran de la piste. Un toucher sans glisser ne change rien (RESULTAT, contrôle). 76 mots.

### 4. Sa phrase
« C'est rapide, un clic et c'est à l'ébullition. La barre c'est joli mais elle est petite pour mon pouce, et pour revenir à l'empâtage faut faire le tour. »

| n° | gravité | état et largeur | écart (capture) | correction attendue |
|---|---|---|---|---|
| b1 | détail (coût du geste, pas une faute) | repos, 390 | La barre fait 84 px pour 0–100 % : un % précis (« 30 % de blé » d'une recette) ne se pose pas au doigt ; il faudrait le plateau ou la masse. Aucune règle ne fixe une largeur de curseur ; D46 (fluidité) n'est pas en cause, la barre suit le doigt. | Aucune pour le choix : c'est l'axe de la variante. Greffe possible (page de choix, L24) : accepter aussi la frappe du % de a sur la même ligne ; les deux gestes tiennent sans rien ajouter au repos. |
| b2 | détail, à corriger | moment pendant, 390 | « Annuler » prend la place de « 19 % du grain » pendant 6 s et la barre se raccourcit (r4e-b-moment-pendant) : la part disparaît à chaque toucher, et le cycle en demande deux pour revenir à l'empâtage depuis l'ébullition. | « Annuler » à la place du × (comme au retrait : même doigt, même endroit) ou après la barre ; la part et la barre restent lisibles. Une ligne de gabarit. |
| a2 | détail, à corriger | couleur pendant, 390 | Même saut de 28 px que a (r4e-b-couleur-pendant). | Même correction que a2. |

## Laquelle montrer en premier : r4e-a
- Rien n'y change sans qu'il ait vu les choix : le menu montre les trois moments et le jour, le % se tape comme on lit une recette. b change le moment
  au toucher sans montrer les autres (le ⇄ l'annonce, « Annuler » rattrape) : « ce qui sort de nulle part » le fait tiquer (PORTRAIT § 4), même si ici
  rien ne sort vraiment.
- Sur sa plainte mot pour mot (« modifier sans ouvrir une sous vue »), a est complète pour une recette recopiée ; b laisse le % précis au plateau.
- b garde pourtant deux idées à greffer sur a, à proposer côte à côte sur la page (L24) : la barre tirable (en plus de la frappe) et le ⇄ comme signe
  du cycle sur le bouton de famille. Il voit les deux, il mélange, il choisit.

Pas de REJET : aucun refus de SPEC ni de DEFAUTS ne revient (pas de `type="number"`, pas de surbrillance système, pas de dialogue, pas de texte
d'aide au repos, pas de cockpit : un chevron ou un ⇄ par ligne, rien de plus). a1, a2 et b2 sont des retouches d'une ligne, à faire par le pilote avant
la page de choix ; a3 et b1 se disent sur la page en une ligne chacun.

LEÇON PROPOSÉE : aucune
