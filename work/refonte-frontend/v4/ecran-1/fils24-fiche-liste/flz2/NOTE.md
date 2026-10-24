# flz2 — Le radar des mots (Nelson Sauvin)

- **Chaleur : chaude**.
- **Idée** : le même houblon, dessiné avec ses propres mots au lieu des 12 familles. Un second radar dont les axes
  sont ses idées (vin blanc, groseille à maquereau, raisin, sauvignon blanc, agrumes, épicé) et dont le rayon est le
  nombre de fiches qui citent le mot (1/2 ou 2/2). Les axes gardent la couleur de leur famille quand il y en a une.
  Au-dessus, le radar g1 des familles, minuscule, avec le constat : « n'en voit que 2 ». Une ligne « lu d'un coup »
  sous le dessin.
- **Ce qui tient** : la forme pleine du radar des mots contre la forme vide du radar des familles dit en une image
  pourquoi Nelson Sauvin paraissait ordinaire. Le rayon est un fait (n fiches sur N), pas une intensité.
- **Ce qui casse** : deux radars sur un écran ; le rayon « fiches sur N » peut être pris pour une force ; « fruité »
  (générique) n'a pas d'axe, dit en légende. À 1 fiche (Citra cryo) tous les axes seraient à fond.
- **Données** : pack-fiches.json ; style-bands.json 16D (zone sur le radar g1).
- **Baseline** : complète (voir flz1) ; en-tête en forme B (nom et α sur une ligne).
- **Captures** : `captures/flz2-premier-ecran.png`, `captures/flz2-page.png`.

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
  flz2 etat.html : le titre « Nelson Sauvin » ne pose pas une question (« … ? »)
  flz2 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur
  flz2 etat.html : pas de ligne de contexte visible [data-role="contexte"]
```
- SANS-FAMILLE (indicatif, D100) :
```
flz2 · 1 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✗)
SANS-FAMILLE ECHEC 3 problème(s)
  flz2 etat.html : « Nelson Sauvin » (83 %) : part « autres » sans nom (aria-label, ou « autres » / « sans famille » dans le bloc)
```
- MOTS au premier écran (indicatif ; --sans-donnees puis brut, --max=80) :
```
flz2 117 mots (hors données)
flz2 152 mots (> 80)
MOTS ECHEC 8/8 au-dessus de 80
```
