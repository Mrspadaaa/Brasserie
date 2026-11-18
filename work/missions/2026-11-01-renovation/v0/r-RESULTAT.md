OK — série r : 4 mini maquettes, huit états jouables chacune, contrôles du brief verts

Série reno-r (Opus), dans la langue de l'app en ligne : en-tête, barre du bas et +, cartes teintées du Bord et formes de
Finances › Prévisions reprises telles quelles, puis étendues (plancher à enrichir, L07). Données fictives seulement : ses cinq
titres, puis des montants, des artisans (« Ventil'Demo Sàrl », « Sanitaire Fictif SA ») et des heures inventés. Skills chargés :
boosters-ux, impeccable (craft-floor). ui-design-system n'est pas chargé : les jetons sont ceux de l'app (`themes.css`).

## Axes couverts (fiche § Axes)
| id | chaleur | place | forme | mot | argent | temps | étapes |
|---|---|---|---|---|---|---|---|
| r1 | froide | le Bord, carte « Ensuite » + liste | liste par état, pastilles | Rénovation | reste à payer seul | aucun | Noter l'achat seul |
| r2 | tiède | Finances › Prévisions › Projets élargis | file par flèches dans Bientôt · Ensuite · Plus tard | Local et travaux | caisse des Prévisions, « caisse à renseigner » | heures par manque | Noter l'achat seul |
| r3 | chaude | écran à lui, depuis le Bord | vraie vue figurée : la brasserie en plan | Rénovation | enveloppe qu'il fixe | heures par manque | cases à cocher |
| r4 | chaude | écran à lui, depuis le Bord | file ordonnée à la taille des heures | Ce qui me manque | reste à payer seul | fin estimée si heures et rythme connus | Noter l'achat seul |

Les trois places sont couvertes ; chaque variante tient les six axes.

## r1 — une carte « Rénovation » en tête du Bord (froide)
- **L'idée** : une carte de plus sur le Bord, avec « Ensuite » en gras, les autres manques numérotés avec une flèche « faire
  ensuite », des pastilles d'état, « Reste à payer » seulement si un prix existe, et « Noter un manque » au pied de la carte.
- **Ce qui tient** : se lit en trois secondes (capture encours, regardée en plein format) ; jour 1 = cinq titres nus ; cartes du
  Bord avec leur corps (« Aucun brassin en cuve. », « Stocks suffisants »).
- **Ce qui casse** : le champ d'ajout est en haut de l'écran, mal placé pour une main (écart écrit dans la NOTE) ; une teinte de
  domaine en plus (ardoise `#2C6670`).

## r2 — les Projets de matériel élargis à « Local et travaux » (tiède)
- **L'idée** : rien de neuf à côté de l'app. Les horizons Bientôt · Ensuite · Plus tard deviennent la file (flèches ▲▼). Le
  formulaire gagne nature, heures et blocage, et un récap en jauge pose le reste à payer contre la caisse.
- **Ce qui tient** : c'est le modèle qui existe (`timing`, `stage`, `renovation`) ; « caisse à renseigner » en `encours`, puis
  caisse 3 200,00 → « reste 1 120,00 » en `caisse` ; ajout en bas, sous le pouce.
- **Ce qui casse** : au jour 1, Bientôt et Ensuite sont vides (nommés « 0 ») ; l'écran reste au 3ᵉ niveau de Finances (J3).

## r3 — la brasserie en plan, numérotée dans la suite (chaude)
- **L'idée** : le numéro du repère sur le plan est la place dans la suite. Le plan dit où, la liste dit quand ; ce qui manque
  est en pointillé, ce qui existe est plein, le sol est hachuré tant que la 2ᵉ passe n'est pas finie. Le site vit dans une
  zone « En ligne ».
- **Ce qui tient** : chaque zone est nommée (D259) ; l'armoire ouverte montre « Bloqué par ① Seconde passe sur les sols », lié au
  repère ; enveloppe 5 000,00 → « libre 520,00 ».
- **Ce qui casse** : le plan est un schéma inventé. Le brasseur doit poser le sien, un geste de plus (risque écrit). Le contraste
  des noms de zone sur le hachuré était à 4,09:1 : corrigé par un halo blanc. À 1280, le plan est plafonné à 480 px.

## r4 — « Ce qui me manque », la file à la taille de mes heures (chaude)
- **L'idée** : la hauteur d'un bloc suit ses heures restantes, une ligne par heure. Une règle cumule les heures à gauche et
  s'arrête au premier inconnu (« ? »). Le drapeau « Fin » dit, selon les cas : « heures à estimer », « rythme à régler » ou
  « ≈ 06.12 » (26 h à 6 h par semaine).
- **Ce qui tient** : aucune date sans heures et rythme connus ; le récap en deux tuiles touchables renvoie au reste par bloc.
- **Ce qui casse** : les blocs sont en partie blancs, puisque leur hauteur est la donnée. Cela fait baisser le remplissage du
  PANEL. Au jour 1, les cinq blocs hachurés se ressemblent.

## Sorties des contrôles (depuis la racine, `<dir>` = `work/missions/2026-11-01-renovation/v0`)
- `controle-choix.mjs <dir>/<id> --ecran=renovation` : `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))`, pour r1 à
  r4. L'écran n'a pas d'entrée dans `ecrans.json`, comme prévu.
- `controle-commun.mjs <dir> r1 r2 r3 r4 --page=etat.html --profil=sans-houblons --sans-lignes` : **COMMUN OK**. Avant
  correction : r1 « S4, 2 épaisseurs de trait d'icône », traits ramenés à 1,5 px ; r3 « contraste ECHEC » sur Brassage, Lavage et
  Accueil.
- `mots-premier-ecran.mjs … --max=60 --sans-lignes` : r1 34 mots, r2 29, r3 31, r4 15 → **MOTS OK** ×4.
- `controle-contraste.mjs` : **CONTRASTE OK** ×4. Pire : r1 « Brassins » 4.78:1, r2 « Projets » 5.17:1, r3 « Bord » 5.61:1,
  r4 « Fin : heures à estimer » 5.58:1 (5 textes sur dégradé, non mesurables).
- `verifier-page.mjs <dir>/<id>/etat.html --min-images 0` : **PAGE OK** ×4 (390 px, sans erreur).
- `controle-panel.mjs` (contrôle du concepteur, hors liste du brief) : **PANEL ECHEC**.
  - Sur les quatre `encours` : remplissage médian 0,49 (< 0,55) et ressemblance 0,94 (≥ 0,90).
  - Sur les 32 captures : médiane 0,47, 19 % de paires presque identiques. Les huit états d'une même variante se ressemblent
    forcément.
  - Cause : l'en-tête et la barre du bas sont imposés tels quels, la page est blanche, et les lignes blanches entre les rangées
    ne comptent pas. Le jour 1 est réellement maigre (cinq titres).

## Captures (toutes ouvertes ; planches puis plein format pour r1 encours, r4 encours, r3 encours 1280)
- Planches : `v0/r1/r1-planche.png`, `v0/r2/r2-planche.png`, `v0/r3/r3-planche.png`, `v0/r4/r4-planche.png`.
- Par état, à 390 : `v0/<id>/<id>-{jour1,encours,ajout,ouvert,depasse,caisse,fini,horsligne}-390.png`. À 1280 :
  `v0/<id>/<id>-encours-1280.png`.
- Gestes : `v0/<id>/<id>-geste-*.png`, définis dans `gestes.json` (3 par variante).
- Rejeu : `node work/missions/2026-11-01-renovation/v0/r1/capturer.mjs r1 r2 r3 r4` → `CAPTURES OK`.

## Fichiers écrits
`v0/r1..r4/etat.html`, `NOTE.md`, `gestes.json`, les captures, `v0/r1/capturer.mjs` (sert à toute la série) et ce fichier. Rien
hors de `v0/r*` (planches HTML temporaires dans `os.tmpdir()`).

## Prédiction
r3 l'arrête (« avoir une vraie vue comme ça c'est top »), mais il demandera si c'est son local. Il gardera r1 ou r2 pour noter
vite. r4 le séduira si la date de fin lui parle, et « rythme à régler » risque de lui paraître une corvée.

DÉCISION À PRENDRE : aucune dans ce contrat. Après son choix, l'accord groupé de la fiche s'applique : champs facultatifs dans
`financialPlans` ou nouvelle collection. Pour r3 s'y ajoute un plan à stocker.

CONNAISSANCE : `controle-panel.mjs` pénalise une série tenue de reprendre la barre et l'en-tête de l'app, et compte comme vides
les lignes blanches entre les rangées. Sur une série « dans la langue de l'app », la ressemblance tourne autour de 0,94 quoi
qu'on fasse.

LEÇON PROPOSÉE : un brief qui impose le chrome de l'app tel quel devrait dire si `controle-panel.mjs` s'applique, et sur quelles
captures (un état par concept ou tous) ; sinon le concepteur choisit seul entre la baseline et le PANEL.

DEMANDE EXECUTANT : aucune pour la v0.
