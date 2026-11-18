# final2 — retouche de final (16.11)

Base : `../final/proto.src.html`, qui n'est pas touché. Les 9 points du pilote sont appliqués par `retouche-final2.mjs` (split/join, L26). Le reste de final est repris tel quel.
Rebâtir : `node retouche-final2.mjs && node build.mjs && node prep-scenario.mjs && node scenario.mjs && node audit.mjs . captures/audit`.
Page : `proto.html` (cave par défaut, `?theme=clair`, `?vide=1&clavier=auto` pour son scénario).

## Ce qui change (et seulement ça)
1. **Thème de l'app** (THEME-APP). Toutes les variables viennent des jetons de DESIGN.md :
   - cave : `#12100E`, `#1A1613`, `#221D19`, `#2C2521`, texte `#F5F0EA`, `#D8CEC5` et `#9A8A7E`, action `ebc-straw` `#F2C14E`, houblon `#6E9B5B` pour « choisi » ;
   - clair : `#FFFFFF`, `#F5F5F5`, `#EBEBEB`, action noire ;
   - plus de crème.
   La zone est **Stocks** (`#A3C97A`, et `#4C6B2A` en clair), parce que dans l'app le Matériel vit dans Stocks (`StocksTab`, `materiel`). Elle colore l'onglet actif Stocks (Finances n'est plus actif), le fil « Stocks › Matériel », le trait des onglets du carnet et les étapes.
   Une seule action paille par écran : la puce choisie de Comparer passe en neutre inversé.
2. **Messages.** Le message est une bande opaque posée juste au-dessus du champ, du + et des onglets, à 1 px près.
   - Ce qui était sous la bande remonte d'autant. Dans un panneau déjà défilé, le panneau s'arrête au-dessus du message.
   - La place revient quand il part.
   - Il est effacé à toute navigation : vue, carnet, onglet, panneau ou feuille. Dans final, « Choisi » restait sur la liste en E17 et sur Pourquoi en E18.
3. **« Façons possibles · Pistolet à contre-pression » est retiré.** Une façon se dit en ses mots dans le champ (« isobarique », « chambre froide », « hotte »…). Elle devient une ligne à trancher.
   L'indice « Ensuite » le dit. Le nom n'est plus répété en sous-ligne.
4. **Espaces insécables.**
   - Avant « : ; ? ! » » et après « « » : « Gravité écartée : … » ne se coupe plus devant les deux-points.
   - Entre un nombre et son unité, même quand ils sont dans deux nœuds (`<span>2’600</span> CHF`).
   - Ça vaut aussi pour les cartes du champ.
5. **Journal** dans l'ordre de saisie, le plus récent en haut. Avant, les notes passaient sous les décisions du même jour : le critère tombait sous « Façon : Isobarique » (E4). La fixture garde son ordre.
6. **Le pourquoi d'un choix est proposé, jamais posé seul.**
   - Choisir garde « à confirmer », avec les raisons tirées du tableau, décochées et marquées « exemple ». Il en touche une, ou il écrit la sienne.
   - Journal, bandeau, liste et réponse « Pourquoi ce fournisseur ? » disent « pourquoi à confirmer » tant qu'il n'a rien touché. Pourquoi offre « Pourquoi à confirmer › » pour revenir au choix.
7. **E15.** La ligne ouverte de Comparer met le fournisseur et le délai sur toute la largeur, Fiche et Choisir dessous. « Getränketechnik Ost · AT » et « 11’100 CHF, délai 6 semaines » tiennent chacun sur une ligne.
8. **Façon écartée : ses articles sont hors jeu**, sans rang, parmi les Écartés (« façon écartée »).
   - Ventilation : le n° 1 sur l'humidité est Hotte inox 120. Extracteur hélicoïde, de la façon Extracteur mural, est écarté.
   - Un lien d'une façon écartée garde sa façon (avant, il la perdait). Le message le dit.
9. **Écrans relevés par l'audit** (final joué avant, `%TEMP%\audit-final\m1..m3.png`) :
   - **Noter en paysage.** Clavier simulé de 190 px en paysage (300 en portrait). Le champ restait sous le clavier (y 381 pour 200 px visibles) : il monte au-dessus, et la dernière note reste visible au-dessus de lui.
   - **Lien sans aperçu, à la main.** Garder était sous le clavier. Il passe dans la barre du bas, qui remonte au-dessus du clavier. Lire avec l'IA devient secondaire pendant la saisie. Le champ touché est amené au-dessus du clavier (portrait et paysage).
   - **Fiche et veille.** « Dernier passage 8 oct. · prochain 11 oct. » le 16 nov. devient « Dernier passage 16 nov. · prochain 19 nov. · prix inchangé depuis le 8 oct. ». Une veille neuve est datée d'aujourd'hui.
   - **Comparer à 390** : point 7.
   - **Choisir en paysage.** Terminé recouvrait le champ « Ton pourquoi ». Le panneau passe sur deux colonnes : à gauche le choix et le pourquoi, à droite le champ, les écartés et la veille. Terminé va dans la barre du haut. Le champ reste visible au-dessus du clavier.

## Ce que la liste a changé dans le scénario (`prep-scenario.mjs`, mêmes gestes ailleurs)
- E3 et les façons des carnets courts sont **tapées**, puisque le bloc est retiré.
- E16 : rien n'est gardé avant son toucher (« sans raison notée » contrôlé), puis il confirme deux raisons. Nouvelle capture `E16c-confirme`.
- Choix courts (E19, E20, E21) : il touche la première raison, puis il écrit la sienne.
- E19.4b : l'annonce ricardo est un frigo vitrine, de la façon écartée. Elle est écartée, sans rang, et la fiche dit « Écarté : façon écartée : Frigo vitrine pro ». Avant, elle était « – » et « Pas classé ».
- E25b : Vitrine 700 L de la fixture (façon Frigo vitrine pro, écartée dans la fixture) est hors jeu dans le tableau comme dans la fiche. Avant, elle était 2ᵉ. C'est la règle du point 8, appliquée partout.

## Preuves
- `node scenario.mjs` → **SCENARIO OK, 47 étapes**. Cibles masquées au toucher : aucune. Console : aucune erreur (`SCENARIO.md`, `scenario.log`).
- `node audit.mjs . captures/audit` → **AUDIT OK** (`audit.log`) :
  - THEME : fond cave `rgb(18,16,14)`, clair `rgb(255,255,255)` ; onglet actif « Stocks » `#A3C97A` / `#4C6B2A` ; fil « Stocks › Matériel ».
  - MESSAGE-PLACE : bande 645–718, champ 719, + 718 ; 0 ligne visible passée sous la bande.
  - MESSAGE-NAVIGATION : message absent après changement d'onglet.
  - NOTER-PAYSAGE : 200 px visibles, bas du champ 191, dernière note 60–130 au-dessus du champ (135).
  - COMPLETER-MAIN : en portrait, champ 398–446 et Garder 480–528 pour 544 px visibles ; en paysage, champ 84–132 et Garder 140–188 pour 200.
  - CHOISIR-PAYSAGE : Terminé en haut, sans chevaucher le champ ; au clavier, champ et Ajouter à 76–124 pour 200 px visibles.
  - LIGNE-OUVERTE : 1 + 1 ligne.
  - VEILLE : prochain passage le 19 nov. ; l'interrupteur bascule.
- Captures ouvertes en plein format et comparées à final, planches 01, 02, 06, 07, 08 et 12 :
  - `captures/vue1.png` : E16b, E19a, E21a, fixture E25a et E25b, E27 ;
  - `captures/vue2.png` : paysage E23, E26 et E26b ;
  - `captures/audit/m1.png` à `m3.png` : liste et carnet dans les deux thèmes, message, ligne ouverte, paysage, à la main, veille, choisir.
  Seuls les 9 points changent, plus leurs suites directes : façon non répétée en sous-ligne, puce choisie neutre.

## Limites, à dire
- Une bande de message peut couper une rangée de puces quand le même geste ajoute du contenu en haut (le critère posé en E19a, E20a, E21a). La rangée passe derrière la bande comme derrière le champ, et revient quand le message part. Un toucher n'y est jamais bloqué (« cibles masquées : aucune »).
- Contrôles du dépôt non rejoués ici : `controle-teinte`, `controle-choix`, `scripts/theme/contraste.mjs`. Les couleurs sont les valeurs de DESIGN.md, mais les fonds teintés (zone et houblon à 10–16 %) sont des mélanges, pas des jetons purs.

DÉCISION À PRENDRE :
- (a) La brief et THEME-APP demandent « cave par défaut ». DESIGN.md dit « clair par défaut » depuis le 25.10. Ici, c'est cave par défaut, et `?theme=clair` donne le clair de DESIGN.md.
- (b) La place du carnet dans l'app est un choix ouvert (CADRE : onglet propre, Finances ou « + »). Ici, Stocks, où vit le Matériel : choix réversible, à lui montrer en variantes si besoin.
