OK — 43 propositions : 8 couvertes, 12 à fusionner, 1 nouvelles, 10 savoirs, 12 sans suite

Tri des lignes `LEÇON PROPOSÉE` et `CONNAISSANCE` des RESULTAT.md de la mission (63 voies lues, 31 Ko). Une ligne = une proposition (plusieurs voies si
elles disent la même chose). Aucune écriture dans `cerveau/`. Budget : LECONS.md fait 168 lignes sur 170 et 20 leçons sur 30. Toutes les fusions
tiennent dans des lignes existantes (zéro ligne neuve) ; la seule entrée neuve, M16, ajoute 1 ligne (169) et se range en « Mécanisées » (5 sur 8).

## Déjà couvertes

- [p1-ma-biere] [p2-suggerer] « une carte ou un fil de fer n'est pas une base d'écran » et « ouvrir la capture choisie, la poser à côté dès le premier rendu » : L03 (sa maquette choisie, captures côte à côte) et la règle n° 1 de CLAUDE.md (D105).
- [p6-critique] un composant de l'app réemployé (Sheet, × de 16 px) apporte ses boutons hors contrôle de route : L26 (ligne du 24.10) et [[maquette-jouable]] « Pièges ».
- [p13-controles-etape] `String.replace` a mangé un `\s` et un `$&` : L26 (« sans remplacement de chaîne ») et [[poste-windows-msix]] (« Pas de Python… `String.replace` interprète `$` »).
- [p14-controles-fiche-fil] [p23-tickets] l'outil Bash retire les antislashs des regex en heredoc, le `\b` des CHECK : M10 et [[poste-windows-msix]] (« réduit les doubles barres », « Edit et Write décodent »).
- [p13-controles-etape] `-webkit-touch-callout` n'est pas calculé par Chrome, lire la feuille de style : déjà écrit dans `controle-appui.mjs` (l. 50 et 129).
- [p21a-etats-etape-biere-fiche] les inventaires `inventaire-*.json` ne relèvent que le repos, d'où les pans disparus sans alerte : L03 (« gestes compris ») et D124 (decisions.md l. 181).
- [p8-portabilite] la maquette se porte par déplacement (moteur sans alias, `configurerDonnees`, `toHopRecipe`, pile de navigation) : `parcours/ARCHITECTURE.md`, déjà lié par [[maquette-jouable]] « Vers l'app ».
- [p20-inventaire-rail] [p21b-etats-suggerer-comparer-acquis] « un inventaire se relève en jouant chaque geste » : D124 (decisions.md l. 181) et `controle-fonctions-rail.mjs` ; le principe général est repris dans M16 (section suivante).

## À fusionner

Chaque phrase tient en 25 mots ou moins ; aucune ne crée de ligne.

- [p3-comparer] dans **L17** (fin de « Faire ») : « Le dossier temporaire est partagé : chaque agent range ses fichiers dans un sous-dossier au nom de sa voie (`cap.mjs` écrasé, 24.10). »
- [e1-etalonnage] dans **L27** (« Faire ») : « Le pilote lance l'étalonnage sur le dossier d'épreuve seul ; l'agent qui a lu ou enrichi le jeu ne le refait jamais. »
- [fl-a] [fl-c] dans **L26** (« Faire ») : « Le socle prend son préfixe propre (`<id>s-`), distinct de celui du concept ; les modificateurs courts (`.c`, `.g`, `-top`) sont préfixés aussi. »
- [fl-passe2] [r6-substituer] dans **L05** (« Faire ») : « Jouer le contrôle de standard sur toutes les candidates ensemble (un houblon change de couleur) ; étendre la liste d'écrans (`FICHIERS`) dans la même voie. »
- [p25-controle-ibu] dans **L14** (« Faire ») : « Recouper aussi deux affichages issus d'un même nombre (IBU à grammes égaux, dose pour 60) : ni le critique ni COMMUN ne recomptent (sbz7). »
- [p2-suggerer] [p6-critique] dans **L13** (« Faire ») : « Un contrôle écrit avant son choix se rejoue sur la maquette choisie avant les GATES (G5) ; une plainte sur capture fixe se joue aussi au repos. »
- [p8-portabilite] dans **L11** (« Faire ») : « Un refactor « rien ne bouge » se prouve par un instantané du DOM (outerHTML, deux largeurs) avant et après chaque étape. »
- [r1-etape] dans **L12** (« Faire ») : « Avant de porter un code calibré, sonder hauteurs de texte et mouvement réduit des deux côtés (19 contre 22 px). »
- [p0-socle] [p1-ma-biere] [p24-controle-etats] dans **M10** : « Un script passé par `node -e`, stdin ou heredoc perd antislashs, backticks et `${…}` : Edit, Write ou heredoc `<<'EOF'` vers un fichier (6 voies). »
- [p5-parcours] dans **M10** : « `systeme.mjs cablage` ne couvre que les scripts de contrôle : un `\b` devenu 0x08 dans `parcours/outils/*.mjs` lui échappe ; étendre le périmètre. »
- [fl-d] [fl-z] [sb-a] [sb-c] [sb-d] [sb-z] [sb-tri] dans **M14** : « `controle-panel` ne voit pas les écarts < 60 au fond ni un bloc commun : dire le seuil au brief, une masse propre par concept, le jouer dès le premier concept. » Piste d'outil (sb-tri) : mesurer le bloc répété dans une série.
- [fl-tri] dans **M01** (note [[controles-mecanises]]) : « Le brief d'une série v0 cite D97 : `controle-valeurs-brutes` entre dans ses GATES et se rejoue sur le texte rendu, pas sur la NOTE. »

## Nouvelles leçons

- [p20-inventaire-rail] [p21a-etats-etape-biere-fiche] [p21b-etats-suggerer-comparer-acquis] [p22-commentaires] [r2-biere] [r3-fiche] [r4-suggerer] [r7-batterie] [p24-controle-etats] — neuf voies disent la même chose : le contrôle de reprise ne voyait que le repos, un seul échec, ou une seule page. Entrée « Mécanisée », 1 ligne, car `controle-fonctions-rail.mjs`, `controle-etats.mjs` et D124 la tiennent déjà :

  `- M16 (L03) — Un contrôle de reprise se joue geste par geste (repos, pendant, après), sur la base et sur la construction : le 24.10, les inventaires « au repos » ont laissé le rail perdre ses fonctions (D124 ; 10 écarts sur 18 en Suggérer ne se voyaient qu'après un geste). Un état déclenché ailleurs porte son `avant`, un fil n'est tenu que par le geste rejoué sur la dernière construction, et un contrôle qui s'arrête au premier échec en cache les suivants (« RAIL ECHEC 1 » en cachait 8). `controle-fonctions-rail.mjs`, `controle-etats.mjs` (trois témoins).`

## Savoirs durables

Notes neuves (en-tête `name`, `description`, `type`, `maj`, `sources` ; 50 lignes au plus) :

- [dh4a] [dh4b] [p0-socle] [jc-levure] [p4-dryhopper] [p1-ma-biere] [p2-suggerer] [p3-comparer] [r4-suggerer] — **nouvelle note `metier/moteur-parcours-limites`** (type metier), 8 lignes :
  - Le moteur ne simule l'arôme qu'à 60′, 10′, whirlpool, dry hop actif et après (`MOMENTS_SIMULES`, `moteur/index.ts` l. 107) ; entre deux, seule l'interpolation dessinée est honnête, et ailleurs l'écart est inconnu, jamais 0.
  - `effetLevure` et `lireBiere` ne modélisent pas l'arôme propre d'une souche : l'écart de levure se lit par `proposeVoies(…, { leviersLevure: true })`. Idaho 7 : Verdant et Diamond ne changent rien (centre 0 par convention, donc inconnu) ; seule Pomona bouge (~+13 agrumes, confiance faible).
  - La visée en palier absolu fait dépendre l'ensemble des voies de l'ampleur ({floral 0,57} perd 5 voies sur 13 face à {floral 1}) : lire la visée en crans entiers.
  - Avec { floral 1, citrus 1, resin −1 } et `leviersLevure`, `proposeVoies` redonne exactement le cas c1 de q2b : reproductible en direct, sans grille figée.
  - Stout 16D à 4 g/L : le floral gagné est le même à 10′ et au whirlpool (écart < 0,05 cran), seul l'IBU les sépare (~37 contre ~15 pour Idaho 7). Galaxy : le moteur simule 18,9 sur 100 de baies alors qu'aucune fiche ne les cite, la stout y est inconnue : l'écart d'une bière inconnue se mesure depuis 0.
  - Sources : p3-comparer, p4-dryhopper, r4-suggerer, dh4a (RESULTAT.md).
- [p1-ma-biere] [sb-a] [sb-b] [sb-c] [sb-d] [sb-u] [sb-z] [r6-substituer] — **nouvelle note `metier/substitution-moteur`** (type metier), 7 lignes :
  - À 60′ (poids amertume 0,6, arôme 0,2, huiles 0,2) l'« arôme » de `substitutes()` mesure l'absence d'arôme étranger, pas la ressemblance : Nelson Sauvin vaut 100 en perdant six familles, Magnat 99 avec des silhouettes différentes. Jamais l'afficher seul comme ressemblance.
  - Stout 16D, Nugget : aucun remplaçant en stock ne baisse le résineux de plus de ~1 point (reste hors style, 82 à 85) ; Substituer ne répond pas à « moins résineuse », le choix se fait sur amertume, matière et stock. Au 60′ : 137 remplaçants très proches ; dès 10′ (arôme 0,6), 8, et Nelson Sauvin passe de 86 à 42.
  - Au whirlpool l'ordre s'inverse : Target 86, Idaho 7 82, Magnat 77, Nelson Sauvin 42 (sb-c) ; sur 318 il passe de la 73e à la 236e place (sb-z), Target (94, 213e) et Citra cryo (88, 215e) sont « chers pour amériser ».
  - Outil : `vite-node --root C:/Users/mrspa <script.ts>` fait tourner `substitutes()` hors du projet (le root large lève `server.fs`).
- [fl-a] [fl-b] [fl-c] [fl-d] [fl-u] — **note existante [[descripteurs-hors-familles]]**, +2 lignes sous « Constat » : la ligne Hopsteiner « Familles déclarées sur houblon brut » est un classement, pas des mots sentis : elle fournit seule l'Agrumes et l'Épicé de Nelson Sauvin, l'Herbacé de Cascade, l'Épicé de Nugget et le Fruité de Motueka et de Cascade (une liste « les mots d'abord » doit dire « classé »). « Vin blanc » est le premier mot des deux fiches de Nelson Sauvin (7 houblons sur 318), et ses remplaçants calculés (Boomerang, Herkules, Phoenix, Pacific Jade) ne disent ni vin blanc, ni raisin, ni groseille. Nugget : 16 mots, 6 précis, tous de Beer Maverick sauf « pineapple ».
- [p4-dryhopper] [p0-socle] [p2-suggerer] [p8-portabilite] — **note existante [[cout-calcul-moteur]]**, +4 lignes « Mesures dans le parcours (24.10) » : recalcul de Ma bière 1,1 ms médian dans Chrome, geste 3,7 ms (24 ms au plus pour Suggérer et ses 9 candidats) ; `proposeVoies` à froid 90 à 130 ms ; frise de Dryhopper 40 ms à l'ouverture (30 `lireBiere`) puis 0,9 ms par cran ; préchauffer au repos fait passer les touchers froids Suggérer et Substituer de 798/728 ms à 288/184 ms.
- [p1-ma-biere] [p4-dryhopper] [p5-parcours] [p11-controle-retour] [p12-controle-traits] [p17-fiche-annuler] [p19-controle-rail-froid] [p24-controle-etats] [r3-fiche] [r4-suggerer] [r7-batterie] [sb-b] [sb-z] [fl-u] [pg-choix] — **nouvelle note `agents/pieges-controles-maquette`** (type agents), 12 lignes, une par piège :
  - `sr-only` rogné à 1 px se mesure à pleine largeur (`Range.getBoundingClientRect`) : D56 et le compteur de mots le prennent pour du texte ; police à 1 px (p1).
  - Une mesure de position pendant un geste exige `transition: none` sur l'élément (loupe ×2,7 au lieu de ×25, p4) ; la base se réorganise sous le doigt : lire les repères en direct, jamais au repos (p19) ; l'en-tête n'est pas le même bloc d'un onglet à l'autre (41 px contre 33 + onglets, p11).
  - Mesurer le dépassement du corps sous un pied fixe (`scrollHeight` contre `clientHeight`) quand on agrandit un pied (Dryhopper, D35, p17) ; `controle-annuler` lit `[data-role]` comme un bouton : le pied porte `data-pied` (p17).
  - `controle-rail` lit une classe contenant « loin », « autre » ou « hors » comme une graduation hors segment ; `aria-valuetext` : `controle-fonctions-rail` veut « J+3 », `controle-rail --parcours` « actif … 3 j » (r7).
  - `controle-fiche` ferme avec le premier `[data-role="fermer-fiche"]` du document : une seule boîte de dialogue remplie à l'ouverture (sb-b) ; il exige qu'un toucher court n'ouvre pas la fiche, donc une page « fiche ouverte » échoue par construction (la base `consolide/fiche.html` aussi) : écrire la convention au brief ou donner au contrôle un mode `--fiche-ouverte` (fl-u).
  - Chrome déporte un appui long vers le bouton voisin (le « ? » à 8 px) si l'élément touché n'a pas d'écouteur de clic : un écouteur vide sur chaque `[data-houblon]` rétablit la fiche (sb-z).
  - Sous une feuille vaul, `PageShell` rend le voile `inert` : `elementFromPoint` y rend `<html>` ; viser un voile rendu au toucher (r3).
  - Un état relevé sur une page « déjà ouverte dans cet état » (biere-radar.html, suggestions-radar.html) se rejoue avec le geste qui y mène, ou porte son `avant` / `page_construite` ; sinon il devient injouable (r2, r3, r4). Piste d'outil : `controle-etats` signale un état « repos » dont `page_choisie` diffère de la page de repos de l'écran (r4).
  - Un état d'un contrôle d'états se prouve par trois témoins (choisies, perdante, `--repli`) ; un sélecteur vient d'une page jouée, jamais d'un nom deviné (p24).
  - Un script de parcours qui prend ses sélecteurs dans les écrans casse en silence quand l'écran change de base : lire d'abord `jeu.mjs` et NOTE.md ; un script qui ne joue que les gestes par défaut ne prouve rien (p5).
  - Ajouter un contrôle à `portee-defauts.json` fait échouer le témoin « voie avec ses contrôles » : faire dériver la liste du témoin de la portée, au lieu de la recopier (p11, p12).
  - `verifier-page.mjs` plafonne une page à 16 384 px de haut au téléphone : au-delà d'environ 20 captures de 775 px, passer en bandes défilantes (pg-choix).
- [dh4a] — **note existante [[pictos-familles]]**, +1 ligne : le contrôle STANDARD S4 mesure le trait affiché (attribut × taille) sans tenir compte de `vector-effect` ; un picto réutilisé à plusieurs tailles porte donc un trait calé sur la plus grande.
- [r5-comparer] — **note existante [[poste-windows-msix]]**, bullet « Compteur de mots » : il compte aussi tout texte dont le haut est < 844 px (sous le dock fixe), `{a}/{b}` en JSX fait deux mots, et une ligne ajoutée en tête pousse les étapes sous le cadre défilant (`controle-comparer-etapes` exige leur centre dans `main`).
- [fl-z] — **note existante [[saisie-mobile]]**, +1 ligne : un voile de fermeture sous le doigt reçoit le `click` synthétisé à la fin d'un appui long et referme la feuille aussitôt ouverte ; tout appui long qui ouvre une feuille ignore le click suivant (fenêtre de 600 ms).
- [r1-etape] — **note existante [[verification-locale]]**, +1 ligne « Mesurer dans le navigateur » : la règle globale `prefers-reduced-motion` de l'app (`src/index.css`) supprime aussi les fondus d'opacité, et Chrome sans écran se déclare en mouvement réduit.
- [jc-pastille] [jc-graphes] [r2-biere] — **note existante [[maquette-jouable]]**, +3 lignes : (jc-pastille) Échap sans feuille ouverte fait reculer d'un écran ; tout élément ajouté qui s'ouvre au toucher intercepte Échap en capture (`keydown`) ; (jc-graphes) figer le DOM rendu (outerHTML et `style.css` copiée) donne une copie exacte d'un écran choisi, en renommant `data-houblon`, `ligne-houblon`, `legende` et les id de React ; (r2-biere) le radar Ma bière de la base v4.10 (choix m4) trace la dégustation notée de la grille (−1 à 3, pas senti sur l'anneau du zéro, pas goûté au centre), pas le profil simulé.

## Sans suite

- [p1-ma-biere] [p3-comparer] l'écran du dessous reste monté et fausse les mots du dessus : corrigé par le socle le 23.10 (un écran par route).
- [p19-controle-rail-froid] un critère `appels … --rejouer` qui contient le nom du script boucle : corrigé dans `appelsDansGates` (systeme.mjs l. 480, « un critère qui lance lui-même le rejeu n'est pas un appel »).
- [p7-implementation] `ARCHITECTURE.md` affirmait la navigation sur `useFullScreenRoute` et des dossiers inexistants : corrigé, la table des places porte la colonne « Vérifié » (l. 21 à 24).
- [jc-levure] défaut de code, pas de savoir : `.pq-suggerer-trait-hors` (suggerer.css l. 21) est écrasé par `.pq-suggerer-trait` (l. 78), donc les traits « hors style » s'affichent noirs. **Toujours présent** : à corriger dans r4 (pilote), pas dans le cerveau.
- [p10-controle-visee] liste des `data-*` que la maquette publiée n'a pas encore : contrat de `controle-visee.mjs`, propre à cette voie.
- [p20-inventaire-rail] [p21b-etats-suggerer-comparer-acquis] les 37 fonctions du rail et les écarts de 5345f6ad (barre l5b devenue rail, deuxième groupe supprimé) : données de la voie, déjà dans `inventaire-rail.json` et D124.
- [p22-commentaires] 23 fils « open » sur 56 sont tenus dans la maquette : état daté du 24.10, à relire dans les tickets (le principe « relevé sur le rendu » est dans M16).
- [p2-suggerer] la tête d'un outil passe par `mobileHeader` de PageShell : à porter via une prop `header` ; relève de la NOTE.md de l'écran (« Pour l'app »).
- [p5-parcours] chiffres d'un rejeu sur fixture (Idaho 7 à 80 g : floral ~1,6 à ~23,7 ; Nugget par Galaxy : IBU 59,73 à 60,13) : valeurs datées de la voie, pas un fait de métier.
- [sb-a] [sb-c] stocks de la fixture (Nugget épuisé à 0 g ; Nelson 100 g contre 0 g dans `socle-w.mjs`) : propres aux séries du lot 21.
- [e1-etalonnage] le jeu d'étalonnage n'a aucune capture de d332792c ni de la version 24.10 avant D123 : lacune à combler dans le jeu lui-même (`systeme.mjs etalonnage`), pas dans le cerveau.
- Voies sans proposition (« aucune » aux deux lignes) : [p9-controle-etapes] [p15-controle-annuler] [p18-cote-a-cote] ; [p12-controle-traits] et [p14-controles-fiche-fil] sans connaissance (leur leçon est traitée plus haut) ; [dh4b] [jc-pastille] sans leçon (connaissance traitée plus haut).

CONNAISSANCE : aucune (les savoirs sont dans « Savoirs durables »).
LEÇON PROPOSÉE : aucune de plus que M16 ci-dessus.
DOUTE : les fusions L13 et M10 portent chacune deux phrases ; le pilote peut les condenser. Défaut de code toujours présent : suggerer.css l. 21 contre l. 78 (traits hors style noirs).
