# flz3 — À toi de ranger (Nelson Sauvin)

- **Chaleur : chaude**.
- **Idée** : la liste devient un geste. Les 4 mots sans famille (vin blanc, groseille à maquereau, raisin, sauvignon
  blanc) sont des jetons dans un bac « range-les » ; sous le bac, les 12 familles en cibles. Le brasseur pose un mot
  sur une famille : le jeton prend la couleur de la famille avec « → Baies ~ », et le radar gagne un rayon en
  pointillé marqué « ~ toi ». La forme des fiches ne bouge pas ; son hypothèse s'ajoute, visiblement distincte.
- **Ce qui tient** : c'est lui qui corrige le lexique fermé (cause de L14), à sa main, sans qu'on invente une
  famille à sa place ; « ~ » et pointillé = hypothèse, jamais une fiche (honnêteté). L'état après geste est capturé.
- **Ce qui casse** : le rayon « ~ toi » est posé à mi-rayon (1/2) par convention ; un mot rangé devrait un jour
  nourrir le moteur (hors v0). Sur un houblon sans orphelins, le bac est vide : à masquer.
- **Geste** : toucher un jeton, puis une famille ; `ranger(mot, famille)` ; capture `flz3-range.png` après
  `ranger('groseille à maquereau','berries')`.
- **Données** : pack-fiches.json ; 16D.
- **Baseline** : complète ; en-tête en forme C (lentille au style / absolu posée dans l'en-tête du bac).
- **Captures** : `captures/flz3-premier-ecran.png`, `captures/flz3-page.png`, `captures/flz3-range.png`.

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
  flz3 etat.html : le titre « Nelson Sauvin » ne pose pas une question (« … ? »)
  flz3 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur
  flz3 etat.html : pas de ligne de contexte visible [data-role="contexte"]
```
- SANS-FAMILLE (indicatif, D100) :
```
flz3 · 1 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓)
SANS-FAMILLE ECHEC 3 problème(s)
```
- MOTS au premier écran (indicatif ; --sans-donnees puis brut, --max=80) :
```
flz3 72 mots (hors données)
flz3 119 mots (> 80)
MOTS ECHEC 8/8 au-dessus de 80
```
