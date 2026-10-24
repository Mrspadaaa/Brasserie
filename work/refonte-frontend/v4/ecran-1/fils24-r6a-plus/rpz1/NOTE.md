# rpz1 · Ce que la fiche dit en plus

Lot « r6a++ » (24.10, soir), série rpz (libre, brief minimal). Chaleur : **tiède**. Greffe : `hors-16d`.
Page `etat.html` : r6a (`fils22-comparer/r6a/etat.html`) reprise telle quelle, coupée et collée par `split/join` (L26) ;
classes `rpz1-…`. Capture `../captures/rpz1.png` (premier écran, 390 × 844) et `rpz1-390.png` (page entière).

## L'idée, une seule
Ses mots : « Les type spéciaux des houblons hors 16d ! C'est très important surtout dans la comparaison !!!! » (D130) ;
« un houblon floral est super floral type rose ou Jasmine, agrume type mangue […] le mettre en valeur » (D131 ter).
Deux lectures du même fait, « ce que la fiche dit en plus de ses familles » :
- sous les têtes, une rangée **« lui seul »** (`data-role="hors-16d"`, `data-houblon`), façon bandeau de flb5b (◇ et mot) :
  Galaxy ◇ cannabis ◇ dank ; Cascade et Idaho 7 « — rien hors 16D » (honnête : leurs fiches n'ont rien hors des 12,
  « fruité » de Cascade est générique et le moteur ne le compte pas) ;
- à côté de la barre d'une famille, **le mot précis** de ses fiches (`data-role="precis"`) : Cascade pamplemousse, cassis,
  pin ; Idaho 7 thé noir, orange, papaye, abricot, cassis, pin ; Galaxy passion, pêche. Un mot par cellule, les autres
  dans le `title` et l'`aria-label`. Un mot qui redit la famille (« floral » sous Floral) n'est pas montré.
La rangée « lui seul » suit le houblon mis en avant (même fond gris que sa colonne).

## Ce qui tient
- r6a entière : titre, contexte, radar r2, lentille, « Ta stout », trois têtes (nom, α, usage, familles, verdict), neuf
  rangées de familles, inconnus hachurés, chimie à un toucher, panel OSU, pont Dryhopper, légende derrière « ? ».
- Baseline : pictos au trait (TRAIT OK), couleurs des familles, thème clair, α avant le reste, usage en mot.
- Honnêteté : mots des fiches seulement (pack-fiches.json ; « black currant » traduit cassis) ; rien d'inventé ; « rien
  hors 16D » écrit plutôt que caché.
- 77 mots visibles au premier écran (r6a : 79) ; le tableau tient dans le premier écran (bas à 824 px).
- Légende : une section « Ce que la fiche dit en plus » dans le « ? ».

## Ce qui casse ou reste douteux
- Deux « — rien hors 16D » sur trois : la rangée paraît vide pour ce trio ; avec Nelson Sauvin ou Motueka (le « + »)
  elle serait pleine. C'est la donnée.
- Les rangées à mot précis passent de 22 à ~34 px : le tableau gagne ~100 px, mais reste dans le premier écran.
- Pas de picto hors 16D : le lot D131 (pha/phz) n'est pas choisi (D123) ; le ◇ de flb5b (choisie) tient lieu.

## Contrôles joués
- `controle-pictos-trait … rpz1 … --page=etat.html` : TRAIT OK (28 pictos, 0 faute).
- `controle-commun … rpz1 rpz2 rpz3 rpz4 --page=etat.html --sans=mots` : COMMUN OK (couleurs, au-style, survol,
  blocs, contraste, fiche, standard, trait, legende, parlant, brutes). Premier essai : contraste 4,48:1 sur « orange,
  pamplemousse » dans la colonne grise ; corrigé (ton assombri).
- `controle-panel` sur les quatre captures : PANEL ECHEC (ressemblance 0,93 ; rpz1 ~ rpz4) : attendu, r6a est la base
  imposée des quatre (règle n° 1) ; le panel mesure la diversité d'un lot libre.
- Geste : toucher Galaxy → la rangée « lui seul » suit (Galaxy:true).
