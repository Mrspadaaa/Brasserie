OK — da accepté avec retouches : 13 besoins couverts, passe 2 en net progrès ; 12 problèmes, 1 bloquant (raison des écartés inventée, « moins adapté »)

# Critique passe 2 · da « Fil de notes qui se range seul »

Regard neuf (Opus), 16.11. La critique de la passe 1 est gardée dans `CRITIQUE-passe1.md`.
J'ai lu CADRE, NOTE, PORTRAIT et SPEC (l. 1748 à 1793, dont « ultra facile » et « le clavier compte comme un coût »).
J'ai ouvert les 16 captures claires à 390, 2 sombres (carnet, frigo), et 3 vues à 1280 faites par moi (carnet, comparer, repos).
`gestes.mjs` rejoué : **GESTES OK** (21 contrôles, aucune erreur de page). Une sonde puppeteer a joué en plus le + › Coller un lien,
la validation d'un choix et la liste complète.

**Phrase prédite du brasseur** : « Là c'est vachement bien : je colle un lien, ça montre l'objet, je mets la veille, et le
pourquoi est en haut. Mais c'est quoi les boutons "à jouer" ??? Et dans Comparer, trop de texte. »

**La passe a progressé.** Les 12 corrections annoncées sont visibles : la dominance est honnête, la barre d'atout est dans le
bon sens, la baisse se voit (pastille et courbe resserrée), le critère du frigo est classable, le lien sans aperçu reste dans les
tableaux et on choisit depuis une ligne. Les points 13 à 17 de la passe 1 n'ont pas été traités (+ sur les valeurs, démo,
tuile Comparer de l'évier).

## Sens métier (avant le visuel)

Les nombres sont plausibles et marqués « exemple » :
- Embouteillage : 40 à 220 ppb, 150 à 900 bt/h, 5 à 7 g de CO₂, de 190 à 21 500 CHF.
- Frigo : 30 et 40 fûts pour 2 et 2,5 m³, température ambiante max de 30 à 43 °C.
- Ventilation : 1 100 à 1 800 m³/h, 49 à 58 dB.

Je n'ai trouvé aucune combinaison absurde. Seul écart : la frise du frigo saute la décision de façon (problème 2).

## Besoins

| # | Couvert | Comment |
|---|---|---|
| B1 | oui | Une ligne dans la liste puis ↑ crée le carnet au statut *idée*. Testé avec « étiqueteuse », une catégorie neuve. |
| B2 | oui | Un seul champ « Écrire, ou coller un lien… », avec photo et voix. Le fil est daté, sans structure imposée. Le + propose aussi « Note vocale ». |
| B3 | oui | Une phrase qui nomme une façon la range en pastille. La tuile Façons retient ou écarte. Sur l'évier, « Chercher » demande les façons à l'IA. |
| B4 | oui | L'IA propose « En faire le critère qui oriente ? », puis « Gravité semble moins adapté : l'écarter ? ». Le critère s'affiche sous le bandeau, et son tableau vient en tête, encadré. |
| B5 | oui | 6, 5 et 4 articles, de fournisseurs et de pays différents (CH, DE, IT, FR, AT). |
| B6 | oui | Un tableau par caractéristique, le meilleur en tête et en vert. La barre longue veut dire meilleur. « ? » en fin de liste. |
| B7 | oui | Puces × et +, « Ajouter » (marqué « à vous ») et « Proposer ». Les tables par catégorie ne sont que les réponses simulées de l'IA, avec un repli générique. |
| B8 | oui, avec un défaut | Le bandeau donne le choix et son pourquoi. La frise ADR garde la date et les écartés avec leur raison, et une décision remplacée y reste barrée. On peut demander « Pourquoi ce fournisseur ? ». Mais un choix fait dans l'app écrit « moins adapté » comme raison de chaque écarté (problème 1). |
| B9 | oui | Une carte par carnet : titre entier, statut en 4 points, choix et pourquoi, ou « Ensuite : … ». Ni caisse ni prix au premier plan. |
| B10 | oui | « Vérifier la disponibilité maintenant », « Chercher les « ? » », « Proposer », « Redonner à l'IA ». Tout est facultatif et marqué « exemple ». |
| B11 | oui | Un lien collé donne une carte : photo, nom, prix, fournisseur, pays et stock. « Lien sans aperçu » propose Compléter ou Redonner à l'IA. |
| B12 | oui | Une bascule par carte et dans la fiche, « tous les 3 jours : stock ici et chez d'autres, baisse de prix ». La fiche montre « −600 CHF depuis le 10 nov. », une courbe, et « Aussi chez … (AT) ». L'alerte est discrète : un point « −600 CHF » sur la ligne du carnet. Le cas « rupture ici, dispo ailleurs » n'est montré nulle part (doute). |
| B13 | oui | 4 carnets plus une catégorie neuve. Le « à revoir si » et le pourquoi pré-rempli sont tirés du critère, pas d'une catégorie. |

## Touchers (saisie au clavier non comptée, mais signalée)

| Tâche | Touchers |
|---|---|
| Noter une recherche | 3 depuis la liste (carnet, champ, ↑) ; 2 dans le carnet ; voix : 2 (+, Note vocale). |
| Ajouter une solution (lien) | 2 dans le carnet (+, « Coller un lien » colle le presse-papiers directement) ; 3 depuis la liste. |
| Comparer | 2 (carnet, tuile Comparer). |
| Choisir avec son pourquoi | 5 par Comparer (carnet, Comparer, ligne, « Choisir celui-ci », « Garder ce choix ») ; 4 par la carte du fil. Pourquoi pré-rempli ; le corriger demande 1 toucher et le clavier. |
| Retrouver le pourquoi plus tard | 0 : la ligne de la liste le dit. Détail : 2 (carnet, Décisions). Question à l'IA : 3. |

## Notes /10

- Besoin : **8,5**
- Brasseur : **8**
- UX/UI : **7,5**
- Fluidité : **8**

## Problèmes (12)

### Valeurs fausses

1. **BLOQUANT. La raison des écartés est inventée.** `decider()` (proto.src.html l. 681) écrit `raison: 'moins adapté'` pour chaque article écarté. La feuille Choisir ne permet de donner aucune raison par écarté.
   - Effet : six mois plus tard, « Qu'est-ce que j'ai écarté ? » répond « Hotte 100 DE (moins adapté) ». C'est faux, et c'est justement la question « pourquoi pas l'autre » qui l'empêche de revenir en arrière (B8).
   - Correction : sous chaque puce d'écarté, une raison proposée et tirée des tableaux, marquée « exemple », qu'un toucher valide ou retire. Par exemple « débit 1 200 contre 1 800 » ou « 2 600 contre 1 450 CHF ». Si aucune raison n'est gardée, la frise écrit « sans raison notée », jamais « moins adapté ».
2. **La frise du frigo saute une décision.** La façon « Frigo vitrine pro » est « remplacée par la suivante », mais la suivante est une décision de produit. La décision de façon « Chambre froide en kit », et son pourquoi « la vitrine ne passe pas la porte de 80 cm », manque.
   - Correction : ajouter cette décision de façon (3 → 10 oct.). La façon remplacée renvoie vers elle, et la décision de produit vient ensuite.

### Premier plan, lisibilité, texte

3. **Les outils de démo ont l'air de boutons de l'app.** Ce sont les puces pointillées « à jouer » au-dessus du fil (« coller un lien d'article », « lien sans aperçu », « « isobarique » »), dans chaque carnet, à 390 comme à 1280. Il les touchera, ou demandera ce que c'est. Problème déjà relevé en passe 1 (point 14), non traité.
   - Correction : un panneau « démo » replié, hors du carnet (coin de l'en-tête de page, ou `?demo=1`).
4. **Comparer ouvre sur une légende écrite.** L'en-tête porte « un tableau par caractéristique, meilleur en tête · barre longue = meilleur · toucher une ligne pour choisir », sur 2 à 3 lignes. C'est le refus « légende écrite au repos » (PORTRAIT § 4 ; DEFAUTS, trop de texte).
   - Correction : garder « 6 articles », supprimer le reste. Le sens « moins = mieux » est déjà sur chaque tableau, et la ligne touchable se signale par un chevron.
5. **La dominance du frigo tient en 4 lignes de prose** : « moins bien que Chambre 2 m³ CH sur volume utile, fûts de 20 L, passe une porte de 80 cm ; mieux seulement sur prix. 3 inconnues (…). À lire : … ». Elle est juste, mais on la lit au lieu de la voir.
   - Correction : une ligne compacte « Vitrine occasion · perd 3 · gagne prix · 3 ? », dont les nombres se touchent pour le détail.
6. **Les tuiles donnent des comptes, pas des réponses.** « Comparer 7 caractéristiques » et « Décisions 2 » ne disent ni qui mène ni pourquoi. Il « préfère un chiffre qui répond à sa question » (PORTRAIT § 1.3).
   - Correction : la tuile Comparer dit le meneur sur le critère, par exemple « Oxygène : Iso 4 pré-év. en tête (40 ppb) ». La tuile Articles dit le moins cher, ou l'article surveillé qui a baissé.
7. **La tuile Comparer de l'évier est bleue, mise en avant, avec 0 article** (même chose dans l'état critère). Elle mène à des tableaux vides. Problème déjà relevé en passe 1 (point 16), non traité.
   - Correction : une tuile atténuée, « 5 caractéristiques prêtes · aucun article », qui pousse vers « Coller un lien ».

### Gestes

8. **Le + volant cache la colonne des valeurs dans Comparer.** On le voit dans 4 captures : la cadence « 400 » de l'Iso 4 CH, « Compléter » et le bruit de l'Hélicoïde en ventilation, le volume utile « 2 000 » du frigo. Problème déjà relevé en passe 1 (point 15), non traité. La marge basse de 140 px ne sert qu'en fin de page.
   - Correction : dans Comparer, le + se réduit à 44 px et se masque pendant le défilement vers le bas. Ou bien la valeur passe à gauche de la barre.
9. **Le pourquoi pré-rempli est une phrase de l'IA à corriger au clavier.** En ventilation, « débit le plus haut ; SAV en Suisse » : il n'a jamais dit « SAV » pour ce carnet. Le 16.11, il dit pourtant : « Clicker pour ouvrir le clavier et taper c'est déjà beaucoup d'action ». Un pourquoi validé sans être relu devient un faux pourquoi.
   - Correction : des puces de raisons proposées (« débit le plus haut », « SAV en Suisse », « prix », « dispo »), chacune activée d'un toucher. Le champ libre reste en option.
10. **Choisir demande 4 à 5 touchers**, alors que tout le reste en demande 2.
    - Correction : un appui long sur une ligne de tableau ouvre directement la feuille Choisir. Le bouton « Garder ce choix » reste la seule confirmation, soit 3 touchers depuis Comparer.

### Thèmes et largeurs

11. **En cave, les barres des non-meilleurs disparaissent presque.** Elles sont brun foncé sur noir (frigo : 38 et 30 °C). La piste vide de la vitrine d'occasion est invisible, et on ne voit plus que la valeur est inconnue.
    - Correction : un contraste de piste ≥ 3:1 en cave, et une piste hachurée pour « ? ».
12. **À 1280, la mise en page mobile est seulement étirée.** Les barres font 1 000 px, et les 4 tuiles sont larges et vides. La largeur ne sert à rien : le fil et Comparer pourraient se lire côte à côte.
    - Correction : une colonne de 720 px au plus. Ou, à partir de 1 100 px, le fil à gauche et Comparer ou la fiche à droite.

### Doutes (non comptés)

- La veille « rupture ici, dispo chez un autre à +90 CHF » (frigo, CADRE) n'apparaît dans aucune capture. La liste ne montre que « 👁 1 ». La forme de l'alerte reste un choix ouvert, à montrer en variantes avec db et dc (L24).
- La capture `da-article-390.png` affiche « 0.7 m² » avec un point. Le proto actuel rend « 0,7 m² » : la capture est sans doute antérieure à la reconstruction. À recapturer.
- L'emplacement Finances › Matériel › Carnets reste un choix ouvert. Le cadre disait « Atelier », qui n'existe pas dans la barre.
- Les propositions de l'IA dans le fil ont deux gros boutons noirs (« Oui, critère / Juste une note », « Écarter Gravité / Garder les deux »). Elles sont facultatives, mais elles peuvent lui rappeler les étapes refusées de ky et kz. À voir sur sa réaction.

LEÇON PROPOSÉE : une valeur écrite par défaut dans une décision (« moins adapté ») est une donnée inventée. Un champ que le brasseur n'a pas rempli reste vide et le dit (« sans raison notée »).
