# Lot 20 · L'outil de dry hop, de biotransformation et de levure, en mini maquettes

Maquettes statiques, en français. Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
Écris seulement dans `work/refonte-frontend/v4/ecran-1/fils20-dryhop/<ta variante>/` et `fils20-dryhop/captures/`.
**Pas de code de l'app** : la porte B reste fermée.

## Ce que le brasseur a dit (19.10, soir)

- « Comment choisir deux houblons ? La chose a été sur simplifier ».
- « citra aura un effet extrêmement differents en dry hopping que cascade alors que pourtant d'après Nos outils ils sont assez similaire ».
- « Citra et Cascade se ressemblent par les mots -> il faut quand même que notre modèle arrive justement à différencier ces deux houblons très différents... ».
- « Aussi ils nous faut un outil de dry hopping, bio Transfo, levure, ça a été demandé, c'est toujours pas là ».
- « voir ce que ça change si je fais du dryhop de citra, Galaxy, idao7. Et combinaison de 3j dryhopping Citra, 7j dry hopping Galaxy ; 3j citra - 5j idao7 […] C'est extrêmement complexe à voir ce qui est vraiment faisable ».
- « simuler un moteur […] avec des intervalles de confiance […] une estimation de pouvoir d'arome sur les 16d ».
- « Pourquoi à 10' pas à 60 ? Aussi ? ».
- « Enrichit les des mini maquettes pour mettre en valeur tout ça ».

## À lire d'abord

- `work/refonte-frontend/v4/recherche/H-choisir-deux-houblons.md` : sections 0, 1, 7 et 8, et la table « faisable / pas faisable ». **Tous tes chiffres viennent de là.** Chaque valeur que tu montres porte sa source (le numéro [n] de H) et son niveau ([P], [F], [S]).
- `work/refonte-frontend/v4/ecran-1/fils19-choix/MOTEUR-POUVOIR.md` : la spécification du moteur. Tu montres ce qu'il calculera. Formules : charge = dose × huile × fraction ; concentration = charge × part retrouvée ; rapport au seuil = concentration / seuil. Toujours en plage, jamais en intensité 0–100.
- `fils19-choix/DIAGNOSTIC.md` : le témoin. Le modèle actuel donne les mêmes agrumes à Citra et à Cascade.
- La priorité du projet, dans `.claude/rules/affinee-frontend.md`, et les parties utiles de `PRODUCT.md`, `DESIGN.md` et `docs/ui-compacte.md`. Densité utile sur mobile, peu de texte, pas de légende écrite.
- Le style :
  - la base v4.10 (`ecran-1/base/consolide/etat-b.html`, q2b intégré) ;
  - les icônes v3 duo (`fils17-standard/v3/planche.html`) ;
  - les tons des familles (`fils17-standard/jetons-familles.json`) ;
  - les pictos (`fils15-s5-complexe/pictos-familles.html`).
- Le moteur réel est en cours dans le prototype (`prototypes/houblons-v4/src/engine/pouvoir.ts`). Quand ses sorties existeront (`fils19-choix/donnees/*.json`), tes générateurs devront pouvoir les relire. Range donc tes chiffres dans un seul fichier `fils20-dryhop/donnees-h.json`, avec leurs sources, et fais lire ce fichier à ton générateur.

## Les six variantes (ton message te donne les tiennes)

- **d1 · Planificateur de dry hop** :
  - une frise de jours (J0 → J14) où l'on pose ses ajouts : Citra 3 jours puis Galaxy 7 jours ;
  - en dessous, la lecture par composé (linalol, géraniol, 4MMP, 3MH, myrcène) : charge cumulée et rapport au seuil, en plages ;
  - les drapeaux :
    - au-delà de 3 jours, pas d'arôme mesuré en plus, mais végétal et hop creep ;
    - zone de saturation 4–8 g/L (preuve : Cascade seulement) ;
    - ordre des ajouts et synergie « inconnus ».
- **d2 · Citra contre Cascade, moment par moment** : 60′, 10′, whirlpool, dry hop actif, dry hop après. On doit voir l'écart quasi nul à 60′ (« surtout de l'amertume ») grandir jusqu'au dry hop, par famille, avec le marqueur cité (4MMP → tropical et cassis, linalol → floral et agrumes, farnésène → boisé et vert). Et le témoin : « le modèle actuel les donne identiques ».
- **d3 · Le pouvoir aromatique face à la 16D** :
  - pour chaque houblon de ses cas (Citra, Galaxy, Idaho 7, Cascade) à une dose, une lecture ordinale : sous, autour ou au-dessus du seuil (×N, en plage) ;
  - face au style : « arôme de houblon faible et facultatif » (BJCP 2021) ;
  - la mention « perception en bière noire non documentée ; pars de ta dégustation ».
- **d4 · Levure et biotransformation** : on choisit sa levure (US-05, Verdant IPA, Pomona, Diamond) et le moment (fermentation active ou après). On lit ce qui change :
  - le géraniol vers le citronellol (Pomona « medium ») ;
  - la libération des thiols à partir des précurseurs (0,01–0,35 %, sur précurseur synthétique) ;
  - le hop creep ;
  - le cas de Diamond (le plus de thiols mesurés, pas le plus de fruité perçu).

  Ce sont des drapeaux, jamais des chiffres inventés.
- **d5 · Le lot avant la variété** :
  - le certificat du lot (huile totale, HSI) change les plages ;
  - la variabilité est visible : géraniol de Cascade ×13 d'un lot à l'autre ; intensité de Cascade de 6 à 9,5 sur 15 à dose égale ;
  - les classes de HSI et la perte d'α.
- **d6 · Ce que l'outil sait vraiment** : la table « faisable / pas faisable » de H, mise en écran. Pour chaque question du brasseur, le type de réponse (chiffre en plage, sens, drapeau, inconnu), en pictos et en formes, pas en paragraphes. Un toucher montre la preuve.

Sois créatif dans la forme, sobre dans le texte. L'orangé #c2410c ne sert qu'à « hors du style » (ici : au-dessus de ce que la 16D attend). Une valeur inconnue n'est jamais 0.

## Livrable et contrôles

Dans `fils20-dryhop/dN/` : `etat.html` (l'écran), `NOTE.md` (trois lignes : ce qui tient, ce qui casse, ce qui reste inconnu), et ton générateur.

Avec `O = work/refonte-frontend/v4/tournoi/outils` et `D = work/refonte-frontend/v4/ecran-1/fils20-dryhop` :

1. `node O/capture-page.mjs D/dN/etat.html D/captures/dN-390.png 1688`, puis **regarde la capture**.
2. `node O/mots-premier-ecran.mjs D dN --max=70 --page=etat.html` → `MOTS OK`.
3. `node O/controle-sens-survol.mjs D dN --pages=etat.html` → `SURVOL OK`.
4. `node O/controle-standard.mjs D/dN/etat.html` → `STANDARD OK`. Mets `data-famille` sur chaque élément de famille, et `data-couleur` avec `data-houblon` sur chaque élément de houblon.
5. `node O/controle-gros-blocs.mjs D dN --page=etat.html` → `BLOCS OK`.
6. **Honnêteté des chiffres** : chaque chiffre affiché porte, dans son élément, `data-source` (le [n] de H) et `data-niveau`. Une valeur inconnue porte `data-inconnu` et le mot « inconnu », jamais 0.
7. Les contrastes : chaque texte atteint au moins 4,5:1 sur son fond réel. Mesure-le, et écris le pire cas dans la NOTE.

Réponse finale : une ligne par variante (ce qui tient, ce qui casse, les contrôles).
