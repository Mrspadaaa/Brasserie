# Persona ux, itération 2 (25.11)

Regard : concepteur d'interfaces mobiles compactes, pas le brasseur. Grille : boosters-ux (B1 à B13) et impeccable (mode Operate),
soumis à DESIGN.md et à ses plaintes (CARNET-COHERENT, CHAMP-CARNET-REPLIE, CARNET-REPOND-AU-BESOIN, CARNET-LISTE-COMPACTE).
Jugé après la correction 1, sur les 41 captures courantes de `cap/`, toutes ouvertes : M1 (10 : note, attente, cherche,
cherche-bas, change, decide, resolu, relire, hors-ligne, achat), M2 (9), M3 (9 : note, range, annuler, options, decide,
resolu, relire, achat, hors-ligne), M4 (10 : noter, range, options, decide, notes-lues, sans-ia, resolu, relire, memo, annuler).
`m1-avant`, `m1-apres` et `m1-annuler` sont des copies octet pour octet de `note`, `cherche` et `change` (même md5). `m3-avant`,
`m3-apres`, `m4-avant` et `m4-apres` datent de 17:11, d'avant la correction (v0) : ils ne sont pas jugés ici, mais page.html les
montre encore. Mesures prises dans le CSS des maquettes, en px CSS (la moitié de la capture de 780 px).

Légende : **B** = bloquant (geste impossible ou caché, valeur fausse ou invérifiable, élément demandé absent, texte
illisible) ; **m** = mineur ; **D** = doute, non compté.

Problème commun, compté une fois dans chaque maquette :
- **m, action IA toujours pleine** : « Ranger » (M1, M2, M4) ou « Annoter » (M3) reste un bouton violet plein dans tous les
  états, même quand aucune note n'attend et sur un carnet résolu relu des mois après. Il dispute la dominante aux vrais gestes
  de l'état (« Garder la tâche », « Retenir ») (B2). Correction : contour au repos, plein seulement quand une pastille
  « n à ranger » existe.

---

## M1 · Le carnet se range : 9 problèmes, 0 bloquant

Itération 1 : les 10 problèmes sont corrigés.
- B1 (changements invisibles) : corrigé. Ses lignes ne sont plus réécrites, seulement déplacées et numérotées. La feuille dit
  « même texte, autre ordre » (`m1-cherche`, `m1-change`).
- B2 (annulation tout ou rien) : corrigé. Feuille case par case, sources n1 à n8, « Avant, 21:30 » et « Garder 6 sur 7 »
  (`m1-change`).
- B3 (parcours) : corrigé. Les 10 états couvrent tout le parcours.
- m4 (bandeau à la place de l'en-tête) : corrigé. L'en-tête reste, « Voir, défaire » est en barre basse.
- m5 et m6 (saisie de 137 px, note seulement par « Ranger ») : corrigés. Champ de 44 px au repos (`.m1-champ`), « Coller » passe
  dans la barre du clavier, « Ajouter » pose la note brute, pastille « 1 » et « pas encore rangée » (`m1-note`).
- m7 à m10 : corrigés. La tâche a une case et « Quand ? » libellé, il n'y a plus de chasse fixe, le CSS ne garde que 3 tailles
  (14, 16 et 24 px) et des titres neutres, le micro est présent.

Nouveaux :
1. **m** Action IA toujours pleine (problème commun ; `m1-cherche-bas`, `m1-relire`, `m1-achat`).
2. **m** L'ordre des sections change d'un état à l'autre. « Constat » (n1) est en tête dans `m1-cherche`, puis en bas dans
   `m1-decide` ; ses lignes changent de place à chaque rangement et la mémoire spatiale casse (B9). Correction : ordre de
   sections fixe, seul le contenu change.
3. **m** « Retenue » est un aplat vert plein, en forme de bouton (`m1-decide`, `m1-resolu`). On ne sait pas si c'est un état ou
   un geste pour revenir sur le choix (B3).
4. **m** Une même option a deux statuts. « Sanitaire pour la dalle · si la flaque reste » est rangé sous « Options écartées »,
   alors que la tâche garde n4 « → si la flaque reste » comme repli (`m1-decide`). Le mot juste est « en réserve » (M3, M4).
5. **m** La puce « ? à situer » sur n3 (`m1-cherche`) et « ? dalle pas trouvée » (`m1-hors-ligne`) reprennent le « ? » refusé
   (CARNET-COHERENT). La question posée (« Écartée » / « Pas encore cherchée ») suffit.
6. **m** Les compteurs hors ligne ne concordent pas : « 2 notes gardées », « 1 envoi à l'IA attend le réseau » et la pastille
   « 1 » sur « En file » (`m1-hors-ligne`).
7. **m** Les trois « Retenir » sont identiques et aucune option ne porte le conseil. Le conseil vit dans une carte plus bas, qu'il
   faut relier à l'option à la main (`m1-cherche`). M2, M3 et M4 marquent « conseillé ».
8. **m** Dans la relecture, la rangée « Écarté » mêle la phrase de l'IA et ses renvois, en encre noire comme ses notes (« Le
   sanitaire, ≈ 150 CHF estimé n7. La dalle, jamais cherchée… »), alors que « La cause trouvée » est en violet (`m1-relire`).
   On ne distingue plus qui parle.
9. **m** « Coût réel : pas noté, l'ajouter ? » est une case à cocher, mais cocher ne saisit pas un montant (`m1-resolu`, B3).
   Correction : un bouton « + Noter le coût », comme M4.
- **D** « quelques francs, estimé » pour l'option 1 : aucune note ne le dit encore (`m1-cherche`).
- **D** Pendant la lecture par l'IA, les notes passent en gris (`m1-attente`) : sont-elles encore touchables ?
- **D** Le bas de l'écran porte deux rangées en permanence, l'état et la barre, soit environ 103 px (12 %).

Parcours : noter vite ✓ · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ · options ✓ · décider ✓ (raison n10 « = ta raison ») ·
tâche ✓ (sans date, « Quand ? ») · résoudre ✓ (proposition « Valider 3 ») · relire pourquoi ✓ (« Pourquoi ce choix », chemin
daté, « Mes 11 notes » dans l'ordre) · carnet hors problème ✓ (achat, frise Noté → Je compare → Choisi → Reçu) · sans IA ✓ ·
annuler ✓.
**Note : 8/10** (5,5 à l'itération 1). C'est le parcours le plus complet et le plus lisible. Il reste le prix du modèle : la
page se réordonne à chaque rangement.

## M2 · La fiche au-dessus : 10 problèmes, 0 bloquant

Itération 1 : 10 problèmes corrigés sur 11, 1 en partie.
- B1 (fait ou proposé) : corrigé. Les tuiles sont appliquées et annulables, l'état et la tâche sont « Proposé » en pointillé,
  avec Oui / Non (`m2-apres`).
- B2 (annulation cachée) : corrigé. « 6 changements · revoir » est un bouton, la feuille a ses cases et ses notes sources
  (`m2-annuler`).
- B3 (parcours) : corrigé, avec 9 états.
- m4 (fiche à 52 %) : en partie. À l'état après, la fiche occupe encore environ 400 px (47 %), mais ses 6 notes restent visibles.
  Elle se replie ensuite en jetons (`m2-options`). Ce n'est plus compté.
- m5 à m11 : corrigés. Le titre n'est plus redit, les notes forment un seul bloc numéroté avec un trait violet, la saisie tient
  sur une rangée (`.m2-champ` 42 px), « Ranger » est libellé, les renvois s'écrivent « n°2 », il n'y a plus de « nouveau » ni
  de chasse fixe, le micro est présent.

Nouveaux :
1. **m** Action IA toujours pleine (problème commun ; `m2-relire`, `m2-memo`).
2. **m** Les hachures roses reviennent partout : « Pas trouvé » (`m2-apres`), « ✕ dalle » et « Chercher sous la dalle »
   (`m2-options`), « dalle : pas en cause » (`m2-resolu`). C'est le motif voisin du refus de CARNET-COHERENT (« case hachurée
   « ? » ») ; le ✕ rouge suffit.
3. **m** Trop d'aplats noirs : la tâche en bandeau noir, « Mettre », « Oui » et « Garder », plus « Ranger » en violet plein
   (`m2-apres`, `m2-decide`). Trois ou quatre dominantes par écran (B2).
4. **m** Cibles sous les seuils : la case de la tâche fait 22 × 22 px (`.m2-tache .case`, sous 24 px) dans une rangée de 36 px ;
   Oui, Non, Garder et Mettre font 36 px (`.m2-btn`), sous les 44 conseillés (`m2-decide`).
5. **m** La suggestion « Coller entreprise-x.ch » remplit tout le champ (`m2-apres`) : on ne voit plus où taper sa note.
   Correction : pastille à côté du champ, comme dans le clavier de M1.
6. **m** « Retenu par toi » porte une raison rédigée par l'IA (« Parce que le joint est trouvé usé n°2 : une pièce, contre
   150 CHF… »), alors que sa note 7 n'est pas citée comme sa raison (`m2-decide`). La voix de l'IA est attribuée au brasseur.
7. **m** Le geste de résoudre n'est pas dessiné. `m2-resolu` montre déjà « Fermé par toi », et « L'IA avait proposé Résolu » ne
   reste qu'une phrase : on ne voit ni la proposition ni le toucher qui l'accepte (consigne 4).
8. **m** La fiche du mémo pèse plus que la note (`m2-memo`). Une ligne, « Le sol époxy a bien tenu », produit une puce Mémo,
   « Changer », deux tuiles et une proposition, soit environ 195 px. « À retenir : L'époxy a tenu » redit la note.
9. **m** Hors ligne, la tuile « Coût 150 CHF » perd « estimé » (`m2-sans-ia`) : la lecture de l'app fait d'une estimation un
   coût. Le renvoi n°6 permet de vérifier, d'où le mineur.
10. **m** 4 tailles de texte (14, 15, 16 et 18 px) ; 14 et 15 ne se distinguent pas (B6).
- **D** « une pièce, quelques francs » dans l'option conseillée : aucune note ne le dit à ce moment (`m2-options`).
- **D** La moitié basse reste vide dans `m2-avant` et `m2-memo` (cas courts).

Parcours : noter vite ✓ · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ · options ✓ (conseillé en tête, seul Retenir plein) ·
décider ✓ · tâche ✓ (date proposée depuis sa note 7, « Mettre » / « Non ») · résoudre ~ (résultat sans le geste) · relire
pourquoi ✓ (puces sourcées, note 2 surlignée) · carnet hors problème ✓ (mémo) · sans IA ✓ · annuler ✓.
**Note : 7,5/10** (6,5 à l'itération 1). C'est la plus sûre sur la confiance (régime clair, feuille, renvois n°), mais aussi la
plus chargée en aplats et en hachures.

## M3 · Dans la marge : 12 problèmes, 1 bloquant

Itération 1 : 9 problèmes corrigés sur 11, 2 en partie (encore comptés).
- B1 (croix de 20 px) et m5, m6 (mode gomme) : corrigés. Plus de gomme, mais la feuille « Changé par l'IA », cases de 26 px
  (`.m3-case`), « Version de 21:26 » (`m3-annuler`).
- B2 (« à acheter » illisible) : corrigé dans la feuille. Voir le nouveau B1 pour l'état hors ligne.
- B3 (parcours) : corrigé, avec 9 états, dont l'achat.
- m4 (marge serrée) : en partie, compté en 3 ci-dessous.
- m7 (saisie sur deux rangées) : en partie, compté en 4 ci-dessous.
- m8 à m11 : corrigés. « Coller entreprise-x.ch » nomme le lien, qui est posé sous n4 ; l'état est un sélecteur segmenté avec
  « Je cherche ? » en pointillé ; la tâche n'a plus de jour inventé (« Quand ? ») ; le micro est présent.

Nouveaux et restes :
1. **B** Hors ligne, la marge affiche « à acheter » en face de « Devis attendu », sans marque de doute (`m3-hors-ligne`). Les
   puces du haut disent « lu par l'app », pas la marge. C'est la valeur fausse que l'IA corrige elle-même à l'état rangé
   (« à acheter (lu par l'app) » barré, `m3-range`). Elle reste affichée tant que le réseau manque. Correction : « devis »,
   comme M2 (« Attendu · Devis ») et M1 (« devis attendu · n5 »).
2. **m** Action IA toujours pleine (problème commun ; `m3-relire`).
3. **m** (reste de m4) La marge est passée de 138 à 170 px (`.m3-l` : 24 / 196 / 170), mais les annotations se coupent encore
   (« coût estimé, / pas le devis », « coût de B, / pas de A »). Les étiquettes « constat » et « étape » ne disent rien au coup
   d'œil (`m3-range`, `m3-decide`).
4. **m** (reste de m7) Quand le presse-papiers contient un lien, la rangée « Coller entreprise-x.ch · copié à 21:25 » s'ajoute
   au-dessus du champ. La saisie fait alors environ 132 px, et le champ prend 3 lignes avec la vignette (`m3-note`).
5. **m** Les lettres A, B et C obligent à retenir un code. Hors de la carte Options, « B ou C », « C en réserve » et « coût de B,
   pas de A » sont opaques (`m3-decide`, `m3-resolu`). En relecture, « Pourquoi A, le 25 nov. » ne nomme jamais l'option
   (`m3-relire`).
6. **m** Logique du repli : « Si la flaque revient : B ou C » (`m3-options`, `m3-decide`). Or B, « Le sanitaire change le
   joint », n'a plus de sens une fois le joint changé soi-même ; seul C tient. Le conseil et la tâche ne disent donc pas tout à
   fait la même chose (consigne 2).
7. **m** Deux entrées vers la même feuille, « ↶ Changé » en en-tête et « Revoir » en barre basse (`m3-range`). La barre d'état
   disparaît ensuite aux autres états (`m3-options`, `m3-achat`).
8. **m** Redondance : les puces sous le titre et la marge disent la même chose. « 150 CHF estimé » répond à « coût estimé, pas
   le devis », et « devis : pas encore reçu » apparaît deux fois (`m3-range`).
9. **m** Relecture : deux segments sont marqués à la fois, « Décidé » cerclé violet et « Résolu » en noir (`m3-relire`).
   Lequel est l'état ?
10. **m** Relecture : la citation est tronquée. Elle donne « Joint changé, 12 CHF » pour « Joint changé, 12 CHF la pièce. »,
    sous la promesse « tes mots, pas réécrits » (`m3-relire`).
11. **m** Le geste de résoudre n'est pas dessiné. `m3-resolu` montre déjà « fermé par toi » ; la proposition de l'IA et son
    acceptation manquent (consigne 4).
12. **m** 7 tailles de texte (12, 13, 14, 15, 16, 18 et 24 px). La puce « conseil : d'abord » fait 12 px, en blanc sur violet
    (`.m3-conseil`, `m3-options`). B6 en demande 3.
- **D** Les cercles de lettres font 22 px (`.m3-let`) : sont-ils touchables ? S'ils le sont, ils passent sous les 24 px.
- **D** L'achat met en rouge d'erreur des points simplement à vérifier, « largeur ? » et « prix à revoir » (`m3-achat`).
- **D** Les lignes vides du papier prennent encore environ 40 % de l'écran au départ (`m3-note`).

Parcours : noter vite ✓ · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ (coût réel 12 CHF en marge) · options ✓ · décider ✓ ·
tâche ✓ · résoudre ~ (résultat sans le geste) · relire pourquoi ✓ (citations, « raison 1 à 3 » en face des notes ; l'option n'est
nommée que par sa lettre) · carnet hors problème ✓ (achat comparé, tâche « mesurer la largeur ») · sans IA ✗ (valeur fausse) ·
annuler ✓.
**Note : 6,5/10** (5,5 à l'itération 1). L'idée tient, et la relecture en face des notes est la plus parlante. Mais la marge
reste serrée, les codes lettres coûtent, et l'état hors ligne affiche une valeur fausse.

## M4 · Deux vues : 10 problèmes, 0 bloquant

Itération 1 : 11 problèmes corrigés sur 12, 1 en partie (encore compté).
- B1 (Mes notes fusionnées) : corrigé. Une ligne par note, telle quelle (`m4-noter`).
- B2 (pas de champ dans Organisé) : corrigé. La même barre de 44 px est présente dans les deux vues (`.m4-champ`). La note 7 est
  « tapée dans Organisé », puis rangée dans Mes notes (`m4-notes-lues`).
- B3 (parcours) : corrigé, avec 10 états.
- m4 à m7 : corrigés. La feuille « Avant l'IA · 21:26 » a des renvois « notes 2, 3 › » ; la barre Estimé devient la ligne
  « 150 CHF estimé note 6 · devis attendu note 5 » ; la tuile de la dalle porte un ✕ rouge, « cherché, pas trouvé » ; il n'y a
  plus de chasse fixe.
- m8 (chiffres nus) : en partie, compté en 9 ci-dessous.
- m9 à m12 : corrigés. La corbeille rouge est retirée ; un trait violet et un mot (« trouvé », « coût », « raison ») marquent
  les notes lues ; les pastilles « 6 à ranger » et « à jour » s'affichent sur l'onglet ; le CSS ne garde que 3 tailles (14, 16
  et 20 px) ; le micro est présent.

Nouveaux et restes :
1. **m** Action IA toujours pleine (problème commun ; `m4-relire`, `m4-memo`).
2. **m** La revue empile 4 propositions, chacune avec « Non » et un « Garder » violet plein, plus « Tout garder » : 9 boutons et
   aucune dominante (`m4-range`, B2). Correction : « Tout garder » en seul bouton plein, une case par ligne comme dans la feuille.
3. **m** Le mode d'emploi s'affiche en permanence : la carte « Pas encore rangé » en 3 étapes fait environ 185 px sous ses
   notes (`m4-noter`), et la légende « Trait violet : note lue par l'IA… » ferme la liste (`m4-notes-lues`). C'est du texte
   d'aide à chaque carnet ; une fois suffit.
4. **m** Huit titres en capitales : « L'IA PROPOSE · RIEN SANS TOI », « OPTIONS · RETIENS-EN UNE », « ENSUITE », « EN
   RÉSERVE », « LE CHEMIN », « N'A PAS SERVI », « CE QUE TU SAVAIS ALORS », « TES 3 NOTES, TELLES QUELLES ». C'est le bruit déjà
   relevé dans M1 à l'itération 1 (`m4-range`, `m4-relire`, `m4-memo`).
5. **m** L'ordre est inversé à l'état options : le conseil arrive en bas, sous la tâche et le repli (`m4-options`). La raison
   suit le geste au lieu de coiffer les options.
6. **m** Les « Retenir » des options en réserve sont gris et se lisent comme désactivés (`m4-decide`). Peut-il encore changer
   d'avis ?
7. **m** Hors ligne, trois aplats noirs se disputent la vue (« Cocher », « Garder », la tâche), et le titre « Lu par l'app, sans
   IA » est redoublé par une puce « lu par l'app » (`m4-sans-ia`).
8. **m** Mémo : environ 600 px d'« Organisé » pour 3 notes (`m4-memo`). Les puces « Te resservira pour » (refaire un sol,
   choisir un revêtement, la soude) sont ajoutées par l'IA, sans geste clair : touchables ou pas (B3) ?
9. **m** (reste de m8) Un chiffre nu demeure : « cherché, pas trouvé · 3 », à côté de « trouvé · note 2 » (`m4-range`,
   `m4-options`).
10. **m** Deux lignes d'horodatage précèdent la note 1 : « 24 nov. · 21:18 · ta 1re note a fait le titre », puis « 21:26 »
    (`m4-noter`, `m4-notes-lues`). On ne sait pas de quand date la note 1.
- **D** « quelques CHF » dans l'option conseillée : sa note 7 le dira, mais seulement après (`m4-options`).
- **D** La phrase « La dalle : « si la flaque reste », elle n'est pas revenue » est confuse : c'est la flaque qui n'est pas
  revenue (`m4-relire`).

Parcours : noter vite ✓ (dans les deux vues) · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ (« Coût du joint : pas noté · +
Noter ») · options ✓ · décider ✓ (sa raison citée, note 7) · tâche ✓ (« Quand ? ») · résoudre ✓ (« Décidé → Résolu ? Garder »,
puis « Résolu gardé par toi ») · relire pourquoi ✓ (« Pourquoi tu as pris ça », « Ce que tu savais alors », retrouvé par
« siphon ») · carnet hors problème ✓ (mémo) · sans IA ✓ · annuler ✓.
**Note : 8,5/10** (7 à l'itération 1). C'est la plus juste sur le modèle : ses mots ne bougent jamais, Organisé se défait, la
relecture est la meilleure des quatre. Ce qui reste relève de l'allègement (boutons, aides, capitales), pas de la structure.

---

## Greffes proposées au concepteur
- Le « + Noter » du coût réel de M4 remplace la case « Coût réel » de M1.
- La revue de M4 passe par une case par ligne et un seul « Tout garder », sur le modèle de la feuille de M2.
- La relecture de M4 (« Ce que tu savais alors », « Écarté », « Si ça revient ») sert de modèle à M3 : nommer l'option, pas sa
  lettre.
- Le statut « en réserve » de M3 et M4 remplace « Options écartées » dans M1 pour le repli.
- Dans les quatre maquettes, « Ranger » ou « Annoter » passe en contour au repos, et devient plein seulement avec la pastille
  « n à ranger ».
- Dessiner le geste « Résolu ? » proposé, puis accepté, dans M2 et M3 (M1 et M4 le montrent).
- Remplacer les captures v0 encore citées par page.html (`m3-avant`, `m3-apres`, `m4-avant`, `m4-apres`, de 17:11).
