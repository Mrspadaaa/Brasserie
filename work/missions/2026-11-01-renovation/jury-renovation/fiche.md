# Fiche de cadrage — l'outil de la rénovation (01.11, nuit)

Jury normal : Brasseur (fable), Contradicteur (opus), Premiers principes (opus). Avis : `avis-*.md`, même dossier ; dossier :
`dossier.md` ; faits : `../DEPART.md`.

## Hypothèse
- **Avant (55 %)** : un écran de vue d'ensemble qui étend les Projets de matériel. Facteur libre : l'ordre des chantiers. Le récap
  répond à « quand pourrai-je payer ? » et « quand aurai-je fini ? ».
- **Après (75 %)** : le premier outil est **la liste de ce qui manque, saisie en un titre**, ordonnée en « ce que je fais ensuite ».
  Elle étend les Projets de matériel : une nature *achat* ou *travail*, la catégorie « Local et travaux » que le modèle accepte déjà.
  - Prix, heures et dates s'ajoutent quand il les connaît.
  - La prédiction (payer, finir) n'apparaît que sur des entrées réelles, et dit ce qui lui manque.
  - Au jour 1, son état réel, rien n'est saisi : la vue doit y être utile et juste.

## Tranché
| n° | Question | Réponse | Source |
|---|---|---|---|
| J1 | Scène | Téléphone. Le geste le plus fréquent : **noter un manque** dès qu'il y pense, y compris sur le chantier, d'une main. Consulter le plan est plus rare. Lieu de la consultation : lecture étroite, non tranché. | « il me manque encore beaucoup de choses », « pas beaucoup de temps » (SPEC 01.11) ; 3 regards |
| J2 | Question de l'outil | **« Qu'est-ce qui me manque, et qu'est-ce que je fais ensuite ? »** Un seul facteur libre, **la place d'un manque dans la suite** (Ensuite, Plus tard…). Argent et heures sur la ligne de contexte, montrés seulement s'ils sont connus. « Payer » et « finir » ne se disent pas au repos. | L10 ; Contradicteur J2 (rien ne réagit au jour 1) ; PP J2 |
| J3 | Pourquoi maintenant | Grande rénovation en cours. Aucun chantier saisi. L'outil existant est au 3ᵉ niveau de Finances, et son formulaire fige « Matériel ». | DEPART ; `UpgradeSheet.tsx:18` |
| J4 | Réussite | Ses cinq titres posés en **moins d'une minute** (un titre, un toucher). Au repos : ce qui manque, l'« Ensuite », ce qui le bloque. Un chiffre apparaît dès qu'un prix existe. 60 mots au plus au premier écran. | Contradicteur J4, PP J4, Brasseur J4 |
| J5 | Ce qui survit | Les Projets de matériel et leurs données (système de brassage), « Noter l'achat », les factures liées, l'inclusion dans les Prévisions, l'Agenda du Bord. On **étend** ; on ne double pas l'Agenda. Le récap en haut et les pastilles sont des goûts sourcés (Nouvelle dépense, r1 et r2b, SPEC l. 897-898), pas une forme choisie pour cet écran. | CLAUDE.md « finir ou brancher » ; Contradicteur J5, J10 |
| J6 | Refusé | Cockpit, texte au premier plan (D1 à D5). Inconnu affiché « null » ou 0 (D14). **Zone muette** (D259). Un dessin naïf : il a aimé la vraie vue de u3, pas son dessin. Une frise ou une date vide est une zone muette. | DEFAUTS-COURT ; SPEC 01.11 ; PP J6 |
| J7 | Ce qui lie | Hors ligne. Aucun chiffre inventé. Champs neufs **facultatifs, en version 1** (un client ancien rejette une autre version). La saisie gagne sur la précision. | PRODUCT.md ; `upgrades.ts:43` |
| J9 | Le code | Le modèle accepte déjà la catégorie `renovation` (« Local et travaux »). Hotte, 2ᵉ évier et armoire tiennent dans achat + livraison + installation. Il manque : heures, ordre, cause du blocage, chantier sans achat (site, sols). **Mesuré** : 3 de ses 5 chantiers tiennent dans le modèle actuel, 0 avec heures ou ordre. | `upgrades.ts:42` ; `FinanceForms.tsx:12` |
| J11 | Cas limites | Voir « États à montrer » ci-dessous. Le jour 1 en premier. | 3 regards |
| J12 | Hors périmètre | Vente, prix, marge, ROI (« pour après »), TVA, amortissement, devis automatiques, IA. La Nouvelle dépense : rien ne s'y touche (port en cours). | SPEC 01.11 ; DEPART |
| J15 | Le vouloir réel | La liste des manques d'abord. Le plan ensuite, nourri par la saisie. | Brasseur J15, PP J15, Contradicteur J15 |
| J16 | Irréversible | Nature, heures, ordre, blocage : champs de `financialPlans`, ou nouvelle collection (règles et déploiement en plus). ACCORD, **après son choix**. Les maquettes ne touchent rien. | 3 regards |
| J18 | Lecture de « j'ai plus besoin » | **Davantage besoin.** Le message continue « car la brasserie est en grande rénovation, et il me manque encore beaucoup de choses » ; la lecture « ne plus » contredirait cette cause. Lecture du pilote, dite au brasseur. | SPEC 01.11 ; L01 |

**Mesure faite (01.11)** : aucun profil financier enregistré (`financialProfiles` vide). La caisse de départ est donc inconnue, et la
prévision ne peut dire « quand pourrai-je payer » qu'à partir d'une caisse ou d'une enveloppe saisie.

## Hypothèses du pilote (à recopier dans chaque brief)
1. Une saisie de manque = un titre ; tout le reste « à estimer », jamais 0 et jamais une date inventée.
2. La nature (achat, travail, ou les deux) se devine sans question : « Installation de la hotte » est un achat avec pose ; « site web
   vitrine » est un travail. Elle se corrige d'un toucher.
3. Le blocage a une cause en mot : un autre chantier, un artisan, un devis, une livraison, l'argent.
4. Ses heures par semaine : un réglage « à régler », hors du premier plan.
5. Données fictives : ses cinq chantiers cités (ses mots, pas des données), des montants et des noms d'artisans fictifs. Aucune
   donnée réelle, aucun nom de fournisseur réel.
6. Le site vitrine et les sols sont des manques comme les autres.
7. La saison (froid de novembre pour l'armoire extérieure et les sols) : aucun conseil affiché (ce n'est pas de lui).

## Axes de variantes (chaque série en couvre au moins deux)
- **place** : (1) le Bord, une ligne « Ensuite » et la liste à un toucher ; (2) Finances › Prévisions, les Projets de matériel
  élargis ; (3) un écran à lui, ouvert depuis le Bord.
- **forme** : liste par état avec pastilles ; file ordonnée (glisser ou flèches) ; frise des mois (seulement pour ce qui a une date) ;
  vraie vue figurée (la brasserie en plan ou en coupe, chaque manque à sa place ; aucune zone muette).
- **mot** : « Rénovation » (ses mots, « grande rénovation ») ; « Ce qui me manque » (ses mots) ; « Local et travaux » (le mot de l'app).
- **argent** : rien tant qu'aucun prix ; le reste à payer seul ; une enveloppe qu'il fixe (« 2 000 CHF pour les travaux »), contre
  laquelle les prix se posent ; la caisse des Prévisions, avec « caisse à renseigner » tant qu'elle est inconnue.
- **temps** : aucun ; les heures par manque, sans date de fin ; une fin estimée seulement si heures et rythme sont connus.
- **étapes** : aucune ; cases à cocher dans le manque ouvert (sans doubler l'Agenda) ; le geste « noter l'achat » seul.

## États à montrer (`?etat=`, tous jouables)
1. `jour1` : ses cinq titres seuls, rien d'autre (son état réel).
2. `encours` : un mois plus tard. Hotte payée mais pas posée. Évier chiffré sur devis. Armoire bloquée par les sols. Sols en cours, payé
   en partie. Site sans achat, en heures.
3. `ajout` : le geste d'ajouter un manque, ouvert.
4. `ouvert` : un manque ouvert (prix, heures, étapes, blocage, « Noter l'achat »).
5. `depasse` : un budget dépassé par les factures liées.
6. `caisse` : la caisse ou l'enveloppe inconnue, puis connue (selon l'axe argent de la variante).
7. `fini` : un manque fait, dont un fini hors de l'app.
8. `horsligne`.

## Accords groupés (à l'utilisateur, sans bloquer)
- Après son choix de maquette : le modèle (champs facultatifs dans `financialPlans`, ou nouvelle collection), puis le déploiement.

## À mesurer
- À faire après le choix, avant le code : le nombre de touchers pour atteindre « Projets de matériel » aujourd'hui (Contradicteur J3).

## Désaccords du jury
- **Facteur libre.** Le pilote et Premiers principes : l'ordre. Le Contradicteur : rien ne réagit au jour 1. Le Brasseur : la liste et
  les prix d'abord. Tranché : la liste est le premier geste, l'ordre est le facteur ; aucune date au repos. Le reste devient l'axe
  « temps ».
- **Argent.** Le pilote : le solde projeté. Le Contradicteur et Premiers principes : souvent nul, sans apports. Mis en axe « argent »
  (enveloppe contre caisse).
- **Scène.** Le Contradicteur refuse « bureau » (absent de ses mots). Lecture étroite : téléphone, sans lieu.

## Coût
3 appels :
- Brasseur : fable, 39 k jetons ;
- Contradicteur : opus, 93 k jetons ;
- Premiers principes : opus, 42 k jetons.

`JURY OK — normal, 14 tranchées, 6 axes, 1 accord, 7 hypothèses — work/missions/2026-11-01-renovation/jury-renovation/fiche.md`
