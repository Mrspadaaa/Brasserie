# Analyse a1 — Stocks › Matériel, l'écran en ligne (14.11.2026)

Juge : critique, en Opus (Fable interdit). Sources : sa capture `brasseur/14-11-stocks-materiel.jpg` (en ligne, 390), les 31 captures
de `banc/` (toutes ouvertes), le code de la copie `materiel-banc` (`EquipmentList.tsx`, `EquipmentSheet.tsx`, `EntityList.tsx`,
`StocksTab.tsx` l. 627-647, `ExpenseSheet.tsx`, `purchaseEntry.ts`, `finance/types.ts`, `BrewhouseSettings.tsx`, `types/index.ts`).
Mesures en px CSS (captures 390 à DPR 2, lues sur l'image ÷ 2).

Sa question : « Qu'est-ce qui demande mon attention dans mon matériel, et où en est chaque appareil ? » L'écran actuel n'y répond
pas : il liste des noms et un état saisi à la main. Sa phrase prédite : « C'est une liste de noms. Je vois pas ce qui est à faire, ni quand. »

## Problèmes

Gravité : **bloquant** (valeur fausse, geste sans effet, question non répondue), **gênant**, **mineur**.

P1 — **bloquant** — Liste, À traiter, 390 et 1280, deux thèmes. « À traiter » ne compte que l'état saisi à la main
(`needsWork` : `state === 'À réparer' || 'À entretenir'`). Le pH-mètre « Étalonner chaque mois (pH 4 et 7) » et la cuve « Joint du
robinet chaque année » n'y entrent jamais. Sa capture en ligne montre « À traiter · 0 » sur 12 appareils, dont un pH-mètre. Le compteur
dit « rien à faire », ce qui est faux. Brasseur : « À traiter 0 ? Mon pH-mètre s'étalonne tous les mois. »

P2 — **bloquant** — Liste et fiche, partout. L'entretien est un texte libre (`maintenance?: string`), sans date ni intervalle : ni
dernier entretien fait, ni prochaine échéance, ni retard. « Détartrer après 5 brassins » ne dit pas combien de brassins sont passés.
La question « où en est chaque appareil ? » n'a pas de réponse. Brasseur : « Quand ? Ça dit pas quand. »

P3 — **bloquant** — Liste et fiche. Aucun geste « fait ». Pour noter un entretien ou un étalonnage, il faut ouvrir la fiche, passer
l'état de « À entretenir » à « Bon », puis Enregistrer : trois touchers, et rien n'est daté ni gardé. Le geste n'a donc aucun effet
durable, et l'écran ne peut pas savoir quand reviendra le prochain entretien. Brasseur : « Je l'ai fait, et ça le sait même pas. »

P4 — **gênant** — Ligne « Pompe de recirculation », 390 et 1280. La panne s'affiche « Brassage · EQ-003 · Note » avec la pastille
« À réparer ». La cause (« fuit au raccord ») est cachée derrière le mot « Note », sans dire depuis quand. Le mot « Note » seul ne
mène nulle part (`' · Note'` quand `notes` existe). Brasseur : « Note de quoi ? Elle a quoi, la pompe ? »

P5 — **gênant** — Liste, 1280 deux thèmes, et 390 en ligne. La liste vit dans un défilement interne (Virtuoso, `flex-1 min-h-0`).
À 1280, seules 10 lignes sur 13 sont rendues : « Hotte recyclage » finit pile au bord du cadre. Rien ne signale qu'il en reste trois
(Moulin à malt, pH-mètre, Réfractomètre), donc l'appareil à étalonner est invisible. À 390, sa capture montre une ligne coupée, puis
une bande morte d'environ 55 px avant la barre du bas. Au banc, ~30 px plus la pastille du compagnon. Brasseur : « Il en manque. Où est mon pH-mètre ? »

P6 — **gênant** — Recherche, 390 clair. « mètre » rend 7 lignes, dont 4 fausses : Balance 0,1 g, Hotte recyclage, Refroidisseur
à plaques et Pompe de recirculation. La recherche est floue et trop large : Fuse `threshold 0.4`, `ignoreLocation`,
`minMatchCharLength 1`, et elle cherche aussi dans l'état, l'entretien et les notes. Brasseur : « J'ai tapé mètre, pourquoi la balance ? »

P7 — **gênant** — Liste, 390. Chaque ligne est une carte de 53 px (pas de 58 px). Elle montre le nom, « Catégorie · EQ-0xx » et
une pastille. Il n'y a ni échéance, ni dernier entretien, ni valeur. La liste commence à 187 px du haut : 9 lignes au premier écran
au banc, 7 dans sa capture. C'est beaucoup de place pour peu d'information. Brasseur : « Ça me dit rien de plus que le nom. »

P8 — **mineur** — Ligne et sous-titre de fiche, partout. La référence « EQ-008 » est répétée sur chaque ligne et dans l'en-tête
de la fiche (« Mesure · EQ-005 »). C'est un code de tableur, qu'il ne cherche ni ne dit jamais. Brasseur : « EQ-008, je m'en fous. »

P9 — **gênant** — Liste, 390 et 1280. Matériel ne parle pas la langue d'Articles (son écran choisi, `ref-articles-*`). Il n'a ni
picto de rayon, ni barre de couleur, ni rayon pliable par catégorie : ce sont des cartes grises génériques. On dirait un autre
produit. Brasseur : « Ça ressemble pas au reste des stocks. »

P10 — **gênant** — Liste, 1280 deux thèmes. Les lignes s'étirent sur 1 240 px : le nom est à gauche, le chevron à 1 220 px de
lui, et il n'y a aucune colonne. Articles, à 1280, est un tableau (Article, EBC, En stock, échelle, Dernier mouvement, Fournisseur).
Ici, la largeur ne sert à rien. Brasseur : « Tout ce blanc, et toujours que le nom. »

P11 — **gênant** — Fiche, 390 et 1280. La fiche est un formulaire d'édition dès l'ouverture : champs Nom, Catégorie, État,
Entretien. Le nom figure deux fois (titre et champ). Il n'y a rien à lire : pas d'historique, pas de dépenses, pas d'échéance. La
fiche d'Articles (`ref-article-fiche`) montre le stock, le besoin, « Ce qui a bougé », puis la correction. Brasseur : « J'ouvre pour
voir, pas pour remplir. »

P12 — **gênant** — Fiche « Cuve d'ébullition » et « Moulin à malt ». Les dépenses reliées sont invisibles. L'achat lie déjà la
fiche (`equipmentRef`), et une ligne « Entretien / réparation » de Dépense relie l'appareil entretenu (enregistrée en `service`,
sous-catégorie « Entretien »). Pourtant la fiche ne montre que la date et le prix recopiés, sans la pièce ni les entretiens payés.
Brasseur : « J'ai payé le joint, c'est où ? »

P13 — **gênant** — Fiche, 1280 deux thèmes. La feuille monte du bas sur toute la largeur : champs de 1 264 px et sélecteur « État »
de 1 264 px (« Neuf » à 160 px, « À réparer » à 1 108 px). C'est un formulaire de téléphone étiré. Brasseur : « Sur l'ordi,
c'est immense pour quatre champs. »

P14 — **gênant** — Fiche › Gestion du matériel, 390. La seule sortie d'inventaire est « Supprimer », rangée dans un repli qui ne
contient que ce bouton. Un appareil vendu ou réformé perd son historique. L'actif comptable sait pourtant noter une cession
(`FinancialAsset.disposedDate`, `disposalProceedsCents`), mais rien ne relie les deux. Brasseur : « Je l'ai vendu, pas jeté. »

P15 — **gênant** — Actions, 390 deux thèmes. Le geste principal (« Enregistrer un achat ») est caché sous un repli de 29 px,
« Actions du matériel », qui ne contient aucun verbe. Une fois déplié, les boutons font 23 px de haut, sous les 44 px exigés pour un
geste principal (brief §4). Brasseur : « Pour ajouter un truc, faut deviner qu'il faut ouvrir ça. »

P16 — **mineur** — Actions dépliées, 390, et barre à 1280. « Projets d'équipement » est un lien gris clair sur sa propre ligne, à
côté de deux vrais boutons ; il se lit comme désactivé.

P17 — **gênant** — Vide, 390 clair. Il n'y a que « Aucun équipement enregistré » et un grand blanc. Aucune action n'est visible :
les deux façons d'ajouter restent dans le repli fermé. Brasseur : « Et je fais quoi ? »

P18 — **mineur** — Recherche sans résultat, 390. Les compteurs « Tout · 13 » et « À traiter · 2 » ne bougent pas pendant la
recherche, alors que 7 ou 0 lignes s'affichent. La phrase d'aide « La recherche tolère les fautes… » est permanente. Il manque
l'action « Ajouter « zzz » ».

P19 — **mineur** — Fiche « Pompe de recirculation » et Nouveau, 390. Le champ Entretien vide affiche le texte d'exemple « Joint à
changer chaque année », en gris moyen. Sur une pompe « À réparer », il se lit comme une consigne réelle.

P20 — **mineur** — Liste et fiche. L'état est figé : la cuve d'ébullition, achetée le 02.03.2026, est encore « Neuf » le 14.11.2026.
« Neuf » et « Bon » ne disent rien de différent pour l'entretien, et prennent une pastille sur chaque ligne.

P21 — **mineur** — Fiche pH-mètre, pompe, Nouveau. La phrase « Achat · Date non renseignée · Prix non renseigné » revient sur chaque
fiche. L'inconnu doit être un badge court (« prix inconnu »), pas une phrase répétée (brief §3).

P22 — **gênant** — Fiche, partout. Aucune valeur n'est montrée : ni valeur comptable d'un appareil immobilisé
(`FinancialAsset.equipmentRef`, méthode, taux), ni prix connus du parc. Pour un achat à 1 450 CHF, la fiche ne dit pas ce qu'il vaut
aujourd'hui. Brasseur : « Elle vaut combien, ma cuve, maintenant ? »

P23 — **gênant** — Fiche, partout. Le lien au brassage manque. Le profil de brassage relie déjà la cuve, le récipient de rinçage, le
fermenteur et la bouilloire annexe à l'inventaire (`BrewhouseProfile.equipmentRefs`, réglage dans `BrewhouseSettings`). La fiche
ne dit ni « utilisée par le profil 100 L », ni en combien de brassins. « Détartrer après 5 brassins » ne peut donc pas se compter.
Brasseur : « Il sait que je brasse dedans, il pourrait compter. »

P24 — **mineur** — Fiche et Nouveau, 390 et 1280, deux thèmes. À chaque ouverture au toucher, la × de fermeture porte un anneau
de focus épais (noir en clair, jaune en cave). On dirait un bouton déjà pressé.

P25 — **mineur** — Feuille « Acheter du matériel », 390 clair. « Matériel durable » apparaît trois fois (rayon « Articles, stock et
matériel », sa ligne, « Type d'achat »). Le total « 0,00 » est en police mono au lieu d'être vide, et une phrase d'aide de deux
lignes suit. C'est lourd pour acheter une pompe. À vérifier : la catégorie Matériel de la fiche créée vaut « Brassage » par défaut
(`equipmentCategory||'Brassage'`), et rien de visible ne la demande.

P26 — **mineur** — En-tête, 1280. Le sélecteur de période « Ce mois » reste en tête sur un inventaire, où il n'agit sur rien.

P27 — **mineur** — Nouveau (« Matériel déjà possédé »), 390. L'état par défaut est « Neuf » pour un appareil que l'on possède déjà ;
« Bon » serait plus plausible.

P28 — **mineur** — Liste, 390 et 1280. Après les deux à traiter, le tri est alphabétique pur : « Balance 0,1 g » passe avant les
cuves, sans regroupement par catégorie ni par échéance.

Total : **28 problèmes**, dont **3 bloquants** (P1, P2, P3), **14 gênants** et **11 mineurs**.

Doutes (non comptés) :
- Le pH-mètre « Étalonner chaque mois » est une donnée de banc plausible. En pratique, un brasseur étalonne plutôt avant chaque
  séance de mesure ou chaque semaine, et l'électrode s'use en un à deux ans. À garder comme intervalle réglable, pas comme règle.
- Ligne « Moulin à malt » (référence automatique, « Acquis le 20.10.2026 ») : non rendue dans les captures. Le code cache bien
  l'EQ-uuid, mais le rendu reste à voir.
- La pastille « 24 » de Stocks, dans sa capture, ne semble rien compter du matériel. À vérifier.

## Parcours manquants

M1 — **Entretien dû : quand, et rappel.**
Ce que l'app a : `maintenance` (texte libre), l'état manuel, le filtre « À traiter ».
Il manque : un intervalle (jours, mois ou brassins), la date du dernier entretien, une échéance calculée depuis le 14.11.2026
(« dans 12 j », « en retard 3 j »), l'entrée automatique dans « À traiter », et un rappel hors de l'écran (Bord ou pastille Stocks).
Aucun écran hors Stocks ne lit `stocks.equipment` pour cela.

M2 — **Noter un entretien fait.**
Ce que l'app a : rien, sauf passer l'état à « Bon » à la main.
Il manque : un geste « fait » en un toucher depuis la ligne, qui écrit la date (aujourd'hui par défaut), une note courte et un coût
facultatif. Le coût passe par la Dépense « Entretien », déjà reliable. L'historique de la fiche (frise) en découle, et l'échéance suivante se recalcule.

M3 — **Panne : la signaler, depuis quand, réparée.**
Ce que l'app a : l'état « À réparer » et les notes (« fuit au raccord »).
Il manque : « en panne » en un toucher, avec une cause courte et la date ; « depuis 9 j » sur la ligne. Puis « réparée », avec la
date et le coût, relié à une Dépense « Entretien / réparation ». La panne reste dans l'historique, et le brassage est prévenu si
l'appareil sert dans le profil actif (voir M8).

M4 — **Étalonnage des instruments** (pH-mètre, densimètre, réfractomètre).
Ce que l'app a : la catégorie « Mesure » et le texte « Étalonner chaque mois (pH 4 et 7) ».
Il manque : un geste dédié, qui donne les points attendus par instrument (pH-mètre : tampons pH 4,00 et 7,00 ; densimètre : eau à
20 °C = 1,000 ; réfractomètre : eau = 0 °Bx), la valeur lue, l'écart, la date et la prochaine échéance. Il faut aussi « jamais
étalonné » en badge court. Un écart hors tolérance doit passer l'appareil en « à traiter ».

M5 — **Lien aux dépenses** : achat et entretien payé.
Ce que l'app a : la Dépense « Matériel durable » crée la fiche (`EQ-<submissionId>-<n>`, avec prix et date) ou la relie
(`equipmentRef`). La ligne « Entretien / réparation » relie l'appareil entretenu. `ExpenseSheet` accepte `existingEquipmentId`, mais
aucun écran ne le passe.
Il manque : dans la fiche, la liste des dépenses reliées (date, montant, pièce jointe) et leur total ; un bouton « Payer un entretien »
qui ouvre la Dépense pré-liée à cet appareil (`existingEquipmentId`) ; l'achat d'origine ouvrable.

M6 — **Valeur et amortissement.**
Ce que l'app a : `FinancialAsset` (`equipmentRef`, `acquisitionCents`, `method` dégressif ou linéaire, `ratePct`, valeur
d'ouverture), saisi dans Finances › Annuel.
Il manque : dans la fiche, la valeur comptable à date, seulement pour un appareil immobilisé (sinon rien, jamais « 0 CHF ») ; un lien
vers l'actif. En liste, au plus une valeur du parc « sur N prix connus », jamais un total inventé.

M7 — **Matériel vendu ou réformé** (sortie d'inventaire autre que supprimer).
Ce que l'app a : « Supprimer » avec confirmation journalisée ; côté Finances, `FinancialAsset.disposedDate`,
`disposalProceedsCents` et `disposalTransactionId`.
Il manque : « Vendu » (date, prix, reliés à la cession de l'actif) et « Réformé » (date, motif). L'appareil quitte la liste active
mais garde sa fiche et son historique, consultables via « anciens ».

M8 — **Lien avec le brassage.**
Ce que l'app a : `BrewhouseProfile.equipmentRefs` (`kettle`, `sparger`, `fermenter`, `auxiliary`), choisis dans l'inventaire depuis
`BrewhouseSettings` ; les brassins existent.
Il manque : dans la fiche, « utilisé par le profil X » et le nombre de brassins depuis le dernier entretien. C'est ce compteur qui
fait vivre « après 5 brassins » (« 3 / 5 »). Il manque aussi un avertissement au lancement d'un brassin si une cuve ou le fermenteur
du profil est « à réparer ».

M9 — **Ajouter depuis l'état vide et depuis une recherche sans résultat.**
Ce que l'app a : « Enregistrer un achat » et « Matériel déjà possédé », cachés dans le repli.
Il manque : l'appel visible dans l'état vide et « Ajouter « zzz » » après une recherche vide.

M10 — **Voir l'historique d'un appareil.**
Ce que l'app a : rien. Ni l'achat, ni les entretiens, ni les pannes ne laissent de trace lisible : seul le texte de l'état est écrasé.
Il manque : une frise par appareil (achat, entretiens, étalonnages, pannes, réparations), à l'image de « Ce qui a bougé » dans Articles.

## Couverture

Légende : ✓ = capture du banc ouverte ; — = non capturée (hors périmètre a0 ou état impossible avec les fixtures).

| Vue / état | 390 clair | 390 cave | 1280 clair | 1280 cave | Problèmes |
|---|---|---|---|---|---|
| Liste (Tout) | ✓ liste-390-clair ; sa capture en ligne | ✓ liste-390-cave | ✓ liste-1280-clair | ✓ liste-1280-cave | P1, P2, P4, P5, P7, P8, P9, P10, P20, P26 (1280), P28 |
| À traiter non vide | ✓ a-traiter-390-clair | ✓ a-traiter-390-cave | ✓ a-traiter-1280-clair | ✓ a-traiter-1280-cave | P1, P2, P4, P10 |
| À traiter vide (« Aucun matériel à entretenir… ») | — (fixtures à 2) ; sa capture montre « À traiter · 0 » en Tout | — | — | — | P1 ; état à capturer |
| Recherche avec résultats | ✓ recherche-390-clair | — | — | — | P6, P18 |
| Recherche sans résultat | ✓ recherche-vide-390-clair | — | — | — | P18, M9 |
| Actions dépliées | ✓ actions-390-clair | ✓ actions-390-cave | ✓ actions-1280-clair (barre, pas de repli) | ✓ actions-1280-cave | P15, P16 |
| Fiche (pH-mètre) | ✓ fiche-390-clair | ✓ fiche-390-cave | ✓ fiche-1280-clair | ✓ fiche-1280-cave | P2, P3, P8, P11, P12, P13 (1280), P21, P22, P23, P24 |
| Fiche › Achat déplié (cuve) | ✓ fiche-achat-390-clair | — | — | — | P12, P20, P22 |
| Fiche à réparer (pompe) | ✓ fiche-reparer-390-clair | — | — | — | P4, P19, M3 |
| Fiche › Gestion | ✓ fiche-gestion-390-clair | — | — | — | P14, M7 |
| Nouveau (« Matériel déjà possédé ») | ✓ nouveau-390-clair | — | — | — | P19, P21, P24, P27 |
| Enregistrer un achat (Dépense, intent matériel) | ✓ achat-390-clair | — | — | — | P25, M5 |
| Vide | ✓ vide-390-clair | — | — | — | P17, M9 |
| Référence Articles (liste, fiche) | ✓ ref-articles-390-clair, ref-article-fiche-390-clair | ✓ ref-articles-390-cave | ✓ ref-articles-1280-clair | — | base de P9, P10, P11 |
| Confirmation « Supprimer ce matériel ? » | — (non touchée) | — | — | — | à capturer en passe 2 |
| Ligne « Moulin à malt » (réf. automatique) | — (hors du premier écran) | — | — | — | doute ; à capturer |

## À garder

- Le **tri qui remonte les urgences** (À réparer, puis À entretenir, puis le reste) et le **filtre « À traiter »** avec son compteur :
  c'est la bonne idée, il lui faut seulement des échéances réelles (P1).
- **« Enregistrer un achat »** ouvre la Dépense en intent matériel et crée la fiche avec prix et date : c'est un seul geste pour
  l'argent et l'inventaire. **« Matériel déjà possédé »** crée sans dépense. **« Projets d'équipement »** est un lien vers Atelier.
- La **référence automatique EQ-uuid jamais montrée** (liste et fiche, TE-46).
- Les **quatre états** (Neuf, Bon, À entretenir, À réparer), avec leur couleur de pastille, lisibles dans les deux thèmes : rouge
  pour réparer, ocre pour entretenir.
- Les **cinq catégories** (Brassage, Mesure, Embouteillage, Stockage, Atelier).
- **L'inconnu jamais à 0** : un prix vide reste « non renseigné », un prix négatif est refusé et le message reste visible (TE-47).
- La **suppression confirmée et journalisée**, rangée loin des gestes courants.
- La **recherche tolérante aux accents et fautes**, avec sa croix d'effacement, à resserrer (P6) et non à retirer.
- Le **thème cave** : contrastes tenus sur toutes les captures ouvertes, pastilles lisibles.
- Les **liens déjà en base** à montrer sans champ neuf : `equipmentRef` des dépenses, `FinancialAsset.equipmentRef`,
  `BrewhouseProfile.equipmentRefs`, `existingEquipmentId` de la Dépense.
