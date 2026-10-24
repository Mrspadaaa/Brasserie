# flz5 — Dans ta stout (Nugget, 16D)

- **Chaleur : chaude**.
- **Idée** : la lentille « au style » devient la liste elle-même. Les mots de Nugget sont rangés face à la 16D de sa
  stout, d'après ce que le BJCP 2021 nomme : « À sa place dans ta 16D » (géranium, floral, herbacé, terreux : le
  style les attend, bloc sombre avec la citation), « Ressort dans ta 16D » (ananas, litchi, noix de coco, boisé,
  résineux, épicé, agrumes : le style n'en parle pas), « Sans famille » (gingembre : ni dedans ni dehors). En
  « absolu », les étagères perdent leur sens de style et redeviennent une seule liste.
- **Ce qui tient** : c'est la question du brasseur (« c'est pour ma stout ») appliquée mot à mot ; les n/N restent ;
  la citation du BJCP justifie la ligne de partage, rien n'est deviné.
- **Ce qui casse** : « ressort » peut se lire comme un défaut alors que c'est parfois ce qu'il cherche (« je la veux
  plus floral ») ; la bande 0–30 des familles neutres n'est pas dessinée dans les étagères ; « boisé » et
  « résineux » viennent de deux boutiques (Hopsteiner US, Yakima Chief), repliés.
- **Données** : pack-fiches.json (4 fiches pour Nugget) ; style-bands.json 16D (attendue : floral, herbal, earthy).
- **Baseline** : complète ; en-tête en forme C, la lentille en grande barre sous le radar.
- **Captures** : `captures/flz5-premier-ecran.png`, `captures/flz5-page.png`.

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
  flz5 etat.html : le titre « Nugget » ne pose pas une question (« … ? »)
  flz5 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur
  flz5 etat.html : pas de ligne de contexte visible [data-role="contexte"]
```
- SANS-FAMILLE (indicatif, D100) :
```
flz5 · 1 houblon(s) repéré(s) · 0 au-dessus de 50 % (aucun)
SANS-FAMILLE ECHEC 3 problème(s)
```
- MOTS au premier écran (indicatif ; --sans-donnees puis brut, --max=80) :
```
flz5 90 mots (hors données)
flz5 121 mots (> 80)
MOTS ECHEC 8/8 au-dessus de 80
```
