# Brief commun : lot v0 de l'écran « Nouvelle dépense » (saisie d'une facture)

**La question du lot** : comment le brasseur voit d'un coup d'œil si sa facture est lue juste, règle seulement les points où l'IA n'est
pas sûre, à leur place, relie chaque ligne au bon article du stock, et enregistre avec la preuve dans son Drive, sans attendre ?

## Ses mots (31.10, mot pour mot, SPEC-BRASSEUR)
- « déjà la partie business est pas 100% correcte. Les liens avec le stock et tout de font pas correctement, certain champs sont mal
  remplis. Pas sûr que ça upload vraiment le document sur mon drive... Et avec la facture d'envoyer ça a pris vraiment longtemps 10s 20s
  sur téléphone. »
- « Surtout montrer les points où l'ia n'es pas sûr »
- « comme c'est de la facturation, c'est super important, ça doit être très fiable ! »
- « Attention au mapping, on veut pas de retrouver avec plein de fiche du même produit »
- « Unité illisible : la ligne n'est reliée à aucun article.???? » (D214 : la ligne reste reliée, l'unité vide, « unité à préciser »)

## Lire d'abord (une fois)
- **La baseline** : `inventaire/inventaire-depense.md`, puis les captures `inventaire/captures/depense-lu-390.png`,
  `depense-lu-articles-390.png`, `depense-lu-1280.png`, `depense-erreur-390.png`. Ses trois captures de l'app :
  `brasseur/depense-haut.jpg`, `depense-avertissements.jpg`, `depense-articles-stock.jpg`. **Regarde-les ; n'en copie rien** (sa facture
  porte son nom et son adresse).
- **Ce qui est faux aujourd'hui** : `diagnostic/d1/DIAGNOSTIC.md` (le tableau, puis § 5 « L'incertitude » : six façons de montrer un doute à
  sa place, c'est ton matériau) et le tableau de `diagnostic/d2/DIAGNOSTIC.md` (DR1 à DR5, LE5).
- **Sa langue, ce qu'il a choisi** : `work/missions/2026-10-31-ecran-identite/v1/r4-a/etat.html` (« ça semble vraiment bien ») et
  `work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html` (« Oui ça c'est bien », puis « C'est très bien ») : la ligne de ticket
  compacte, la barre qui porte la valeur, la pastille, le détail à un toucher, l'édition sur place. Ouvre-les dans Chrome.
- Les skills `boosters-ux`, `impeccable` et `ui-design-system`, **avant de dessiner**. Puis `.claude/rules/affinee-frontend.md`, DESIGN.md,
  `docs/ui-compacte.md`, `cerveau/brasseur/glossaire.md`, `cerveau/brasseur/pas-de-cockpit.md`.

## La facture à montrer : la sienne
`diagnostic/d1/verite-facture-372765.json` (transcrite à la main, sans son nom ni son adresse) : Brau- und Rauchshop GmbH, pro-forma 372765
du 27.04.2026, payée en ligne, **23 lignes, 86,50 CHF**, deux taux de TVA (codes N et R). Prends ses vraies lignes : Maris Otter 6 Kg à
2,30 = 13,80, la mouture « Zuschlag Schrotung » 6 Kg à 0,10 = 0,60 juste en dessous, Gerstenflocken, Röstgerste, Target 11.3 %, Safale
US-05 en Stk… Les points à régler sur cette facture, tirés du diagnostic :
- la TVA imprimée ne se recoupe pas (C3) : un seul point « TVA imprimée incohérente », HT laissé vide ;
- la date de paiement n'est pas imprimée : « supposée = date de la facture » (A7) ;
- pro-forma, mais payée (« Betrag erhalten ») : reste « Déjà payé » (A6) ;
- l'α est dans le nom (« Target 11.3% ») : le nom est la variété, l'α va à part (A9) ;
- la mouture : proposée, rattachée au malt du dessus **par le seul geste du brasseur** (S5) ;
- une levure en Stk contre un article en sachets : équivalence visible (S4) ;
- un même produit avec une autre donnée (α, origine) : un article « bis » ou « Cascade CH », jamais un doublon ni un écrasement (D215, D216) ;
- une ligne à l'unité illisible : « unité à préciser », rien en stock tant qu'elle manque (D214) ;
- la page 2 coupée : la somme des 23 lignes fait 86,50 = le total imprimé, donc rien ne manque **dans ce qui a été vu** (P2).
Le reste est recoupé deux fois et par les contrôles du code (somme des lignes, quantité × prix au centime) : **dis-le, en peu de mots**.

## Obligatoire, et rien d'autre
1. **La baseline, suivie toujours** : un plancher à enrichir (L07). Chaque fonction de l'inventaire reste atteignable (au premier plan ou à
   un toucher) : le justificatif (voir, changer), Total TTC, Pour quoi ?, la date de l'achat, Déjà payé / À payer, payé le et moyen,
   l'échéance, fournisseur et catégorie, lier à une dépense prévue, les lignes (type d'achat, réception en stock : article, quantité, unité ;
   matériel), ajouter, retirer, regrouper, « Détail X / Y », référence et TVA (n° de commande, n° de facture, TVA, taux), le pied
   « Confirmer et enregistrer », le × qui ferme. À cocher dans ta NOTE.
2. **L'honnêteté** :
   - une valeur non imprimée reste vide ; une valeur déduite est marquée « déduite » ou « supposée », jamais montrée comme lue ;
   - un doute de lecture montre les valeurs lues côte à côte (« 2,80 · 4,15 »), pas une phrase ;
   - un contrôle qui échoue montre son calcul (« 6 × 2,30 = 13,80 ») et l'écart au centime ;
   - ce qui est absent par nature (HT non imprimé, un seul taux sur une facture à deux taux) n'est **pas** un point ;
   - l'unité imprimée est gardée ; une conversion se voit ;
   - montants en CHF, deux décimales, virgule (86,50).
3. **Le Drive et le temps** :
   - avant « Confirmer », on voit si le Drive est prêt (DR3) ;
   - pendant la lecture, trois étapes (envoi, lecture, vérification) et l'écran ne se fige pas (LE5) ;
   - à l'enregistrement : « envoi au Drive en cours » sans bloquer, puis **un reçu** : le nom lisible du fichier
     (« 2026-04-27 Brau- und Rauchshop 372765.jpg ») et le lien vers le Drive (DR1, DR4, DR5).
4. **Le pouce à 390 px** et l'ordinateur à 1280 px. Clavier fermé, au premier écran : le verdict (total, fournisseur, date, combien de
   points à régler) et le premier point. **100 mots au plus au premier écran, aucune phrase d'aide au repos.** Le stock en icône (0 mot).
5. **Les interdits** : le cockpit ; le texte au premier plan ; sept puces d'avertissement en phrases ; « Lecture à confirmer » pour tout ;
   la superposition ; un bouton imposant ; un texte sous 12 px ; `type="number"` ; un chiffre inventé ; un lien au stock deviné en silence.

## Les états, dans l'annexe de ta page (tous)
1. lecture en cours (les trois étapes) ;
2. lue, sans point ;
3. lue avec ses points (sa facture) ;
4. un point réglé, puis tous réglés ;
5. erreur de lecture (le fichier est gardé, saisie à la main) ;
6. Drive pas connecté ;
7. enregistrement en cours, puis le reçu Drive ;
8. achat peut-être déjà enregistré (S8 : autre numéro, même commande, même total) ;
9. hors ligne.
Chaque état peut être une petite capture ; le premier écran de l'état 3 est celui qui compte.

## Indicatif
- **Les boosters UX** (`boosters-ux`) : marque chaque booster `data-booster="nom"`, puis coche B1 à B13 dans ta NOTE ; B8 (les états) et
  B11 (l'honnêteté) sont obligatoires dès la v0.
- **Les axes** (hypothèses du pilote, réversibles ; pas de jury sur ce lot, D223) :
  - **A1, où vit le doute** : sur le champ ou la ligne même ; un fil « à régler » trié par risque (argent, stock, texte) qui saute à sa
    place ; ou les deux ;
  - **A2, les 23 lignes** : un ticket compact ; groupées par famille (malts, houblons, levures, services) ; repliées sauf les douteuses ;
  - **A3, le lien au stock** : une icône par ligne (relié, nouveau, bis, aucun, unité à préciser) ; le toucher choisit l'article ; la
    mouture se rattache au malt d'un geste ;
  - **A4, le temps** : ce qui est déjà utilisable pendant la lecture ; un enregistrement qui ne retient pas le brasseur ;
  - **A5, le verdict** : « 86,50 CHF · 23 lignes recoupées · 3 points » et la preuve de ce qui a été recoupé.

## Ce que rend chaque concept (`work/missions/2026-10-31-ecran-depense/v0/<série><n>/`)
- `etat.html` : une page statique jouable à 390 × 844, qui tient à 1280 px, avec les vrais mots et les vrais chiffres. Classes et globales
  préfixées par son id (L26) ; chaque nombre se tape ; chaque point se règle.
- `NOTE.md` : la chaleur ; les axes explorés ; l'idée en une phrase ; la baseline cochée ; B1 à B13 ; ce qui tient et ce qui casse.
- Les captures : `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>`, plus une à 1280 px ; **ouvertes** (L12).
- Contrôles : `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs <dossier> --profil=sans-houblons`, puis
  `mots-premier-ecran` et `controle-contraste` avec le même profil. Note leur sortie ; un échec ne bloque pas la v0, mais il se dit.
- Environ 10 tours par concept. Un concept minimaliste, c'est **une seule idée, pas un écran vide**.

## Les séries (chacune lit la liste pour ne pas refaire les autres)
| Série | Approche | Agent |
|---|---|---|
| r | **dans sa langue** : le ticket de Malts s1 et d'Identité r4-a appliqué à la facture, le doute sur la ligne (A1, A2, A3) | concepteur (Opus) |
| z | **créative à fond** : la forme est libre, sans retenue ; la baseline et l'honnêteté restent suivies | concepteur (modèle Fable) |
| u | **libre, au brief minimal** : la question, la baseline, l'honnêteté, rien d'autre | concepteur (Opus) |

Chaque série fait **4 concepts**, tous différents et pas déclinés les uns des autres : **1 froide** (affine la baseline), **1 tiède** (suit
l'approche), **2 chaudes** (forme libre). Le lot fait 12 concepts (D204).

N'écris que dans ton dossier `v0/<série>*/`. Aucun serveur dans `C:/Users/mrspa/Documents/Brasserie`. N'écris aucun code par heredoc ni par
`node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
