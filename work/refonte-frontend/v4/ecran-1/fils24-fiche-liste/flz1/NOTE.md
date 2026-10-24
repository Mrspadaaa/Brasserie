# flz1 — Hors du dessin (Nelson Sauvin)

- **Chaleur : chaude** (forme libre, série z).
- **Idée** : la liste sous le radar ne redit pas le radar, elle dit son complément. Le radar des 12 familles
  dessine 2 mots (agrumes, épicé) ; les 5 idées qui ne tiennent dans aucune famille (vin blanc, groseille à
  maquereau, raisin, sauvignon blanc, fruité) sortent du dessin et deviennent le premier plan : un aplat dans la
  couleur du houblon, mots à 30 px, chacun avec son n/N de fiches. Quatre compteurs honnêtes en bas : fiches lues,
  idées, hors des familles, familles jamais décrites.
- **Ce qui tient** : Nelson Sauvin n'est plus « ordinaire » ; on lit en trois secondes qu'il parle vin blanc et
  groseille, et pourquoi le radar ne le montre pas. Rien d'inventé : chaque mot vient d'une fiche, traduit (D97),
  « fruité » marqué générique.
- **Ce qui casse** : sur un houblon bien décrit par les familles (Nugget), le bloc « hors du dessin » n'aurait que
  « gingembre » : l'idée vaut surtout pour les houblons sous-décrits ; l'aplat de couleur est un écart assumé au
  thème blanc (une seule couleur, celle du houblon, comme dans Comparer).
- **Données** : pack-fiches.json (Beer Maverick 2023, Hopsteiner 2025) ; zone du style : style-bands.json 16D.
- **Baseline** : α plage + lot, usage en mot, stock en badge, lentille au style / absolu (zone 16D sur le radar),
  pictos au trait, « ? » légende, croix 44 px, ♡ ⊘ et Comparer, appui long sur le nom → fiche courte.
- **Captures** : `captures/flz1-premier-ecran.png`, `captures/flz1-page.png`.
- **Générateur** : `flz1/generer-flz.mjs` (les huit concepts) ; captures : `flz1/capturer-flz.mjs`.

## Contrôles (sorties recopiées)
- COMMUN (`controle-commun --sans=mots`, les 8 pages ensemble) :
```
mots       sauté (--sans)
couleurs   OK
au-style   OK
survol     OK
blocs      OK
contraste  OK
fiche      OK
standard   OK
trait      OK
legende    OK
parlant    OK
brutes     OK
COMMUN OK
```
- PANEL (`controle-panel`, les 8 premiers écrans) :
```
8 captures · remplissage médian 0,64, 0 sous 0,50 · ressemblance moyenne 0,86 · paires presque identiques 0/28 (0 %)
PANEL OK
```
- UNE-QUESTION (indicatif, D98) :
```
UNE-QUESTION ECHEC 24 problème(s)
  flz1 etat.html : le titre « Nelson Sauvin » ne pose pas une question (« … ? »)
  flz1 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur
  flz1 etat.html : pas de ligne de contexte visible [data-role="contexte"]
```
- SANS-FAMILLE (indicatif, D100) :
```
flz1 · 1 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✗)
SANS-FAMILLE ECHEC 3 problème(s)
  flz1 etat.html : « Nelson Sauvin » (83 %) : part « autres » sans nom (aria-label, ou « autres » / « sans famille » dans le bloc)
```
- MOTS au premier écran (indicatif ; --sans-donnees puis brut, --max=80) :
```
flz1 80 mots (hors données)
flz1 122 mots (> 80)
MOTS ECHEC 8/8 au-dessus de 80
```
