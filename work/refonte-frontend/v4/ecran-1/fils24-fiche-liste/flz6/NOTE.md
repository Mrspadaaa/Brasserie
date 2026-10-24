# flz6 — La loupe sur l'axe (Motueka)

- **Chaleur : chaude**.
- **Idée** : pas de liste. Le radar g1 est grand, et une loupe (façon zoom Apple, qu'il aime sur le rail) lit l'axe
  touché : la famille, ses fiches, ses mots avec leur n/N. Au repos la loupe est sur l'axe le plus fort (Agrumes :
  agrumes, citron vert, citron, zeste de citron). Les mots hors des familles (mojito) sont au centre du radar,
  là où aucun axe ne peut les porter. Sous le radar : les trois familles décrites en pastilles, et un ruban des
  12 pictos avec n/N ou « ? », qui déplace la loupe.
- **Ce qui tient** : le radar avant, et le radar seulement ; les mots arrivent sans quitter le dessin ; la loupe
  montre la richesse réelle d'un axe (4 idées d'agrumes) sans gonfler le tropical de Motueka (1 mot, 1 fiche).
- **Ce qui casse** : un toucher pour lire les autres axes (criterion « en trois secondes » : seul l'axe fort se lit
  d'emblée) ; la loupe cache une étiquette voisine ; sur Nelson Sauvin, la loupe n'aurait presque rien à lire, le
  centre porterait tout.
- **Geste** : toucher une étiquette d'axe, une pastille ou un picto du ruban ; `viser(famille)` ; capture
  `flz6-tropicaux.png` après `viser('tropical')`.
- **Données** : pack-fiches.json ; 16D.
- **Baseline** : complète ; en-tête en forme B.
- **Captures** : `captures/flz6-premier-ecran.png`, `captures/flz6-page.png`, `captures/flz6-tropicaux.png`.

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
  flz6 etat.html : le titre « Motueka » ne pose pas une question (« … ? »)
  flz6 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur
  flz6 etat.html : pas de ligne de contexte visible [data-role="contexte"]
```
- SANS-FAMILLE (indicatif, D100) :
```
flz6 · 1 houblon(s) repéré(s) · 0 au-dessus de 50 % (aucun)
SANS-FAMILLE ECHEC 3 problème(s)
```
- MOTS au premier écran (indicatif ; --sans-donnees puis brut, --max=80) :
```
flz6 86 mots (hors données)
flz6 117 mots (> 80)
MOTS ECHEC 8/8 au-dessus de 80
```
