# flz4 — Par ses cousins (Cascade)

- **Chaleur : chaude**.
- **Idée** : dire l'odeur d'un houblon par les houblons qu'il connaît. Chaque mot de Cascade est suivi des houblons
  du pack qui disent le même mot : « citron vert · aussi Citra cryo, Motueka » ; « pin · aussi Idaho 7, Simcoe ».
  Les mots rares (3 ou 4 houblons sur 32) montent en tête, teintés ; les mots courants (agrumes, floral : 17 à 21
  houblons) descendent avec « +n ». Un appui long sur une pastille de cousin ouvre sa fiche courte.
- **Ce qui tient** : le brasseur situe un mot par des houblons qu'il a déjà sentis ; la rareté dit ce qui distingue
  Cascade sans inventer d'intensité. Compté honnêtement : « sur 32 », le pack du prototype, pas le catalogue.
- **Ce qui casse** : 32 houblons, c'est peu ; sur le catalogue (318) les comptes changeraient. Page longue (9 mots) :
  le premier écran montre 4 mots. Proche de Substituer dans l'esprit, mais sans score ni remplacement.
- **Données** : pack-fiches.json (idées dédoublonnées et traduites pour les 32 houblons) ; 16D.
- **Baseline** : complète ; en-tête en forme B. Fiches courtes des cousins générées pour chaque pastille.
- **Captures** : `captures/flz4-premier-ecran.png`, `captures/flz4-page.png`, `captures/flz4-fiche-courte.png`
  (appui long sur « Citra cryo »).

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
  flz4 etat.html : le titre « Cascade » ne pose pas une question (« … ? »)
  flz4 etat.html : aucun sélecteur libre : l'outil ne fait varier aucun facteur
  flz4 etat.html : pas de ligne de contexte visible [data-role="contexte"]
```
- SANS-FAMILLE (indicatif, D100) :
```
flz4 · 14 houblon(s) repéré(s) · 1 au-dessus de 50 % (Hallertau Blanc 67 % ✗)
SANS-FAMILLE ECHEC 3 problème(s)
  flz4 etat.html : « Hallertau Blanc » (67 % sans famille, 10 mots sur 15) : aucune part « autres » visible ; ses mots sans famille ne sont qu'une ligne de texte, ou rien
```
- MOTS au premier écran (indicatif ; --sans-donnees puis brut, --max=80) :
```
flz4 106 mots (hors données)
flz4 182 mots (> 80)
MOTS ECHEC 8/8 au-dessus de 80
```
