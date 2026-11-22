OK — p5 fini : liste refaite, tout ce que da montrait rendu, champ unique en bas au-dessus du clavier

# p5f — le carnet p5, fini

Base : `f9/p5/proto.src.html`, sa préférée, reprise telle quelle (règle n° 1). Elle est retouchée par fonctions entières et par split/join (`retouche-p5f.mjs`, L26). La v0 n'est pas touchée.
Ses mots (SPEC l. 1834 et 1840) : « je comprends pas trop P5 ?? … da · un seul champ ; l'IA propose le critère le meilleur … le champs text en bas ? SI non sur mobile le clavier cache tout … p5 · En cours, Choisis ; « ✓ choix » et ↓ 600 CHF pas fan ??? Ca semble pas fini » ; « peut être faire une p5 mais aller jusqu'au bout et répondent au critère ».

Lecture du chemin (L01) : la base citée `…carnet-decision\f9\p5\proto.html` est arrivée sans son `\f`. C'est le seul p5 qui existe. Les « corrections ponctuelles de f9\p5 » (police chargée, noms non abrégés, dates lisibles) sont donc déjà dans la base ; je les garde, et je rends en plus les titres de carnet en entier.

## Rebâtir et contrôler (depuis `r2/p5f`)
- `node retouche-p5f.mjs && node build.mjs` → RETOUCHE P5F OK, BUILD OK (`proto.html`, autonome, fixture incluse).
- `node controle-p5f.mjs` → **CONTROLE OK** (60 lignes). Témoin : `node controle-p5f.mjs ../../f9/p5/proto.html` → **CONTROLE ECHEC (50)**. Le contrôle échoue bien sur la version refusée (L13).
- `node gestes.mjs` → **GESTES OK** : 27 tâches au doigt, console propre. On y trouve les anciennes T1 à T15, adaptées au nouveau dessin, et C1 à C3 pour le champ.
- `node cibles.mjs` → **CIBLES OK** (14 états).
- `SANS_TACHES=1 MOTS_LIBRES=1 node mesure.mjs` → **MESURE OK** : 58 écrans (29 états, clair et cave). Tailles 15/18/26 partout, police mini 15 px, contraste mini 5,68:1.
- Captures : `node capt.mjs . <états> p5f`, lancé depuis `r2` (copie de `calendrier/p8/capt.mjs`, déjà adaptée en f9/p5) ; `PAYSAGE=1` pour 844 × 390.

## Ce qui a changé, écran par écran

**Liste (refaite, ses mots « En cours, Choisis ; ✓ choix et ↓ 600 CHF pas fan »)**
1. Plus de sections « En cours » ni « Choisis » : une seule liste, la plus récente d'abord, et chaque carnet dit lui-même où il en est.
2. Sous chaque titre, l'étape en quatre traits avec son mot (idée, recherche, compare, choisi) et la date du dernier mouvement. C'est l'étape de da (●●●●), redessinée.
3. Le choix s'écrit sans « ✓ » : le nom en gras, puis le pourquoi (« Pré-évacuation 4 becs, oxygène le plus bas à 4 becs, SAV en Suisse »), comme da.
4. Un carnet ouvert donne sa question, puis « Ensuite : … » (da). Exemples : « Hotte ou extracteur mural ? », puis « Ensuite : attendre l'avis du ferblantier ».
5. « ↓ 600 CHF » (pastille) devient une phrase verte avec l'œil : « Prix baissé de 600 CHF le 13 nov. ».
6. On retrouve les vignettes des articles et les comptes « 2 façons · 6 articles · 2 décisions » de da, ainsi que « · 1 sous veille ».
7. Titres en entier : « Ventilation de la salle de brassage », « Frigo de garde pour fûts ».
8. En tête : « Finances › Matériel », avec « À venir » et « Réalisés » (où vit le carnet, comme da). Sous le titre : « 4 idées et besoins · 1 alerte de veille ».
9. Le champ unique de da, « Une idée, un besoin », est placé **en bas**, à côté du « + » volant, qui est gardé.

**Carnet (journal)**
1. Sous le titre : l'étape et « ouvert le 20 oct. ». L'onglet Articles porte son nombre (« Articles 6 », la tuile de da).
2. Le bandeau du choix porte « Décision du 14 nov. », le nom, le pourquoi en deux raisons, puis le fournisseur et le pays. Le « ✓ » posé sur la photo est retiré.
3. La ligne « ★ Critère qui oriente : minimiser l'oxygène » revient pour un carnet choisi (da).
4. Plus aucune note n'est repliée en « 1 note ⌄ » ou « 3 notes ⌄ » (CARNET-MAIGRE). Chaque note se lit, et sous chacune l'IA dit où elle l'a rangée : « rangée : façon Gravité », « devenue le critère qui oriente », « idée de départ » (da).
5. Chaque décision a sa ligne de preuve : « Produit et fournisseur choisis », puis « écartés : Table 2 becs, Monobloc 6 becs, Pré-évacuation 4 becs (DE) ». Autre exemple : « Isobarique retenue », puis « gravité écartée : trop d'oxygène capté ».
6. Veille : « Prix baissé de 600 CHF », puis le produit, le fournisseur et « aussi en stock chez Getränketechnik Ost (AT) ». L'achat prévu donne aussi son montant.
7. Champ unique en bas, « Écrire, ou coller un lien » (da), avec le micro. Pendant la frappe, l'IA propose **le critère** (« En faire le critère qui oriente ? Relié à « Profondeur de bac » », puis [★ Oui, critère] ou [Juste une note]) ; elle propose aussi une façon ou lit un lien. Tout est simulé et marqué « exemple ».
8. Clavier ouvert : le champ monte au-dessus du clavier (`visualViewport`), et la page place la dernière note juste au-dessus, sans geste (CARNET-CLAV).
9. Nouvelle idée et évier : la catégorie proposée, les caractéristiques **en puces qui passent à la ligne** (plus rien de coupé, comme l'était « Formats de bou »), les « Façons possibles » acceptées en un toucher, puis « Ensuite : coller un lien d'article… ».

**Articles** : « 3 en lice · 1 sous veille » en tête. « choisi le 14 nov. » en mot vert, à la place du ✓ sur la photo. « baissé de 600 le 13 nov. » à la place de la pastille. Chaque écarté garde sa raison (« cadence trop basse pour 300 L »).

**Comparer (390)** : la matrice de p5 est gardée (★ en premier, meilleur surligné en vert, écartés visibles en gris : son choix). Une légende d'une ligne s'ajoute. Le « ✓ » devant le choisi devient le mot « choisi ». Le lien « Caractéristiques › » devient les **puces de da** : on retire d'un toucher avec ×, on remet avec +, on ajoute ou on pose le critère.

**Comparer (paysage 844 × 390)** : la vue est transposée, avec un article par colonne et sa vignette. 6 articles côte à côte pour Embouteillage, 4 pour Frigo et pour Ventilation. Les écartés sont en gris, marqués « écarté » ; le meilleur de chaque rangée est en vert.

**Fiche** : la pastille « ↓ 600 CHF » est retirée, car la courbe 12’300 → 11’700 le dit déjà. Ont été ajoutés (da) :
- sous Surveiller, « Dernier passage 13 nov. · prochain 16 nov. » ;
- le bouton « Vérifier la disponibilité maintenant » ;
- la section « Caractéristiques lues », valeur par valeur, avec ✦ quand c'est l'IA qui a lu, et « ? » quand la valeur n'a pas été trouvée ;
- « critère qui oriente : … » sous le rang.

**Lien collé** : « Lu sur lueftung-basel.ch : photo, nom, prix, fournisseur et 5 valeurs. Rangé : façon Extracteur mural » (exemple), suivi des caractéristiques lues. **Lien sans aperçu** : la date du collage, le carnet, puis « À compléter » avec un « ? » par caractéristique.

**Pourquoi** :
- « 600 CHF de moins à la veille » remplace « ↓ 600 CHF ».
- Les écartés et leurs raisons sont **ouverts** par défaut.
- L'autre décision se lit en entier (« Isobarique », puis « minimiser l'oxygène · Gravité écartée : trop d'oxygène capté »).
- On peut **demander** (da) : trois questions proposées, et le champ « Demander au carnet » en bas. La réponse cite les dates (« Le 14 nov., tu as pris Brassage Romandie (CH) : … La même machine chez Abfülltechnik West (DE) est écartée : même machine, SAV à l'étranger »).

## Ce qui est resté (p5, tel quel)
- La page blanche chaude, Source Sans 3 chargée, les trois tailles 26/18/15 et les chiffres tabulaires.
- Les vignettes dessinées, la barre du bas, le « + » volant et ses actions (dicter, lien, photo, écrire, les communes).
- Les onglets Journal, Articles, Comparer. La frise datée et ses pastilles : ✓ vert = choix, ✓ au trait = façon, calendrier plein = achat, œil = veille.
- La matrice 390 avec son aimant, la courbe de veille, l'interrupteur à un seul rond, les offres ailleurs, la feuille du choix, les façons (retenir en 1 toucher, écarter avec une raison).
- Le calendrier, le partage, le raccourci, la dictée, Annuler sur chaque geste, la démo chronométrée (`?demo=1`) et les variantes `&ecartes=plies`.

## Inventaire contre da (CARNET-MAIGRE), écran par écran — preuve `controle-p5f.mjs`, lignes MAIGRE (35 sur 35 OK ; témoin p5 : 24 ECHEC)
| da montrait | p5 | p5f |
|---|---|---|
| Liste : étape ●●●● par carnet | non | oui (4 traits + mot) |
| Liste : choix + pourquoi | nom seul | oui |
| Liste : « Ensuite : … » | non | oui |
| Liste : comptes et vignettes | non | oui |
| Liste : champ « Une idée, un besoin » | non | oui, en bas |
| Liste : Finances › Matériel, À venir, Réalisés | non | oui |
| Carnet : bandeau daté avec le pourquoi | une raison | date, deux raisons, fournisseur |
| Carnet : critère qui oriente | non (si choisi) | oui |
| Carnet : tuiles Façons, Articles, Comparer, Décisions | onglets | onglets + nombre ; façons dans le fil ; décisions dans Pourquoi |
| Carnet : fil complet, « rangé : … » | notes repliées | tout lisible, rangement dit |
| Carnet : champ « Écrire, ou coller un lien… » | non | oui, en bas, au-dessus du clavier |
| Carnet : « à jouer » (coller un lien, lien sans aperçu) | non | remplacé par le champ (un lien collé devient un article) et l'état « lien sans aperçu » |
| Note : l'IA propose le critère | toast | dans le champ, [Oui, critère] [Juste une note] |
| Comparer : puces retirables, Ajouter, Proposer | lien | puces, et « Ajouter, critère » ouvre aussi les proposées |
| Comparer : un tableau par caractéristique, barres | matrice | matrice gardée (sa préférence p5), meilleur en vert |
| Pourquoi : demander, questions, réponse datée | non | oui |
| Pourquoi : écartés et raisons ouverts, à revoir si | repliés | ouverts |
| Fiche : dernier passage, prochain | non | oui |
| Fiche : vérifier maintenant, caractéristiques lues | non | oui |
| Lien : ce que l'IA a lu, « ? » | non | oui |

Rien de p5 n'est retiré, sauf trois choses qu'il a refusées par ses mots : les sections « En cours / Choisis », le « ✓ » devant le choix (liste, bandeau, Articles, matrice) et la pastille « ↓ 600 CHF ». La matrice garde un ✓ seulement pour les valeurs oui/non ; Pourquoi garde ses coches de raisons.

## CADRE.md, critère par critère
**Ses besoins**
- 1 (une ligne suffit) : C2, idée tapée dans le champ du bas puis Entrée, carnet créé, 1 toucher ; T2 et T2b à la voix.
- 2 (noter au fil de l'eau) : champ unique partout où l'on note ; T3 et T14 (dicter) ; C1.
- 3 (façons) : façons et « Façons possibles » ; T11, T11b, T11c.
- 4 (critère) : l'IA le propose dans le champ (C1, `noter-critere`) ; ★ en tête.
- 5 (5 ou 6 produits) : 6 articles d'Embouteillage, 3 pays.
- 6 (comparer) : matrice 390, paysage transposé ; T8, T9.
- 7 (caractéristiques dynamiques) : puces × et + ; T10 (1 toucher), T10b ; propositions par catégorie (étiquetage, évier).
- 8 (le pourquoi) : Pourquoi ouvert, décisions datées, réponse datée ; T13, C3.
- 9 (vue sans détails d'abord) : la ligne de liste (étape, choix et pourquoi, alerte) ; le détail est à un toucher. Écart : on est au-dessus de 40 mots (voir plus bas).
- 10 (IA au besoin) : jamais obligatoire ; toujours marquée « exemple ».
- 11 (lien → objet) : T4, T5 ; état `lien`.
- 12 (veille) : T6 ; dernier passage et prochain ; alerte discrète en vert, sans rouge.

**Refusés** :
- s2a2 : ni prix ni caisse au premier plan de la liste.
- ky et kz : aucune étape ni champ obligatoire.
- « Scan relié » : absent.
- Lecture « Excel » : la matrice n'est pas en premier plan ; on y entre par l'onglet Comparer.

**Acquis** :
- « À venir » est atteint par un lien.
- Le « + » volant est gardé.
- Le scan n'est pas affiché.

**Règle générale** : les 4 carnets sont joués (embouteillage, frigo, ventilation, évier), plus l'étiqueteuse neuve. Aucun libellé n'est propre à l'embouteillage.

**États** : idée (évier, nouveau), recherche (après un premier lien), compare (ventilation), choisi (embouteillage, frigo), aperçu raté (`completer`), alerte de veille, caractéristique retirée (T10).

**Leviers** : partage T5 et T5b, raccourci T2b, voix T14, calendrier T15, propositions acceptées en un toucher, démo `?demo=1`.

**Liens** : calendrier (achat prévu dans le fil, `cal`). La fiche du choix dit « sur le calendrier et dans la caisse prévue ». La compta, l'atelier et le fournisseur commun ne sont **pas dessinés** ici (inchangé depuis p5).

**Q1 à Q23 (critères 9,5-10)**
- Q3, zéro troncature : PLEIN (16 états), 0 coupé. Plus de « … » dans les champs ; les puces passent à la ligne.
- Q4, cibles : CIBLES OK (≥ 44 px) ; le champ et le « + » sont dans les 45 % du bas.
- Q5 : la surface ouverte ne cache pas la cible (fiche en panneau, comme p5).
- Q11 : ✓ réservé, voir plus haut.
- Q12, rouge : 0 rouge dans 16 états.
- Q15 : barres de la matrice depuis zéro, seulement si plus = mieux (comme p5).
- Q18, confirmations : 0 ; Annuler ≥ 6 s (comme p5).
- Q19, provenance : ✦ sur chaque valeur lue par l'IA ; « ? », jamais 0.
- Non mesurés ici, à rejouer par le pilote : Q1 (clés `data-fait`), Q6 (CLS, FLIP), Q7 (CPU ×4), Q9, Q10, Q13 (`validate_palette`), Q17 (trois juges Haiku), Q20 et Q21 (liens entre modules), Q22 (leave-one-out) et Q23 (son essai).
- Redite (Q1), vérifiée à l'œil : le pourquoi n'est dit qu'une fois par écran. Le bandeau dit le pourquoi ; la décision du fil dit les écartés. Les façons d'un carnet choisi ne vivent que dans le fil.

**Paysage** : PAYSAGE OK. 6 sur 6, 4 sur 4 et 4 sur 4 articles côte à côte à 844 × 390.

**L1, L9** : inchangés depuis p5 (rien n'est ajouté au calendrier).

**Défauts récurrents**
- **CARNET-CLAV** : CLAV, 6 sur 6 OK, avec un faux `visualViewport` de 544 px (vrai chemin de code) : liste, carnet, ventilation, évier, nouveau, pourquoi. Exemple, carnet : champ 479–544, dernière note 371–467. Témoin p5 : 6 ECHEC (aucun champ).
- **CARNET-MAIGRE** : 35 sur 35 (tableau ci-dessus).
- **CARNET-LIS** : il demande aucun texte sous 14 px (ici 15), un contraste ≥ 4,5 (mini 5,68) et un titre dominant (h1 26 px seul). Écart voulu : plus de 40 mots, voir plus bas.

**« Aucun écran à moitié vide »** : PLEIN ≥ 0,8 sur les 14 écrans principaux (de 0,89 à 1). Témoin p5 : 11 ECHEC (nouveau 0,41, évier 0,28, frigo 0,46).

## Boosters UX (boosters-ux)
- Boosters :
  - `etape` (lire) : 4 traits et un mot, liste et carnet.
  - `champ` (déclencher) : champ unique ; la proposition de l'IA change sous le doigt (captures `noter`, `noter-critere`).
  - `critere-ia` : [Oui, critère] pose la ★ (C1).
  - `caracs` : la puce × retire la colonne (T10 : la colonne disparaît).
  - `matrice` : le toucher d'une ligne ouvre les offres (T12).
  - `veille` et `veille-fiche` : œil et interrupteur (T6).
  - `alerte` : vers la fiche (T7).
  - `pourquoi` : bandeau, puis panneau (T13).
- B2 OK : une dominante par écran (bandeau du choix, ou nom de la fiche). Le seul bouton plein est « Choisir » sur une fiche non choisie.
- B3 ÉCART : 65 à 141 mots selon l'écran. Les éléments du premier plan sont groupés en 4 à 6 masses. C'est la conséquence de CARNET-MAIGRE.
- B4 et B5 OK : groupes séparés par des filets et de l'espace ; pas de carte dans une carte.
- B6 OK : tailles 15/18/26, une famille, chiffres tabulaires (mesure).
- B7 OK : contraste mini 5,68:1 en clair et en cave ; vert seulement pour choisi, meilleur et baisse.
- B8 OK : « ? » pour inconnu, « exemple » sur toute IA, état vide d'Articles.
- B9 OK : `:active` et transitions de 150 à 240 ms, mouvement réduit respecté (base p5).
- B10 OK : aucun `type="number"`, prix en `inputmode="decimal"`, champ du bas au-dessus du clavier (CLAV).
- B11 : « Embouteillage est choisi : Pré-évacuation 4 becs, pour l'oxygène le plus bas et le SAV en Suisse ; le prix a baissé de 600 CHF. »
- B12 OK : même chevron, mêmes puces, même champ sur les trois écrans où l'on note.
- B13 OK : CIBLES OK.

## Écarts voulus
- Mots au repos : 65 à 141 au lieu de ≤ 40 (CARNET-LIS). CARNET-MAIGRE est plus récent et dit « aucun retrait non justifié par ses mots ». La consigne est que la lisibilité monte par la typo, l'espace et le contraste : police ≥ 15 px, contraste ≥ 5,68, trois tailles, un titre dominant. `mesure.mjs` mesure donc les mots sans plafond (`MOTS_LIBRES=1`) et les imprime.
- `mesure.mjs` : ses tâches (copie de p4) sont désactivées (`SANS_TACHES=1`), parce que `gestes.mjs`, à jour, les joue toutes.
- Comparer à 390 garde la matrice de p5, et non les petits tableaux de da : c'est sa base, et il a choisi « écartés visibles » sur elle. Les puces de da y sont ajoutées dessous.
- Le champ du bas ne porte pas l'appareil photo de da : la place manque à côté du « + », et la photo reste dans le volant.

## Captures (r2/p5f/captures), ouvertes en planches côte à côte avec f9/p5 et da
- 390, clair et cave :
  - liste : `p5f-repos-390.png` ;
  - carnet : `p5f-carnet-390.png` ;
  - noter avec clavier : `p5f-noter-390.png`, `p5f-noter-critere-390.png`, `p5f-noter-liste-390.png`, `p5f-noter-pourquoi-390.png` ;
  - lien : `p5f-lien-390.png` ;
  - comparer : `p5f-comparer-390.png` ;
  - pourquoi : `p5f-pourquoi-390.png`, `p5f-pourquoi-ia-390.png` ;
  - autres : `articles`, `fiche`, `nouveau`, `evier`, `ventilation`, `completer`, chacun aussi en `-cave-390.png`.
- 844 × 390 : `p5f-comparer-844.png`, `p5f-frigo-comparer-844.png`, `p5f-ventilation-comparer-844.png`, et leurs versions `-cave-844`.
- Défauts vus sur les captures, puis corrigés :
  - « idée » et « · 15 nov. » sur trois lignes (une règle `b` de la liste) ;
  - brouillon coupé dans le champ (il est passé en zone de texte qui grandit) ;
  - « … » des invites relevé comme coupure ;
  - « 11’700 » et « CHF » séparés dans le bandeau ;
  - ★ du critère décalée sur deux lignes ;
  - sur Pourquoi avec le clavier, la dernière ligne cachée (marge du panneau) ;
  - lien sans aperçu à moitié vide (0,47, puis 0,86).

## Prédiction
« Là c'est fini : je vois où en est chaque carnet sans ouvrir, j'écris en bas et le clavier ne cache rien, et Comparer couché montre tout. Encore un peu dense, mais lisible. »

DÉCISION À PRENDRE : CARNET-LIS (40 mots au plus) contre CARNET-MAIGRE (ne rien retirer de da). p5f suit MAIGRE, le plus récent, et lit 65 à 141 mots. Un plafond révisé (par exemple 120 sur la liste et le carnet) est à lui montrer en variantes, avec une version repliée, pas à trancher en mots.
CONNAISSANCE : on simule un clavier de façon fiable en remplaçant `window.visualViewport` (EventTarget dont `height` vaut innerHeight − 300) puis en émettant `resize`. La page suit le même chemin que sur un téléphone, et le contrôle mesure le champ et la dernière note.
LEÇON PROPOSÉE : aucune
