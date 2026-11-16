# Carnet de recherche et de décision — cadre

Mission du 16.11. Cinquième tentative sur « besoin / embouteilleuse » : on change de genre de solution (L13).
Portée (L01) : un carnet pour **toute idée ou tout besoin** de la brasserie. L'embouteillage n'est qu'un exemple.
Rien dans le modèle, l'écran ou les libellés n'est propre à un seul besoin.

Sources : SPEC-BRASSEUR l. 1748 à 1793 (15 et 16.11), mot pour mot. Le code n'a aucun modèle « besoin » d'achat
(grep `src/` : seul le besoin en houblon d'une recette). Il n'y a donc rien à brancher : c'est un modèle neuf.

## Refusés (ne pas refaire)

- s2a2, fiche « Système d'embouteillage » (solutions, prix, barre de caisse) : « Ça correspond pas du tout à mes besoins ?? ». Refusé parce que le **prix** et la **caisse** y étaient au premier plan.
- ky / kz, parcours à étapes : « trop contraignant, pas intuitif ». Pas de formulaire ni d'assistant à étapes, pas de champ obligatoire.
- « Scan relié » visible : inutile.
- Lecture « Excel » (15.11) : fausse. Une solution se juge sur le problème qu'elle résout chez lui, pas sur un prix seul.

## Acquis à garder

- kh1r / kyh1 : « À venir » et le graphe de caisse. Un article choisi peut y partir, mais **en sortie** : le carnet ne montre pas la caisse.
- Le « + » volant (b1r) reste le geste d'ajout.
- Le lien entre scan et besoin se fait seul, dans Nouvelle dépense (Flash-Lite est accordé pour relier un devis à un besoin). Le carnet le reçoit sans l'afficher.

## État de l'art

**Problèmes d'école.** Ce besoin en réunit trois classiques.
1. **Le journal de décision (ADR).** Nygard (2011) pose cinq rubriques : titre, statut, contexte, décision, conséquences. MADR y ajoute les moteurs de décision (*decision drivers*), les options considérées avec leurs pour et contre, et le statut « remplacée par ». Le besoin « pas revenir en arrière » est exactement ce que l'ADR résout : un choix est daté et garde son pourquoi. Un choix revu ne s'efface pas, il est remplacé et l'ancien reste lisible.
2. **L'aide à la décision multicritère (MCDA).** On y trouve la matrice de Pugh (comparaison à une référence par +, 0 et −), la somme pondérée (WSM), l'AHP (comparaison par paires, lourde) et la dominance de Pareto (« moins bien partout »).
3. **Le carnet de recherche.** Un cahier de labo ou un Zettelkasten : des notes datées, au fil de l'eau, reliées ensuite.

**Outils connus.**
- Notion et Airtable : une base dont les propriétés sont libres par collection et dont les enregistrements sont liés. Les caractéristiques y sont dynamiques, mais tout est à saisir à la main.
- Les comparateurs (Versus, fiches produit côte à côte) : un tableau par caractéristique, avec le meilleur mis en avant.
- L'aperçu de lien : il lit les métadonnées Open Graph (`og:title`, `og:image`) et le balisage schema.org `Product`, dont `Offer.price` et `Offer.availability` (InStock / OutOfStock). Bibliothèques Node maintenues : `open-graph-scraper` et `metascraper`. La lecture se fait côté serveur, à cause du CORS.
- La veille de prix : Keepa et CamelCamelCamel suivent un historique de prix et déclenchent une alerte sur une baisse. Côté app, ce serait une fonction planifiée Firebase (Cloud Scheduler, toutes les 72 h).

**Ce qu'on garde.**
- **De l'ADR** : chaque choix est une entrée datée (choix, pourquoi en une ligne, options écartées avec leur raison, « à revoir si… »), avec un statut. Une entrée remplacée reste lisible. La question « pourquoi j'ai pris celui-là ? » se répond par la dernière entrée.
- **Des moteurs MADR** : *un* critère qui oriente (l'oxygène) est écrit au-dessus de la comparaison. Pas de poids chiffrés par défaut : le brasseur décide, il n'est pas un tableur (L04). La somme pondérée et l'AHP sont écartées, trop lourdes et contraires à ky / kz.
- **De Pareto** : une marque discrète « moins bien partout » sur un article dominé. **De Pugh** : comparer à l'article favori, avec mieux, égal ou moins bien.
- **De Notion et Airtable** : des caractéristiques libres par carnet (nom, unité, sens « plus est mieux », « moins est mieux » ou texte). L'IA les propose selon la catégorie et le brasseur en ajoute ou en retire. Il n'y a aucun gabarit par catégorie dans le code.
- **Du carnet de labo** : une note se dépose sans structure (texte, lien, photo), et c'est l'IA qui la range.
- **Des comparateurs** : un petit tableau par caractéristique, avec les articles classés.
- **Pour l'aperçu** : Open Graph et schema.org d'abord, l'IA seulement en repli.
- **Pour la veille** : un historique de prix et de stock par article, avec une alerte discrète.
- **Écarté** : un tableur de N lignes par M colonnes en premier plan (contraire à « vue sans détails »), et des gabarits figés par catégorie.

**Coûts et accords (irréversible ou externe).** La veille réelle demande une fonction planifiée et une recherche en ligne payante (Gemini avec Google Search) chez « d'autres fournisseurs ». Il faudra son accord au moment de la mise en ligne. En maquette, toutes les réponses de l'IA et de la veille sont **simulées et marquées « exemple »**.

## Ses besoins, numérotés et dans ses mots

1. **Partir d'une idée ou d'un besoin ouvert** : « j'ai un besoin ou une idée: embouteillages ». Une ligne suffit pour commencer.
2. **Noter ses recherches au fil de l'eau** : « J'ai besoin d'un endroit pour noter toutes ces recherches ». Sans structure imposée.
3. **Plusieurs façons de faire** : « il y a plusieurs façons de faire donc je vais rechercher les différentes façons » (gravité, isobarique…), chacune retenue ou écartée.
4. **Un critère qui oriente** : « il faut minimise l'oxygène donc je voudrais partir sur un système iso même si j'ai vu un système par gravité pas mal ». Le critère qui tranche entre les façons est écrit.
5. **5 ou 6 produits, de plusieurs fournisseurs et lieux** : « j'en trouve 5 6 différents, différentes endroit et tout ».
6. **Comparer les caractéristiques, pas seulement le prix** : « Comparé les caractéristiques des systèmes ». Un tableau par caractéristique.
7. **Des caractéristiques dynamiques et génériques** : « ça doit être générique, un frigo, une ventil, un évier, ECT... Ça doit être dynamique et générique ». L'IA les propose par catégorie, il en ajoute ou en retire.
8. **Garder le pourquoi, pour ne pas revenir en arrière** : « pas revenir en arrière, du genre pourquoi j'ai pris un système iso super chère... pourquoi j'ai pris ce fournisseur ». Cela vaut pour le choix de la façon, du produit et du fournisseur.
9. **Facile, une vue sans détails d'abord** : « une vue sans détails juste pour savoir de quoi on parle et ensuite on peut détaillé et comparé ». Au premier plan : de quoi on parle, où on en est, le choix et son pourquoi en une ligne. Le reste est à un toucher.
10. **L'IA au besoin** : « je pourrai utiliser l'ai pour voir si ce produit est disponible », « Utiliser l'ai au besoin ». Elle propose les caractéristiques, lit un lien collé, vérifie la disponibilité et résume. Elle n'est jamais obligatoire.
11. **Un lien collé montre l'objet** : « je mets un liens, ça montre l'objet ». L'aperçu donne photo, nom, prix et fournisseur.
12. **Une bascule de veille par article** : « un toggle switch qui va regarder tout les 3 jours si l'article est en stock aussi Chez d'autres fournisseurs et si il a baissé de prix ». La veille porte sur le stock chez ce fournisseur et chez d'autres, et sur la baisse de prix. L'alerte est discrète.

**Règle générale** : chaque besoin ci-dessus s'applique à toute idée (embouteillage, frigo, ventilation, évier, étiqueteuse…). Un critère de lot qui ne marche que pour l'embouteillage échoue.

## Scénario réel, pas à pas (embouteillage)

Prix, cadences et oxygène sont **plausibles et marqués « exemple »**, jamais présentés comme vrais (L20).
1. **Idée.** Il touche « + » et écrit « embouteillage ». Le carnet est créé, au statut *idée*. L'IA propose une catégorie (« embouteillage ») et des caractéristiques : oxygène capté, cadence, becs, formats, CO₂, nettoyage, encombrement, prix. Il retire « formats » et garde le reste.
2. **Façons de faire.** Il note « gravité, 4 becs, vu chez un collègue, pas mal » et « isobarique ». L'IA les range en deux façons.
3. **Critère.** Il écrit « il faut minimiser l'oxygène ». Cela devient le critère qui oriente, affiché en tête. La façon *gravité* passe à « écartée, oxygène » ; c'est la décision n° 1. Statut : *recherche*.
4. **Produits.** En deux semaines, il colle 6 liens. Chacun s'affiche en aperçu (photo, nom, prix, fournisseur, lieu) : contre-pression manuelle 1 bec (DE, 190 CHF), iso 2 becs (IT, 1 850 CHF), iso 4 becs semi-auto (IT, 6 400 CHF), iso 4 becs avec pré-évacuation (DE, 11 200 CHF), iso 4 becs avec pré-évacuation chez un revendeur suisse (CH, 12 300 CHF), monobloc 6 becs (IT, 21 500 CHF). L'IA remplit ce qu'elle lit, et ce qu'elle n'a pas trouvé reste « ? ».
5. **Comparaison.** Statut : *compare*. Un tableau par caractéristique : sur l'oxygène, les deux machines à pré-évacuation arrivent en tête (≈ 40 ppb) ; sur la cadence, le monobloc ; sur le prix, la manuelle. La manuelle porte la marque « moins bien partout sauf prix ». Il active **Surveiller** sur les deux iso à pré-évacuation.
6. **Veille (simulée).** Trois jours plus tard, une alerte discrète : « Iso 4 becs pré-évac. : −600 CHF chez le revendeur suisse ; en stock chez un 3ᵉ fournisseur (AT) ».
7. **Choix.** Il choisit l'iso 4 becs avec pré-évacuation chez le revendeur suisse. Pourquoi, en une ligne : « oxygène le plus bas à 4 becs ; SAV en Suisse ; −600 CHF à la veille ». Options écartées : la 2 becs (« cadence trop basse pour 300 L ») et le monobloc (« double prix pour une cadence inutile »). À revoir si le volume dépasse 1 000 L par mois. Statut : *choisi*. Il peut ensuite l'envoyer dans « À venir » (kh1r).
8. **Plus tard.** En mars, il ouvre le carnet. La vue sans détails dit : « Embouteillage · choisi · Iso 4 becs pré-évac. (CH), oxygène le plus bas, SAV suisse ». Il demande à l'IA : « pourquoi j'ai pris ce fournisseur ? ». La réponse vient de la décision n° 2 et des notes, avec leurs dates.

## Deux autres exemples, joués de bout en bout

**Frigo de garde.**
1. Il écrit l'idée « frigo de garde pour fûts ». L'IA propose : volume utile, nombre de fûts de 20 L, plage de température, consommation (kWh/an), bruit, passage de porte, prix. Il ajoute « passage de porte 80 cm ».
2. Deux façons : chambre froide en kit, ou frigo vitrine professionnel. Critère : « tenir 2 °C stable en été ».
3. Quatre liens collés (CH, DE, occasion locale, IT), dont la chambre froide à 4 900 CHF et la vitrine à 2 300 CHF.
4. Comparaison : la vitrine d'occasion est la moins chère, mais l'IA signale « bruit ? » et « non trouvé ». Il active Surveiller sur la vitrine neuve. Veille simulée : « rupture chez le fournisseur ; dispo chez un autre à +90 CHF ».
5. Choix : la chambre froide en kit (CH). Pourquoi : « 6 fûts, stable à 2 °C en été ; la vitrine ne passe pas la porte ». L'occasion est écartée (« pas de garantie sur le compresseur »).

**Ventilation de la salle de brassage.**
1. Il écrit l'idée « buées au-dessus de la cuve ». L'IA propose : débit (m³/h), bruit (dB), diamètre de gaine, consommation, tenue à l'humidité, prix.
2. Deux façons : une hotte inox avec extracteur, ou un extracteur mural seul. Critère : « plus de condensation au plafond ».
3. Cinq liens collés. L'aperçu d'un des liens échoue (aucune métadonnée) : il reste la carte « lien seul », complétable à la main ou par l'IA.
4. Comparaison sur le débit et le bruit. Il retire la caractéristique « consommation », qui ne compte pas pour lui.
5. Il hésite et rien n'est choisi : le carnet reste au statut *compare*, avec une note « attendre l'avis du ferblantier ». C'est un état normal, pas une erreur.

**Évier inox** : une idée notée en une ligne et rien d'autre. Ce carnet garde le premier plan vivant avec un état *idée* vide.

## Trois axes de conception pour les séries

Tous les axes partagent un premier plan sans détails : une liste de carnets, une ligne chacun (titre, statut, choix et pourquoi ou prochaine étape, petite icône de veille). Aucun formulaire ni parcours à étapes. La caisse n'est pas affichée.
- **A. Fil de notes qui se range seul.** L'intérieur d'un carnet est un fil daté où il dépose tout (texte, lien, photo, voix). L'IA en tire des « façons », des « articles » et des « caractéristiques », visibles en pastilles au-dessus du fil. La comparaison et les décisions sont des vues dérivées, à un toucher. Le geste roi est de coller un lien ou d'écrire une phrase.
- **B. Tableau de comparaison vivant.** L'intérieur d'un carnet est l'ensemble des articles, en cartes d'aperçu (photo, prix, fournisseur, bascule Surveiller). Les caractéristiques sont des puces qui s'ajoutent ou se retirent. Toucher une puce affiche *un tableau par caractéristique* (articles classés, meilleur en tête, critère orientant en premier). Le geste roi est de comparer et de basculer la veille.
- **C. Journal de décision.** L'intérieur d'un carnet est une frise de décisions façon ADR : façon retenue, critère, produit, fournisseur. Chaque décision porte un pourquoi en une ligne, ses options écartées et un « à revoir si ». Une entrée remplacée reste barrée et lisible. Les articles et la comparaison sont les preuves attachées à chaque décision. Le geste roi est de répondre à « pourquoi j'ai pris celui-là ? ».

Chaque série joue les trois carnets de `fixture.json`, plus l'évier, dans chaque état : idée, recherche, compare, choisi, aperçu raté, alerte de veille, caractéristique retirée. L'IA y est simulée et marquée « exemple ».
Questions ouvertes à montrer en variantes, jamais en mots seuls (L24) : où vit le carnet dans l'app (onglet propre, sous Finances ou sous le « + »), et la forme de l'alerte de veille (pastille, toast, ligne dans la liste).

## Leviers ajoutés par le brasseur (16.11, « Tous »)
- Partager vers l'app : depuis le navigateur, « Partager → L'Affinée ». Le lien arrive dans le carnet avec son aperçu, sans copier-coller.
- Raccourci sur l'écran d'accueil : « Nouvelle idée » par un appui long sur l'icône.
- Voix : on dicte une idée ou une note de recherche, sans clavier.
- Lien avec le calendrier : une idée avec une échéance ou un budget apparaît dans le calendrier global ; une baisse de prix signalée par la veille s'y affiche aussi.
- Propositions acceptées en un toucher : les caractéristiques de la catégorie et les fournisseurs à comparer.
- Essais sur son téléphone : le prototype retenu doit pouvoir être joué seul, avec des tâches chronométrées.

## Tout est lié (16.11, « Dans l'application tout a un lien avec tout... »)
- Le carnet n'est pas une île. Liens à montrer dans le prototype, simulés :
  - **Calendrier** : un + dans la bonne section du calendrier crée une idée qui arrive dans le carnet ; l'échéance et le budget du carnet apparaissent sur la frise.
  - **Compta** : le budget prévu passe dans la prévision de caisse. Le choix fait devient un besoin d'achat, puis le devis et la facture se rattachent au carnet, et le prix payé se compare au prix noté.
  - **Fournisseurs** : un fournisseur retenu est le même que celui de la compta.
  - **Atelier et matériel** : l'article acheté devient du matériel, avec son entretien.
- La carte complète des liens sera dans `work/missions/2026-11-16-liens-app/LIENS-APP.md`, dès qu'elle existe ; la lire à chaque passe.

## Critères 9,5-10 (panel 16.11)
- Détail (mesure exacte, seuil, sources, rejetés) : `work/missions/2026-11-16-criteres-10/CRITERES-10.md`. Aucun n'ajoute de texte au repos ; toucher sa maquette se montre en variantes.
- Q1 Zéro redite (tous) : clés `data-fait` comptées dans la fenêtre, rappel collé exclu si l'original est hors de vue ; 0 doublon dans chaque état (p1 échoue : 173 ×3).
- Q3 Zéro troncature (tous) : scrollWidth > clientWidth + 1 ou ellipse sur noms, montants, dates, échéances ; 0 coupé, nom court K5 puis deux lignes, jamais « … ».
- Q4 Cibles et pouce (tous) : zone touchable sondée par elementFromPoint à 390 × 844 ; 0 cible < 44 px, 0 voisine < 8 px, bord tiré ≥ 24 px, 100 % des actions de fin dans les 45 % du bas.
- Q5 Contexte et effet visibles (tous) : rect de la cible et de la surface ouverte, MutationObserver des valeurs changées ; cible jamais couverte, surface ≤ 40 % à 390, 100 % des valeurs changées vues ou signalées.
- Q6 Rien ne saute (tous) : layout-shift et FLIP pendant T1-T16 et K11 ; CLS ≤ 0,01, chose touchée à ±8 px, glissement 120-250 ms, 0 ms en reduced-motion.
- Q7 Fluidité au doigt (tous) : CPU ×4, fixture ×4, trace des glissers ; ≥ 55 images/s, 0 tâche > 50 ms, INP ≤ 100 ms, barre ≤ 4 px du doigt, caisse dans la même image.
- Q9 Le geste s'annonce (tous) : poignée si et seulement si déplaçable, `data-ro` sans poignée avec picto d'origine, aucun pointillé de saisie ; 100 % conformes, juge neuf ≥ 95 % et 5 gestes sur 5.
- Q10 Icônes reconnues seules (tous) : chaque icône à 12 px nommée par un juge neuf ; 8 sur 8, une ratée se montre en variantes.
- Q11 Grammaire des signes (tous) : signes relevés contre `signes.json` ; ≤ 5 par écran, 0 à double sens, ≥ 90 % nommés à l'aveugle.
- Q12 Rouge réservé au problème (tous) : tout chaud porte `data-etat` d'alerte et une forme ; 0 chaud hors alerte, ≤ 3 masses rouges, au flou 6 px alerte et grand chiffre en tête.
- Q13 Palette daltonien (tous) : `validate_palette.js` deux thèmes ; CVD ≥ 6, normal ≥ 15, aucun genre gris, ΔE ≥ 15 avec `--bad` ; correction en variantes.
- Q15 Base honnête (tous) : ligne zéro, ≤ 2 graduations, avant/après pendant le geste seulement, barres de Comparer depuis un zéro commun ; erreur ≤ 2 %.
- Q17 Test des 5 secondes (tous) : 3 juges Haiku neufs, capture 50 % floutée 2 px, 3 questions par écran ; 3 sur 3 chez chacun, deux thèmes.
- Q18 Zéro confirmation (tous) : boutons OK, Poser, Valider, Confirmer comptés hors toast, Annuler rejoué en égalité profonde ; 0 confirmation, Annuler ≥ 5 s, état identique hors ligne compris.
- Q19 Provenance visible (tous) : `data-origine` sur chaque valeur ; 0 valeur étrangère sans picto ≥ 14 px, 0 raison écrite sans sa validation, 0 inconnu à zéro.
- Q20 Aller-retour sans perte (liens) : 12 genres et carnet ↔ calendrier, aller-retour et sens inverse ; 1 geste, scroll ±8 px, filtres, tri, période identiques, 0 écart de valeur.
- Q21 Même signe partout (liens) : jetons picto, teinte, nom court par genre dans tous les modules ; 0 écart.
- Q22 Propositions justes (tous) : leave-one-out, réglé 2021-2023, jugé 2024-2025 ; 1re puce ≥ 60 %, 3 premières ≥ 90 %, semaine ±1 ≥ 80 %, montant ±10 % ≥ 70 %, carnet ≥ 80 % gardées.
- Q23 Son essai réel (tous) : page L7 chronométrée, journal des touchers ; médiane ≤ 6 s, 0 clavier, ≤ 1 hésitation, sa phrase classée « aime ». Juge final, non bloquant.

## Paysage mobile (16.11, « Il faut vraiment une version horizontal pour mobile btw »)
- La comparaison et la liste des carnets ont une vraie vue paysage à 844 × 390. La comparaison y montre au moins 5 articles côte à côte.

## Ses choix sur les liens (16.11)
- L1 : une idée créée depuis le calendrier arrive au carnet, sans rien ajouter à l'écran du calendrier.
- L9 : un achat choisi au carnet, une fois reçu, entre dans la table des consommables (geste → décompte).

## p5 : « certaines écran sont inutilisable en l'état » (16.11)
- Chaque écran doit être utilisable seul : on comprend de quoi il parle et on peut agir, sans aller voir ailleurs.
- Suspects dans p5 :
  - Comparer au téléphone : la 3ᵉ colonne est coupée et les colonnes inactives n'ont pas de chiffre ;
  - le journal : les notes sont repliées en icônes muettes ;
  - des écrans à moitié vides ;
  - la liste des carnets.

## Audit p5 (16.11)
Trois regards, 390 tactile avec clavier et 844×390 ; détail : `r2/P5-AUDIT.md`. Inutilisables (au moins 2 regards sur 3) :
- Évier : écran vide à 80 %, critère de l'IA en toast fugace. Correction : état idée de da (« Chercher / Plus tard », caractéristiques proposées, champ unique), critère en carte durable du journal.
- Noter : 3 touchers, écran plein qui cache le carnet, Ajouter sous le clavier en paysage. Correction : champ unique de da dans le carnet, envoi en 1 toucher, visible au-dessus du clavier (fil, ou bas + visualViewport), puis « ✦ rangé » et la carte critère.
- Comparer à 390 : 2 colonnes sur 7, la 3ᵉ coupée en demi-chiffres, vert sur un écarté. Correction : tableaux par caractéristique de da en portrait avec la typo de p5 ; tableau complet de p5 en paysage.
- Carnet neuf : 70 % vide, propositions coupées, aucune suite. Correction : état neuf de da, puces sur plusieurs lignes, carte « Ensuite : Coller un lien · Chercher les façons ».
- Faibles (1 regard sur 3) : Carnet ouvert (ni champ ni critère) et Frigo (alerte repliée ; 6 fûts contre 30, à clarifier).

## Critère d'acceptation : SON SCÉNARIO DE ZÉRO (16.11, CARNET-COEUR)
- Jouer son scénario au doigt, d'un carnet VIDE, sans fixture. Les étapes sont détaillées à la ligne CARNET-COEUR de DEFAUTS-RECURRENTS.md.
- Refaire ensuite tout de zéro pour un frigo, une ventilation et un évier.
- La fixture ne sert qu'à montrer un carnet déjà mûr. Elle ne remplace jamais un geste.

## THEME-APP, bloquant (16.11 : « Pourquoi il y a un thème autre que celui de l'app, et pas de couleur ? »)
- Reprendre les jetons de DESIGN.md (frontmatter `colors`) :
  - le thème cave sombre par défaut, avec son clair ;
  - les accents EBC (paille, or, ambre, cuivre) ;
  - les couleurs de zone (production, finances, stocks, agenda), le houblon et l'eau.
- Pas de crème neutre sans couleur. L'onglet actif de la barre correspond à l'écran.
- Contrôle : ligne THEME-APP de DEFAUTS-RECURRENTS.md, deux thèmes capturés.
- Bloc « Façons possibles » proposé par l'IA : barré d'un X rouge par le brasseur, à retirer ou à revoir (en attente de sa précision).

## FAB-GAUCHE, bloquant (16.11 : « En bas à gauche un peu au dessus des Tab, c'est genre la 200eme fois que je le dis »)
- Le + volant va en bas à GAUCHE, juste au-dessus de la barre d'onglets, en portrait comme en paysage. Ce n'est jamais à droite.
