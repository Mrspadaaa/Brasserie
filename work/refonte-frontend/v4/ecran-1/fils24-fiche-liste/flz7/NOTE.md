# flz7 — Dans l'ordre du nez (Citra cryo)

- **Chaleur : chaude**.
- **Idée** : l'ordre dans lequel la fiche dit ses mots est l'information, et la seule structure. Les 9 mots de Beer
  Maverick, du premier au dernier, en escalier numéroté : 1 agrumes, 2 pamplemousse, 3 pêche, 4 melon, 5 citron
  vert, 6 floral, 7 groseille à maquereau (aucune famille : hors du radar), 8 fruit de la passion, 9 litchi. Chaque
  marche porte son picto et sa famille ; plus de « · nommé en premier » répété : la première marche le dit seule.
  Un bilan en quatre cases (9 marches, 1 fiche lue, 5 familles, 1 hors du radar).
- **Ce qui tient** : honnête et lisible : « pas d'intensité, un ordre » est écrit ; on voit où tombe le mot sans
  famille au lieu de le reléguer en bas.
- **Ce qui casse** : la contremarche colorée peut se lire comme une barre qui grandit ; l'ordre d'une fiche n'est pas
  forcément un ordre de perception ; à deux fiches (Cascade), il faudrait deux escaliers ou un ordre fusionné.
- **Données** : pack-fiches.json, `descripteurs.beerMaverick` de Citra cryo tel quel ; 16D.
- **Baseline** : complète ; en-tête en forme A, radar g1 sans étiquettes à droite du titre (les familles sont sur les
  marches).
- **Captures** : `captures/flz7-premier-ecran.png`, `captures/flz7-page.png`.

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
  flz7 etat.html : le titre « Citra cryo » ne pose pas une question (« … ? »)
  flz7 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur
  flz7 etat.html : pas de ligne de contexte visible [data-role="contexte"]
```
- SANS-FAMILLE (indicatif, D100) :
```
flz7 · 1 houblon(s) repéré(s) · 0 au-dessus de 50 % (aucun)
SANS-FAMILLE ECHEC 3 problème(s)
```
- MOTS au premier écran (indicatif ; --sans-donnees puis brut, --max=80) :
```
flz7 65 mots (hors données)
flz7 96 mots (> 80)
MOTS ECHEC 8/8 au-dessus de 80
```
