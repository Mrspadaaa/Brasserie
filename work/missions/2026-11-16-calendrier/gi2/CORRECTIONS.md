OK — choisi-a, choisi-b, r2-a, r2-c corrigés ; 29 captures, CONTROLE OK (0 défaut)

# gi2 : passe corrigée (16.11 soir)

Assemblage inchangé : g-d1 + i1 + i3 + i4 + i6 + i8, sans i5 ni i7 (le + volant dit « + »). L'en-tête est celui de g-d1 (tête 202 px).
choisi-c et r2-b sont écartés par le critique. Ils ne sont pas reconstruits et leurs fichiers restent tels quels.

## Ce qui change partout (choisi-a, choisi-b, et r2 posé sur choisi-a)
- **Travaux et Activités** : 32 px entre les milieux des carrés (avant 23). Contrôle « écart min carrés 32 ».
  Pour garder le + volant loin de « −94 », Achats et Activités perdent 4 px sous leur barre, et le + volant descend
  de 2 px (14 px au-dessus des onglets, dans la règle 4 à 24).
- **Yeux en colonne fixe** : les titres ont une largeur commune (celle du plus long), donc les 7 yeux tombent
  au même x. Contrôle « yeux 7, colonne ±0 px ».
- **Trace de b greffée** : sous une rangée cachée, une fine ligne montre où tombent les choses cachées
  (barres et pastilles à leur place dans les semaines).
- **Rangée cachée** : le carré reste plein avec son +, à moitié éteint, et ne devient plus une case vide.
  Le toucher réaffiche la rangée et ouvre la pose. L'œil barré, à l'encre, sert à réafficher.
- **i3 et i6 capturés** : `<v>-semaine` (toucher S50, bulle « S50 7 – 13 déc. ») et `<v>-retard`
  (toucher ⏲ 2 : la feuille montre « en retard de 7 j » et « en retard de 4 j »), en clair et en cave.

## Par version
- **choisi-a** : carré plein, œil dans sa colonne, et « 4 choses cachées » avec la trace quand la rangée est cachée.
- **choisi-b** : corrigé comme demandé (carré plein, œil dans sa colonne, trace). Une fois corrigé, il rejoignait a.
  Je l'ai donc fait porter sur le doute « sept yeux gris au repos font du bruit » : au repos, les yeux sont plus
  discrets (15 px, gris à 72 %). Quand la rangée est cachée, la trace parle seule, sans les mots ; l'œil barré
  reste à l'encre.
- **r2-a** : la règle de compte est la même pour toutes les rangées : ce qui est confirmé et chiffré, de S47 à S52.
  - Ventes affiche « 2 · +900 », soit Auberge du Lac +260 et Noël privés +640. Le Café du Pont (prévu, en
    pointillé) et les 3 fûts à La Cigogne (sans montant) n'y entrent pas.
  - Brassins affiche « 2 · −324 », soit −148 et −176.
  - Papiers affiche « 3 · −806 », soit le loyer −400 et les factures −312 et −94.
  - L'étiquette est neutre (fond de surface, contour gris), et les trois tombent dans une même colonne (bord
    droit à 186 px). Elle est à 9 px au moins de Noël privés ; le contrôle exige 8 px.
  - La période et l'unité sont dites une fois, en gris, sur la ligne Brassins : « nombre · solde, S47 – S52 ».
  - Le détail complet est dans l'aria-label de chaque étiquette.
- **r2-c** : étiquette neutre au contour gris, remplie depuis la gauche en proportion du plus grand montant (+900).
  Ventes est donc pleine, Papiers à 90 % et Brassins à 36 %. Le remplissage reste visible en cave. Le compte suit
  la même règle que r2-a, et la légende tient une fois : « solde confirmé S47 – S52 ».

## Sorties décisives
- `node build.mjs choisi-a,choisi-b,r2-a,r2-c` → écrit les 4.
- `node cap.mjs` → **CONTROLE OK** (`cap/controle.txt`). Sur 29 pages : tête 202 = g-d1, 7/7 rangées, tailles
  14/15/17/30 px, « défauts 0 », carrés en colonne ±0 px, cible 28 px, 32 px au moins entre carrés, yeux en
  colonne ±0 px.
- Contrôles ajoutés à `cap.mjs` :
  - CARRES < 32 ;
  - YEUX hors colonne ;
  - RESUME collé à une barre (< 8 px) ;
  - LEGENDE présente une fois ;
  - les superpositions voulues (bulle de semaine, feuille) ne comptent pas comme chevauchement.
- `controle-plus-rangees.mjs` n'a pas été lancé : aucune colonne de + ne subsiste (vérifié par la règle
  « COLONNE de + encore là » de cap.mjs). C'est un fichier hors de mon dossier ; il reste à remplacer par le
  contrôle des carrés (voir plus bas).

## Captures (`cap/`), toutes ouvertes en planches
- Base : `g-d1.png`.
- choisi-a et choisi-b, en clair et en cave (suffixe `-cave`) : `<v>`, `<v>-ajout`, `<v>-masque`,
  `<v>-semaine`, `<v>-retard`.
- r2-a et r2-c, en clair et en cave : `<v>`, `<v>-masque`.

## Doutes restants (non bloquants)
- Loyer : la base ne donne pas sa date. J'ai compté une échéance (décembre) sur S47 – S52, hypothèse dite dans
  l'aria-label.
- r2 : si Brassins est caché, la légende se cache avec lui.
- Le + volant disparaît toujours pendant la pose (comportement de la base).
- r2 : la légende n'a pas la place de dire « confirmé » dans r2-a. Le mot n'est que dans l'aria-label.

Prédiction : « Le + dans le carré et l'œil, c'est bon, c'est aligné ; le 2 · +900 je comprends. »

DÉCISION À PRENDRE : remplacer `scripts/agents/controle-plus-rangees.mjs`, hors de mon périmètre, par le contrôle
des carrés (colonne, cible ≥ 24 px, 32 px entre les milieux, yeux en colonne, aucun `.k14-pl`). La logique est
prête dans `gi2/cap.mjs`.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : celle du critique. Une idée gardée qui ne se voit qu'au toucher (ici i3 et i6) a sa capture d'état
touché dans chaque version, sinon on ne peut pas vérifier qu'elle a été gardée.
