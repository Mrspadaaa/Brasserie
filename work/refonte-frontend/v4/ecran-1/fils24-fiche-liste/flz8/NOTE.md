# flz8 — Une idée, pas trois mots (Motueka)

- **Chaleur : chaude**.
- **Idée** : montrer le repli. À gauche ce que disent les fiches, brut (agrumes, Agrumes, citrus ; citron vert,
  Fresh lime ; lemon zest ; mojito, mojito…), l'anglais barré ; une flèche ; à droite l'idée française et son
  nombre de mentions (« agrumes ×3 », « citron vert ×2 », « mojito ×2 · sans famille », « fruité ×1 · générique »).
  12 mots bruts deviennent 8 idées, et la phrase du bas dit Motueka sans le gonfler : « Agrumes, surtout · un peu
  de tropical et de floral · mojito ».
- **Ce qui tient** : répond à « on a l'impression que Motueka est ultra fruité » en montrant d'où venait l'impression
  (7 mots d'agrumes pour 3 idées) ; traduction visible, rien de caché ; ×n est un compte, pas une force.
- **Ce qui casse** : la colonne brute prend de la place pour un lecteur qui ne veut que l'idée ; la phrase du bas est
  écrite à la main pour Motueka (à générer par règle en passe 2) ; « Agrumes » majuscule et « agrumes » sont deux
  mentions d'une même idée, ce qu'on peut discuter.
- **Données** : pack-fiches.json (aromes[].mots et motsSansFamille, 2 fiches) ; 16D.
- **Baseline** : complète ; en-tête en forme B, radar g1 sans étiquettes dans la ligne de titre.
- **Captures** : `captures/flz8-premier-ecran.png`, `captures/flz8-page.png`.

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
flz8 · titre « Motueka » · libres : aucun · 0 contrôle(s) · contexte : aucun · 3 faute(s)
UNE-QUESTION ECHEC 24 problème(s)
  flz8 etat.html : le titre « Motueka » ne pose pas une question (« … ? »)
  flz8 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur
  flz8 etat.html : pas de ligne de contexte visible [data-role="contexte"]
```
- SANS-FAMILLE (indicatif, D100) :
```
flz8 · 1 houblon(s) repéré(s) · 0 au-dessus de 50 % (aucun)
SANS-FAMILLE ECHEC 3 problème(s)
```
- MOTS au premier écran (indicatif ; --sans-donnees puis brut, --max=80) :
```
flz8 102 mots (hors données)
flz8 142 mots (> 80)
MOTS ECHEC 8/8 au-dessus de 80
```
