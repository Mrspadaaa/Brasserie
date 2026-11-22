# Test d'écran — Fermentescibles (Malts/sucres), app réelle, 07.11

Version : `065a3102` (HEAD du worktree `openai-clean-start`), instantané construit en mode développement dans
`%TEMP%/affinee-fermentescibles-dist` (seul moyen de garder `?dev-local` ; `zxing-wasm` et `pdfjs-dist`, déclarés dans package.json
mais jamais installés dans le node_modules partagé, externalisés par `vite.ferm.config.mjs` ; ils ne servent qu'à la Dépense), servi par
`vite preview` sur 4319. Chrome sans écran, 390 × 844 tactile (échelle 2) et 1280 × 800, thèmes clair et cave. 148 captures dans
`captures/`, mesures DOM par capture dans `mesures.json` (débordement, textes bruts, pied, champ actif, `input[type=number]`, console) :
aucun débordement horizontal, aucun NaN/undefined/null, aucun `type="number"`, aucune erreur de page sur les 148.

**Données.** Sans jeton, Firestore refuse tout : le vrai chemin (menu → Actions rapides → Créer une recette → fil « Malts/sucres ») donne
un stock vide. Les états remplis viennent du banc `?malts=` (noms Weyermann réels, stock simulé de la maquette s1). Son stock réel n'a pas
été vu : L2, L3, L4 et L7 n'ont pas pu être rejoués (voir plus bas).

**Référence (règle n° 1)** : `v7/s1/p7-s1-ouverture-pendant.png` et les captures `v7/s1/*` ; l'app est sa maquette au repos, à
l'ouverture, à la barre tirée, au moment tourné, au retrait, en sucre, en fruit, à huit grains, aux deux largeurs. Les écarts ci-dessous
sont ceux qu'il verra.

## Problèmes (15, dont 3 bloquants)

| n° | État et geste | Largeur, thème | Ce qui ne va pas | Capture | Gravité | Contrôle qui l'aurait attrapé |
|---|---|---|---|---|---|---|
| 1 | Plateau, toucher la pastille « empâtage ⌄ » (L1) | 390 cave (idem clair, 1280) | Un chevron de menu, mais le toucher écrit : Weizenmalz passe en « ébullition » sans menu, « Annuler » 6 s sur la ligne. Modification involontaire. **L1 confirmé.** La pilule est dans sa maquette s1, mais sa plainte du 07.11 prime. | `captures/34-plateau-moment-tourne-t390-cave.png` | bloquant | Nouveau : « toute pastille à chevron ouvre un menu et n'écrit jamais au premier toucher » : après un toucher sur `.fer-bmo`, `use` inchangé et un `[role=menu]` ouvert ; à ajouter à `controle-moment-ligne.mjs` (plateau compris) |
| 2 | Ajout, taper « Malt essai 10 », Entrée | 390 clair | Le nombre de fin de nom devient la masse : « Malt essai » à **10,0 kg**. Un brasseur qui tape « Crystal 60 », « Carafa 3 », « Munich 10 » obtient 60 kg, 3 kg, 10 kg. Valeur fausse. | `captures/97-dix-huit-lignes-t390-clair-pleine.png` (ligne « Malt essai 10,0 kg ») | bloquant | Test unitaire de `lireAjout` : « Crystal 60 » → nom « Crystal 60 », kg `null` (la masse n'est lue qu'avec « kg » ou après un nom connu) ; `controle-recherche.mjs` : « Carafa 3 », Entrée → ligne « Carafa 3 » à 0 kg |
| 3 | Ajout, taper « 0,2 », Entrée | 390 clair | Crée un ingrédient nommé « 0,2 » (stock à zéro, article de stock créé). Un chiffre tapé dans le mauvais champ devient un produit. | `captures/97-dix-huit-lignes-t390-clair-pleine.png` (ligne « 0,2 · 0 kg ») | bloquant | `Ajout.creer` refuse un nom sans lettre ; `controle-recherche.mjs` : « 0,5 », Entrée → rien d'ajouté |
| 4 | Ajout en famille Grain, taper « dext » | 390 clair | Propose **Carapils** (faute à une lettre), aperçu « Carapils ↵ » : Entrée ajouterait Carapils. Dextrose, au rayon Sucre, n'est pas proposé ni la bascule suggérée. | `captures/16-dext-en-grain-t390-clair.png` | gênant | `controle-recherche.mjs` : un nom d'un autre rayon propose l'article de l'autre famille (ou « Créer »), jamais un rang 4 seul en tête |
| 5 | « 3 couleurs à renseigner », taper 2000, Entrée | 390 clair | Hors de 1–1500 : rien n'est dit, la chaîne saute à Haferflocken, Weizenmalz reste « ? ». La valeur disparaît en silence. | `captures/44-couleur-2000-t390-clair.png` | gênant | `CouleurChamp` : `aria-invalid` et le champ reste sur la ligne ; contrôle : après « 2000 », Entrée, le champ est encore sur la même ligne |
| 6 | Deux × de suite (Pilsner, puis Weizenmalz) | 390 clair | Le second retrait remplace le premier : Pilsner (5 kg) est perdu sans « Annuler ». Un « Annuler » seulement, pour le dernier. | `captures/52-deux-retraits-t390-clair.png`, `53-tout-retire-t390-clair.png` | gênant | `controle-gestes-ligne.mjs` RETRAIT : deux retraits → « Annuler » rend les deux lignes |
| 7 | Ouverture du champ, huit lignes, hors ligne (L6) | 390 clair et cave | Le « + » flottant couvre le « + » du plateau, « kg », le bout de la piste (« 8 › ») et le texte de l'alerte lactose ; au repos il est collé à « Suivant — Houblons ». **L6 confirmé.** | `captures/11-ouverture-t390-clair.png`, `80-huit-t390-clair.png`, `97-…pleine.png`, `99-hors-ligne-t390-clair.png` | gênant | `verifs.plateauEntier` de `capturer-malts.mjs` étendu : aucun bouton du plateau, aucun texte d'alerte sous `[aria-label^="Actions rapides"]`, dans chaque scène |
| 8 | Ligne choisie, thème sombre (L8) | 390 cave | « empâtage ⇄ » gris sur le voile olive de la ligne (Pilsner 5 EBC) : contraste faible. **L8 confirmé.** | `captures/65-fiche-ouverte-t390-cave.png` | gênant | `controle-contraste.mjs` sur `.fer-li[aria-current] .fer-mo` en cave (≥ 4,5) |
| 9 | Fruit, curseur J+ poussé à 14 au clavier | 390 clair | Le cadre de focus du curseur barre « J0 J7 J14 », « J0 » est caché derrière « J+ 14 » : les repères deviennent illisibles. | `captures/73-fruit-j14-t390-clair.png` | gênant | Mesure : `.fer-jl-lab` sans chevauchement avec `.fer-jin` ni avec le contour du `range` |
| 10 | Repos (L5) | 390 et 1280, clair | Un écran, trois noms : « Fermentescibles 2/7 », « Malts/sucres », « Grain 8 kg » ; à 1280 le titre devient « Nouvelle recette » et le fil « Fermentescibles ». **L5 confirmé.** | `captures/10-repos-t390-clair.png`, `10-repos-pc1280-clair.png` | détail | `mots-premier-ecran` : un seul nom d'écran, le même aux deux largeurs |
| 11 | Bascule de famille, huit grains (L9) | 390 clair | La famille s'appelle « Lactose » (un produit) ; la ligne dit « Lactose · Lactose ». **L9 confirmé pour le nom** ; « en Sucre, seul Lactose est proposé » **infirmé** sur ce stock : Sucre propose Dextrose, Lactose, Sucre candi (à revoir sur son stock réel). | `captures/91-fam-lactose-t390-clair.png`, `90-fam-sucre-t390-clair.png`, `80-huit-t390-clair-pleine.png` | détail | `mots-premier-ecran` : une étiquette de famille n'est jamais le nom d'un article |
| 12 | Masse 99999, 0,004, barre tirée après | 390 clair | 99999 ramené à 10 000 kg sans rien dire ; 0,004 accepté, bandeau « 20000,004 kg » (3 décimales) ; la piste du plateau à 15 000 devient une barre noire de graduations. | `captures/24-masse-99999-t390-clair.png`, `27-masse-0004-t390-clair.png`, `28-barre-pendant-t390-clair.png` | détail | Fuzz : bandeau ≤ 2 décimales, message au plafond, ≤ 60 graduations visibles |
| 13 | Bascule « Grain ⇄ » | 390 clair | Cinq familles à parcourir à l'aveugle, un toucher = une famille, retour à Grain au sixième ; même règle que le n° 1 (une bascule qui écrit au premier toucher). | `captures/90-…` à `94-fam-grain-t390-clair.png` | détail | Même contrôle que le n° 1 |
| 14 | Vrai chemin, ligne ajoutée puis rechargement | 390 clair | La page revient au tableau de bord (toast « Base initialisée avec 11 enregistrements ») : la recette en cours n'est pas rouverte ; la reprise du brouillon n'est pas montrée. | `captures/07-menu-rechargement-t390-clair.png` | détail | Parcours : recharger pendant l'étape → l'étape revient ou la reprise est proposée |
| 15 | Champ ouvert, huit lignes | 1280 clair (390 aussi) | Le pied « Retour / Suivant » sort de l'écran dès l'ouverture du champ (911 / 800) et à huit lignes (926 / 800 ; 922 / 844 à 390) ; sa maquette fait de même, mais à 1280 il attend tout sur un écran. | `captures/11-ouverture-pc1280-clair.png`, `80-huit-pc1280-clair.png` | détail | `verifs.pied` étendu aux scènes ouverture et huit à 1280 |

### L1 à L9 du monitoring, un par un

| n° | Verdict | Capture |
|---|---|---|
| L1 | confirmé (n° 1) ; « Annuler » vu 6 s au code, pas ≈ 1 s | `34-plateau-moment-tourne-t390-cave.png` |
| L2 | non rejoué : « Brassins › Recettes » est vide sans données | — |
| L3 | non rejoué : aucune fiche recette sans données | — |
| L4 | non rejoué pour la fiche ; dans l'étape, les nombres sont à la virgule (« 1,060–1,085 », « 10,5 kg »), l'OG reste « — » | `10-repos-t390-clair.png` |
| L5 | confirmé (n° 10) | `10-repos-t390-clair.png`, `10-repos-pc1280-clair.png` |
| L6 | confirmé (n° 7) | `11-ouverture-t390-clair.png`, `80-huit-t390-clair.png` |
| L7 | non rejoué : l'OG est incalculable tant qu'un malt n'a pas de PPG ; avec PPG 37 sur Pilsner seul, OG « — » | `66-fiche-ppg-37-pc1280-clair.png` |
| L8 | confirmé (n° 8) | `65-fiche-ouverte-t390-cave.png` |
| L9 | nom de famille : confirmé ; « seul Lactose proposé » : infirmé sur ce stock (n° 11) | `90-fam-sucre-t390-clair.png`, `91-fam-lactose-t390-clair.png` |

## Doutes (non comptés)
- « IBU 0 » au bandeau sans houblon, là où OG et EBC disent « — » (la maquette écrivait « IBU 24 » à la main).
- « Grain 8 kg » au bandeau, « 8,0 kg » dans sa maquette (écart déclaré par le port).
- « Abandonner » n'apparaît dans l'en-tête qu'après un premier geste.
- L'appui long sur un nom fait ce que fait un toucher (la ligne est choisie, le plateau la montre) : rien de plus, rien de cassé (`98-appui-long-nom-t390-clair.png`).

## Ce qui tient (vu)
Repos aux deux largeurs et deux thèmes = sa maquette ; ouverture (cinq tuiles, étoile, teintes, « stock épuisé » en dernier) ; « Munich »
→ Münchner Malz avec le curseur dans la masse, la ligne et la barre se teintent (`18`, `19`, `20`) ; masse tapée sur la ligne, barre
tirée au doigt, + / − et piste du plateau au cran ; moment tourné avec « Annuler » et « J+ 3 » ; couleur « ? » tapée sur la ligne, teinte
en direct, enchaînement ; retrait avec « Annuler » ; sucre et fruit (pilule teintée, J+ au curseur) ; huit lignes avec l'alerte lactose ;
fiche ouverte (PPG 37 repris sur la ligne) ; hors ligne : ajout et masse sans erreur ; dix-huit lignes sans débordement ; stock vide :
« Rien encore. » puis « Créer « … » (stock à zéro) » et la ligne créée (`04`, `05`, `06`).

## Méthode manquante (aucun contrôle actuel ne le joue)
- **Le clavier mobile réel** : Chrome sans écran n'ouvre pas de clavier ; le champ de masse focalisé après un ajout est à ≈ 610 px sur 844, sous un clavier de 300 px si le navigateur ne défile pas. À jouer sur appareil (ou `&keyboard=300` comme le jour de brassage).
- **Le stock réel du brasseur** : tout état rempli vient du banc `?malts=` ; L9 (ce que Sucre propose) et les alias dépendent de son stock.
- **Les recettes et la fiche recette** (L2, L3, L4) : rien sans données ; à jouer sur l'app en ligne, lecture seule.
- **L'OG** (L7) : jamais calculée ici (PPG absents de la fixture) ; une fixture avec PPG sur chaque malt manque.
- **La reprise du brouillon** après rechargement sur le vrai chemin (n° 14) : seul le retour au tableau de bord a été vu.
- **Un nom finissant par un chiffre** (n° 2) et **un chiffre seul** (n° 3) ne sont dans aucune fixture ni aucun contrôle de recherche.
- **Deux retraits de suite** (n° 6), **une couleur hors plage** (n° 5), **le curseur J+ au bout** (n° 9) : jamais joués.
- **Toute pastille ou bascule à l'air de menu** (n° 1, n° 13) : à toucher, et noter ce qui s'écrit ; règle à ajouter à `controle-moment-ligne.mjs`.
- **Le glisser au doigt sur la piste du plateau** : seul un toucher à 80 % a été joué (la barre de la ligne, elle, a été tirée).

## Outillage laissé (hors dépôt)
`%TEMP%/affinee-test-ferm/serie.mjs` (la série : `node serie.mjs [scène…]`, serveur 4319 requis), `vite.ferm.config.mjs`,
`mesures.json`, `captures/`. Le dépôt n'a pas été modifié ; aucun worktree créé ; serveur 4319 arrêté à la fin.
