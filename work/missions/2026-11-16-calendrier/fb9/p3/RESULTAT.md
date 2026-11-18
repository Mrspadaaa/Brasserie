OK — fb p3 : libre en fin par semaine, un nom par chose, zéro redite, modules reliés

Fichiers écrits (tous dans `fb9/p3/`) : `src.html`, `app.js`, `build.mjs` (+ pictos houblon et flocon), `proto.html`, `capt.mjs`, `mesure.mjs`
(copies adaptées de p2), `GESTES.md`, `mesure.json`, `cap/` (148 fichiers : 57 états × clair et cave à 390, 8 à 844, 6 à 1280, journaux).
p1, p2 et fl/fb ne sont pas touchés.

## Sorties décisives
- `node fb9/p3/build.mjs` → PROTO OK, 106 Ko (refuse `type="number"` et tout picto absent).
- `capt.mjs` : 390 (57 états, clair et cave), 844 et 1280 → CAPTURES OK, 0 erreur de page. `clavier:false`, `nombre:0` partout.
- `mesure.json` : 16 tâches sur 16 réussies, 0 frappe, 0 input, SANS ERREUR PAGE.
  Touchers : T1 0, T2 2, T3 2, T4 1, T5 1, T5b 2, T6 1, T7 1, T8 **1**, T9 **1**, T10 2 (un double toucher), T11 2, T12 0, T13a 2, T13b 2,
  T13c 4 (fiche, module, **Payer dans le module**, retour).
- Repos 390 : un seul 166 ; première barre à 40 % (K3) ; en-tête collé 73 px ; plus petit texte 14 px ; 14 genres de l'app.
  66 mots visibles, dont 24 dans l'axe des semaines et 7 dans la barre du bas et le +, soit **35 hors axe** (K12 ≤ 40).
- 844 : première barre à 35 %, 5 tuiles au plus à gauche, filtres et période entiers. 1280 : 9 filtres nommés, courbe dépliée.
- Gestes (journal) :
  - t2 : bandeau « 166 → −374 · sous 0 en S24 » en rouge pendant le geste ; les libres de S51 et S52 bougent.
  - t2pose : « −374 · sous 0 en S24 » **en rouge** ; t6 : « 166 = » pendant le glisser, avec les semaines visées.
  - t13 (fiche facture) : « −86 », « 13 nov. · S46 · échue depuis 3 j », « Payer 86 ».
  - t13payer : Finances, Payer, puis retour ; Brewferm n'est plus dans Maintenant ; « 166 = » (la sortie était déjà dans la prévision).
  - conflitok : « 166 → 154 · Munich 4 kg commandé ».
- `controle-panel` (repos, t2, t13, semaine, liste, modfin) → PANEL ECHEC sur la diversité seule (20 % de paires presque identiques).
  Ce sont des états d'un même écran ; le contrôle vise une série v0, il ne s'applique pas ici.
- `controle-choix.mjs` : aucune entrée Calendrier dans `ecrans.json`. J'ai donc tenu fb par capture côte à côte avec `fl/fb/cap/fb-repos-390.png`.

## Corrections faites (des 3 juges)
1. **Écarts à fb** :
   - le « libre en fin » est revenu sous chaque S47…S52 (rouge sous 0), avec la légende « libre en fin de semaine » ;
   - la charge s'affiche en pastilles ●○, et en pilule rouge « 4/2 j » quand elle est dépassée ;
   - « présence 2 j » est glissable dans la courbe et réglable par − / + dans la semaine en 7 jours ;
   - le « + » est revenu devant tout montant positif.
2. **Fiche facture** : montant en gros, date juste (S46), « Payer 86 ».
3. **Négatif toujours rouge** : dans le bandeau de geste, le bandeau collé, le grand chiffre et le toast.
4. **Zéro redite** : une chose montrée dans Maintenant devient un point teinté sans nom sur la frise ; un toucher sur ce point fait clignoter sa tuile. La tuile « +3 » montre des pictos, pas de noms.
5. **Une règle de nom** : il va dans la barre si la largeur mesurée au canvas suffit. Sinon, une ligne dessous, alignée au bord gauche (au bord droit en dernière colonne). Pour une chose d'un jour : picto, puis nom à droite, ou dessous. Jamais « … ». Le Stout a son nom et « cuve 1 ×2 » sous sa propre barre.
6. **« Cuve 3 en panne »** est écrit en entier. Le conflit est écrit sur la chose : « malt manque », « cuve 1 ×2 », « manque ».
7. **Filtres entiers à 390** : loupe, ★ 1, tri, Types (9 couleurs). Un toucher sur le titre d'une voie l'isole.
8. **Tri en 1 toucher** : Urgent → Prochain → Montant. Épingler par double toucher (Annuler 5 s) ; l'appui long garde son menu.
9. **Effets visibles pendant le geste** : un bandeau « 166 → x » ou « 166 = » remplace la légende dans l'en-tête collé. Les libres par semaine se recalculent en direct, et les semaines visées restent surlignées.
10. **Fiches et feuilles à 40 % au plus**, avec l'action collée en bas :
    - bulle de pose : montant et « ↻ une fois » sur une ligne, puis les jours, puis les puces ;
    - brassin : étapes repliées en une ligne ;
    - menu de l'appui long : jamais sur la chose ni sur sa voie, la chose en surbrillance.
11. **Le jour** :
    - un trait « aujourd'hui » au lundi ;
    - « demain › » sur la barre de la Blonde (démarrer d'un toucher) ;
    - pictos dry hop, garde et mise en fût posés au jour sur chaque brassin ;
    - « Dry hop · Blonde · di 22 · Fait » dans Maintenant ;
    - un toucher sur une semaine l'ouvre en 7 jours (temps, argent, présence).
12. **Intégration à double sens** :
    - Finances, Brassins, Stocks, Matériel, Clients et Carnet montrent leur fiche, leur geste (Payer, Rentré, Commander, Fait) et leur « Calendrier · section · 6 sem. » (L8) ;
    - « Voir dans le calendrier » ramène sur la chose ;
    - au retour, l'effet est visible.
13. **Activités** : une fenêtre en pointillé fin, avec les jours posés en pavés pleins et « · 3 j » dans le nom.
14. **Loyer** : une marque ↻ au 1er du mois, au lieu d'une barre pleine largeur.

## Captures (ouvertes)
`cap/p3-repos-390.png`, `p3-repos-cave-390.png`, `p3-t2-390.png`, `p3-t6-390.png`, `p3-t7menu-390.png`, `p3-t13-390.png`,
`p3-t13b-cave-390.png`, `p3-semaine-390.png`, `p3-mntplus-390.png`, `p3-liste-390.png`, `p3-t13payer-390.png`, `p3-t13paye-390.png`,
`p3-presence-390.png`, `p3-t11aller-390.png`, `p3-conflitok-390.png`, `p3-t5-390.png`, `p3-repos-844.png`, `p3-repos-1280.png`.
Non ouvertes (journal seul) : t3, t4, t5j, t8, t9, types, t10dbl, cherche, dire, idee, icone, partage, horsligne, essai, modfin, et les autres états à 844 et 1280.

## Écarts restants
- Maintenant déplié (« +3 ») montre la tuile Stout et sa barre en même temps : la barre reste, parce qu'elle porte la cuve.
- La Blonde de demain est marquée sur sa barre (« demain › ») et non dans Maintenant, pour ne pas redire son nom.
- Pas de pincement (Q16). Le niveau jour passe par la semaine en 7 jours.
- 1280 : première barre à 54 %.
- Le double toucher pour épingler ne s'annonce pas ; le menu de l'appui long le propose aussi.

Prédiction : « Là je vois tout de suite le libre de chaque semaine, la facture et le fût, et les noms sont collés à leurs barres ; payer depuis Finances et revenir, c'est top. »

DÉCISION À PRENDRE : (1) Bord : le fondre dans le Calendrier ou le garder (à montrer en mini maquettes ; il est gardé ici). (2) Épingle A ou B (`?ep=b`, toujours ouvert).
(3) « Demain · Brasser » : dans Maintenant (redite du nom) ou sur la barre (choix fait ici).
CONNAISSANCE : l'ajustement tactile de Chrome envoie le toucher au petit bouton voisin. Un bouton de 22 px dans une barre glissable (picto d'étape) volait ainsi le glisser de toute la barre. Dans une chose glissable, les marques restent non interactives : leur geste passe par Maintenant ou par la fiche.
LEÇON PROPOSÉE : aucune
